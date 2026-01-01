var aes256 = require('aes256');
require('dotenv').config();
// ✅ Your 32-byte hex key (same used for encryption)
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY || 'd30888076a25a02a8c93a28cfc25d5d25f426162b8838de718c27f83dabe4590';
const crypto = require('crypto');
const IV_LENGTH = 16;

function encryptString(strKey, strPlainText){
    try {
        var encryptedPlainText = aes256.encrypt(strKey, strPlainText);
        return encryptedPlainText;  
    } catch(e) {
        console.log(e);
    }
}

function decryptString(strKey, strEncryptedText){
    try {
        var decryptedPlainText = aes256.decrypt(strKey, strEncryptedText);
        return decryptedPlainText; 
    } catch(e) {
        console.log(e);
    }      
}

function generateQueryHash(query) {
  return crypto
    .createHash("md5")
    .update(JSON.stringify(normalizeQuery(query)))
    .digest("hex");
}

function normalizeQuery(query) {
  return Object.keys(query)
    .sort()
    .reduce((acc, key) => {
      acc[key] = query[key];
      return acc;
    }, {});
}

/**
 * Encrypts a secret using AES-256-CBC with the provided master key.
 * @param {string} secret - The plaintext to encrypt.
 * @returns {string} The encrypted secret in format iv:encryptedHex
 */
// const encryptSecret = (secret,keyBuffer) => {
//   const iv = crypto.randomBytes(IV_LENGTH);
//   const key = Buffer.from(API_key, 'hex');
//   const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
//   let encrypted = cipher.update(secret, 'utf8');
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return iv.toString('hex') + ':' + encrypted.toString('hex');
// };

const encryptSecret = (secret, keyBuffer) => {
  if (!Buffer.isBuffer(keyBuffer)) {
    throw new Error("keyBuffer must be a Buffer");
  }
  if (keyBuffer.length !== 32) {
    throw new Error("Invalid key length: must be 32 bytes (256 bits)");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);

  let encrypted = cipher.update(secret, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypts a previously encrypted secret using AES-256-CBC.
 * @param {string} encryptedSecret - The encrypted string in format iv:encryptedHex.
 * @param {string} masterKey - The same 64-char hex master key used for encryption.
 * @returns {string} The decrypted secret as UTF-8 string.
 */
const decryptSecret = (encryptedSecret, API_key) => {
  try {
    const [ivHex, encryptedHex] = encryptedSecret.split(':');
    if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted format');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const key = Buffer.from(API_key, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption error:', err.message);
    throw new Error('Failed to decrypt secret');
  }
};



module.exports = {
    encryptString,
    decryptString,
    encryptSecret,
    decryptSecret,
    generateQueryHash,
}
