import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface EventGrandParent {
    eventId : Schema.Types.ObjectId;
    userId : Schema.Types.ObjectId;
    createdBy : Schema.Types.ObjectId;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<EventGrandParent>(
    {
        eventId : {
            type : Schema.Types.ObjectId,
            ref : 'event'
        },
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'user'
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

type eventDocument = Document & EventGrandParent;
const EVENT_USER = model<eventDocument>("eventusers", schema);

export { EVENT_USER };
