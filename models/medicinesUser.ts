import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface MedicinesUser {
    medicinesId : Schema.Types.ObjectId;
    userId : Schema.Types.ObjectId;
    createdBy : Schema.Types.ObjectId;
    isDeleted : Boolean;
    deletedBy : Boolean;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<MedicinesUser>(
    {
        medicinesId : {
            type : Schema.Types.ObjectId,
            ref : 'medicines'
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

type MedicinesUserDocument = Document & MedicinesUser;
const MEDICINES_USER = model<MedicinesUserDocument>("medicinesUser", schema);

export { MEDICINES_USER };
