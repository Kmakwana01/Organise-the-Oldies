import { CHAT } from "../models/chatModel";
import { CONVERSATION } from "../models/conversationModel";
import { CONVERSATION_USER } from "../models/conversationUserModel";
import { ATTACHMENT } from "../models/attachmentModel";
import { Request , Response , NextFunction } from "express";
var main_socket = require("../socket");
import { notificationFunction, notification } from '../util/pushNotification';
import { PROFILE } from "../models/profileModel";
import fs from 'fs';
import path from 'path';
import { errorMail , extractLineNumber } from "../util/email";

// socket functions
export const chatCreate = async (data:any, io:any, socket:any) => {
    try {

        const { familyId , postBy, text } = data;
        
        let conversationCheck = await CONVERSATION.findOne({ familyId : familyId });
        let conversation;
        if(!conversationCheck) {
            conversation = await CONVERSATION.create({
                familyId : familyId,
                type : 'GroupChat'
            })
        } else {
            conversation = conversationCheck;
        }

        let conversationUserCheck = await CONVERSATION_USER.findOne({ conversationId : conversation._id , userId : postBy });
        let conversationUser;
        if(!conversationUserCheck) {
            conversationUser = await CONVERSATION_USER.create({
                conversationId : conversation._id,
                userId : postBy
            })
        } else {
            conversationUser = conversationUserCheck;
        }

        let chatData:any = await CHAT.create({
            text,
            attachmentId : null,
            postBy,
            isDeleted : false,
            deletedBy : null,
            familyId,
            conversationId : conversation._id
        });

        let profileData = await PROFILE.findOne({ userId : postBy }).populate({
            path : 'userId',
            select: ['-password', '-socialMediaType']
        });

        chatData._doc.profile = profileData;

        let response = {
            key : 'chat',
            chat : chatData
        }
        
        io.to(familyId).emit('chat', response);
        
        let res:any = {}

        let notificationResponse:any = {
            familyId : familyId,
            userId : postBy
        }

        let findCurrentUser = await PROFILE.findOne({ userId : postBy })

        let object : any = {
            data : {},
            title : chatData?.text,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} sent a new message.`
        }
        notificationFunction(notificationResponse , res , 'Message' , object)
        
    } catch (error:any) {
        console.log("Error processing message:", error);
    }
}

// const conversation = await CONVERSATION.findOneAndUpdate(
//     { familyId: req.familyId },
//     { $setOnInsert: { familyId: req.familyId, type: 'GroupChat' } },
//     { new: true, upsert: true }
// );

// const conversationUser = await CONVERSATION_USER.findOneAndUpdate(
//     { conversationId: conversation._id, userId: postBy },
//     { $setOnInsert: { conversationId: conversation._id, userId: postBy } },
//     { new: true, upsert: true }
// );

export const chatUpdate = async (data:any, io:any , socket:any) => {
    try {

        const { id , text } = data;
        
        let chatUpdate:any = await CHAT.findByIdAndUpdate(id,{
            text,
        },{new : true});

        let conversationCheck = await CONVERSATION.findOne({ _id : chatUpdate?.conversationId });

        let chatFind:any = await CHAT.findOne({ _id : id});

        let chatResponse;
        if(chatFind.attachmentId != null) {
            chatResponse = await chatFind.populate('attachmentId')
        } else {
            chatResponse = chatFind
        }

        let profileData = await PROFILE.findOne({ userId : chatFind?.postBy }).populate({
            path : 'userId',
            select: ['-password', '-socialMediaType']
        });

        chatResponse._doc.profile = profileData;

        let response = {
            key :'updateChat',
            chat : chatResponse
        }

        io.to(conversationCheck?.familyId).emit('chat', response);

        let res:any = {}
        let notificationResponse:any = {
            familyId : conversationCheck?.familyId,
            userId : chatFind?.postBy
        }

        let findCurrentUser = await PROFILE.findOne({ userId : chatFind?.postBy })

        let object : any = {
            data : {},
            title : chatUpdate?.text,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} updated message.`
        }

        notificationFunction(notificationResponse , res , 'Message' , object)
        
    } catch (error:any) {
        console.log("Error processing message:", error);
    }
};

export const chatDelete = async (data:any, io:any , socket:any) => {
    try {

        const { id , userId } = data;
        
        let chatFind = await CHAT.findOne({ _id : id });
        if(chatFind?.attachmentId) {
            await ATTACHMENT.findByIdAndUpdate(chatFind.attachmentId,{
                isInTrash : true
            },{new : true})
        }

        let chat:any = await CHAT.findByIdAndUpdate(id,{
            isDeleted : true,
            deletedBy : userId
        },{new : true});

        let conversation = await CONVERSATION.findOne({ _id : chat?.conversationId });

        let chatData = await CHAT.findOne({ _id : chat._id }).populate('attachmentId')

        let response = {
            key :'deleteChat',
            chat : chatData
        }

        io.to(conversation?.familyId).emit('chat', response);
        
    } catch (error:any) {
        console.log("Error processing message:", error);
    }
};

