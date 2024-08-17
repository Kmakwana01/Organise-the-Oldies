import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface KeyInfoUser {
    keyInfoId : Schema.Types.ObjectId;
    userId : Schema.Types.ObjectId;
    createdBy : Schema.Types.ObjectId;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<KeyInfoUser>(
    {
        keyInfoId : {
            type : Schema.Types.ObjectId,
            ref : 'keyInfo'
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

type keyInfoUserDocument = Document & KeyInfoUser;
const KEY_INFO_USER = model<keyInfoUserDocument>("keyInfoUser", schema);

export { KEY_INFO_USER };
