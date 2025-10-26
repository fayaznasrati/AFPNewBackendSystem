const HttpException = require("../utils/HttpException.utils");
const { validationResult } = require("express-validator");
const sqlQuery = require("../common/sqlQuery.common");
const sqlQueryReplica = require("../common/sqlQueryReplica.common");
const redisMaster = require("../common/master/radisMaster.common");
const { encryptSecret } = require("../utils/encryption.utils");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
dotenv.config();
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const REPORT_DIR = "/var/www/html/AFPNewBackendSystem/the_topup_reports";

const rechargeService = require("./recharge.controller");
const { response } = require("express");
const { send } = require("express/lib/response");
const rechargeModel = require("../models/recharge.model");
const ERS_Util = require("../utils/ersAgentAPI.utils");

class companyController {
  tableName1 = "er_sub_company";
  tableName2 = "er_sub_company_rechage_reports";
  tableName3 = "er_sub_company_activity_logs";
  tableName4 = "er_sub_company_api_key_logs";

  //################---create company---################
  createCompany = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      console.log(
        "Company/createSubCompany",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );

      const date = new Date();
      date.setHours(date.getHours() + 4, date.getMinutes() + 30);
      const isodate = date.toISOString();

      const {
        sub_sub_company_name,
        allowed_ips = [],
        ers_ers_account_username,
        ers_account_user_password,
        status,
      } = req.body;

