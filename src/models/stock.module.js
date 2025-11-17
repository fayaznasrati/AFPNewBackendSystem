const { tableName4 } = require('../controllers/emoney.controller');
const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

class stockModule {
    //table name
    tableName1 = 'er_login'
    tableName2 = 'er_wallet_transfer_individual'
    tableName3 = 'er_wallet_purchase'
    tableName4 = 'er_wallet'
    tablename5 = `er_prepaid_commission`

    getUserWithBalanceCount = async (details) =>{
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName4)
        const sql = `SELECT COUNT(1) AS count
                            FROM ${this.tableName1} LEFT JOIN ${this.tableName4}
                            ON CAST(${this.tableName1}.user_uuid AS  CHAR(16)) = CAST( ${this.tableName4}.user_uuid AS  CHAR(16))
                            LEFT JOIN ${this.tablename5} 
                            ON ${this.tableName1}.userid = ${this.tablename5}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName1}.userid DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    //function to get list of user
    getUserWithBalance = async (details,limit,offset) =>{
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName4)
        const sql = `SELECT ${this.tableName1}.full_name AS name, ${this.tableName1}.username AS userid, CAST(${this.tableName1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName1}.mobile,
                            ${this.tableName4}.ex_wallet AS balance,
                            ${this.tablename5}.commission_value
                            FROM ${this.tableName1} LEFT JOIN ${this.tableName4}
                            ON CAST( ${this.tableName1}.user_uuid AS  CHAR(16)) = CAST(${this.tableName4}.user_uuid AS  CHAR(16))
                            LEFT JOIN ${this.tablename5} 
                            ON ${this.tableName1}.userid = ${this.tablename5}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName1}.userid DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    //function for sql query to get agent edtail from different table
    adminStocksDetialsCount = async(details) => {

        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName2)
        let sql = `SELECT COUNT(1) AS count, `
                if(!details.child_ids) sql = sql + ` SUM(${this.tableName2}.transfer_amt) AS transactionAmount, SUM(${this.tableName2}.transfer_comm)AS commissionAmount ` 
                else sql = sql + ` SUM( ${this.tableName2}.transfer_amt ) + SUM(${this.tableName2}.transfer_comm) AS transactionAmount `
                sql = sql + ` FROM ${this.tableName2} LEFT JOIN ${this.tableName1}
                            on ${this.tableName2}.reciever_id = ${this.tableName1}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName2}.id DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    adminStocksDetials = async(details, limit, offset) => {

        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName2)
        let sql = `SELECT ${this.tableName1}.full_name AS name, ${this.tableName1}.username AS UserId, CAST(${this.tableName1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName1}.mobile, ${this.tableName1}.province_Name AS provinceName, ${this.tableName1}.region_name AS regionName, 
                        IF(${this.tableName1}.usertype_id = 1,'Master Distributor',IF(${this.tableName1}.usertype_id = 2,'Distributor',IF(${this.tableName1}.usertype_id = 3,'Reseller','Retailer'))) as agentType,    
                        ${this.tableName2}.trans_number AS transactionId, `
        if(!details.child_ids) sql = sql + ` ${this.tableName2}.transfer_amt AS transactionAmount, ${this.tableName2}.transfer_comm AS commissionAmount, ` 
        else sql = sql + ` ${this.tableName2}.transfer_amt + ${this.tableName2}.transfer_comm AS transactionAmount, `
                            
        sql = sql +         ` CAST(${this.tableName2}.created_on AS CHAR(20)) AS transactionDateTime
                            FROM ${this.tableName2} LEFT JOIN ${this.tableName1}
                            on ${this.tableName2}.reciever_id = ${this.tableName1}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName2}.id DESC limit ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

