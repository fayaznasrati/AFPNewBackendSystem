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
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const REPORT_DIR = '/var/www/html/AFPNewBackendSystem/the_topup_reports';

const rechargeService = require('../controllers/recharge.controller');
const { response } = require('express');
const { send } = require('express/lib/response');
const rechargeModel = require('../models/recharge.model');

class companyController {

    tableName1 = 'er_company';
    tableName2 = 'er_login';
    tableName3 = 'er_company_activity_logs';
    tableName4 = 'er_company_api_key_logs';
    tableName5 = 'er_access_status';
    _tableName1 = 'er_login'
    _tableName2 = 'er_wallet'
    _tableName3 = 'er_wallet_transaction'
    _tableName4 = 'er_recharge'
    _tableName5 = 'er_commission_amount'
      tableName6 = 'er_agent_type' // agent type

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
    
    getCompanyById = async(req, res, next) => {

           try {

            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('company/getCompanyById', JSON.stringify(req.body), JSON.stringify(req.query))

            //test 
            var key = ['company_id AS id','company_name AS name','allowed_ips','company_api_key AS API_key','encrypted_secret','active AS status','account_username AS belongs_to','account_userid AS belongs_to_id ','created_at','created_by','last_modified_by','last_modified_on' ]
                 if(req.params.id){
                var searchKeyValue = {
                    company_id: req.params.id,
                }
                }
            // fire sql query to get str user_uuid, str full_name
            const theCompany = await sqlQueryReplica.searchQueryById(this.tableName1, searchKeyValue, key)
                const  {belongs_to,belongs_to_id, ...data} = theCompany[0];
                console.log("company", data);

    
        const searchUser = {
            username: belongs_to // Use the company account username to fetch user details
        };

        const userKeys = ['username', 'userid','full_name', 'mobile',  'usertype_id', 'region_id', 'user_status', 'active'];
        const userOrderBy = 'username';

        const userAccount = await sqlQueryReplica.searchOrQuery(this.tableName2, searchUser, userKeys, userOrderBy, 'ASC', 1, 0);
        const user_detials = userAccount[0];

        if (!userAccount || userAccount.length !== 1) {
            throw new Error("Invalid or missing user account");
        }

        if (user_detials.active !== 1) {
            throw new Error("User account is in-active, Call AFP admin");
        }

        let avaliableBalance = 0, totalTransactions = 0, todayTopup = 0, todayCommission = 0;
        const todayDate = this.currentDateToString();

        const listAvaliableBalance = await sqlQueryReplica.searchQuery(this._tableName2, { userid: user_detials.userid }, ['ex_wallet', 'comm_wallet'], 'userid', 'ASC', 1, 0);
        if (listAvaliableBalance.length) {
            avaliableBalance = listAvaliableBalance[0].ex_wallet || 0;
            todayCommission = listAvaliableBalance[0].comm_wallet || 0;
        }

        const listTotalTransaction = await sqlQueryReplica.searchQuery(this._tableName4, { userid: user_detials.userid }, ['COUNT(userid)'], 'userid', 'ASC', 1, 0);
        totalTransactions = listTotalTransaction?.[0]?.["COUNT(userid)"] || 0;

        const listTodayTopup = await sqlQueryReplica.searchQuery(this._tableName4, { status: 2, created_on: todayDate }, ['SUM(amount) AS totalAmount'], 'userid', 'ASC', 1, 0);
        todayTopup = listTodayTopup?.[0]?.totalAmount || 0;

           const CompanyTransactionsActitiy =  { avaliableBalance, totalTransactions, todayTopup };
           const result =  { ...data, statusDetails: CompanyTransactionsActitiy, ownerDetatils: user_detials }                
            res.status(200).send({
                reportList : result,
            })
    } catch (error) {
        throw error;
    }
    
    }

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

               var orderby = "company_id"
                var ordertype = "DESC"
                
                var key = ['company_id','company_name ','allowed_ips','company_api_key','bcrypt_hash','active','account_username','account_userid ','created_at','created_by','last_modified_by','last_modified_on' ]
            let lisTotalRecords = await sqlQuery.selectStar(this.tableName1,key);
          let intTotlaRecords = Number(lisTotalRecords.length)
          let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

          let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
          let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords
;
          let companyList = await sqlQuery.searchQueryNoCon(this.tableName1,  ['company_id AS id','company_name AS name','allowed_ips','company_api_key AS API_key','bcrypt_hash','active AS status','account_username AS belongs_to','account_userid AS belongs_to_id ','created_at','created_by','last_modified_by','last_modified_on' ], orderby, ordertype, limit, offset)
          // check date for start and end 
          
