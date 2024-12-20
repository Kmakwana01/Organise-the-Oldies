"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    image: { type: String },
    familyId: { type: String },
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
const PROFILE = (0, mongoose_1.model)("profile", schema);
exports.PROFILE = PROFILE;
