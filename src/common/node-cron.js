const cron = require('node-cron');
const sqlQuery = require('./sqlQuery.common')
const dbConnection = require('../db/db-connection')
const dbConnectionReplica = require('../db/db-connection-replica')
const { start,sendMessage,createWorker } = require('./rabbitmq.common')
const stockController = require('../controllers/stock.controller')

// configer env
const dotenv = require('dotenv');
dotenv.config()

class cronCommon { 

    tableName1 = 'er_login'
    tableName2 = 'er_recharge'
    tableName3 = 'er_monthly_recharge'
    tableName4 = 'er_wallet_transaction'
    tableName5 = `er_prepaid_commission`
    tableName6 = 'er_wallet'

    constructor() {

        if(process.env.START_NODE_CRON_WORKER == 1 ){
            // this.startConsoleLogCron()
            // this.dailyRechargeReportGenerator()
            this.inActiveAgentNoActivity()
            // this.transferRewardsToAgent()
        }
    }

    startConsoleLogCron = () =>{
        try{
            // corn run every day at 01:01 code : (1 1 * * *), refer : https://crontab.guru/#1_1_*_*_*
            cron.schedule('* * * * *', () => {
                console.log('cron log working : ', new Date());
            })

        }catch(error){
            console.log(error);
        }
    }

    // generate daily topup report for all users
    dailyRechargeReportGenerator = async() =>{ 
        try{
                console.log('CRON-1 : Job will be started soon')

                // corn run every day at 01:01 code : (1 1 * * *), refer : https://crontab.guru/#1_1_*_*_*                  
                cron.schedule('1 1 * * *', async () => {
                    try{
                        // get the daily recharge report
                        let dt = new Date()
                        dt = dt.setDate(dt.getDate() - 1)
                        dt = new Date(dt).toISOString().slice(0, 19).replace('T', ' ') //dt current date time
                        
                        console.log('job start');
                        
                        let useridList = [],finalList = []
                        useridList,finalList = await this.dailyRechargeReportmaker(1,dt,useridList,finalList)
                        useridList,finalList = await this.dailyRechargeReportmaker(2,dt,useridList,finalList)
                        useridList,finalList = await this.dailyRechargeReportmaker(3,dt,useridList,finalList)
                        useridList,finalList = await this.dailyRechargeReportmaker(4,dt,useridList,finalList)
                        useridList,finalList = await this.dailyRechargeReportmaker(5,dt,useridList,finalList)
                        
                        console.log('all set')
                        
                        if(finalList.length > 0){
                            let insertResult = await sqlQuery.multiInsert(this.tableName3,finalList)
                            console.log('CRON-1 : Job done, data added in table')
                        }else{
                            console.log('CRON-1 : Job done, no data added in table')
                        }
                        
                    }catch(error){
                        console.log('CORN-1 : Job have some interal error');
                        console.log(error);
                    }
                })
        }catch(error){
            console.log('CORN-1 : Job have some interal error');
            console.log(error);
        }
    }

    async dailyRechargeReportmaker (oper_id,date,useridList,finalList) {
        let sql = `SELECT userid, SUM(AMOUNT) AS amount 
        FROM ${this.tableName2} 
        WHERE status = 2 AND CAST('${date}' AS Date) = CAST(created_on AS Date) AND operator_id = ${oper_id}
        GROUP BY userid ORDER BY userid ASC`
        let table = await dbConnectionReplica.query(sql);
        // console.log(oper_id);
        // for table
        let i,ind
        for (i=0; i<table.length; i++){
            if (useridList.includes(table[i].userid)){
                //update that values
                ind = useridList.indexOf(table[i].userid)
                console.log(finalList,useridList,ind)
                finalList[ind]['oper_'+oper_id] = table[i].amount
            }else{
                //add that values
                useridList.push(table[i].userid)
                finalList.push({ 
                    userid : table[i].userid,
                    date : date,
                    oper_1 : oper_id == 1 ? table[i].amount : 0,
                    oper_2 : oper_id == 2 ? table[i].amount : 0,
                    oper_3 : oper_id == 3 ? table[i].amount : 0,
                    oper_4 : oper_id == 4 ? table[i].amount : 0,
                    oper_5 : oper_id == 5 ? table[i].amount : 0
                })
            }
        }

        return (useridList,finalList)
    }

