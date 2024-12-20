"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    audio: {
        type: String
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
const NOTIFICATION = (0, mongoose_1.model)("notification", schema);
exports.NOTIFICATION = NOTIFICATION;
