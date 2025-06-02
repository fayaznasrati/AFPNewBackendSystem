const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const redisMaster = require('../common/master/radisMaster.common')
const {encryptSecret} = require('../utils/encryption.utils');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
dotenv.config()

const rechargeService = require('../controllers/recharge.controller');

class companyController {

    tableName1 = 'er_company';
    tableName2 = 'er_login';
    tableName3 = 'er_company_activity_logs';
    tableName4 = 'er_company_api_key_logs';
    tableName24 = 'er_access_status';

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

            // 🔍 Fetch all companies to validate against existing IPs
            const allCompanies = await sqlQuery.searchQueryNoCon(
                this.tableName1,
                ['allowed_ips'],
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

            // ✅ Generate secure 256-bit (32 byte) API key
            const apiKey = crypto.randomBytes(32).toString('hex'); // 64-char hex string

            const param = {
                company_uuid: uuidv4(),
                company_name,
                allowed_ips: JSON.stringify(allowed_ips),
                company_api_key: apiKey,
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

            // 🚫 Check if company with same name and IPs exists
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

            // 🚫 Check if this user already registered a company
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

            // 💾 Insert into DB
            const objResult = await sqlQuery.createQuery(this.tableName1, param);
            if (!objResult) {
                throw new Error("Something went wrong during company creation");
            }

            // 📘 Log activity
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

            const { company_name, allowed_ips,status   } = req.body;
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
                active: status ?? 1, // Default to 1 if not provided
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
              Active: 1

          } 
               var orderby = "company_name"
                var ordertype = "ASC"

          let lisTotalRecords = await sqlQuery.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, ['COUNT(1) AS count'], orderby, ordertype);

          let intTotlaRecords = Number(lisTotalRecords[0].count)
          let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

          let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
          let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

