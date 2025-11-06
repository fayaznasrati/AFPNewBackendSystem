const UserModel = require("../models/admin.model");
const HttpException = require("../utils/HttpException.utils");
const { validationResult } = require("express-validator");
const httpRequestMaker = require("../common/httpRequestMaker.common");

const sqlQuery = require("../common/sqlQuery.common");
const sqlQueryReplica = require("../common/sqlQueryReplica.common");
const smsFunction = require("../common/smsFunction.common");

const roles = require("../utils/userRoles.utils");

const varRandomString = require("../utils/randomString.utils");
const varEncryptionString = require("../utils/encryption.utils");

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

const redisMaster = require("../common/master/radisMaster.common");

// configer env
dotenv.config();

const commonQueryCommon = require("../common/commonQuery.common");
const httpRequestMakerCommon = require("../common/httpRequestMaker.common");

const redisFunction = require("../common/master/radisMaster.common");
const fs = require("fs");
const ExcelJS = require("exceljs");
const REPORT_DIR = "/var/www/html/AFPNewBackendSystem/the_topup_reports";
// const { toIsoString } = require('../common/timeFunction.common')

/******************************************************************************
 *                              Admin Controller
 ******************************************************************************/
class AdminController {
  tableName1 = "er_login_admin";
  tableName2 = "er_master_province";
  tableName3 = "er_logs_admin_update_mobile_number";
  tableName4 = "er_logs_admin_update_password";
  tableName5 = "er_login";
  tableName6 = "er_master_department";
  tableName7 = "er_master_region";
  tableName8 = "er_sub_admin_module_permission";
  tableName9 = "er_master_login_reason";
  tableName10 = "er_master_operator";

