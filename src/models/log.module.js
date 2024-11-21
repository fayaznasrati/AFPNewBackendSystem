const dbConnection = require('../db/db-connection');
const { multipleAndColumnSet } = require('../common/query.common');
const dbConnectionReplica = require('../db/db-connection-replica')

const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

class logModule {

    tableName1 = 'er_activity_logs'
    tableName2 = 'er_activity_type'

    adminActivityList = [1,2,3,4]

    getAgentWithNoActivityCount = async (param) => {

        // https://stackoverflow.com/questions/26869060/mysql-all-users-with-no-activity-in-last-x-days 
        const {dayCount,...otherParam} = param
        var intdayCount = dayCount > 0 ? dayCount : process.env.AGENT_NO_ACTIVITY
        const {sevalues,seColumnSet} = await multipleAndColumnSet(otherParam);
        // console.log(seColumnSet, sevalues)

        const sql = `SELECT COUNT(1) AS count
                    FROM ${this.tableName2} JOIN 
                    ( SELECT username AS userid, full_name AS name, CAST(created_on AS CHAR(20)) as date, activity_type, user_type
                     FROM ${this.tableName1} WHERE ${seColumnSet}
                     GROUP BY userid 
                     HAVING MAX (created_on) < CURDATE() - INTERVAL ${intdayCount} DAY ORDER BY id DESC) AS ${this.tableName1} 
                     ON ${this.tableName1}.activity_type = ${this.tableName2}.at_id`
        // let sql = `SELECT username AS userid, full_name AS name, created_on FROM ${this.tableName1} WHERE ${seColumnSet} limit ${limit} offset ${offset}`

        // console.log("QUERY " + sql)

        const result = await dbConnectionReplica.query(sql, [...sevalues]);
        return result
    }

    getAgentWithNoActivity = async (param, limit, offset) => {

        // https://stackoverflow.com/questions/26869060/mysql-all-users-with-no-activity-in-last-x-days 
        const {dayCount,...otherParam} = param
        var intdayCount = dayCount > 0 ? dayCount : process.env.AGENT_NO_ACTIVITY
        const {sevalues,seColumnSet} = await multipleAndColumnSet(otherParam);
        // console.log(seColumnSet, sevalues)

        const sql = `SELECT ${this.tableName1}.userid, ${this.tableName1}.name, ${this.tableName1}.date, ${this.tableName1}.user_type, ${this.tableName2}.activity_name AS activityType
                    FROM ${this.tableName2} JOIN 
                    ( SELECT username AS userid, full_name AS name, CAST(created_on AS CHAR(20)) as date, activity_type, user_type
                     FROM ${this.tableName1} WHERE ${seColumnSet}
                     GROUP BY userid 
                     HAVING MAX (created_on) < CURDATE() - INTERVAL ${intdayCount} DAY ORDER BY id DESC) AS ${this.tableName1} 
                     ON ${this.tableName1}.activity_type = ${this.tableName2}.at_id LIMIT ${limit} OFFSET ${offset}`
        // let sql = `SELECT username AS userid, full_name AS name, created_on FROM ${this.tableName1} WHERE ${seColumnSet} limit ${limit} offset ${offset}`

        // console.log("QUERY " + sql)

        const result = await dbConnectionReplica.query(sql, [...sevalues]);
        return result
    }

    getActivityLogCount = async (params) => {
        const {intActivityTypeList,...other} = params;
        const {sevalues,seColumnSet} = await multipleAndColumnSet(other);

        let result, sql
        sql = ` SELECT COUNT(1) AS count FROM ${this.tableName1} `
        sql = sql + ( seColumnSet ? ` WHERE ${seColumnSet} AND activity_type in (${intActivityTypeList}) ` : ` WHERE activity_type in (${intActivityTypeList}) `)
        sql = sql + ` ORDER BY id DESC`

        // console.log("QUERY " + sql)
        
        if (sevalues) result = await dbConnectionReplica.query(sql, [...sevalues]);
        else result = await dbConnectionReplica.query(sql);

        return result
    }

