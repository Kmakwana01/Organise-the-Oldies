"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMINDER = void 0;
const mongoose_1 = require("mongoose");
var Repeat;
(function (Repeat) {
    Repeat["Monthly"] = "monthly";
    Repeat["Weekly"] = "weekly";
    Repeat["ForNightly"] = "forNightly";
    Repeat["None"] = "Daily";
})(Repeat || (Repeat = {}));
const schema = new mongoose_1.Schema({
    title: {
        type: String
    },
    notes: {
        type: String
    },
    voice: {
        type: String
    },
    notificationSound: {
        type: String
        // type : Schema.Types.ObjectId,
        // ref : 'notification'
    },
    repeat: {
        type: String,
        enum: Object.values(Repeat),
    },
    date: {
        type: Date
    },
    familyId: {
        type: String
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'user'
    },
    weekDays: {
        type: [String],
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
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
const REMINDER = (0, mongoose_1.model)("reminder", schema);
exports.REMINDER = REMINDER;
