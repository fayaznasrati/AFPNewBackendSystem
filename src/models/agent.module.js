const dbConnection = require("../db/db-connection");
const dbConnectionReplica = require("../db/db-connection-replica");
const commonqueryCommand = require("../common/commonQuery.common");
const commonQueryCommon = require("../common/commonQuery.common");

class agentModule {
  tableName1 = "er_login";
  tableName2 = "er_wallet";
  tableName3 = "er_agent_contact";

  constructor() {
    // this.testQUery1()
  }

  testQUery1 = async () => {
    try {
      let sql = `SELECT userid, username, child_id, parent_id FROM ${this.tableName1} order by userid desc ;`;
      const result = await dbConnectionReplica.query(sql);
      // console.log(result)
      for (let i = 0; i < result.length; i++) {
        let userId = result[i].userid;
        let parentId = result[i].parent_id;
        while (parentId) {
          sql = `SELECT userid, username, child_id, parent_id FROM ${this.tableName1} where userid = ${parentId} order by userid desc limit 1;`;
          let details = await dbConnectionReplica.query(sql);
          // console.log(details)
          if (details.length > 0) {
            let childList = details[0].child_id.split(",");
            if (!childList.includes(String(userId))) {
              console.log(`userid ${userId}, parentId ${parentId}`);
            }
          }
          parentId = details[0].parent_id;
        }
      }
      // console.log("done --------");
    } catch (e) {
      console.log(e);
    }
  };

  testQUery2 = async () => {
    try {
      let sql = `UPDATE ${this.tableName1} SET child_id = ''`;
      let result = await dbConnection.query(sql);

      sql = `SELECT userid, username, child_id, parent_id FROM ${this.tableName1} order by userid desc ;`;
      result = await dbConnectionReplica.query(sql);

      // console.log(result)
      for (let i = 0; i < result.length; i++) {
        let userId = result[i].userid;
        let parentId = result[i].parent_id;

        while (parentId) {
          sql = `SELECT userid, username, child_id, parent_id FROM ${this.tableName1} where userid = ${parentId} order by userid desc ;`;
          let parentDetails = await dbConnectionReplica.query(sql);

          if (parentDetails.length > 0) {
            let childIds =
              parentDetails[0].child_id == ""
                ? `${userId}`
                : parentDetails[0].child_id + `,${userId}`;

            sql = `UPDATE ${this.tableName1} SET child_id = '${childIds}' where userid = ${parentId};`;
            let updateResult = await dbConnection.query(sql);
          }

          parentId = parentDetails[0].parent_id;
        }
      }

      // console.log("done --------");
    } catch (e) {
      console.log(e);
    }
  };

  searchAgentid = async (userid) => {
    var sql = `SELECT userid, username,full_name, usertype_id, CAST(user_uuid AS CHAR(16)) AS user_uuid, user_status, fource_logout, child_id, region_id, mobile FROM ${this.tableName1} WHERE userid = '${userid}' AND Active = 1 LIMIT 1`;
    const result = await dbConnectionReplica.query(sql);
    // console.log("resuklt",result)
    if (result.length == 0) return 0;
    return result[0];
  };

