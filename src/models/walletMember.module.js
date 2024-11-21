const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

class walletMemberModule { 
    // table name
        tableName1 = "er_wallet_transfer_group"
        tableName2 = "er_wallet_transfer_group_members"
        tableName3 = "er_login"

        getWalletMemberGroup = async (group_uuid) => {
            const sql = `SELECT CAST(${this.tableName2}.member_uuid AS CHAR(16)) AS  member_uuid,
                                ${this.tableName3}.username, CAST(${this.tableName3}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName3}.full_name AS memberName
                         FROM ${this.tableName2} JOIN ${this.tableName3} 
                            ON ${this.tableName2}.userid = ${this.tableName3}.userid
                         WHERE CAST( ${this.tableName2}.group_uuid AS  CHAR(16)) = ? AND ${this.tableName2}.active = 1
                         ORDER BY ${this.tableName3}.full_name ASC`
            
            const result = await dbConnectionReplica.query(sql,[group_uuid]);
            return result
        }

        getWalletMemberGroupAgentById = async(member_uuid) =>{
            const sql = `SELECT CAST(${this.tableName1}.group_uuid AS CHAR(16)) AS group_uuid, ${this.tableName1}.group_name,
                                CAST(${this.tableName3}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName3}.username as userid, ${this.tableName3}.full_name AS name
                         FROM ${this.tableName2} JOIN ${this.tableName1} ON CAST( ${this.tableName2}.group_uuid AS  CHAR(16)) = CAST( ${this.tableName1}.group_uuid AS  CHAR(16))
                                                 JOIN ${this.tableName3} ON CAST( ${this.tableName2}.user_uuid AS  CHAR(16)) = CAST( ${this.tableName3}.user_uuid AS  CHAR(16))
                         WHERE CAST( ${this.tableName2}.member_uuid AS  CHAR(16)) = ? AND ${this.tableName2}.active = 1`

            const result = await dbConnectionReplica.query(sql,[member_uuid]);
            return result  
        }
}

module.exports = new walletMemberModule()