const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

class dashboardModel {
    _tableName1 = 'er_login'
    _tableName2 = 'er_wallet'
    _tableName3 = 'er_wallet_transaction'
    _tableName4 = 'er_recharge'
    _tableName5 = 'er_master_operator'
    _tableName6 = 'er_commission_amount'
    _tableName7 = 'er_wallet_transfer_individual'
    _tableName8 = 'er_monthly_recharge'
    _tableName9 = 'er_daily_user_summery'
    _tableName10 = 'er_daily_topup_summery'

    allAgentBalance = async(userid) => { 
        const sql = `SELECT SUM(ex_wallet) AS totalBalance FROM ${this._tableName2} WHERE userid != ?`
        const result = await dbConnectionReplica.query(sql,[userid])
        return result
    }

    totalIncome = async(userid) =>{
        const sql = `SELECT SUM(commission_amount) AS totalIncome FROM ${this._tableName6} WHERE userid = ?`
        const result = await dbConnectionReplica.query(sql,[userid])
        return result
    }

    adminOperatorWiseTopUpCount = async( startDate, endDate) => {
        const sql = `SELECT ${this._tableName4}.totalCount, ${this._tableName5}.operator_name
                    FROM ${this._tableName5} LEFT JOIN (SELECT COUNT(amount) AS totalCount, operator_name, operator_id
                                                        FROM ${this._tableName4} 
                                                        WHERE ? <= date(created_on) AND date(created_on) <= ? AND status = 2 GROUP BY operator_id) AS ${this._tableName4}
                    ON ${this._tableName4}.operator_id = ${this._tableName5}.operator_id
                    ORDER BY ${this._tableName4}.operator_id`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        return result
    }

    adminOperatorWiseTopUpAmount = async (startDate, endDate) => {
        const sql = `SELECT ${this._tableName4}.totalAmount, ${this._tableName5}.operator_name
                    FROM ${this._tableName5} LEFT JOIN (SELECT SUM(amount) AS totalAmount, operator_name, operator_id
                                                        FROM ${this._tableName4} 
                                                        WHERE ? <= date(created_on ) AND date(created_on) <= ? AND status = 2 GROUP BY operator_id) AS ${this._tableName4}
                    ON ${this._tableName4}.operator_id = ${this._tableName5}.operator_id
                    ORDER BY ${this._tableName4}.operator_id`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        return result
    }

