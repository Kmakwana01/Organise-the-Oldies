import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface ConversationUser {
    conversationId : Schema.Types.ObjectId;
    userId : Schema.Types.ObjectId;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<ConversationUser>(
    {
        conversationId : {
            type : Schema.Types.ObjectId,
            ref : 'conversation'
        },
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        createdAt : { type: Date , default: Date.now },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type ConversationUserDocument = Document & ConversationUser;
const CONVERSATION_USER = model<ConversationUserDocument>("conversationuser", schema);

export { CONVERSATION_USER };
