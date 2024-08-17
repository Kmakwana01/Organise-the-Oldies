import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Notification {
    audio : string;
    createdBy : Schema.Types.ObjectId;
    isDeleted: boolean;
    deletedBy: Types.ObjectId;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Notification>(
    {
        audio : {
            type : String
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

type NotificationDocument = Document & Notification;
const NOTIFICATION = model<NotificationDocument>("notification", schema);

export { NOTIFICATION };
