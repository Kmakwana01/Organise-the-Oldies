"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTACHMENT = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    path: {
        type: String,
    },
    mimeType: {
        type: String,
    },
    fileSize: {
        type: String,
    },
    isInTrash: {
        type: Boolean,
    },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const ATTACHMENT = (0, mongoose_1.model)("attachment", schema);
exports.ATTACHMENT = ATTACHMENT;
