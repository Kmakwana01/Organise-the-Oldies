"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEDICINES_USER = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    medicinesId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'medicines'
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
const MEDICINES_USER = (0, mongoose_1.model)("medicinesUser", schema);
exports.MEDICINES_USER = MEDICINES_USER;
