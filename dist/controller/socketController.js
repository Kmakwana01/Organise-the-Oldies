"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChat = exports.attachment = exports.chatGet = exports.chatDelete = exports.chatUpdate = exports.chatCreate = void 0;
const chatModel_1 = require("../models/chatModel");
const conversationModel_1 = require("../models/conversationModel");
const conversationUserModel_1 = require("../models/conversationUserModel");
const attachmentModel_1 = require("../models/attachmentModel");
var main_socket = require("../socket");
const pushNotification_1 = require("../util/pushNotification");
const profileModel_1 = require("../models/profileModel");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const email_1 = require("../util/email");
// socket functions
const chatCreate = (data, io, socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId, postBy, text } = data;
        let conversationCheck = yield conversationModel_1.CONVERSATION.findOne({ familyId: familyId });
        let conversation;
        if (!conversationCheck) {
            conversation = yield conversationModel_1.CONVERSATION.create({
                familyId: familyId,
                type: 'GroupChat'
            });
        }
        else {
            conversation = conversationCheck;
        }
        let conversationUserCheck = yield conversationUserModel_1.CONVERSATION_USER.findOne({ conversationId: conversation._id, userId: postBy });
        let conversationUser;
        if (!conversationUserCheck) {
            conversationUser = yield conversationUserModel_1.CONVERSATION_USER.create({
                conversationId: conversation._id,
                userId: postBy
            });
        }
        else {
            conversationUser = conversationUserCheck;
        }
        let chatData = yield chatModel_1.CHAT.create({
            text,
            attachmentId: null,
            postBy,
            isDeleted: false,
            deletedBy: null,
            familyId,
            conversationId: conversation._id
        });
        let profileData = yield profileModel_1.PROFILE.findOne({ userId: postBy }).populate({
            path: 'userId',
            select: ['-password', '-socialMediaType']
        });
        chatData._doc.profile = profileData;
        let response = {
            key: 'chat',
            chat: chatData
        };
        io.to(familyId).emit('chat', response);
        let res = {};
        let notificationResponse = {
            familyId: familyId,
            userId: postBy
        };
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: postBy });
        let object = {
            data: {},
            title: chatData === null || chatData === void 0 ? void 0 : chatData.text,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} sent a new message.`
        };
        (0, pushNotification_1.notificationFunction)(notificationResponse, res, 'Message', object);
    }
    catch (error) {
        console.log("Error processing message:", error);
    }
});
exports.chatCreate = chatCreate;
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
const chatUpdate = (data, io, socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, text } = data;
        let chatUpdate = yield chatModel_1.CHAT.findByIdAndUpdate(id, {
            text,
        }, { new: true });
        let conversationCheck = yield conversationModel_1.CONVERSATION.findOne({ _id: chatUpdate === null || chatUpdate === void 0 ? void 0 : chatUpdate.conversationId });
        let chatFind = yield chatModel_1.CHAT.findOne({ _id: id });
        let chatResponse;
        if (chatFind.attachmentId != null) {
            chatResponse = yield chatFind.populate('attachmentId');
        }
        else {
            chatResponse = chatFind;
        }
        let profileData = yield profileModel_1.PROFILE.findOne({ userId: chatFind === null || chatFind === void 0 ? void 0 : chatFind.postBy }).populate({
            path: 'userId',
            select: ['-password', '-socialMediaType']
        });
        chatResponse._doc.profile = profileData;
        let response = {
            key: 'updateChat',
            chat: chatResponse
        };
        io.to(conversationCheck === null || conversationCheck === void 0 ? void 0 : conversationCheck.familyId).emit('chat', response);
        let res = {};
        let notificationResponse = {
            familyId: conversationCheck === null || conversationCheck === void 0 ? void 0 : conversationCheck.familyId,
            userId: chatFind === null || chatFind === void 0 ? void 0 : chatFind.postBy
        };
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: chatFind === null || chatFind === void 0 ? void 0 : chatFind.postBy });
        let object = {
            data: {},
            title: chatUpdate === null || chatUpdate === void 0 ? void 0 : chatUpdate.text,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} updated message.`
        };
        (0, pushNotification_1.notificationFunction)(notificationResponse, res, 'Message', object);
    }
    catch (error) {
        console.log("Error processing message:", error);
    }
});
exports.chatUpdate = chatUpdate;
const chatDelete = (data, io, socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, userId } = data;
        let chatFind = yield chatModel_1.CHAT.findOne({ _id: id });
        if (chatFind === null || chatFind === void 0 ? void 0 : chatFind.attachmentId) {
            yield attachmentModel_1.ATTACHMENT.findByIdAndUpdate(chatFind.attachmentId, {
                isInTrash: true
            }, { new: true });
        }
        let chat = yield chatModel_1.CHAT.findByIdAndUpdate(id, {
            isDeleted: true,
            deletedBy: userId
        }, { new: true });
        let conversation = yield conversationModel_1.CONVERSATION.findOne({ _id: chat === null || chat === void 0 ? void 0 : chat.conversationId });
        let chatData = yield chatModel_1.CHAT.findOne({ _id: chat._id }).populate('attachmentId');
        let response = {
            key: 'deleteChat',
            chat: chatData
        };
        io.to(conversation === null || conversation === void 0 ? void 0 : conversation.familyId).emit('chat', response);
    }
    catch (error) {
        console.log("Error processing message:", error);
    }
});
exports.chatDelete = chatDelete;
// api chat
const chatGet = (req, res, socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let conversation = yield conversationModel_1.CONVERSATION.findOne({ familyId: req.familyId });
        let chat = yield chatModel_1.CHAT.aggregate([
            {
                $match: { conversationId: conversation === null || conversation === void 0 ? void 0 : conversation._id, isDeleted: false },
            },
            {
                $sort: { 'createdAt': -1 }
            },
            {
                $lookup: {
                    from: 'attachments',
                    localField: 'attachmentId',
                    foreignField: '_id',
                    as: 'attachment',
                    pipeline: [
                        { $match: { isInTrash: false } }
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
                $lookup: {
                    from: 'profiles',
                    localField: 'postBy',
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
                $lookup: {
                    from: 'users',
                    localField: 'postBy',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $addFields: {
                    'profile.userId': '$user'
                }
            },
            {
                $project: {
                    'profile.userId.password': 0,
                    user: 0
                }
            }
        ]);
        res.status(200).json({
            status: 200,
            message: 'Chat data retrieved successfully.',
            data: chat
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.chatGet = chatGet;
const attachment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.file)
            throw new Error('File is required.');
        const { text } = req.body;
        let conversationCheck = yield conversationModel_1.CONVERSATION.findOne({ familyId: req.familyId });
        let conversation;
        if (!conversationCheck) {
            conversation = yield conversationModel_1.CONVERSATION.create({
                familyId: req.familyId,
                type: 'GroupChat'
            });
        }
        else {
            conversation = conversationCheck;
        }
        let conversationUserCheck = yield conversationUserModel_1.CONVERSATION_USER.findOne({ conversationId: conversation._id, userId: req.userId });
        let conversationUser;
        if (!conversationUserCheck) {
            conversationUser = yield conversationUserModel_1.CONVERSATION_USER.create({
                conversationId: conversation._id,
                userId: req.userId
            });
        }
        else {
            conversationUser = conversationUserCheck;
        }
        let attachment = yield attachmentModel_1.ATTACHMENT.create({
            path: (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename,
            mimeType: (_b = req.file) === null || _b === void 0 ? void 0 : _b.mimetype,
            fileSize: ((_c = req.file) === null || _c === void 0 ? void 0 : _c.size) !== undefined ? formatFileSize((_d = req.file) === null || _d === void 0 ? void 0 : _d.size) : '0 bytes',
            isInTrash: false
        });
        let chat = yield chatModel_1.CHAT.create({
            text: !text ? null : text,
            attachmentId: attachment._id,
            postBy: req.userId,
            isDeleted: false,
            deletedBy: null,
            familyId: req.familyId,
            conversationId: conversation._id
        });
        let chatResponse;
        if (chat.attachmentId != null) {
            chatResponse = yield chat.populate('attachmentId');
        }
        else {
            chatResponse = chat;
        }
        let profileData = yield profileModel_1.PROFILE.findOne({ userId: req.userId }).populate({
            path: 'userId',
            select: ['-password', '-socialMediaType']
        });
        chatResponse._doc.profile = profileData;
        let response = {
            key: 'chat',
            chat: chatResponse,
        };
        main_socket.broadcastChatAttachment(response, req.familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req === null || req === void 0 ? void 0 : req.userId });
        let object = {
            data: {},
            title: 'New File Uploaded',
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} uploaded new file.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Message', object);
        res.status(201).json({
            status: 201,
            message: 'Chat attachment created successfully.',
            data: response
        });
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_1.extractLineNumber)(error);
            (0, email_1.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.attachment = attachment;
function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}
;
const deleteChat = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conversation = yield conversationModel_1.CONVERSATION.findOne({ familyId: req.familyId });
        const chat = yield chatModel_1.CHAT.find({ conversationId: conversation === null || conversation === void 0 ? void 0 : conversation._id });
        for (const data of chat) {
            if (data.attachmentId) {
                if (data.attachmentId !== null) {
                    const attachmentFind = yield attachmentModel_1.ATTACHMENT.findOne({ _id: data.attachmentId });
                    const imagePath = path_1.default.join('public', 'images', path_1.default.basename(attachmentFind === null || attachmentFind === void 0 ? void 0 : attachmentFind.path));
                    let findAttachments = imagePath ? imagePath : path_1.default.join('public', 'audio', path_1.default.basename(attachmentFind === null || attachmentFind === void 0 ? void 0 : attachmentFind.path));
                    if (findAttachments) {
                        fs_1.default.unlink(findAttachments, (err) => {
                            if (err) {
                                console.log('Error deleting image:', err);
                            }
                            else {
                                console.log('Image deleted successfully');
                            }
                        });
                    }
                    yield attachmentModel_1.ATTACHMENT.deleteOne({ _id: data.attachmentId });
                }
            }
            yield chatModel_1.CHAT.deleteOne({ _id: data._id });
        }
        res.status(202).json({
            status: 202,
            message: 'Chat deleted successfully.'
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.deleteChat = deleteChat;
