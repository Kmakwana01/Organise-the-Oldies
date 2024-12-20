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
const keyInfoModel_1 = require("../models/keyInfoModel");
const keyInfoUserModel_1 = require("../models/keyInfoUserModel");
const profileModel_1 = require("../models/profileModel");
const main_socket = require("../socket");
const pushNotification_1 = require("../util/pushNotification");
const email_1 = require("../util/email");
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyInfo, user } = req.body;
        if (!keyInfo)
            throw new Error('keyInfo is required.');
        for (const check of user) {
            const checkUser = yield profileModel_1.PROFILE.findOne({ familyId: req.familyId, userId: check, isDeleted: false });
            if (!checkUser)
                throw new Error('This user not your match with familyId.');
        }
        const keyInfoData = yield keyInfoModel_1.KEY_INFO.create({
            keyInfo: keyInfo,
            createdBy: req.userId,
            isDeleted: false,
            deletedBy: null,
            familyId: req.familyId
        });
        let keyInfoUser = [];
        if (user) {
            for (const data of user) {
                const createData = yield keyInfoUserModel_1.KEY_INFO_USER.create({
                    keyInfoId: keyInfoData._id,
                    userId: data,
                    createdBy: req.userId,
                    isDeleted: false,
                    deletedBy: null,
                });
                keyInfoUser.push(createData);
            }
        }
        const data = yield keyInfoModel_1.KEY_INFO.aggregate([
            {
                $match: { _id: keyInfoData._id, isDeleted: false },
            },
            {
                $lookup: {
                    from: 'keyinfousers',
                    localField: '_id',
                    foreignField: 'keyInfoId',
                    as: 'keyusers',
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
            }
        ]);
        const result = data.length > 0 ? data[0] : null;
        let response = {
            key: 'keyInfoCreate',
            keyInfo: result
        };
        const familyId = req.familyId;
        main_socket.broadcastKeyInfo(response, familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: result,
            title: result === null || result === void 0 ? void 0 : result.keyInfo,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} created new KeyInfo.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'KeyInfo', object);
        res.status(201).json({
            status: 201,
            message: 'Key info created successfully.',
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
        const data = yield keyInfoModel_1.KEY_INFO.aggregate([
            {
                $match: { familyId: req.familyId, isDeleted: false },
            },
            {
                $lookup: {
                    from: 'keyinfousers',
                    localField: '_id',
                    foreignField: 'keyInfoId',
                    as: 'keyusers',
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
            }
        ]);
        res.status(200).json({
            status: 200,
            message: 'KeyInfo data retrieved successfully.',
            data
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
        const { id, keyInfo, user } = req.body;
        if (!id)
            throw new Error('id is required.');
        if (!keyInfo)
            throw new Error('keyInfo is required.');
        const keyInfoFind = yield keyInfoModel_1.KEY_INFO.findOne({ _id: id, isDeleted: false });
        if (!keyInfoFind)
            throw new Error('This keyInfo id does not exist.');
        if ((keyInfoFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this keyInfo.');
        }
        if (req.role == 'grandParent') {
            if (keyInfoFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to update this keyInfo.');
            }
        }
        const keyInfoData = yield keyInfoModel_1.KEY_INFO.findByIdAndUpdate(id, {
            keyInfo: keyInfo,
        }, { new: true });
        yield keyInfoUserModel_1.KEY_INFO_USER.deleteMany({ keyInfoId: keyInfoFind._id });
        let keyInfoUser = [];
        if (user) {
            for (const check of user) {
                const checkUser = yield profileModel_1.PROFILE.findOne({ familyId: req.familyId, userId: check, isDeleted: false });
                if (!checkUser)
                    throw new Error('This user not your match with familyId.');
            }
            for (const data of user) {
                const createData = yield keyInfoUserModel_1.KEY_INFO_USER.create({
                    keyInfoId: keyInfoFind._id,
                    userId: data,
                    createdBy: req.userId,
                    isDeleted: false,
                    deletedBy: null,
                });
                keyInfoUser.push(createData);
            }
        }
        let keyInfoFindNewData = yield keyInfoModel_1.KEY_INFO.findOne({ _id: keyInfoData === null || keyInfoData === void 0 ? void 0 : keyInfoData._id, isDeleted: false });
        const data = yield keyInfoModel_1.KEY_INFO.aggregate([
            {
                $match: { _id: keyInfoFindNewData === null || keyInfoFindNewData === void 0 ? void 0 : keyInfoFindNewData._id, isDeleted: false },
            },
            {
                $lookup: {
                    from: 'keyinfousers',
                    localField: '_id',
                    foreignField: 'keyInfoId',
                    as: 'keyusers',
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
            }
        ]);
        const result = data.length > 0 ? data[0] : null;
        let response = {
            key: 'keyInfoUpdate',
            keyInfo: result
        };
        const familyId = req.familyId;
        main_socket.broadcastKeyInfo(response, familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: result,
            title: result === null || result === void 0 ? void 0 : result.keyInfo,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} updated KeyInfo.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'KeyInfo', object);
        res.status(202).json({
            status: 202,
            message: 'KeyInfo updated successfully.',
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
            throw new Error('keyInfo id required.');
        const keyInfoFind = yield keyInfoModel_1.KEY_INFO.findOne({ _id: id, isDeleted: false });
        if (!keyInfoFind)
            throw new Error('keyInfo id does not exist.');
        if ((keyInfoFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this keyInfo.');
        }
        if (req.role == 'grandParent') {
            if (keyInfoFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to delete this keyInfo.');
            }
        }
        yield keyInfoUserModel_1.KEY_INFO_USER.updateMany({ keyInfoId: id }, { isDeleted: true, deletedBy: req.userId });
        yield keyInfoModel_1.KEY_INFO.findByIdAndUpdate(keyInfoFind._id, {
            isDeleted: true,
            deletedBy: req.userId
        }, { new: true });
        let response = {
            key: 'keyInfoDelete',
            keyInfo: keyInfoFind
        };
        const familyId = req.familyId;
        main_socket.broadcastKeyInfo(response, familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: keyInfoFind,
            title: keyInfoFind === null || keyInfoFind === void 0 ? void 0 : keyInfoFind.keyInfo,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} delete keyInfo.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Delete', object);
        res.status(202).json({
            status: 202,
            message: 'KeyInfo data deleted successfully.',
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
