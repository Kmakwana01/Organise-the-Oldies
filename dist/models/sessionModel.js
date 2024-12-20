"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION = void 0;
const mongoose_1 = require("mongoose");
// Schema
const schema = new mongoose_1.Schema({
    notificationToken: {
        type: String,
        required: true
    },
    jwtToken: {
        type: String,
        required: true,
        unique: true
    },
    userAgent: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        required: true,
    },
    deviceName: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    isActive: Boolean,
    generatedAt: {
        timestamp: true,
        type: Date
    },
    createdAt: {
        timestamp: true,
        type: Date,
        default: Date.now
    },
    updatedAt: {
        timestamp: true,
        type: Date,
        default: Date.now
    },
}, { timestamps: true, versionKey: false });
const SESSION = (0, mongoose_1.model)("session", schema);
exports.SESSION = SESSION;
