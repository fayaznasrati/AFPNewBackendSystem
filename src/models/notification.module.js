const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

class notificationModule {

    //table names
    tableName1 = "er_admin_notification_types"
    tableName2 = "er_admin_notification_numbers"

    allNotiNumberCount = async(id) => {
        const sql = `SELECT COUNT(1) AS count FROM ${this.tableName2} INNER JOIN ${this.tableName1}
                    ON ${this.tableName2}.nn_type = ${this.tableName1}.nt_id
                    WHERE ${this.tableName2}.active = 1 AND ${this.tableName2}.created_by = ${id}
                    ORDER BY ${this.tableName2}.created_on DESC`
        const result = await dbConnectionReplica.query(sql);
        return result
    }

    allNotiNumber = async(id, limit, offset) => {
        const sql = `SELECT CAST(${this.tableName2}.nn_uuid AS CHAR(16)) AS nn_uuid,${this.tableName1}.nt_name AS notificationType,${this.tableName2}.nn_number AS number
                    FROM ${this.tableName2} INNER JOIN ${this.tableName1}
                    ON ${this.tableName2}.nn_type = ${this.tableName1}.nt_id
                    WHERE ${this.tableName2}.active = 1 AND ${this.tableName2}.created_by = ${id}
                    ORDER BY ${this.tableName2}.created_on DESC LIMIT ${limit} OFFSET ${offset}`
        const result = await dbConnectionReplica.query(sql);
        return result
    }

    getNotiNumberDetails = async(id) => {
        const sql = `SELECT CAST(${this.tableName2}.nn_uuid AS CHAR(16)) AS nn_uuid,${this.tableName1}.nt_name AS notificationType,${this.tableName2}.nn_number AS number
                    FROM ${this.tableName2} INNER JOIN ${this.tableName1}
                    ON ${this.tableName2}.nn_type = ${this.tableName1}.nt_id
                    WHERE ${this.tableName2}.active = 1 AND CAST( ${this.tableName2}.nn_uuid AS  CHAR(16)) = "${id}"`
        const result = await dbConnectionReplica.query(sql);
        return result
    }
}

module.exports = new notificationModule