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
exports.csvFile = exports.deleteContact = exports.update = exports.get = exports.create = void 0;
const contactModel_1 = require("../models/contactModel");
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const main_socket = require("../socket");
const email_1 = require("../util/email");
const create = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, phoneNumber, address } = req.body;
        switch (true) {
            case !firstName: throw new Error('firstName is required.');
            case !lastName: throw new Error('lastName is required.');
            case !email: throw new Error('email is required.');
            case !phoneNumber: throw new Error('phoneNumber is required.');
            case !address: throw new Error('address is required.');
            default:
                break;
        }
        const contactFind = yield contactModel_1.CONTACT.findOne({ phoneNumber: phoneNumber, isDeleted: false, familyId: req.familyId });
        if (contactFind)
            throw new Error('Phone number already in use.');
        const emailFind = yield contactModel_1.CONTACT.findOne({ email: email, isDeleted: false, familyId: req.familyId });
        if (emailFind)
            throw new Error('Email already in use.');
        const data = yield contactModel_1.CONTACT.create({
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
            familyId: req.familyId,
            createdBy: req.userId,
            isDeleted: false,
            deletedBy: null,
        });
        let response = {
            key: 'contactCreate',
            contact: [data]
        };
        main_socket.broadcastContact(response, req.familyId);
        res.status(201).json({
            status: 201,
            message: 'Your contact created successfully.',
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
        const data = yield contactModel_1.CONTACT.find({ familyId: req.familyId, isDeleted: false }).lean();
        res.status(200).json({
            status: 200,
            message: 'Your family contact list retrieved successfully.',
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
        const { id, firstName, lastName, email, phoneNumber, address } = req.body;
        switch (true) {
            case !id: throw new Error('contact id is required.');
            case !firstName: throw new Error('firstName is required.');
            case !lastName: throw new Error('lastName is required.');
            case !email: throw new Error('email is required.');
            case !phoneNumber: throw new Error('phoneNumber is required.');
            case !address: throw new Error('address is required.');
            default:
                break;
        }
        const contactDataFind = yield contactModel_1.CONTACT.findOne({ _id: id, isDeleted: false });
        if (!contactDataFind)
            throw new Error('This id data does not exist.');
        const contactFind = yield contactModel_1.CONTACT.findOne({ phoneNumber: phoneNumber, familyId: req.familyId, isDeleted: false });
        if (contactFind && contactFind._id.toString() !== req.body.id)
            throw new Error('This phone Number already used.');
        const emailFind = yield contactModel_1.CONTACT.findOne({ email: email, familyId: req.familyId, isDeleted: false });
        if (emailFind && emailFind._id.toString() !== req.body.id)
            throw new Error('This email already used.');
        if ((contactDataFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this contact.');
        }
        if (req.role == 'grandParent') {
            if (contactDataFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to update this contact.');
            }
        }
        const data = yield contactModel_1.CONTACT.findByIdAndUpdate(contactDataFind._id, {
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
        }, { new: true });
        let response = {
            key: 'contactUpdate',
            contact: [data]
        };
        main_socket.broadcastContact(response, req.familyId);
        res.status(202).json({
            status: 202,
            message: 'Contact updated successfully.',
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
exports.update = update;
const deleteContact = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        if (!id)
            throw new Error('id is required.');
        let contactFind = yield contactModel_1.CONTACT.findOne({ _id: id, isDeleted: false });
        if (!contactFind)
            throw new Error('This contact id does not exist.');
        if ((contactFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this contact.');
        }
        if (req.role == 'grandParent') {
            if (contactFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to delete this contact.');
            }
        }
        yield contactModel_1.CONTACT.findByIdAndUpdate(contactFind._id, {
            isDeleted: true,
            deletedBy: req.userId
        }, { new: true });
        let response = {
            key: 'contactDelete',
            contact: [contactFind]
        };
        main_socket.broadcastContact(response, req.familyId);
        res.status(202).json({
            status: 202,
            message: 'Contact deleted successfully.',
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
exports.deleteContact = deleteContact;
const csvFile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const filePath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
        if (!filePath) {
            return res.status(400).json({
                status: 'Fail',
                message: 'No file uploaded.'
            });
        }
        const contacts = [];
        let newContactData;
        fs_1.default.createReadStream(filePath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            contacts.push({
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phoneNumber: row.phoneNumber,
                address: row.address,
                isDeleted: false,
                deletedBy: null,
                createdBy: req.userId,
                familyId: req.familyId
            });
        })
            .on('end', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                newContactData = yield contactModel_1.CONTACT.insertMany(contacts);
                fs_1.default.unlink(filePath, (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({
                            status: 500,
                            message: 'An error occurred while deleting the file.'
                        });
                        return;
                    }
                });
                let response = {
                    key: 'contactCSV',
                    contact: newContactData
                };
                main_socket.broadcastContact(response, req.familyId);
                res.status(201).json({
                    status: 201,
                    message: 'CSV file data uploaded successfully.'
                });
            }
            catch (error) {
                res.status(400).json({
                    status: 'Fail',
                    message: error.message
                });
            }
        }))
            .on('error', (error) => {
            res.status(400).json({
                status: 'Fail',
                message: error.message
            });
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
exports.csvFile = csvFile;
