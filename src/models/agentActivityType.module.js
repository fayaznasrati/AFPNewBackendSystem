const { tableName4 } = require('../controllers/emoney.controller');
const dbConnection = require('../db/db-connection');
const dbConnectionReplica = require('../db/db-connection-replica')
const { multipleColumnSet } = require('../utils/common.utils');

class agentActivityTypeListModule { 
    //table name
    tableName1 = 'er_activity_type'

    //function to get list of user
    getActivityType = async ( userTypeList) =>{
        // console.log(userTypeList,limit, offset)
        
        const sql = `SELECT at_id, activity_name AS activityName
                    FROM ${this.tableName1}
                    WHERE user_type in (${userTypeList})
                    ORDER BY ${this.tableName1}.activity_name ASC`

        // console.log(sql)
        const result = await dbConnectionReplica.query(sql);
        return result
    }
}

module.exports = new agentActivityTypeListModule();