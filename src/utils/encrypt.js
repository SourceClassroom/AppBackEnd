import * as crypto from "node:crypto";

const algorithm = 'aes-256-gcm';
const ivLength = 16;

export const encrypt = (text) => {
    const secretKey = process.env.ENCRYPTION_SECRET;
    if (!secretKey) throw new Error('ENCRYPT_SECRET tanımlı değil!');
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export const decrypt = (encryptedText) => {
    const secretKey = process.env.ENCRYPTION_SECRET;
    const [ivHex, dataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}