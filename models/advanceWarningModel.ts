import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Advance {
    reminderId : Schema.Types.ObjectId;
    eventId : Schema.Types.ObjectId;
    when : string;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Advance>(
    {
        reminderId : {
            type : Schema.Types.ObjectId,
            ref : 'reminder'
        },
        eventId : { 
            type : Schema.Types.ObjectId, 
            ref : 'event' 
        },
        when : {
            type : String
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

type advanceDocument = Document & Advance;
const ADVANCE_WARNING = model<advanceDocument>("advancewarning", schema);

export { ADVANCE_WARNING };
