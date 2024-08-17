import mongoose, { Document, Schema, Model, mongo } from 'mongoose';

// Define the interface for the User document
interface ISubscriptionWebhook extends Document {
    familyId: string;
    from: string;
    originalTransactionId: string;
    platform: string;
    productId: string;
    receipt: string;
    response: string;
    token: string;
    price: string;
    expiresAt: String;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const UserSchema: Schema<ISubscriptionWebhook> = new Schema(
    {
        familyId : {
            type : String
        },
        from : String,
        originalTransactionId : String,
        platform : String,
        productId : String,
        receipt : String,
        response : String,
        price : String,
        token : String,
        expiresAt : String,
        isDeleted: Boolean,
        createdAt: Date,
        updatedAt: Date
    },
    { timestamps: true, versionKey: false }
);

// Create and export the model
export const SUBSCRIPTION_WEBHOOK: Model<ISubscriptionWebhook> = mongoose.model<ISubscriptionWebhook>('subscriptionwebhook', UserSchema);
