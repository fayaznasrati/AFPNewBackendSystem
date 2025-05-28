const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const redisMaster = require('../common/master/radisMaster.common')
const commonQueryCommon = require('../common/commonQuery.common')
const accessFilter = require('../common/accessFilter.common')
const role = require('../utils/userRoles.utils')
const genRandom = require('../utils/randomString.utils')
const varEncryptionString = require('../utils/encryption.utils');
const varRandomString = require('../utils/randomString.utils');
const dotenv = require('dotenv');
const path = require('path');
const smsFunction = require('../common/smsFunction.common')
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
// configer env
dotenv.config()

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');
const agentModule = require('../models/agent.module');

// const { toIsoString } = require('../common/timeFunction.common')

class companyController {

    tableName1 = 'er_company';
    tableName2 = 'er_login';
    tableName3 = 'er_company_activity_logs';
    tableName4 = 'er_company_api_key_logs';

    //################---create company---################
   createCompany = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log('Company/createCompany', JSON.stringify(req.body), JSON.stringify(req.query));

        const date = new Date();
        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
        const isodate = date.toISOString();

        const {
            company_name,
            allowed_ips = [],
            company_account_username,
            status
        } = req.body;

        const createdBy = req.query.username;
        if (!createdBy) {
            return res.status(400).json({ errors: [{ msg: "Missing or invalid username in query" }] });
        }

                // ❗ Check for duplicate IPs in input
        const uniqueIps = new Set(allowed_ips);
        if (uniqueIps.size !== allowed_ips.length) {
            return res.status(400).json({ errors: [{ msg: "Duplicate IPs detected in allowed_ips" }] });
        }
       const allCompanies = await sqlQuery.searchQueryNoCon(
        this.tableName1,
        ['allowed_ips'], // ✅ this should be an array of column names you want to select 
        'company_name',
        'ASC',
        1000,
        0
        );

        let registeredIps = new Set();
        for (let company of allCompanies) {
            try {
                const ips = JSON.parse(company.allowed_ips || '[]');
                ips.forEach(ip => registeredIps.add(ip));
            } catch (e) {
                console.warn(`Failed to parse IPs for company:`, company);
            }
        }

        const conflictingIps = allowed_ips.filter(ip => registeredIps.has(ip));
        if (conflictingIps.length > 0) {
            return res.status(400).json({
                errors: [{ msg: `These IPs are already registered: ${conflictingIps.join(', ')}` }]
            });
        }


        // 🔍 Fetch user account
        const searchUser = { username: company_account_username };
        const userKeys = ['username', 'userid'];
        const userOrderBy = 'username';
        const userAccount = await sqlQuery.searchOrQuery(this.tableName2, searchUser, userKeys, userOrderBy, 'ASC', 1, 0);

        if (!userAccount || userAccount.length !== 1) {
            return res.status(400).json({ errors: [{ msg: "Invalid or missing user account" }] });
        }

        const accountUser = userAccount[0];

        // 📦 Prepare insert payload
        const param = {
            company_uuid: "uuid()", // Replace with actual UUID if necessary
            company_name,
            allowed_ips: JSON.stringify(allowed_ips),
            company_api_key: null,
            bcrypt_hash: null,
            encrypted_secret: null,
            active: status ?? 1,
            account_username: company_account_username,
            account_userid: accountUser.userid,
            created_by: createdBy,
            created_at: isodate,
            last_modified_by: createdBy,
            last_modified_on: isodate
        };

        // 🧪 Check if company with same name and IPs exists
        const existingCompany = await sqlQuery.searchOrQuery(
            this.tableName1,
            { company_name: param.company_name, allowed_ips: param.allowed_ips },
            ['company_name AS company_name'],
            'company_name',
            'ASC',
            10,
            0
        );
        if (existingCompany && existingCompany.length > 0) {
            return res.status(400).json({ errors: [{ msg: "Company already exists with these allowed IPs" }] });
        }

        // 🔁 Check if this user already registered a company
        const userCompanyExists = await sqlQuery.searchOrQuery(
            this.tableName1,
            {
                account_username: param.account_username,
                account_userid: param.account_userid
            },
            ['company_name AS company_name'],
            'company_name',
            'ASC',
            10,
            0
        );
        if (userCompanyExists && userCompanyExists.length > 0) {
            return res.status(400).json({
                errors: [{ msg: `Company already registered under this user: ${param.account_username}` }]
            });
        }

