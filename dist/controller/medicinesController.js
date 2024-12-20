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
const medicinesModel_1 = require("../models/medicinesModel");
const medicinesUser_1 = require("../models/medicinesUser");
const main_socket = require("../socket");
const pushNotification_1 = require("../util/pushNotification");
const email_1 = require("../util/email");
const profileModel_1 = require("../models/profileModel");
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { name, notes, notificationSound, medicinesTime, date, repeat, selectTime1, selectTime2, selectTime3, user, weekDays, isAfterfood } = req.body;
        switch (true) {
            case !name: throw new Error('name is required.');
            // case !notes: throw new Error('notes is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            case !date: throw new Error('date is required.');
            case !repeat: throw new Error('repeat is required.');
            case !medicinesTime: throw new Error('medicinesTime is required.');
            case isAfterfood != 'true' && isAfterfood != 'false': throw new Error('provide valid isAfterfood.');
            // case !selectTime1: throw new Error('selectTime1 is required.');
            // case !selectTime2: throw new Error('selectTime2 is required.');
            // case !selectTime3: throw new Error('selectTime3 is required.');
            default:
                break;
        }
        if (typeof user === 'string') {
            user = JSON.parse(user);
        }
        if (typeof weekDays === 'string') {
            weekDays = JSON.parse(weekDays);
        }
        let repeatEnum = ["weekly", "monthly", "forNightly", "Daily"];
        if (!repeatEnum.includes(repeat))
            throw new Error('please provide valid repeat.');
        if (repeat === 'weekly') {
            if (!(weekDays === null || weekDays === void 0 ? void 0 : weekDays.length))
                throw new Error('weekDays is required.');
            let weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (const iterator of weekDays) {
                if (!weekEnum.includes(iterator)) {
                    throw new Error('please provide valid weekDays.');
                }
            }
        }
        let medicineEnum = ["oneTime", "twoTimes", "threeTimes"];
        if (!medicineEnum.includes(medicinesTime))
            throw new Error('please provide valid medicinesTime.');
        if (medicinesTime === 'oneTime') {
            if (!selectTime1)
                throw new Error('selectTime1 is required.');
        }
        else if (medicinesTime === 'twoTimes') {
            if (!selectTime1)
                throw new Error('selectTime1 is required.');
            if (!selectTime2)
                throw new Error('selectTime2 is required.');
        }
        else if (medicinesTime === 'threeTimes') {
            if (!selectTime1)
                throw new Error('selectTime1 is required.');
            if (!selectTime2)
                throw new Error('selectTime2 is required.');
            if (!selectTime3)
                throw new Error('selectTime3 is required.');
        }
        // let notificationSoundFind = await NOTIFICATION.findOne({ _id : notificationSound , isDeleted : false });
        // if(!notificationSoundFind) throw new Error('notificationSound not found.');
        const files = req.files;
        const photo = (files === null || files === void 0 ? void 0 : files.photo) ? files.photo[0].filename : null;
        const voice = (files === null || files === void 0 ? void 0 : files.voice) ? files.voice[0].filename : null;
        let medicines = yield medicinesModel_1.MEDICINES.create({
            familyId: req.familyId,
            name,
            photo,
            notes,
            voice,
            notificationSound,
            date,
            repeat,
            medicinesTime,
            selectTime1,
            selectTime2,
            selectTime3,
            weekDays: (weekDays === null || weekDays === void 0 ? void 0 : weekDays.length) > 0 ? weekDays : [],
            isAfterfood: isAfterfood,
            createdBy: req.userId,
            isDeleted: false,
            deletedBy: null,
        });
        let medicinesUser = [];
        for (const userId of user) {
            let userMedicines = yield medicinesUser_1.MEDICINES_USER.create({
                medicinesId: medicines._id,
                userId: userId,
                createdBy: req.userId,
                isDeleted: false,
                deletedBy: null,
            });
            medicinesUser.push(userMedicines);
        }
        const data = yield medicinesModel_1.MEDICINES.aggregate([
            {
                $match: { _id: medicines._id, isDeleted: false },
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
                    from: 'medicinesusers',
                    localField: '_id',
                    foreignField: 'medicinesId',
                    as: 'medicinesuser',
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
            key: 'medicinesCreate',
            medicines: result
        };
        main_socket.broadcastMedicines(response, req.familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: result,
            title: result === null || result === void 0 ? void 0 : result.name,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} created new Medicine.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Medicines', object);
        res.status(201).json({
            status: 201,
            message: 'Medicines data was created successfully.',
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
        const newData = yield medicinesModel_1.MEDICINES.find({
            familyId: req.familyId,
            isDeleted: false,
        });
        console.log(newData.length);
        const medicinesIds = newData.map(a => a._id);
        // const medicinesIds :any = newData.filter(a => 
        //     (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
        // ).map(a => a._id)
        const data = yield medicinesModel_1.MEDICINES.aggregate([
            {
                $match: { _id: { $in: medicinesIds } },
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
                    from: 'medicinesusers',
                    localField: '_id',
                    foreignField: 'medicinesId',
                    as: 'medicinesuser',
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
            message: 'Medicines data was retrieved successfully.',
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
        let { id, name, notes, notificationSound, medicinesTime, date, repeat, selectTime1, selectTime2, selectTime3, user, weekDays, isAfterfood } = req.body;
        switch (true) {
            case !id: throw new Error('id is required.');
            case !name: throw new Error('name is required.');
            // case !notes: throw new Error('notes is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            case !date: throw new Error('date is required.');
            case !repeat: throw new Error('repeat is required.');
            case !medicinesTime: throw new Error('medicineTime is required.');
            case isAfterfood != 'true' && isAfterfood != 'false': throw new Error('provide valid isAfterfood.');
            // case !selectTime1: throw new Error('selectTime1 is required.');
            // case !selectTime2: throw new Error('selectTime2 is required.');
            // case !selectTime3: throw new Error('selectTime3 is required.');
            default:
                break;
        }
        if (typeof user === 'string') {
            user = JSON.parse(user);
        }
        if (typeof weekDays === 'string') {
            weekDays = JSON.parse(weekDays);
        }
        let repeatEnum = ["weekly", "monthly", "forNightly", "Daily",];
        console.log(repeat);
        if (!repeatEnum.includes(repeat))
            throw new Error('please provide valid repeat.');
        if (repeat === 'weekly') {
            if (!(weekDays === null || weekDays === void 0 ? void 0 : weekDays.length))
                throw new Error('weekDays is required.');
            let weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (const iterator of weekDays) {
                if (!weekEnum.includes(iterator)) {
                    throw new Error('please provide valid weekDays.');
                }
            }
        }
        let medicineEnum = ["oneTime", "twoTimes", "threeTimes"];
        if (!medicineEnum.includes(medicinesTime))
            throw new Error('please provide valid repeat.');
        if (medicinesTime === 'oneTime') {
            if (!selectTime1)
                throw new Error('selectTime1 is required.');
        }
        else if (medicinesTime === 'twoTimes') {
            if (!selectTime1)
                throw new Error('selectTime1 is required.');
            if (!selectTime2)
                throw new Error('selectTime2 is required.');
        }
        else if (medicinesTime === 'threeTimes') {
            if (!selectTime1)
                throw new Error('selectTime1 is required.');
            if (!selectTime2)
                throw new Error('selectTime2 is required.');
            if (!selectTime3)
                throw new Error('selectTime3 is required.');
        }
        let medicinesFind = yield medicinesModel_1.MEDICINES.findOne({ _id: id, isDeleted: false });
        if (!medicinesFind)
            throw new Error('this medicines id does not exist.');
        if ((medicinesFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this Medicine.');
        }
        if (req.role == 'grandParent') {
            throw new Error('You are not authorized to update this Medicine.');
        }
        // let notificationSoundFind = await NOTIFICATION.findOne({ _id : notificationSound , isDeleted : false });
        // if(!notificationSoundFind) throw new Error('notificationSound not found.');
        const files = req.files;
        const photo = (files === null || files === void 0 ? void 0 : files.photo) ? files.photo[0].filename : medicinesFind.photo;
        const voice = (files === null || files === void 0 ? void 0 : files.voice) ? files.voice[0].filename : medicinesFind.voice;
        let medicines = yield medicinesModel_1.MEDICINES.findByIdAndUpdate(medicinesFind._id, {
            name,
            photo,
            notes,
            voice,
            notificationSound,
            date,
            repeat,
            isAfterfood,
            medicinesTime,
            selectTime1,
            selectTime2,
            selectTime3,
            weekDays: (weekDays === null || weekDays === void 0 ? void 0 : weekDays.length) > 0 ? weekDays : [],
        }, { new: true });
        yield medicinesUser_1.MEDICINES_USER.deleteMany({ medicinesId: medicinesFind._id });
        let medicinesUser = [];
        if (user) {
            for (const userIds of user) {
                let userMedicines = yield medicinesUser_1.MEDICINES_USER.create({
                    medicinesId: medicinesFind._id,
                    userId: userIds,
                    createdBy: req.userId,
                    isDeleted: false,
                    deletedBy: null,
                });
                medicinesUser.push(userMedicines);
            }
        }
        let medicinesFindDatas = yield medicinesModel_1.MEDICINES.findOne({ _id: id, isDeleted: false });
        const data = yield medicinesModel_1.MEDICINES.aggregate([
            {
                $match: { _id: medicinesFindDatas === null || medicinesFindDatas === void 0 ? void 0 : medicinesFindDatas._id, isDeleted: false },
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
                    from: 'medicinesusers',
                    localField: '_id',
                    foreignField: 'medicinesId',
                    as: 'medicinesuser',
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
            key: 'medicinesUpdate',
            medicines: result
        };
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: result,
            title: result === null || result === void 0 ? void 0 : result.name,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} updated Medicine.`
        };
        main_socket.broadcastMedicines(response, req.familyId);
        (0, pushNotification_1.notificationFunction)(req, res, 'Medicines', object);
        res.status(202).json({
            status: 202,
            message: 'Medicines data was updated successfully.',
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
            throw new Error('id is required.');
        let medicinesFind = yield medicinesModel_1.MEDICINES.findOne({ _id: id, isDeleted: false });
        if (!medicinesFind)
            throw new Error('medicines id not found.');
        if ((medicinesFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this medicine.');
        }
        if (req.role == 'grandParent') {
            throw new Error('You are not authorized to delete this medicine.');
        }
        yield medicinesUser_1.MEDICINES_USER.updateMany({ medicinesId: id }, { isDeleted: true, deletedBy: req.userId });
        yield medicinesModel_1.MEDICINES.findByIdAndUpdate(id, {
            isDeleted: true,
            deletedBy: req.userId
        }, { new: true });
        let response = {
            key: 'medicinesDelete',
            medicines: medicinesFind
        };
        main_socket.broadcastMedicines(response, req.familyId);
        let findCurrentUser = yield profileModel_1.PROFILE.findOne({ userId: req.userId });
        let object = {
            data: medicinesFind,
            title: medicinesFind === null || medicinesFind === void 0 ? void 0 : medicinesFind.name,
            body: `${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.firstName} ${findCurrentUser === null || findCurrentUser === void 0 ? void 0 : findCurrentUser.lastName} delete Medicine.`
        };
        (0, pushNotification_1.notificationFunction)(req, res, 'Delete', object);
        res.status(202).json({
            status: 202,
            message: 'Medicines data was deleted successfully.',
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
