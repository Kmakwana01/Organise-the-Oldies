import mongoose, { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface GiveMedicine {
    userId : Schema.Types.ObjectId;
    medicinesId : Schema.Types.ObjectId;
    isTaken : boolean;
    time : string;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<GiveMedicine>(
    {
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        medicinesId : {
            type : Schema.Types.ObjectId,
            ref : 'medicines'
        },
        isTaken : Boolean,
        time : String,
        createdAt : { type: Date , default: Date.now },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type GiveMedicineDocument = Document & GiveMedicine;
const MEDICINES_TAKEN = model<GiveMedicineDocument>("medicinestaken", schema);

export { MEDICINES_TAKEN };
