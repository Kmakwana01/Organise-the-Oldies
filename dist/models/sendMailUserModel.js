"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEND_MAIL_USER = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    time: String,
    familyId: String,
    isActive: Boolean,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const SEND_MAIL_USER = (0, mongoose_1.model)("sendMailUser", schema);
exports.SEND_MAIL_USER = SEND_MAIL_USER;
