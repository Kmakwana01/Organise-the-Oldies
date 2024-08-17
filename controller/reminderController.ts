import { Request , Response , NextFunction } from "express";
import { REMINDER } from "../models/reminderModel";
import { REMINDER_USER } from "../models/reminderUserModel";
import { NOTIFICATION } from "../models/notificationModel";
import { PROFILE } from "../models/profileModel";
import { ADVANCE_WARNING } from "../models/advanceWarningModel";
const main_socket = require("../socket");
import { notificationFunction } from "../util/pushNotification";
import { errorMail , extractLineNumber } from "../util/email";

export const create = async (req : Request, res : Response , next : NextFunction) => {
    try {

        let { title , notes , notificationSound , repeat , date , advancewarning, user ,weekDays } = req.body;
        let voice;
        if(req.file) {
            voice = req.file?.filename
        } else {
            voice = null;
        }

        switch (true) {
            case !title: throw new Error('title is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            case !repeat: throw new Error('repeat is required.');
            case !date: throw new Error('date is required.');
            // case !advancewarning: throw new Error('advancewarning is required.');
            default:
                break;
        }

        if(typeof weekDays === 'string') {
            weekDays = JSON.parse(weekDays);
        }

        if(repeat === 'weekly'){
            if(!weekDays?.length) throw new Error('weekdays is required.');
            let weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (const iterator of weekDays) {
                if(!weekEnum.includes(iterator)){
                    throw new Error('please provide valid weekDays.')
                }
            }
        }

        // const notificationCheck = await NOTIFICATION.findOne({ _id : notificationSound , isDeleted : false });
        // if(!notificationCheck) throw new Error('Notification not found.');

        if(advancewarning) {
            if(typeof advancewarning === 'string') {
                advancewarning = JSON.parse(advancewarning);
            }
        }

        if(typeof user === 'string') {
            user = JSON.parse(user);
        }
        for (const check of user) {
            let userCheck = await PROFILE.findOne({ userId : check , isDeleted : false });
            if(req.familyId !== userCheck?.familyId) throw new Error(`Login user familyId and ${check} user familyId does not match.`);
        }

        const reminder = await REMINDER.create({
            title,
            notes,
            voice,
            notificationSound,
            repeat,
            date,
            weekDays : weekDays?.length > 0 ? weekDays : [],
            familyId : req.familyId,
            createdBy : req.userId,
            isDeleted : false,
            deletedBy : null,
        });

        let reminderUser = [];
        if(user) {
            for (const userId of user) {
                const reminderusers = await REMINDER_USER.create({
                    reminderId : reminder._id,
                    userId,
                    createdBy : req.userId,
                    isDeleted : false,
                    deletedBy : null
                });
                reminderUser.push(reminderusers);
            }
        }

        let advanceWarning = [];
        if(advancewarning) {
            for (const advance of advancewarning) {
                let data = await ADVANCE_WARNING.create({
                    reminderId : reminder._id,
                    eventId : null,
                    when : advance,
                    isDeleted : false,
                    deletedBy : null
                })
                advanceWarning.push(data);
            }
        }

        const newResponse = await REMINDER.aggregate([
            {
                $match : { _id : reminder._id , isDeleted : false }
            },
            // {
            //     $lookup : {
            //         from: 'notifications',
            //         localField: 'notificationSound',
            //         foreignField: '_id',
            //         as: 'notification',
            //     }
            // },
            // {
            //     $addFields: {
            //         notificationSound: {
            //             $cond: {
            //                 if: { $gt: [{ $size: "$notification" }, 0] },
            //                 then: { $arrayElemAt: ['$notification', 0] },
            //                 else: null
            //             }
            //         }
            //     }
            // },
            // {
            //     $unset: 'notification'
            // },
            {
                $lookup : {
                    from : 'reminderusers',
                    localField : '_id',
                    foreignField : 'reminderId',
                    as : 'reminderuser',
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
                    foreignField : 'reminderId',
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
            key : 'reminderCreate',
            reminder: result
        }

        main_socket.broadcastReminder(response , req.familyId);

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })

        let object = {
            data : result,
            title : result?.title,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} created new Reminder.`
        }

        notificationFunction(req , res , 'Reminder' , object)

        res.status(201).json({
            status : 201,
            message : 'Reminder has been created successfully.',
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

export const get = async (req: Request, res: Response , next: NextFunction) => {
    try {

        const newData = await REMINDER.find({
            familyId : req.familyId,
            isDeleted : false,
        });

        const reminderIds: any = newData.map(a => a._id);

        // const reminderIds :any = newData.filter(a => 
        //     (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
        // ).map(a => a._id)
        
        const response = await REMINDER.aggregate([
            {
                $match : { _id : { $in : reminderIds } }
            },
            // {
            //     $lookup : {
            //         from: 'notifications',
            //         localField: 'notificationSound',
            //         foreignField: '_id',
            //         as: 'notification',
            //     }
            // },
            // {
            //     $addFields: {
            //         notificationSound: {
            //             $cond: {
            //                 if: { $gt: [{ $size: "$notification" }, 0] },
            //                 then: { $arrayElemAt: ['$notification', 0] },
            //                 else: null
            //             }
            //         }
            //     }
            // },
            // {
            //     $unset: 'notification'
            // },
            {
                $lookup : {
                    from : 'reminderusers',
                    localField : '_id',
                    foreignField : 'reminderId',
                    as : 'reminderuser',
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
                    foreignField : 'reminderId',
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
            message : 'Reminder data retrieved successfully.',
            data : response
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const update = async (req: Request, res: Response , next: NextFunction) => {
    try {
        let { id , title , notes , notificationSound , repeat , date , advancewarning, user ,weekDays } = req.body;

        switch (true) {
            case !id: throw new Error('id is required.');
            case !title: throw new Error('title is required.');
            // case !notes: throw new Error('notes is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            case !repeat: throw new Error('repeat is required.');
            case !date: throw new Error('date is required.');
            default:
                break;
        }

        if(typeof weekDays === 'string') {
            weekDays = JSON.parse(weekDays);
        }

        if(repeat === 'weekly'){
            if(!weekDays?.length) throw new Error('weekdays is required.');
            let weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (const iterator of weekDays) {
                if(!weekEnum.includes(iterator)){
                    throw new Error('please provide valid weekDays.')
                }
            }
        }
        if(advancewarning) {
            if(typeof advancewarning === 'string') {
                advancewarning = JSON.parse(advancewarning);
            }
        }

        let reminderFind = await REMINDER.findOne({ _id : id , isDeleted : false });
        if(!reminderFind) throw new Error('Reminder not found.');

        if ((reminderFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this reminder.');
        }

        if (req.role == 'grandParent') {
            if (reminderFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to update this reminder.')
            }
        }

        // const notificationCheck = await NOTIFICATION.findOne({ _id : notificationSound , isDeleted : false });
        // if(!notificationCheck) throw new Error('Notification not found.');

        if(typeof user === 'string') {
            user = JSON.parse(user);
        }

        for (const check of user) {
            let userCheck = await PROFILE.findOne({ userId : check , isDeleted : false });
            if(req.familyId !== userCheck?.familyId) throw new Error(`Login user familyId and ${check} user familyId does not match.`);
        }

        let voice;
        if(req.file) {
            voice = req.file?.filename
        } else {
            voice = reminderFind.voice;
        }

        const reminder = await REMINDER.findByIdAndUpdate(id ,{
            title,
            notes,
            voice,
            notificationSound,
            repeat,
            weekDays : weekDays?.length > 0 ? weekDays : [],
            date
        },{new : true});

        await REMINDER_USER.deleteMany({ reminderId : reminderFind._id })

        let reminderUser = [];
        if(user) {
            for (const userId of user) {
                const reminderusers = await REMINDER_USER.create({
                    reminderId : reminderFind._id,
                    userId,
                    createdBy : req.userId,
                    isDeleted : false,
                    deletedBy : null
                });
                reminderUser.push(reminderusers);
            }
        }

        let advanceWarning = [];
        if(advancewarning) {
            await ADVANCE_WARNING.updateMany({ reminderId : reminderFind._id } , { isDeleted : true , deletedBy : req.userId })

            for (const advance of advancewarning) {

                let data = await ADVANCE_WARNING.create({
                    reminderId : reminderFind._id,
                    eventId : null,
                    when : advance,
                    isDeleted : false,
                    deletedBy : null
                })
                advanceWarning.push(data);
            }
        }

        let reminderFindData = await REMINDER.findOne({ _id : id , isDeleted : false });

        const newResponse = await REMINDER.aggregate([
            {
                $match : { _id : reminderFindData?._id , isDeleted : false }
            },
            // {
            //     $lookup : {
            //         from: 'notifications',
            //         localField: 'notificationSound',
            //         foreignField: '_id',
            //         as: 'notification',
            //     }
            // },
            // {
            //     $addFields: {
            //         notificationSound: {
            //             $cond: {
            //                 if: { $gt: [{ $size: "$notification" }, 0] },
            //                 then: { $arrayElemAt: ['$notification', 0] },
            //                 else: null
            //             }
            //         }
            //     }
            // },
            // {
            //     $unset: 'notification'
            // },
            {
                $lookup : {
                    from : 'reminderusers',
                    localField : '_id',
                    foreignField : 'reminderId',
                    as : 'reminderuser',
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
                    foreignField : 'reminderId',
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
            key : 'reminderUpdate',
            reminder: result
        }

        main_socket.broadcastReminder(response , req.familyId);

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })

        let object = {
            data : result,
            title : result?.title,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} updated Reminder.`
        }

        notificationFunction(req , res , 'Reminder' , object)

        res.status(202).json({
            status : 202,
            message : 'Reminder updated successfully.',
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

export const deleteData = async (req: Request, res: Response , next: NextFunction) => {
    try {
        
        const { id } = req.query;
        if(!id) throw new Error('reminder id is required.');

        let reminderFind = await REMINDER.findOne({ _id : id , isDeleted : false });
        if(!reminderFind) throw new Error('reminder id does not exist.');

        if((reminderFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this reminder.');
        }

        if (req.role == 'grandParent') {
            if (reminderFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to delete this reminder.')
            }
        }
        

        await REMINDER_USER.updateMany({ reminderId : id }, { isDeleted : true , deletedBy : req.userId });
        await ADVANCE_WARNING.updateMany({ reminderId : id }, { isDeleted : true , deletedBy : req.userId });

        await REMINDER.updateOne({_id : id},{
            isDeleted : true,
            deletedBy : req.userId
        })

        let response = {
            key : 'reminderDelete',
            reminder : reminderFind,
        }

        main_socket.broadcastReminder(response , req.familyId)

        let findCurrentUser = await PROFILE.findOne({ userId: req.userId })

        let object = {
            data: reminderFind,
            title: reminderFind?.title,
            body: `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} delete Reminder.`
        }

        notificationFunction(req, res, 'Delete', object)

        res.status(202).json({
            status : 202,
            message : 'Reminder deleted successfully.',
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