import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

// Document interface
interface session {
    notificationToken : string;
    jwtToken : string;
    userAgent : string;
    ipAddress : string;
    deviceName : string;
    platform : string;
    userId : Schema.Types.ObjectId;
    isActive : boolean;
    generatedAt : Date;
    createdAt : Date;
    updatedAt : Date;
}

// Schema
const schema:any = new Schema<session>(
    {
        notificationToken: {
            type: String,
            required: true
        },
        jwtToken: {
            type: String,
            required: true,
            unique: true
        },
        userAgent: {
            type: String,
            required: true,
        },
        ipAddress: {
            type: String,
            required: true,
        },
        deviceName: {
            type: String,
            required: true,
        },
        platform: {
            type: String,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        isActive : Boolean,
        generatedAt: {
            timestamp: true,
            type: Date
        },
        createdAt : {
            timestamp: true,
            type: Date,
            default : Date.now
        },
        updatedAt: {
            timestamp: true,
            type: Date,
            default : Date.now
        },
    },{ timestamps: true, versionKey: false }
);

type UserDocument = Document & session;
const SESSION = model<UserDocument>("session", schema);

export { SESSION };
