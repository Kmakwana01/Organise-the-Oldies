import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

interface Token {
    accessToken : string;
    refreshToken : string;
    userId : Schema.Types.ObjectId;
    createdAt : Date;
    updatedAt : Date;
}

const schema:any = new Schema<Token>(
    {
        accessToken : {
            type : String
        },
        refreshToken : { 
            type : String 
        },
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        createdAt : { type: Date , default: Date.now },
        updatedAt : { type: Date , default: Date.now }
    },{ timestamps: true, versionKey: false }
);

type TokenDocument = Document & Token;
const TOKEN = model<TokenDocument>("token", schema);

export { TOKEN };
