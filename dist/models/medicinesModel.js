"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEDICINES = void 0;
const mongoose_1 = require("mongoose");
var Repeat;
(function (Repeat) {
    Repeat["weekly"] = "weekly";
    Repeat["monthly"] = "monthly";
    Repeat["none"] = "Daily";
    Repeat["forNightly"] = "forNightly";
})(Repeat || (Repeat = {}));
var MedicinesTime;
(function (MedicinesTime) {
    MedicinesTime["oneTime"] = "oneTime";
    MedicinesTime["twoTimes"] = "twoTimes";
    MedicinesTime["threeTimes"] = "threeTimes";
})(MedicinesTime || (MedicinesTime = {}));
const schema = new mongoose_1.Schema({
    familyId: {
        type: String
    },
    name: { type: String },
    photo: { type: String },
    notes: { type: String },
    voice: { type: String },
    notificationSound: {
        type: String
        // type : Schema.Types.ObjectId,
        // ref : 'notification'
    },
    date: { type: Date },
    repeat: {
        type: String,
        enum: Object.values(Repeat)
    },
    medicinesTime: {
        type: String,
        enum: Object.values(MedicinesTime)
    },
    selectTime1: { type: String },
    selectTime2: { type: String },
    selectTime3: { type: String },
    isAfterfood: { type: Boolean },
    weekDays: {
        type: [String],
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
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
const MEDICINES = (0, mongoose_1.model)("medicines", schema);
exports.MEDICINES = MEDICINES;
