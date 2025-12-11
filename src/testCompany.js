const crypto = require('crypto');
require('dotenv').config();

const body = {
  mobile: "0730720001",
  amount: 1,
  transaction_id:"com240825180044567"
};


// 🔐 Replace with valid encrypted secret and key
const secretKey = "68f303f2ecb924a85bb6e799760044f4:652b91dec1cd826e86442fe0d42930bb5b02c2b97bb88b223d9d8de6fdaade38e8591cfe71baf934e6dca15c19619bea3da529c235ae122fdd1b89823651804af9cbc4733bec315acaefcc69f38cd28b";


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
