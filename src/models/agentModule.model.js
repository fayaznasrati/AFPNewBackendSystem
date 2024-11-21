const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')
const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

class moduleModel { 

    // table name
        tableName1 = "er_agent_modules"
        tableName2 = "er_agent_sub_module"
        tableName3 = "er_agent_modules_permission"

        getAllModuleList = async () =>{
            const sql = `SELECT ${this.tableName1}.agent_module_name AS ModuleName, ${this.tableName1}.agent_module_title AS ModuleTitle,
                                ${this.tableName2}.agent_sub_module_name AS subModuleName, ${this.tableName2}.agent_sub_module_title AS subModuleTitle
                         FROM ${this.tableName1} JOIN ${this.tableName2}
                         ON ${this.tableName1}.agent_module_id = ${this.tableName2}.agent_module_id`
            // console.log(sql)      

            const result = await dbConnectionReplica.query(sql);
            // console.log(result);
            return result
        }

        agentAssignRights = async (user_uuid) =>{ 
            const sql = `SELECT ${this.tableName1}.agent_module_name AS ModuleName, ${this.tableName1}.agent_module_title AS ModuleTitle,
                                ${this.tableName2}.agent_sub_module_name AS subModuleName, ${this.tableName2}.agent_sub_module_title AS subModuleTitle,
                                ${this.tableName3}.sub_module_perm, ${this.tableName3}.perm_view, ${this.tableName3}.agent_module_id
                        FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.agent_module_id = ${this.tableName2}.agent_module_id
                                                JOIN ${this.tableName3} ON ${this.tableName1}.agent_module_id = ${this.tableName3}.agent_module_id
                        WHERE CAST(${this.tableName3}.user_uuid AS  CHAR(16)) = ? ORDER BY ${this.tableName1}.agent_module_id ASC,  ${this.tableName2}.agent_sub_module_id ASC`
            // console.log(sql)      

            const result = await dbConnectionReplica.query(sql,[user_uuid]);
            // console.log(result);
            return result
        }
}

module.exports = new moduleModel();