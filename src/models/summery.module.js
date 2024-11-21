const dbConnection = require('../db/db-connection');
const dbConnectionReplica = require('../db/db-connection-replica')

const query = require('../common/sqlQuery.common')
const queryReplica = require('../common/sqlQueryReplica.common')

const commonQueryCommon = require('../common/commonQuery.common');

const { start,sendMessage,createWorker } = require('../common/rabbitmq.common');
const sqlQueryReplicaCommon = require('../common/sqlQueryReplica.common');

class summerReport {

    tableName1 = 'er_daily_user_summery'
    tableName2 = 'er_daily_topup_summery'

    constructor(){
        start().then((msg) =>{
            // console.log(msg);
            if(process.env.START_RABBIT_MQ_WORKER == 1){
                // createWorker('SMS',this.smsWorker)
                if(msg == 'connection created'){
                    createWorker('rechargeSuccessAddUserSummery', this.rechargeSuccessAddUserSummery)
                    createWorker('rechargeFailedDeductUserSummery', this.rechargeFailedDeductUserSummery)
                    createWorker('rechargeSuccessAddSystemSummery', this.rechargeSuccessAddSystemSummery)
                    createWorker('rechargeFailedDeductSystemSummery', this.rechargeFailedDeductSystemSummery)
                    createWorker('processedStockTransfer', this.processedStockTransfer)
                    createWorker('processedStockSend', this.processedStockSend)
                    createWorker('processedStockReceived', this.processedStockReceived)
                }
            }

            // this.generateTopupSummeryReport()
            // 15915061
            
        })
    }  

    generateTopupSummeryReport = async () => {
        try{
            let i = 14650610
            while( i >= 0 ){
                let sql = `Select userid, amount, status, operator_id, rollback_status, CAST(created_on as CHAR(16)) as created_on from er_recharge 
                            where id = ? limit 1;`
                let recordList = await dbConnectionReplica.query(sql,[i--])
                console.log(recordList?.[0]?.created_on)

                if( recordList.length > 0 && (recordList[0].status == 2 || recordList[0].rollback_status == 3 )){
                    
                    let messageQueue = { 
                        userId : recordList[0].userid, 
                        amount : recordList[0].amount, 
                        comm : 0, 
                        operatorId : recordList[0].operator_id, 
                        dateTime : recordList[0].created_on 
                    }
                    sendMessage('rechargeSuccessAddUserSummery',JSON.stringify(messageQueue),(err,msg)=>{
                        if(err) console.log(err)
                    })

                    messageQueue = { 
                        amount : recordList[0].amount,
                        operatorId : recordList[0].operator_id,  
                        dateTime : recordList[0].created_on
                    } 
                    sendMessage('rechargeSuccessAddSystemSummery',JSON.stringify(messageQueue),(err,msg)=>{
                        if(err) console.log(err)
                    })
                }
            }
        }catch(error){
            console.error(error)
        }
    }

    rechargeSuccessAddUserSummery = async ( messageQueue ) => {
        try{
            let { userId, amount, comm, operatorId, dateTime } = JSON.parse( messageQueue )
            let keyValue = {
                addBalance : {
                    key : `op_${operatorId}_sum`,
                    value : amount
                },
                addBalance1 : {
                    key : `op_${operatorId}_count`,
                    value : amount == 0 ? 0 : 1
                },
                addBalance2 : {
                    key : `op_${operatorId}_comm`,
                    value : comm
                },
                addBalance4 : {
                    key : `op_${operatorId}_com_cou`,
                    value : comm == 0 ? 0 : 1
                },
                addBalance5 : {
                    key : `tot_rech_amt`,
                    value : amount
                },
                addBalance6 : {
                    key : `tot_rech_count`,
                    value : amount == 0 ? 0 : 1
                }
            };
            let searchKeyVaule = {
                userid : userId,
                created_on : dateTime.slice(0, 10)
            };
            let updateResponse = await query.updateQuery(this.tableName1,keyValue,searchKeyVaule)

            if( updateResponse.affectedRows == 0 ){
                let newRecord = {
                    userid : userId,
                    created_on : dateTime.slice(0, 10),
                }
                newRecord[`op_${operatorId}_count`] = amount == 0 ? 0 : 1
                newRecord[`op_${operatorId}_sum`] = amount
                newRecord[`op_${operatorId}_comm`] = comm
                newRecord[`op_${operatorId}_com_cou`] = comm == 0 ? 0 : 1
                newRecord[`tot_rech_amt`] = amount
                newRecord[`tot_rech_count`] = amount == 0 ? 0 : 1
                let addRecord = await query.createQueryUpdate( this.tableName1, newRecord)

                return addRecord
            }

            return updateResponse

        }catch(error){
            throw error
        }
    }

