import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

// Document interface
interface forgotPassword {
    email : string;
    verificationCode: number;
    expiresAt : Date;
    createdAt : Date;
    updatedAt : Date;
}

// Schema
const schema:any = new Schema<forgotPassword>(
    {
        email: { type: String},
        verificationCode : { type: Number},
        expiresAt : { type: Date },
        createdAt : { type: Date , default: Date.now  },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type UserDocument = Document & forgotPassword;
const FORGOT_PASSWORD = model<UserDocument>("forgotPassword", schema);

export { FORGOT_PASSWORD };
