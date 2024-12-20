"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    accessToken: {
        type: String
    },
    refreshToken: {
        type: String
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const TOKEN = (0, mongoose_1.model)("token", schema);
exports.TOKEN = TOKEN;
