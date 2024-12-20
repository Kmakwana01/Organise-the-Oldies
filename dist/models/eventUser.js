"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_USER = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'event'
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
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
const EVENT_USER = (0, mongoose_1.model)("eventusers", schema);
exports.EVENT_USER = EVENT_USER;