    rechargeFailedDeductUserSummery = async ( messageQueue ) => {
        try{
            let { userId, amount, comm, operatorId, dateTime } = JSON.parse( messageQueue )
            let keyValue = {
                deductBalance : {
                    key : `op_${operatorId}_sum`,
                    value : amount
                },
                deductBalance1 : {
                    key : `op_${operatorId}_count`,
                    value : amount == 0 ? 0 : 1
                },
                deductBalance2 : {
                    key : `op_${operatorId}_comm`,
                    value : comm
                },
                deductBalance3 : {
                    key : `op_${operatorId}_com_cou`,
                    value :  comm == 0 ? 0 : 1
                },
                deductBalance4 : {
                    key : `tot_rech_amt`,
                    value : amount
                },
                deductBalance5 : {
                    key : `tot_rech_count`,
                    value : amount == 0 ? 0 : 1
                }
            };
            let searchKeyVaule = {
                userid : userId,
                created_on : dateTime.slice(0, 10)
            };
            let updateResponse = await query.updateQuery(this.tableName1,keyValue,searchKeyVaule)

            if( updateResponse.affectedRows == 0 ){
                // push back to rabbit mq
                console.error(`User [${userId}] summery report update [${dateTime}] [${operatorId}] [${amount}] [${comm}] failed`)
                // sendMessage('rechargeFailedDeductUserSummery',messageQueue,(err,msg)=>{
                //     if(err) console.log(err)
                // })

                let newRecord = {
                    userid : userId,
                    created_on : dateTime.slice(0, 10),
                }
                newRecord[`op_${operatorId}_count`] = amount == 0 ? 0 : -1
                newRecord[`op_${operatorId}_sum`] = -amount
                newRecord[`op_${operatorId}_comm`] = -comm
                newRecord[`op_${operatorId}_com_cou`] = comm == 0 ? 0 : -1
                newRecord[`tot_rech_amt`] = -amount
                newRecord[`tot_rech_count`] = amount == 0 ? 0 : -1
                let addRecord = await query.createQueryUpdate( this.tableName1, newRecord)

                return addRecord
            }

            return updateResponse
            
        }catch(error){
            throw error
        }
    }

    rechargeSuccessAddSystemSummery = async(messageQueue) => {
        try{
            let { amount, operatorId, dateTime } = JSON.parse( messageQueue )
            let keyValue = {
                addBalance : {
                    key : `op_${operatorId}_sum`,
                    value : amount
                },
                addBalance1 : {
                    key : `op_${operatorId}_cou`,
                    value : 1
                },
                addBalance2 : {
                    key : `op_total_sum`,
                    value : amount
                },
                addBalance3 : {
                    key : `op_total_cou`,
                    value : 1
                }
            };
            let searchKeyVaule = {
                created_on : dateTime.slice(0, 10)
            };
            let updateResponse = await query.updateQuery(this.tableName2,keyValue,searchKeyVaule)

            if( updateResponse.affectedRows == 0 ){
                let newRecord = {
                    created_on : dateTime.slice(0, 10),
                }
                newRecord[`op_${operatorId}_cou`] = 1
                newRecord[`op_${operatorId}_sum`] = amount
                newRecord[`op_total_cou`] = 1
                newRecord[`op_total_sum`] = amount

                let addRecord = await query.createQueryUpdate( this.tableName2, newRecord)

                return addRecord
            }

            return updateResponse
        }catch(error){
            throw error
        }
    }

