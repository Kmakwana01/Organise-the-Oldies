import { NOTIFICATION } from "../models/notificationModel";
import { Request , Response , NextFunction } from "express";
import { errorMail , extractLineNumber } from '../util/email';

export const create = async (req: Request , res: Response , next: NextFunction ) => {
    try {
        const audio = req.file?.filename;
        if(!audio) throw new Error('Audio file not found.');

        const data = await NOTIFICATION.create({
            audio,
            createdBy : req.userId,
            isDeleted : false,
            deletedBy : null,
        })

        res.status(201).json({
            status : 201,
            message : 'Notification sound created successfully.',
            data
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

export const get = async (req: Request, res: Response , next: NextFunction ) => {
    try {

        const response = await NOTIFICATION.find({ isDeleted : false })

        res.status(200).json({
            status : 200,
            message : 'Notification data retrieved successfully.',
            data : response
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const deleteData = async (req: Request, res: Response , next: NextFunction ) => {
    try {
        
        const { id } = req.query;
        if(!id) throw new Error('id is required.');

        const data = await NOTIFICATION.findByIdAndUpdate(id,{
            isDeleted : true,
            deletedBy : req.userId
        },{new : true});
        if(!data) throw new Error('Notification not found.')

        res.status(202).json({
            status : 202,
            message : 'Notification deleted successfully.',
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