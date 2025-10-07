const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

class subAdminModel {
    // table name
        tableName1 = "er_sub_admin_module"
        tableName2 = "er_sub_admin_sub_module"
        tableName3 = "er_sub_admin_module_permission"

        getAllModuleList = async () =>{
            const sql = `SELECT ${this.tableName1}.sub_admin_module_name AS ModuleName, ${this.tableName1}.sub_admin_module_title AS ModuleTitle,
                                ${this.tableName2}.sub_admin_sub_module_name AS subModuleName, ${this.tableName2}.sub_admin_sub_module_title AS subModuleTitle
                         FROM ${this.tableName1} JOIN ${this.tableName2}
                         ON ${this.tableName1}.sub_admin_module_id = ${this.tableName2}.sub_admin_module_id
                         ORDER BY ${this.tableName2}.sub_admin_sub_module_id ASC`
            // console.log(sql)      

            const result = await dbConnectionReplica.query(sql);
            // console.log(result);
            return result
        }

        subAdminAssignRights = async (department_uuid) =>{ 
            const sql = `SELECT ${this.tableName1}.sub_admin_module_name AS ModuleName, ${this.tableName1}.sub_admin_module_title AS ModuleTitle,
                                ${this.tableName2}.sub_admin_sub_module_name AS subModuleName, ${this.tableName2}.sub_admin_sub_module_title AS subModuleTitle,
                                ${this.tableName3}.sub_admin_sub_module_perm
                        FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.sub_admin_module_id = ${this.tableName2}.sub_admin_module_id
                                                JOIN ${this.tableName3} ON ${this.tableName1}.sub_admin_module_id = ${this.tableName3}.sub_admin_module_id
                        WHERE CAST(${this.tableName3}.department_uuid AS  CHAR(16)) = ? ORDER BY ${this.tableName1}.sub_admin_module_id ASC,  ${this.tableName2}.sub_admin_sub_module_id ASC`
            console.log(sql)      

            const result = await dbConnectionReplica.query(sql,[department_uuid]);
            console.log(result);
            return result
        }
}

module.exports = new subAdminModel();