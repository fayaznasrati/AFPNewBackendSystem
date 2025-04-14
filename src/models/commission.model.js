const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica');

class commissionModel {
    tableName1 = "er_login"
    tableName2 = "er_prepaid_commission"
    tableName3 = "er_postpaid_commission"

    directAgentPrePaidCommissionReportCount = async (parma) => {
        const {sevalues,seColumnSet} = await this.queryGen(parma);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT COUNT(1) AS count FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name`
        // console.log(sql)      

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    directAgentPrePaidCommissionReport = async (parma, limit, offset) => {
        const {sevalues,seColumnSet} = await this.queryGen(parma);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT ${this.tableName1}.username AS userid, ${this.tableName1}.full_name AS userName, IF(${this.tableName1}.usertype_id=1,"Master Distributor",IF(${this.tableName1}.usertype_id=2,"Distributor",IF(${this.tableName1}.usertype_id=3,"Reseller",IF(${this.tableName1}.usertype_id=4,"Retailer","NA")))) AS userType,
                            ${this.tableName2}.commission_value
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)      

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    directAgentPostPaidCommissionReportCount = async (parma) =>{
        const {sevalues,seColumnSet} = await this.queryGen(parma);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT COUNT(1) AS count FROM ${this.tableName1} JOIN ${this.tableName3}
                    ON ${this.tableName1}.userid = ${this.tableName3}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name`
        // console.log(sql)      

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    directAgentPostPaidCommissionReport = async (parma, limit, offset) =>{
        const {sevalues,seColumnSet} = await this.queryGen(parma);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT ${this.tableName1}.username AS userid, ${this.tableName1}.full_name AS userName, IF(${this.tableName1}.usertype_id=1,"Master Distributor",IF(${this.tableName1}.usertype_id=2,"Distributor",IF(${this.tableName1}.usertype_id=3,"Reseller",IF(${this.tableName1}.usertype_id=4,"Retailer","NA")))) AS userType,
                            ${this.tableName3}.op1_comm AS salamCommission, ${this.tableName3}.op2_comm AS awccCommission, ${this.tableName3}.op3_comm AS mtnCommission, ${this.tableName3}.op4_comm AS etisalatCommission, ${this.tableName3}.op5_comm AS roshanCommission
                    FROM ${this.tableName1} JOIN ${this.tableName3}
                    ON ${this.tableName1}.userid = ${this.tableName3}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)      

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    inDirectAgentPrePaidCommissionReportCount = async (parma) => {
        const {sevalues,seColumnSet} = await this.queryGen(parma);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT COUNT(1) as count FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name`
        // console.log(sql)      

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    inDirectAgentPrePaidCommissionReport = async (parma, limit, offset) => {
        const {sevalues,seColumnSet} = await this.queryGen(parma);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT ${this.tableName1}.username AS userid, ${this.tableName1}.full_name AS userName, IF(${this.tableName1}.usertype_id=1,"Master Distributor",IF(${this.tableName1}.usertype_id=2,"Distributor",IF(${this.tableName1}.usertype_id=3,"Reseller",IF(${this.tableName1}.usertype_id=4,"Retailer","NA")))) AS userType,
                            ${this.tableName2}.commission_value
                    FROM ${this.tableName1} JOIN ${this.tableName2}
                    ON ${this.tableName1}.userid = ${this.tableName2}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)      

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    inDirectAgentPostPaidCommissionReportCount = async (parma) =>{
        const {sevalues,seColumnSet} = await this.queryGen(parma);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT count(1) as count FROM ${this.tableName1} JOIN ${this.tableName3}
                    ON ${this.tableName1}.userid = ${this.tableName3}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name`
        // console.log(sql)      

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    inDirectAgentPostPaidCommissionReport = async (parma, limit, offset) =>{
        const {sevalues,seColumnSet} = await this.queryGen(parma);
        // console.log(sevalues,seColumnSet,limit,offset);

        const sql = `SELECT ${this.tableName1}.username AS userid, ${this.tableName1}.full_name AS userName, IF(${this.tableName1}.usertype_id=1,"Master Distributor",IF(${this.tableName1}.usertype_id=2,"Distributor",IF(${this.tableName1}.usertype_id=3,"Reseller",IF(${this.tableName1}.usertype_id=4,"Retailer","NA")))) AS userType,
                            ${this.tableName3}.op1_comm AS salamCommission, ${this.tableName3}.op2_comm AS awccCommission, ${this.tableName3}.op3_comm AS mtnCommission, ${this.tableName3}.op4_comm AS etisalatCommission, ${this.tableName3}.op5_comm AS roshanCommission
                    FROM ${this.tableName1} JOIN ${this.tableName3}
                    ON ${this.tableName1}.userid = ${this.tableName3}.userid
                    WHERE ${seColumnSet} ORDER BY ${this.tableName1}.full_name LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)      

        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        // console.log(result);
        return result
    }

    queryGen = async (object) =>{
        // console.log(param)
        let { region_ids, child_ids, between, timeDifferent, ...other } = object

        const keys = Object.keys(other);
        const sevalues = Object.values(other)

            // optional search variables
        var seColumnSet = keys.map(key => {
            if (key == 'userid') return `${this.tableName1}.username = ?`
            if (key == 'userName') return `${this.tableName1}.full_name = ?`
            if (key == 'userType') return `${this.tableName1}.usertype_id = ?`
            if (key == 'parent_id') return `${this.tableName1}.parent_id = ?`
            if (key == 'NOT parent_id') return `NOT ${this.tableName1}.parent_id = ?`
        })
        
        if( region_ids )  seColumnSet.push( `${this.tableName1}.region_id IN ( ${region_ids} ) ` )
        if( child_ids ) seColumnSet.push( `${this.tableName1}.userid IN ( ${child_ids} ) ` )
        if( timeDifferent ) {
            seColumnSet.push(`TIMESTAMPDIFF(MINUTE, '${this.tableName1}.${timeDifferent.key}', '${timeDifferent.value}' ) <= ${timeDifferent.diff}`)
        }
        if( between ) seColumnSet.push(` date( ${this.tableName1}.${between.key}) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
            
        seColumnSet = seColumnSet.join(' AND ');

        return {sevalues,seColumnSet}
    }
};

module.exports = new commissionModel();