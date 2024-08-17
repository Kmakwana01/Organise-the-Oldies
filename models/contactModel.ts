import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Contact {
    firstName : string;
    lastName : string;
    email : string;
    phoneNumber : string;
    address : string;
    familyId : string;
    createdBy : Schema.Types.ObjectId;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Contact>(
    {
        firstName : {
            type : String,
        },
        lastName : {
            type : String,
        },
        email : {
            type : String,
        },
        phoneNumber : {
            type : String,
        },
        address : {
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

type contactDocument = Document & Contact;
const CONTACT = model<contactDocument>("contact", schema);

export { CONTACT };