          // if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: "Improper search key value" }); 
        //   searchQueryNoCon(this.tableName1,  ['COUNT(1) AS count'], orderby, ordertype,1000, 0);
          let companyList = await sqlQuery.searchQueryNoCon(this.tableName1,  ['company_id AS id','company_name AS name','allowed_ips','company_api_key AS API_key','encrypted_secret','bcrypt_hash','active AS status','account_username AS belongs_to','account_userid AS belongs_to_id ','created_at','created_by','last_modified_by','last_modified_on' ], orderby, ordertype, limit, offset)
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
  //################---Generate API Key for companies---################
    generateCompanyKeys = async (req, res, next) => {
    try {
        const companyId = parseInt(req.params.id);
        const userid = req.query.username;

        if (isNaN(companyId)) return res.status(400).json({ errors: [{ msg: "Invalid company ID" }] });
        if (!userid) return res.status(400).json({ errors: [{ msg: "Missing username in query" }] });

        const existingCompany = await sqlQuery.searchOrQuery(
        this.tableName1,
        { company_id: companyId },
        ['company_name', 'company_api_key'],
        "company_name",
        "ASC",
        10,
        0
        );

        if (!existingCompany || existingCompany.length === 0) {
        return res.status(404).json({ errors: [{ msg: "Company not found" }] });
        }

        const companyName = existingCompany[0].company_name;
        const API_key = existingCompany[0].company_api_key;

        // 1. Generate shared secret key
        const secretKey = crypto.randomBytes(32).toString('hex'); // 256-bit secret

        // 2. Validate and prepare API key as encryption key
        const keyBuffer = Buffer.from(API_key, 'hex');
        if (keyBuffer.length !== 32) {
        throw new Error('Invalid API key length. Must be 256-bit (32 bytes).');
        }

        // 3. Encrypt the secret with AES-256-CBC
        const encryptedSecret = encryptSecret(secretKey, keyBuffer);

        // 4. Hash the secret for one-way validation (optional)
        const bcryptHash = await bcrypt.hash(secretKey, 10);

        // 5. Save encrypted secret and hash to DB
        const updateValues = {
        bcrypt_hash: bcryptHash,
        encrypted_secret: encryptedSecret,
        last_modified_by: userid,
        last_modified_on: new Date()
        };

        const result = await sqlQuery.updateQuery(this.tableName1, updateValues, { company_id: companyId });
        if (!result || result.affectedRows === 0) {
        throw new Error("Failed to update company with generated keys");
        }

        // 6. Audit logging (you can mask secret if needed)
        await this.logApiKeyGeneration({
        companyId,
        companyName,
        secretKey,
        bcryptHash,
        encryptedSecret,
        generatedBy: userid,
        note: 'New API key and secret created for company'
        });

        // 7. Send download response
        const downloadData = {
        company_name: companyName,
        secret: encryptedSecret,
        note: "Store this secret securely; it cannot be retrieved again from our side."
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
        rawSecret,
        bcryptHash,
        encryptedSecret,
        generatedBy,
        note = 'New Secret Key generated'
    }) => {
        const logData = {
            company_id: companyId,
            company_name: companyName,
            raw_secret: bcryptHash,
            bcrypt_hash: bcryptHash,
            encrypted_secret: encryptedSecret,
            generated_by: generatedBy,
            generated_at: new Date(),
            note
        };

        return await sqlQuery.createQuery(this.tableName4, logData);
    };


    checkValidation = (req) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors)
            throw new HttpException(400, 'Validation faild', errors);
        }
    }

    //################---Single recharge for company---################
    CompanySinglerecharge = async (req, res, next) => {
            try {
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('recharge/singleRecharge', JSON.stringify(req.body), JSON.stringify(req.query))
            // 🔍 Fetch user account
                const searchUser = { username: req.body.username };
                const userKeys = ['username', 'userid','full_name', 'mobile', 'user_uuid', 'usertype_id', 'region_id', 'user_status', 'active',];
                const userOrderBy = 'username';
                const userAccount = await sqlQuery.searchOrQuery(this.tableName2, searchUser, userKeys, userOrderBy, 'ASC', 1, 0);
                const user_detials = userAccount[0];
                if (!userAccount || userAccount.length !== 1) {
                    return res.status(400).json({ errors: [{ msg: "Invalid or missing user account" }] });
                }
                if (user_detials.active !== 1) {
                    return res.status(400).json({ errors: [{ msg: "User account is in-active, Call AFP admin " }] });
                }
                // console.log("userAccount", userAccount);

            let operator_uuid = '', operatorName = ''

            switch (req.body.mobile.slice(0, 3)) {
                case "078":
                case "073":
                    // Etisalat
                    operator_uuid = "70b9906d-c2ba-11"
                    operatorName = "Etisalat"
                    break;
                case "079":
                case "072":
                    // Roshan
                    operator_uuid = "9edb602c-c2ba-11"
                    operatorName = "Roshan"
                    break;
                case "077":
                case "076":
                    // MTN
                    operator_uuid = "456a6b47-c2ba-11",
                        operatorName = "MTN"
                    break;
                case "074":
                    // Salaam
                    operator_uuid = "1e0e1eeb-c2a6-11"
                    operatorName = "Salaam"
                    break;
                case "070":
                case "071":
                    // AWCC
                    operator_uuid = "6a904d84-c2a6-11"
                    operatorName = "AWCC"
                    break;
            }

            if (!operator_uuid && !operatorName ) {
                return res.status(400).json({ errors: [{ msg: "Mobile number does not match with selected operator" }] });
            }


            let params = {
                operatorName: operatorName,
                operator_uuid: operator_uuid,
                amount: req.body.amount,
                mobile: req.body.mobile,
                userid: user_detials.userid,
                user_uuid: user_detials.user_uuid,
                user_mobile:user_detials.mobile,
                userType: user_detials.usertype_id,
                channelType: ['Mobile', 'SMS', 'USSD', 'Web','Company'].includes(req.body.userApplicationType) ? req.body.userApplicationType : 'Web',
                group_topup_id: 0,
                full_name: user_detials.full_name,
                username: user_detials.username,
                region_id: user_detials.region_id,
                userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
                userMacAddress: req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                userImeiNumber: req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
                userAppVersion: req.body.userAppVersion ? req.body.userAppVersion : null, //str
                userApplicationType: req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == "Company" ? 10 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
            }

            let responce
            let stockTransferStatus = await this.#checkStockTransferStatus()
            
            if (stockTransferStatus.length == 0 || stockTransferStatus[0].stock_transfer == 0) {
                responce = { status: 400, message: 'Recharge is not allowed for a while.' }
            } else {
                // responce = await this.processRecharge(data)
                responce = await rechargeService.processRecharge(params)
                console.log("params", params)
                
            }

            // send responce to front end
            if (responce.status == 200) res.status(responce.status).send({ message: responce.message })
            else res.status(responce.status).json({ errors: [{ msg: responce.message }] });

        } catch (error) {
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    

    }

    #checkStockTransferStatus = async () => {
            let strStockTransferStatus = await redisMaster.asyncGet('STOCK_TRANSFER_STATUS')
            if (strStockTransferStatus) {
                return (JSON.parse(strStockTransferStatus))
            } else {
                let stockTransferStatus = await sqlQuery.searchQueryNoCon(this.tableName24, ['stock_transfer'], 'stock_transfer', 'ASC', 1, 0)
                redisMaster.post('STOCK_TRANSFER_STATUS', JSON.stringify(stockTransferStatus))
                return (stockTransferStatus)
            }
        }

}

module.exports = new companyController