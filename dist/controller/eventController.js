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
const eventModel_1 = require("../models/eventModel");
const eventUser_1 = require("../models/eventUser");
const advanceWarningModel_1 = require("../models/advanceWarningModel");
const profileModel_1 = require("../models/profileModel");
const main_socket = require("../socket");
const pushNotification_1 = require("../util/pushNotification");
const email_1 = require("../util/email");
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, dateAndTime, user, advancewarning, notificationSound } = req.body;
        switch (true) {
            case !name: throw new Error('name is required.');
            case !dateAndTime: throw new Error('dateAndTime is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            default:
                break;
        }
        for (const check of user) {
            let userCheck = yield profileModel_1.PROFILE.findOne({ userId: check, isDeleted: false });
            if (req.familyId !== (userCheck === null || userCheck === void 0 ? void 0 : userCheck.familyId))
                throw new Error(`Login user familyId and ${check} user familyId does not match.`);
        }
        const event = yield eventModel_1.EVENT.create({
            name,
            dateAndTime,
            notificationSound,
            familyId: req.familyId,
            createdBy: req.userId,
            isDeleted: false,
            deletedBy: null,
        });
        let eventUsers = [];
        if (user) {
            for (const users of user) {
                let eventUserData = yield eventUser_1.EVENT_USER.create({
                    eventId: event._id,
                    userId: users,
                    createdBy: req.userId,
                    isDeleted: false,
                    deletedBy: null,
                });
                eventUsers.push(eventUserData);
            }
        }
        let advanceWarnings = [];
        if (advancewarning) {
            for (const advance of advancewarning) {
                let advanceData = yield advanceWarningModel_1.ADVANCE_WARNING.create({
                    reminderId: null,
                    eventId: event._id,
                    when: advance,
                    isDeleted: false,
                    deletedBy: null,
                });
                advanceWarnings.push(advanceData);
            }
        }
        const newResponse = yield eventModel_1.EVENT.aggregate([
            {
                $match: { _id: event._id, isDeleted: false }
            },
            {
                $lookup: {
                    from: 'eventusers',
                    localField: '_id',
                    foreignField: 'eventId',
                    as: 'eventuser',
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
                    foreignField: 'eventId',
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
            key: 'eventCreate',
            event: result
        };
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: result,
            title: result === null || result === void 0 ? void 0 : result.name,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} created new Event.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Event', object);
        main_socket.broadcastEvent(response, req.familyId);
        res.status(201).json({
            status: 201,
            message: 'Event created successfully.',
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
        const response = yield eventModel_1.EVENT.aggregate([
            {
                $match: { familyId: req.familyId, isDeleted: false }
            },
            {
                $lookup: {
                    from: 'eventusers',
                    localField: '_id',
                    foreignField: 'eventId',
                    as: 'eventuser',
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
                    foreignField: 'eventId',
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
            message: 'Event retrieved successfully.',
            data: response
        });
    }
    catch (error) {
        res.status(200).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.get = get;
const update = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, name, dateAndTime, user, advancewarning, notificationSound } = req.body;
        switch (true) {
            case !id: throw new Error('id is required.');
            case !name: throw new Error('name is required.');
            case !dateAndTime: throw new Error('dateAndTime is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            default:
                break;
        }
        let eventFind = yield eventModel_1.EVENT.findOne({ _id: id, isDeleted: false });
        if (!eventFind)
            throw new Error('event id does not exist.');
        if ((eventFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this Event.');
        }
        if (req.role == 'grandParent') {
            if (eventFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to update this Event.');
            }
        }
        if (user) {
            for (const check of user) {
                let userCheck = yield profileModel_1.PROFILE.findOne({ userId: check, isDeleted: false });
                if (req.familyId !== (userCheck === null || userCheck === void 0 ? void 0 : userCheck.familyId))
                    throw new Error(`Login user familyId and ${check} user familyId does not match.`);
            }
        }
        const event = yield eventModel_1.EVENT.findByIdAndUpdate(eventFind._id, {
            name,
            dateAndTime,
            notificationSound
        }, { new: true });
        yield eventUser_1.EVENT_USER.deleteMany({ eventId: eventFind._id });
        let eventUsers = [];
        if (user) {
            for (const users of user) {
                let eventUserData = yield eventUser_1.EVENT_USER.create({
                    eventId: eventFind._id,
                    userId: users,
                    createdBy: req.userId,
                    isDeleted: false,
                    deletedBy: null,
                });
                eventUsers.push(eventUserData);
            }
        }
        let advanceWarnings = [];
        if (advancewarning) {
            yield advanceWarningModel_1.ADVANCE_WARNING.updateMany({ eventId: eventFind._id }, { isDeleted: true, deletedBy: req.userId });
            for (const advance of advancewarning) {
                let advanceData = yield advanceWarningModel_1.ADVANCE_WARNING.create({
                    reminderId: null,
                    eventId: eventFind._id,
                    when: advance,
                    isDeleted: false,
                    deletedBy: null,
                });
                advanceWarnings.push(advanceData);
            }
        }
        let eventFindData = yield eventModel_1.EVENT.findOne({ _id: event === null || event === void 0 ? void 0 : event._id, isDeleted: false });
        const newResponse = yield eventModel_1.EVENT.aggregate([
            {
                $match: { _id: eventFindData._id, isDeleted: false }
            },
            {
                $lookup: {
                    from: 'eventusers',
                    localField: '_id',
                    foreignField: 'eventId',
                    as: 'eventuser',
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
                    foreignField: 'eventId',
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
            key: 'eventUpdate',
            event: result
        };
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: result,
            title: result === null || result === void 0 ? void 0 : result.name,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} updated Event.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Event', object);
        main_socket.broadcastEvent(response, req.familyId);
        res.status(202).json({
            status: 202,
            message: 'Event updated successfully.',
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
            throw new Error('id required.');
        let eventFind = yield eventModel_1.EVENT.findOne({ _id: id, isDeleted: false });
        if (!eventFind)
            throw new Error('event not found.');
        if ((eventFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this event.');
        }
        if (req.role == 'grandParent') {
            if (eventFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to delete this event.');
            }
        }
        yield advanceWarningModel_1.ADVANCE_WARNING.updateMany({ eventId: id }, { isDeleted: true, deletedBy: req.userId });
        yield eventUser_1.EVENT_USER.updateMany({ eventId: id }, { isDeleted: true, deletedBy: req.userId });
        yield eventModel_1.EVENT.updateOne({ _id: id }, { isDeleted: true, deletedBy: req.userId });
        let response = {
            key: 'eventDelete',
            event: eventFind,
        };
        main_socket.broadcastEvent(response, req.familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: eventFind,
            title: eventFind === null || eventFind === void 0 ? void 0 : eventFind.name,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} delete Event.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Delete', object);
        res.status(202).json({
            status: 202,
            message: 'Event deleted successfully.'
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
