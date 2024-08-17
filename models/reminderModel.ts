import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

enum Repeat {
    Monthly = 'monthly',
    Weekly = 'weekly',
    ForNightly = 'forNightly',
    None = 'Daily'
}

interface Reminder {
    title : string;
    notes : string;
    voice : string;
    notificationSound : Schema.Types.ObjectId;
    repeat : Repeat;
    weekDays : string[];
    date : Date;
    familyId : string;
    createdBy : Schema.Types.ObjectId;
    isDeleted: boolean;
    deletedBy: Types.ObjectId;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Reminder>(
    {
        title : {
            type : String
        },
        notes : {
            type : String
        },
        voice : {
            type : String
        },
        notificationSound : {
            type : String
            // type : Schema.Types.ObjectId,
            // ref : 'notification'
        },
        repeat : {
            type : String,
            enum: Object.values(Repeat),
        },
        date : {
            type : Date
        },
        familyId : {
            type : String
        },
        createdBy : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        weekDays : {
            type: [String],
            enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
        isDeleted: { type: Boolean },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: "user",
            default: null,
        },
        createdAt : { type: Date , default: Date.now  },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type ReminderDocument = Document & Reminder;
const REMINDER = model<ReminderDocument>("reminder", schema);

export { REMINDER };
