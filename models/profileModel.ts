import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Profile {
    firstName : string;
    lastName : string;
    image : string;
    familyId : string;
    userId : Schema.Types.ObjectId;
    createdBy : Schema.Types.ObjectId;
    isDeleted: boolean;
    deletedBy: Types.ObjectId;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Profile>(
    {
        firstName : {
            type : String,
        },
        lastName : {
            type : String,
        },
        image : { type : String },
        familyId : { type : String },
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        createdBy : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        isDeleted: { type: Boolean },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: "user",
            default: null,
        },
        createdAt : { type: Date , default: Date.now  },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type ProfileDocument = Document & Profile;
const PROFILE = model<ProfileDocument>("profile", schema);

export { PROFILE };