        DownloadAdminStocksDetials = async(details, limit, offset) => {

        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName2)
        let sql = `SELECT ${this.tableName1}.username AS User_Id, ${this.tableName1}.full_name AS Agent_Name,  
         IF(${this.tableName1}.usertype_id = 1,'Master Distributor',IF(${this.tableName1}.usertype_id = 2,'Distributor',IF(${this.tableName1}.usertype_id = 3,'Reseller','Retailer'))) as User_type, 
         ${this.tableName1}.province_Name AS province, ${this.tableName1}.region_name AS region, ${this.tableName2}.trans_number AS Transaction_Id, `
        if(!details.child_ids) sql = sql + ` ${this.tableName2}.transfer_amt AS Transfar_Amount, ${this.tableName2}.transfer_comm AS commission, ` 
        else sql = sql + ` ${this.tableName2}.transfer_amt + ${this.tableName2}.transfer_comm AS Transfar_Amount, `
                            
        sql = sql +         ` CAST(${this.tableName2}.created_on AS CHAR(20)) AS transactionDateTime
                            FROM ${this.tableName2} LEFT JOIN ${this.tableName1}
                            on ${this.tableName2}.reciever_id = ${this.tableName1}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName2}.id DESC limit ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    stockRecievedReportCount = async (details) =>{
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName2)
        const sql = `SELECT COUNT(1) AS count, SUM(${this.tableName2}.transfer_amt) AS transactionAmount, SUM(${this.tableName2}.transfer_comm) AS commissionAmount
                            FROM ${this.tableName2} LEFT JOIN ${this.tableName1}
                            on ${this.tableName2}.sender_id = ${this.tableName1}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName2}.id DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    stockRecievedReport = async (details, limit, offset) =>{
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName2)
        const sql = `SELECT ${this.tableName1}.full_name AS name, ${this.tableName1}.username AS UserId, CAST(${this.tableName1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName1}.mobile, 
                            ${this.tableName2}.trans_number AS transactionId, ${this.tableName2}.transfer_amt AS transactionAmount, ${this.tableName2}.transfer_comm AS commissionAmount, CAST(${this.tableName2}.created_on AS CHAR(20)) AS transactionDateTime
                            FROM ${this.tableName2} LEFT JOIN ${this.tableName1}
                            on ${this.tableName2}.sender_id = ${this.tableName1}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName2}.id DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    agentStocksDetialsCount = async(details) => {

        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName2)
        const sql = `SELECT COUNT(1) AS count, SUM(${this.tableName2}.transfer_amt) AS totalAmount, SUM(${this.tableName2}.transfer_comm) AS totalCommission
                            FROM ${this.tableName2} JOIN ${this.tableName1}
                            on ${this.tableName2}.sender_id = ${this.tableName1}.userid 
                            JOIN ${this.tableName1} AS parentId
                            on ${this.tableName2}.reciever_id = parentId.userid 
                            WHERE ${seColumnSet} 
                            ORDER BY ${this.tableName2}.id DESC`
        // console.log(sql,sevalues)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    agentStocksDetials = async(details, limit, offset) => {

        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName2)
        const sql = `SELECT ${this.tableName1}.full_name AS parentName, ${this.tableName1}.username AS parentId, CAST(${this.tableName1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName1}.province_Name AS provinceName, ${this.tableName1}.region_name AS regionName, 
                            IF(${this.tableName1}.usertype_id = 1,'Master Distributor',IF(${this.tableName1}.usertype_id = 2,'Distributor',IF(${this.tableName1}.usertype_id = 3,'Reseller','Retailer'))) as agentType, ${this.tableName1}.mobile,
                            ${this.tableName2}.trans_number AS transactionId, ${this.tableName2}.transfer_amt AS transactionAmount, ${this.tableName2}.transfer_comm AS commissionAmount, CAST(${this.tableName2}.created_on AS CHAR(20)) AS transactionDateTime,
                            parentId.full_name as name, parentId.username as UserId, parentId.mobile as parentMobile,
                            IF(parentId.usertype_id = 1,'Master Distributor',IF(parentId.usertype_id = 2,'Distributor',IF(parentId.usertype_id = 3,'Reseller','Retailer'))) as parentAgentType
                            FROM ${this.tableName2} JOIN ${this.tableName1}
                            on ${this.tableName2}.sender_id = ${this.tableName1}.userid 
                            JOIN ${this.tableName1} AS parentId
                            on ${this.tableName2}.reciever_id = parentId.userid 
                            WHERE ${seColumnSet} 
                            ORDER BY ${this.tableName2}.id DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql,sevalues)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

      downloadAgentStockTransferQuery = async(details, limit, offset) => {

        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName2)
        const sql = `SELECT 
${this.tableName1}.full_name AS Sender_Name,
${this.tableName1}.username AS Sender_Id, 
${this.tableName2}.transfer_amt AS Transfar_Amount,
CAST(${this.tableName2}.created_on AS CHAR(20)) AS transactionDateTime,
parentId.full_name as Reciever_Name, 
parentId.username as Reciever_Id
FROM ${this.tableName2} JOIN ${this.tableName1}
on ${this.tableName2}.sender_id = ${this.tableName1}.userid 
JOIN ${this.tableName1} AS parentId
on ${this.tableName2}.reciever_id = parentId.userid 
WHERE ${seColumnSet} 
ORDER BY ${this.tableName2}.id DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql,sevalues)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    getPendingRequestCount = async (details) => {
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName3)
        const sql = `SELECT  COUNT(1) as count, SUM(${this.tableName3}.request_amt) AS totalAmount
                             FROM ${this.tableName3} LEFT JOIN ${this.tableName1}
                             ON ${this.tableName3}.userid = ${this.tableName1}.userid
                             WHERE ${this.tableName3}.status = 0 AND ${seColumnSet}
                             ORDER BY ${this.tableName3}.id DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    getPendingRequest = async (details) => {
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName3)
        const sql = `SELECT  ${this.tableName1}.full_name AS name, ${this.tableName1}.username AS userid, ${this.tableName1}.mobile,
                             CAST(${this.tableName3}.created_on AS CHAR(20)) AS requestDate, ${this.tableName3}.payment_mode, ${this.tableName3}.request_amt AS amount, ${this.tableName3}.rcpt_url AS rcptUrl, ${this.tableName3}.trans_number AS transferNumber
                             FROM ${this.tableName3} LEFT JOIN ${this.tableName1}
                             ON ${this.tableName3}.userid = ${this.tableName1}.userid
                             WHERE ${this.tableName3}.status = 0 AND ${seColumnSet}
                             ORDER BY ${this.tableName3}.id DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    stockTransferReportCount = async (details ) => {
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName3)
        const sql = `SELECT COUNT(1) As count, SUM(${this.tableName3}.request_amt) AS totalAmount
                            FROM ${this.tableName3} LEFT JOIN ${this.tableName1}
                            ON ${this.tableName3}.userid = ${this.tableName1}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName3}.id DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    stockTransferReport = async (details, limit, offset) => {
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName3)
        const sql = `SELECT ${this.tableName1}.full_name AS name, ${this.tableName1}.username AS userId, ${this.tableName1}.usertype_id, ${this.tableName1}.mobile, 
                            ${this.tableName3}.payment_mode, ${this.tableName3}.request_amt AS amount, ${this.tableName3}.status, ${this.tableName3}.comment, CAST(${this.tableName3}.created_on AS CHAR(20)) AS requestedOn, ${this.tableName3}.confirmed_on AS ConfirmOn, ${this.tableName3}.rcpt_url as rcptUrl
                            FROM ${this.tableName3} LEFT JOIN ${this.tableName1}
                            ON ${this.tableName3}.userid = ${this.tableName1}.userid
                            WHERE ${seColumnSet}
                            ORDER BY ${this.tableName3}.id DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    getAgentUuid = async (refNumber) =>{
        const sql = `SELECT ${this.tableName1}.full_name AS name, ${this.tableName1}.username AS userid, CAST(${this.tableName1}.user_uuid AS CHAR(16)) AS user_uuid,
                            ${this.tableName3}.request_amt
                            FROM ${this.tableName3} JOIN ${this.tableName1}
                            ON ${this.tableName3}.userid = ${this.tableName1}.userid
                            WHERE ${this.tableName3}.trans_number = ${refNumber} AND ${this.tableName3}.status = 0
                            LIMIT  1 OFFSET  0`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql);
        return result
    }

    topStockRequestReportCount = async(details) =>{
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName3)
        const sql = `SELECT COUNT(1) AS count
                    FROM ${this.tableName1} JOIN ${this.tableName3} ON ${this.tableName1}.userid = ${this.tableName3}.userid
                    WHERE ${seColumnSet} GROUP BY ${this.tableName3}.userid`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql, [...sevalues]);
        // console.log(result);
        return result
    }

    topStockRequestReport = async(details, limit, offset) =>{
        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName1,this.tableName3)
        const sql = `SELECT ${this.tableName1}.username AS userId, ${this.tableName1}.full_name AS fullName, ${this.tableName1}.emailid AS emailId, ${this.tableName1}.mobile AS contact,
                            SUM( ${this.tableName3}.request_amt ) AS amount
                    FROM ${this.tableName1} JOIN ${this.tableName3} ON ${this.tableName1}.userid = ${this.tableName3}.userid
                    WHERE ${seColumnSet} GROUP BY ${this.tableName3}.userid ORDER BY amount DESC limit ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql, [...sevalues]);
        // console.log(result);
        return result
    }

    multipleAndColumnSet = (object,tableName1,tableName2) => {
        if (typeof object !== 'object') {
            throw new Error('Invalid input');
        }

        let { region_ids, child_ids, between, timeDifferent, ...other } = object

        const keys = Object.keys(other);
        const sevalues = Object.values(other)

        var seColumnSet = keys.map(key => {
            if (key == 'start_date') return ` ? <= date( ${tableName2}.created_on)`
            if (key == 'end_date') return `date( ${tableName2}.created_on) <= ?`
            if(key == 'sender_id') return `${tableName2}.sender_id = ?`
            if(key == 'reciever_id') return `${tableName2}.reciever_id = ?`
            if(key == 'sender_username') return `${tableName2}.sender_username = ?`
            if(key == 'reciever_username') return `${tableName2}.reciever_username = ?`
            if(key == 'type') return `${tableName2}.type = ?`
            if(key == 'rollback') return `${tableName2}.rollback = ?`
            if(key == 'notType') return `${tableName2}.type != ?`
            if(key == 'status') return `${tableName2}.status = ?`
            if(key == 'transfer_amt') return `${tableName2}.transfer_amt = ?`
            if (key == 'start_reg_date') return ` ? <= date( ${tableName1}.created_on)`
            if (key == 'end_reg_date') return `date( ${tableName1}.created_on) <= ?`
            if (key == 'NOT sender_id') return `NOT ${tableName2}.sender_id = ?`
            if(key.includes('_uuid')) return `CAST(${tableName1}.${key} AS  CHAR(16)) = ?`
            return `${tableName1}.${key} = ?`
        })
        
        if( region_ids )  seColumnSet.push( `${tableName1}.region_id IN ( ${region_ids} ) ` )
        if( child_ids ) seColumnSet.push( `${tableName1}.userid IN ( ${child_ids} ) ` )
        // if( timeDifferent ) {
        //     seColumnSet.push(`TIMESTAMPDIFF(MINUTE, '${timeDifferent.key}', '${timeDifferent.value}' ) <= ${timeDifferent.diff}`)
        // }
        // if( between ) seColumnSet.push(` CAST( ${between.key} as DATE) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
            
        seColumnSet = seColumnSet.join(' AND ');

        return {
            seColumnSet,
            sevalues
        }
    }
}


module.exports = new stockModule