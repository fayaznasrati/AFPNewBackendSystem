const { query } = require('express');
const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

const dotenv = require('dotenv');
dotenv.config()

class walletModel {
    tablename1 = `er_login`;
    tablename2 = `er_wallet_transaction`;
    tablename3 = `er_wallet`;
    tablename4 = `er_fund_reverse`;
    tablename5 = `er_wallet_transfer_individual`;
    tablename6 = `er_prepaid_commission`

    constructor () {
        // this.creditBalanceToAccount(4,100)
        // this.debitBalanceToAccount(4,1000)
    }

    //sql query to get the transaction details
    adwnaceSearchModelCount = async(param) => {
        
        const {sevalues,seColumnSet} = await this.queryGen(param);

        // console.log(seColumnSet, sevalues)
        //file search query
        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count, SUM(${this.tablename2}.amount) AS totalAmount
        FROM ${this.tablename2} JOIN ${this.tablename1} ON ${this.tablename2}.userid = ${this.tablename1}.userid 
        WHERE ${seColumnSet} ORDER BY ${this.tablename2}.trans_date_time DESC`
            // console.log("QUERY " + sql)
        const result = await dbConnectionReplica.query(sql, [...sevalues]);
        return result
    }
    
    adwnaceSearchModel = async(param, limit, offset) => {
        
        const {sevalues,seColumnSet} = await this.queryGen(param);

        // console.log(seColumnSet, sevalues)
        //file search query
        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.full_name, ${this.tablename1}.username, CAST(${this.tablename1}.user_uuid AS CHAR(16)) AS user_uuid,
        CAST(${this.tablename2}.wallet_txn_uuid AS CHAR(16)) AS wallet_txn_uuid,${this.tablename2}.trans_number,CAST(${this.tablename2}.trans_date_time AS CHAR(20)) AS trans_date_time,${this.tablename2}.amount,${this.tablename2}.trans_type,${this.tablename2}.trans_for AS narration,${this.tablename2}.balance_amount AS closingBalance
        FROM ${this.tablename2} JOIN ${this.tablename1} ON ${this.tablename2}.userid = ${this.tablename1}.userid
        WHERE ${seColumnSet} ORDER BY ${this.tablename2}.trans_date_time DESC LIMIT ${limit} OFFSET ${offset}`
            // console.log("QUERY " + sql)
        const result = await dbConnectionReplica.query(sql, [...sevalues]);
        return result
    }

    getAgentBalanceReportCount = async (param) => {

        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count ,SUM(${this.tablename3}.ex_wallet) AS totalBalance
                    FROM ${this.tablename1} LEFT JOIN ${this.tablename3}
                    ON ${this.tablename1}.userid = ${this.tablename3}.userid
                    WHERE ${seColumnSet} AND not ${this.tablename1}.userid = 1 ORDER BY ${this.tablename1}.full_name`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    getAgentBalanceReport = async (param, limit, offset) => {

        const {sevalues,seColumnSet} = await this.queryGen(param);
        console.log(sevalues,seColumnSet);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.username AS userid, ${this.tablename1}.full_name AS name, CAST(${this.tablename1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tablename1}.mobile,
                            ${this.tablename3}.ex_wallet AS balance,
                            ${this.tablename6}.commission_value
                    FROM ${this.tablename1} LEFT JOIN ${this.tablename3}
                    ON ${this.tablename1}.userid = ${this.tablename3}.userid
                    LEFT JOIN ${this.tablename6} 
                    ON ${this.tablename1}.userid = ${this.tablename6}.userid
                    WHERE ${seColumnSet} AND not ${this.tablename1}.userid = 1 ORDER BY ${this.tablename1}.full_name LIMIT ${limit} OFFSET ${offset}`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        console.log(result);
        return result
    }

