import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

enum Repeat {
    weekly = 'weekly',
    monthly = 'monthly',
    none = 'Daily',
    forNightly = 'forNightly',
}

enum MedicinesTime {
    oneTime = 'oneTime',
    twoTimes = 'twoTimes',
    threeTimes = 'threeTimes',
}

interface Medicines {
    familyId : string;
    name : string;
    photo : string;
    notes : string;
    voice : string;
    notificationSound : Schema.Types.ObjectId;
    date : Date;
    repeat : Repeat;
    medicinesTime : MedicinesTime;
    selectTime1 : string;
    selectTime2 : string;
    selectTime3 : string;
    isAfterfood : boolean;
    weekDays : string[];
    createdBy : Schema.Types.ObjectId;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Medicines>(
    {
        familyId : {
            type : String
        },
        name : { type : String },
        photo : { type : String },
        notes : { type : String },
        voice : { type : String },
        notificationSound : {
            type : String
            // type : Schema.Types.ObjectId,
            // ref : 'notification'
        },
        date : { type : Date },
        repeat : {
            type : String,
            enum : Object.values(Repeat)
        },
        medicinesTime : {
            type : String,
            enum : Object.values(MedicinesTime)
        },
        selectTime1 : { type : String },
        selectTime2 : { type : String },
        selectTime3 : { type : String },
        isAfterfood : { type : Boolean },
        weekDays : {
            type: [String],
            enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], 
        },
        createdBy : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        isDeleted : {
            type : Boolean,
        },
        deletedBy : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        createdAt : { type: Date , default: Date.now },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type MedicinesDocument = Document & Medicines;
const MEDICINES = model<MedicinesDocument>("medicines", schema);

export { MEDICINES };