  // create amin
  createUser = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/createUser]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );

      var password = req.body.password || process.env.ADMIN_DEFAULT_PASSWORD;

      var strUserName = this.setUserName();
      var strEncryptionKey = this.setEncryptionKey();
      var strpin = varRandomString.generateRandomNumber(4);
      var strHashPassword = this.setHashPassword(strEncryptionKey, password);
      var strHashPin = this.setHashPassword(strEncryptionKey, strpin);

      var param = {
        username: strUserName,
        password: strHashPassword,
        full_name: req.body.full_name,
        usertype: roles.Admin,
        usertype_id: 0,
        operator_uuid: req.body.operator_uuid,
        operator_name: req.body.operatorName,
        emailid: req.body.email,
        gender: req.body.gender,
        mobile: req.body.mobile,
        city_name: req.body.city_name,
        Address: req.body.address,
        created_by: req.body.user_detials.id,
        tpin: strHashPin,
        encryption_key: strEncryptionKey,
        region_id: "1,2,3,4,5,6,7",
      };

      const objResult = await sqlQuery.createQuery(this.tableName1, param);
      if (!objResult) {
        throw new HttpException(500, "Something went wrong");
      }
      // console.log(objResult)
      res.status(201).send({ message: "user created successfully" });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  //admin and sub admin login
  userLogin = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/userLogin]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );

      var userid = req.body.username;

      const userExist = await UserModel.matchPassword({
        username: req.body.username,
        password: req.body.password,
      });
      if (userExist == 1) {
        return res.status(400).json({ errors: [{ msg: "user not found" }] });
      }
      if (userExist == 2) {
        let attempt = await redisMaster.incr(`ADMIN_LOGIN_ATTEMPT_${userid}`);
        attempt = Number(attempt);

        let allowedAttempt = Number(process.env.WRONG_PASSWORD_ATTEMPTS);

        if (allowedAttempt - attempt <= 0) {
          // update agent as in-active
          console.log("[Admin/userLogin/failed]", userid);
          const updateResponce = await sqlQuery.updateQuery(
            this.tableName1,
            { status: 0 },
            { username: req.body.username }
          );
        }

        return res
          .status(400)
          .json({
            errors: [
              {
                msg: `Wrong password,  ${
                  allowedAttempt - attempt > 0 ? allowedAttempt - attempt : 0
                } left.`,
              },
            ],
          });
      }
      if (userExist == 3) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Account is In-Active" }] });
      } else {
        // console.log(process.env.SESSION_TIME)
        const secretKey = process.env.SECRET_JWT || "";
        const token = jwt.sign(
          { user_id: req.body.username, userType: userExist.usertype },
          secretKey,
          {
            expiresIn: process.env.SESSION_TIME,
          }
        );
        // save key value to redis
        redisFunction.post(`admin_login_session_${req.body.username}`, token);
        redisMaster.delete(`ADMIN_LOGIN_ATTEMPT_${userid}`);

        //get the last login date and ip address
        var userLastLoginDetails = await sqlQueryReplica.searchQuery(
          this.tableName1,
          { username: req.body.username },
          [
            "admin_userid",
            "last_login_datetime",
            "last_login_ip",
            "usertype_id",
          ],
          "admin_userid",
          "ASC",
          1,
          0
        );
        // console.log(userLastLoginDetails)

        var date = new Date();
        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
        var isodate = date.toISOString();

        // update the details of last login
        var updateTheDetails = await sqlQuery.updateQuery(
          this.tableName1,
          {
            last_login_datetime: isodate,
            last_login_ip: req.body.userIpAddress ? req.body.userIpAddress : 0,
          },
          { username: req.body.username }
        );
        // console.log(updateTheDetails)
        // console.log('update sucessfully')

        // once login is allowed add the data in log table
        // api call variable
        var data = {
          userid: userLastLoginDetails[0].admin_userid,
          username: req.body.username,
          full_name: userExist.fullName,
          mobile: userExist.mobile,
          user_uuid: "0000000000000000",
          intCreatedByType: userLastLoginDetails[0].admin_userid,
          intUserType: userExist.usertype == roles.Admin ? 1 : 2,
          userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
          userMacAddress: req.body.userMacAddress ? req.body.userMacAddress : 0, //str
          userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
          userImeiNumber: req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
          userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
          userAppVersion: req.body.userAppVersion ? req.body.userAppVersion : 0, //str
          userApplicationType:
            req.body.userApplicationType == "Web"
              ? 1
              : req.body.userApplicationType == "Mobile"
              ? 2
              : 0,
          description: userExist.usertype + " Login",
          userActivityType: userExist.usertype == roles.Admin ? 1 : 5,
          oldValue: userLastLoginDetails[0].last_login_ip,
          newValue: req.body.userIpAddress ? req.body.userIpAddress : 0,
          regionId: 0,
        };

        // make api call
        const intResult = await httpRequestMakerCommon.httpPost(
          "activity-log",
          data
        );
        var strLog =
          intResult == 1
            ? "Admin login log added successfully"
            : intResult == 2
            ? "Admin login log error"
            : "end point not found";
        // console.log('Server Log : '+strLog)

        // add log in another table
        // api call variable
        // console.log(userExist)
        data = {
          userid: userLastLoginDetails[0].admin_userid,
          user_uuid: "0000000000000000",
          full_name: userExist.fullName,
          username: userid,
          email: userExist.emailid,
          mobile: userExist.mobile,
          usertype: 1,
          login_ip: req.body.userIpAddress ? req.body.userIpAddress : 0,
          Created_by_username: userid,
        };

        // make api call
        const intResult1 = await httpRequestMakerCommon.httpPost("login", data);
        var strLog =
          intResult1 == 1
            ? "Admin login log added successfully"
            : intResult1 == 2
            ? "Admin login log error"
            : "end point not found";
        // console.log('Server Log : '+strLog)

        //         let listModulePermission = 'Admin have all permission'

        //         // get module permission list
        //         if(userLastLoginDetails[0].usertype_id){
        //             listModulePermission = await sqlQueryReplica.searchQuery(this.tableName8,{department_id : userLastLoginDetails[0].usertype_id},["sub_admin_module_name AS moduleName","perm_view AS permView","sub_admin_sub_module_perm AS sub_module_perm",],"sub_admin_per_id","ASC",10,0)
        //             console.log(listModulePermission)
        //             if (listModulePermission.length != 10 ) listModulePermission = "permission list is improper"
        //         }

        //     res.status(201).send({ userid, token, fullName: userExist.fullName, userType: userExist.usertype , commisionTypeList : ["Pre-Paid","Post-Paid","Pre-Paid as 1st transaction"],listModulePermission });
        // }
        let listModulePermission;

        if (userLastLoginDetails[0].usertype_id) {
          listModulePermission = await sqlQueryReplica.searchQuery(
            this.tableName8,
            { department_id: userLastLoginDetails[0].usertype_id },
            [
              "sub_admin_module_name AS moduleName",
              "perm_view AS permView",
              "sub_admin_sub_module_perm AS sub_module_perm",
            ],
            "sub_admin_per_id",
            "ASC",
            16,
            0
          );

          if (listModulePermission.length != 16) {
            listModulePermission = { isAdmin: false, permissions: [] };
          } else {
            // parse sub_module_perm from string → object
            listModulePermission = {
              isAdmin: false,
              permissions: listModulePermission.map((perm) => ({
                moduleName: perm.moduleName,
                permView: perm.permView,
                subModulePerm: JSON.parse(perm.sub_module_perm)
                  .sub_module_perm_list,
              })),
            };
          }
        }
         else {
          // admin case
          listModulePermission = { isAdmin: true, permissions: [] };
        }

        res.status(201).send({
          userid,
          token,
          fullName: userExist.fullName,
          userType: userExist.usertype,
          commisionTypeList: [
            "Pre-Paid",
            "Post-Paid",
            "Pre-Paid as 1st transaction",
          ],
          listModulePermission,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // get self details
  getUserByuserName = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // console.log('[Admin/getUserByuserName]', JSON.stringify(req.body), JSON.stringify(req.query));

      var searchKeyValue = {
        username: req.query.username,
        status: 1,
        active: 1,
      };
      var key = [
        "username",
        "usertype",
        "full_name",
        "gender",
        "emailid",
        "mobile",
        "CAST(operator_uuid AS CHAR(16)) operator_uuid",
        "operator_name",
        "city_name",
        "Address",
      ];
      var orderby = "full_name";
      var ordertype = "ASC";

      // fire sql query to get user id
      const lisResult = await sqlQueryReplica.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );

      // check if the result is there and responce accordingly
      if (!lisResult) {
        throw new HttpException(500, "Something went wrong");
      }
      if (!lisResult.length === 0) {
        return res.status(400).json({ errors: [{ msg: "user not found" }] });
      }
      res.status(200).send(lisResult[0]);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // update admin and sub admin details
  updateUserDetials = async (req, res) => {
    try {
      // verify body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/updateUserDetails]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      // search user details
      var searchKeyValue = {
        admin_userid: req.body.user_detials.id,
        status: 1,
        active: 1,
      };
      var key = [
        "full_name",
        "emailid",
        "city_name",
        "Address",
        "gender",
        "mobile",
      ];
      var orderby = "full_name";
      var ordertype = "ASC";

      const lisResponce = await sqlQueryReplica.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );
      if (lisResponce.length === 0)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });

      var oldValue = "";
      var newValue = "";

      oldValue +=
        req.body.name != lisResponce[0].full_name
          ? lisResponce[0].full_name + " "
          : "";
      oldValue +=
        req.body.email != lisResponce[0].emailid
          ? lisResponce[0].emailid + " "
          : "";
      oldValue +=
        req.body.city != lisResponce[0].city_name
          ? lisResponce[0].city_name + " "
          : "";
      oldValue +=
        req.body.address != lisResponce[0].Address
          ? lisResponce[0].Address + " "
          : "";
      oldValue +=
        req.body.gender && req.body.gender != lisResponce[0].gender
          ? lisResponce[0].gender + " "
          : "";

      newValue +=
        req.body.name != lisResponce[0].full_name ? req.body.name + " " : "";
      newValue +=
        req.body.email != lisResponce[0].emailid ? req.body.email + " " : "";
      newValue +=
        req.body.city != lisResponce[0].city_name ? req.body.city + " " : "";
      newValue +=
        req.body.address != lisResponce[0].Address
          ? req.body.address + " "
          : "";
      newValue +=
        req.body.gender && req.body.gender != lisResponce[0].gender
          ? req.body.gender + " "
          : "";

      // if new value have some data then it can be updated
      if (newValue.length > 0) {
        // api call variable
        var data = {
          userid: req.body.user_detials.id,
          user_uuid: "0000000000000000",
          username: req.query.username,
          full_name:
            req.body.name != lisResponce[0].full_name
              ? req.body.name
              : lisResponce[0].full_name,
          mobile: lisResponce[0].mobile,
          intCreatedByType: req.body.user_detials.id,
          intUserType: req.body.user_detials.type == roles.Admin ? 1 : 2,
          userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
          userMacAddress: req.body.userMacAddress ? req.body.userMacAddress : 0, //str
          userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
          userImeiNumber: req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
          userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
          userAppVersion: req.body.userAppVersion
            ? req.body.userAppVersion
            : null, //str
          userApplicationType:
            req.body.userApplicationType == "Web"
              ? 1
              : req.body.userApplicationType == "Mobile"
              ? 2
              : 0,
          description: req.body.user_detials.type + " update details",
          userActivityType: req.body.user_detials.type == roles.Admin ? 3 : 7,
          oldValue: oldValue,
          newValue: newValue,
          regionId: 0,
        };

        // make api call
        const intResult = await httpRequestMakerCommon.httpPost(
          "activity-log",
          data
        );
        var strLog =
          intResult == 1
            ? "Admin change password log added successfully"
            : intResult == 2
            ? "Admin chain password log error"
            : "end point not found";
        // console.log('Server Log : '+strLog)
      } else {
        return res
          .status(400)
          .json({ errors: [{ msg: "user details are same" }] });
      }

      // update user details
      var param = {
        full_name: req.body.name,
        emailid: req.body.email,
        city_name: req.body.city,
        Address: req.body.address,
      };

      if (req.body.gender !== null && req.body.gender !== undefined)
        param.gender = req.body.gender;

      // fire sql query to add M-pin status
      const objResult = await sqlQuery.updateQuery(
        this.tableName1,
        param,
        searchKeyValue
      );

      // check if the result is there and responce accordingly
      if (!objResult) {
        throw new HttpException(500, "Something went wrong");
      }

      const { affectedRows, changedRows, info } = objResult;
      const message = !affectedRows
        ? "user not found"
        : affectedRows && changedRows
        ? " user details updated sucessfully"
        : " user details are same";

      redisMaster.delete(`AUTH_SUB_ADMIN_${req.query.username}`);

      // send responce to front end
      res.status(200).send({ message });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // admin and sub admin change self password
  changePassword = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      } else {
        console.log(
          "[Admin/changePassword]",
          JSON.stringify(req.body),
          JSON.stringify(req.query)
        );
        var searchKeyValue = {
          admin_userid: req.body.user_detials.id,
          status: 1,
          active: 1,
        };
        var key = [
          "encryption_key",
          "password",
          "tpin",
          "username",
          "full_name",
          "mobile",
        ];
        var orderby = "admin_userid";
        var ordertype = "ASC";

        const lisResponse1 = await sqlQuery.searchQuery(
          this.tableName1,
          searchKeyValue,
          key,
          orderby,
          ordertype,
          1,
          0
        );

        if (!lisResponse1) {
          throw new HttpException(500, "Something went wrong");
        }
        if (lisResponse1.length === 0) {
          return res.status(400).json({ errors: [{ msg: "user not found" }] });
        }

        const hashOldPassword = this.getHashPassword(
          lisResponse1[0].encryption_key,
          lisResponse1[0].password
        );
        const storedpassword = lisResponse1[0]["tpin"];
        var strDecriptPin = this.getHashPassword(
          lisResponse1[0].encryption_key,
          storedpassword
        );
        strDecriptPin = strDecriptPin ? strDecriptPin : "000000";
        const newEncryptionKey = this.setEncryptionKey();
        const newPassword = this.setHashPassword(
          newEncryptionKey,
          req.body.password
        );
        const strEncryptedPin = this.setHashPassword(
          newEncryptionKey,
          strDecriptPin
        );

        if (hashOldPassword === req.body.oldPassword) {
          var param = {
            password: newPassword,
            encryption_key: newEncryptionKey,
            tpin: strEncryptedPin,
          };

          var searchKeyValue = {
            username: req.query.username,
          };

          const objResult = await sqlQuery.updateQuery(
            this.tableName1,
            param,
            searchKeyValue
          );

          if (!objResult) {
            throw new HttpException(500, "Something went wrong");
          }

          // // add password change request in log table
          // var param = {
          //     admin_userid : req.body.user_detials.id,
          //     username : req.body.user_detials.username, //str
          //     usertype : req.body.user_detials.type, //str
          //     old_password : lisResponse1[0].password,
          //     old_encryption_key : lisResponse1[0].encryption_key,
          //     new_password : newPassword,
          //     new_encryption_key : newEncryptionKey,
          //     created_by : req.body.user_detials.id, //str
          //     created_on : isodate, //dt current date time
          // }

          // // fire sql query to add M-pin status
          // const objResult1 = await sqlQuery.createQuery(this.tableName4, param);

          // make api call to add log
          // api call variable
          var data = {
            userid: req.body.user_detials.id,
            user_uuid: "0000000000000000",
            username: lisResponse1[0].username,
            full_name: lisResponse1[0].full_name,
            mobile: lisResponse1[0].mobile,
            intCreatedByType: req.body.user_detials.id,
            intUserType: req.body.user_detials.type == roles.Admin ? 1 : 2,
            userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
            userMacAddress: req.body.userMacAddress
              ? req.body.userMacAddress
              : 0, //str
            userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
            userImeiNumber: req.body.userImeiNumber
              ? req.body.userImeiNumber
              : 0, //str
            userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
            userAppVersion: req.body.userAppVersion
              ? req.body.userAppVersion
              : null, //str
            userApplicationType:
              req.body.userApplicationType == "Web"
                ? 1
                : req.body.userApplicationType == "Mobile"
                ? 2
                : 0,
            description: req.body.user_detials.type + " change password",
            userActivityType: req.body.user_detials.type == roles.Admin ? 2 : 6,
            oldValue:
              lisResponse1[0].password + " " + lisResponse1[0].encryption_key,
            newValue: newPassword + " " + newEncryptionKey,
            regionId: 0,
          };

          // make api call
          let intResult = await httpRequestMakerCommon.httpPost(
            "activity-log",
            data
          );
          var strLog =
            intResult == 1
              ? "Admin change password log added successfully"
              : intResult == 2
              ? "Admin chain password log error"
              : "end point not found";
          // console.log('Server Log : '+strLog)

          // making api call to add log
          var data = {
            userid: req.body.user_detials.id,
            username: req.body.user_detials.username,
            usertype: req.body.user_detials.type,
            old_password: lisResponse1[0].password,
            old_encryption_key: lisResponse1[0].encryption_key,
            new_password: newPassword,
            new_encryption_key: newEncryptionKey,
            created_by: req.body.user_detials.id,
          };
          intResult = await httpRequestMaker.httpPost("admin/password", data);
          // console.log(result)
          var strLog =
            intResult == 1
              ? "Admin change password log added successfully"
              : intResult == 2
              ? "Admin chain password log error"
              : "end point not found";
          // console.log('Server Log : '+strLog)
          return res.status(200).send({ message: "password changed" });
        }

        return res
          .status(400)
          .json({ errors: [{ msg: "old password dont match" }] });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // admin and sub admin self, get opt for change password
  requestForOtp = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/requestforotp]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      let operator_uuid = "",
        operatorName = "";

      // console.log(req.body.mobileNumber.slice(0,3))

      switch (String(req.body.mobileNumber.slice(0, 3))) {
        case "078":
        case "073":
          // Etisalat
          operator_uuid = "70b9906d-c2ba-11";
          operatorName = "Etisalat";
          break;
        case "079":
        case "072":
          // Roshan
          operator_uuid = "9edb602c-c2ba-11";
          operatorName = "Roshan";
          break;
        case "077":
        case "076":
          // MTN
          (operator_uuid = "456a6b47-c2ba-11"), (operatorName = "MTN");
        case "074":
          // Salaam
          operator_uuid = "1e0e1eeb-c2a6-11";
          operatorName = "Salaam";
          break;
        case "070":
        case "071":
          // AWCC
          operator_uuid = "6a904d84-c2a6-11";
          operatorName = "AWCC";
          break;
      }

      // if(operator_uuid != req.body.operator_uuid && operatorName != req.body.operatorName){
      //     return res.status(400).json({ errors: [ {msg : "Mobile number does not match with selected operator"}] });
      // }

      var searchKeyValue = {
        operator_uuid: operator_uuid, //str operator uuid
        operator_name: operatorName,
        active: 1,
        SMPP: 1,
      };

      const lisResponse2 = await sqlQueryReplica.searchQuery(
        this.tableName10,
        searchKeyValue,
        ["COUNT(1)"],
        "operator_id",
        "asc",
        1,
        0
      );

      // check if the result is there and responce accordingly
      if (!lisResponse2) {
        throw new HttpException(500, "Something went wrong");
      }
      if (!lisResponse2[0]["COUNT(1)"]) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Operator Service not added" }] });
      }

      //check for mobile number in table
      var searchKeyValue = {
        mobile: req.body.mobileNumber,
        status: 1,
        active: 1,
      };
      var key = [
        "CAST(operator_uuid AS CHAR(16)) AS operator_uuid",
        "admin_userid",
      ];
      var orderby = "mobile";
      var ordertype = "ASC";

      // fire sql query to get str country_uuid, str country_name
      const boolResponce = await sqlQuery.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );

      if (boolResponce.length > 0) {
        if (boolResponce[0].admin_userid != req.body.user_detials.id)
          return res
            .status(400)
            .json({ errors: [{ msg: "Mobile Number is already registered" }] });
        if (
          boolResponce[0].admin_userid == req.body.user_detials.id &&
          boolResponce[0].operator_uuid == operator_uuid
        )
          return res
            .status(400)
            .json({
              errors: [{ msg: "Mobile number  and operator value are same " }],
            });
      }

      //1) get user details mobile number, operator name and uuid
      var searchKeyValue = {
        admin_userid: req.body.user_detials.id,
        status: 1,
        active: 1,
      };
      var key = [
        "mobile",
        "CAST(operator_uuid AS CHAR(16)) AS operator_uuid",
        "operator_name",
      ];
      var orderby = "mobile";
      var ordertype = "ASC";

      // fire sql query to get str country_uuid, str country_name
      const lisResponce = await sqlQuery.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );

      // check if the result is there and responce accordingly
      if (lisResponce.length === 0)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });

      if (
        lisResponce[0].mobile == req.body.mobileNumber &&
        lisResponce[0].operator_uuid == operator_uuid
      )
        return res
          .status(400)
          .json({ errors: [{ msg: "Mobile number and operator are same" }] });

      //2) check new operator name
      var boolOperatorFound = await commonQueryCommon.checkOperator(
        operator_uuid,
        operatorName
      );

      if (!boolOperatorFound)
        return res
          .status(400)
          .json({ errors: [{ msg: "operator not found" }] });

      // random 6 digit number
      var intOTP = varRandomString.generateRandomNumber(6);
      console.log(intOTP, "OTP Sent to ", req.body.mobileNumber);
      // otp validation time
      var date = new Date();
      date.setHours(date.getHours() + 4, date.getMinutes() + 30);
      var isodate = date.toISOString();

      var dtCurrentDateTime = date;
      var dtOtpExpirationDateTime = new Date(
        dtCurrentDateTime.getTime() + process.env.OTP_EXPIRATION_IN_MIN * 60000
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      // console.log(isodate,dtOtpExpirationDateTime)

      var param = {
        new_mobile_number: req.body.mobileNumber,
        mobile_verification_otp_operator_uuid: operator_uuid,
        mobile_verification_otp_operator_name: operatorName,
        mobile_verification_otp: intOTP,
        mobile_verification_expire_on: dtOtpExpirationDateTime,
        new_mobile_number_request: 1,
      };

      var searchKeyValue = {
        admin_userid: req.body.user_detials.id, //str country uuid
        status: 1,
        active: 1,
        mobile_verification_expire_in: isodate,
      };

      // fire sql query to update country name
      const objResult = await sqlQuery.updateQuery(
        this.tableName1,
        param,
        searchKeyValue
      );

      // check if the result is there and responce accordingly
      const { affectedRows, changedRows, info } = objResult;

      if (affectedRows && changedRows) {
        let smsDetails = {
          operator_uuid: operator_uuid,
          userId: req.body.user_detials.id,
          username: req.query.username,
          mobile: req.body.mobileNumber,
          recieverMessage: "OTP to verify mobile number is :" + String(intOTP),
        };
        let smsFunResponce = await smsFunction.directSMS(smsDetails);
        if (smsFunResponce.error) {
          console.log(smsFunResponce.error);
          return res
            .status(400)
            .json({ errors: [{ msg: "error in sending sms" }] });
        }
      }

      const message = !affectedRows
        ? "OTP allready send, request again after " +
          process.env.OTP_EXPIRATION_IN_MIN +
          " min"
        : affectedRows && changedRows
        ? "OTP send successfully"
        : "OTP allready sended";

      res.send({ message, info });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // admin and sub admin self, get otp
  getOtp = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/getOtp]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      var searchKeyValue = {
        username: req.body.username, //str
        status: 1,
        active: 1,
      };
      var key = ["mobile_verification_otp"];
      var orderby = "admin_userid";
      var ordertype = "ASC";

      // fire sql query to get str country_uuid, str country_name
      const lisResponce = await sqlQueryReplica.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );

      if (lisResponce.length === 0)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });

      res.status(200).send(lisResponce[0]);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // admin and sub admin self, verify otp and update mobile number
  verifyAndUpdateNumber = async (req, res) => {
    try {
      // verify body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log("[Admin/verifyAndUpdateNumber]",JSON.stringify(req.body),JSON.stringify(req.query));
          let operator_uuid = '', operatorName = ''

            switch (req.body.mobileNumber.slice(0, 3)) {
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

      var date = new Date();
      date.setHours(date.getHours() + 4, date.getMinutes() + 30);
      // var isodate = date.toISOString();
      // Convert to MySQL-compatible DATETIME format: YYYY-MM-DD HH:MM:SS
      var isodate = date.toISOString().slice(0, 19).replace('T', ' ');

      // sql varibles
      var param = {
        mobile: req.body.mobileNumber,
        operator_uuid: operator_uuid,
        operator_name: operatorName,
        new_mobile_number_request: 0,
        mobile_verification_expire_on: "0000-00-00 00:00:00",
      };

      var searchKeyValue = {
        // new_mobile_number_request: 0,
        mobile_verification_otp: req.body.otp,
        admin_userid: req.body.user_detials.id, //str country uuid
        new_mobile_number: req.body.mobileNumber,
       mobile_verification_otp_operator_uuid: operator_uuid,
        mobile_verification_otp_operator_name: operatorName,
        mobile_verification_expire_in: isodate,
        status: 1,
        active: 1,
      };

      // fire sql query to update country name
      const objResult = await sqlQuery.updateQuery(
        this.tableName1,
        param,
        searchKeyValue
      );

      // check if the result is there and responce accordingly
      const { affectedRows, changedRows, info } = objResult;
      const message = !affectedRows
        ? "Wrong OTP"
        : affectedRows && changedRows
        ? "Mobile number updated successfully"
        : "Mobile number allready updated";
      const status = !affectedRows
        ? 400
        : affectedRows && changedRows
        ? 200
        : 400;

      // on update add into log table
      if (affectedRows && changedRows) {
        // get user old mobile number and operator name
        var searchKeyValue = {
          admin_userid: req.body.user_detials.id,
        };
        var key = [
          "mobile",
          "CAST(operator_uuid AS CHAR(16)) AS operator_uuid",
          "operator_name",
          "full_name",
          "username",
        ];
        var orderby = "mobile";
        var ordertype = "ASC";

        // fire sql query to get str country_uuid, str country_name
        const lisResponce = await sqlQuery.searchQuery(
          this.tableName1,
          searchKeyValue,
          key,
          orderby,
          ordertype,
          1,
          0
        );
        var data = {
          userid: req.body.user_detials.id, //str
          username: req.body.user_detials.username, //str
          usertype: req.body.user_detials.type, //str
          old_mobile_number: lisResponce[0].mobile,
          old_mobile_operator: lisResponce[0].operator_uuid,
          new_mobile_number: req.body.mobileNumber,
          new_mobile_operator: operator_uuid,
        };

        // amke the api call
        let intResult = await httpRequestMaker.httpPost("admin/mobile", data);
        // console.log(result)
        var strLog =
          intResult == 1
            ? "Admin change mobile number log added successfully"
            : intResult == 2
            ? "Admin chain mobile number log error"
            : "end point not found";
        // console.log('Server Log : '+strLog)

        //make api call to update detials to er_activity_logs
        // api call variable
        var data = {
          userid: req.body.user_detials.id,
          user_uuid: "0000000000000000",
          intCreatedByType: req.body.user_detials.id,
          username: lisResponce[0].username,
          full_name: lisResponce[0].full_name,
          mobile: req.body.mobileNumber,
          intUserType: req.body.user_detials.type == roles.Admin ? 1 : 2,
          userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
          userMacAddress: req.body.userMacAddress ? req.body.userMacAddress : 0, //str
          userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
          userImeiNumber: req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
          userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
          userAppVersion: req.body.userAppVersion
            ? req.body.userAppVersion
            : null, //str
          userApplicationType:
            req.body.userApplicationType == "Web"
              ? 1
              : req.body.userApplicationType == "Mobile"
              ? 2
              : 0,
          description: req.body.user_detials.type + " update mobile number",
          userActivityType: req.body.user_detials.type == roles.Admin ? 4 : 8,
          oldValue: lisResponce[0].mobile,
          newValue: req.body.mobileNumber,
          redionId: 0,
        };

        // make api call
        const intResult1 = await httpRequestMakerCommon.httpPost(
          "activity-log",
          data
        );
        var strLog =
          intResult1 == 1
            ? "Admin change password log added successfully"
            : intResult1 == 2
            ? "Admin chain password log error"
            : "end point not found";
        // console.log('Server Log : '+strLog)
      }

      redisMaster.delete(`AUTH_SUB_ADMIN_${req.query.username}`);

      // send responce to front end
      res.status(status).send({ message, info });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // admin and sub admin self, get security pin
  getSecurityPin = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/getSecurityPin]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );

      var searchKeyValue = {
        username: req.body.user_detials.username,
        status: 1,
        active: 1,
      };

      var key = ["tpin", "encryption_key"];
      var orderby = "username";
      var ordertype = "ASC";

      const lisResult = await sqlQueryReplica.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );
      if (!lisResult.length)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });
      if (!lisResult[0].tpin)
        return res.status(200).send({ message: "Pin not set" });

      const encryptionKey = lisResult[0]["encryption_key"];
      const storedpassword = lisResult[0]["tpin"];

      var strDecriptPin = this.getHashPassword(encryptionKey, storedpassword);

      res.status(200).send({ pin: strDecriptPin });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // get agent password
  verifySecurityPin = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/verifySecurityPin]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      var searchKeyValue = {
        username: req.body.user_detials.username,
        status: 1,
        active: 1,
      };

      var key = ["tpin", "encryption_key"];
      var orderby = "username";
      var ordertype = "ASC";

      const lisResponce1 = await sqlQuery.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );
      if (!lisResponce1.length)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });
      if (!lisResponce1[0].tpin)
        return res.status(200).send({ message: "Pin not set" });

      const strTpin = lisResponce1[0].tpin;
      const strEncryptionKey = lisResponce1[0].encryption_key;

      var strDecriptPin = this.getHashPassword(strEncryptionKey, strTpin);

      if (req.body.pin != strDecriptPin)
        return res
          .status(400)
          .json({ errors: [{ msg: "Entered pin is incorrest" }] });

      var searchKeyValue = {
        user_uuid: req.body.user_uuid,
        // region_ids : req.body.user_detials.region_list.join(','),
        Active: 1,
      };

      if (req.body.user_detials.region_list.length != 7) {
        searchKeyValue.region_ids = req.body.user_detials.region_list.join(",");
      }

      var key = ["password", "encryption_key"];
      var orderby = "username";
      var ordertype = "ASC";

      const lisResult = await sqlQuery.searchQueryNoLimit(
        this.tableName5,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );
      if (!lisResult.length)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });

      var strDecriptPassword = this.getHashPassword(
        lisResult[0].encryption_key,
        lisResult[0].password
      );

      // console.log(lisResult[0].encryption_key, lisResult[0].password)
      res.status(200).send({ password: strDecriptPassword });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // admin and sub admin self, update security pin
  updateSecurityPin = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/updateSecurityPin]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      var searchKeyValue = {
        username: req.body.user_detials.username,
        status: 1,
        active: 1,
      };

      var key = ["encryption_key", "tpin"];
      var orderby = "username";
      var ordertype = "ASC";

      const lisResponse1 = await sqlQuery.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );
      if (!lisResponse1.length)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });

      let encryptionKey = lisResponse1[0]["encryption_key"];
      let storedpassword = lisResponse1[0]["tpin"];

      var strDecriptPin = this.getHashPassword(encryptionKey, storedpassword);

      if (strDecriptPin != req.body.oldPin)
        return res
          .status(400)
          .json({ errors: [{ msg: "Old Pin is In-correct" }] });

      encryptionKey = lisResponse1[0].encryption_key;
      let intPin = req.body.newPin;

      const strEncriptedPin = this.setHashPassword(
        encryptionKey,
        intPin.toString()
      );

      var param = {
        tpin: strEncriptedPin,
      };

      const ObjResult = await sqlQuery.updateQuery(
        this.tableName1,
        param,
        searchKeyValue
      );

      const { affectedRows, changedRows, info } = ObjResult;
      const message = !affectedRows
        ? "user not found"
        : affectedRows && changedRows
        ? "user pin updated successfully"
        : "Details updated";

      // send responce to fornt end
      res.send({ message, info });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // verify security pin and update agent password
  updateAgentPassword = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/updateAgentPassword]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      // verify tpin of admin
      var searchKeyValue = {
        username: req.body.user_detials.username,
        status: 1,
        active: 1,
      };

      var key = ["tpin", "encryption_key"];
      var orderby = "username";
      var ordertype = "ASC";

      const lisResponce1 = await sqlQuery.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );
      if (!lisResponce1.length)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });
      if (!lisResponce1[0].tpin)
        return res.status(200).send({ message: "Pin not set" });

      const strTpin = lisResponce1[0].tpin;
      const strEncryptionKey = lisResponce1[0].encryption_key;

      var strDecriptPin = this.getHashPassword(strEncryptionKey, strTpin);
      //tpin dint match
      if (req.body.pin != strDecriptPin)
        return res
          .status(400)
          .json({ errors: [{ msg: "Entered pin is incorrest" }] });

      //get encryptionKey of user
      var searchKeyValue = {
        user_uuid: req.body.user_uuid,
        // region_ids : req.body.user_detials.region_list.join(','),
        Active: 1,
      };

      if (req.body.user_detials.region_list.length != 7) {
        searchKeyValue.region_ids = req.body.user_detials.region_list.join(",");
      }

      var key = ["encryption_key"];
      var orderby = "username";
      var ordertype = "ASC";

      const lisResult = await sqlQuery.searchQueryNoLimit(
        this.tableName5,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );
      if (!lisResult.length)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });

      //update password of user
      const strEncriptedPassword = this.setHashPassword(
        lisResult[0].encryption_key,
        req.body.password
      );

      var param = {
        password: strEncriptedPassword,
      };

      const ObjResult = await sqlQuery.updateQuery(
        this.tableName5,
        param,
        searchKeyValue
      );

      const { affectedRows, changedRows, info } = ObjResult;
      const message = !affectedRows
        ? "user not found"
        : affectedRows && changedRows
        ? "user password updated successfully"
        : "Details Updated";

      // send responce to fornt end
      res.send({ message, info });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // add new sub admin
  addSubAdmin = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/addSubAdmin]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      let operator_uuid = "",
        operatorName = "";

      switch (req.body.mobile.slice(0, 3)) {
        case "078":
        case "073":
          // Etisalat
          operator_uuid = "70b9906d-c2ba-11";
          operatorName = "Etisalat";
          break;
        case "079":
        case "072":
          // Roshan
          operator_uuid = "9edb602c-c2ba-11";
          operatorName = "Roshan";
          break;
        case "077":
        case "076":
          // MTN
          (operator_uuid = "456a6b47-c2ba-11"), (operatorName = "MTN");
          break;
        case "074":
          // Salaam
          operator_uuid = "1e0e1eeb-c2a6-11";
          operatorName = "Salaam";
          break;
        case "070":
        case "071":
          // AWCC
          operator_uuid = "6a904d84-c2a6-11";
          operatorName = "AWCC";
          break;
      }

      if (
        operator_uuid != req.body.operator_uuid &&
        operatorName != req.body.operatorName
      ) {
        return res
          .status(400)
          .json({
            errors: [
              { msg: "Mobile number does not match with selected operator" },
            ],
          });
      }

      var password = req.body.password || this.randomPassword(6);
      // console.log(password)

      var strUserName = await this.setUserName();
      if (strUserName.error) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Unique Id not generated" }] });
      } else {
        strUserName = strUserName.username;
      }
      var strEncryptionKey = this.setEncryptionKey();
      var strpin = varRandomString.generateRandomNumber(4);
      var strHashPassword = this.setHashPassword(strEncryptionKey, password);
      var strHashPin = this.setHashPassword(strEncryptionKey, strpin);

      //verify departemnt id provided

      var searchKeyValue = {
        department_uuid: req.body.department_uuid, //str department uuid
        active: 1,
      };
      var key = ["department_id"];
      var orderby = "department_id";
      var ordertype = "ASC";

      const lisResponce1 = await sqlQueryReplica.searchOrQuery(
        this.tableName6,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );
      if (lisResponce1.length === 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Department not found" }] });

      // otp validation time
      var date = new Date();
      date.setHours(date.getHours() + 4, date.getMinutes() + 30);
      var isodate = date.toISOString();

      // creating parameter for sql query to add user
      var param = {
        username: strUserName,
        password: strHashPassword,
        tpin: strHashPin,
        usertype: roles.SubAdmin,
        usertype_id: lisResponce1 ? lisResponce1[0].department_id : 0,
        full_name: req.body.name, //str full_name
        emailid: req.body.email, //str email
        mobile: req.body.mobile,
        city_name: req.body.cityName,
        Address: req.body.address, //str address
        created_by: req.body.user_detials.id, //str user id
        created_on: isodate, //dt current date time
        encryption_key: strEncryptionKey,
      };

      //verify operator_uuid
      if (req.body.operator_uuid) {
        var searchKeyValue = {
          operator_uuid: req.body.operator_uuid, //str operator uuid
          operator_name: req.body.operatorName,
          active: 1,
          SMPP: 1,
        };
        var key = ["COUNT(1)"];
        var orderby = "operator_name";
        var ordertype = "ASC";

        // fire sql query to get operator name
        const lisResponse2 = await sqlQueryReplica.searchQuery(
          this.tableName10,
          searchKeyValue,
          key,
          orderby,
          ordertype,
          1,
          0
        );

        // check if the result is there and responce accordingly
        if (!lisResponse2) {
          throw new HttpException(500, "Something went wrong");
        }
        if (!lisResponse2[0]["COUNT(1)"]) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Operator Service not added" }] });
        }
        param.operator_uuid = req.body.operator_uuid;
        param.operator_name = req.body.operatorName;
      }

      if (req.body.gender !== null && req.body.gender !== undefined) {
        var lisGender = [1, 2, 0, "1", "2", "0"];
        if (!lisGender.includes(req.body.gender))
          return res
            .status(400)
            .json({
              errors: [
                { msg: "use gender 1 for male, 2 for female, 0 for other" },
              ],
            });
        param.gender = req.body.gender;
      }

      // assign region

      let lisRegion = req.body.listRegion;
      let regionList = [];
      if (lisRegion.length > 0) {
        for (let i = 0; i < lisRegion.length; i++) {
          let { region_uuid, regionName } = lisRegion[i];
          //check region uuid is not done
          if (!region_uuid || !regionName)
            return res
              .status(400)
              .json({ errors: [{ msg: "Region parameter are not proper" }] });
          var responce = await commonQueryCommon.checkRegionwithoutCountry(
            region_uuid,
            regionName
          );

          if (responce) {
            regionList.push(responce);
          }
        }
      }

      param.region_id = regionList.join(",");

      const objResult = await sqlQuery.createQuery(this.tableName1, param);

      if (objResult.insertId) {
        let smsDetails = {
          adminId: objResult.insertId,
          recieverMessage: `Dear ${req.body.name}, Welcome to AfghanPay top-up service, your User ID ${strUserName}, Security Pin: ${strpin}, thank you for being AfghanPay Sub-Admin!`,
        };
        let smsFunResponce = await smsFunction.adminSms(smsDetails);
        if (smsFunResponce.error) {
          console.log(smsFunResponce.error);
        }
      }

      res.status(201).send({ message: "user created successfully" });
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

  // all sub admin
  getSubAdminList = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // console.log('[Admin/getSubAdminList]', JSON.stringify(req.body), JSON.stringify(req.query));
      if (!req.query.pageNumber) req.query.pageNumber = 0;

      // var offset = req.query.start
      // var limit = req.query.end - offset

      var searchKeyValue = {
        usertype: roles.SubAdmin,
        active: 1,
      };
      var key = [
        "full_name AS name",
        "username AS userid",
        "usertype_id",
        "mobile",
        "CAST(created_on AS CHAR(20)) AS createdOn",
        "status",
      ];
      var orderby = "full_name";
      var ordertype = "ASC";

      const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue,
        ["COUNT(1) AS count"],
        orderby,
        ordertype
      );

      let intTotlaRecords = Number(lisTotalRecords[0].count);
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

      const lisResult = await sqlQueryReplica.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        limit,
        offset
      );
      // if(lisResult.length === 0) return res.status(204).send({ message:'Sub admin not found'});
      // console.log(lisResult)
      // get departemnt list
      const lisDepart = await commonQueryCommon.getAllDepartment();
      if (!lisDepart)
        return res
          .status(400)
          .json({ errors: [{ msg: "department list error" }] });
      // console.log(lisDepart)
      var finalResult = lisResult.map((result) => {
        var { status, usertype_id, ...other } = result;
        other.status = status ? "Active" : "In-Active";
        //  other.departmanetName = usertype_id ? lisDepart[usertype_id].department_name : "Not Assigned"
        other.departmentName = "Admin Assistant";
        return other;
      });

      if (req.query.pageNumber == 0) {
        res.status(200).send(finalResult);
      } else {
        res.status(200).send({
          reportList: finalResult,
          totalRepords: intTotlaRecords,
          pageCount: intPageCount,
          currentPage: Number(req.query.pageNumber),
          pageLimit: Number(process.env.PER_PAGE_COUNT),
        });
      }
      // res.status(200).send(finalResult)
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  downloadSubAdminList = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.query.pageNumber) req.query.pageNumber = 0;

      const searchKeyValue = {
        usertype: roles.SubAdmin,
        active: 1,
      };

      const key = [
        "full_name AS name",
        "username AS userid",
        "usertype_id",
        "mobile",
        "CAST(created_on AS CHAR(20)) AS createdOn",
        "status",
      ];

      const orderby = "full_name";
      const ordertype = "ASC";

      const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(
        this.tableName1,
        searchKeyValue,
        ["COUNT(1) AS count"],
        orderby,
        ordertype
      );

      const intTotlaRecords = Number(lisTotalRecords[0].count);
      const intPageCount = Math.ceil(
        intTotlaRecords / Number(process.env.PER_PAGE_COUNT)
      );
      const offset =
        req.query.pageNumber > 0
          ? (req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT)
          : 0;
      const limit =
        req.query.pageNumber > 0
          ? Number(process.env.PER_PAGE_COUNT)
          : intTotlaRecords;

      const lisResult = await sqlQueryReplica.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        limit,
        offset
      );

      const lisDepart = await commonQueryCommon.getAllDepartment();
      if (!lisDepart) {
        return res
          .status(400)
          .json({ errors: [{ msg: "department list error" }] });
      }

      const finalResult = lisResult.map((result) => {
        const { status, usertype_id, ...other } = result;
        return {
          ...other,
          status: status ? "Active" : "In-Active",
          departmentName: "Admin Assistant",
        };
      });

      // Excel download if pageNumber == 0
      if (req.query.pageNumber == 0) {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
        const fileName = `sub_admin_list_${dateStr}_${timeStr}.xlsx`;
        const filePath = path.join(REPORT_DIR, fileName);

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
        const sheet = workbook.addWorksheet("Sub Admin List");

        if (finalResult.length > 0) {
          const sample = finalResult[0];
          sheet.columns = Object.keys(sample).map((key) => ({
            header: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            key,
            width: 20,
          }));
          sheet.getRow(1).font = { bold: true };
          sheet.addRows(finalResult);
        }

        await workbook.xlsx.writeFile(filePath);

        // Auto-delete after 30 minutes
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

      // Else, paginated JSON
      return res.status(200).json({
        reportList: finalResult,
        totalRepords: intTotlaRecords,
        pageCount: intPageCount,
        currentPage: Number(req.query.pageNumber),
        pageLimit: Number(process.env.PER_PAGE_COUNT),
      });
    } catch (error) {
      console.error("getSubAdminList", error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // admin update sub admin details
  updateSubadminDetails = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/updateSubadminDetials]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      let operator_uuid = "",
        operatorName = "";

      switch (req.body.mobile.slice(0, 3)) {
        case "078":
        case "073":
          // Etisalat
          operator_uuid = "70b9906d-c2ba-11";
          operatorName = "Etisalat";
          break;
        case "079":
        case "072":
          // Roshan
          operator_uuid = "9edb602c-c2ba-11";
          operatorName = "Roshan";
          break;
        case "077":
        case "076":
          // MTN
          (operator_uuid = "456a6b47-c2ba-11"), (operatorName = "MTN");
          break;
        case "074":
          // Salaam
          operator_uuid = "1e0e1eeb-c2a6-11";
          operatorName = "Salaam";
          break;
        case "070":
        case "071":
          // AWCC
          operator_uuid = "6a904d84-c2a6-11";
          operatorName = "AWCC";
          break;
      }

      if (
        operator_uuid != req.body.operator_uuid &&
        operatorName != req.body.operatorName
      ) {
        return res
          .status(400)
          .json({
            errors: [
              { msg: "Mobile number does not match with selected operator" },
            ],
          });
      }

      //verify departemnt id provided
      // console.log(req.body.department_uuid)
      var searchKeyValue = {
        department_uuid: req.body.department_uuid,
        active: 1,
      };
      var key = ["department_id"];
      var orderby = "department_id";
      var ordertype = "ASC";

      const lisResponce1 = await sqlQueryReplica.searchQuery(
        this.tableName6,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );
      if (lisResponce1.length === 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Department not found" }] });
      // console.log(lisResponce1)
      // creating parameter for sql query to add user
      var param = {
        usertype_id: lisResponce1 ? lisResponce1[0].department_id : 0,
        full_name: req.body.name, //str full_name
        emailid: req.body.email, //str email
        mobile: req.body.mobile,
        city_name: req.body.cityName,
        Address: req.body.address, //str address
      };

      //verify operator_uuid
      if (req.body.operator_uuid) {
        var searchKeyValue = {
          operator_uuid: req.body.operator_uuid, //str operator uuid
          operator_name: req.body.operatorName,
          active: 1,
          SMPP: 1,
        };
        var key = ["COUNT(1)"];
        var orderby = "operator_name";
        var ordertype = "ASC";

        // fire sql query to get operator name
        const lisResponse2 = await sqlQueryReplica.searchQuery(
          this.tableName10,
          searchKeyValue,
          key,
          orderby,
          ordertype,
          1,
          0
        );

        // check if the result is there and responce accordingly
        if (!lisResponse2) {
          throw new HttpException(500, "Something went wrong");
        }
        if (!lisResponse2[0]["COUNT(1)"]) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Operator Service not added" }] });
        }
        param.operator_uuid = req.body.operator_uuid;
        param.operator_name = req.body.operatorName;
        param.operator_uuid = req.body.operator_uuid;
        param.operator_name = req.body.operatorName;
      }

      if (req.body.gender !== null && req.body.gender !== undefined) {
        var lisGender = [1, 2, 0, "1", "2", "0"];
        if (!lisGender.includes(req.body.gender))
          return res
            .status(400)
            .json({
              errors: [
                { msg: "use gender 1 for male, 2 for female, 0 for other" },
              ],
            });
        param.gender = req.body.gender;
      }

      var searchKeyValue = {
        username: req.body.subAdminUserid,
        active: 1,
      };

      // assign region

      let lisRegion = req.body.listRegion;
      let regionList = [];
      if (lisRegion.length > 0) {
        for (let i = 0; i < lisRegion.length; i++) {
          let { region_uuid, regionName } = lisRegion[i];
          //check region uuid is not done
          if (!region_uuid || !regionName)
            return res
              .status(400)
              .json({ errors: [{ msg: "Region parameter are not proper" }] });
          var responce = await commonQueryCommon.checkRegionwithoutCountry(
            region_uuid,
            regionName
          );

          if (responce) {
            regionList.push(responce);
          }
        }
      }

      param.region_id = regionList.join(",");

      const objResult = await sqlQuery.updateQuery(
        this.tableName1,
        param,
        searchKeyValue
      );
      // console.log(objResult)
      const { affectedRows, changedRows, info } = objResult;
      const SubAdminDetailsMessage = !affectedRows
        ? "sub Admin not found"
        : affectedRows && changedRows
        ? "subAdmin details updated successfully"
        : "Sub Admin details update.";

      if (!affectedRows)
        return res
          .status(400)
          .json({ errors: [{ msg: "Sub Admin not found" }] });

      // if(affectedRows && changedRows){
      //     let smsDetails = {
      //         adminUsername : req.body.subAdminUserid,
      //         recieverMessage : `Admin ${req.query.username} updated your details.\nThank you for being Afghan Pay Sub-Admin!`
      //     }
      //     let smsFunResponce = await smsFunction.adminSms(smsDetails)
      //     if(smsFunResponce.error){
      //         console.log(smsFunResponce.error)
      //     }
      // }

      redisMaster.delete(`AUTH_SUB_ADMIN_${req.body.subAdminUserid}`);
      redisMaster.delete("ALLOWED_REGION_SUB_ADMIN_" + req.body.subAdminUserid);

      return res
        .status(200)
        .send({
          message:
            SubAdminDetailsMessage + " and region list updated successfully",
        });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // get single sub admin details
  getPerSubAdminDetails = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // console.log('[Admin/getPerSubAdmindetails]', JSON.stringify(req.body), JSON.stringify(req.query));
      //search sub admin details
      var searchKeyValue = {
        username: req.query.subAdminUserid,
        active: 1,
      };
      var key = [
        "username As userid",
        "usertype_id",
        "full_name as name",
        "emailid as email",
        "mobile",
        "gender",
        "city_name AS city",
        "Address AS address",
        "CAST(operator_uuid AS CHAR(16)) AS operator_uuid",
        "operator_name AS operatorName",
        "region_id",
      ];
      var orderby = "username";
      var ordertype = "ASC";

      var lisUserDetails = await sqlQueryReplica.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );
      if (lisUserDetails.length === 0)
        return res.status(204).send({ message: "sub admin details not found" });
      var UserDetails = lisUserDetails[0];

      // get departemnt list
      const lisDepart = await commonQueryCommon.getAllDepartment();
      if (!lisDepart)
        return res
          .status(400)
          .json({ errors: [{ msg: "department list error" }] });

      //get the region list
      var searchKeyValue = {
        region_ids: UserDetails.region_id,
        active: 1,
      };
      var key = [
        "CAST(region_uuid AS CHAR(16)) AS region_uuid",
        "region_name AS regionName",
      ];
      var orderby = "region_name";
      var ordertype = "ASC";
      var listRegion = await sqlQueryReplica.searchQueryNoLimit(
        this.tableName7,
        searchKeyValue,
        key,
        orderby,
        ordertype
      );

      // editing output
      var { usertype_id, gender, region_id, ...other } = UserDetails;
      other.departmentName = lisDepart[usertype_id - 1].department_name;
      other.department_uuid = lisDepart[usertype_id - 1].department_uuid;
      other.gender = gender == 1 ? "Male" : gender == 2 ? "Female" : "other";
      other.assignRegionList =
        listRegion.length > 0 ? listRegion : "No region Assigned";

      res.status(200).send(other);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // change sub admin active status
  changeActiveState = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/ChangeActiveState]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      //search sub admin active state
      var searchKeyValue = {
        username: req.body.subAdminUserid,
        active: 1,
      };
      var key = ["status"];
      var orderby = "username";
      var ordertype = "ASC";

      var lisUserDetails = await sqlQuery.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );
      if (lisUserDetails.length === 0)
        return res.status(204).send({ message: "sub admin details not found" });

      // change status value
      var param = {
        status: !lisUserDetails[0].status,
      };

      var objResult = await sqlQuery.updateQuery(
        this.tableName1,
        param,
        searchKeyValue
      );

      await redisMaster.delete(
        `ADMIN_LOGIN_ATTEMPT_${req.body.subAdminUserid}`
      );

      const { affectedRows, changedRows, info } = objResult;
      const message = !affectedRows
        ? "Sub-Admin not found"
        : affectedRows && changedRows
        ? "Sub-Admin status updated successfully"
        : "status chage faild";

      // send responce to fornt end
      res.send({ message, info });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // delete sub admin
  deleteSubAdmin = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/deleteSubAdmin]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      var searchKeyValue = {
        username: req.body.subAdminUserid,
        active: 1,
      };

      // change status value
      var param = {
        status: 0,
        active: 0,
      };

      var objResult = await sqlQuery.updateQuery(
        this.tableName1,
        param,
        searchKeyValue
      );

      const { affectedRows, changedRows, info } = objResult;
      const message = !affectedRows
        ? "Sub-Admin not found"
        : affectedRows && changedRows
        ? "Sub-Admin Deleted successfully"
        : "Sub-Admin allready Deleted";

      // send responce to fornt end
      res.send({ message, info });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  // admin login as sub admin
  loginAccess = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/loginAccess]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      //login message
      // console.log(req.body.message)

      // check reason
      const resonCheck = await sqlQueryReplica.searchQuery(
        this.tableName9,
        {
          reason_uuid: req.body.reason_uuid,
          reason: req.body.reason, //str reason
        },
        ["COUNT(1)"],
        "id",
        "ASC",
        1,
        0
      );

      if (resonCheck[0]["COUNT(1)"] == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "login reason not found" }] });

      //search sub admin active state
      var searchKeyValue = {
        username: req.body.subAdminUserid,
        active: 1,
      };
      var key = [
        "admin_userid",
        "username",
        "full_name",
        "usertype",
        "usertype_id",
        "mobile",
      ];
      var orderby = "username";
      var ordertype = "ASC";

      var lisUserDetails = await sqlQueryReplica.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );
      if (lisUserDetails.length === 0)
        return res.status(204).send({ message: "sub admin details not found" });

      // add log
      // api call variable
      var data = {
        userid: lisUserDetails[0].admin_userid,
        username: lisUserDetails[0].username,
        full_name: lisUserDetails[0].full_name,
        mobile: lisUserDetails[0].mobile,
        user_uuid: "0000000000000000",
        intCreatedByType: req.body.user_detials.id,
        intUserType:
          req.body.user_detials.type == roles.Admin ||
          req.body.user_detials.type == roles.SubAdmin
            ? req.body.user_detials.type == roles.Admin
              ? 1
              : 2
            : req.body.user_detials.type,
        userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
        userMacAddress: req.body.userMacAddress ? req.body.userMacAddress : 0, //str
        userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
        userImeiNumber: req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
        userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
        userAppVersion: req.body.userAppVersion
          ? req.body.userAppVersion
          : null, //str
        userApplicationType:
          req.body.userApplicationType == "Web"
            ? 1
            : req.body.userApplicationType == "Mobile"
            ? 2
            : 0,
        description:
          req.body.user_detials.type == roles.Admin ||
          req.body.user_detials.type == roles.SubAdmin
            ? req.body.user_detials.type +
              " Login as subAdmin " +
              req.body.reason
            : "Agent logedin as subAdmin " + req.body.reason,
        userActivityType: 13,
        oldValue: req.query.username,
        newValue: req.body.subAdminUserid,
        regionId: 0,
      };

      // make api call
      const intResult = await httpRequestMakerCommon.httpPost(
        "activity-log",
        data
      );
      var strLog =
        intResult == 1
          ? "Admin login log added successfully"
          : intResult == 2
          ? "Admin login log error"
          : "end point not found";
      // console.log('Server Log : '+strLog)

      // send sms to sub admin
      let smsDetails = {
        adminUsername: req.body.subAdminUserid,
        recieverMessage: `Admin ${req.query.username} login to your account to ${req.body.reason}, Thank you for being Afghan Pay Sub-Admin!`,
      };
      let smsFunResponce = await smsFunction.adminSms(smsDetails);
      if (smsFunResponce.error) {
        console.log(smsFunResponce.error);
      }

      // give login access
      const secretKey = process.env.SECRET_JWT || "";
      const token = jwt.sign(
        {
          user_id: req.body.subAdminUserid,
          userType: lisUserDetails[0].usertype,
        },
        secretKey,
        {
          expiresIn: process.env.SESSION_TIME,
        }
      );

      redisFunction.post(
        `admin_login_session_${lisUserDetails[0].username}`,
        token
      );

      // get module permission list
      let listModulePermission = await sqlQueryReplica.searchQuery(
        this.tableName8,
        { department_id: lisUserDetails[0].usertype_id },
        ["sub_admin_module_name AS moduleName", "perm_view AS permView"],
        "sub_admin_per_id",
        "ASC",
        10,
        0
      );
      // console.log(listModulePermission)
      if (listModulePermission.length != 10)
        listModulePermission = "permission list is improper";

      res
        .status(201)
        .send({
          userid: req.body.subAdminUserid,
          token,
          fullName: lisUserDetails[0].full_name,
          userType: lisUserDetails[0].usertype,
          listModulePermission,
        });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  //function to send password to registered mobile number
  forgetSendPassword = async (req, res, next) => {
    try {
      // check body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/forgetSendPassword]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      // search admin mobile number, password, encryption key using username
      var searchKeyValue = {
        username: req.body.userid,
        active: 1,
      };
      var key = ["password", "mobile", "encryption_key", "status"];
      var orderby = "username";
      var ordertype = "ASC";
      const lisResponce = await sqlQueryReplica.searchQuery(
        this.tableName1,
        searchKeyValue,
        key,
        orderby,
        ordertype,
        1,
        0
      );

      // send response for username not found and for wrong mobile number
      if (lisResponce.length === 0)
        return res.status(400).json({ errors: [{ msg: "user not found" }] });
      if (!lisResponce[0].mobile || lisResponce[0].mobile.length != 10)
        return res
          .status(400)
          .json({ errors: [{ msg: "Registered mobile is not proper" }] });
      if (lisResponce[0].status != 1)
        return res
          .status(400)
          .json({ errors: [{ msg: "User account is In-Active" }] });

      // decript the password using encription key
      var strDecriptedPassword = varEncryptionString.decryptString(
        lisResponce[0].encryption_key,
        lisResponce[0].password
      );

      // send password to registered mobile number
      var message = "This is you password : " + strDecriptedPassword;

      // sned sms
      let smsDetails = {
        adminUsername: req.body.userid,
        recieverMessage: `This is you password : ${strDecriptedPassword}, Thank you for being Afghan Pay Sub-Admin!`,
      };
      let smsFunResponce = await smsFunction.adminSms(smsDetails);
      // if(smsFunResponce.error){
      //     console.log(smsFunResponce.error)
      //     return res.status(400).json({ errors: [ {msg : 'error in sending sms'}] });
      // }

      // console.log(message)

      // send responce to fornt end
      res
        .status(200)
        .send({
          message: "Password will be send in your registered mobile number",
        });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  getSubAdminPassword = async (req, res) => {
    try {
      // check body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/getSubAdminPassword]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      // verify admin security pin
      let adminSecurityPin = await sqlQueryReplica.searchQuery(
        this.tableName1,
        { admin_userid: req.body.user_detials.id },
        ["tpin", "encryption_key"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (adminSecurityPin.length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Securty pin matching error" }] });

      let decriptSecurityPin = this.getHashPassword(
        adminSecurityPin[0].encryption_key,
        adminSecurityPin[0].tpin
      );
      if (decriptSecurityPin != req.body.securityPin)
        return res
          .status(400)
          .json({ errors: [{ msg: "Entered pin is incorrect" }] });

      // get agent security pin and
      let subAminSecurityPin = await sqlQueryReplica.searchQuery(
        this.tableName1,
        { username: req.body.subAdminUserid, active: 1 },
        ["password", "encryption_key"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (subAminSecurityPin.length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "sub-Admin account not found" }] });

      let decriptSecurityPassword = this.getHashPassword(
        subAminSecurityPin[0].encryption_key,
        subAminSecurityPin[0].password
      );

      res.status(200).json({ password: decriptSecurityPassword });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  updateSubAdminPassword = async (req, res) => {
    try {
      // check body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/updateSubAdminPassword]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      // verify admin security pin
      let adminSecurityPin = await sqlQuery.searchQuery(
        this.tableName1,
        { admin_userid: req.body.user_detials.id },
        ["tpin", "encryption_key"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (adminSecurityPin.length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Securty pin matching error" }] });

      let decriptSecurityPin = this.getHashPassword(
        adminSecurityPin[0].encryption_key,
        adminSecurityPin[0].tpin
      );
      if (decriptSecurityPin != req.body.securityPin)
        return res
          .status(400)
          .json({ errors: [{ msg: "Entered pin is incorrect" }] });

      // get agent security pin and passowrd
      let subAdminSecurity = await sqlQuery.searchQuery(
        this.tableName1,
        { username: req.body.subAdminUserid, active: 1 },
        ["password", "encryption_key", "tpin"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (subAdminSecurity.length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Sub-Admin account not found" }] });

      let decriptSecurityPassword = this.getHashPassword(
        subAdminSecurity[0].encryption_key,
        subAdminSecurity[0].password
      );
      decriptSecurityPin = this.getHashPassword(
        subAdminSecurity[0].encryption_key,
        subAdminSecurity[0].tpin
      );

      // update password and security pin with new security key
      let newEncryptionKey = this.setEncryptionKey();
      let newPasswordHash = this.setHashPassword(
        newEncryptionKey,
        req.body.newPassword
      );
      let newPinHash = this.setHashPassword(
        newEncryptionKey,
        decriptSecurityPin
      );
      let param = {
        encryption_key: newEncryptionKey,
        password: newPasswordHash,
        tpin: newPinHash,
      };

      let upadteResose = await sqlQuery.updateQuery(this.tableName1, param, {
        username: req.body.subAdminUserid,
      });
      const { affectedRows, changedRows, info } = upadteResose;
      const message = !affectedRows
        ? "Sub-Admin not found"
        : affectedRows && changedRows
        ? "Sub-Admin password updated successfully"
        : "Sub-Admin password alredy updated";

      const status = !affectedRows
        ? 400
        : affectedRows && changedRows
        ? 200
        : 200;

      res.status(status).json({ message });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  getSubAdminPin = async (req, res) => {
    try {
      // check body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/getSubAdminPin]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      // verify admin security pin
      let adminSecurityPin = await sqlQueryReplica.searchQuery(
        this.tableName1,
        { admin_userid: req.body.user_detials.id },
        ["tpin", "encryption_key"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (adminSecurityPin.length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Securty pin matching error" }] });

      let decriptSecurityPin = this.getHashPassword(
        adminSecurityPin[0].encryption_key,
        adminSecurityPin[0].tpin
      );
      if (decriptSecurityPin != req.body.securityPin)
        return res
          .status(400)
          .json({ errors: [{ msg: "Entered pin is incorrect" }] });

      // get agent security pin and
      let subAminSecurityPin = await sqlQueryReplica.searchQuery(
        this.tableName1,
        { username: req.body.subAdminUserid, active: 1 },
        ["tpin", "encryption_key"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (subAminSecurityPin.length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Sub-Admin account not found" }] });

      decriptSecurityPin = this.getHashPassword(
        subAminSecurityPin[0].encryption_key,
        subAminSecurityPin[0].tpin
      );

      res.status(200).json({ securityPin: decriptSecurityPin });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  updateSubAdminPin = async (req, res) => {
    try {
      // check body and query
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      console.log(
        "[Admin/updateSubAdminPin]",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      // verify admin security pin
      let adminSecurityPin = await sqlQuery.searchQuery(
        this.tableName1,
        { admin_userid: req.body.user_detials.id },
        ["tpin", "encryption_key"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (adminSecurityPin.length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Securty pin matching error" }] });

      let decriptSecurityPin = this.getHashPassword(
        adminSecurityPin[0].encryption_key,
        adminSecurityPin[0].tpin
      );
      if (decriptSecurityPin != req.body.securityPin)
        return res
          .status(400)
          .json({ errors: [{ msg: "Entered pin is incorrect" }] });

      // get agent security pin and passowrd
      let subAdminSecurity = await sqlQuery.searchQuery(
        this.tableName1,
        { username: req.body.subAdminUserid, active: 1 },
        ["password", "encryption_key", "tpin"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (subAdminSecurity.length == 0)
        return res
          .status(400)
          .json({ errors: [{ msg: "Sub-Admin account not found" }] });

      let decriptSecurityPassword = this.getHashPassword(
        subAdminSecurity[0].encryption_key,
        subAdminSecurity[0].password
      );
      decriptSecurityPin = this.getHashPassword(
        subAdminSecurity[0].encryption_key,
        subAdminSecurity[0].tpin
      );

      // update password and security pin with new security key
      let newEncryptionKey = this.setEncryptionKey();
      let newPasswordHash = this.setHashPassword(
        newEncryptionKey,
        decriptSecurityPassword
      );
      let newPinHash = this.setHashPassword(
        newEncryptionKey,
        req.body.newSecurityPin
      );
      let param = {
        encryption_key: newEncryptionKey,
        password: newPasswordHash,
        tpin: newPinHash,
      };

      let upadteResose = await sqlQuery.updateQuery(this.tableName1, param, {
        username: req.body.subAdminUserid,
      });
      const { affectedRows, changedRows, info } = upadteResose;
      const message = !affectedRows
        ? "Sub-Admin not found"
        : affectedRows && changedRows
        ? "Sub-Admin password updated successfully"
        : "Sub-Admin password alredy updated";

      const status = !affectedRows
        ? 400
        : affectedRows && changedRows
        ? 200
        : 200;

      res.status(status).json({ message });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ errors: [{ msg: error.message }] });
    }
  };

  setEncryptionKey() {
    var strRandomString = varRandomString.generateRandomString(15);
    var strRandomHash = varRandomString.generateRandomHash(strRandomString);
    return strRandomHash;
  }

  setHashPassword(strKey, strText) {
    return varEncryptionString.encryptString(strKey, strText);
  }

  getHashPassword(strKey1, strText1) {
    return varEncryptionString.decryptString(strKey1, strText1);
  }

  async setUserName() {
    let userName = "AFP-22510";
    let i = 0;

    while (i < 10) {
      userName = "AFP-" + varRandomString.generateRandomNumber(5);

      let userCount = await sqlQuery.searchQuery(
        this.tableName1,
        { username: userName },
        ["COUNT(1)"],
        "admin_userid",
        "ASC",
        1,
        0
      );
      if (userCount[0]["COUNT(1)"] == 0) break;

      i = i + 1;
    }
    if (i == 10) {
      return { error: userName };
    } else {
      return { username: userName };
    }
  }

  randomPassword(length) {
    var chars =
      "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
      var i = Math.floor(Math.random() * chars.length);
      pass += chars.charAt(i);
    }
    return pass;
  }

  checkValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      //res.status(400).json({ errors: errors.errors[0].msg });
    }
  };
}

module.exports = new AdminController();