    rechargeFailedDeductSystemSummery = async(messageQueue) => {
        try{
            let { amount, operatorId, dateTime } = JSON.parse( messageQueue )
            let keyValue = {
                deductBalance : {
                    key : `op_${operatorId}_sum`,
                    value : amount
                },
                deductBalance1 : {
                    key : `op_${operatorId}_cou`,
                    value : 1
                },
                deductBalance2 : {
                    key : `op_total_sum`,
                    value : amount
                },
                deductBalance3 : {
                    key : `op_total_cou`,
                    value : 1
                }
            };
            let searchKeyVaule = {
                created_on : dateTime.slice(0, 10)
            };
            let updateResponse = await query.updateQuery(this.tableName2,keyValue,searchKeyVaule)

            if( updateResponse.affectedRows == 0 ){
                sendMessage('rechargeFailedDeductSystemSummery',messageQueue,(err,msg)=>{
                    if(err) console.log(err)
                })
                console.error(`Summery report update [${dateTime}] [${operatorId}] [${amount}] failed`)
            }

            return updateResponse
        }catch(error){
            throw error
        }
    }

    processedStockTransfer = async ( messageQueue ) => {
        try{
            let { userId, amount, comm, dateTime } = JSON.parse( messageQueue )
            let keyValue = {
                addBalance1 : {
                    key : `stock_txn_sum`,
                    value : amount
                },
                addBalance2 : {
                    key : `stock_txn_count`,
                    value : 1
                },
                addBalance3 : {
                    key : `debit_sum`,
                    value : Number(amount) + Number(comm)
                },
                addBalance4 : {
                    key : `debit_txn_count`,
                    value : 1
                }
            };
            let searchKeyVaule = {
                userid : userId,
                created_on : dateTime.slice(0, 10)
            };
            let updateResponse = await query.updateQuery(this.tableName1,keyValue,searchKeyVaule)

            if( updateResponse.affectedRows == 0 ){
                let newRecord = {
                    userid : userId,
                    created_on : dateTime.slice(0, 10),
                }
                newRecord[`stock_txn_sum`] = amount
                newRecord[`stock_txn_count`] = 1
                newRecord[`debit_sum`] = Number(amount) + Number(comm)
                newRecord[`debit_txn_count`] = 1
                let addRecord = await query.createQueryUpdate( this.tableName1, newRecord)

                return addRecord
            }

            return updateResponse

        }catch(error){
            throw error
        }
    }

    processedStockSend = async ( messageQueue ) => {
        try{
            let { userId, amount, dateTime } = JSON.parse( messageQueue )
            let keyValue = {
                addBalance1 : {
                    key : `debit_sum`,
                    value : amount
                },
                addBalance2 : {
                    key : `debit_txn_count`,
                    value : 1
                }
            };
            let searchKeyVaule = {
                userid : userId,
                created_on : dateTime.slice(0, 10)
            };
            let updateResponse = await query.updateQuery(this.tableName1,keyValue,searchKeyVaule)

            if( updateResponse.affectedRows == 0 ){
                let newRecord = {
                    userid : userId,
                    created_on : dateTime.slice(0, 10),
                }
                newRecord[`debit_sum`] = amount
                newRecord[`debit_txn_count`] = 1
                let addRecord = await query.createQueryUpdate( this.tableName1, newRecord)

                return addRecord
            }

            return updateResponse

        }catch(error){
            throw error
        }
    }

    processedStockReceived = async ( messageQueue ) => {
        try{
            let { userId, amount, dateTime } = JSON.parse( messageQueue )
            let keyValue = {
                addBalance1 : {
                    key : `credit_sum`,
                    value : amount
                },
                addBalance2 : {
                    key : `credit_txn_count`,
                    value : 1
                }
            };
            let searchKeyVaule = {
                userid : userId,
                created_on : dateTime.slice(0, 10)
            };
            let updateResponse = await query.updateQuery(this.tableName1,keyValue,searchKeyVaule)

            if( updateResponse.affectedRows == 0 ){
                let newRecord = {
                    userid : userId,
                    created_on : dateTime.slice(0, 10),
                }
                newRecord[`credit_sum`] = amount
                newRecord[`credit_txn_count`] = 1
                let addRecord = await query.createQueryUpdate( this.tableName1, newRecord)

                return addRecord
            }

            return updateResponse

        }catch(error){
            throw error
        }
    }

    
}

module.exports = new summerReport();