    // cron to distribute rewards for post paid agent
    inActiveAgentNoActivity = async() => {
        try{

            // run cron every day https://crontab.guru/#10_0_*_*_*
            console.log('[Node Cron] : inActiveAgentNoActivity : starting soon')
            cron.schedule(process.env.NODE_CRON_INACTIVE_AGENT_SCHADULE, async () => {
                try{
                    // get all agent list who had not performed any transaction in last 10 daya
                    let marginDate = process.env.NODE_CRON_INACTIVE_AGENT_DAY
                    let limitDate = new Date();
                    let limitMardin = new Date().toISOString().slice(0,10);
                    limitDate.setDate(limitDate.getDate() - marginDate);
                    limitDate = limitDate.toISOString().slice(0,10);
                    // let sql = `SELECT userid, trans_date_time FROM ${this.tableName4} WHERE CAST(trans_date_time as DATE) >= '${limitDate}' GROUP BY userid`
                    let sql = `SELECT ${this.tableName1}.userid, ${this.tableName1}.username, IF ( activity_sheet.trans_date_time, activity_sheet.trans_date_time, 0 ) AS lastTxnDate FROM ${this.tableName1} LEFT JOIN ( SELECT userid, trans_date_time FROM ${this.tableName4} WHERE date(trans_date_time) >= '${limitDate}' GROUP BY userid ) AS activity_sheet ON ${this.tableName1}.userid = activity_sheet.userid WHERE date(${this.tableName1}.created_on) < '${limitDate}' order by ${this.tableName1}.userid desc `
                    
                    let listAgent = await dbConnectionReplica.query(sql);
                    if(listAgent.length > 0){
                        let updatedAgentList = []
                        // join agent id
                        listAgent.forEach((agent)=>{
                            if( agent.lastTxnDate == 0 ){
                                updatedAgentList.push(agent.userid)
                            }
                        })

                        if( updatedAgentList.length > 0 ){
                            // console.log(updatedAgentList)
                            // update agent status in db
                            sql = `UPDATE ${this.tableName1} SET user_status = 2 where userid in ( ${updatedAgentList} ) and date(last_active_date) < '${limitDate}' `
                            listAgent = await dbConnection.query(sql);

                            console.log('[Node Cron] : inActiveAgentNoActivity : update responce affectedRows: \n',listAgent.affectedRows)
                        }
                    }
                }catch(error){
                    console.log('[Node Cron] : inActiveAgentNoActivity : \n',error)
                }
            }) 
            
            // let marginDate = process.env.NODE_CRON_INACTIVE_AGENT_DAY
            // let limitDate = new Date();
            // let limitMardin = new Date().toISOString().slice(0,10);
            // limitDate.setDate(limitDate.getDate() - marginDate);
            // limitDate = limitDate.toISOString().slice(0,10);
            // // let sql = `SELECT userid, trans_date_time FROM ${this.tableName4} WHERE CAST(trans_date_time as DATE) >= '${limitDate}' GROUP BY userid`
            // let sql = `SELECT ${this.tableName1}.userid, ${this.tableName1}.username, IF ( activity_sheet.trans_date_time, activity_sheet.trans_date_time, 0 ) AS lastTxnDate FROM ${this.tableName1} LEFT JOIN ( SELECT userid, trans_date_time FROM ${this.tableName4} WHERE date(trans_date_time) >= '${limitDate}' GROUP BY userid ) AS activity_sheet ON ${this.tableName1}.userid = activity_sheet.userid WHERE date(${this.tableName1}.created_on) < '${limitDate}' order by ${this.tableName1}.userid desc `
            
            // let listAgent = await dbConnectionReplica.query(sql);
            // if(listAgent.length > 0){
            //     let updatedAgentList = []
            //     // join agent id
            //     listAgent.forEach((agent)=>{
            //         if( agent.lastTxnDate == 0 ){
            //             updatedAgentList.push(agent.userid)
            //         }
            //     })

            //     if( updatedAgentList.length > 0 ){
            //         // console.log(updatedAgentList)
            //         // update agent status in db
            //         sql = `UPDATE ${this.tableName1} SET user_status = 2 where userid in ( ${updatedAgentList} ) and date(last_active_date) < '${limitDate}' `
            //         listAgent = await dbConnection.query(sql);

            //         console.log('[Node Cron] : inActiveAgentNoActivity : update responce affectedRows: \n',listAgent.affectedRows)
            //     }
            // }

        }catch(error){
            console.log('[Node Cron] : inActiveAgentNoActivity : \n',error)
        }
    }

