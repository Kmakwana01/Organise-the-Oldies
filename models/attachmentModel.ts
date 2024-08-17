import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Attachment {
    path : string;
    mimeType : string;
    fileSize : string;
    isInTrash : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Attachment>(
    {
        path : {
            type : String,
        },
        mimeType : {
            type : String,
        },
        fileSize : {
            type : String,
        },
        isInTrash : {
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

type attachmentDocument = Document & Attachment;
const ATTACHMENT = model<attachmentDocument>("attachment", schema);

export { ATTACHMENT };