        // 💾 Insert company
        const objResult = await sqlQuery.createQuery(this.tableName1, param);
        if (!objResult) {
            throw new Error("Something went wrong during company creation");
        }
        await this.logActivity({
            action: 'CREATE',
            entityType: 'company',
            entityId: objResult.company_id,
            performedBy: createdBy,
            details: {
                company_name: param.company_name,
                allowed_ips: param.allowed_ips,
                created_by: createdBy
            }
        });


        return res.status(201).send({ message: "Company created successfully!" });

    } catch (error) {
        console.error("createCompany error:", error);

        const message = error.message || '';
        const key = message.split("'");
        if (message.includes('Duplicate entry')) {
            return res.status(400).json({ errors: [{ msg: `${key[1]} already registered` }] });
        }

        return res.status(500).json({ errors: [{ msg: message }] });
    }
    };


    //################---edit commpanies---################
    editCompany = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            console.log('Company/editCompany', JSON.stringify(req.body), JSON.stringify(req.query));

            const { company_name, allowed_ips } = req.body;
            const modifiedBy = req.query.username;
            const id = req.params.id;

            if (!modifiedBy) {
                return res.status(400).json({ errors: [{ msg: "Missing or invalid username in query" }] });
            }

            if (!id) {
                return res.status(400).json({ errors: [{ msg: "Missing company ID" }] });
            }

            // ✅ Get current company info
            const existingCompany = await sqlQuery.searchOrQuery(
                this.tableName1,
                { company_id: id },
                ['allowed_ips'],
                'company_name',
                'ASC',
                1,
                0
            );

            if (!existingCompany || existingCompany.length !== 1) {
                return res.status(404).json({ errors: [{ msg: "Company not found" }] });
            }

            // 🔒 Parse existing allowed_ips safely
            let finalAllowedIps = [];
            try {
                finalAllowedIps = JSON.parse(existingCompany[0].allowed_ips || '[]');
                if (!Array.isArray(finalAllowedIps)) {
                    finalAllowedIps = [];
                }
            } catch (e) {
                console.warn('Invalid allowed_ips format in DB, defaulting to []');
                finalAllowedIps = [];
            }

            // If allowed_ips is provided in body, validate and check for conflicts
            let allowedIpsToUpdate = null;
            if (allowed_ips !== undefined) {
                // ✅ Check for duplicates
                const uniqueIps = new Set(allowed_ips);
                if (uniqueIps.size !== allowed_ips.length) {
                    return res.status(400).json({ errors: [{ msg: "Duplicate IPs detected in allowed_ips" }] });
                }

                // 🧠 Get all other companies to avoid IP conflict
                const allCompanies = await sqlQuery.searchQueryNoCon(
                    this.tableName1,
                    ['company_id', 'allowed_ips'],
                    'company_name',
                    'ASC',
                    1000,
                    0
                );

                let registeredIps = new Set();
                for (let company of allCompanies) {
                    if (company.company_id === id) continue;
                    try {
                        const ips = JSON.parse(company.allowed_ips || '[]');
                        ips.forEach(ip => registeredIps.add(ip));
                    } catch (e) {
                        console.warn(`Failed to parse IPs for company:`, company);
                    }
                }

                const conflictingIps = allowed_ips.filter(ip => registeredIps.has(ip));
                if (conflictingIps.length > 0) {
                    return res.status(400).json({
                        errors: [{ msg: `These IPs are already registered by other companies: ${conflictingIps.join(', ')}` }]
                    });
                }

                // ✅ Safe to assign
                allowedIpsToUpdate = JSON.stringify(allowed_ips);
            }

            // 📦 Build update fields
            const updateFields = {
                company_name,
                last_modified_by: modifiedBy,
                last_modified_on: new Date().toISOString()
            };

            if (allowedIpsToUpdate !== null) {
                updateFields.allowed_ips = allowedIpsToUpdate;
            }

            // 💾 Perform update
            const result = await sqlQuery.updateQuery(
                this.tableName1,
                updateFields,
                { company_id: id }
            );

            if (!result || result.affectedRows === 0) {
                throw new Error("Failed to update company");
            }
            const changes = {};
            if (company_name && company_name !== existingCompany[0].company_name) {
                changes.company_name = {
                    old: existingCompany[0].company_name,
                    new: company_name
                };
            }
            if (allowedIpsToUpdate !== null && allowedIpsToUpdate !== existingCompany[0].allowed_ips) {
                changes.allowed_ips = {
                    old: existingCompany[0].allowed_ips,
                    new: allowedIpsToUpdate
                };
            }

            await this.logActivity({
                action: 'UPDATE',
                entityType: 'company',
                entityId: id,
                performedBy: modifiedBy,
                details: changes
            });


            return res.status(200).json({ message: "Company updated successfully" });

        } catch (error) {
            console.error("editCompany error:", error);

            const message = error.message || '';
            const key = message.split("'");
            if (message.includes('Duplicate entry')) {
                return res.status(400).json({ errors: [{ msg: `${key[1]} already exists` }] });
            }

            return res.status(500).json({ errors: [{ msg: message }] });
        }
    };


    //################---fetch companies---################
    getCompanies = async (req, res) => {
      try {
          // body and query validators
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
              return res.status(400).json({ errors: errors.array() });
          }
          console.log('companies',JSON.stringify(req.body), JSON.stringify(req.query))
          if (!req.query.pageNumber) req.query.pageNumber = 0


          // search parem
          let searchKeyValue = {
              Active: 1,
          }
               var orderby = "company_name"
                var ordertype = "ASC"

          let lisTotalRecords = await sqlQuery.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, ['COUNT(1) AS count'], orderby, ordertype);

          let intTotlaRecords = Number(lisTotalRecords[0].count)
          let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

          let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
          let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

          // if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: "Improper search key value" }); 
          let companyList = await sqlQuery.searchQueryTimeout(this.tableName1, searchKeyValue, ['company_id AS id','company_name AS name','allowed_ips','company_api_key AS API_key','encrypted_secret','bcrypt_hash','active AS status','account_username AS belongs_to','account_userid AS belongs_to_id ','created_at','created_by','last_modified_by','last_modified_on' ], orderby, ordertype, limit, offset)
          // check date for start and end 
          if (!companyList || companyList.length == 0) {
              return res.status(200).send({ data: [], totalRecords: intTotlaRecords, pageCount: intPageCount });
          }else {
          // send response
            res.status(200).send({
                  reportList: companyList,
                  totalRepords: intTotlaRecords,
                  pageCount: intPageCount,
                  currentPage: Number(req.query.pageNumber),
                  pageLimit: Number(process.env.PER_PAGE_COUNT)
              })
            }

      } catch (error) {
          console.error(error);
          if (req.query.pageNumber == 0) {
              res.status(200).send([{}])
          }
          }
      
    }

    // //################---generate company API---################
    // generateCompanyKeys = async (req, res, next) => {
    //     try {
    //         const companyId = parseInt(req.params.id);
    //         const userid = req.query.username;

    //         if (isNaN(companyId)) {
    //             return res.status(400).json({ errors: [{ msg: "Invalid company ID" }] });
    //         }

    //         var searchKeyValue={
    //                 company_id: companyId
    //             }
                        
    //             var key = ['company_name AS company_name']
    //             var orderby = "company_name"
    //             var ordertype = "ASC"
    //             var limit = 10
    //             var offset = 0
    //                 // 2) check if company name already exists tableName,
    //                 // const company_exsits = await sqlQueryReplica.searchOrQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, limit, offset);
    //             const existingCompany = await sqlQuery.searchOrQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, limit, offset);
    //         if (!existingCompany) {
    //             return res.status(404).json({ errors: [{ msg: "Company not found" }] });
    //         }

    //         // 1) Generate random secret (256-bit) and API key (128-bit)
    //         const rawSecret = crypto.randomBytes(32).toString('hex');
    //         const apiKey = crypto.randomBytes(16).toString('hex');

    //         // 2) Hash the raw secret
    //         const bcryptHash = await bcrypt.hash(rawSecret, 12);

    //         // 3) Simulate encryption of secret (base64 encode)
    //         const encryptedSecret = Buffer.from(rawSecret).toString('base64');

    //         // 4) Prepare update values 
    //         const updateValues = {
    //             company_api_key: apiKey,
    //             bcrypt_hash: bcryptHash,
    //             encrypted_secret: encryptedSecret,
    //             last_modified_by: userid,
    //             last_modified_on: new Date()
    //         };
    //     var searchKeyValue={
    //                 company_id: companyId
    //             }
                
    //         // 5) Update in DB     updateQuery = async(tableName, keyValue, searchKeyValue) => {
    //         const result = await sqlQuery.updateQuery(this.tableName1, updateValues, searchKeyValue);

    //         if (!result) {
    //             throw new Error("Failed to update company with generated keys");
    //         }

    //         // 6) Return downloadable JSON
    //         const downloadData = {
    //             company_name: existingCompany.name,
    //             api_key: apiKey,
    //             secret: rawSecret,
    //             note: "Store this secret securely; it cannot be retrieved again."
    //         };

    //         res.setHeader('Content-Disposition', `attachment; filename=company_keys_${companyId}.json`);
    //         res.setHeader('Content-Type', 'application/json');
    //         res.status(200).send(JSON.stringify(downloadData, null, 2));

    //     } catch (error) {
    //         console.error(error);
    //         return res.status(500).json({ errors: [{ msg: error.message || 'Server error' }] });
    //     }
    // };

