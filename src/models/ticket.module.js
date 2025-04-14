const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');
const dbConnectionReplica = require('../db/db-connection-replica')

const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

class ticketModule {
    tableName1 = 'er_ticket_category';
    tableName2 = 'er_tickets';
    tableName3 = 'er_ticket_message';
    tableName4 = 'er_login'

    getDownlineMemberTicketCount = async(details) => {

        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName4,this.tableName2)
        let sql = `SELECT COUNT(1) AS count
                    FROM ${this.tableName4} JOIN ${this.tableName2} ON ${this.tableName4}.userid = ${this.tableName2}.created_by_id
                    WHERE ${seColumnSet} ORDER BY ticket_id DESC`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    getDownlineMemberTicket = async(details, limit, offset) => {

        const {seColumnSet, sevalues} = this.multipleAndColumnSet(details,this.tableName4,this.tableName2)
        let sql = `SELECT ${this.tableName4}.username AS agentId, ${this.tableName4}.full_name AS agentName,
                    ${this.tableName2}.ticket_disp_id, ${this.tableName2}.ticket_category_name AS name, ${this.tableName2}.ticket_subject AS subject, ${this.tableName2}.ticket_status_name AS status, CAST(${this.tableName2}.created_on AS CHAR(20)) AS created, ${this.tableName2}.last_modified_on AS modified
                    FROM ${this.tableName4} JOIN ${this.tableName2} ON ${this.tableName4}.userid = ${this.tableName2}.created_by_id
                    WHERE ${seColumnSet} ORDER BY ticket_id DESC LIMIT ${limit} OFFSET ${offset}`
        // console.log(sql)
        const result = await dbConnectionReplica.query(sql,[...sevalues]);
        return result
    }

    multipleAndColumnSet = (object,tableName1,tableName2) => {
        if (typeof object !== 'object') {
            throw new Error('Invalid input');
        }

        let { region_ids, child_ids, between, timeDifferent, ...other } = object

        const keys = Object.keys(other);
        const sevalues = Object.values(other)

        var seColumnSet = keys.map(key => {
            if (key == 'start_date') return ` ? <= date( ${tableName2}.created_on)`
            if (key == 'end_date') return `date( ${tableName2}.created_on) <= ?`
            if(key == 'created_by_type') return `${tableName2}.created_by_type = ?`
            if(key == 'statusName') return `${tableName2}.statusName = ?`
            if(key.includes('_uuid')) return `CAST(${tableName1}.${key} AS  CHAR(16)) = ?`
            return `${tableName1}.${key} = ?`
        })
        
        if( region_ids )  seColumnSet.push( `${tableName1}.region_id IN ( ${region_ids} ) ` )
        if( child_ids ) seColumnSet.push( `${tableName1}.userid IN ( ${child_ids} ) ` )
        // if( timeDifferent ) {
        //     seColumnSet.push(`TIMESTAMPDIFF(MINUTE, '${timeDifferent.key}', '${timeDifferent.value}' ) <= ${timeDifferent.diff}`)
        // }
        // if( between ) seColumnSet.push(` CAST( ${between.key} as DATE) BETWEEN '${between.value[0]}' AND '${between.value[1]}' `)
            
        seColumnSet = seColumnSet.join(' AND ');

        return {
            seColumnSet,
            sevalues
        }
    }
}

module.exports = new ticketModule()