// middlewares/validateSubCompanyAuthCheckBalance.js
const crypto = require("crypto");
const sqlQuery = require("../common/sqlQuery.common");
const sqlQueryReplica = require("../common/sqlQueryReplica.common");
const { decryptSecret } = require("../utils/encryption.utils");

const tableName = "er_sub_company";

const validateSubCompanyAuthCheckBalance = async (req, res, next) => {
  try {
    const apiKey = req.header("X-Api-Key");

    // Extract client IP
    const forwarded = req.headers["x-forwarded-for"];
    const ipList = forwarded ? forwarded.split(",") : [];
    // const clientIp = req.connection.remoteAddress || null;
    const clientIp =
      ipList.length > 0 ? ipList[0].trim() : req.connection.remoteAddress;
    const normalizedIp = clientIp.replace("::ffff:", "");

    // Get company by API key
    const companies = await sqlQueryReplica.searchOrQuery(
      tableName,
      { sub_company_api_key: apiKey },
      [
        "sub_company_name",
        "sub_company_uuid",
        "allowed_ips",
        "sub_company_api_key",
        "encrypted_secret",
        "bcrypt_hash",
        "active",
        "ers_account_username",
        "ers_account_user_password",
      ],
      "sub_company_name",
      "ASC",
      1,
      0
    );

    const company = companies[0];

    if (!companies || companies.length !== 1) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    // IP check
    if (!company.allowed_ips.includes(normalizedIp)) {
      return res.status(403).json({ error: "Unauthorized IP address" });
    }
    // Active check
    if (company.active !== 1) {
      return res.status(403).json({ error: "Company is inactive" });
    }

    req.company = company;
    next();
  } catch (err) {
    console.error("validateSubCompanyAuthCheckBalance error:", err);
    res.status(400).json({ error: "Auth middleware failed: " + err.message });
  }
};

module.exports = validateSubCompanyAuthCheckBalance;