//################---generate company API---################
generateCompanyKeys = async (req, res, next) => {
    try {
        const companyId = parseInt(req.params.id);
        const userid = req.query.username;

        if (isNaN(companyId)) {
            return res.status(400).json({ errors: [{ msg: "Invalid company ID" }] });
        }

        if (!userid) {
            return res.status(400).json({ errors: [{ msg: "Missing username in query" }] });
        }

        const searchKeyValue = { company_id: companyId };
        const key = ['company_name AS company_name'];
        const orderby = "company_name";
        const ordertype = "ASC";
        const limit = 10;
        const offset = 0;

        const existingCompany = await sqlQuery.searchOrQuery(
            this.tableName1,
            searchKeyValue,
            key,
            orderby,
            ordertype,
            limit,
            offset
        );

        if (!existingCompany || existingCompany.length === 0) {
            return res.status(404).json({ errors: [{ msg: "Company not found" }] });
        }

        const companyName = existingCompany[0].company_name;

        // 1) Generate random secret (256-bit) and API key (128-bit)
        const rawSecret = crypto.randomBytes(32).toString('hex');
        const apiKey = crypto.randomBytes(16).toString('hex');

        // 2) Hash the raw secret
        const bcryptHash = await bcrypt.hash(rawSecret, 12);

        // 3) Simulate encryption of secret (base64 encode)
        const encryptedSecret = Buffer.from(rawSecret).toString('base64');

        // 4) Prepare update values 
        const updateValues = {
            company_api_key: apiKey,
            bcrypt_hash: bcryptHash,
            encrypted_secret: encryptedSecret,
            last_modified_by: userid,
            last_modified_on: new Date()
        };

        // 5) Update in DB
        const result = await sqlQuery.updateQuery(this.tableName1, updateValues, searchKeyValue);

        if (!result || result.affectedRows === 0) {
            throw new Error("Failed to update company with generated keys");
        }

        // 6) Log the API key generation
        await this.logApiKeyGeneration({
                companyId,
                companyName,
                apiKey,
                rawSecret,
                bcryptHash,
                encryptedSecret,
                generatedBy: userid,
                note: 'New API key and secret created for company'
            });


        // 7) Return downloadable JSON
        const downloadData = {
            company_name: companyName,
            api_key: apiKey,
            secret: rawSecret,
            bcryptHash:bcryptHash,
            encryptedSecret:encryptedSecret,
            note: "Store this secret securely; it cannot be retrieved again."
        };

        res.setHeader('Content-Disposition', `attachment; filename=company_keys_${companyId}.json`);
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(downloadData, null, 2));

    } catch (error) {
        console.error(error);
        return res.status(500).json({ errors: [{ msg: error.message || 'Server error' }] });
    }
};

   logActivity = async ({
    action,
    entityType,
    entityId,
    performedBy,
    details}) => {
    const payload = {
        action,
        entity_type: entityType,
        entity_id: entityId,
        performed_by: performedBy,
        details: JSON.stringify(details),
        performed_at: new Date().toISOString()
    };

    return await sqlQuery.createQuery(this.tableName3, payload);
    };

    logApiKeyGeneration = async ({
        companyId,
        companyName,
        apiKey,
        rawSecret,
        bcryptHash,
        encryptedSecret,
        generatedBy,
        note = 'API key generated'
    }) => {
        const logData = {
            company_id: companyId,
            company_name: companyName,
            api_key: apiKey,
            raw_secret: rawSecret,
            bcrypt_hash: bcryptHash,
            encrypted_secret: encryptedSecret,
            generated_by: generatedBy,
            generated_at: new Date(),
            note
        };

        return await sqlQuery.createQuery(this.tableName4, logData);
    };


    setSecretKey() {
        var strRandomString = varRandomString.generateRandomString(15);
        var strRandomHash = varRandomString.generateRandomHash(strRandomString);
        return strRandomHash;
    }

    genAPIKey = () => {
        var strRandomString = varRandomString.generateRandomString(15);
        var strRandomHash = varRandomString.generateRandomHash(strRandomString);
        return strRandomHash;
    }

    checkValidation = (req) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors)
            throw new HttpException(400, 'Validation faild', errors);
        }
    }
}

module.exports = new companyController