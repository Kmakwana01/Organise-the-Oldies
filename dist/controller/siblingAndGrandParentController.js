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
exports.login = exports.getDataFromId = exports.deleteData = exports.update = exports.get = exports.create = void 0;
const eventModel_1 = require("../models/eventModel");
const eventUser_1 = require("../models/eventUser");
const profileModel_1 = require("../models/profileModel");
const userModel_1 = require("../models/userModel");
const contactModel_1 = require("../models/contactModel");
const keyInfoUserModel_1 = require("../models/keyInfoUserModel");
const keyInfoModel_1 = require("../models/keyInfoModel");
const medicinesModel_1 = require("../models/medicinesModel");
const medicinesUser_1 = require("../models/medicinesUser");
const reminderModel_1 = require("../models/reminderModel");
const reminderUserModel_1 = require("../models/reminderUserModel");
const conversationModel_1 = require("../models/conversationModel");
const conversationUserModel_1 = require("../models/conversationUserModel");
const chatModel_1 = require("../models/chatModel");
const attachmentModel_1 = require("../models/attachmentModel");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sessionModel_1 = require("../models/sessionModel");
const tokenModel_1 = require("../models/tokenModel");
const crypto_1 = __importDefault(require("crypto"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const main_socket = require("../socket");
const secretKeyPath = path_1.default.join(__dirname, '..', 'jwtRS256.key');
let secretKey = fs_1.default.readFileSync(secretKeyPath, 'utf8').trim();
const email_1 = require("../util/email");
const mongoose_1 = __importDefault(require("mongoose"));
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, role, email, password } = req.body;
        if (!firstName)
            throw new Error('FirstName is required.');
        if (!lastName)
            throw new Error('LastName is required.');
        if (!role)
            throw new Error('Role is required.');
        if (!email)
            throw new Error('Email is required.');
        if (role === 'grandParent') {
            let grandParentFind = yield profileModel_1.PROFILE.find({ familyId: req.familyId, isDeleted: false }).populate('userId');
            console.log('first');
            let filterData = grandParentFind.filter((fil) => { var _a; return ((_a = fil.userId) === null || _a === void 0 ? void 0 : _a.role) === 'grandParent'; });
            if (filterData.length == 2) {
                throw new Error('You have already added the maximum number of grandparents allowed (2).');
            }
        }
        else {
            let siblingParentFind = yield profileModel_1.PROFILE.find({ familyId: req.familyId, isDeleted: false }).populate('userId');
            let filterData = siblingParentFind.filter((fil) => fil.userId.role === 'sibling');
            if (filterData.length == 2) {
                throw new Error('You have already added the maximum number of sibling allowed (2).');
            }
        }
        let emailFind = yield userModel_1.USER.findOne({ email: email, isDeleted: false });
        if (emailFind && (emailFind.email != 'null'))
            throw new Error('Email already exists.');
        const userResponse = yield userModel_1.USER.create({
            email: req.body.email,
            password: password ? yield bcrypt_1.default.hash(password, 8) : null,
            role: req.body.role,
            isDeleted: false,
            deletedBy: null
        });
        console.log(userResponse);
        let images = null;
        if (req.file) {
            images = req.file.filename;
        }
        const profile = yield profileModel_1.PROFILE.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            image: images,
            familyId: req.familyId,
            createdBy: req.userId,
            userId: userResponse._id,
            isDeleted: false,
            deletedBy: null
        });
        let response = yield profile.populate({
            path: 'userId',
            select: ['-password', '-socialMediaType']
        });
        const encryptedUserId = crypto_js_1.default.AES.encrypt(response.userId._id.toString(), secretKey).toString();
        response.userId._doc.encryptedUserId = encryptedUserId;
        let responseKey = {
            key: 'grandParentAndSiblingCreate',
            grandParentAndSibling: response
        };
        main_socket.broadcastGrandParent(responseKey, req.familyId);
        res.status(201).json({
            status: 201,
            message: 'Data created successfully.',
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
exports.create = create;
const get = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const familyId = req.query.familyId;
        if (!familyId)
            throw new Error('FamilyId is required.');
        const response = yield profileModel_1.PROFILE.aggregate([
            {
                $match: {
                    familyId: familyId,
                    isDeleted: false,
                    userId: { $ne: new mongoose_1.default.Types.ObjectId(req.userId) }
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
                }
            }
        ]);
        const encryptedResponse = response.map((item) => {
            const encryptedUserId = crypto_js_1.default.AES.encrypt(item.userId._id.toString(), secretKey).toString();
            return Object.assign(Object.assign({}, item), { userId: Object.assign(Object.assign({}, item.userId), { encryptedUserId: encryptedUserId }) });
        });
        res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully.',
            data: encryptedResponse
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.get = get;
const update = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, firstName, lastName, email } = req.body;
        switch (true) {
            case !userId: throw new Error('userId is required.');
            case !firstName: throw new Error('firstName is required.');
            case !lastName: throw new Error('lastName is required.');
            case !email: throw new Error('email is required.');
            default:
                break;
        }
        let userFind = yield userModel_1.USER.findOne({ _id: userId, isDeleted: false });
        if (!userFind) {
            throw new Error('This user does not exist.');
        }
        else {
            let Email = yield userModel_1.USER.findOne({ email, isDeleted: false });
            if (Email && (userId !== Email._id.toString())) {
                throw new Error('This email already exists.');
            }
            let userResponse = yield userModel_1.USER.findByIdAndUpdate(userId, {
                email: req.body.email
            }, { new: true });
            let profileFind = yield profileModel_1.PROFILE.findOne({ userId: userId });
            let images;
            if (req.file) {
                images = req.file.filename;
            }
            else {
                images = profileFind === null || profileFind === void 0 ? void 0 : profileFind.image;
            }
            let profile = yield profileModel_1.PROFILE.findOneAndUpdate({ userId: userId }, {
                firstName,
                lastName,
                image: images
            }, { new: true });
            let populateProfile = yield (profile === null || profile === void 0 ? void 0 : profile.populate({
                path: 'userId',
                select: ['-password', '-socialMediaType']
            }));
            const encryptedUserId = crypto_js_1.default.AES.encrypt(populateProfile.userId._id.toString(), secretKey).toString();
            populateProfile.userId._doc.encryptedUserId = encryptedUserId;
            console.log("==========> " + populateProfile);
            let responseKey = {
                key: 'grandParentAndSiblingUpdate',
                grandParentAndSibling: populateProfile
            };
            main_socket.broadcastGrandParent(responseKey, req.familyId);
            res.status(202).json({
                status: 202,
                message: 'Data updated successfully.',
                data: populateProfile
            });
        }
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
exports.update = update;
const deleteData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.query.userId)
            throw new Error('userId is required.');
        let userFind = yield userModel_1.USER.findOne({ _id: req.query.userId, isDeleted: false });
        if (!userFind) {
            throw new Error('This user does not exist.');
        }
        else {
            let profileFindData = yield profileModel_1.PROFILE.findOne({ userId: userFind._id });
            if ((userFind === null || userFind === void 0 ? void 0 : userFind.role) === 'parent') {
                let profileFind = yield profileModel_1.PROFILE.findOne({ userId: userFind._id });
                let allProfile = yield profileModel_1.PROFILE.find({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId, isDeleted: false });
                let userId = allProfile.map((user) => user.userId);
                yield eventUser_1.EVENT_USER.deleteMany({ userId: { $in: userId } });
                yield eventModel_1.EVENT.deleteMany({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId });
                yield contactModel_1.CONTACT.deleteMany({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId });
                yield keyInfoUserModel_1.KEY_INFO_USER.deleteMany({ userId: { $in: userId } });
                yield keyInfoModel_1.KEY_INFO.deleteMany({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId });
                yield medicinesUser_1.MEDICINES_USER.deleteMany({ userId: { $in: userId } });
                const medicines = yield medicinesModel_1.MEDICINES.find({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId });
                if (medicines.length > 0) {
                    for (const medicine of medicines) {
                        if (medicine.photo) {
                            const imagePath = path_1.default.join('public', 'images', path_1.default.basename(medicine === null || medicine === void 0 ? void 0 : medicine.photo));
                            if (imagePath) {
                                if (fs_1.default.existsSync(imagePath)) {
                                    fs_1.default.unlink(imagePath, (err) => {
                                        if (err) {
                                            console.log('Error deleting image:', err);
                                        }
                                        else {
                                            console.log('Image deleted successfully');
                                        }
                                    });
                                }
                                else {
                                    console.log(`Medicine photo path does not exist: ${imagePath}`);
                                }
                            }
                        }
                        if (medicine.voice) {
                            const audioPath = path_1.default.join('public', 'audio', path_1.default.basename(medicine === null || medicine === void 0 ? void 0 : medicine.voice));
                            if (audioPath) {
                                if (fs_1.default.existsSync(audioPath)) {
                                    fs_1.default.unlink(audioPath, (err) => {
                                        if (err) {
                                            console.log('Error deleting image:', err);
                                        }
                                        else {
                                            console.log('Image deleted successfully');
                                        }
                                    });
                                }
                                else {
                                    console.log(`Medicine voice path does not exist: ${audioPath}`);
                                }
                            }
                        }
                        yield medicinesModel_1.MEDICINES.deleteOne({ _id: medicine._id });
                    }
                }
                yield reminderUserModel_1.REMINDER_USER.deleteMany({ userId: { $in: userId } });
                const reminder = yield reminderModel_1.REMINDER.find({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId });
                if (reminder.length > 0) {
                    for (const iterator of reminder) {
                        if (iterator === null || iterator === void 0 ? void 0 : iterator.voice) {
                            const audioPath = path_1.default.join('public', 'audio', path_1.default.basename(iterator === null || iterator === void 0 ? void 0 : iterator.voice));
                            if (audioPath) {
                                if (fs_1.default.existsSync(audioPath)) {
                                    fs_1.default.unlink(audioPath, (err) => {
                                        if (err) {
                                            console.log('Error deleting image:', err);
                                        }
                                        else {
                                            console.log('Image deleted successfully');
                                        }
                                    });
                                }
                                else {
                                    console.log(`Reminder voice path does not exist: ${audioPath}`);
                                }
                            }
                        }
                        yield reminderModel_1.REMINDER.deleteOne({ _id: iterator._id });
                    }
                }
                const conversationFind = yield conversationModel_1.CONVERSATION.findOne({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId });
                if (conversationFind) {
                    yield conversationUserModel_1.CONVERSATION_USER.deleteMany({ conversationId: conversationFind._id });
                    let chatFind = yield chatModel_1.CHAT.find({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId });
                    for (const chatDelete of chatFind) {
                        if (chatDelete.attachmentId !== null) {
                            const attachmentFind = yield attachmentModel_1.ATTACHMENT.findOne({ _id: chatDelete.attachmentId });
                            const imagePath = path_1.default.join('public', 'images', path_1.default.basename(attachmentFind === null || attachmentFind === void 0 ? void 0 : attachmentFind.path));
                            let findAttachments = imagePath ? imagePath : path_1.default.join('public', 'audio', path_1.default.basename(attachmentFind === null || attachmentFind === void 0 ? void 0 : attachmentFind.path));
                            if (findAttachments) {
                                if (fs_1.default.existsSync(findAttachments)) {
                                    fs_1.default.unlink(findAttachments, (err) => {
                                        if (err) {
                                            console.log('Error deleting image:', err);
                                        }
                                        else {
                                            console.log('Image deleted successfully');
                                        }
                                    });
                                }
                                else {
                                    console.log(`Attachment path does not exist: ${findAttachments}`);
                                }
                            }
                            yield attachmentModel_1.ATTACHMENT.deleteOne({ _id: chatDelete.attachmentId });
                        }
                        yield chatModel_1.CHAT.deleteOne({ _id: chatDelete._id });
                    }
                }
                const profile = yield profileModel_1.PROFILE.find({ familyId: profileFind === null || profileFind === void 0 ? void 0 : profileFind.familyId });
                for (const profiles of profile) {
                    if (profiles.image) {
                        const imagePath = path_1.default.join('public', 'images', path_1.default.basename(profiles === null || profiles === void 0 ? void 0 : profiles.image));
                        if (imagePath) {
                            if (fs_1.default.existsSync(imagePath)) {
                                fs_1.default.unlink(imagePath, (err) => {
                                    if (err) {
                                        console.log('Error deleting image:', err);
                                    }
                                    else {
                                        console.log('Image deleted successfully');
                                    }
                                });
                            }
                            else {
                                console.log(`Profile image path does not exist: ${imagePath}`);
                            }
                        }
                    }
                    yield profileModel_1.PROFILE.deleteOne({ _id: profiles._id });
                }
                yield userModel_1.USER.deleteMany({ _id: { $in: userId } });
                let responseKey = {
                    key: 'parentDelete',
                    grandParentAndSibling: yield (profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.populate({ path: 'userId', select: '-password' }))
                };
                main_socket.broadcastGrandParent(responseKey, req.familyId);
            }
            else {
                const event = yield eventModel_1.EVENT.find({ familyId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.familyId });
                if (event.length > 0) {
                    for (const events of event) {
                        const eventUser = yield eventUser_1.EVENT_USER.find({ eventId: events._id, isDeleted: false });
                        if (eventUser.length > 1) {
                            yield eventUser_1.EVENT_USER.deleteMany({ eventId: events._id, userId: userFind._id });
                        }
                        else {
                            yield eventUser_1.EVENT_USER.deleteOne({ eventId: events._id });
                            yield eventModel_1.EVENT.deleteOne({ _id: events._id });
                        }
                    }
                }
                yield contactModel_1.CONTACT.deleteMany({ familyId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.familyId, createdBy: userFind._id });
                const keyInfos = yield keyInfoModel_1.KEY_INFO.find({ familyId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.familyId });
                if (keyInfos.length > 0) {
                    for (const keyInfo of keyInfos) {
                        const keyInfoUser = yield keyInfoUserModel_1.KEY_INFO_USER.find({ keyInfoId: keyInfo._id, isDeleted: false });
                        if (keyInfoUser.length > 1) {
                            yield keyInfoUserModel_1.KEY_INFO_USER.deleteMany({ keyInfoId: keyInfo._id, userId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.userId });
                        }
                        else {
                            yield keyInfoUserModel_1.KEY_INFO_USER.deleteMany({ keyInfoId: keyInfo._id });
                            yield keyInfoModel_1.KEY_INFO.deleteOne({ _id: keyInfo._id });
                        }
                    }
                }
                const medicines = yield medicinesModel_1.MEDICINES.find({ familyId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.familyId });
                if (medicines.length > 0) {
                    for (const medicine of medicines) {
                        const medicineUser = yield medicinesUser_1.MEDICINES_USER.find({ medicinesId: medicine._id, isDeleted: false });
                        if (medicineUser.length > 1) {
                            yield medicinesUser_1.MEDICINES_USER.deleteMany({ medicinesId: medicine._id, userId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.userId });
                        }
                        else {
                            yield medicinesUser_1.MEDICINES_USER.deleteMany({ medicinesId: medicine._id });
                            if (medicine.photo) {
                                const imagePath = path_1.default.join('public', 'images', path_1.default.basename(medicine === null || medicine === void 0 ? void 0 : medicine.photo));
                                if (imagePath) {
                                    if (fs_1.default.existsSync(imagePath)) {
                                        fs_1.default.unlink(imagePath, (err) => {
                                            if (err) {
                                                console.log('Error deleting image:', err);
                                            }
                                            else {
                                                console.log('Image deleted successfully');
                                            }
                                        });
                                    }
                                    else {
                                        console.log(`Medicine photo path does not exist: ${imagePath}`);
                                    }
                                }
                            }
                            if (medicine.voice) {
                                const audioPath = path_1.default.join('public', 'audio', path_1.default.basename(medicine === null || medicine === void 0 ? void 0 : medicine.voice));
                                if (audioPath) {
                                    if (fs_1.default.existsSync(audioPath)) {
                                        fs_1.default.unlink(audioPath, (err) => {
                                            if (err) {
                                                console.log('Error deleting image:', err);
                                            }
                                            else {
                                                console.log('Image deleted successfully');
                                            }
                                        });
                                    }
                                    else {
                                        console.log(`Medicine voice path does not exist: ${audioPath}`);
                                    }
                                }
                            }
                            yield medicinesModel_1.MEDICINES.deleteOne({ _id: medicine._id });
                        }
                    }
                }
                const reminders = yield reminderModel_1.REMINDER.find({ familyId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.familyId });
                if (reminders.length > 0) {
                    for (const reminder of reminders) {
                        const reminderUser = yield reminderUserModel_1.REMINDER_USER.find({ reminderId: reminder._id, isDeleted: false });
                        if (reminderUser.length > 1) {
                            yield reminderUserModel_1.REMINDER_USER.deleteMany({ reminderId: reminder._id, userId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.userId });
                        }
                        else {
                            yield reminderUserModel_1.REMINDER_USER.deleteMany({ reminderId: reminder._id });
                            if (reminder.voice) {
                                const audioPath = path_1.default.join('public', 'audio', path_1.default.basename(reminder === null || reminder === void 0 ? void 0 : reminder.voice));
                                if (audioPath) {
                                    if (fs_1.default.existsSync(audioPath)) {
                                        fs_1.default.unlink(audioPath, (err) => {
                                            if (err) {
                                                console.log('Error deleting image:', err);
                                            }
                                            else {
                                                console.log('Image deleted successfully');
                                            }
                                        });
                                    }
                                    else {
                                        console.log(`Reminder voice path does not exist: ${audioPath}`);
                                    }
                                }
                            }
                            yield reminderModel_1.REMINDER.deleteOne({ _id: reminder._id });
                        }
                    }
                }
                const profile = yield profileModel_1.PROFILE.findOne({ userId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.userId, familyId: profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.familyId });
                if (profile === null || profile === void 0 ? void 0 : profile.image) {
                    const imagePath = path_1.default.join('public', 'images', path_1.default.basename(profile === null || profile === void 0 ? void 0 : profile.image));
                    if (imagePath) {
                        if (fs_1.default.existsSync(imagePath)) {
                            fs_1.default.unlink(imagePath, (err) => {
                                if (err) {
                                    console.log('Error deleting image:', err);
                                }
                                else {
                                    console.log('Image deleted successfully');
                                }
                            });
                        }
                        else {
                            console.log(`Profile image path does not exist: ${imagePath}`);
                        }
                    }
                }
                let responseKey = {
                    key: 'grandParentAndSiblingDelete',
                    grandParentAndSibling: yield (profileFindData === null || profileFindData === void 0 ? void 0 : profileFindData.populate({ path: 'userId', select: ['-password', '-socialMediaType'] }))
                };
                yield profileModel_1.PROFILE.deleteOne({ _id: profile === null || profile === void 0 ? void 0 : profile._id });
                yield userModel_1.USER.deleteOne({ _id: profile === null || profile === void 0 ? void 0 : profile.userId });
                main_socket.broadcastGrandParent(responseKey, req.familyId);
            }
            res.status(202).json({
                status: 202,
                message: 'Data deleted successfully.'
            });
        }
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
exports.deleteData = deleteData;
const getDataFromId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let profile = yield profileModel_1.PROFILE.findOne({ userId: req.userId }).populate({
            path: 'userId',
            select: ['-password', '-socialMediaType']
        });
        res.status(200).json({
            status: 200,
            message: 'Profile retrieved successfully.',
            data: profile
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
exports.getDataFromId = getDataFromId;
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { userId, notificationToken, deviceName, platform } = req.body;
        if (!userId) {
            throw new Error('userId is required.');
        }
        else if (!notificationToken) {
            throw new Error('notificationToken is required.');
        }
        else if (!deviceName) {
            throw new Error('deviceName is required.');
        }
        else if (!platform) {
            throw new Error('platform is required.');
        }
        const secretKeyPath = path_1.default.join(__dirname, '..', 'jwtRS256.key');
        let secretKey = fs_1.default.readFileSync(secretKeyPath, 'utf8').trim();
        const decryptedBytes = crypto_js_1.default.AES.decrypt(userId, secretKey);
        const decryptedUserId = decryptedBytes.toString(crypto_js_1.default.enc.Utf8);
        if (!decryptedUserId) {
            throw new Error('Failed to decrypt userId');
        }
        let userFind = yield userModel_1.USER.findOne({ _id: decryptedUserId, isDeleted: false });
        if (!userFind)
            throw new Error('User not found.');
        if (userFind.role === 'sibling') {
            if (!userFind.password) {
                return res.status(307).json({
                    status: 307,
                    message: 'Please set a new password.',
                });
            }
            else {
                return res.status(302).json({
                    status: 302,
                    message: 'you are already registered.',
                });
            }
        }
        let options = {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };
        let objectToCreateToken = {
            email: userFind.email,
            userId: userFind._id,
            role: userFind.role,
            createdAt: Date.now(),
        };
        let token = jsonwebtoken_1.default.sign(objectToCreateToken, secretKey, options);
        const refreshTokenPayload = {
            userId: userFind._id,
        };
        const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        let refreshOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };
        const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, privateKey, refreshOptions);
        yield tokenModel_1.TOKEN.create({
            accessToken: token,
            refreshToken: refreshToken,
            userId: userFind._id,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        yield sessionModel_1.SESSION.create({
            notificationToken: notificationToken,
            jwtToken: token,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            deviceName: deviceName,
            platform: platform,
            userId: userFind._id,
            isActive: true,
            generatedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        let familyIdFind = yield profileModel_1.PROFILE.findOne({ userId: userFind._id, isDeleted: false });
        res.status(200).json({
            status: 200,
            message: 'Login successfully.',
            token,
            refreshToken,
            userId: userFind._id,
            role: userFind.role,
            familyId: familyIdFind === null || familyIdFind === void 0 ? void 0 : familyIdFind.familyId
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
exports.login = login;
