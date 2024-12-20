"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEY_INFO = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    keyInfo: {
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
const KEY_INFO = (0, mongoose_1.model)("keyInfo", schema);
exports.KEY_INFO = KEY_INFO;