// api chat
export const chatGet = async (req:Request , res:Response , socket:any) => {
    try {
        
        let conversation = await CONVERSATION.findOne({ familyId : req.familyId });
        let chat = await CHAT.aggregate([
            {
                $match : { conversationId : conversation?._id , isDeleted : false },
            },
            {
                $sort : { 'createdAt' : -1 }
            },
            {
                $lookup : {
                    from : 'attachments',
                    localField : 'attachmentId',
                    foreignField : '_id',
                    as : 'attachment',
                    pipeline: [
                        { $match: { isInTrash : false } }
                    ]
                }
            },
            {
                $unwind: {
                    path: '$attachment',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    attachmentId: {
                        $cond: {
                            if: { $eq: ["$attachmentId", null] },
                            then: null,
                            else: "$attachment"
                        }
                    }
                }
            },
            {
                $unset: "attachment"
            },
            {
                $lookup : {
                    from : 'profiles',
                    localField : 'postBy',
                    foreignField : 'userId',
                    as : 'profile'
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
                    localField : 'postBy',
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
        ])

        res.status(200).json({
            status : 200,
            message : 'Chat data retrieved successfully.',
            data : chat
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const attachment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        if(!req.file) throw new Error('File is required.')

        const { text } = req.body;
        
        let conversationCheck = await CONVERSATION.findOne({ familyId : req.familyId });
        let conversation;
        if(!conversationCheck) {
            conversation = await CONVERSATION.create({
                familyId : req.familyId,
                type : 'GroupChat'
            })
        } else {
            conversation = conversationCheck;
        }

        let conversationUserCheck = await CONVERSATION_USER.findOne({ conversationId : conversation._id , userId : req.userId });
        let conversationUser;
        if(!conversationUserCheck) {
            conversationUser = await CONVERSATION_USER.create({
                conversationId : conversation._id,
                userId : req.userId
            })
        } else {
            conversationUser = conversationUserCheck;
        }


        let attachment = await ATTACHMENT.create({
            path : req.file?.filename,
            mimeType : req.file?.mimetype,
            fileSize : req.file?.size !== undefined ? formatFileSize(req.file?.size) : '0 bytes',
            isInTrash : false
        })

        let chat:any = await CHAT.create({
            text : !text ? null : text,
            attachmentId : attachment._id,
            postBy : req.userId,
            isDeleted : false,
            deletedBy : null,
            familyId : req.familyId,
            conversationId : conversation._id
        });

        let chatResponse:any;
        if(chat.attachmentId != null) {
            chatResponse = await chat.populate('attachmentId')
        } else {
            chatResponse = chat
        }

        let profileData = await PROFILE.findOne({ userId : req.userId }).populate({
            path : 'userId',
            select: ['-password', '-socialMediaType']
        });

        chatResponse._doc.profile = profileData;

        let response = {
            key : 'chat',
            chat : chatResponse,
        };

        main_socket.broadcastChatAttachment(response , req.familyId);

        let findCurrentUser = await PROFILE.findOne({ userId : req?.userId })

        let object : any = {
            data : {},
            title : 'New File Uploaded',
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} uploaded new file.`
        }

        notificationFunction(req , res , 'Message' , object )

        res.status(201).json({
            status : 201,
            message : 'Chat attachment created successfully.',
            data : response
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

function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

export const deleteChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const conversation = await CONVERSATION.findOne({ familyId : req.familyId });
        const chat = await CHAT.find({ conversationId : conversation?._id });
        for (const data of chat) {
            if(data.attachmentId) {
                if(data.attachmentId !== null) {
                    const attachmentFind:any = await ATTACHMENT.findOne({ _id : data.attachmentId });

                    const imagePath = path.join( 'public', 'images', path.basename(attachmentFind?.path));
                    let findAttachments = imagePath ? imagePath : path.join( 'public', 'audio', path.basename(attachmentFind?.path));
                    if(findAttachments) {
                        fs.unlink(findAttachments, (err:any) => {
                            if (err) {
                                console.log('Error deleting image:', err);
                            } else {
                                console.log('Image deleted successfully');
                            }
                        });
                    }
                    await ATTACHMENT.deleteOne({ _id : data.attachmentId })
                }
            }
            await CHAT.deleteOne({ _id : data._id });
        }

        res.status(202).json({
            status : 202,
            message : 'Chat deleted successfully.'
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};