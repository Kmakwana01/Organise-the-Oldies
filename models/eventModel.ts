import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Event {
    name : string;
    dateAndTime : Date;
    notificationSound : string;
    familyId : string;
    createdBy : Schema.Types.ObjectId;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Event>(
    {
        name : {
            type : String,
        },
        dateAndTime : {
            type : Date,
        },
        notificationSound : {
            type : String,
        },
        familyId : {
            type : String
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

type eventDocument = Document & Event;
const EVENT = model<eventDocument>("event", schema);

export { EVENT };
