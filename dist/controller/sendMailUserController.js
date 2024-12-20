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
exports.update = exports.get = exports.create = void 0;
const sendMailUserModel_1 = require("../models/sendMailUserModel");
const profileModel_1 = require("../models/profileModel");
const mongoose_1 = __importDefault(require("mongoose"));
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, time, isActive } = req.body;
        if (!userId)
            throw new Error('userId is required');
        if (!time)
            throw new Error('time is required');
        if (typeof isActive !== 'boolean')
            throw new Error('time is required');
        const checkUser = yield profileModel_1.PROFILE.findOne({ userId, familyId: req.familyId });
        if (!checkUser)
            throw new Error('This user not connected with family.');
        let sendMailUser = yield sendMailUserModel_1.SEND_MAIL_USER.findOne({ userId, familyId: req.familyId });
        if (sendMailUser && isActive === true) {
            // update
            sendMailUser.userId = userId;
            sendMailUser.time = time;
            yield sendMailUser.save();
        }
        else if (sendMailUser && isActive === false) {
            //delete
            yield sendMailUser.deleteOne();
        }
        else if (!sendMailUser && isActive === true) {
            // create
            sendMailUser = yield sendMailUserModel_1.SEND_MAIL_USER.create({
                userId,
                time,
                familyId: req.familyId,
                isActive
            });
        }
        else {
            throw new Error('please provide valid credentials');
        }
        res.status(201).json({
            status: 201,
            message: 'Data updated successfully.',
            data: sendMailUser
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.create = create;
const get = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield profileModel_1.PROFILE.aggregate([
            {
                $match: {
                    familyId: req.familyId,
                    isDeleted: false,
                    userId: new mongoose_1.default.Types.ObjectId(req.userId)
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
            status: 200,
            message: 'Data retrieved successfully.',
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
    try {
        const { userId, time, isActive, id } = req.body;
        switch (true) {
            case !id: throw new Error('id is required');
            case !userId: throw new Error('userId is required.');
            case !time: throw new Error('time is required.');
            case !isActive: throw new Error('isActive is required.');
            default:
                break;
        }
        const findData = yield sendMailUserModel_1.SEND_MAIL_USER.findOne({ _id: id });
        if (!findData)
            throw new Error('this id does not exist.');
        const checkUser = yield profileModel_1.PROFILE.findOne({ userId, familyId: req.familyId });
        if (!checkUser)
            throw new Error('this user not match with familyId.');
        const data = yield sendMailUserModel_1.SEND_MAIL_USER.findByIdAndUpdate(id, {
            userId,
            time,
            isActive
        }, { new: true });
        res.status(202).json({
            status: 202,
            message: 'data updated successfully.',
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
exports.update = update;