    // node cron distribute comission evey mounth
    transferRewardsToAgent = async() =>{
        try{
            // run cron on first day of every month
            console.log('[Node Cron] : transferRewardsToAgent : starting soon')
            cron.schedule(process.env.NODE_CRON_REWARD_DISTRIBUTION, async () => {
                try{
                    // // get all agent list with reward and target details
                    // let sql = `SELECT userCommissionDetails.userid, userCommissionDetails.sender_uuid, userCommissionDetails.reciever_uuid, 
                    //             er_slab_manager.wallet1_target_status AS targetStatus1, er_slab_manager.wallet1_target AS targetAmount1, er_slab_manager.wallet1_reward AS targetReward1,
                    //             er_slab_manager.wallet2_target_status AS targetStatus2, er_slab_manager.wallet2_target AS targetAmount2, er_slab_manager.wallet2_reward AS targetReward2,
                    //             er_slab_manager.wallet3_target_status AS targetStatus3, er_slab_manager.wallet3_target AS targetAmount3, er_slab_manager.wallet3_reward AS targetReward3,
                    //             er_slab_manager.wallet4_target_status AS targetStatus4, er_slab_manager.wallet4_target AS targetAmount4, er_slab_manager.wallet4_reward AS targetReward4,
                    //             er_slab_manager.wallet5_target_status AS targetStatus5, er_slab_manager.wallet5_target AS targetAmount5, er_slab_manager.wallet5_reward AS targetReward5  
                    //             FROM ( SELECT userDetails.userid AS userid, userDetails.reciever_uuid, userDetails.sender_uuid, er_postpaid_commission.slab_uuid AS slab_uuid, er_postpaid_commission.slab_name AS slab_name FROM (SELECT parentDetails.userid AS userid, parentDetails.user_uuid AS reciever_uuid, CAST(er_login.user_uuid AS CHAR(16)) AS sender_uuid  FROM ( SELECT userid, cast(user_uuid AS CHAR(16)) AS user_uuid, parent_id FROM er_login where Active = 1 AND user_status = 1 AND comm_type = 2 ) AS parentDetails JOIN er_login on parentDetails.parent_id = er_login.userid ) AS userDetails JOIN er_postpaid_commission ON userDetails.userid = er_postpaid_commission.userid) AS userCommissionDetails JOIN er_slab_manager on er_slab_manager.slab_uuid = userCommissionDetails.slab_uuid ; `
                    // let agentCommissionList = await dbConnection.query(sql);
                    // if(agentCommissionList.length > 0){

                    // }

                    // get all agent list with reward and target details
                    let sql = `SELECT userCommissionDetails.userid AS userid, userCommissionDetails.sender_uuid AS sender_uuid, userCommissionDetails.senderId AS senderId, userCommissionDetails.senderName AS senderName, userCommissionDetails.senderMobile AS senderMobile, userCommissionDetails.senderUserName AS senderUserName, userCommissionDetails.region_id AS region_id, userCommissionDetails.usertype_id as usertype_id, userCommissionDetails.reciever_uuid AS reciever_uuid, 
                    er_slab_manager.wallet1_target_status AS targetStatus1, er_slab_manager.wallet1_target AS targetAmount1, er_slab_manager.wallet1_reward AS targetReward1,
                    er_slab_manager.wallet2_target_status AS targetStatus2, er_slab_manager.wallet2_target AS targetAmount2, er_slab_manager.wallet2_reward AS targetReward2,
                    er_slab_manager.wallet3_target_status AS targetStatus3, er_slab_manager.wallet3_target AS targetAmount3, er_slab_manager.wallet3_reward AS targetReward3,
                    er_slab_manager.wallet4_target_status AS targetStatus4, er_slab_manager.wallet4_target AS targetAmount4, er_slab_manager.wallet4_reward AS targetReward4,
                    er_slab_manager.wallet5_target_status AS targetStatus5, er_slab_manager.wallet5_target AS targetAmount5, er_slab_manager.wallet5_reward AS targetReward5  
                    FROM ( SELECT userDetails.userid AS userid, userDetails.reciever_uuid, userDetails.senderId AS senderId, userDetails.senderName AS senderName, userDetails.senderMobile AS senderMobile, userDetails.senderUserName AS senderUserName, userDetails.region_id AS region_id, userDetails.usertype_id as usertype_id, userDetails.sender_uuid, er_postpaid_commission.slab_uuid AS slab_uuid, er_postpaid_commission.slab_name AS slab_name 
                    FROM ( SELECT parentDetails.userid AS userid, parentDetails.user_uuid AS reciever_uuid, CAST(er_login.user_uuid AS CHAR(16)) AS sender_uuid, er_login.userid as senderId, er_login.full_name AS senderName, er_login.mobile AS senderMobile, er_login.username AS senderUserName, er_login.region_id As region_id, er_login.usertype_id as usertype_id  
                    FROM ( SELECT userid, cast(user_uuid AS CHAR(16)) AS user_uuid, parent_id FROM er_login where Active = 1 AND user_status = 1 AND comm_type = 2 ) AS parentDetails 
                    JOIN er_login on parentDetails.parent_id = er_login.userid ) AS userDetails JOIN er_postpaid_commission ON userDetails.userid = er_postpaid_commission.userid) AS userCommissionDetails JOIN er_slab_manager on er_slab_manager.slab_uuid = userCommissionDetails.slab_uuid ; `
                    let agentCommissionList = await dbConnectionReplica.query(sql);

                    let userCommission = {}
                    let userList = []

                    if(agentCommissionList.length > 0){
                        agentCommissionList.forEach((agentCommission)=>{
                            if( agentCommission.targetStatus1 == 1 || agentCommission.targetStatus2 == 1 || agentCommission.targetStatus3 == 1 || agentCommissionList.targetStatus4 == 1 || agentCommissionList.targetStatus5 == 1){
                                if(agentCommission.targetAmount1 > 0 || agentCommission.targetReward1 > 0 ||
                                    agentCommission.targetAmount2 > 0 || agentCommission.targetReward2 > 0||
                                    agentCommission.targetAmount3 > 0 || agentCommission.targetReward3 > 0||
                                    agentCommission.targetAmount4 > 0 || agentCommission.targetReward4 > 0||
                                    agentCommission.targetAmount5 > 0 || agentCommission.targetReward5 > 0 ){
                                        userList.push( agentCommission.userid )
                                        userCommission[agentCommission.userid] = {
                                            senderId : agentCommission.senderId,
                                            senderMobile : agentCommission.senderMobile,
                                            senderName : agentCommission.senderName,
                                            senderUserName : agentCommission.senderUserName,
                                            usertype_id : agentCommission.usertype_id,
                                            region_id : agentCommission.region_id ,
                                            sender_uuid : agentCommission.sender_uuid,
                                            reciever_uuid : agentCommission.reciever_uuid,
                                            targetAmount1 : agentCommission.targetAmount1,
                                            targetReward1 : agentCommission.targetReward1,
                                            targetAmount2 : agentCommission.targetAmount2,
                                            targetReward2 : agentCommission.targetReward2,
                                            targetAmount3 : agentCommission.targetAmount3,
                                            targetReward3 : agentCommission.targetReward3,
                                            targetAmount4 : agentCommission.targetAmount4,
                                            targetReward4 : agentCommission.targetReward4,
                                            targetAmount5 : agentCommission.targetAmount5,
                                            targetReward5 : agentCommission.targetReward5,
                                        }
                                    } 
                            }
                        })

                        // get all agent recharge amount in this month
                        let startDate = new Date();
                        let endDate = new Date().toISOString().slice(0,10);
                        // startDate.setDate(startDate.getDate());
                        startDate.setMonth(startDate.getMonth() - 1);
                        startDate = startDate.toISOString().slice(0,10);
                        // sql = `SELECT userid, oper_Ind_1, oper_Ind_2, oper_Ind_3, oper_Ind_4, oper_Ind_5 FROM ${this.tableName3} WHERE date BETWEEN '${startDate}' AND '${endDate}'`  // userid IN (${userList.join(',')})
                        sql = `SELECT rechargeDetails.userid AS userid ,SUM(rechargeDetails.oper_Ind_1) AS oper_Ind_1, SUM(rechargeDetails.oper_Ind_2) AS oper_Ind_2, SUM(rechargeDetails.oper_Ind_3) AS oper_Ind_3, SUM(rechargeDetails.oper_Ind_4) AS oper_Ind_4, SUM(rechargeDetails.oper_Ind_5) AS oper_Ind_5 FROM ( SELECT userid, oper_Ind_1, oper_Ind_2, oper_Ind_3, oper_Ind_4, oper_Ind_5 FROM ${this.tableName3} WHERE userid IN (${userList.join(',')}) AND date BETWEEN '${startDate}' AND '${endDate}') AS rechargeDetails GROUP BY rechargeDetails.userid`
                        let rechargeAmountList = await dbConnectionReplica.query(sql);

                        rechargeAmountList.forEach(async(rechargeAmount)=>{
                            if(userCommission[rechargeAmount.userid]){
                                let recieverSenderDetaile = userCommission[rechargeAmount.userid]
                                let rewardAmount = 0
                                if( rechargeAmount.oper_Ind_1 >= recieverSenderDetaile.targetAmount1 ) rewardAmount = rewardAmount + recieverSenderDetaile.targetReward1
                                if( rechargeAmount.oper_Ind_2 >= recieverSenderDetaile.targetAmount2 ) rewardAmount = rewardAmount + recieverSenderDetaile.targetReward2
                                if( rechargeAmount.oper_Ind_3 >= recieverSenderDetaile.targetAmount3 ) rewardAmount = rewardAmount + recieverSenderDetaile.targetReward3
                                if( rechargeAmount.oper_Ind_4 >= recieverSenderDetaile.targetAmount4 ) rewardAmount = rewardAmount + recieverSenderDetaile.targetReward4
                                if( rechargeAmount.oper_Ind_5 >= recieverSenderDetaile.targetAmount5 ) rewardAmount = rewardAmount + recieverSenderDetaile.targetReward5
                                
                                if( rewardAmount > 0){
                                    let details = {
                                        id : 1, // sender userid
                                        reciever_uuid : recieverSenderDetaile.reciever_uuid, // reciever userid
                                        userid : recieverSenderDetaile.senderId , // sender userdi 
                                        name :  recieverSenderDetaile.senderName ,// sender name
                                        mobile : recieverSenderDetaile.senderMobile ,//sender mobile
                                        amount : Number(rewardAmount),//samount to send
                                        user_uuid : recieverSenderDetaile.sender_uuid, // sender user uuid
                                        username : recieverSenderDetaile.senderUserName , // sender username
                                        region_id : recieverSenderDetaile.usertype_id == 0 ? 0 : recieverSenderDetaile.region_id, // sender region id
                                        type : recieverSenderDetaile.usertype_id == 0 ? 'Admin' : recieverSenderDetaile.usertype_id, // sender type
                                        ip_address : 0,
                                        mac_address : 0,
                                        os_details : 0,
                                        imei_no : 0,
                                        gcm_id : 0,  // to send notification
                                        app_version : 0,  // our app version
                                        source : 0,  // 1: web, 2 : app
                                        senderTxnMessage : 'Reward send to child',
                                        recieverTxnMessage : 'Reward received from parent',
                                    }
            
                                    let transferStocksResponce = await stockController.processStockTransfer(details)
                                    // console.log(transferStocksResponce)
                                }
                            }
                        })
                    }

                }catch(error){
                    console.log('[Node Cron] : transferRewardsToAgent : \n',error)
                }
            })

        }catch(error){
            console.log('[Node Cron] : transferRewardsToAgent : \n',error)
        }
    }    

}

module.exports = new cronCommon();