          if (!companyList || companyList.length == 0) {
              return res.status(200).send({ data: [], totalRecords: intTotlaRecords, pageCount: intPageCount });
          }else {
            const enrichedCompanyList = await Promise.all(
                companyList.map(async (company) => {
                    try {
                        const reqClone = { ...req, body: { ...req.body, user_detials: { username: company.belongs_to } } };
                        const status = await this.getCompanyActivity(reqClone);
                        return { ...company, statusDetails: status };
                    } catch (err) {
                        console.error(`Error for company ${company.name}:`, err.message);
                        return { ...company, statusDetails: null };
                    }
                })
            );
        // console.log("enrichedCompanyList", enrichedCompanyList);
          // send response
            res.status(200).send({
                  reportList: enrichedCompanyList,
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


    downloadCompanies = async (req, res) => {
    try {

        console.log('Company/downloadCompanies', JSON.stringify(req.body), JSON.stringify(req.query));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.query.pageNumber) req.query.pageNumber = 0;

        const orderby = "company_id";
        const ordertype = "DESC";

        const key = [
            'company_id', 'company_name', 'allowed_ips', 'company_api_key',
            'bcrypt_hash', 'active', 'account_username', 'account_userid',
            'created_at', 'created_by', 'last_modified_by', 'last_modified_on'
        ];

        const lisTotalRecords = await sqlQuery.selectStar(this.tableName1, key);
        const intTotlaRecords = lisTotalRecords.length;
        const intPageCount = Math.ceil(intTotlaRecords / Number(process.env.PER_PAGE_COUNT));

        const offset = req.query.pageNumber > 0
            ? (Number(req.query.pageNumber) - 1) * Number(process.env.PER_PAGE_COUNT)
            : 0;
        const limit = req.query.pageNumber > 0
            ? Number(process.env.PER_PAGE_COUNT)
            : intTotlaRecords;

        let rawCompanies = await sqlQuery.searchQueryNoCon(
            this.tableName1,
            [
                'company_id AS id',
                'company_name AS name',
                'allowed_ips',
                'company_api_key AS API_key',
                'bcrypt_hash',
                'active AS status',
                'account_username AS belongs_to',
                'account_userid AS belongs_to_id',
                'created_at',
                'created_by',
                'last_modified_by',
                'last_modified_on'
            ],
            orderby,
            ordertype,
            limit,
            offset
        );
            rawCompanies = rawCompanies.map(company => ({
            ...company,
            status: company.status === 1 ? 'Active' : 'Inactive'
            }));

        if (!rawCompanies || rawCompanies.length === 0) {
            return res.status(200).send({
                reportList: [],
                totalRepords: 0,
                pageCount: 0,
                currentPage: Number(req.query.pageNumber),
                pageLimit: Number(process.env.PER_PAGE_COUNT)
            });
        }

        const enrichedCompanyList = await Promise.all(
            rawCompanies.map(async (company) => {
                try {
                    const reqClone = {
                        ...req,
                        body: {
                            ...req.body,
                            user_detials: { username: company.belongs_to }
                        }
                    };
                    const status = await this.getCompanyActivity(reqClone);
                    return { ...company, statusDetails: status };
                } catch (err) {
                    console.error(`Error for company ${company.name}:`, err.message);
                    return { ...company, statusDetails: null };
                }
            })
        );

        if (req.query.pageNumber == 0) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
            const fileName = `company_list_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            // If file exists and is recent, reuse it
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const createdTime = moment(stats.ctime);
                if (moment(now).diff(createdTime, 'minutes') < 30) {
                    return res.status(200).json({
                        success: true,
                        downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`
                    });
                }
            }

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Companies');

            // Set columns from enriched keys
            if (enrichedCompanyList.length > 0) {
                const sample = enrichedCompanyList[0];
                sheet.columns = Object.keys(sample).map((key) => ({
                    header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                    key,
                    width: 25
                }));
                sheet.getRow(1).font = { bold: true };
                sheet.addRows(enrichedCompanyList);
            }

            await workbook.xlsx.writeFile(filePath);

            // Auto-delete
            setTimeout(() => {
                fs.unlink(filePath, (err) => {
                    if (err && err.code !== 'ENOENT') {
                        console.error(`Failed to delete report file ${fileName}:`, err.message);
                    }
                });
            }, 30 * 60 * 1000);

