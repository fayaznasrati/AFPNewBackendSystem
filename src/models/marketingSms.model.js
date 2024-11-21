const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

class marketingSmsModel {
    tableName1 = 'er_marketing_sms_template_categories'
    tableName2 = 'er_marketing_sms_templates'
    tableName3 = 'er_send_marketing_group_sms'
    tableName4 = 'er_send_marketing_sms'

    // editing er_marketing_sms_templates table
    allSmsTemplateCount = async(id) => {
        const sql = `SELECT COUNT(1) AS count
                    FROM ${this.tableName2} INNER JOIN ${this.tableName1}
                    ON ${this.tableName2}.sms_template_category_id = ${this.tableName1}.sms_template_category_id
                    WHERE ${this.tableName2}.active = 1 AND ${this.tableName2}.created_by = ${id}
                    ORDER BY ${this.tableName2}.template_name`;
        const result = await dbConnectionReplica.query(sql);
        return result
    }

    allSmsTemplate = async(id, limit, offset) => {
        const sql = `SELECT ${this.tableName2}.template_name AS template, ${this.tableName1}.category_name AS category, CAST(${this.tableName2}.created_on AS CHAR(20)) AS date, ${this.tableName2}.template_message AS message, CAST(${this.tableName2}.template_uuid AS CHAR(16)) AS template_uuid
                    FROM ${this.tableName2} INNER JOIN ${this.tableName1}
                    ON ${this.tableName2}.sms_template_category_id = ${this.tableName1}.sms_template_category_id
                    WHERE ${this.tableName2}.active = 1 AND ${this.tableName2}.created_by = ${id}
                    ORDER BY ${this.tableName2}.template_name LIMIT ${limit} OFFSET ${offset}`;
        const result = await dbConnectionReplica.query(sql);
        return result
    }

    getTemplateDetails = async(id) => {
        const sql = `SELECT ${this.tableName2}.template_name AS template, ${this.tableName1}.category_name AS category, CAST(${this.tableName2}.created_on AS CHAR(20)) AS date, CAST(${this.tableName2}.template_uuid AS CHAR(16)) AS template_uuid, ${this.tableName2}.template_message
                    FROM ${this.tableName2} INNER JOIN ${this.tableName1}
                    ON ${this.tableName2}.sms_template_category_id = ${this.tableName1}.sms_template_category_id
                    WHERE ${this.tableName2}.active = 1 AND CAST(${this.tableName2}.template_uuid AS  CHAR(16)) = '${id}'`;
        const result = await dbConnectionReplica.query(sql);
        return result
    }

    // editing er_send_marketing_group_sms tables

    allSmsGroup = async() => {
        const sql = `SELECT ${this.tableName3}.group_name ,${this.tableName3}.message_type,${this.tableName3}.send_group_sms_uuid, CAST(${this.tableName3}.created_on AS CHAR(20)) as created_on,${this.tableName2}.template_name
                    FROM ${this.tableName3} INNER JOIN ${this.tableName2}
                    ON ${this.tableName3}.sms_template_id = ${this.tableName2}.sms_template_id
                    WHERE ${this.tableName3}.active = 1`;
        const result = await dbConnectionReplica.query(sql);
        return result
    }

    allSmsGroupDateRangeCount = async(start, end) => {
        const sql = `SELECT COUNT(1) AS count
                    FROM ${this.tableName3} LEFT JOIN ${this.tableName2}
                    ON ${this.tableName3}.sms_template_id = ${this.tableName2}.sms_template_id
                    WHERE ${this.tableName3}.active = 1 AND ${start} <= date(${this.tableName3}.created_on) AND date(${this.tableName3}.created_on) <= '${end}' ORDER BY ${this.tableName3}.created_on DESC`;
        const result = await dbConnectionReplica.query(sql);
        return result
    }

    allSmsGroupDateRange = async(start, end, limit, offset) => {
        const sql = `SELECT ${this.tableName3}.group_name ,${this.tableName3}.message_type,${this.tableName3}.sms_title,${this.tableName3}.sms_message,CAST(${this.tableName3}.send_group_sms_uuid AS CHAR(16)) , CAST(${this.tableName3}.created_on AS CHAR(20)) as created_on,${this.tableName2}.template_name
                    FROM ${this.tableName3} LEFT JOIN ${this.tableName2}
                    ON ${this.tableName3}.sms_template_id = ${this.tableName2}.sms_template_id
                    WHERE ${this.tableName3}.active = 1 AND ${start} <= date(${this.tableName3}.created_on) AND date(${this.tableName3}.created_on) <= '${end}' ORDER BY ${this.tableName3}.created_on DESC LIMIT ${limit} OFFSET ${offset}`;
        const result = await dbConnectionReplica.query(sql);
        return result
    }

}
module.exports = new marketingSmsModel;