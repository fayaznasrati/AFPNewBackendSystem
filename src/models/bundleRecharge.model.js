const { tableName4 } = require("../controllers/emoney.controller");
const dbConnection = require("../db/db-connection");
const { multipleColumnSet } = require("../utils/common.utils");
const dbConnectionReplica = require("../db/db-connection-replica");

const dotenv = require("dotenv");
dotenv.config();

class rechargeModule {
  // tableName
  tableName1 = "er_bundle_recharge";
  tableName2 = "er_login";
  tableName3 = "er_commission_amount";
  tableName4 = "er_monthly_recharge";
  tableName5 = "er_master_operator";
  tablename6 = "er_admin_notification_types";
  tableName7 = "er_admin_notification_numbers";
  tableName8 = "er_login_admin";
  tableName9 = "er_daily_user_summery";
  tableName10 = "er_daily_topup_summery";

  downlineTopUpReportCount = async (searchKeyValue) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count,
                          SUM(${this.tableName1}.amount) AS totalAmount, SUM(${this.tableName1}.comm_amt) AS totalCommissionAmount
                   FROM ${this.tableName1} JOIN ${this.tableName2} 
                   ON ${this.tableName1}.userid = ${this.tableName2}.userid
                   WHERE ${seColumnSet} ORDER BY ${this.tableName1}.id DESC`;
    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [...sevalues]);

    return result;
  };

  downlineTopUpReport = async (searchKeyValue, limit, offset) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ 
                        ${this.tableName2}.username AS userid, 
                        ${this.tableName2}.full_name AS agentName, 
                        ${this.tableName2}.mobile,
                        ${this.tableName1}.amount, 
                        ${this.tableName1}.mobile_number AS topUpMobile, 
                        ${this.tableName1}.comm_amt AS commissionAmount, 
                        IF(${this.tableName1}.status = 1, 'Pending', 
                        IF(${this.tableName1}.status = 2, 'Success', 
                            IF(${this.tableName1}.status = 3, 'Failed', 'NA'))) AS status, 
                        ${this.tableName1}.trans_number AS transactionNumber, 
                        ${this.tableName1}.operator_name AS operatorName, 
                        CAST(${this.tableName1}.created_on AS CHAR(20)) AS dateTime
                FROM ${this.tableName1} 
                JOIN ${this.tableName2} 
                ON ${this.tableName1}.userid = ${this.tableName2}.userid
                WHERE ${seColumnSet} 
                ORDER BY ${this.tableName1}.id DESC 
                LIMIT ${limit} OFFSET ${offset}`;

    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [...sevalues]);

    return result;
  };

  agentBundleTopupReport = async (searchKeyValue, limit, offset) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tableName2}.username AS userId, ${this.tableName2}.full_name AS userName,
        CASE  WHEN ${this.tableName2}.usertype_id = 1 then 'Master Distributor' 
              WHEN ${this.tableName2}.usertype_id = 2 then 'Distributor' 
              WHEN ${this.tableName2}.usertype_id = 3 then 'Reseller' 
              WHEN ${this.tableName2}.usertype_id = 4 then 'Retailer' 
              ELSE 'NA' 
        END as agentType,
        ${this.tableName1}.request_mobile_no AS userMobile, 
        ${this.tableName1}.trans_number AS transactionNumber, 
        ${this.tableName1}.operator_name AS operatorName, 
        ${this.tableName1}.mobile_number AS topUpMobile, 
        ${this.tableName1}.bundle_name AS bundleName, 
        ${this.tableName1}.bundle_type AS bundleType, 
        ${this.tableName1}.amount, 
        ${this.tableName1}.deduct_amt AS deductAmount, 
        ${this.tableName1}.operator_balance AS apiBalance, 
        CAST(${this.tableName1}.created_on AS CHAR(20)) AS date, 
        ${this.tableName1}.operator_transid AS operatorTransactionId, 
        CASE 
              WHEN ${this.tableName1}.status = 1 THEN 'Pending' 
              WHEN ${this.tableName1}.status = 3 THEN 'Failed' 
              ELSE 'Success' 
        END AS status, 
        ${this.tableName1}.source AS transactionMode, 
        CASE 
              WHEN ${this.tableName1}.api_type = 2 THEN 'Roshan' 
              WHEN ${this.tableName1}.api_type = 3 THEN 'AWCC' 
              WHEN ${this.tableName1}.api_type = 4 THEN 'Etisalat' 
              WHEN ${this.tableName1}.api_type = 8 THEN 'MTN' 
              ELSE 'NA' 
        END AS apiType, 
        ${this.tableName1}.os_details AS apiResponce
       FROM ${this.tableName1} 
       JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
       WHERE ${seColumnSet} 
       ORDER BY ${this.tableName1}.id DESC 
       LIMIT ${limit} OFFSET ${offset}`;

    const result = await dbConnectionReplica.query(sql, [...sevalues]);
    // console.log("result agent Bundle Topup Report", result);
    return result;
  };

  agentTopupSumCountReport = async (searchKeyValue) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ 
                COUNT(1) AS count, 
                SUM(${this.tableName1}.amount) AS amount, 
                SUM(${this.tableName1}.deduct_amt) AS deductAmount
                FROM ${this.tableName1} 
                JOIN ${this.tableName2} 
                ON ${this.tableName1}.userid = ${this.tableName2}.userid
                WHERE ${seColumnSet} 
                ORDER BY ${this.tableName1}.id DESC`;

    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [...sevalues]);

    return result;
  };

  failedRechargeNumberList = async (mnoId) => {
    // const { seColumnSet, sevalues } = this.multipleAndColumnSet(searchKeyValue,this.tableName2,this.tableName1)

    var sql = `SELECT ${this.tableName8}.username as userName, ${this.tableName8}.admin_userid AS userId,
                          ${this.tableName7}.nn_number,
                          ${this.tablename6}.nt_name
                          FROM ${this.tableName7} JOIN ${this.tableName8} ON ${this.tableName7}.created_by = ${this.tableName8}.admin_userid
                                                  JOIN ${this.tablename6} ON ${this.tableName7}.nn_type = ${this.tablename6}.nt_id
                    WHERE ${this.tableName7}.active = ? AND ${this.tableName7}.nn_type = ?  ORDER BY ${this.tableName8}.admin_userid DESC`;
    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [1, mnoId]);

    return result;
  };

  ebundleSummeryReport = async (searchKeyValue, userIds) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );
 let sql = `SELECT 
  /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */
  /* Amount columns per operator */
  IF(oper_1.amount, oper_1.amount, 0) AS Salam_totalAmount,
  IF(oper_2.amount, oper_2.amount, 0) AS AWCC_totalAmount,
  IF(oper_3.amount, oper_3.amount, 0) AS MTN_totalAmount,
  IF(oper_4.amount, oper_4.amount, 0) AS Etisalat_totalAmount,
  IF(oper_5.amount, oper_5.amount, 0) AS Roshan_totalAmount,
  
  /* Count columns per operator */
  IF(oper_1.count, oper_1.count, 0) AS Salam_ActivationCount,
  IF(oper_2.count, oper_2.count, 0) AS AWCC_ActivationCount,
  IF(oper_3.count, oper_3.count, 0) AS MTN_ActivationCount,
  IF(oper_4.count, oper_4.count, 0) AS Etisalat_ActivationCount,
  IF(oper_5.count, oper_5.count, 0) AS Roshan_ActivationCount,

  /* Summations for totals */
  IF(oper_1.amount, oper_1.amount, 0) +
  IF(oper_2.amount, oper_2.amount, 0) +
  IF(oper_3.amount, oper_3.amount, 0) +
  IF(oper_4.amount, oper_4.amount, 0) +
  IF(oper_5.amount, oper_5.amount, 0) AS TotalTopUpBundleAmount,

  IF(oper_1.count, oper_1.count, 0) +
  IF(oper_2.count, oper_2.count, 0) +
  IF(oper_3.count, oper_3.count, 0) +
  IF(oper_4.count, oper_4.count, 0) +
  IF(oper_5.count, oper_5.count, 0) AS TotalActivationCount

FROM 
(
  SELECT 
    IF(SUM(${this.tableName1}.amount), SUM(${this.tableName1}.amount), 0) AS amount, 
    IF(COUNT(1), COUNT(1), 0) AS count 
  FROM ${this.tableName1} 
  WHERE operator_id = 1 
    AND ${seColumnSet} 
    AND userid IN (${userIds})
) AS oper_1
JOIN
(
  SELECT 
    IF(SUM(${this.tableName1}.amount), SUM(${this.tableName1}.amount), 0) AS amount, 
    IF(COUNT(1), COUNT(1), 0) AS count 
  FROM ${this.tableName1} 
  WHERE operator_id = 2 
    AND ${seColumnSet} 
    AND userid IN (${userIds})
) AS oper_2
JOIN
(
  SELECT 
    IF(SUM(${this.tableName1}.amount), SUM(${this.tableName1}.amount), 0) AS amount, 
    IF(COUNT(1), COUNT(1), 0) AS count 
  FROM ${this.tableName1} 
  WHERE operator_id = 3 
    AND ${seColumnSet} 
    AND userid IN (${userIds})
) AS oper_3
JOIN
(
  SELECT 
    IF(SUM(${this.tableName1}.amount), SUM(${this.tableName1}.amount), 0) AS amount, 
    IF(COUNT(1), COUNT(1), 0) AS count 
  FROM ${this.tableName1} 
  WHERE operator_id = 4 
    AND ${seColumnSet} 
    AND userid IN (${userIds})
) AS oper_4
JOIN
(
  SELECT 
    IF(SUM(${this.tableName1}.amount), SUM(${this.tableName1}.amount), 0) AS amount, 
    IF(COUNT(1), COUNT(1), 0) AS count 
  FROM ${this.tableName1} 
  WHERE operator_id = 5 
    AND ${seColumnSet} 
    AND userid IN (${userIds})
) AS oper_5`
    let result = await dbConnectionReplica.query(sql, [
      ...sevalues,
      ...sevalues,
      ...sevalues,
      ...sevalues,
      ...sevalues,
    ]);
    return result[0];
  };

  getAgentEbundleDownlineReportCount = async (searchKeyValue) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count , SUM(${this.tableName1}.amount) AS totalAmount, SUM(${this.tableName1}.deduct_amt) AS totalDeductAmount
                   FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
                   WHERE ${seColumnSet} ORDER BY ${this.tableName1}.id DESC`;
    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [...sevalues]);

    return result;
  };

  getAgentEbundleDownlineReport = async (searchKeyValue, limit, offset) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tableName2}.username AS agentid, 
                          ${this.tableName2}.full_name AS agentName, 
                          ${this.tableName2}.mobile AS agentMobile,
                          IF(${this.tableName2}.usertype_id = 1, 'Master Distributor', 
                             IF(${this.tableName2}.usertype_id = 2, 'Distributor', 
                                IF(${this.tableName2}.usertype_id = 3, 'Reseller', 'Retailer'))) AS agentType,
                          ${this.tableName1}.trans_number AS transactionNumber, 
                          ${this.tableName1}.operator_name AS operatorName, 
                          ${this.tableName1}.mobile_number AS topUpMobile, 
                          ${this.tableName1}.bundle_name AS bundleName, 
                          ${this.tableName1}.bundle_type AS bundleType, 
                          ${this.tableName1}.amount, 
                          ${this.tableName1}.deduct_amt AS deductAmount, 
                          ${this.tableName1}.operator_balance AS apiBalance, 
                          CAST(${this.tableName1}.created_on AS CHAR(20)) AS date, 
                          ${this.tableName1}.operator_transid AS operatorTransactionId, 
                          CASE 
                              WHEN ${this.tableName1}.status = 1 THEN 'Pending' 
                              WHEN ${this.tableName1}.status = 2 THEN 'Success' 
                              ELSE 'Failed' 
                          END AS status, 
                          ${this.tableName1}.source AS transactionMode, 
                          CASE 
                                WHEN ${this.tableName1}.api_type = 2 THEN 'Roshan' 
                                WHEN ${this.tableName1}.api_type = 3 THEN 'AWCC' 
                                WHEN ${this.tableName1}.api_type = 4 THEN 'Etisalat' 
                                WHEN ${this.tableName1}.api_type = 8 THEN 'MTN' 
                              ELSE 'NA' 
                          END AS apiType
                   FROM ${this.tableName1} 
                   JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
                   WHERE ${seColumnSet} 
                   ORDER BY ${this.tableName1}.id DESC 
                   LIMIT ${limit} OFFSET ${offset}`;

    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [...sevalues]);

    return result;
  };

  agentCommissionReportCount = async (searchKeyValue) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ 
        COUNT(1) AS count, 
        SUM(${this.tableName1}.amount) AS totalAmount, 
        SUM(${this.tableName1}.deduct_amt) AS totalDeductAmount, 
        SUM(${this.tableName1}.comm_amt) AS totalCommissionAmount
        FROM ${this.tableName1} 
        JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
        WHERE ${seColumnSet} 
        ORDER BY ${this.tableName1}.id DESC`;

    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [...sevalues]);

    return result;
  };

  agentCommissionReport = async (searchKeyValue, limit, offset) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tableName2}.username as agentid, ${this.tableName2}.full_name as agentName, ${this.tableName2}.usertype_id,
                          ${this.tableName1}.operator_name AS operatorName, ${this.tableName1}.mobile_number AS topUpMobile, ${this.tableName1}.amount, ${this.tableName1}.deduct_amt AS deductAdmount, ${this.tableName1}.comm_amt, CAST(${this.tableName1}.created_on AS CHAR(20)) AS date
                   FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
                   WHERE ${seColumnSet} ORDER BY ${this.tableName1}.id DESC LIMIT ${limit} OFFSET ${offset}`;
    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [...sevalues]);

    return result;
  };

  adminCommissionReportCount = async (searchKeyValue, userId) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count, SUM(${this.tableName1}.amount) AS totalRechargeAmount,
                          SUM(${this.tableName3}.commission_amount) AS totalCommAmount
                   FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
                                           JOIN ${this.tableName3} ON ${this.tableName1}.trans_number = ${this.tableName3}.recharge_id
                   WHERE ${this.tableName3}.userid = ? AND ${seColumnSet} ORDER BY ${this.tableName1}.id DESC`;
    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [userId, ...sevalues]);

    return result;
  };

  adminCommissionReport = async (searchKeyValue, userId, limit, offset) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    var sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tableName2}.username as agentid, ${this.tableName2}.full_name as agentName, ${this.tableName2}.usertype_id, ${this.tableName2}.mobile,
                          ${this.tableName1}.operator_name AS operatorName, ${this.tableName1}.mobile_number AS topUpMobile, ${this.tableName1}.amount AS rechargeAmount, CAST(${this.tableName1}.created_on AS CHAR(20)) AS date,
                          ${this.tableName3}.commission_amount AS commAmount
                   FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
                                           JOIN ${this.tableName3} ON ${this.tableName1}.trans_number = ${this.tableName3}.recharge_id
                   WHERE ${this.tableName3}.userid = ? AND ${seColumnSet} ORDER BY ${this.tableName1}.id DESC LIMIT ${limit} OFFSET ${offset}`;
    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [userId, ...sevalues]);

    return result;
  };

  agentTelcoTopUpreport = async (searchKeyValue) => {
    let operatorid = searchKeyValue.operator_id;
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName5,
      this.tableName1
    );

    let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tableName5}.operator_name AS operatorName, successRechargeTable.successTopup AS successTopupAmount, successRechargeTable.successToupUpCount AS successToupUpCount
                    FROM ${this.tableName5} LEFT JOIN ( 
                                                SELECT SUM(${this.tableName1}.amount) AS successTopup, COUNT(${this.tableName1}.amount) AS successToupUpCount, ${this.tableName1}.operator_id FROM ${this.tableName1} WHERE ${this.tableName1}.status = 2 AND ${seColumnSet} GROUP BY operator_id 
                                            ) AS successRechargeTable
                                            ON ${this.tableName5}.operator_id = successRechargeTable.operator_id`;
    sql += operatorid
      ? ` WHERE ${this.tableName5}.operator_id = ${operatorid} `
      : ``;
    sql += ` ORDER BY ${this.tableName5}.operator_id ASC `;
    // let sql = `SELECT ${this.tableName5}.operator_name AS operatorName, successRechargeTable.successTopup AS successTopupAmount, successRechargeTable.successToupUpCount AS successToupUpCount ,failedRechargeTable.failedTopup AS failedTopupAmount, failedRechargeTable.failedToupUpCount AS failedToupUpCount
    //             FROM ${this.tableName5} LEFT JOIN (
    //                                         SELECT SUM(${this.tableName1}.amount) AS successTopup, COUNT(${this.tableName1}.amount) AS successToupUpCount, ${this.tableName1}.operator_id FROM ${this.tableName1} WHERE ${this.tableName1}.status = 2 AND ${seColumnSet} GROUP BY operator_id
    //                                     ) AS successRechargeTable
    //                                     ON ${this.tableName5}.operator_id = successRechargeTable.operator_id
    //                                     LEFT JOIN (
    //                                         SELECT SUM(${this.tableName1}.amount) AS failedTopup, COUNT(${this.tableName1}.amount) AS failedToupUpCount, ${this.tableName1}.operator_id FROM ${this.tableName1} WHERE ${this.tableName1}.status = 3 AND ${seColumnSet} GROUP BY operator_id
    //                                     ) AS failedRechargeTable
    //                                     ON ${this.tableName5}.operator_id = failedRechargeTable.operator_id`
    //     sql += operatorid ? ` WHERE ${this.tableName5}.operator_id = ${operatorid} ` : ``
    //     sql += ` ORDER BY ${this.tableName5}.operator_id ASC `
    // let sql = ` SELECT operator_name AS operatorName, SUM(amount) AS successTopupAmount, COUNT(amount) AS successToupUpCount, CAST(created_on AS CHAR(10)) AS date FROM ${this.tableName1} WHERE status = 2 AND ${seColumnSet} GROUP BY operator_id, CAST(created_on AS DATE) order by date desc`
    // console.log(sql)

    const result = await dbConnectionReplica.query(sql, [...sevalues]);

    // console.log(result)

    return result;
  };

  topRankingReportCount = async (searchKeyValue) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) as count
                    FROM ${this.tableName1} JOIN ${this.tableName2} 
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} GROUP by ${this.tableName1}.userid ORDER BY ${this.tableName1}.id DESC`;

    // console.log(sql)
    const result = await dbConnectionReplica.query(sql, [...sevalues]);
    // console.log(result);
    return result;
  };

  topRankingReport = async (searchKeyValue, limit, offset) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      searchKeyValue,
      this.tableName2,
      this.tableName1
    );

    let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tableName2}.username AS userId, ${this.tableName2}.full_name AS fullName, ${this.tableName2}.mobile AS contact, ${this.tableName2}.emailid AS emailId,
                            SUM(${this.tableName1}.amount) AS topUpAmount
                    FROM ${this.tableName1} JOIN ${this.tableName2} 
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} GROUP by ${this.tableName1}.userid ORDER BY topUpAmount DESC LIMIT ${limit} OFFSET ${offset}`;

    // console.log(sql)
    const result = await dbConnectionReplica.query(sql, [...sevalues]);
    // console.log(result);
    return result;
  };

  getCommissionRollbackList = async (rechargeId, operatorId) => {
    let sql = `SELECT ${this.tableName2}.userid as userid, CAST(${this.tableName2}.user_uuid AS CHAR(16)) as user_uuid, ${this.tableName2}.parent_id as parent_id,
                        ${this.tableName3}.commission_amount as commission_amount
                    FROM ${this.tableName2} JOIN ${this.tableName3} ON ${this.tableName2}.userid = ${this.tableName3}.userid
                    WHERE ${this.tableName3}.recharge_id = ? AND ${this.tableName3}.operator_id = ?`;

    const result = await dbConnectionReplica.query(sql, [
      rechargeId,
      operatorId,
    ]);
    // console.log(result);
    return result;
  };

  multipleAndColumnSet = (object, tableName1, tableName2) => {
    if (typeof object !== "object") {
      throw new Error("Invalid input");
    }

    let { region_ids, child_ids, between, isIn, request_mobile_no, ...other } =
      object;

    const keys = Object.keys(other);
    const sevalues = Object.values(other);

    var seColumnSet = keys.map((key) => {
      if (key == "start_date") return ` ? <= date( ${tableName2}.created_on)`;
      if (key == "end_date") return `date( ${tableName2}.created_on) <= ?`;
      if (key == "mobile_number") return `${tableName2}.mobile_number = ?`;
      if (key == "operator_id") return `${tableName2}.operator_id = ?`;
      if (key == "status") return `${tableName2}.status = ?`;
      if (key == "rollback_status") return `${tableName2}.rollback_status = ?`;
      if (key == "trans_number") return `${tableName2}.trans_number = ?`;
      if (key.includes("_uuid"))
        return `CAST(${tableName1}.${key} AS  CHAR(16)) = ?`;
      return `${tableName1}.${key} = ?`;
    });

    if (request_mobile_no)
      seColumnSet.push(
        `${tableName2}.request_mobile_no IN ( ${request_mobile_no[0]},${request_mobile_no[1]} ) `
      );
    if (region_ids)
      seColumnSet.push(`${tableName1}.region_id IN ( ${region_ids} ) `);
    if (child_ids)
      seColumnSet.push(`${tableName1}.userid IN ( ${child_ids} ) `);
    if (between)
      seColumnSet.push(
        ` date( ${tableName2}.${between.key}) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `
      );
    if (isIn)
      seColumnSet.push(`${tableName2}.${isIn.key} IN ( ${isIn.value} ) `);
    seColumnSet = seColumnSet.join(" AND ");

    return {
      seColumnSet,
      sevalues,
    };
  };
}

module.exports = new rechargeModule();
