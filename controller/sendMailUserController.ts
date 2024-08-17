import { messaging } from "firebase-admin";
import { SEND_MAIL_USER } from "../models/sendMailUserModel";
import { USER } from "../models/userModel";
import { Request , Response , NextFunction } from "express";
import { PROFILE } from "../models/profileModel";
import mongoose from "mongoose";

export const create = async (req:Request , res:Response , next:NextFunction) => {
    try {
        
        const { userId , time , isActive } = req.body;

        if(!userId) throw new Error('userId is required');
        if(!time) throw new Error('time is required');
        if(typeof isActive !== 'boolean') throw new Error('time is required');

        const checkUser = await PROFILE.findOne({ userId , familyId : req.familyId });
        if(!checkUser) throw new Error('This user not connected with family.');

        let sendMailUser : any = await SEND_MAIL_USER.findOne({ userId , familyId : req.familyId });

        if(sendMailUser && isActive === true){

            // update
            sendMailUser.userId = userId;
            sendMailUser.time = time;
            await sendMailUser.save()

        } else if(sendMailUser && isActive === false){

            //delete
            await sendMailUser.deleteOne();

        } else if(!sendMailUser && isActive === true){ 

            // create
            sendMailUser = await SEND_MAIL_USER.create({
                userId,
                time,
                familyId : req.familyId,
                isActive
            });

        } else {
            throw new Error('please provide valid credentials')
        }

        res.status(201).json({
            status : 201,
            message : 'Data updated successfully.',
            data : sendMailUser
        })

    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const get = async (req: Request, res: Response, next:NextFunction) => {
    try {
        
        const response = await PROFILE.aggregate([
            {
                $match: {
                    familyId: req.familyId,
                    isDeleted: false,
                    userId : new mongoose.Types.ObjectId(req.userId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            // {
            //     $match: {
            //         'user.role': { $ne: 'grandParent' }
            //     }
            // },
            {
                $lookup: {
                    from: 'sendmailusers',
                    localField: 'familyId',
                    foreignField: 'familyId',
                    as: 'sentMailUser'
                }
            },
            {
                $addFields: {
                    sentMailUser: {
                        $filter: {
                            input: '$sentMailUser',
                            as: 'mailUser',
                            cond: {
                                $eq: ['$$mailUser.userId', '$user._id'] // Adjust condition as needed
                            }
                        },
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    image: 1,
                    familyId: 1,
                    userId: {
                        _id: '$user._id',
                        email: '$user.email',
                        role: '$user.role',
                        isDeleted: '$user.isDeleted',
                        deletedBy: '$user.deletedBy',
                        createdAt: '$user.createdAt',
                        updatedAt: '$user.updatedAt'
                    },
                    createdBy: 1,
                    isDeleted: 1,
                    deletedBy: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    sentMailUser: 1 
                }
            },
        ]);
        
        res.status(200).json({
            status : 200,
            message : 'Data retrieved successfully.',
            data : response
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
        
        const { userId , time , isActive , id } = req.body;
        switch (true) {
            case !id: throw new Error('id is required');
            case !userId: throw new Error('userId is required.');
            case !time: throw new Error('time is required.');
            case !isActive: throw new Error('isActive is required.');
            default:
                break;
        }

        const findData = await SEND_MAIL_USER.findOne({ _id : id });
        if(!findData) throw new Error('this id does not exist.');

        const checkUser = await PROFILE.findOne({ userId , familyId : req.familyId });
        if(!checkUser) throw new Error('this user not match with familyId.');

        const data = await SEND_MAIL_USER.findByIdAndUpdate(id,{
            userId,
            time,
            isActive
        },{new : true})

        res.status(202).json({
            status : 202,
            message : 'data updated successfully.',
            data
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};