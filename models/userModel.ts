import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

enum UserRole {
    Parent = "parent",
    GrandParent = "grandParent",
    Sibling = "sibling",
}

interface User {
    email: string;
    role : UserRole;
    password : string;
    isEmailVerifyed : boolean;
    isDeleted: boolean;
    deletedBy: Types.ObjectId;
    socialMediaType: String;
    createdAt : Date;
    updatedAt : Date;
    
}

const schema:any = new Schema<User>(
    {
        email : {type : String},
        role : {
            type: String,
            enum: Object.values(UserRole),
        },
        password : {type : String},
        isEmailVerifyed : {
            type : Boolean,
        },
        isDeleted: { type: Boolean },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: "user",
            default: null,
        },
        socialMediaType: {
            type: String,
            enum: ["Apple", "Google"],
            default: null,
        },
        createdAt : { type: Date , default: Date.now  },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type UserDocument = Document & User;
const USER = model<UserDocument>("user", schema);

export { USER };
