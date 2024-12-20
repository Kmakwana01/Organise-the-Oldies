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
exports.getMedicineDetails = exports.create = void 0;
const medicinesTakenModel_1 = require("../models/medicinesTakenModel");
const medicinesModel_1 = require("../models/medicinesModel");
const profileModel_1 = require("../models/profileModel");
const mongoose_1 = __importDefault(require("mongoose"));
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { medicinesId, isTaken, userId, time } = req.body;
        switch (true) {
            case !medicinesId: throw new Error('medicinesId is required.');
            case typeof isTaken !== "boolean": throw new Error('isTaken is required.');
            case !userId: throw new Error('userId is required.');
            case !time: throw new Error('time is required.');
            default:
                break;
        }
        const userFind = yield profileModel_1.PROFILE.findOne({ userId, familyId: req.familyId });
        if (!userFind)
            throw new Error('user not found.');
        const medicinesFind = yield medicinesModel_1.MEDICINES.findOne({ _id: medicinesId, familyId: req.familyId });
        if (!medicinesFind)
            throw new Error('medicines not found in your family.');
        let data;
        if (isTaken === false) {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            let findIsMedicineTaken = yield medicinesTakenModel_1.MEDICINES_TAKEN.findOne({
                medicinesId,
                userId,
                time,
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            });
            if (findIsMedicineTaken) {
                yield findIsMedicineTaken.deleteOne();
            }
            else {
                throw new Error('data not found.');
            }
        }
        else if (isTaken === true) {
            data = yield medicinesTakenModel_1.MEDICINES_TAKEN.create({
                medicinesId,
                isTaken,
                userId,
                time
            });
        }
        res.status(201).json({
            status: 201,
            message: 'Medicines taken update successfully.',
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
exports.create = create;
const getMedicineDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { medicinesId, userId } = req.body;
        switch (true) {
            case !medicinesId: throw new Error('medicinesId is required.');
            case !userId: throw new Error('userId is required.');
            default:
                break;
        }
        const userFind = yield profileModel_1.PROFILE.findOne({ userId });
        if (!userFind)
            throw new Error('user not found.');
        const medicinesFind = yield medicinesModel_1.MEDICINES.findOne({ _id: medicinesId });
        if (!medicinesFind)
            throw new Error('medicines not found.');
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const isTakenData = yield medicinesTakenModel_1.MEDICINES_TAKEN.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    medicinesId: new mongoose_1.default.Types.ObjectId(medicinesId),
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            }
        ]);
        res.status(201).json({
            status: 201,
            message: 'getMedicineDetails get successfully.',
            data: isTakenData
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.getMedicineDetails = getMedicineDetails;