    getAgentBalanceTotalReport = async (param, limit, offset) => {

        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.username AS userid, ${this.tablename1}.full_name AS name, CAST(${this.tablename1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tablename1}.mobile,
                            ${this.tablename3}.ex_wallet AS balance,
                            ${this.tablename6}.commission_value
                    FROM ${this.tablename1} LEFT JOIN ${this.tablename3}
                    ON ${this.tablename1}.userid = ${this.tablename3}.userid
                    LEFT JOIN ${this.tablename6} 
                    ON ${this.tablename1}.userid = ${this.tablename6}.userid
                    WHERE ${seColumnSet} AND not ${this.tablename1}.userid = 1 ORDER BY ${this.tablename1}.full_name`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    transactionReportCount = async (param) => {
        
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet);

        let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count, SUM(${this.tablename2}.amount) AS totalAmount`
            sql = sql +  ` FROM ${this.tablename1} JOIN ${this.tablename2}
                    ON ${this.tablename1}.userid = ${this.tablename2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tablename2}.wallet_txn_id DESC`
        // console.log(sql,sevalues);
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    transactionReport = async (param, limit, offset) => {
        
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet);

        let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.username AS userid, ${this.tablename1}.full_name AS name,
                            ${this.tablename2}.trans_number AS transactionId, CAST(${this.tablename2}.trans_date_time AS CHAR(18)) AS transactionDate, ${this.tablename2}.amount, ${this.tablename2}.trans_type AS type, ${this.tablename2}.balance_amount AS closingBalance, `
            sql = sql +  ` ${this.tablename2}.narration AS description `
            sql = sql +  ` FROM ${this.tablename1} JOIN ${this.tablename2}
                    ON ${this.tablename1}.userid = ${this.tablename2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tablename2}.wallet_txn_id DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql,sevalues);
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

        transactionReportpdf = async (param, limit, offset) => {
        
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet);

        let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.username AS User_ID,
                             CAST(${this.tablename2}.trans_date_time AS CHAR(18)) AS Transaction_Date, ${this.tablename2}.amount, ${this.tablename2}.balance_amount AS closing_Balance, ${this.tablename2}.trans_type AS type, `
            sql = sql +  ` ${this.tablename2}.narration AS Description `
            sql = sql +  ` FROM ${this.tablename1} JOIN ${this.tablename2}
                    ON ${this.tablename1}.userid = ${this.tablename2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tablename2}.wallet_txn_id DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql,sevalues);
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    getAgentAcountBalanceForRollbackCount = async(param) => {
        const {sevalues,seColumnSet} = await this.queryGen(param);
        console.log(sevalues,seColumnSet);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count, SUM(${this.tablename3}.ex_wallet) AS totalBalance
                    FROM ${this.tablename1} LEFT JOIN ${this.tablename3}
                    ON ${this.tablename1}.userid = ${this.tablename3}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tablename1}.userid`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    getAgentAcountBalanceForRollback = async(param, limit, offset) => {
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.username AS userid, CAST(${this.tablename1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tablename1}.full_name AS name, ${this.tablename1}.mobile,
                            ${this.tablename3}.ex_wallet AS balance
                    FROM ${this.tablename1} LEFT JOIN ${this.tablename3}
                    ON ${this.tablename1}.userid = ${this.tablename3}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tablename1}.userid LIMIT ${limit} OFFSET ${offset}`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    getTransferRollbackDetailsCount = async(param) =>{
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count, SUM(${this.tablename4}.amount) totalAmount, SUM(${this.tablename4}.commission) totalCommission
                    FROM ${this.tablename1} JOIN ${this.tablename4}
                    ON ${this.tablename1}.userid = ${this.tablename4}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tablename4}.id DESC`
        // console.log(sql);
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    getTransferRollbackDetails = async(param, limit, offset) =>{
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.username AS userid, ${this.tablename1}.full_name AS name, ${this.tablename1}.usertype_id,
                            ${this.tablename4}.amount, ${this.tablename4}.commission, ${this.tablename4}.revert_by_username AS revertByUserId, ${this.tablename4}.revert_by_full_name AS revertByUserName, CAST(${this.tablename4}.trans_date_time AS CHAR(20)) AS Date, ${this.tablename4}.wallet_txn_id AS transactionId
                    FROM ${this.tablename1} JOIN ${this.tablename4}
                    ON ${this.tablename1}.userid = ${this.tablename4}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tablename4}.id DESC LIMIT ${limit} OFFSET ${offset}`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    getTransactionSummeryReportCount = async (param) => {
        const {start_date, end_date, ...other} = param
        // console.log(other);
        const agentSearch = await this.queryGen(other);
        let dateSearch
        if(start_date) dateSearch = await this.queryGen({start_date, end_date});
        // console.log(dateSearch,agentSearch,limit,offset);

        // 1)- get all the user list according to search paremeter and limit
        // 2)- use join operation to get all the transaction made by them in given date range

        let sql = `  SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count FROM ${this.tablename1} WHERE ${agentSearch.seColumnSet}`
        // console.log("SQL = "+ sql)

        let result = await dbConnectionReplica.query(sql,[...agentSearch.sevalues]);
        // console.log(result);
        return result
    }

