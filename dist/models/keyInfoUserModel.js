"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEY_INFO_USER = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    keyInfoId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'keyInfo'
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
const KEY_INFO_USER = (0, mongoose_1.model)("keyInfoUser", schema);
exports.KEY_INFO_USER = KEY_INFO_USER;
