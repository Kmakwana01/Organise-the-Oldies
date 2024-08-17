import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface KeyInfo {
    keyInfo : string;
    familyId : string;
    createdBy : Schema.Types.ObjectId;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<KeyInfo>(
    {
        keyInfo : {
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

type keyInfoDocument = Document & KeyInfo;
const KEY_INFO = model<keyInfoDocument>("keyInfo", schema);

export { KEY_INFO };
