const HttpException = require("../utils/HttpException.utils");
const { validationResult } = require("express-validator");

const sqlQuery = require("../common/sqlQuery.common");
const sqlQueryReplica = require("../common/sqlQueryReplica.common");

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

const redisMaster = require("../common/master/radisMaster.common");

// configer env
dotenv.config();

const commonQueryCommon = require("../common/commonQuery.common");
const req = require("express/lib/request");
const res = require("express/lib/response");
const bundleRechargeModel = require("../models/bundleRecharge.model");

/******************************************************************************
 *                              ebundle Controller
 ******************************************************************************/
const ebundleTypes = {};
class EbundleController {
  tableName1 = "er_ebundles";

  tableName2 = 'er_login'
  tableName3 = 'er_agent_operator_access'
  tableName4 = 'er_wallet'
  tableName5 = 'er_wallet_transaction'
  tableName6 = 'er_operator_topup'
  tableName7 = 'er_member'
  tableName8 = 'er_postpaid_commission'
  tableName9 = 'er_commission_amount'
  tableName10 = 'er_member_group'
  tableName11 = 'er_money_current_balance'
  tableName12 = 'er_monthly_recharge'
  tableName13 = 'er_prepaid_commission'
  tableName14 = 'er_agent_stock_transfer_channel'
  tableName15 = 'er_salaam_topup'
  tableName16 = 'er_awcc_topup'
  tableName17 = 'er_mtn_topup'
  tableName18 = 'er_etisalat_topup'
  tableName19 = 'er_roshan_topup'
  tableName20 = 'er_mno_details'
  tableName21 = 'er_emoney'
  tableName22 = 'er_monthly_recharge'
  tableName23 = 'er_admin_notification_numbers'
  tableName24 = 'er_access_status'
  tableName25 = `er_daily_topup_summery`

