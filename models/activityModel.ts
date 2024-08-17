import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface activity {
    sessionId : Schema.Types.ObjectId;
    apiPath : string;
    createdAt : number;
    updatedAt : number;
}

const schema:any = new Schema<activity>(
    {
        sessionId : Schema.Types.ObjectId,
        apiPath : { type : String },
        createdAt : Number,
        updatedAt : Number
    },{ timestamps: true, versionKey: false }
);

type UserDocument = Document & activity;
const ACTIVITY = model<UserDocument>("activity", schema);

export { ACTIVITY };
