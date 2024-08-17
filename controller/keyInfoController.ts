import { KEY_INFO } from "../models/keyInfoModel";
import { KEY_INFO_USER } from "../models/keyInfoUserModel";
import { Request , Response , NextFunction } from "express";
import { USER } from "../models/userModel";
import { PROFILE } from "../models/profileModel";
const main_socket = require("../socket");
import { notificationFunction } from "../util/pushNotification";
import { errorMail , extractLineNumber } from "../util/email";

export const create = async (req: Request , res: Response , next: NextFunction) => {
    try {

        const { keyInfo , user } = req.body;
        if(!keyInfo) throw new Error('keyInfo is required.');

        for(const check of user) {
            const checkUser = await PROFILE.findOne({ familyId : req.familyId , userId : check , isDeleted : false});
            if(!checkUser) throw new Error('This user not your match with familyId.')
        }

        const keyInfoData = await KEY_INFO.create({
            keyInfo : keyInfo,
            createdBy : req.userId,
            isDeleted : false,
            deletedBy : null,
            familyId : req.familyId
        });

        let keyInfoUser = [];
        if(user) {
            for(const data of user) {
                const createData = await KEY_INFO_USER.create({
                    keyInfoId : keyInfoData._id,
                    userId : data,
                    createdBy : req.userId,
                    isDeleted : false,
                    deletedBy : null,
                });
                keyInfoUser.push(createData);
            }
        }

        const data = await KEY_INFO.aggregate([
            {
                $match : { _id : keyInfoData._id , isDeleted : false },
            },
            {
                $lookup : {
                    from: 'keyinfousers',
                    localField: '_id',
                    foreignField: 'keyInfoId',
                    as: 'keyusers',
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
            }
        ])

        const result = data.length > 0 ? data[0] : null;

        let response = {
            key : 'keyInfoCreate',
            keyInfo : result
        }
        const familyId = req.familyId
        main_socket.broadcastKeyInfo(response ,familyId )

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })

        let object = {
            data : result,
            title : result?.keyInfo,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} created new KeyInfo.`
        }

        notificationFunction(req, res, 'KeyInfo' , object )

        res.status(201).json({
            status : 201,
            message : 'Key info created successfully.',
            data : result
        })
    } catch (error: any) {
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

        const data = await KEY_INFO.aggregate([
            {
                $match : { familyId : req.familyId , isDeleted : false },
            },
            {
                $lookup : {
                    from: 'keyinfousers',
                    localField: '_id',
                    foreignField: 'keyInfoId',
                    as: 'keyusers',
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
            }
        ])

        res.status(200).json({
            status : 200,
            message : 'KeyInfo data retrieved successfully.',
            data
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { id , keyInfo , user } = req.body;
        if(!id) throw new Error('id is required.');
        if(!keyInfo) throw new Error('keyInfo is required.');

        const keyInfoFind = await KEY_INFO.findOne({ _id : id , isDeleted : false });
        if(!keyInfoFind) throw new Error('This keyInfo id does not exist.');

        if ((keyInfoFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this keyInfo.');
        }

        if (req.role == 'grandParent') {
            if (keyInfoFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to update this keyInfo.')
            }
        }

        const keyInfoData = await KEY_INFO.findByIdAndUpdate(id,{
            keyInfo : keyInfo,
        },{new : true});

        await KEY_INFO_USER.deleteMany({ keyInfoId : keyInfoFind._id });

        let keyInfoUser = [];
        if(user) {
            for(const check of user) {
                const checkUser = await PROFILE.findOne({ familyId : req.familyId , userId : check , isDeleted : false });
                if(!checkUser) throw new Error('This user not your match with familyId.')
            }


            for(const data of user) {
                const createData = await KEY_INFO_USER.create({
                    keyInfoId : keyInfoFind._id,
                    userId : data,
                    createdBy : req.userId,
                    isDeleted : false,
                    deletedBy : null,
                });
                keyInfoUser.push(createData);
            }
        }

        let keyInfoFindNewData:any = await KEY_INFO.findOne({ _id : keyInfoData?._id , isDeleted : false });

        const data = await KEY_INFO.aggregate([
            {
                $match : { _id : keyInfoFindNewData?._id , isDeleted : false },
            },
            {
                $lookup : {
                    from: 'keyinfousers',
                    localField: '_id',
                    foreignField: 'keyInfoId',
                    as: 'keyusers',
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
            }
        ])
        const result = data.length > 0 ? data[0] : null;

        let response = {
            key : 'keyInfoUpdate',
            keyInfo : result
        }
        
        const familyId = req.familyId
        main_socket.broadcastKeyInfo(response ,familyId )

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })

        let object = {
            data : result,
            title : result?.keyInfo,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} updated KeyInfo.`
        }
        
        notificationFunction(req, res, 'KeyInfo' , object)

        res.status(202).json({
            status : 202,
            message : 'KeyInfo updated successfully.',
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
        if(!id) throw new Error('keyInfo id required.');

        const keyInfoFind = await KEY_INFO.findOne({ _id : id , isDeleted : false });
        if(!keyInfoFind) throw new Error('keyInfo id does not exist.');


        if ((keyInfoFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this keyInfo.');
        }

        if (req.role == 'grandParent') {
            if (keyInfoFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to delete this keyInfo.')
            }
        }

        await KEY_INFO_USER.updateMany({ keyInfoId : id }, { isDeleted : true , deletedBy : req.userId });
        await KEY_INFO.findByIdAndUpdate(keyInfoFind._id,{
            isDeleted : true,
            deletedBy : req.userId
        },{new : true})

        let response = {
            key : 'keyInfoDelete',
            keyInfo : keyInfoFind
        }
        const familyId = req.familyId
        main_socket.broadcastKeyInfo(response ,familyId )

        let findCurrentUser = await PROFILE.findOne({ userId: req.userId })

        let object = {
            data: keyInfoFind,
            title: keyInfoFind?.keyInfo,
            body: `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} delete keyInfo.`
        }

        notificationFunction(req, res, 'Delete', object)

        res.status(202).json({
            status : 202,
            message : 'KeyInfo data deleted successfully.',
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