"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER = void 0;
const mongoose_1 = require("mongoose");
var UserRole;
(function (UserRole) {
    UserRole["Parent"] = "parent";
    UserRole["GrandParent"] = "grandParent";
    UserRole["Sibling"] = "sibling";
})(UserRole || (UserRole = {}));
const schema = new mongoose_1.Schema({
    email: { type: String },
    role: {
        type: String,
        enum: Object.values(UserRole),
    },
    password: { type: String },
    isEmailVerifyed: {
        type: Boolean,
    },
    isDeleted: { type: Boolean },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "user",
        default: null,
    },
    socialMediaType: {
        type: String,
        enum: ["Apple", "Google"],
        default: null,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
const USER = (0, mongoose_1.model)("user", schema);
exports.USER = USER;