  searchAgentCount = async (details) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      details,
      this.tableName1,
      this.tableName3
    );
    // console.log(seColumnSet,sevalues)
    var sql = `SELECT COUNT(1) AS count
                          FROM ${this.tableName1} LEFT JOIN ${this.tableName2} 
                          ON ${this.tableName1}.userid = ${this.tableName2}.userid
                          LEFT JOIN ${this.tableName3} 
                          ON ${this.tableName1}.userid = ${this.tableName3}.userid AND ${this.tableName3}.status = 1
                          WHERE ${seColumnSet} GROUP BY ${this.tableName1}.userid 
                          ORDER BY ${this.tableName1}.userid DESC`;
    // console.log(sql)
    var result = await dbConnectionReplica.query(sql, [...sevalues]);
    return result;
  };

  searchAgent = async (details, limit, offset) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      details,
      this.tableName1,
      this.tableName3
    );
    // console.log(seColumnSet,sevalues)
    var sql = `SELECT CAST(${this.tableName1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName1}.username AS id, ${this.tableName1}.usertype_id AS typeId, ${this.tableName1}.province_Name AS province ,${this.tableName1}.region_name AS region, ${this.tableName1}.full_name AS name, ${this.tableName1}.mobile, CAST(${this.tableName1}.created_on AS CHAR(20)) AS registerDate, ${this.tableName1}.user_status AS Active ,${this.tableName1}.comm_type AS commissionType,
                          ${this.tableName2}.ex_wallet AS walletBalance
                          FROM ${this.tableName1} LEFT JOIN ${this.tableName2} 
                          ON ${this.tableName1}.userid = ${this.tableName2}.userid
                          LEFT JOIN ${this.tableName3} 
                          ON ${this.tableName1}.userid = ${this.tableName3}.userid AND ${this.tableName3}.status = 1
                          WHERE ${seColumnSet} GROUP BY ${this.tableName1}.userid
                          ORDER BY ${this.tableName1}.userid DESC lIMIT ${limit} OFFSET ${offset}`;
    // console.log(sql)
    var result = await dbConnectionReplica.query(sql, [...sevalues]);
    //get all agent type
    const lisAgentType = await commonQueryCommon.getAllAgentType();
    // console.log(result)
    if (result.length > 0) {
      var result = result.map((res) => {
        var { typeId, walletBalance, mobile, commissionType, ...other } = res;
        // var type = 'not assigh'
        // switch(typeId) {
        //     case 1 :
        //         type = "Master Distributor"
        //     break
        //     case 2 :
        //         type = "Distributor"
        //     break
        //     case 3 :
        //         type = "Master Sub-Distributor"
        //     break
        //     case 4 :
        //         type = "Sub-Distributor"
        //     break
        //     case 5 :
        //         type = "Master Retailer"
        //     break
        //     case 6 :
        //         type = "Retailer"
        //     break
        // }
        // other.userType = type
        other.commissionType =
          commissionType == 0
            ? "Not Assigned"
            : commissionType == 1
            ? "Pre-Paid"
            : "Post-Paid";
        other.userType = lisAgentType[typeId - 1].agent_type_name;
        other.walletBalance = walletBalance ? walletBalance : 0;
        other.mobile = mobile ? mobile : "number not added";
        return other;
      });
    }
    return result;
  };

    downloadAgentListQuery = async (details, limit, offset) => {
    const { seColumnSet, sevalues } = this.multipleAndColumnSet(
      details,
      this.tableName1,
      this.tableName3
    );
    // console.log(seColumnSet,sevalues)
    var sql = `SELECT 
${this.tableName1}.username AS User_ID, 
${this.tableName1}.full_name AS name,
${this.tableName1}.usertype_id AS userType,
${this.tableName1}.region_name AS region,
${this.tableName1}.province_Name AS province ,
${this.tableName1}.mobile,
${this.tableName1}.comm_type AS commissionType,
${this.tableName2}.ex_wallet AS walletBalance,
CAST(${this.tableName1}.created_on AS CHAR(20)) AS registerDate,
IF(${this.tableName1}.user_status = 1, 'Active', 'Inactive') AS Status
FROM ${this.tableName1} LEFT JOIN ${this.tableName2} 
ON ${this.tableName1}.userid = ${this.tableName2}.userid
LEFT JOIN ${this.tableName3} 
ON ${this.tableName1}.userid = ${this.tableName3}.userid AND ${this.tableName3}.status = 1
WHERE ${seColumnSet} GROUP BY ${this.tableName1}.userid
ORDER BY ${this.tableName1}.userid DESC lIMIT ${limit} OFFSET ${offset}`;
    // console.log(sql)
    var result = await dbConnectionReplica.query(sql, [...sevalues]);
    //get all agent type
    const lisAgentType = await commonQueryCommon.getAllAgentType();
    // console.log(result)
    if (result.length > 0) {
      var result = result.map((res) => {
          var { userType, walletBalance, mobile, commissionType,registerDate,status, ...other } = res;
          other.userType = lisAgentType[userType - 1].agent_type_name;
          other.mobile = mobile ? mobile : "number not added";
        other.commissionType = commissionType == 0 ? "Not Assigned" : commissionType == 1 ? "Pre-Paid" : "Post-Paid";
        other.walletBalance = walletBalance ? walletBalance : 0;
        other.registerDate = registerDate ? registerDate : "N/A";

        return other;
      });
    }
    return result;
  };


  getAllContacts = async (user_uuid) => {
    let sqlQuery1 = `SELECT mobile, operator_name, agent_contact_id FROM ${this.tableName3} where mobile_type = 0 AND status = 1 AND randomMobile = 0 AND user_uuid = '${user_uuid}' order by agent_contact_id desc ;`;
    let sqlQuery2 = `SELECT mobile, operator_name, agent_contact_id FROM ${this.tableName3} where mobile_type = 0 AND status = 1 AND randomMobile = 1 AND user_uuid = '${user_uuid}' order by agent_contact_id desc ;`;
    let sqlQuery = sqlQuery1 + sqlQuery2;
    var multipleResult = await dbConnection.simpleQuery(sqlQuery);
    return { alternate: multipleResult[0], random: multipleResult[1] };
  };

  multipleAndColumnSet = (object, tableName1, tableName2) => {
    if (typeof object !== "object") {
      throw new Error("Invalid input");
    }

    let { region_ids, child_ids, ...other } = object;

    const keys = Object.keys(other);
    const sevalues = Object.values(other);

    var seColumnSet = keys.map((key) => {
      if (key == "start_date") return `? <=  date( ${tableName1}.created_on )`;
      if (key == "end_date") return `date( ${tableName1}.created_on ) <= ?`;
      if (key == "trans_date_time")
        return ` ? <=  date( ${tableName1}.trans_date_time )`;
      if (key == "start_trans_date_time")
        return ` ? <= date( ${tableName1}.trans_date_time )`;
      if (key == "end_trans_date_time")
        return `date( ${tableName1}.trans_date_time ) <= ?`;
      if (key == "registerDate") return `date( ${tableName1}.created_on ) = ?`;
      if (key == "get_upper_parent_ids") return `${tableName1}.usertype_id < ?`;
      if (key == "get_lower_parent_ids") return `${tableName1}.usertype_id > ?`;
      if (key == "NOT parent_id") return `NOT ${tableName1}.parent_id = ?`;
      if (key == "mobile") return `${tableName2}.mobile = ?`;
      if (key.includes("_uuid"))
        return `CAST(${tableName1}.${key} AS  CHAR(16)) = ?`;
      return `${tableName1}.${key} = ?`;
    });

    if (region_ids)
      seColumnSet.push(`${tableName1}.region_id IN ( ${region_ids} ) `);
    if (child_ids)
      seColumnSet.push(`${tableName1}.userid IN ( ${child_ids} ) `);

    seColumnSet = seColumnSet.join(" AND ");

    return {
      seColumnSet,
      sevalues,
    };
  };
}

module.exports = new agentModule();
