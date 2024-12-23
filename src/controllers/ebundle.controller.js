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

/******************************************************************************
 *                              ebundle Controller
 ******************************************************************************/
const ebundleTypes = {};
class EbundleController {
  tableName1 = "er_ebundles";

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
  
  filterEbundle = async (req, res, next) => {
    try {
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
      console.log(
        "bundle update",
        JSON.stringify(req.body),
        JSON.stringify(req.query)
      );
      // get operator id by operator uuid
      const bundleId = req.query.ebundle_id; // Extract ID from query parameters
      if (!bundleId) {
        return res.status(400).json({ error: "Bundle ID is required" });
      }

      const searchKeyValue = { ebundle_id: bundleId }; // Search criteria
      //variables for sql query to update operator
      var param = {
        operator_uuid: req.body.operator_uuid,
        operatorType: req.body.operator_name,
        ebundleType: req.body.eBundleTypes,
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

      // fire sql query to update operator status
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
        ? "ebundle access not found"
        : affectedRows && changedRows
        ? "ebundle access updated successfully"
        : "Updated status is same as previous status";

      const status = !affectedRows
        ? 400
        : affectedRows && changedRows
        ? 200
        : 200;
      // send responce to front end
      res.status(status).send({ message, info });
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
}

module.exports = new EbundleController();
