// middlewares/validateCompanyAuth.js
const crypto = require('crypto');
const sqlQuery = require('../common/sqlQuery.common');
const sqlQueryReplica = require('../common/sqlQueryReplica.common');
const { decryptSecret } = require('../utils/encryption.utils');

const tableName = 'er_company';


const validateCompanyAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('X-Api-Key');
    const signature = req.header('X-Signature');
    const timestamp = parseInt(req.header('X-Timestamp'), 10);

    if (!apiKey || !signature || !timestamp) {
      return res.status(401).json({ error: 'Missing auth headers' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 3000) {
      return res.status(401).json({ error: 'Timestamp expired or invalid' });
    }

    // Extract client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ipList = forwarded ? forwarded.split(',') : [];
    const clientIp = ipList.length > 0 ? ipList[0].trim() : req.connection.remoteAddress;
    const normalizedIp = clientIp.replace('::ffff:', '');

    // Get company by API key
    const companies = await sqlQuery.searchOrQuery(
      tableName,
      { company_api_key: apiKey },
      [
        'company_name',
        'company_uuid',
        'allowed_ips',
        'company_api_key',
        'encrypted_secret',
        'bcrypt_hash',
        'active',
        'account_username',
        'account_userid'
      ],
      'company_name',
      'ASC',
      1,
      0
    );

    if (!companies || companies.length !== 1) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const company = companies[0];

    // IP check
    if (!company.allowed_ips.includes(normalizedIp)) {
      return res.status(403).json({ error: 'Unauthorized IP address' });
    }

    // Active check
    if (company.active !== 1) {
      return res.status(403).json({ error: 'Company is inactive' });
    }

    // Decrypt secret
    const decryptedSecret = decryptSecret(company.encrypted_secret, company.company_api_key);

    // Validate HMAC
    const message = timestamp + JSON.stringify(req.body);
    const computedSignature = crypto.createHmac('sha256', decryptedSecret).update(message).digest('hex');

    if (computedSignature !== signature) {
      return res.status(403).json({ error: 'Invalid HMAC signature' });
    }

    req.company = company;
    next();
  } catch (err) {
    console.error('validateCompanyAuth error:', err);
    res.status(400).json({ error: 'Auth middleware failed: ' + err.message });
  }
};

module.exports = validateCompanyAuth;
