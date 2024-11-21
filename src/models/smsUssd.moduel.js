const dbConnection = require('../db/db-connection');
const dbConnectionReplica = require('../db/db-connection-replica')

class smsUssdModule {

    tableName1 = 'er_login'
    tableName2 = 'er_ussd_sms_activity'
    tableName3 = 'er_ussd_activity_type'

    getUssdActivityReportCount = async (searchKeyValue) =>{ 
        const {seColumnSet,sevalues} = this.multipleAndColumnSet(searchKeyValue)
        var sql = `SELECT COUNT(1) AS count
                   FROM ${this.tableName1} JOIN ${this.tableName2} 
                   ON ${this.tableName1}.userid = ${this.tableName2}.userid
                   WHERE ${seColumnSet} 
                   ORDER By ${this.tableName2}.id DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql, [...sevalues]);
        return result
    }

    getUssdActivityReport = async (searchKeyValue,limit, offset) =>{ 
        const {seColumnSet,sevalues} = this.multipleAndColumnSet(searchKeyValue)
        var sql = `SELECT ${this.tableName1}.username AS userId, ${this.tableName1}.full_name AS userName, ${this.tableName1}.usertype_id,
                          ${this.tableName2}.activity_name, CAST(${this.tableName2}.created_on AS CHAR(20)) AS date
                   FROM ${this.tableName1} JOIN ${this.tableName2} 
                   ON ${this.tableName1}.userid = ${this.tableName2}.userid
                   WHERE ${seColumnSet} 
                   ORDER By ${this.tableName2}.id DESC limit ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql, [...sevalues]);
        return result
    }

    multipleAndColumnSet = (object) => {
        if (typeof object !== 'object') {
            throw new Error('Invalid input');
        }

        let { region_ids, child_ids, between, timeDifferent, ...other } = object

        const keys = Object.keys(other);
        const sevalues = Object.values(other)

        var seColumnSet = keys.map(key => {
            if (key == 'channel') return `${this.tableName2}.channel = ?`
            if (key == 'activityId') return `${this.tableName2}.activity_type = ?`
            if(key.includes('_uuid')) return `CAST(${this.tableName1}.${key} AS  CHAR(16)) = ?`
            return `${this.tableName1}.${key} = ?`
        })

        if( region_ids )  seColumnSet.push( `${this.tableName1}.region_id IN ( ${region_ids} ) ` )
        if( child_ids ) seColumnSet.push( `${this.tableName1}.userid IN ( ${child_ids} ) ` )
        if( timeDifferent ) {
            seColumnSet.push(`TIMESTAMPDIFF(MINUTE, '${timeDifferent.key}', '${timeDifferent.value}' ) <= ${timeDifferent.diff}`)
        }
        if( between ) seColumnSet.push(` date( ${between.key}) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
            
        seColumnSet = seColumnSet.join(' AND ');
    

        return {
            seColumnSet,
            sevalues
        }
    }
}

module.exports = new smsUssdModule()