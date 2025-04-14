const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

class ussdModel {

    tableName1 = "er_login"
    tableName2 = 'er_agent_contact'
    tableName3 = 'er_agent_stock_transfer_channel'

    verifyAgent = async (contactNumber, channel) => {
console.log(contactNumber);
        const sql = `SELECT CAST(${this.tableName1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName1}.userid, ${this.tableName1}.username, ${this.tableName1}.usertype_id, ${this.tableName1}.full_name, ${this.tableName1}.m_pin, ${this.tableName1}.mpin_status, ${this.tableName1}.encryption_key, ${this.tableName1}.user_status, ${this.tableName1}.region_id, ${this.tableName1}.prefer_lang, ${this.tableName3}.status as channelStatus
                    FROM ${this.tableName1} JOIN ${this.tableName2} on ${this.tableName1}.userid = ${this.tableName2}.userid
                                            JOIN ${this.tableName3} on ${this.tableName1}.userid = ${this.tableName3}.userid
                    where ${this.tableName2}.mobile = ? AND ${this.tableName2}.status = ? ANd ${this.tableName3}.channel = ? ORDER BY ${this.tableName1}.userid LIMIT 1`
        const result = await dbConnection.query(sql,[contactNumber, 1, channel]);
             console.log(sql);
        return result
    }
}

module.exports = new ussdModel()
