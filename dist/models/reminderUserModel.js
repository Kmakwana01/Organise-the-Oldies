"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMINDER_USER = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    reminderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'reminder'
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    isDeleted: { type: Boolean },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "user",
        default: null,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const REMINDER_USER = (0, mongoose_1.model)("reminderuser", schema);
exports.REMINDER_USER = REMINDER_USER;
