const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

const dotenv = require('dotenv');
dotenv.config()

class rollbackModule {

    // table name
    tableName1 = `er_login`
    tableName2 = `er_recharge`

    constructor(){
        // this.rollbackFix()
    }

    rollbackFix = async() =>{

        let sql = `Select trans_number from er_recharge where rollback_status = ?;`
        let result = await dbConnectionReplica.query(sql,[3]);
        let txnId 
        console.log(result.length)
        for (let i = 0; i < result.length; i++ ){
            txnId = result[i].trans_number

            sql = `Select count(1) from er_wallet_transaction where trans_number = ?;`
            let resultCount = await dbConnectionReplica.query(sql,[txnId]);

            if(resultCount[0]['count(1)'] == 1){
                console.log(`Id: ${txnId}, count: ${resultCount[0]['count(1)']}`)
                txnId
            }
        }

        console.log('Rollback check Done')
    }

    rollbackTransactionCount = async (parma) =>{ 
        const {sevalues,seColumnSet} = await this.queryGen(parma);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count, SUM(${this.tableName2}.amount) AS totalRechargeAmount, SUM(${this.tableName2}.deduct_amt) AS totalDeductedAmt
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName2}.rollback_confirm_on DESC`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);

        return result
    }

    rollbackTransaction = async (parma, limit, offset) =>{ 
        const {sevalues,seColumnSet} = await this.queryGen(parma);

        const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tableName1}.username AS userid, ${this.tableName1}.full_name AS agnetName, ${this.tableName1}.mobile AS contactNumber,
                            ${this.tableName2}.trans_number AS txnNumber, ${this.tableName2}.operator_name AS operatorName, ${this.tableName2}.operator_transid AS operatorTxn, ${this.tableName2}.mobile_number AS rechangeMobile, ${this.tableName2}.amount AS recargeAmt, ${this.tableName2}.deduct_amt AS deductedAmt,${this.tableName2}.rollback_amount AS rollback_amount,${this.tableName2}.rollback_status AS status, CAST(${this.tableName2}.rollback_confirm_on AS CHAR(20)) AS dateTime
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName2}.rollback_confirm_on DESC LIMIT ${limit} OFFSET ${offset}`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);

        return result
    }

    rollbackTransactionDetails = async (parma, limit, offset) =>{ 
        const {sevalues,seColumnSet} = await this.queryGen(parma);

        const sql = `SELECT ${this.tableName1}.username AS userid, ${this.tableName1}.full_name AS agnetName, ${this.tableName1}.mobile AS contactNumber,
                            ${this.tableName2}.trans_number AS txnNumber, ${this.tableName2}.operator_name AS operatorName, ${this.tableName2}.operator_transid AS operatorTxn, ${this.tableName2}.mobile_number AS rechangeMobile, ${this.tableName2}.amount AS recargeAmt, ${this.tableName2}.deduct_amt AS deductedAmt, CAST(${this.tableName2}.rollback_request_on AS CHAR(20)) AS dateTime, api_type as apiType
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName2}.id DESC LIMIT ${limit} OFFSET ${offset}`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);

        return result
    }

    rollbackTxnDetails = async (parma) =>{ 
        const {sevalues,seColumnSet} = await this.queryGen(parma);

        const sql = `SELECT ${this.tableName1}.userid AS userid, ${this.tableName1}.full_name AS agnetName,
                            ${this.tableName2}.mobile_number AS rechangeMobile, ${this.tableName2}.amount AS recargeAmt
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName2}.id DESC`

        const result = await dbConnectionReplica.query(sql,[...sevalues]);

        return result
    }

    pendingRollbackCount = async (parma) => {
        const {status,...other} = parma
        const {sevalues,seColumnSet} = await this.queryGen(other);

        let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ COUNT(1) AS count, SUM(${this.tableName2}.amount) AS totalRechargeAmt, SUM(${this.tableName2}.deduct_amt) AS totalDeductedAmt, SUM(${this.tableName2}.rollback_amount) AS totalRollbackAmt
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid 
                    WHERE ${seColumnSet} AND rollback_status IN ( ${status} ) ORDER BY ${this.tableName2}.rollback_confirm_on DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);

        return result
    }

    pendingRollback = async (parma, limit, offset) => {
        const {status,...other} = parma
        const {sevalues,seColumnSet} = await this.queryGen(other);

        let sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${this.tableName1}.username AS userid, ${this.tableName1}.full_name AS agnetName, ${this.tableName1}.mobile AS contactNumber,
                            ${this.tableName2}.trans_number AS txnNumber, ${this.tableName2}.operator_name AS operatorName, ${this.tableName2}.mobile_number AS rechangeMobile, ${this.tableName2}.amount AS recargeAmt, ${this.tableName2}.deduct_amt AS deductedAmt, CAST(${this.tableName2}.rollback_confirm_on AS CHAR(20)) AS dateTime, IF(${this.tableName2}.rollback_status = 1, 'Pending', IF(${this.tableName2}.rollback_status = 2, 'Accept', IF(${this.tableName2}.rollback_status = 3, 'Complete', 'Reject' ) ) ) AS status, ${this.tableName2}.rollback_amount AS rollbackAmt, ${this.tableName2}.comment AS comment
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid 
                    WHERE ${seColumnSet} AND rollback_status IN ( ${status} ) ORDER BY ${this.tableName2}.rollback_confirm_on DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);

        return result
    }

    agentRollback = async (param) => {
        const {sevalues,seColumnSet} = await this.queryGen(param);
        const sql = `SELECT CAST(${this.tableName1}.user_uuid AS CHAR(16))AS user_uuid, ${this.tableName1}.userid,
                            ${this.tableName2}.amount AS rechargeAmount, ${this.tableName2}.operator_id AS operator_id, ${this.tableName2}.mobile_number as rechargeNumber, ${this.tableName2}.api_type as mnoId
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName2}.created_on DESC LIMIT 1 OFFSET 0`

        const result = await dbConnection.query(sql,[...sevalues]);

        return result
    }

    queryGen = async (object) =>{

        let { region_ids, child_ids, between, timeDifferent, ...other } = object

        const keys = Object.keys(other);
        const sevalues = Object.values(other)

            // optional search variables
        var seColumnSet = keys.map(key => {
            if (key == 'Active') return `${this.tableName1}.Active = ?`
            if (key == 'userid') return `${this.tableName1}.username = ?`
            if (key == 'userName') return `${this.tableName1}.full_name = ?`
            if (key == 'start_date') return `? <=  date(${this.tableName2}.created_on)`
            if (key == 'end_date') return `date(${this.tableName2}.created_on) <= ?`
            if(key.includes('_uuid')) return `CAST(${this.tableName2}.${key} AS  CHAR(16)) = ?`
            return `${this.tableName2}.${key} = ?`
        })

        if( region_ids )  seColumnSet.push( `${this.tableName1}.region_id IN ( ${region_ids} ) ` )
        if( child_ids ) seColumnSet.push( `userid IN ( ${child_ids} ) ` )
        if( timeDifferent ) {
            seColumnSet.push(`TIMESTAMPDIFF(MINUTE, '${this.tableName1}.${timeDifferent.key}', '${timeDifferent.value}' ) <= ${timeDifferent.diff}`)
        }
        if( between ) seColumnSet.push(` date( ${this.tableName2}.${between.key}) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
            
        seColumnSet = seColumnSet.join(' AND ');

        return {sevalues,seColumnSet}
    }

}

module.exports = new rollbackModule();