  //function to get all ebundle
  getEbundle = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const searchKeyValue = {};
      const key = ["*"]; // Fetches all columns
      const orderby = "operatorType"; // Assuming 'id' is a column in your table
      const ordertype = "ASC";
      const result = await sqlQuery.searchQueryNoConNolimit(
        this.tableName1,
        key,
        orderby,
        ordertype
      );
      res.json(result);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };


  //function to get a ebundle by id
  getMNOsBundles = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // const eBundleTypesId = req.query.eBundleTypes; // Extract ID from query parameters
    // const operatorID = req.query.operator_uuid; // Extract ID from query parameters
    // if (!eBundleTypesId) {
    //   return res.status(400).json({ error: "Bundle Type is required" });
    // }
    // if (!operatorID) {
    //   return res.status(400).json({ error: "MNO type is required" });
    // }

    // const searchKeyValue = { ebundleType: eBundleTypesId,operator_uuid:operatorID }; // Search criteria

   
    const operatorID = req.query.operator_uuid;
    const searchKeyValue = { operator_uuid:operatorID };

    const key = ["*"]; // Fetches all columns
    const orderby = "created_on"; // Assuming 'id' is a column in your table
    const ordertype = "ASC";
    const result = await sqlQuery.searchQueryNoLimit(
      this.tableName1,
      searchKeyValue,
      key,
      orderby,
      ordertype
    );
    console.log("result", result);
    if (result.length === 0) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    // res.json(result[0]); // Return the first (and only) result
    res.json(result); // Return the first (and only) result
  } catch (error) {
    console.log(error);
    return res.status(400).json({ errors: [{ msg: error.message }] });
  }
  };


  filterEbundle = async (req, res, next) => {
    try {
      console.log("req.body:",req.body)
      console.log("req.query:",req.query)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const searchKeyValue = {
        ebundleType: req.query.eBundleTypes,
        operator_uuid: req.query.operator_uuid,
        status: req.query.status,
      };
      const key = ["*"]; // Fetches all columns
      const orderby = "ebundle_id"; // Assuming 'id' is a column in your table
      const ordertype = "ASC";
      const result = await sqlQuery.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );
      res.json(result);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  //function to get a ebundle by id
  getEbundleById = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bundleId = req.query.ebundle_id; // Extract ID from query parameters
      if (!bundleId) {
        return res.status(400).json({ error: "Bundle ID is required" });
      }

      const searchKeyValue = { ebundle_id: bundleId }; // Search criteria

      const key = ["*"]; // Fetches all columns
      const orderby = "ebundle_id"; // Assuming 'id' is a column in your table
      const ordertype = "ASC";
      const result = await sqlQuery.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );
      console.log("result", result);
      if (result.length === 0) {
        return res.status(404).json({ error: "Bundle not found" });
      }

      // res.json(result[0]); // Return the first (and only) result
      res.json(result); // Return the first (and only) result
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // create createEbundle query
  createEbundle = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
         // check if the same bundle exsit for MNO already
         const searchKeyValue = { techName: req.body.techName, operator_uuid: req.body.operator_uuid }; // Search criteria

         const key = ["*"]; // Fetches all columns
         const orderby = "ebundle_id"; // Assuming 'id' is a column in your table
         const ordertype = "ASC";
         const result = await sqlQuery.searchQueryNoLimit(
           this.tableName1,
           searchKeyValue,
           key,
           orderby,
           ordertype
         );
         console.log("result", result);
         if (result.length > 0) {
           return res.status(404).json({ error: "Bundle already exsit with the same technical name!" });
         }

      console.log(
        "ebundle-topup/create-bundle",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      var date = new Date();
      date.setHours(date.getHours() + 4, date.getMinutes() + 30);
      var isodate = date.toISOString();

      // 1) create parameter
      var param = {
        userId: req.body.userId,
        userType: req.body.userType, //str user name
        status: req.body.status,
        operator_uuid: req.body.operator_uuid,
        operatorType: req.body.operatorType,
        ebundleType: req.body.ebundleType,
        techName: req.body.techName,
        en_bundleDesc: req.body.en_bundleDesc,
        dr_bundleDesc: req.body.dr_bundleDesc,
        ps_bundleDesc: req.body.ps_bundleDesc,
        en_title: req.body.en_title,
        dr_title: req.body.dr_title,
        ps_title: req.body.ps_title,
        validity: req.body.validity,
        packageName: req.body.packageName,
        amount: req.body.amount,
        amountValue: req.body.amountValue,
        price: req.body.price,
        created_on: isodate, //date curren date time
        updated_on: isodate, //date curren date time
      };

         // 2) create agent sql query
      const objResult = await sqlQuery.createQuery(this.tableName1, param);

      if (!objResult) {
        throw new HttpException(500, "Something went wrong");
      }

      // semd responce
      res.status(201).send({ message: "E-bundle created successfully!" });
    } catch (error) {
      console.log(error);
      let message = error.message;
      let key = message.split("'");
      if (message.includes("Duplicate entry "))
        return res
          .status(400)
          .json({ errors: [{ msg: key[1] + " allready registered" }] });
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  //function to update ebundle
  updateBundle = async (req, res, next) => {
    try {
      console.log(req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      // Extract the bundleId from query parameters
      const bundleId = req.query.ebundle_id; // Extract ID from query parameters
      if (!bundleId) {
        return res.status(400).json({ error: "Bundle ID is required" });
      }
  
      // Search criteria for checking duplicates
      const searchKeyValue1 = {
        techName: req.body.techName, 
        operator_uuid: req.body.operator_uuid
      }; 
  
      // Check if there is already a bundle with the same techName and operator_uuid,
      // but exclude the current bundleId (to allow updates on the same bundle)
      const existingBundle = await sqlQuery.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue1,
        ["*"], // Fetch all columns
        "ebundle_id",
        "ASC"
      );
  
      if (existingBundle && existingBundle.length > 0) {
     
        // Explicitly compare as strings to avoid type mismatches
        const isSameBundle = existingBundle.some(
          (item) => String(item.ebundle_id) === String(req.query.ebundle_id)
        );
      
        // If it's not the same bundle (i.e., the ebundle_id doesn't match), trigger the duplicate check
        if (!isSameBundle) {
          return res.status(400).json({
            errors: [{ msg: "This bundle with the same operator UUID and techName already exists." }]
          });
        }
      }
      
  
      console.log("bundle update", JSON.stringify(req.body), JSON.stringify(req.query));
  
      // Variables for the SQL query to update the bundle
      const param = {
        operator_uuid: req.body.operator_uuid,
        operatorType: req.body.operatorType,
        ebundleType: req.body.ebundleType,
        en_title: req.body.en_title,
        dr_title: req.body.dr_title,
        ps_title: req.body.ps_title,
        amount: req.body.amount,
        amountValue: req.body.amountValue,
        techName: req.body.techName,
        price: req.body.price,
        packageName: req.body.packageName,
        validity: req.body.validity,
        en_bundleDesc: req.body.en_bundleDesc,
        dr_bundleDesc: req.body.dr_bundleDesc,
        ps_bundleDesc: req.body.ps_bundleDesc,
        status: req.body.status,
      };
  
      // Fire the SQL query to update the bundle
      const objResult = await sqlQuery.updateQuery(
        this.tableName1,
        param,
        { ebundle_id: bundleId }
      );
  
      // Check the result and respond accordingly
      if (!objResult) {
        throw new HttpException(500, "Something went wrong");
      }
  
      const { affectedRows, changedRows, info } = objResult;
      const message =
        !affectedRows
          ? "Bundle not found"
          : affectedRows && changedRows
          ? "Bundle updated successfully"
          : "Updated status is the same as previous status";
  
      const status = !affectedRows ? 400 : affectedRows && changedRows ? 200 : 200;
  
      // Send response to the front end
      res.status(status).send({ message, info });
    } catch (error) {
      console.log(error);
      let message = error.message;
      let key = message.split("'");
      if (message.includes("Duplicate entry ")) {
        return res.status(400).json({
          errors: [{ msg: key[1] + " already registered" }]
        });
      }
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };
  
  //function to delete ebundle
  deleteBundle = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bundleId = req.query.ebundle_id; // Extract ID from query parameters
      if (!bundleId) {
        return res.status(400).json({ error: "Bundle ID is required" });
      }

      const searchKeyValue = { ebundle_id: bundleId }; // Search criteria

      const result = await sqlQuery.deleteQuery(
        this.tableName1,
        searchKeyValue
      );
      console.log("result", result);
      if (result.length === 0) {
        return res.status(404).json({ error: "Bundle not found" });
      }

      // check if the result is there and responce accordingly
      if (!result) {
        throw new HttpException(500, "Something went wrong");
      }
      // send responce to front end
      res.status(200).send({ message: "ebundle  Deleted successfully" });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };


  getEbundleReports = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.query.pageNumber) req.query.pageNumber = 0;

        let searchKeyValue = { Active: 1 };

        if (req.body.user_detials.region_list.length != 7) {
            searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
        }

        if (req.query.mobile) {
            if (req.query.mobile.length == 10) {
                searchKeyValue.mobile_number = req.query.mobile;
            } else {
                searchKeyValue.trans_number = req.query.mobile;
            }
        }

        if (req.query.userId) {
            searchKeyValue.username = req.query.userId;
        }

        if (req.query.userName) {
            if (Number(req.query.userName)) {
                let reqNum = [];
                if (req.query.userName.length == 10) {
                    reqNum = [req.query.userName, req.query.userName.slice(1, 11)];
                } else {
                    reqNum = [req.query.userName, '0' + req.query.userName];
                }
                searchKeyValue.request_mobile_no = reqNum;
            } else {
                searchKeyValue.full_name = req.query.userName;
            }
        }

    

        if (!searchKeyValue.trans_number) {
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) {
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            }

            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate;
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate;
            }
        }

        if (req.query.operator_uuid) {
            const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid);
            if (lisResponce1 == 0) {
                return res.status(400).json({ errors: [{ msg: "Operator ID not found" }] });
            }
            searchKeyValue.operator_id = lisResponce1[0].operator_id;
        }

        if (req.query.status) {
            searchKeyValue.status = req.query.status;
        }

        const lisTotalRecords = await bundleRechargeModel.agentTopupSumCountReport(searchKeyValue);
        if (lisTotalRecords.length == 0) {
            return res.status(400).send({ message: "Calculation error" });
        }

        
        let intTotlaRecords = Number(lisTotalRecords[0].count)
        let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1
        let sumRechargeAmount = Number(lisTotalRecords[0].amount) || 0
        let sumDebitedAmount = Number(lisTotalRecords[0].deductAdmount) || 0
        if (req.query.eBundleTypes) {
          searchKeyValue.bundle_type = req.query.eBundleTypes;
        }
           // check the searchKeyValue parem
           if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search paremeters" }] });
           let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
           let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords
        
        const lisResponce1 = await bundleRechargeModel.agentBundleTopupReport(searchKeyValue, limit, offset);
        if (lisResponce1.length == 0) {
            // return res.status(204).send({ message: "No transaction found" });
            return res.status(200).send({
              reportList: lisResponce1,
              totalRepords: intTotlaRecords,
              message:"No Bundle Activatoin found!"
          });
        }
       

        if (req.query.pageNumber == 0) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.write('[');
            lisResponce1.forEach((item, index) => {
                const json = JSON.stringify(item);
                res.write(json);
                if (index < lisResponce1.length - 1) {
                    res.write(',');
                }
            });
            res.write(']');
            res.end();
        } else {
            res.status(200).send({
                reportList: lisResponce1,
                totalRepords: intTotlaRecords,
                pageCount: intPageCount,
                currentPage: Number(req.query.pageNumber),
                totalRechargeAmount: lisTotalRecords[0].amount || 0,
                totalDebitedAmount: lisTotalRecords[0].deductAmount || 0,
                pageLimit: Number(process.env.PER_PAGE_COUNT)
            });
          
        }
    } catch (error) {
        console.error('getEbundleReports', error);
        res.status(200).send({
            reportList: [{}],
            totalRepords: 0,
            pageCount: 0,
            currentPage: Number(req.query.pageNumber),
            totalRechargeAmount: 0,
            totalDebitedAmount: 0,
            pageLimit: Number(process.env.PER_PAGE_COUNT)
        });
    }
   };

   getEbundleSummeryReport = async (req, res) => {
      try {
          // body and query validators
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
              return res.status(400).json({ errors: errors.array() });
          }
          // console.log('recharge/topUpSummeryReport',JSON.stringify(req.body), JSON.stringify(req.query))
          if (!req.query.pageNumber) req.query.pageNumber = 0


          // search parem
          let searchKeyValue = {
              Active: 1,
          }
          if (req.body.user_detials.region_list.length != 7) {
              searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
          }

          if (req.query.parent_uuid) {
              let parentDetails = await sqlQueryReplica.searchQuery(this.tableName2, {
                  user_uuid: req.query.parent_uuid
              }, ['userid'], 'userid', "ASC", 1, 0)
              if (parentDetails.length == 0) return res.status(400).json({ errors: [{ msg: 'Parent id not found' }] });
              searchKeyValue.parent_id = parentDetails[0].userid
          } else {
              if (!req.query.userId) {
                  searchKeyValue.parent_id = 1
              }
          }
          if (req.query.userId) searchKeyValue.username = req.query.userId;
          if (req.query.userName) searchKeyValue.full_name = req.query.userName;

          let lisTotalRecords = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName2, searchKeyValue, ['COUNT(1) AS count'], 'userid', "ASC")

          let intTotlaRecords = Number(lisTotalRecords[0].count)
          let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

          let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
          let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

          // if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: "Improper search key value" }); 
          let agentList = await sqlQueryReplica.searchQueryTimeout(this.tableName2, searchKeyValue, ['username', 'full_name', 'child_id', 'userid', 'province_Name', 'region_name', "IF(usertype_id = 1,'Master Distributor',IF(usertype_id = 2,'Distributor',IF(usertype_id = 3,'Reseller','Retailer'))) as agentType"], 'userid', "ASC", limit, offset)
          // check date for start and end 

          searchKeyValue = {}

          if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
          // let startDate, endDate, status
          if (req.query.startDate && req.query.endDate) {
              searchKeyValue.start_date = req.query.startDate
              searchKeyValue.end_date = req.query.endDate
          }
          if (req.query.status) {
              if (req.query.status == 4) {
                  searchKeyValue.rollback_status = 3
              } else {
                  searchKeyValue.status = req.query.status
              }
          } else {
              searchKeyValue.status = 2
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Transfer-Encoding', 'chunked');
          if (req.query.pageNumber) {
              res.write('{ "reportList" : ');
          }
          res.write('[');
          let lisPendingQuery = []
          for (let i = 0; i < agentList.length; i++) {
              let { full_name, username, child_id, userid, region_name, province_Name, agentType } = agentList[i]
              if (child_id) {
                  child_id = child_id + ',' + userid
              } else {
                  child_id = userid
              }
              // console.log(child_id)
              let rechargeDetails = await bundleRechargeModel.ebundleSummeryReport(searchKeyValue, child_id)
              console.log("rechargeDetails",rechargeDetails)
              const json = JSON.stringify({
                  userId: username,
                  userName: full_name,
                  regionName: region_name,
                  provicneName: province_Name,
                  agentType,
                  "Salam_totalAmount": rechargeDetails?.Salam_totalAmount | 0,
                  "Salam_ActivationCount": rechargeDetails?.Salam_ActivationCount | 0,
                  "AWCC_totalAmount": rechargeDetails?.AWCC_totalAmount | 0,
                  "AWCC_ActivationCount": rechargeDetails?.AWCC_ActivationCount | 0,
                  "MTN_totalAmount": rechargeDetails?.MTN_totalAmount | 0,
                  "MTN_ActivationCount": rechargeDetails?.MTN_ActivationCount | 0,
                  "Etisalat_totalAmount": rechargeDetails?.Etisalat_totalAmount | 0,
                  "Etisalat_ActivationCount": rechargeDetails?.Etisalat_ActivationCount | 0,
                  "Roshan_totalAmount": rechargeDetails?.Roshan_totalAmount | 0,
                  "Roshan_ActivationCount": rechargeDetails?.Roshan_ActivationCount | 0,
                  "TotalTopUpBundleAmount": rechargeDetails?.TotalTopUpBundleAmount | 0,
                  "TotalActivationCount": rechargeDetails?.TotalActivationCount | 0
              });
              // console.log("recharge Details",json)
              res.write(json);

              if (i < agentList.length - 1) {
                  res.write(',');
              }

          }

          res.write(']');
          // Stream JSON data
          if (req.query.pageNumber) {
              res.write(`,
                  "totalRepords" : ${intTotlaRecords},
                  "pageCount" : ${intPageCount},
                  "currentPage" : ${Number(req.query.pageNumber)},
                  "pageLimit" : ${Number(process.env.PER_PAGE_COUNT)}
                  }`);
          }

          res.end();

      } catch (error) {
          console.error('topUpSummeryReport', error);
          if (req.query.pageNumber == 0) {
              res.status(200).send([{}])
          } else {
              res.status(200).send({
                  reportList: [{}],
                  totalRepords: 0,
                  pageCount: 0,
                  currentPage: Number(req.query.pageNumber),
                  pageLimit: Number(process.env.PER_PAGE_COUNT)
              })
          }
      }
  }

  getAgentEbundleDownlineReport = async (req, res) => {
          try {
              // body and query validators
              const errors = validationResult(req);
              if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
              }
  
              if (!req.query.pageNumber) req.query.pageNumber = 0
              console.log('recharge/agentDownlianeTopUpReport',JSON.stringify(req.body), JSON.stringify(req.query))

  
  
              var searchKeyValue = {
                  Active: 1,
              }
              // search parent id 
              if (req.query.parent_uuid) {
                  var searchKeyValue1 = {
                      user_uuid: req.query.parent_uuid,
                      Active: 1,
                      // region_ids : req.body.user_detials.region_list.join(',')
                  }
                  if (req.body.user_detials.region_list.length != 7) {
                      searchKeyValue1.region_ids = req.body.user_detials.region_list.join(',')
                  }
                  const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue1, ['userid', 'child_id'], 'userid', 'ASC', 1, 0)
                  if (lisResponce1.length == 0) return res.status(400).json({ errors: "parent id ont found" });
                  searchKeyValue.child_ids = lisResponce1[0].child_id || ' 0 ';
              } else {
                  // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                  if (req.body.user_detials.region_list.length != 7) {
                      searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                  }
              }
  
              // optional search paremeter
  
              if (req.query.agentId) searchKeyValue.username = req.query.agentId
              if (req.query.agentName) searchKeyValue.full_name = req.query.agentName
              if (req.query.agentMobile) searchKeyValue.mobile = req.query.agentMobile
              if (req.query.agentEmail) searchKeyValue.emailid = req.query.agentEmail
  
              // transaction search options
              // check date for start and end 
              if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
  
              if (req.query.startDate) {
                  searchKeyValue.start_date = req.query.startDate //dt start date
              }
              if (req.query.endDate) {
                  searchKeyValue.end_date = req.query.endDate //dt end date
              }
              if (req.query.operator_uuid) {
                  const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                  if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                  searchKeyValue.operator_id = lisResponce1[0].operator_id
              }
              if (req.query.status) {
                  if (req.query.status == 4) {
                      searchKeyValue.rollback_status = 3
                  } else {
                      // searchKeyValue.isIn = {
                      //     key : 'rollback_status',
                      //     value : ' 0,1,2,4 '
                      // }
                      searchKeyValue.status = req.query.status
                  }
              }
  
              // check search parem
              if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search key parem" }] });
  
              const lisTotalRecords = await bundleRechargeModel.getAgentEbundleDownlineReportCount(searchKeyValue)
  
              let intTotlaRecords = Number(lisTotalRecords[0].count)
              let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1
  
              let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
              let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords
  
              // recharge model search query 
              const lisResponce2 = await bundleRechargeModel.getAgentEbundleDownlineReport(searchKeyValue, limit, offset)
              // if(lisResponce2.length == 0) return res.status(204).send({message : "no transaction report found"})
  
              // let mnoList = await sqlQuery.searchQueryNoConNolimit(this.tableName20,['mno_name'],'id','asc')
  
              // send reponce to frontend    
              // var finalResult = lisResponce2.map((result)=>{
              //     var {status,apiType,rollbackStatus,...other} = result
              //     other.status = status == 1 ? "Pending" : status == 2 ? "Success" : "Failed"
              //     other.apiType = apiType ? mnoList[Number(apiType)-1].mno_name : apiType
              //     return other
              // })
  
              if (req.query.pageNumber == 0) {
                  res.status(200).send(lisResponce2)
              } else {
                  res.status(200).send({
                      reportList: lisResponce2,
                      totalRepords: intTotlaRecords,
                      pageCount: intPageCount,
                      currentPage: Number(req.query.pageNumber),
                      pageLimit: Number(process.env.PER_PAGE_COUNT),
                      totalAmount: lisTotalRecords[0].totalAmount || 0,
                      totalDeductAdmount: lisTotalRecords[0].totalDeductAmount || 0
                  })
              }
  
              // res.status(200).send(finalResult)
  
          } catch (error) {
              console.error('agentDownlineTopUpReport', error);
              if (req.query.pageNumber == 0) {
                  res.status(200).send([{}])
              } else {
                  res.status(200).send({
                      reportList: [{}],
                      totalRepords: 0,
                      pageCount: 0,
                      currentPage: Number(req.query.pageNumber),
                      pageLimit: Number(process.env.PER_PAGE_COUNT),
                      totalAmount: 0,
                      totalDeductAdmount: 0
                  })
              }
              // return res.status(400).json({ errors: [ {msg : error.message}] }); 
          }
  }

}

module.exports = new EbundleController();
