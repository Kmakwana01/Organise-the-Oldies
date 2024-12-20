"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVITY = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    sessionId: mongoose_1.Schema.Types.ObjectId,
    apiPath: { type: String },
    createdAt: Number,
    updatedAt: Number
}, { timestamps: true, versionKey: false });
const ACTIVITY = (0, mongoose_1.model)("activity", schema);
exports.ACTIVITY = ACTIVITY;
