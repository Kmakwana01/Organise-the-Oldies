"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADVANCE_WARNING = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    reminderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'reminder'
    },
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'event'
    },
    when: {
        type: String
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
const ADVANCE_WARNING = (0, mongoose_1.model)("advancewarning", schema);
exports.ADVANCE_WARNING = ADVANCE_WARNING;
