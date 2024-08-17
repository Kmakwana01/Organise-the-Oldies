import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Chat {
    text : string;
    attachmentId : Schema.Types.ObjectId;
    conversationId : Schema.Types.ObjectId;
    familyId : string;
    postBy : Schema.Types.ObjectId;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Chat>(
    {
        text : {
            type : String
        },
        attachmentId : {
            type : Schema.Types.ObjectId,
            ref : 'attachment'
        },
        conversationId : {
            type : Schema.Types.ObjectId,
            ref : 'conversation'
        },
        familyId : {
            type : String
        },
        postBy : {
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

type chatDocument = Document & Chat;
const CHAT = model<chatDocument>("chat", schema);

export { CHAT };