    getActivityLog = async (params, limit, offset) => {
        const {intActivityTypeList,...other} = params;
        const {sevalues,seColumnSet} = await multipleAndColumnSet(other);

        let result, sql
        sql = ` SELECT username AS userId, full_name AS name, ip_address AS ipAddress, CAST(created_on AS CHAR(20)) AS dateTime, os_details AS osDetails, description, old_value AS oldValue, modified_value AS modifiedValue
                     FROM ${this.tableName1} `
        sql = sql + ( seColumnSet ? ` WHERE ${seColumnSet} AND activity_type in (${intActivityTypeList}) ` : ` WHERE activity_type in (${intActivityTypeList}) `)
        sql = sql + ` ORDER BY id DESC limit ${limit} OFFSET ${offset}`

        // console.log("QUERY " + sql)
        
        if (sevalues) result = await dbConnectionReplica.query(sql, [...sevalues]);
        else result = await dbConnectionReplica.query(sql);

        return result
    }

    getAgentSelfActivityLogCount = async (params) => {
        const {intActivityTypeList,...other} = params;
        const {sevalues,seColumnSet} = await this.queryGen(other);

        let result, sql
        sql = `SELECT COUNT(1) AS count
                     FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.activity_type = ${this.tableName2}.at_id
                     WHERE ${seColumnSet} AND activity_type in (${intActivityTypeList})
                     ORDER BY ${this.tableName1}.id DESC`

        // console.log("QUERY " + sql)
        
        if (sevalues) result = await dbConnectionReplica.query(sql, [...sevalues]);
        else result = await dbConnectionReplica.query(sql);

        return result
    }

    getAgentSelfActivityLog = async (params, limit, offset) => {
        const {intActivityTypeList,...other} = params;
        const {sevalues,seColumnSet} = await this.queryGen(other);

        let result, sql
        sql = `SELECT ${this.tableName1}.id AS logId,${this.tableName1}.description AS activity, CAST(${this.tableName1}.created_on AS CHAR(20)) AS date,
                      ${this.tableName2}.activity_name AS activityType
                     FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.activity_type = ${this.tableName2}.at_id
                     WHERE ${seColumnSet} AND activity_type in (${intActivityTypeList})
                     ORDER BY ${this.tableName1}.id DESC LIMIT ${limit} OFFSET ${offset}`

        // console.log("QUERY " + sql)
        
        if (sevalues) result = await dbConnectionReplica.query(sql, [...sevalues]);
        else result = await dbConnectionReplica.query(sql);

        return result
    }

    queryGen = async (object) =>{
        // console.log(param)

        let { region_ids, child_ids, between, timeDifferent, ...other } = object

        const keys = Object.keys(other);
        const sevalues = Object.values(other)

            // optional search variables
        var seColumnSet = keys.map(key => {
            if (key == "dtPreviousDate") return `? >= date(${this.tableName1}.created_on)`
            if (key == 'start_date') return `? <= date(${this.tableName1}.created_on)`
            if (key == 'end_date') return `? >= date(${this.tableName1}.created_on)`
            if (key.includes('_uuid')) return `CAST(${this.tableName1}.${key} AS  CHAR(16)) = ?`
            return `? = ${this.tableName1}.${key}`
        })

        if( region_ids )  seColumnSet.push( `${this.tableName1}.region_id IN ( ${region_ids} ) ` )
        if( child_ids ) seColumnSet.push( `${this.tableName1}.userid IN ( ${child_ids} ) ` )
        if( timeDifferent ) {
            seColumnSet.push(`TIMESTAMPDIFF(MINUTE, '${this.tableName1}.${timeDifferent.key}', '${timeDifferent.value}' ) <= ${timeDifferent.diff}`)
        }
        if( between ) seColumnSet.push(` date( ${this.tableName1}.${between.key} ) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
            
        seColumnSet = seColumnSet.join(' AND ');

        return {sevalues,seColumnSet}
    }
}

module.exports = new logModule();