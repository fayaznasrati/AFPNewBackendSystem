// middlewares/validateCompanyAuthCheckBalance.js
const crypto = require('crypto');
const sqlQuery = require('../common/sqlQuery.common');
const sqlQueryReplica = require('../common/sqlQueryReplica.common');
const { decryptSecret } = require('../utils/encryption.utils');

const tableName = 'er_company';


const validateCompanyAuthCheckBalance = async (req, res, next) => {
  try {
    const apiKey = req.header('X-Api-Key');
   
    // Extract client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ipList = forwarded ? forwarded.split(',') : [];
    // const clientIp = req.connection.remoteAddress || null;
    const clientIp = ipList.length > 0 ? ipList[0].trim() : req.connection.remoteAddress;
    const normalizedIp = clientIp.replace('::ffff:', '');

    // Get company by API key
    const companies = await sqlQueryReplica.searchOrQuery(
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
    const company = companies[0];

    if (!companies || companies.length !== 1) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    // IP check
    if (!company.allowed_ips.includes(normalizedIp)) {
      return res.status(403).json({ error: 'Unauthorized IP address' });
    }
  // Active check
    if (company.active !== 1) {
      return res.status(403).json({ error: 'Company is inactive' });
    }


   req.company = company;
    next();
  } catch (err) {
    console.error('validateCompanyAuthCheckBalance error:', err);
    res.status(400).json({ error: 'Auth middleware failed: ' + err.message });
  }
};

module.exports = validateCompanyAuthCheckBalance;
