import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Conversation {
    familyId : string;
    type : string;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Conversation>(
    {
        familyId : {
            type : String
        },
        type : {
            type : String
        },
        createdAt : { type: Date , default: Date.now },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type conversationDocument = Document & Conversation;
const CONVERSATION = model<conversationDocument>("conversation", schema);

export { CONVERSATION };
