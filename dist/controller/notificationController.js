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
exports.deleteData = exports.get = exports.create = void 0;
const notificationModel_1 = require("../models/notificationModel");
const email_1 = require("../util/email");
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const audio = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        if (!audio)
            throw new Error('Audio file not found.');
        const data = yield notificationModel_1.NOTIFICATION.create({
            audio,
            createdBy: req.userId,
            isDeleted: false,
            deletedBy: null,
        });
        res.status(201).json({
            status: 201,
            message: 'Notification sound created successfully.',
            data
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
        const response = yield notificationModel_1.NOTIFICATION.find({ isDeleted: false });
        res.status(200).json({
            status: 200,
            message: 'Notification data retrieved successfully.',
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
const deleteData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        if (!id)
            throw new Error('id is required.');
        const data = yield notificationModel_1.NOTIFICATION.findByIdAndUpdate(id, {
            isDeleted: true,
            deletedBy: req.userId
        }, { new: true });
        if (!data)
            throw new Error('Notification not found.');
        res.status(202).json({
            status: 202,
            message: 'Notification deleted successfully.',
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
