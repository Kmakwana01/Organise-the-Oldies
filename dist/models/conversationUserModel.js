"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONVERSATION_USER = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'conversation'
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const CONVERSATION_USER = (0, mongoose_1.model)("conversationuser", schema);
exports.CONVERSATION_USER = CONVERSATION_USER;
