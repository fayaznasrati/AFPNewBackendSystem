const crypto = require('crypto');
require('dotenv').config();

const body = {
  mobile: "0730720001",
  amount: 7,
  transaction_id:"com240825180044567"
};


// 🔐 Replace with valid encrypted secret and key
const secretKey = "a0f31d3f9325cf1f3164b9fad47b62f8:7e1ca257a6a01f70c476ba7d44cd4d409516298e5aeff0b4e47148638a8f1ea38ed63307ff952f5d3cfcc7a69e76ce28ca3e7635af04750b6f35a4a6581ff4b404d61da34234639d44d1ffdee4786a6b";


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
