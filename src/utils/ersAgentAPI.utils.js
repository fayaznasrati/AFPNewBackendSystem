

const axios = require("axios");
const dotenv = require("dotenv");
const redisMaster = require("../common/master/radisMaster.common"); // adjust path as needed

dotenv.config();

const ERS_BASE_URL =
  process.env.ERS_511_BASE_URL || "https://testapi1.afghan-pay.com/api/v1";

// ---------------------------------------------------------------------------
// 🧠 Helper: Build Redis key unique to each user/password
// ---------------------------------------------------------------------------
function makeRedisKey(username, password) {
  return `ERS_TOKEN_${username}_${Buffer.from(password).toString("base64")}`;
}

// ---------------------------------------------------------------------------
// 🔐 Login to ERS (with Redis caching)
// ---------------------------------------------------------------------------
async function ersLogin(username, password, forceRefresh = false) {
  try {
    const redisKey = makeRedisKey(username, password);

    // 1️⃣ Try cached token (unless forceRefresh is true)
    if (!forceRefresh) {
      const cached = await redisMaster.asyncGet(redisKey);
      if (cached) {
        const { token, userId } = JSON.parse(cached);
        console.log(`[ERS] Using cached token for ${username}`);
        return { token, userId };
      }
    }

    // 2️⃣ Otherwise perform fresh login
    const payload = {
      username,
      password,
      userApplicationType: "Web",
    };

    const { data } = await axios.post(`${ERS_BASE_URL}/agent/login`, payload);
    console.log(`[ERS] Logged in as ${data.userid}`);

    // 3️⃣ Cache token for 15 minutes (900 seconds)
    const value = JSON.stringify({ token: data.token, userId: data.userid });
    redisMaster.post(redisKey, value);
    redisMaster.exp(redisKey, 900);

    return { token: data.token, userId: data.userid };
  } catch (error) {
    console.error("[ERS] Login failed:", error.response?.data || error.message);
    throw new Error("ERS login failed");
  }
}

// ---------------------------------------------------------------------------
// 📤 Generic POST (auto-handle token + refresh on 401)
// ---------------------------------------------------------------------------
async function ersPost(username, password, endpoint, body = {}) {
  const redisKey = makeRedisKey(username, password);
  let { token } = await ersLogin(username, password); // ensures token available

  try {
    const { data } = await axios.post(`${ERS_BASE_URL}${endpoint}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("[ERS POST] Token expired, refreshing...");
      const newLogin = await ersLogin(username, password, true);
      const { data } = await axios.post(`${ERS_BASE_URL}${endpoint}`, body, {
        headers: {
          Authorization: `Bearer ${newLogin.token}`,
          "Content-Type": "application/json",
        },
      });
      return data;
    }

    console.error(`[ERS POST] ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 📥 Generic GET (auto-handle token + refresh on 401)
// ---------------------------------------------------------------------------
async function ersGet(username, password, endpoint, params = {}) {
  const redisKey = makeRedisKey(username, password);
  let { token } = await ersLogin(username, password);

  try {
    const { data } = await axios.get(`${ERS_BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("[ERS GET] Token expired, refreshing...");
      const newLogin = await ersLogin(username, password, true);
      const { data } = await axios.get(`${ERS_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${newLogin.token}` },
        params,
      });
      return data;
    }

    console.error(`[ERS GET] ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 🚪 Logout / clear token
// ---------------------------------------------------------------------------
async function ersLogout(username, password) {
  const redisKey = makeRedisKey(username, password);
  await redisMaster.delete(redisKey);
  console.log(`[ERS] Logged out and removed token for ${username}`);
}

module.exports = {
  ersLogin,
  ersPost,
  ersGet,
  ersLogout,
};