    operatorWiseCommissionAmount = async (startDate, endDate, userid) => {
        const sql = `SELECT ${this._tableName6}.totalAmount, ${this._tableName5}.operator_name
                    FROM ${this._tableName5} LEFT JOIN ( SELECT SUM(commission_amount) AS totalAmount, operator_id
                                                        FROM ${this._tableName6}
                                                        WHERE ? <= date(created_on) AND date(created_on) <= ? AND userid = ? GROUP BY operator_id ) AS ${this._tableName6}
                    ON ${this._tableName6}.operator_id = ${this._tableName5}.operator_id
                    ORDER BY ${this._tableName6}.operator_id`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate, userid])
        return result
    }

    operatorWiseCommissionCount = async (startDate, endDate, userid) => {
        const sql = `SELECT ${this._tableName6}.totalAmount, ${this._tableName5}.operator_name
                    FROM ${this._tableName5} LEFT JOIN ( SELECT COUNT(commission_amount) AS totalAmount, operator_id
                                                        FROM ${this._tableName6}
                                                        WHERE ? <= date(created_on) AND date(created_on) <= ? AND userid = ? AND commission_amount > 0 GROUP BY operator_id ) AS ${this._tableName6}
                    ON ${this._tableName6}.operator_id = ${this._tableName5}.operator_id
                    ORDER BY ${this._tableName6}.operator_id`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate, userid])
        return result
    }

    agentOperatorWiseTopUpCount = async( startDate, endDate, agentList) => {
        // const sql = `SELECT ${this._tableName4}.totalCount, ${this._tableName5}.operator_name
        //             FROM ${this._tableName5} LEFT JOIN (SELECT COUNT(amount) AS totalCount, operator_name, operator_id
        //                                                 FROM ${this._tableName4} 
        //                                                 WHERE ? <= CAST(created_on AS DATE) AND CAST(created_on AS DATE) <= ? AND status = 2 AND userid in ( ${agentList} ) GROUP BY operator_id) AS ${this._tableName4}
        //             ON ${this._tableName4}.operator_id = ${this._tableName5}.operator_id
        //             ORDER BY ${this._tableName4}.operator_id`
        // console.log(sql)
        const sql = `SELECT ${this._tableName5}.operator_name as operatorName, ${this._tableName6}.totalCount FROM 
                    ${this._tableName5} LEFT JOIN ( SELECT operator_id, count(1) AS totalCount FROM ${this._tableName6} 
                    WHERE ? <= date(created_on) AND date(created_on) <= ? AND userid = ${agentList}
                    GROUP BY operator_id ) as ${this._tableName6}  on ${this._tableName6}.operator_id = ${this._tableName5}.operator_id order by ${this._tableName5}.operator_id`
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        return result
    }

    agentOperatorWiseTopUpAmount = async (startDate, endDate, agentList) => {
        // const sql = `SELECT SUM(amount) AS totalAmount, operator_name, operator_id
        //             FROM ${this._tableName4} 
        //             WHERE ? <= CAST(created_on AS DATE) AND CAST(created_on AS DATE) <= ?  AND userid in (${agentList})  GROUP BY operator_id`

        const sql = `SELECT ${this._tableName4}.totalAmount, ${this._tableName5}.operator_name
                    FROM ${this._tableName5} LEFT JOIN (SELECT SUM(amount) AS totalAmount, operator_name, operator_id
                    FROM ${this._tableName4} 
                    WHERE ? <= date(created_on) AND date(created_on) <= ? AND status = 2 AND userid in (${agentList})  GROUP BY operator_id) AS ${this._tableName4}
                    ON ${this._tableName4}.operator_id = ${this._tableName5}.operator_id
                    ORDER BY ${this._tableName4}.operator_id`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        // console.log(result)
        return result
    }

    agentOperatorWiseCommissionAmount = async (startDate, endDate, agentList) => {
        // const sql = `SELECT ${this._tableName1}.full_name AS name, ${this._tableName8}.oper1, ${this._tableName8}.oper2, ${this._tableName8}.oper3, ${this._tableName8}.oper4, ${this._tableName8}.oper5, ${this._tableName8}.totalAmount
        //             FROM ${this._tableName1} LEFT JOIN ( SELECT userid, SUM(oper_1) AS oper1, SUM(oper_2) AS oper2, SUM(oper_3) AS oper3, SUM(oper_4) AS oper4, SUM(oper_5) AS oper5, SUM(oper_1) + SUM (oper_2) + SUM (oper_3) + SUM (oper_4) + SUM (oper_5) AS totalAmount
        //                                                 FROM ${this._tableName8} 
        //                                                 WHERE ? <= CAST(date AS DATE) AND CAST(date AS DATE) <= ? AND userid IN ( ${agentList} ) GROUP BY userid ) AS ${this._tableName8}
        //             ON ${this._tableName1}.userid = ${this._tableName8}.userid
        //             ORDER BY ${this._tableName8}.totalAmount DESC LIMIT 10`

        const sql = `  SELECT ${this._tableName5}.operator_name AS operatorName, ${this._tableName6}.totalAmount AS totalAmount
                    FROM ${this._tableName5} LEFT JOIN ( SELECT  SUM(commission_amount) AS totalAmount, operator_id FROM ${this._tableName6} 
                    WHERE ? <= date(created_on) AND date(created_on) <= ? AND userid = ${agentList}
                    GROUP BY operator_id ) AS ${this._tableName6} 
                    ON ${this._tableName6}.operator_id = ${this._tableName5}.operator_id
                    ORDER BY ${this._tableName5}.operator_id`
                    
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        // console.log(result)
        return result
    }

    topAgentSale = async (startDate, endDate, regionId) => {
        // const sql = `SELECT ${this._tableName1}.full_name AS agentName, ${this._tableName7}.totalAmount
        //             FROM ${this._tableName1} LEFT JOIN  ( SELECT SUM(transfer_amt) as totalAmount, sender_id AS userid
        //                                             FROM ${this._tableName7} 
        //                                             WHERE ? <= date(created_on) AND date(created_on) <= ?
        //                                             GROUP BY sender_id) AS ${this._tableName7} 
        //             ON ${this._tableName1}.userid = ${this._tableName7}.userid
        //             WHERE ${this._tableName1}.userid != 1 AND ${this._tableName1}.region_id in ( ${regionId} )
        //             ORDER BY ${this._tableName7}.totalAmount DESC LIMIT 10`

        let sql = `SELECT ${this._tableName1}.full_name AS agentName, ${this._tableName9}.totalAmount
                    FROM ${this._tableName1} LEFT JOIN  ( SELECT SUM(stock_txn_sum) as totalAmount, userid
                                                    FROM ${this._tableName9} 
                                                    WHERE ? <= date(created_on) AND date(created_on) <= ?
                                                    GROUP BY userid) AS ${this._tableName9} 
                    ON ${this._tableName1}.userid = ${this._tableName9}.userid
                    WHERE ${this._tableName1}.userid != 1 `
            sql = sql + ( regionId.length < 7 ? ` AND ${this._tableName1}.region_id in ( ${regionId} ) ` : ` ` )

            sql = sql + ` ORDER BY ${this._tableName9}.totalAmount DESC LIMIT 10`

        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        // console.log(result)
        return result
    }

    topAgentTopUp = async (startDate, endDate, regionId) => {
        // const sql = `SELECT ${this._tableName1}.full_name AS agentName, ${this._tableName4}.totalAmount
        //             FROM ${this._tableName1} LEFT JOIN  ( SELECT SUM(amount) AS totalAmount, userid
        //                                             FROM ${this._tableName4} 
        //                                             WHERE ? <= date(created_on) AND date(created_on) <= ? AND status = 2 
        //                                             GROUP BY userid) AS ${this._tableName4} 
        //             ON ${this._tableName1}.userid = ${this._tableName4}.userid
        //             WHERE ${this._tableName1}.userid != 1 AND ${this._tableName1}.region_id in ( ${regionId} )
        //             ORDER BY ${this._tableName4}.totalAmount DESC LIMIT 10`

        let sql = `SELECT ${this._tableName1}.full_name AS agentName, ${this._tableName9}.totalAmount
                    FROM ${this._tableName1} LEFT JOIN  ( SELECT SUM(tot_rech_amt) AS totalAmount, userid
                                                    FROM ${this._tableName9} 
                                                    WHERE ? <= date(created_on) AND date(created_on) <= ?
                                                    GROUP BY userid) AS ${this._tableName9} 
                    ON ${this._tableName1}.userid = ${this._tableName9}.userid
                    WHERE ${this._tableName1}.userid != 1 `
            sql = sql + ( regionId.length < 7 ? ` AND ${this._tableName1}.region_id in ( ${regionId} ) ` : ` `)
            sql = sql + ` ORDER BY ${this._tableName9}.totalAmount DESC LIMIT 10`

        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        return result
    }

    operatorWiseSalesUserid = async (startDate, endDate, userid) => {
        const sql = `SELECT ${this._tableName4}.totalAmount, ${this._tableName5}.operator_name
                    FROM ${this._tableName5} LEFT JOIN (SELECT SUM(amount) AS totalAmount, operator_name, operator_id
                                                        FROM ${this._tableName4} 
                                                        WHERE ? <= date(created_on) AND date(created_on) <= ? AND userid = ? GROUP BY operator_id) AS ${this._tableName4}
                    ON ${this._tableName4}.operator_id = ${this._tableName5}.operator_id
                    ORDER BY ${this._tableName4}.operator_id`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate, userid])
        return result
    }

    // agentOperatorWiseTopUpCount = async( startDate, endDate, userid) => {
    //     const sql = `SELECT ${this._tableName4}.totalCount, ${this._tableName5}.operator_name
    //                 FROM ${this._tableName5} LEFT JOIN (SELECT COUNT(amount) AS totalCount, operator_name, operator_id
    //                                                     FROM ${this._tableName4} 
    //                                                     WHERE ? <= CAST(created_on AS DATE) AND CAST(created_on AS DATE) <= ? AND status = 2 AND userid = ? GROUP BY operator_id) AS ${this._tableName4}
    //                 ON ${this._tableName4}.operator_id = ${this._tableName5}.operator_id
    //                 ORDER BY ${this._tableName4}.operator_id`
    //     // console.log(sql)
    //     const result = await dbConnectionReplica.query(sql,[startDate, endDate, userid])
    //     return result
    // }

    topAgentSaleParentid = async (startDate, endDate, agentList) => {
        // const sql = `SELECT ${this._tableName1}.full_name AS agentName, ${this._tableName7}.totalAmount
        //             FROM ${this._tableName1} LEFT JOIN  ( SELECT SUM(transfer_amt) as totalAmount, sender_id AS userid
        //                                             FROM ${this._tableName7} 
        //                                             WHERE ? <= date(created_on) AND date(created_on) <= ? AND sender_id IN ( ${agentList} ) 
        //                                             GROUP BY sender_id) AS ${this._tableName7} 
        //             ON ${this._tableName1}.userid = ${this._tableName7}.userid
        //             WHERE ${this._tableName1}.userid in ( ${agentList} )
        //             ORDER BY ${this._tableName7}.totalAmount DESC LIMIT 10`

        const sql = `SELECT ${this._tableName1}.full_name AS agentName, ${this._tableName9}.totalAmount
        FROM ${this._tableName1} LEFT JOIN  ( SELECT SUM(stock_txn_sum) as totalAmount, userid
                                        FROM ${this._tableName9} 
                                        WHERE ? <= date(created_on) AND date(created_on) <= ? AND userid IN ( ${agentList} ) 
                                        GROUP BY userid) AS ${this._tableName9} 
        ON ${this._tableName1}.userid = ${this._tableName9}.userid
        WHERE ${this._tableName1}.userid in ( ${agentList} )
        ORDER BY ${this._tableName9}.totalAmount DESC LIMIT 10`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        // console.log(result)
        return result
    }

    topAgentTopUpParentid = async (startDate, endDate, agentList) => {
        // const sql = `SELECT ${this._tableName1}.full_name AS agentName, ${this._tableName4}.totalAmount
        //             FROM ${this._tableName1} LEFT JOIN  ( SELECT SUM(amount) AS totalAmount, userid
        //                                             FROM ${this._tableName4} 
        //                                             WHERE ? <= date(created_on) AND date(created_on) <= ? AND status = 2 AND userid IN ( ${agentList} )
        //                                             GROUP BY userid) AS ${this._tableName4} 
        //             ON ${this._tableName1}.userid = ${this._tableName4}.userid
        //             WHERE ${this._tableName1}.userid IN ( ${agentList} )
        //             ORDER BY ${this._tableName4}.totalAmount DESC LIMIT 10`

        const sql = `SELECT ${this._tableName1}.full_name AS agentName, ${this._tableName9}.totalAmount
                    FROM ${this._tableName1} LEFT JOIN  ( SELECT SUM(tot_rech_amt) AS totalAmount, userid
                                                    FROM ${this._tableName9} 
                                                    WHERE ? <= date(created_on) AND date(created_on) <= ? AND userid IN ( ${agentList} )
                                                    GROUP BY userid) AS ${this._tableName9} 
                    ON ${this._tableName1}.userid = ${this._tableName9}.userid
                    WHERE ${this._tableName1}.userid IN ( ${agentList} )
                    ORDER BY ${this._tableName9}.totalAmount DESC LIMIT 10`


        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[startDate, endDate])
        return result
    }
}
module.exports = new dashboardModel