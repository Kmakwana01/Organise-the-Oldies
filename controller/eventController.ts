import { EVENT } from "../models/eventModel";
import { EVENT_USER } from "../models/eventUser";
import { ADVANCE_WARNING } from "../models/advanceWarningModel";
import { PROFILE } from "../models/profileModel";
import { Request , Response , NextFunction } from "express";
const main_socket = require("../socket");
import { notificationFunction } from "../util/pushNotification";
import { errorMail , extractLineNumber } from "../util/email";

export const create = async ( req : Request, res : Response , next : NextFunction ) => {
    try {

        const { name , dateAndTime , user , advancewarning , notificationSound} = req.body;
        switch (true) {
            case !name: throw new Error('name is required.');
            case !dateAndTime: throw new Error('dateAndTime is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            default:
                break;
        }

        for (const check of user) {
            let userCheck = await PROFILE.findOne({ userId : check , isDeleted : false });
            if(req.familyId !== userCheck?.familyId) throw new Error(`Login user familyId and ${check} user familyId does not match.`);
        }

        const event = await EVENT.create({
            name,
            dateAndTime,
            notificationSound,
            familyId : req.familyId,
            createdBy : req.userId,
            isDeleted : false,
            deletedBy : null,
        });

        let eventUsers = [];
        if(user) {
            for(const users of user) {
                let eventUserData = await EVENT_USER.create({
                    eventId : event._id,
                    userId : users,
                    createdBy : req.userId,
                    isDeleted : false,
                    deletedBy : null,
                });
                eventUsers.push(eventUserData);
            }
        }

        let advanceWarnings = [];
        if(advancewarning) {
            for (const advance of advancewarning) {
                let advanceData = await ADVANCE_WARNING.create({
                    reminderId : null,
                    eventId : event._id,
                    when : advance,
                    isDeleted : false,
                    deletedBy : null,
                })
                advanceWarnings.push(advanceData);
            }
        }

        const newResponse = await EVENT.aggregate([
            {
                $match : { _id : event._id , isDeleted : false }
            },
            {
                $lookup : {
                    from : 'eventusers',
                    localField : '_id',
                    foreignField : 'eventId',
                    as : 'eventuser',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                        {
                            $lookup: {
                                from: 'profiles',
                                localField: 'userId',
                                foreignField: 'userId',
                                as: 'profile'
                            }
                        },
                        {
                            $match: {
                                'profile.userId': { $exists: true, $ne: [] }
                            }
                        },
                        {
                            $unwind: '$profile'
                        },
                        {
                            $lookup : {
                                from : 'users',
                                localField : 'userId',
                                foreignField : '_id',
                                as : 'user'
                            }
                        },
                        {
                            $unwind : '$user'
                        },
                        {
                            $addFields : { 
                                'profile.userId' : '$user'
                            }
                        },
                        {
                            $project: {
                                'profile.userId.password': 0,
                                user: 0
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : 'advancewarnings',
                    localField : '_id',
                    foreignField : 'eventId',
                    as : 'advancewarning',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                    ]
                }
            }
        ])
        const result = newResponse.length > 0 ? newResponse[0] : null;

        let response = {
            key : 'eventCreate',
            event : result
        }

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })

        let object = {
            data : result,
            title : result?.name,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} created new Event.`
        }


        notificationFunction(req, res, 'Event' , object )
        main_socket.broadcastEvent(response ,req.familyId )

        res.status(201).json({
            status : 201,
            message : 'Event created successfully.',
            data : result
        })
    } catch (error:any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
}

export const get = async (req: Request , res : Response , next : NextFunction) => {
    try {

        const response = await EVENT.aggregate([
            {
                $match : { familyId : req.familyId , isDeleted : false }
            },
            {
                $lookup : {
                    from : 'eventusers',
                    localField : '_id',
                    foreignField : 'eventId',
                    as : 'eventuser',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                        {
                            $lookup: {
                                from: 'profiles',
                                localField: 'userId',
                                foreignField: 'userId',
                                as: 'profile'
                            }
                        },
                        {
                            $match: {
                                'profile.userId': { $exists: true, $ne: [] }
                            }
                        },
                        {
                            $unwind: '$profile'
                        },
                        {
                            $lookup : {
                                from : 'users',
                                localField : 'userId',
                                foreignField : '_id',
                                as : 'user'
                            }
                        },
                        {
                            $unwind : '$user'
                        },
                        {
                            $addFields : { 
                                'profile.userId' : '$user'
                            }
                        },
                        {
                            $project: {
                                'profile.userId.password': 0,
                                user: 0
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : 'advancewarnings',
                    localField : '_id',
                    foreignField : 'eventId',
                    as : 'advancewarning',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                    ]
                }
            }
        ])

        res.status(200).json({
            status : 200,
            message : 'Event retrieved successfully.',
            data : response
        })
    } catch (error:any) {
        res.status(200).json({
            status : 'Fail',
            message : error.message
        })
    }
}

export const update = async (req: Request, res: Response , next: NextFunction) => {
    try {

        const { id , name , dateAndTime , user , advancewarning , notificationSound } = req.body;
        switch (true) {
            case !id: throw new Error('id is required.');
            case !name: throw new Error('name is required.');
            case !dateAndTime: throw new Error('dateAndTime is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            default:
                break;
        }

        let eventFind = await EVENT.findOne({ _id : id , isDeleted : false });
        if(!eventFind) throw new Error('event id does not exist.');

        if ((eventFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this Event.');
        }

        if (req.role == 'grandParent') {
            if (eventFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to update this Event.')
            }
        }

        if(user) {
            for (const check of user) {
                let userCheck = await PROFILE.findOne({ userId : check , isDeleted : false });
                if(req.familyId !== userCheck?.familyId) throw new Error(`Login user familyId and ${check} user familyId does not match.`);
            }
        }

        const event = await EVENT.findByIdAndUpdate(eventFind._id,{
            name,
            dateAndTime,
            notificationSound
        },{new : true});

        await EVENT_USER.deleteMany({ eventId : eventFind._id });

        let eventUsers = [];
        if(user) {
            for(const users of user) {
                let eventUserData = await EVENT_USER.create({
                    eventId : eventFind._id,
                    userId : users,
                    createdBy : req.userId,
                    isDeleted : false,
                    deletedBy : null,
                });
                eventUsers.push(eventUserData);
            }
        }

        let advanceWarnings = [];
        if(advancewarning) {

            await ADVANCE_WARNING.updateMany({ eventId : eventFind._id } , { isDeleted : true , deletedBy : req.userId })

            for (const advance of advancewarning) {
                let advanceData = await ADVANCE_WARNING.create({
                    reminderId : null,
                    eventId : eventFind._id,
                    when : advance,
                    isDeleted : false,
                    deletedBy : null,
                })
                advanceWarnings.push(advanceData);
            }
        }

        let eventFindData:any = await EVENT.findOne({ _id : event?._id , isDeleted : false });

        const newResponse = await EVENT.aggregate([
            {
                $match : { _id : eventFindData._id , isDeleted : false }
            },
            {
                $lookup : {
                    from : 'eventusers',
                    localField : '_id',
                    foreignField : 'eventId',
                    as : 'eventuser',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                        {
                            $lookup: {
                                from: 'profiles',
                                localField: 'userId',
                                foreignField: 'userId',
                                as: 'profile'
                            }
                        },
                        {
                            $match: {
                                'profile.userId': { $exists: true, $ne: [] }
                            }
                        },
                        {
                            $unwind: '$profile'
                        },
                        {
                            $lookup : {
                                from : 'users',
                                localField : 'userId',
                                foreignField : '_id',
                                as : 'user'
                            }
                        },
                        {
                            $unwind : '$user'
                        },
                        {
                            $addFields : { 
                                'profile.userId' : '$user'
                            }
                        },
                        {
                            $project: {
                                'profile.userId.password': 0,
                                user: 0
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : 'advancewarnings',
                    localField : '_id',
                    foreignField : 'eventId',
                    as : 'advancewarning',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                    ]
                }
            }
        ])
        
        const result = newResponse.length > 0 ? newResponse[0] : null;

        let response = {
            key : 'eventUpdate',
            event : result
        }

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })

        let object = {
            data : result,
            title : result?.name,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} updated Event.`
        }

        notificationFunction(req, res, 'Event' , object)
        main_socket.broadcastEvent(response ,req.familyId )

        res.status(202).json({
            status : 202,
            message : 'Event updated successfully.',
            data : result
        })


    } catch (error:any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const deleteData = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { id } = req.query;
        if(!id) throw new Error('id required.');

        let eventFind = await EVENT.findOne({ _id : id , isDeleted : false });
        if(!eventFind) throw new Error('event not found.');

        if ((eventFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this event.');
        }

        if (req.role == 'grandParent') {
            if (eventFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to delete this event.')
            }
        }

        await ADVANCE_WARNING.updateMany({ eventId : id },{ isDeleted : true , deletedBy : req.userId });
        await EVENT_USER.updateMany({ eventId : id }, { isDeleted : true , deletedBy : req.userId });

        await EVENT.updateOne({ _id : id }, { isDeleted : true , deletedBy : req.userId });

        let response = {
            key : 'eventDelete',
            event : eventFind,
        }

        main_socket.broadcastEvent(response ,req.familyId )

        let findCurrentUser = await PROFILE.findOne({ userId: req.userId })

        let object = {
            data: eventFind,
            title: eventFind?.name,
            body: `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} delete Event.`
        }

        notificationFunction(req, res, 'Delete', object)

        res.status(202).json({
            status : 202,
            message : 'Event deleted successfully.'
        })
    } catch (error:any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status : 'Fail',
            message : error.message
        });
    }
};