            return res.status(200).json({
                success: true,
                downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`
            });
        }

        return res.status(200).send({
            reportList: enrichedCompanyList,
            totalRepords: intTotlaRecords,
            pageCount: intPageCount,
            currentPage: Number(req.query.pageNumber),
            pageLimit: Number(process.env.PER_PAGE_COUNT)
        });

    } catch (error) {
        console.error(error);
        return res.status(400).json({ errors: [{ msg: error.message }] });
    }
};
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
        // const API_key = process.env.COMPANY_API_SECRET_KEY; // Use env variable or existing key


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
        encryptedSecret,
        generatedBy,
        note = 'New Secret Key generated'
    }) => {
        const logData = {
            company_id: companyId,
            company_name: companyName,
            encrypted_secret: "**********************", // Masked for security
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
            const apiKey = req.header('X-Api-Key');

            try {
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const amount =  errors.errors[0].value
                if(amount === 0){
                    return res.send({ status: 400, message: 'Recharge amount must be greater than zero, 0' })
                } else {
                    return res.status(400).json({ errors: errors.array() });
                }
               
            }
            console.log('company recharge/singleRecharge', JSON.stringify(req.body), JSON.stringify(req.query))

            //test 

                const companies = await sqlQuery.searchOrQuery(
                  this.tableName1,
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
                console.log("company", company);

                //end test
            // 🔍 Fetch user account
                const searchUser = { username: company.account_username }; 
                const userKeys = ['username', 'userid','full_name', 'mobile', 'user_uuid', 'usertype_id', 'region_id', 'user_status', 'active',];
                const userOrderBy = 'username';
                const userAccount = await sqlQuery.searchOrQuery(this.tableName2, searchUser, userKeys, userOrderBy, 'ASC', 1, 0);
                const user_detials = userAccount[0];
                if (!userAccount || userAccount.length !== 1) {
                    return res.status(400).json({ errors: [{ msg: "Invalid or missing user account" }] });
                }
                if (user_detials.active !== 1) {
                    return res.status(403).json({ errors: [{ msg: "User account is in-active, Call AFP admin " }] });
                }
                const userUuidBuffer = user_detials.user_uuid; // Assume it's a Buffer
                const userUuidStr = userUuidBuffer.toString('utf8');

                // Extract only the useful part (until first null character if any)
                const fullUuid = userUuidStr.split('\0')[0];

                // Take only the first 16 characters
                const the_user_uuid = fullUuid.slice(0, 16);

                // console.log(the_user_uuid); // "6e481e53-d5fa-11"

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
                user_uuid: the_user_uuid,
                user_mobile:user_detials.mobile,
                userType: user_detials.usertype_id,
                channelType:'Company',
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
                // userApplicationType: req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == "Company" ? 10 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                userApplicationType: 10, // Company
                company_transaction_id: req.body.transaction_id ? req.body.transaction_id : null,
            }
            let responce
            let stockTransferStatus = await this.#checkStockTransferStatus()
            
            if (stockTransferStatus.length == 0 || stockTransferStatus[0].stock_transfer == 0) {
                responce = { status: 503, message: 'Recharge is not allowed for a while.' }
            } else {
                responce = await rechargeService.CompanyProcessRecharge(params)
                // console.log("params", params)
                console.log("Recharge Responce", responce)
            }
           
            if (responce.status == 200) res.status(responce.status).send({ the_response: responce }) 
                else if (responce.status == 400) return res.send(responce);
                else if (responce.status == 500) return res.send(responce); 
            else return res.send(responce);

        } catch (error) {
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    

    }

    //  recharge ststus 
    getCompanyRechargeStatus = async (req, res) => {
        try {
            // check body and query
            const {mobile, amount, transaction_id} = req.body;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('company recharge status/getRechageStatus',JSON.stringify(req.body), JSON.stringify(req.query))


            // sql search param
            var searchKeyValue = {
                mobile_number:mobile,
                amount,
                company_trans_id:transaction_id
            }
            var key = ["trans_number AS AFPTransNumber", "company_trans_id AS companyTransactionNumber", "operator_name AS operatorName", "mobile_number AS number", "amount", "operator_transid", "os_details","status", "CAST(created_on AS CHAR(20)) AS rechargeDate"]

            const lisResponce1 = await sqlQuery.searchQueryNoLimitTimeout(this._tableName4, searchKeyValue, key, "id", "ASC")
            if (lisResponce1.length == 0) return res.status(404).send({ message: 'no recharge found' })
            const theResponce = lisResponce1[0];
            let response = {};

                switch(theResponce.status){
                    case 1:
                        response = {
                            status: "PENDING",
                            details: theResponce,
                        }
                    break;
                     case 2:
                        response = {
                            status: "SUCCESS",
                            details: theResponce,
                        }
                    break;
                     case 3:
                        response = {
                            status: "FAILD",
                            details: theResponce,
                        }
                        break;
                    default:
                           response = {
                            status: "FAILD",
                            details: theResponce,
                        }

                }
                console.log(response)
            res.status(200).send(response);


        } catch (error) {
            console.error('getCompanyRechargeStatus', error);
            res.status(200).send({ count: 0, theResponce: [{}] });
        }
    }

    
    // recharge report #########################################
    getCompanyRechargeReport = async (req, res) => {
        try {
                 // body and query validators
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
             const apiKey = req.header('X-Api-Key');
                // Get company by API key
                const companies = await sqlQuery.searchOrQuery(
                  this.tableName1,
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
            console.log("company", company, company.account_username)

            if (!req.query.pageNumber) req.query.pageNumber = 0

            // optional search paremeters
            var searchKeyValue = {
                Active: 1,
                username: company.account_username
            }


            if (req.query.search) {
                if (req.query.search.length == 10) searchKeyValue.mobile_number = req.query.search;
                else searchKeyValue.trans_number = req.query.search;
            }

            if (req.query.status) {
                if (req.query.status == 4) {
                    searchKeyValue.rollback_status = 3
                } else {
                    if (req.query.status == 2) {
                        searchKeyValue.isIn = {
                            key: 'rollback_status',
                            value: ' 0,1,2,4 '
                        }
                    }
                    searchKeyValue.status = req.query.status
                }
            }

            // let sum and count
            const lisTotalRecords = await rechargeModel.agentTopupSumCountReport(searchKeyValue)
            if (lisTotalRecords.length == 0) return res.status(400).send({ message: "Calculation error" })

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1
            let sumRechargeAmount = Number(lisTotalRecords[0].amount) || 0
            let sumDebitedAmount = Number(lisTotalRecords[0].deductAdmount) || 0

            // check the searchKeyValue parem
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search paremeters" }] });
            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // use module to search list
            const lisResponce1 = await rechargeModel.companyRechargeReport(searchKeyValue, limit, offset);
            if(lisResponce1.length == 0) return res.status(204).send({message:"no transaction found"})

                res.status(200).send({
                    reportList: lisResponce1,
                    totalRecords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    totalRechargeAmount: sumRechargeAmount,
                    totalDebitedAmount: sumDebitedAmount,
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                })

        } catch (error) {
            console.error('CompanyRechageReport', error);
      
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }


    #checkStockTransferStatus = async () => {
            let strStockTransferStatus = await redisMaster.asyncGet('STOCK_TRANSFER_STATUS')
            if (strStockTransferStatus) {
                return (JSON.parse(strStockTransferStatus))
            } else {
                let stockTransferStatus = await sqlQuery.searchQueryNoCon(this.tableName5, ['stock_transfer'], 'stock_transfer', 'ASC', 1, 0)
                redisMaster.post('STOCK_TRANSFER_STATUS', JSON.stringify(stockTransferStatus))
                return (stockTransferStatus)
            }
    }

       
    CompanyActivityStatus = async (req,res) => {
            try{
                const companyActivityStatus = await this.getCompanyActivityStatus(req);
                res.status(200).send(companyActivityStatus);
    
            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }
    
    currentDateToString() {
        var varDate = new Date();
        varDate.setHours(varDate.getHours() + 4, varDate.getMinutes() + 30);
        // var isodate = varDate.toISOString();

        let date = varDate
        var mm = date.getMonth() + 1; // getMonth() is zero-based
        var dd = date.getDate();
    
        return [date.getFullYear(),
                (mm>9 ? '' : '0') + mm,
                (dd>9 ? '' : '0') + dd
            ].join('-');
    };

    getCompanyActivityStatus = async (req) => {
    try {
        
         const apiKey = req.header('X-Api-Key');
           
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('recharge/singleRecharge', JSON.stringify(req.body), JSON.stringify(req.query))

            //test 

                const companies = await sqlQuery.searchOrQuery(
                  this.tableName1,
                  { company_api_key: apiKey },
                  [
                    'company_name',
                    'company_uuid',
                    'allowed_ips',
                    'company_api_key',
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
                console.log("company", company);

    
        const searchUser = {
            username: company.account_username // Use the company account username to fetch user details
        };

        const userKeys = ['username', 'userid','full_name', 'mobile', 'user_uuid', 'usertype_id', 'region_id', 'user_status', 'active'];
        const userOrderBy = 'username';

        const userAccount = await sqlQuery.searchOrQuery(this.tableName2, searchUser, userKeys, userOrderBy, 'ASC', 1, 0);
        const user_detials = userAccount[0];

        if (!userAccount || userAccount.length !== 1) {
            throw new Error("Invalid or missing user account");
        }

        if (user_detials.active !== 1) {
            throw new Error("User account is in-active, Call AFP admin");
        }

        let avaliableBalance = 0, totalTransactions = 0, todayTopup = 0, todayCommission = 0;
        const todayDate = this.currentDateToString();

        const listAvaliableBalance = await sqlQueryReplica.searchQuery(this._tableName2, { userid: user_detials.userid }, ['ex_wallet', 'comm_wallet'], 'userid', 'ASC', 1, 0);
        if (listAvaliableBalance.length) {
            avaliableBalance = listAvaliableBalance[0].ex_wallet || 0;
            todayCommission = listAvaliableBalance[0].comm_wallet || 0;
        }

        const listTotalTransaction = await sqlQueryReplica.searchQuery(this._tableName4, { userid: user_detials.userid }, ['COUNT(userid)'], 'userid', 'ASC', 1, 0);
        totalTransactions = listTotalTransaction?.[0]?.["COUNT(userid)"] || 0;

        const listTodayTopup = await sqlQueryReplica.searchQuery(this._tableName4, { status: 2, userid: user_detials.userid ,created_on: todayDate }, ['SUM(amount) AS totalAmount'], 'userid', 'ASC', 1, 0);
        todayTopup = listTodayTopup?.[0]?.totalAmount || 0;

        return { avaliableBalance, totalTransactions, todayTopup };

    } catch (error) {
        throw error;
    }
    }


     getCompanyActivity = async (req) => {
    try {          
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('recharge/singleRecharge', JSON.stringify(req.body), JSON.stringify(req.query))

    
         const searchUser = {
            username: req.body.username || req.body.user_detials.username
        };

        const userKeys = ['username', 'userid','full_name', 'mobile', 'user_uuid', 'usertype_id', 'region_id', 'user_status', 'active'];
        const userOrderBy = 'username';

        const userAccount = await sqlQuery.searchOrQuery(this.tableName2, searchUser, userKeys, userOrderBy, 'ASC', 1, 0);
        const user_detials = userAccount[0];

        if (!userAccount || userAccount.length !== 1) {
            throw new Error("Invalid or missing user account");
        }

        if (user_detials.active !== 1) {
            throw new Error("User account is in-active, Call AFP admin");
        }

        let avaliableBalance = 0, totalTransactions = 0, todayTopup = 0, todayCommission = 0;
        const todayDate = this.currentDateToString();

        const listAvaliableBalance = await sqlQueryReplica.searchQuery(this._tableName2, { userid: user_detials.userid }, ['ex_wallet', 'comm_wallet'], 'userid', 'ASC', 1, 0);
        if (listAvaliableBalance.length) {
            avaliableBalance = listAvaliableBalance[0].ex_wallet || 0;
            todayCommission = listAvaliableBalance[0].comm_wallet || 0;
        }

        const listTotalTransaction = await sqlQueryReplica.searchQuery(this._tableName4, { userid: user_detials.userid }, ['COUNT(userid)'], 'userid', 'ASC', 1, 0);
        totalTransactions = listTotalTransaction?.[0]?.["COUNT(userid)"] || 0;

        const listTodayTopup = await sqlQueryReplica.searchQuery(this._tableName4, { status: 2, created_on: todayDate }, ['SUM(amount) AS totalAmount'], 'userid', 'ASC', 1, 0);
        todayTopup = listTodayTopup?.[0]?.totalAmount || 0;

        return { avaliableBalance, totalTransactions, todayTopup };

    } catch (error) {
        throw error;
    }
    }



    getAgentsName = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('login/getParentName',JSON.stringify(req.body), JSON.stringify(req.query), JSON.stringify(req.params))
            var offset = 0
            var limit = 10

            var searchKeyValue = {
                active: 1,
            }
            var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid", "username", "full_name",]
            var orderby = "usertype_id"
            var ordertype = "DESC"
             if(req.query.agent){
                var searchKeyValue = {
                    username: req.query.agent,
                    active: 1,
                }
                }
            // fire sql query to get str user_uuid, str full_name
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, limit, offset)

            console.log("lisResponce1", lisResponce1);
                   
            res.status(200).send({
                reportList : lisResponce1,
            })
            

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
}


module.exports = new companyController