    getTransactionSummeryReport = async (param, limit, offset) => {
        const {start_date, end_date, ...other} = param
        // console.log(other);
        const agentSearch = await this.queryGen(other);
        let dateSearch
        if(start_date) dateSearch = await this.queryGen({start_date, end_date});
        // console.log(dateSearch,agentSearch,limit,offset);

        // 1)- get all the user list according to search paremeter and limit
        // 2)- use join operation to get all the transaction made by them in given date range

        let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.username AS userid, ${this.tablename1}.full_name AS name,
                    IF( creditRecord.totalAmount, creditRecord.totalAmount, 0) AS creditAmount, IF(debitRecord.totalAmount, debitRecord.totalAmount, 0) AS debitAmount, IF(debitRecord.totalTransaction,debitRecord.totalTransaction,0) + IF(creditRecord.totalTransaction,creditRecord.totalTransaction,0) AS totalTransaction 
                    FROM (  SELECT ${this.tablename1}.username, ${this.tablename1}.full_name, ${this.tablename1}.userid, ${this.tablename1}.mobile, ${this.tablename1}.region_uuid,${this.tablename1}.country_uuid, ${this.tablename1}.province_uuid, ${this.tablename1}.district_uuid 
                            FROM ${this.tablename1} WHERE ${agentSearch.seColumnSet} ORDER BY ${this.tablename1}.userid DESC LIMIT ${limit} OFFSET ${offset} 
                        ) AS ${this.tablename1} LEFT JOIN (
                            SELECT SUM(${this.tablename2}.amount) AS totalAmount, count(1) AS totalTransaction, userid 
                            FROM ${this.tablename2} WHERE ${this.tablename2}.trans_type = 1 AND ${dateSearch.seColumnSet} GROUP BY ${this.tablename2}.userid 
                        ) AS creditRecord ON ${this.tablename1}.userid = creditRecord.userid 
                        LEFT JOIN (
                            SELECT SUM(${this.tablename2}.amount) AS totalAmount, count(1) AS totalTransaction, userid 
                            FROM ${this.tablename2} WHERE ${this.tablename2}.trans_type = 2 AND ${dateSearch.seColumnSet} GROUP BY ${this.tablename2}.userid 
                        ) AS debitRecord ON ${this.tablename1}.userid = debitRecord.userid`
        // console.log("SQL = "+ sql)

        let result = await dbConnectionReplica.query(sql,[...agentSearch.sevalues, ...dateSearch.sevalues, ...dateSearch.sevalues]);
        // console.log(result);
        return result
    }

    getStockTransferSummeryReportsCount = async (param) => {
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count ,SUM(${this.tablename5}.transfer_amt) AS totalAmount
                    FROM ${this.tablename1} JOIN ${this.tablename5}
                    ON ${this.tablename1}.userid = ${this.tablename5}.reciever_id
                    WHERE ${seColumnSet} ORDER BY ${this.tablename1}.full_name`
        
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    getStockTransferSummeryReports = async (param, limit, offset) => {
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tablename1}.username AS revieverId, ${this.tablename1}.full_name AS recieverName,
                            ${this.tablename5}.trans_number AS transactionId, ${this.tablename5}.transfer_amt AS amount, CAST(${this.tablename5}.created_on AS CHAR(20)) AS date
                    FROM ${this.tablename1} JOIN ${this.tablename5}
                    ON ${this.tablename1}.userid = ${this.tablename5}.reciever_id
                    WHERE ${seColumnSet} ORDER BY ${this.tablename1}.full_name LIMIT ${limit} OFFSET ${offset}`
        
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    creditBalanceToAccount = async (userid, amount=0, commission = 0) => {
        const query =[  `UPDATE ${this.tablename3} SET ex_wallet = ex_wallet + ${amount}, comm_wallet = comm_wallet + ${commission} WHERE userid = ${userid};`,
                        `SELECT userid, CAST(user_uuid AS CHAR(16)) AS user_uuid, ex_wallet, comm_wallet FROM ${this.tablename3} where userid = ${userid};`
                    ]
        let queryResponse = await dbConnection.simpleQuery(query.join(" "));
        return queryResponse
    }

    debitBalanceToAccount = async (userid, amount=0, commission = 0, minBalance = 0) => {
        const query =[  `UPDATE ${this.tablename3} SET ex_wallet = ex_wallet - ${amount}, comm_wallet = comm_wallet - ${commission} WHERE userid = ${userid} and ex_wallet >= ${minBalance};`,
                        `SELECT userid, CAST(user_uuid AS CHAR(16)) AS user_uuid, ex_wallet, comm_wallet FROM ${this.tablename3} where userid = ${userid};`
                    ]
        let queryResponse = await dbConnection.simpleQuery(query.join(" "));
        return queryResponse
    }

    queryGen = async (object) =>{
        console.log(object)

        let { region_ids, child_ids, between, timeDifferent, ...other } = object
       
        
        const keys = Object.keys(other);
        const sevalues = Object.values(other)

            // optional search variables
        var seColumnSet = keys.map(key => {
            if (key == 'Active') return `${this.tablename1}.Active = ?`
            if (key == 'parent_id') return `${this.tablename1}.parent_id = ?`
            if (key == 'user_uuid') return `CAST(${this.tablename1}.user_uuid AS  CHAR(16)) = ?`
            if (key == 'userid') return `${this.tablename1}.username = ?`
            if (key == 'userName') return `${this.tablename1}.full_name = ?`
            if (key == 'number') return `${this.tablename1}.mobile = ?`
            if (key == 'userType') return `${this.tablename1}.usertype_id = ?`
            if (key == 'transactionId') return `${this.tablename2}.trans_number = ?`
            if (key == 'start_date') return `? <= date(${this.tablename2}.trans_date_time)`
            if (key == 'end_date') return `? >= date(${this.tablename2}.trans_date_time)`
            if (key == 'transactionType') return `${this.tablename2}.trans_type = ?`
            if (key == 'region_uuid') return `CAST(${this.tablename1}.region_uuid AS  CHAR(16)) = ?`
            if (key == 'country_uuid') return `CAST(${this.tablename1}.country_uuid AS  CHAR(16)) = ?`
            if(key == 'province_uuid') return `CAST(${this.tablename1}.province_uuid AS  CHAR(16)) = ?`
            if (key == 'district_uuid') return `CAST(${this.tablename1}.district_uuid AS  CHAR(16)) = ?`
            if(key == 'transferAmount') return `${this.tablename5}.transfer_amt = ?`
            if(key == 'sender_id') return `${this.tablename5}.sender_id = ?`
            if (key == 'trans_start_date') return `? <= date(${this.tablename5}.created_on)`
            if (key == 'trans_end_date') return `? >= date(${this.tablename5}.created_on)`
            if (key == 'reverted_to') return `${this.tablename4}.reverted_to = ?`
        })
        
        if( region_ids )  seColumnSet.push( `${this.tablename1}.region_id IN ( ${region_ids} ) ` )

        // if( child_ids ) seColumnSet.push( `${this.tablename1}.userid IN ( ${child_ids} ) ` )
        if (child_ids) {
            let childArray = [];
        
            if (typeof child_ids === 'string') {
                childArray = child_ids.split(',').map(c => c.trim());
            } else if (Array.isArray(child_ids)) {
                childArray = child_ids;
            }
        
            if (childArray.length > 0) {
                const placeholders = childArray.map(() => '?').join(', ');
                seColumnSet.push(`${this.tablename1}.userid IN (${placeholders})`);
                sevalues.push(...childArray);
            }
        }

        if( timeDifferent ) {
            seColumnSet.push(`TIMESTAMPDIFF(MINUTE, '${timeDifferent.key}', '${timeDifferent.value}' ) <= ${timeDifferent.diff}`)
        }
        if( between ) seColumnSet.push(` date( ${between.key}) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
            
        // seColumnSet = seColumnSet.join(' AND ');
        seColumnSet = seColumnSet.length > 0 ? seColumnSet.join(' AND ') : '1=1';

        return {sevalues,seColumnSet}
    }
}

module.exports = new walletModel