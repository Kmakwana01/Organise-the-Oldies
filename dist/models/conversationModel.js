"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONVERSATION = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    familyId: {
        type: String
    },
    type: {
        type: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const CONVERSATION = (0, mongoose_1.model)("conversation", schema);
exports.CONVERSATION = CONVERSATION;
