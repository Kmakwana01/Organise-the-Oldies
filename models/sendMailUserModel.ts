import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface SendMailUser {
    userId : Schema.Types.ObjectId;
    time : string;
    familyId : string;
    isActive : boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<SendMailUser>(
    {
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        time : String,
        familyId : String,
        isActive : Boolean,
        createdAt : { type: Date , default: Date.now },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type SendMailUserDocument = Document & SendMailUser;
const SEND_MAIL_USER = model<SendMailUserDocument>("sendMailUser", schema);

export { SEND_MAIL_USER };
