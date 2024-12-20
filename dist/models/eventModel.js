"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    name: {
        type: String,
    },
    dateAndTime: {
        type: Date,
    },
    notificationSound: {
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
const EVENT = (0, mongoose_1.model)("event", schema);
exports.EVENT = EVENT;
