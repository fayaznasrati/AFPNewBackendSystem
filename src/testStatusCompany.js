const crypto = require('crypto');
require('dotenv').config();

const body = {
  username: "AFP-77454",
  company_name: "Test Company 77454",
  // amount: 2,
  // mobile: "0730720001",
  channelType: "Company",
};

const decryptSecret = async (encryptedSecret, API_key) => {
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

// 🔐 Replace with valid encrypted secret and key
const encryptedSecret = "2b6c599b24862a595029d03d4a3d4dba:9d2186aa5d3e3df5cebd21f4f3f63a7492ba444ab970483a85d2df07151afa1fb03876b1ed852ac8b4762707d597f0943d77f215f504eba67a00d6373d3225de65ac2853f306f23e60463b57d3e01d9b";
const API_key =  '1c38d428d6adda29e674f235829b45e114f8fe2acff23d7cc0b506d1331bfe9a';

(async () => {
  try {
    const decryptedSecret = await decryptSecret(encryptedSecret, API_key);
    console.log("Decrypted Secret:", decryptedSecret);

    const timestamp = Math.floor(Date.now() / 1000);
    const message = timestamp + JSON.stringify(body);

    const hmac = crypto.createHmac('sha256', decryptedSecret).update(message).digest('hex');
    console.log("X-Timestamp:", timestamp);
    console.log("X-Signature:", hmac);

  } catch (err) {
    console.error("Error:", err.message);
  }
})();
