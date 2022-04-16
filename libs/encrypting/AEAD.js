const Crypto = require('crypto');

const ALGORITM = 'sha512'
const CRYPTING_ALGORITM = 'aes-256-gcm'
const key = process.env.APP_KEY

const genNumberCode = (max, min) => {
    return Math.floor(
        Math.random() * (max - 1 + 1) + min
    )
}

const genHashPassword = (password) => {
    return new Promise( resolve => {
        let salt = Crypto.randomBytes(128).toString('base64');
        let iterations = genNumberCode(10000, 1000);

        let hash = Crypto.pbkdf2Sync(password, salt, iterations, 64, ALGORITM).toString(`hex`);

        resolve({
            hash: hash,
            salt: salt,
            iterations: iterations
        });
    });
}

const verifyHashPassword = (hash, salt, iterations, password) => {
    return new Promise( resolve => {

        let hashed = Crypto.pbkdf2Sync(password, salt, iterations, 64, ALGORITM).toString(`hex`);
        let isValid = false
        if (hash === hashed) {
            isValid = true
        }
        resolve(isValid)
    });
}

const encrypt = (text) => {
    let string = null
    if (typeof text === 'object') {
        string = JSON.stringify(text);
    }else{
        string = text
    }


    const iv = Crypto.randomBytes(12);

    const cipher = Crypto.createCipheriv(CRYPTING_ALGORITM, Buffer.from(key, 'base64'), iv);
    // let encrypted = cipher.update(text);
    const encrypted = Buffer.concat([cipher.update(string), cipher.final()]);

    const auth = cipher.getAuthTag().toString('base64')

    const cipherText = JSON.stringify({ iv: iv.toString('base64'), encryptedData: encrypted.toString('base64'), auth: auth })

    return Buffer.from(cipherText).toString('base64');
}

const decrypt = (text) => {
    const chiperText = JSON.parse(Buffer.from(text, 'base64'))

    const iv = Buffer.from(chiperText.iv, 'base64');

    const encryptedText = Buffer.from(chiperText.encryptedData, 'base64');
    const decipher = Crypto.createDecipheriv(CRYPTING_ALGORITM, Buffer.from(key, 'base64'), iv);

    // let decrypted = decipher.update(encryptedText);

    const auth = Buffer.from(chiperText.auth, 'base64')
    decipher.setAuthTag(auth)

    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

    return decrypted.toString();
}

module.exports = {
    genNumberCode,
    genHashPassword,
    verifyHashPassword,

    encrypt,
    decrypt
};
