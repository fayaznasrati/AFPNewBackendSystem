const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

class memberModule {
    // tablename
    tableName1 = "er_login"
    tableName2 = "er_member_group"
    tableName3 = "er_member"
    tableName4 = "er_agent_type"

    getUserGroupListCount = async(param) => {
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet)

        const sql = `SELECT COUNT(1) AS count 
                    FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
                                             JOIN ${this.tableName4} ON ${this.tableName1}.usertype_id = ${this.tableName4}.agent_type_id
                     WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name`
        //console.log("Sql Query = ",sql)

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    getUserGroupList = async(param, limit, offset) => {
        const {sevalues,seColumnSet} = await this.queryGen(param);
        // console.log(sevalues,seColumnSet)

        const sql = `SELECT ${this.tableName1}.username AS userid, CAST(${this.tableName1}.user_uuid AS CHAR(16)) AS user_uuid, ${this.tableName1}.full_name as name,
                            CAST(${this.tableName2}.group_uuid AS CHAR(16)) AS group_uuid, ${this.tableName2}.group_name,
                            ${this.tableName4}.agent_type_name AS usertype_name
                     FROM ${this.tableName1} JOIN ${this.tableName2} ON ${this.tableName1}.userid = ${this.tableName2}.userid
                                             JOIN ${this.tableName4} ON ${this.tableName1}.usertype_id = ${this.tableName4}.agent_type_id
                     WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name LIMIT ${limit} OFFSET ${offset}`
        //console.log("Sql Query = ",sql)

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    queryGen = async (object) =>{
        // console.log(param)
        let { region_ids, child_ids, between, timeDifferent, ...other } = object

        const keys = Object.keys(other);
        const sevalues = Object.values(other)

            // optional search variables
        var seColumnSet = keys.map(key => {
            if (key == 'username') return `${this.tableName1}.username = ?`
            if (key == 'full_name') return `${this.tableName1}.full_name = ?`
            if (key == 'agent_type_id') return `${this.tableName1}.usertype_id = ?`
            if (key == 'parent_id') return `${this.tableName1}.parent_id = ?`
        })

        if( region_ids )  seColumnSet.push( `${this.tableName1}.region_id IN ( ${region_ids} ) ` )
        if( child_ids ) seColumnSet.push( `${this.tableName1}.userid IN ( ${child_ids} ) ` )

        if( between ) seColumnSet.push(` date( ${this.tableName1}.${between.key}) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
            
        seColumnSet = seColumnSet.join(' AND ');

        return {sevalues,seColumnSet}
    }
}

module.exports = new memberModule();