"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptPassword = encryptPassword;
exports.decryptPassword = decryptPassword;
const crypto_1 = __importDefault(require("crypto"));
const secretKey = crypto_1.default.randomBytes(32); // 256-bit key for AES-256
const iv = crypto_1.default.randomBytes(16);
function encryptPassword(password) {
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', secretKey, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Combine IV and encrypted text for later use in decryption
    const ivHex = iv.toString('hex');
    return `${ivHex}:${encrypted}`;
}
function decryptPassword(encryptedPassword) {
    const [ivHex, encrypted] = encryptedPassword.split(':');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', secretKey, ivBuffer);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
