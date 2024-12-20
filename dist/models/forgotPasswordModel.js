"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORGOT_PASSWORD = void 0;
const mongoose_1 = require("mongoose");
// Schema
const schema = new mongoose_1.Schema({
    email: { type: String },
    verificationCode: { type: Number },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const FORGOT_PASSWORD = (0, mongoose_1.model)("forgotPassword", schema);
exports.FORGOT_PASSWORD = FORGOT_PASSWORD;
