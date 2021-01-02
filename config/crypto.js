const crypto = require('crypto');
const md5 = require('md5');
const settings = require('./appSettings');
const algorithm = 'aes-256-ctr';
const encrypt_key = process.env.encryption_key || settings.encryption_key;
const secretKey = md5(encrypt_key);
const iv = crypto.randomBytes(16);
const encrypt = (text) => {

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(text)), cipher.final()]);
    
    return {
        key: iv.toString('hex'),
        token: encrypted.toString('hex')
    };
};

const decrypt = (hash) => {

    try {
        const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.key, 'hex'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.token, 'hex')), decipher.final()]);
        return JSON.parse(decrpyted.toString());
    } catch (err) {
        return null;
    }
    
};

module.exports = {
    encrypt,
    decrypt
};