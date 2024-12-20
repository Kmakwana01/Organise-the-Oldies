"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEDICINES_TAKEN = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    medicinesId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'medicines'
    },
    isTaken: Boolean,
    time: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const MEDICINES_TAKEN = (0, mongoose_1.model)("medicinestaken", schema);
exports.MEDICINES_TAKEN = MEDICINES_TAKEN;
