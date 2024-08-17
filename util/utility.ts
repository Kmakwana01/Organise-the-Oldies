import crypto from 'crypto';

const secretKey = crypto.randomBytes(32); // 256-bit key for AES-256
const iv = crypto.randomBytes(16);

export function encryptPassword(password : any) {
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Combine IV and encrypted text for later use in decryption
    const ivHex = iv.toString('hex');
    return `${ivHex}:${encrypted}`;
}

export function decryptPassword(encryptedPassword : any) {
    const [ivHex, encrypted] = encryptedPassword.split(':');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, ivBuffer);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