      const createdBy = req.query.username;
      if (!createdBy) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Missing or invalid username in query" }] });
      }

      // ❗ Check for duplicate IPs in input
      const uniqueIps = new Set(allowed_ips);
      if (uniqueIps.size !== allowed_ips.length) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Duplicate IPs detected in allowed_ips" }] });
      }

      // 🔍 Fetch all companies to validate against existing IPs
      const allCompanies = await sqlQuery.searchQueryNoCon(
        this.tableName1,
        ["allowed_ips"],
        "sub_sub_company_name",
        "ASC",
        1000,
        0
      );

      let registeredIps = new Set();
      for (let company of allCompanies) {
        try {
          const ips = JSON.parse(company.allowed_ips || "[]");
          ips.forEach((ip) => registeredIps.add(ip));
        } catch (e) {
          console.warn(`Failed to parse IPs for company:`, company);
        }
      }

      const conflictingIps = allowed_ips.filter((ip) => registeredIps.has(ip));
      if (conflictingIps.length > 0) {
        return res.status(400).json({
          errors: [
            {
              msg: `These IPs are already registered: ${conflictingIps.join(
                ", "
              )}`,
            },
          ],
        });
      }

      // ✅ Generate secure 256-bit (32 byte) API key
      const apiKey = crypto.randomBytes(32).toString("hex"); // 64-char hex string

      const param = {
        sub_company_uuid: uuidv4(),
        sub_sub_company_name,
        allowed_ips: JSON.stringify(allowed_ips),
        sub_sub_company_api_key: apiKey,
        bcrypt_hash: null,
        encrypted_secret: null,
        active: status ?? 1,
        ers_ers_account_username: ers_ers_account_username,
        ers_account_user_password: ers_account_user_password,
        created_by: createdBy,
        created_at: isodate,
        last_modified_by: createdBy,
        last_modified_on: isodate,
      };

      // 🚫 Check if company with same name and IPs exists
      const existingCompany = await sqlQuery.searchOrQuery(
        this.tableName1,
        {
          sub_sub_company_name: param.sub_sub_company_name,
          allowed_ips: param.allowed_ips,
        },
        ["sub_sub_company_name AS sub_sub_company_name"],
        "sub_sub_company_name",
        "ASC",
        10,
        0
      );
      if (existingCompany && existingCompany.length > 0) {
        return res
          .status(400)
          .json({
            errors: [
              { msg: "subCompany already exists with these allowed IPs" },
            ],
          });
      }

      // 🚫 Check if this user already registered a company
      const userCompanyExists = await sqlQuery.searchOrQuery(
        this.tableName1,
        {
          ers_ers_account_username: param.ers_ers_account_username,
        },
        ["sub_sub_company_name AS sub_sub_company_name"],
        "sub_sub_company_name",
        "ASC",
        10,
        0
      );
      if (userCompanyExists && userCompanyExists.length > 0) {
        return res.status(400).json({
          errors: [
            {
              msg: `subCompany already registered under this user: ${param.ers_ers_account_username}`,
            },
          ],
        });
      }

      // 💾 Insert into DB
      const objResult = await sqlQuery.createQuery(this.tableName1, param);
      if (!objResult) {
        throw new Error("Something went wrong during subCompany creation");
      }

      // 📘 Log activity
      await this.logActivity({
        action: "CREATE",
        entityType: "sub_company",
        entityId: objResult.sub_sub_company_id,
        performedBy: createdBy,
        details: {
          sub_sub_company_name: param.sub_sub_company_name,
          allowed_ips: param.allowed_ips,
          created_by: createdBy,
        },
      });

      return res
        .status(201)
        .send({ message: "subCompany created successfully!" });
    } catch (error) {
      console.error("createSubCompany error:", error);

      const message = error.message || "";
      const key = message.split("'");
      if (message.includes("Duplicate entry")) {
        return res
          .status(400)
          .json({ errors: [{ msg: `${key[1]} already registered` }] });
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

      console.log(
        "Company/editSubCompany",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );

      const {
        sub_company_name,
        allowed_ips,
        status,
        ers_account_username,
        ers_account_user_password,
      } = req.body;
      const modifiedBy = req.query.username;
      const id = req.params.id;

      if (!modifiedBy) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Missing or invalid username in query" }] });
      }

      if (!id) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Missing company ID" }] });
      }

      // ✅ Get current company info
      const existingCompany = await sqlQuery.searchOrQuery(
        this.tableName1,
        { sub_company_id: id },
        ["allowed_ips", "ers_account_username", "ers_account_user_password"],
        "sub_company_name",
        "ASC",
        1,
        0
      );

      if (!existingCompany || existingCompany.length !== 1) {
        return res.status(404).json({ errors: [{ msg: "Company not found" }] });
      }

      // 🔒 Parse existing allowed_ips safely
      let finalAllowedIps = [];
      try {
        finalAllowedIps = JSON.parse(existingCompany[0].allowed_ips || "[]");
        if (!Array.isArray(finalAllowedIps)) {
          finalAllowedIps = [];
        }
      } catch (e) {
        console.warn("Invalid allowed_ips format in DB, defaulting to []");
        finalAllowedIps = [];
      }

      // If allowed_ips is provided in body, validate and check for conflicts
      let allowedIpsToUpdate = null;
      if (allowed_ips !== undefined) {
        // ✅ Check for duplicates
        const uniqueIps = new Set(allowed_ips);
        if (uniqueIps.size !== allowed_ips.length) {
          return res
            .status(400)
            .json({
              errors: [{ msg: "Duplicate IPs detected in allowed_ips" }],
            });
        }

        // 🧠 Get all other companies to avoid IP conflict
        const allCompanies = await sqlQuery.searchQueryNoCon(
          this.tableName1,
          ["sub_company_id", "allowed_ips"],
          "sub_company_name",
          "ASC",
          1000,
          0
        );

        let registeredIps = new Set();
        for (let company of allCompanies) {
          if (company.sub_company_id === id) continue;
          try {
            const ips = JSON.parse(company.allowed_ips || "[]");
            ips.forEach((ip) => registeredIps.add(ip));
          } catch (e) {
            console.warn(`Failed to parse IPs for subcompany:`, company);
          }
        }

        const conflictingIps = allowed_ips.filter((ip) =>
          registeredIps.has(ip)
        );
        if (conflictingIps.length > 0) {
          return res.status(400).json({
            errors: [
              {
                msg: `These IPs are already registered by other sub companies: ${conflictingIps.join(
                  ", "
                )}`,
              },
            ],
          });
        }

        // ✅ Safe to assign
        allowedIpsToUpdate = JSON.stringify(allowed_ips);
      }

      // 📦 Build update fields
      const updateFields = {
        sub_company_name,
        active: status ?? 1, // Default to 1 if not provided
        last_modified_by: modifiedBy,
        last_modified_on: new Date().toISOString(),
      };

      // 🧱 Optional field
      if (ers_account_username !== null && ers_account_username !== undefined) {
        updateFields.ers_account_username = ers_account_username;
      }
      // 🧱 Optional field
      if (
        ers_account_user_password !== null &&
        ers_account_user_password !== undefined
      ) {
        updateFields.ers_account_user_password = ers_account_user_password;
      }
      // 🧱 Optional field
      if (allowedIpsToUpdate !== null && allowedIpsToUpdate !== undefined) {
        updateFields.allowed_ips = allowedIpsToUpdate;
      }

      // 💾 Perform update
      const result = await sqlQuery.updateQuery(this.tableName1, updateFields, {
        sub_company_id: id,
      });

      if (!result || result.affectedRows === 0) {
        throw new Error("Failed to update company");
      }
      const changes = {};
      if (
        sub_company_name &&
        sub_company_name !== existingCompany[0].sub_company_name
      ) {
        changes.sub_company_name = {
          old: existingCompany[0].sub_company_name,
          new: sub_company_name,
        };
      }
      if (
        ers_account_username &&
        ers_account_username !== existingCompany[0].ers_account_username
      ) {
        changes.ers_account_username = {
          old: existingCompany[0].ers_account_username,
          new: ers_account_username,
        };
      }
      if (
        ers_account_user_password &&
        ers_account_user_password !==
          existingCompany[0].ers_account_user_password
      ) {
        changes.ers_account_user_password = {
          old: existingCompany[0].ers_account_user_password,
          new: ers_account_user_password,
        };
      }
      if (
        allowedIpsToUpdate !== null &&
        allowedIpsToUpdate !== existingCompany[0].allowed_ips
      ) {
        changes.allowed_ips = {
          old: existingCompany[0].allowed_ips,
          new: allowedIpsToUpdate,
        };
      }

      await this.logActivity({
        action: "UPDATE",
        entityType: "subCompany",
        entityId: id,
        performedBy: modifiedBy,
        details: changes,
      });

      return res.status(200).json({ message: "Company updated successfully" });
    } catch (error) {
      console.error("editCompany error:", error);

      const message = error.message || "";
      const key = message.split("'");
      if (message.includes("Duplicate entry")) {
        return res
          .status(400)
          .json({ errors: [{ msg: `${key[1]} already exists` }] });
      }

      return res.status(500).json({ errors: [{ msg: message }] });
    }
  };

  getCompanyById = async (req, res, next) => {
    try {
      // check body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "company/getsubCompanyById",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );

      //test
      var key = [
        "sub_company_id AS id",
        "sub_company_name AS name",
        "allowed_ips",
        "sub_company_api_key AS API_key",
        "encrypted_secret",
        "active AS status",
        "ers_account_username AS ers_account_username",
        "ers_account_user_password AS ers_account_user_password ",
        "created_at",
        "created_by",
        "last_modified_by",
        "last_modified_on",
      ];
      if (req.params.id) {
        var searchKeyValue = {
          sub_company_id: req.params.id,
        };
      }
      // fire sql query to get str user_uuid, str full_name
      const theCompany = await sqlQueryReplica.searchQueryById(
        this.tableName1,
        searchKeyValue,
        key
      );
      const company = theCompany[0];
      console.log("company", company);

      const reqClone = {
        ...req,
        body: {
          ...req.body,
          user_detials: {
            username: company.ers_account_username,
            password: company.ers_account_user_password,
          },
        },
      };
      const status = await this.getCompanyActivity(reqClone);

      const result = { ...company, ersAgentStatusDetails: status };
      res.status(200).send({
        reportList: result,
      });
    } catch (error) {
      throw error;
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
      console.log(
        "subCompanies",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      if (!req.query.pageNumber) req.query.pageNumber = 0;

      var orderby = "sub_company_id";
      var ordertype = "DESC";

      var key = [
        "sub_company_id",
        "sub_company_name ",
        "allowed_ips",
        "sub_company_api_key",
        "bcrypt_hash",
        "active",
        "ers_account_username ",
        "created_at",
        "created_by",
        "last_modified_by",
        "last_modified_on",
      ];
      let lisTotalRecords = await sqlQuery.selectStar(this.tableName1, key);
      let intTotlaRecords = Number(lisTotalRecords.length);
      let intPageCount =
        intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0
          ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT)
          : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1;

      let offset =
        req.query.pageNumber > 0
          ? Number(req.query.pageNumber - 1) *
            Number(process.env.PER_PAGE_COUNT)
          : 0;
      let limit =
        req.query.pageNumber > 0
          ? Number(process.env.PER_PAGE_COUNT)
          : intTotlaRecords;
      let companyList = await sqlQuery.searchQueryNoCon(
        this.tableName1,
        [
          "sub_company_id AS id",
          "sub_company_name AS name",
          "allowed_ips",
          "sub_company_api_key AS API_key",
          "bcrypt_hash",
          "active AS status",
          "ers_account_username AS ers_account_username",
          "ers_account_user_password",
          "ers_account_user_password ",
          "created_at",
          "created_by",
          "last_modified_by",
          "last_modified_on",
        ],
        orderby,
        ordertype,
        limit,
        offset
      );
      // check date for start and end

      if (!companyList || companyList.length == 0) {
        return res
          .status(200)
          .send({
            data: [],
            totalRecords: intTotlaRecords,
            pageCount: intPageCount,
          });
      } else {
        const enrichedCompanyList = await Promise.all(
          companyList.map(async (company) => {
            try {
              // const reqClone = { ...req, body: { ...req.body, user_detials: { username: company.ers_account_username, password:company.ers_account_user_password  } } };
              // const status = await this.getCompanyActivity(reqClone);
              // return { ...company, statusDetails: status };
              return { ...company };
            } catch (err) {
              console.error(
                `Error for sub company ${company.name}:`,
                err.message
              );
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
          pageLimit: Number(process.env.PER_PAGE_COUNT),
        });
      }
    } catch (error) {
      console.error(error);
      if (req.query.pageNumber == 0) {
        res.status(200).send([{}]);
      }
    }
  };

  downloadCompanies = async (req, res) => {
    try {
      console.log(
        "Company/downloadCompanies",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.query.pageNumber) req.query.pageNumber = 0;

      const orderby = "sub_company_id";
      const ordertype = "DESC";

      const key = [
        "sub_company_id",
        "sub_company_name",
        "allowed_ips",
        "sub_company_api_key",
        "bcrypt_hash",
        "active",
        "ers_account_username",
        "ers_account_username",
        "created_at",
        "created_by",
        "last_modified_by",
        "last_modified_on",
      ];

      const lisTotalRecords = await sqlQuery.selectStar(this.tableName1, key);
      const intTotlaRecords = lisTotalRecords.length;
      const intPageCount = Math.ceil(
        intTotlaRecords / Number(process.env.PER_PAGE_COUNT)
      );

      const offset =
        req.query.pageNumber > 0
          ? (Number(req.query.pageNumber) - 1) *
            Number(process.env.PER_PAGE_COUNT)
          : 0;
      const limit =
        req.query.pageNumber > 0
          ? Number(process.env.PER_PAGE_COUNT)
          : intTotlaRecords;

      let rawCompanies = await sqlQuery.searchQueryNoCon(
        this.tableName1,
        [
          "sub_company_id AS id",
          "sub_company_name AS name",
          "allowed_ips",
          "sub_company_api_key AS API_key",
          "bcrypt_hash",
          "active AS status",
          "ers_account_username AS belongs_to",
          "ers_account_username AS belongs_to_id",
          "created_at",
          "created_by",
          "last_modified_by",
          "last_modified_on",
        ],
        orderby,
        ordertype,
        limit,
        offset
      );
      rawCompanies = rawCompanies.map((company) => ({
        ...company,
        status: company.status === 1 ? "Active" : "Inactive",
      }));

      if (!rawCompanies || rawCompanies.length === 0) {
        return res.status(200).send({
          reportList: [],
          totalRepords: 0,
          pageCount: 0,
          currentPage: Number(req.query.pageNumber),
          pageLimit: Number(process.env.PER_PAGE_COUNT),
        });
      }

      const enrichedCompanyList = await Promise.all(
        rawCompanies.map(async (company) => {
          try {
            const reqClone = {
              ...req,
              body: {
                ...req.body,
                user_detials: { username: company.belongs_to },
              },
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
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
        const fileName = `company_list_${dateStr}_${timeStr}.xlsx`;
        const filePath = path.join(REPORT_DIR, fileName);

        // If file exists and is recent, reuse it
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const createdTime = moment(stats.ctime);
          if (moment(now).diff(createdTime, "minutes") < 30) {
            return res.status(200).json({
              success: true,
              downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`,
            });
          }
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Companies");

        // Set columns from enriched keys
        if (enrichedCompanyList.length > 0) {
          const sample = enrichedCompanyList[0];
          sheet.columns = Object.keys(sample).map((key) => ({
            header: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            key,
            width: 25,
          }));
          sheet.getRow(1).font = { bold: true };
          sheet.addRows(enrichedCompanyList);
        }

        await workbook.xlsx.writeFile(filePath);

        // Auto-delete
        setTimeout(() => {
          fs.unlink(filePath, (err) => {
            if (err && err.code !== "ENOENT") {
              console.error(
                `Failed to delete report file ${fileName}:`,
                err.message
              );
            }
          });
        }, 30 * 60 * 1000);

        return res.status(200).json({
          success: true,
          downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`,
        });
      }

      return res.status(200).send({
        reportList: enrichedCompanyList,
        totalRepords: intTotlaRecords,
        pageCount: intPageCount,
        currentPage: Number(req.query.pageNumber),
        pageLimit: Number(process.env.PER_PAGE_COUNT),
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

      if (isNaN(companyId))
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid company ID" }] });
      if (!userid)
        return res
          .status(400)
          .json({ errors: [{ msg: "Missing username in query" }] });

      const existingCompany = await sqlQuery.searchOrQuery(
        this.tableName1,
        { sub_company_id: companyId },
        ["sub_company_name", "sub_company_api_key"],
        "sub_company_name",
        "ASC",
        10,
        0
      );

      if (!existingCompany || existingCompany.length === 0) {
        return res.status(404).json({ errors: [{ msg: "Company not found" }] });
      }

      const companyName = existingCompany[0].sub_company_name;
      const API_key = existingCompany[0].sub_company_api_key;
      // const API_key = process.env.COMPANY_API_SECRET_KEY; // Use env variable or existing key

      // 1. Generate shared secret key
      const secretKey = crypto.randomBytes(32).toString("hex"); // 256-bit secret

      // 2. Validate and prepare API key as encryption key
      const keyBuffer = Buffer.from(API_key, "hex");
      if (keyBuffer.length !== 32) {
        throw new Error("Invalid API key length. Must be 256-bit (32 bytes).");
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
        last_modified_on: new Date(),
      };

      const result = await sqlQuery.updateQuery(this.tableName1, updateValues, {
        sub_company_id: companyId,
      });
      if (!result || result.affectedRows === 0) {
        throw new Error("Failed to update company with generated keys");
      }

      // 6. Audit logging (you can mask secret if needed)
      await this.logApiKeyGeneration({
        companyId,
        companyName,
        encryptedSecret,
        generatedBy: userid,
        note: "New API key and secret created for company",
      });

      // 7. Send download response
      const downloadData = {
        sub_company_name: companyName,
        secret: encryptedSecret,
        note: "Store this secret securely; it cannot be retrieved again from our side.",
      };

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=company_keys_${companyId}.json`
      );
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(downloadData, null, 2));
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ errors: [{ msg: error.message || "Server error" }] });
    }
  };

  logActivity = async ({
    action,
    entityType,
    entityId,
    performedBy,
    details,
  }) => {
    const payload = {
      action,
      entity_type: entityType,
      entity_id: entityId,
      performed_by: performedBy,
      details: JSON.stringify(details),
      performed_at: new Date().toISOString(),
    };

    return await sqlQuery.createQuery(this.tableName3, payload);
  };

  logApiKeyGeneration = async ({
    companyId,
    companyName,
    encryptedSecret,
    generatedBy,
    note = "New Secret Key generated",
  }) => {
    const logData = {
      sub_company_id: companyId,
      sub_company_name: companyName,
      encrypted_secret: "**********************", // Masked for security
      generated_by: generatedBy,
      generated_at: new Date(),
      note,
    };

    return await sqlQuery.createQuery(this.tableName4, logData);
  };

  checkValidation = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      throw new HttpException(400, "Validation faild", errors);
    }
  };

  //################---Single recharge for company---################
  CompanySinglerecharge = async (req, res, next) => {
    const apiKey = req.header("X-Api-Key");

    try {
      // check body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const amount = errors.errors[0].value;
        if (amount === 0) {
          return res.send({
            status: 400,
            message: "Recharge amount must be greater than zero, 0",
          });
        } else {
          return res.status(400).json({ errors: errors.array() });
        }
      }
      console.log(
        "sub company recharge/singleRecharge",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );

      //test

      const companies = await sqlQuery.searchOrQuery(
        this.tableName1,
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
      console.log("company", company);

      const subComUuidBuffer = company.sub_company_uuid; // Assume it's a Buffer
      const subComUuidStr = subComUuidBuffer.toString("utf8");

      // Extract only the useful part (until first null character if any)
      const the_sub_com_uuid = subComUuidStr.split("\0")[0]; // "6e481e53-d5fa-11"

      let operator_uuid = "",
        operator_name = "";

      switch (req.body.mobile.slice(0, 3)) {
        case "078":
        case "073":
          // Etisalat
          operator_uuid = "70b9906d-c2ba-11";
          operator_name = "Etisalat";
          break;
        case "079":
        case "072":
          // Roshan
          operator_uuid = "9edb602c-c2ba-11";
          operator_name = "Roshan";
          break;
        case "077":
        case "076":
          // MTN
          (operator_uuid = "456a6b47-c2ba-11"), (operator_name = "MTN");
          break;
        case "074":
          // Salaam
          operator_uuid = "1e0e1eeb-c2a6-11";
          operator_name = "Salaam";
          break;
        case "070":
        case "071":
          // AWCC
          operator_uuid = "6a904d84-c2a6-11";
          operator_name = "AWCC";
          break;
      }

      if (!operator_uuid && !operator_name) {
        return res
          .status(400)
          .json({
            errors: [
              { msg: "Mobile number does not match with selected operator" },
            ],
          });
      }

      var date = new Date();
      date.setHours(date.getHours() + 4, date.getMinutes() + 30);
      var isodate = date.toISOString();
      const strDate = date.toISOString().slice(0, 19).replace("T", " "); //dt current date time
      const strUniqueNumber = await this.dataBaseId(date); //str unique number

      let params = {
        afghan_pay_txn_id: null, //first it shoul be null, after getting response form ERS it will be updated TXID
        balance_after_recharge: null, // new field for storing balance
        sub_company_name: company.sub_company_name,
        sub_company_uuid: the_sub_com_uuid,
        ers_account_username: company.ers_account_username,
        sub_company_transaction_id: req.body.transaction_id
          ? req.body.transaction_id
          : null,
        type_id: 1, // top up
        type_name: "Top Up",
        operator_name: operator_name,
        operator_uuid: operator_uuid,
        mobile_number: req.body.mobile,
        amount: req.body.amount,
        source: "Sub Company API",
        status: 1, // 1 pending 2 success 3 faild
        created_on: strDate, //date curren date time
        modified_on: strDate, //date curren date time
      };
      //fire sql query to store the recharge
      let responce = await sqlQuery.createQuery(this.tableName2, params);

      const username = company.ers_account_username;
      const password = company.ers_account_user_password;
      const body = {
        mobile: req.body.mobile,
        amount: req.body.amount,
        operator_uuid: operator_uuid,
        operatorName: operator_name,
        userApplicationType: "Web",
      };
      // pass the params to the ERS to process the recharge
      let ersResponse = await this.ERS_Recharge(body, username, password);
      console.log("ERS Response:", ersResponse);

      let statusToUpdate = 3; // default failed
      let afghanPayTxnId = null;
      let balanceAfterRecharge = null;
      if (ersResponse && ersResponse.message) {
        const match = ersResponse.message.match(/TX:(\d+)/);
        if (match && match[1]) {
          afghanPayTxnId = match[1];
          statusToUpdate = 2; // success
        }
        // Match Balance
        const balMatch = ersResponse.message.match(/Bal:(\d+(\.\d+)?)/);
        if (balMatch && balMatch[1]) {
          balanceAfterRecharge = parseFloat(balMatch[1]);
        }
      }
      // 8️ Update record in DB
      await sqlQuery.updateQuery(
        this.tableName2,
        {
          status: statusToUpdate,
          afghan_pay_txn_id: afghanPayTxnId,
          balance_after_recharge: balanceAfterRecharge,
          modified_on: strDate,
        },
        { sub_company_transaction_id: req.body.transaction_id }
      );

      // Send final response to company
      return res.status(200).json({
        status: statusToUpdate === 2 ? "success" : "failed",
        message: ersResponse?.message || "Recharge failed",
        txid: afghanPayTxnId,
      });
    } catch (error) {
      res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };
  //=============== Helper ===============
  ERS_Recharge = async (body, username, password) => {
    try {
      console.log("ERS Recharge called", body, username);
      return await ERS_Util.ersPost(
        username,
        password,
        `/recharge/single/?username=${username}`,
        body
      );
    } catch (error) {
      console.error("ERS Recharge Error:", error.message);
      throw error;
    }
  };

  dataBaseId = async (date) => {
    console.log(date);

    let randomNumber = await redisMaster.incr("RECH_RANDUM_ID");
    if (randomNumber < 100) {
      await redisMaster.post("RECH_RANDUM_ID", 100);
      randomNumber = 100;
    }
    var id = this.pad2(date.getDate());
    id += this.pad2(date.getMonth() + 1);
    id += date.toISOString().slice(2, 4);
    id += this.pad2(date.getHours());
    id += this.pad2(date.getMinutes());
    id += this.pad2(date.getSeconds());
    // id += varRandomString.generateRandomNumber(3)
    id += String(randomNumber);

    if (randomNumber > 900) {
      await redisMaster.post("RECH_RANDUM_ID", 100);
    }

    return id;
  };
  pad2 = (n) => {
    return n < 10 ? "0" + n : n;
  };

  //  recharge ststus
  getCompanyRechargeStatus = async (req, res) => {
    try {
      // check body and query
      const { mobile, amount, transaction_id } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "sub company recharge status/getRechageStatus",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );

      // sql search param
      var searchKeyValue = {
        mobile_number: mobile,
        amount,
        sub_company_transaction_id: transaction_id,
      };
      var key = [
        "afghan_pay_txn_id AS AFPTransNumber",
        "sub_company_transaction_id AS companyTransactionNumber",
        "operator_name AS operatorName",
        "mobile_number AS number",
        "amount",
        "status",
        "CAST(created_on AS CHAR(20)) AS rechargeDate",
      ];

      const lisResponce1 = await sqlQuery.searchQueryNoLimitTimeout(
        this.tableName2,
        searchKeyValue,
        key,
        "id",
        "ASC"
      );
      if (lisResponce1.length == 0)
        return res.status(404).send({ message: "no recharge found" });
      const theResponce = lisResponce1[0];
      let response = {};

      switch (theResponce.status) {
        case 1:
          response = {
            status: "PENDING",
            details: theResponce,
          };
          break;
        case 2:
          response = {
            status: "SUCCESS",
            details: theResponce,
          };
          break;
        case 3:
          response = {
            status: "FAILD",
            details: theResponce,
          };
          break;
        default:
          response = {
            status: "FAILD",
            details: theResponce,
          };
      }
      console.log(response);
      res.status(200).send(response);
    } catch (error) {
      console.error("getCompanyRechargeStatus", error);
      res.status(200).send({ count: 0, theResponce: [{}] });
    }
  };

  // recharge report #########################################
  getCompanyRechargeReport = async (req, res) => {
    try {
      // body and query validators
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const apiKey = req.header("X-Api-Key");
      // Get company by API key
      const companies = await sqlQuery.searchOrQuery(
        this.tableName1,
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
        ],
        "sub_company_name",
        "ASC",
        1,
        0
      );
      const company = companies[0];
      console.log("company", company, company.ers_account_username);

      if (!req.query.pageNumber) req.query.pageNumber = 0;

      // optional search paremeters
      var searchKeyValue = {
        Active: 1,
        ers_account_username: company.ers_account_username,
      };

      if (req.query.search) {
        if (req.query.search.length == 10)
          searchKeyValue.mobile_number = req.query.search;
        else searchKeyValue.sub_company_transaction_id = req.query.search;
      }

      if (req.query.status) {
   
          searchKeyValue.status = req.query.status;
        
      }

      // let sum and count
      const lisTotalRecords = await rechargeModel.subCompanyTopupSumCountReport(
        searchKeyValue
      );
      if (lisTotalRecords.length == 0)
        return res.status(400).send({ message: "Calculation error" });

      let intTotlaRecords = Number(lisTotalRecords[0].count);
      let intPageCount =
        intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0
          ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT)
          : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1;
      let sumRechargeAmount = Number(lisTotalRecords[0].amount) || 0;

      // check the searchKeyValue parem
      if (Object.keys(searchKeyValue).length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Improper search paremeters" }] });
      let offset =
        req.query.pageNumber > 0
          ? Number(req.query.pageNumber - 1) *
            Number(process.env.PER_PAGE_COUNT)
          : 0;
      let limit =
        req.query.pageNumber > 0
          ? Number(process.env.PER_PAGE_COUNT)
          : intTotlaRecords;

      // use module to search list
      const lisResponce1 = await rechargeModel.SubCompanyRechargeReport(
        searchKeyValue,
        limit,
        offset
      );
      if (lisResponce1.length == 0)
        return res.status(204).send({ message: "no transaction found" });

      res.status(200).send({
        reportList: lisResponce1,
        totalRecords: intTotlaRecords,
        pageCount: intPageCount,
        currentPage: Number(req.query.pageNumber),
        totalRechargeAmount: lisTotalRecords[0].amount || 0,
        pageLimit: Number(process.env.PER_PAGE_COUNT),
      });
    } catch (error) {
      console.error("CompanyRechageReport", error);

      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  checkSubCompanyBalance = async (req, res) => {
    try {
      const apiKey = req.header("X-Api-Key");
      const companies = await sqlQuery.searchOrQuery(
        this.tableName1,
        { sub_company_api_key: apiKey },
        ["ers_account_username", "ers_account_user_password"],
        "sub_company_name",
        "ASC",
        1,
        0
      );
      const company = companies[0];
      console.log("company", company);
      const username = company.ers_account_username;
      const password = company.ers_account_user_password;
      const data = await ERS_Util.ersGet(
        username,
        password,
        `/dashboard/agent/dashboard-status/?username=${username}`
      );

      // keep only selected keys
      const {
        avaliableBalance,
        totalTransactions,
        totalCommission,
        todayTopup,
      } = data;

      const filteredData = {
        avaliableBalance,
        totalTransactions,
        totalCommission,
        todayTopup,
      };
      console.log("Data:", data);
      res.status(200).send({ filteredData });
    } catch (error) {
      console.log(error);
      res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  currentDateToString() {
    var varDate = new Date();
    varDate.setHours(varDate.getHours() + 4, varDate.getMinutes() + 30);
    // var isodate = varDate.toISOString();

    let date = varDate;
    var mm = date.getMonth() + 1; // getMonth() is zero-based
    var dd = date.getDate();

    return [
      date.getFullYear(),
      (mm > 9 ? "" : "0") + mm,
      (dd > 9 ? "" : "0") + dd,
    ].join("-");
  }

  getCompanyActivity = async (req) => {
    try {
      const username = req.body.user_detials.username;
      const password = req.body.user_detials.password;

      const data = await ERS_Util.ersGet(
        username,
        password,
        `/dashboard/agent/dashboard-status/?username=${username}`
      );

      console.log("Data:", data);
      return { data };
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  };
}

module.exports = new companyController();
