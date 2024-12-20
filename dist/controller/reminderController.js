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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteData = exports.update = exports.get = exports.create = void 0;
const reminderModel_1 = require("../models/reminderModel");
const reminderUserModel_1 = require("../models/reminderUserModel");
const profileModel_1 = require("../models/profileModel");
const advanceWarningModel_1 = require("../models/advanceWarningModel");
const main_socket = require("../socket");
const pushNotification_1 = require("../util/pushNotification");
const email_1 = require("../util/email");
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let { title, notes, notificationSound, repeat, date, advancewarning, user, weekDays } = req.body;
        let voice;
        if (req.file) {
            voice = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        }
        else {
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
        if (typeof weekDays === 'string') {
            weekDays = JSON.parse(weekDays);
        }
        if (repeat === 'weekly') {
            if (!(weekDays === null || weekDays === void 0 ? void 0 : weekDays.length))
                throw new Error('weekdays is required.');
            let weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (const iterator of weekDays) {
                if (!weekEnum.includes(iterator)) {
                    throw new Error('please provide valid weekDays.');
                }
            }
        }
        // const notificationCheck = await NOTIFICATION.findOne({ _id : notificationSound , isDeleted : false });
        // if(!notificationCheck) throw new Error('Notification not found.');
        if (advancewarning) {
            if (typeof advancewarning === 'string') {
                advancewarning = JSON.parse(advancewarning);
            }
        }
        if (typeof user === 'string') {
            user = JSON.parse(user);
        }
        for (const check of user) {
            let userCheck = yield profileModel_1.PROFILE.findOne({ userId: check, isDeleted: false });
            if (req.familyId !== (userCheck === null || userCheck === void 0 ? void 0 : userCheck.familyId))
                throw new Error(`Login user familyId and ${check} user familyId does not match.`);
        }
        const reminder = yield reminderModel_1.REMINDER.create({
            title,
            notes,
            voice,
            notificationSound,
            repeat,
            date,
            weekDays: (weekDays === null || weekDays === void 0 ? void 0 : weekDays.length) > 0 ? weekDays : [],
            familyId: req.familyId,
            createdBy: req.userId,
            isDeleted: false,
            deletedBy: null,
        });
        let reminderUser = [];
        if (user) {
            for (const userId of user) {
                const reminderusers = yield reminderUserModel_1.REMINDER_USER.create({
                    reminderId: reminder._id,
                    userId,
                    createdBy: req.userId,
                    isDeleted: false,
                    deletedBy: null
                });
                reminderUser.push(reminderusers);
            }
        }
        let advanceWarning = [];
        if (advancewarning) {
            for (const advance of advancewarning) {
                let data = yield advanceWarningModel_1.ADVANCE_WARNING.create({
                    reminderId: reminder._id,
                    eventId: null,
                    when: advance,
                    isDeleted: false,
                    deletedBy: null
                });
                advanceWarning.push(data);
            }
        }
        const newResponse = yield reminderModel_1.REMINDER.aggregate([
            {
                $match: { _id: reminder._id, isDeleted: false }
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
                $lookup: {
                    from: 'reminderusers',
                    localField: '_id',
                    foreignField: 'reminderId',
                    as: 'reminderuser',
                    pipeline: [
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
                    ]
                }
            },
            {
                $lookup: {
                    from: 'advancewarnings',
                    localField: '_id',
                    foreignField: 'reminderId',
                    as: 'advancewarning',
                    pipeline: [
                        {
                            $match: { isDeleted: false }
                        },
                    ]
                }
            }
        ]);
        const result = newResponse.length > 0 ? newResponse[0] : null;
        let response = {
            key: 'reminderCreate',
            reminder: result
        };
        main_socket.broadcastReminder(response, req.familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: result,
            title: result === null || result === void 0 ? void 0 : result.title,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} created new Reminder.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Reminder', object);
        res.status(201).json({
            status: 201,
            message: 'Reminder has been created successfully.',
            data: result
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
        const newData = yield reminderModel_1.REMINDER.find({
            familyId: req.familyId,
            isDeleted: false,
        });
        const reminderIds = newData.map(a => a._id);
        // const reminderIds :any = newData.filter(a => 
        //     (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
        // ).map(a => a._id)
        const response = yield reminderModel_1.REMINDER.aggregate([
            {
                $match: { _id: { $in: reminderIds } }
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
                $lookup: {
                    from: 'reminderusers',
                    localField: '_id',
                    foreignField: 'reminderId',
                    as: 'reminderuser',
                    pipeline: [
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
                    ]
                }
            },
            {
                $lookup: {
                    from: 'advancewarnings',
                    localField: '_id',
                    foreignField: 'reminderId',
                    as: 'advancewarning',
                    pipeline: [
                        {
                            $match: { isDeleted: false }
                        },
                    ]
                }
            }
        ]);
        res.status(200).json({
            status: 200,
            message: 'Reminder data retrieved successfully.',
            data: response
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
    var _a;
    try {
        let { id, title, notes, notificationSound, repeat, date, advancewarning, user, weekDays } = req.body;
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
        if (typeof weekDays === 'string') {
            weekDays = JSON.parse(weekDays);
        }
        if (repeat === 'weekly') {
            if (!(weekDays === null || weekDays === void 0 ? void 0 : weekDays.length))
                throw new Error('weekdays is required.');
            let weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (const iterator of weekDays) {
                if (!weekEnum.includes(iterator)) {
                    throw new Error('please provide valid weekDays.');
                }
            }
        }
        if (advancewarning) {
            if (typeof advancewarning === 'string') {
                advancewarning = JSON.parse(advancewarning);
            }
        }
        let reminderFind = yield reminderModel_1.REMINDER.findOne({ _id: id, isDeleted: false });
        if (!reminderFind)
            throw new Error('Reminder not found.');
        if ((reminderFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this reminder.');
        }
        if (req.role == 'grandParent') {
            if (reminderFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to update this reminder.');
            }
        }
        // const notificationCheck = await NOTIFICATION.findOne({ _id : notificationSound , isDeleted : false });
        // if(!notificationCheck) throw new Error('Notification not found.');
        if (typeof user === 'string') {
            user = JSON.parse(user);
        }
        for (const check of user) {
            let userCheck = yield profileModel_1.PROFILE.findOne({ userId: check, isDeleted: false });
            if (req.familyId !== (userCheck === null || userCheck === void 0 ? void 0 : userCheck.familyId))
                throw new Error(`Login user familyId and ${check} user familyId does not match.`);
        }
        let voice;
        if (req.file) {
            voice = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        }
        else {
            voice = reminderFind.voice;
        }
        const reminder = yield reminderModel_1.REMINDER.findByIdAndUpdate(id, {
            title,
            notes,
            voice,
            notificationSound,
            repeat,
            weekDays: (weekDays === null || weekDays === void 0 ? void 0 : weekDays.length) > 0 ? weekDays : [],
            date
        }, { new: true });
        yield reminderUserModel_1.REMINDER_USER.deleteMany({ reminderId: reminderFind._id });
        let reminderUser = [];
        if (user) {
            for (const userId of user) {
                const reminderusers = yield reminderUserModel_1.REMINDER_USER.create({
                    reminderId: reminderFind._id,
                    userId,
                    createdBy: req.userId,
                    isDeleted: false,
                    deletedBy: null
                });
                reminderUser.push(reminderusers);
            }
        }
        let advanceWarning = [];
        if (advancewarning) {
            yield advanceWarningModel_1.ADVANCE_WARNING.updateMany({ reminderId: reminderFind._id }, { isDeleted: true, deletedBy: req.userId });
            for (const advance of advancewarning) {
                let data = yield advanceWarningModel_1.ADVANCE_WARNING.create({
                    reminderId: reminderFind._id,
                    eventId: null,
                    when: advance,
                    isDeleted: false,
                    deletedBy: null
                });
                advanceWarning.push(data);
            }
        }
        let reminderFindData = yield reminderModel_1.REMINDER.findOne({ _id: id, isDeleted: false });
        const newResponse = yield reminderModel_1.REMINDER.aggregate([
            {
                $match: { _id: reminderFindData === null || reminderFindData === void 0 ? void 0 : reminderFindData._id, isDeleted: false }
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
                $lookup: {
                    from: 'reminderusers',
                    localField: '_id',
                    foreignField: 'reminderId',
                    as: 'reminderuser',
                    pipeline: [
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
                    ]
                }
            },
            {
                $lookup: {
                    from: 'advancewarnings',
                    localField: '_id',
                    foreignField: 'reminderId',
                    as: 'advancewarning',
                    pipeline: [
                        {
                            $match: { isDeleted: false }
                        },
                    ]
                }
            }
        ]);
        const result = newResponse.length > 0 ? newResponse[0] : null;
        let response = {
            key: 'reminderUpdate',
            reminder: result
        };
        main_socket.broadcastReminder(response, req.familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: result,
            title: result === null || result === void 0 ? void 0 : result.title,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} updated Reminder.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Reminder', object);
        res.status(202).json({
            status: 202,
            message: 'Reminder updated successfully.',
            data: result
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
exports.update = update;
const deleteData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        if (!id)
            throw new Error('reminder id is required.');
        let reminderFind = yield reminderModel_1.REMINDER.findOne({ _id: id, isDeleted: false });
        if (!reminderFind)
            throw new Error('reminder id does not exist.');
        if ((reminderFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this reminder.');
        }
        if (req.role == 'grandParent') {
            if (reminderFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to delete this reminder.');
            }
        }
        yield reminderUserModel_1.REMINDER_USER.updateMany({ reminderId: id }, { isDeleted: true, deletedBy: req.userId });
        yield advanceWarningModel_1.ADVANCE_WARNING.updateMany({ reminderId: id }, { isDeleted: true, deletedBy: req.userId });
        yield reminderModel_1.REMINDER.updateOne({ _id: id }, {
            isDeleted: true,
            deletedBy: req.userId
        });
        let response = {
            key: 'reminderDelete',
            reminder: reminderFind,
        };
        main_socket.broadcastReminder(response, req.familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: reminderFind,
            title: reminderFind === null || reminderFind === void 0 ? void 0 : reminderFind.title,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} delete Reminder.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Delete', object);
        res.status(202).json({
            status: 202,
            message: 'Reminder deleted successfully.',
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
exports.deleteData = deleteData;
