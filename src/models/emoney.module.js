const dbConnection = require('../db/db-connection');
const { multipleColumnSet } = require('../utils/common.utils');

class emoneyModule {

    tableName1 = 'er_mno_details'

    constructor(){
        // this.addEmoney(3,200).then((res)=>{
        //     console.log(res)
        // })

        // this.debitEmoney(3,200).then((res)=>{
        //     console.log(res)
        // })

        // this.rollbackEmoney(3,200).then((res)=>{
        //     console.log(res)
        // })
    }

    addEmoney = async (id, amount) => {
        const query =[  `UPDATE ${this.tableName1} SET current_balance = current_balance + ${amount} WHERE id = ${id} AND status = 1;`,
                        `SELECT CAST(mno_uuid AS CHAR(16)) AS mno_uuid, mno_name, current_balance, rollback_amount FROM ${this.tableName1} where id = ${id} AND status = 1;`
                    ]
        let queryResponse = await dbConnection.simpleQuery(query.join(" "));
        return queryResponse
    }

    debitEmoney = async (id, amount) => {
        const query =[  `UPDATE ${this.tableName1} SET current_balance = current_balance - ${amount} WHERE id = ${id} AND current_balance >= ${amount} AND status = 1;`,
                        `SELECT CAST(mno_uuid AS CHAR(16)) AS mno_uuid, mno_name, current_balance, rollback_amount FROM ${this.tableName1} where id = ${id} AND status = 1;`
                    ]
        let queryResponse = await dbConnection.simpleQuery(query.join(" "));
        return queryResponse
    }

    rollbackEmoney = async (id, amount) => {
        const query =[  `UPDATE ${this.tableName1} SET current_balance = current_balance - ${amount}, rollback_amount = rollback_amount + ${amount} WHERE id = ${id} AND current_balance >= ${amount} AND status = 1;`,
                        `SELECT CAST(mno_uuid AS CHAR(16)) AS mno_uuid, mno_name, current_balance, rollback_amount FROM ${this.tableName1} where id = ${id} AND status = 1;`
                    ]
        let queryResponse = await dbConnection.simpleQuery(query.join(" "));
        return queryResponse
    }
}

module.exports = new emoneyModule