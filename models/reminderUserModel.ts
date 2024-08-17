import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface ReminderUser {
    reminderId : Schema.Types.ObjectId;
    userId : Schema.Types.ObjectId;
    createdBy : Schema.Types.ObjectId;
    isDeleted: boolean;
    deletedBy: Types.ObjectId;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<ReminderUser>(
    {
        reminderId : {
            type : Schema.Types.ObjectId,
            ref : 'reminder'
        },
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        createdBy : {
            type : Schema.Types.ObjectId,
            ref : 'user'
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

type ReminderDocument = Document & ReminderUser;
const REMINDER_USER = model<ReminderDocument>("reminderuser", schema);

export { REMINDER_USER };
