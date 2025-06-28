const crypto = require('crypto');
require('dotenv').config();

const body = {
  mobile: "0730720001",
  amount: 5,
};


// 🔐 Replace with valid encrypted secret and key
const secretKey = "1c36491c990fb7f3eae68562092a772b:e60bb48c781752fb1ca35f9347cd79057e064e6c4594a3793fc75ce4c29696428a8b833985d5df4395427473c01893f1a8ea102a9b1f6aa04040126a0866398f522963dc9d3b05598ef0ef8a73119ef8";


(async () => {
  try {
    // const decryptedSecret = await decryptSecret(encryptedSecret, API_key);
    // console.log("Decrypted Secret:", decryptedSecret);

    const timestamp = Math.floor(Date.now() / 1000);
    const theRequestedTopUp = timestamp + JSON.stringify(body);

    const hmac = crypto.createHmac('sha256', secretKey).update(theRequestedTopUp).digest('hex');
    console.log("X-Timestamp:", timestamp);
    console.log("X-Signature:", hmac);

  } catch (err) {
    console.error("Error:", err.message);
  }
})();
