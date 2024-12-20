"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTACT = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    address: {
        type: String,
    },
    familyId: {
        type: String
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    isDeleted: {
        type: Boolean,
    },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const CONTACT = (0, mongoose_1.model)("contact", schema);
exports.CONTACT = CONTACT;
