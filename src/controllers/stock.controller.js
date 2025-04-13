const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const varRandomString = require('../utils/randomString.utils');

const commonQueryCommon = require('../common/commonQuery.common')
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const stockModule = require('../models/stock.module')

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');

const smsFunction = require('../common/smsFunction.common')

const redisMaster = require('../common/master/radisMaster.common')

// const { toIsoString } = require('../common/timeFunction.common')

const { start,sendMessage,createWorker } = require('../common/rabbitmq.common')

const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

const awsURL = process.env.AWS_path

const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)

const awsCommon = require('../common/awsS3.common')

const userList = require('../utils/userRoles.utils')

class stockController {

    //table name
    tableName1 = 'er_wallet'
    tableName2 = 'er_wallet_transaction'
    tableName3 = 'er_agent_contact'
    tableName4 = 'er_login'
    tableName5 = 'er_wallet_transfer_individual'
    tableName6 = 'er_wallet_purchase'
    tableName7 = 'er_prepaid_commission'
    tableName8 = 'er_access_status'
    tableName9 = 'er_pre_paid_commission_amount'
    tableName10 = 'er_commission_amount'
    tableName14 = 'er_agent_stock_transfer_channel'

    //function to display agent by user id,name,number from er agent contact table
    getAgentDetials = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('stock/getAgentDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            //1)- get user name and mobile number
            // var offset = req.query.start
            // var limit = req.query.end - offset

            var searchKeyValue = {
                parent_id : req.body.user_detials.userid,
                Active : 1
            }

            if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            //optional serach parameter to check 
            if (req.query.user_id) searchKeyValue.username = req.query.user_id // str user_uuid
            if (req.query.name) searchKeyValue.full_name = req.query.name // str name
            if (req.query.number) searchKeyValue.mobile = req.query.number // int number

            //check for param it should contain atleast one object
            if (Object.keys(searchKeyValue).length === 0) searchKeyValue.parent_id = req.body.user_detials.userid

            let lisTotalRecords = await stockModule.getUserWithBalanceCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            const lisResult = await stockModule.getUserWithBalance(searchKeyValue, limit, offset)
            // console.log(lisResult)

            var finalResult = lisResult.map((result)=>{
                var {commission_value,balance,...other} = result
                other.balance = balance == null ? 0 : balance
                other.commPer = commission_value ? commission_value : 0
                return other
            })
            if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin){
                // if(lisResult.length == 0) return res.status(204).send({message: 'user not found'});
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(finalResult)
                }else{
                    res.status(200).send({
                        reportList : finalResult,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }
            }else{
                // get agent balacne
                var searchKeyValue = {
                    userid: req.body.user_detials.userid //str reciever_uuid
                }
                var key = ["ex_wallet AS wallet"]
                var orderby = "wallet_id"
                var ordertype = "ASC"

                // fire sql query to get reciever balance
                const lisResponce2 = await sqlQueryReplica.searchQueryTran(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

                res.status(200).send({
                    avaliableBalance : lisResponce2[0].wallet || 0, 
                    agentDetails : finalResult,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
                // res.status(200).send(finalResult)
            }

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to transfer storck 
    transferStock = async(req, res, next) => {
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('stock/transferStock',JSON.stringify(req.body), JSON.stringify(req.query))
            // console.log(req.body)

            let data = {
                id : req.body.user_detials.id,
                reciever_uuid : req.body.reciever_uuid, // str
                userid :  req.body.user_detials.userid, //str
                name :  req.body.user_detials.name,
                mobile : req.body.user_detials.mobile,
                amount : req.body.amount,
                user_uuid : req.body.user_detials.user_uuid,
                username : req.body.user_detials.username,
                region_id : req.body.user_detials.region_id,
                type : req.body.user_detials.type, // userList
                ip_address :req.body.userIpAddress ?  req.body.userIpAddress : 0,
                mac_address : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                os_details : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                imei_no : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                gcm_id : req.body.userGcmId ?  req.body.userGcmId : 0,  // to send notification
                app_version : req.body.userAppVersion ?  req.body.userAppVersion : 0,  // our app version
                source : req.body.userApplicationType ?  req.body.userApplicationType : 0,  // 1: web, 2 : app
                checkParent : 1
            }

            let stockTransferStatus = await sqlQuery.searchQueryNoCon(this.tableName8,['stock_transfer'],'stock_transfer', 'ASC', 1, 0)
            if(stockTransferStatus.length == 0 || stockTransferStatus[0].stock_transfer == 0) return res.status(400).json({ errors: [ {msg : 'Stock transfer is not allowed for a while'}] });// return {status : 400, message : 'Stock transfer is not allowed for a while.'}

            let processResponce = await this.processStockTransfer(data)

            // console.log(processResponce)

            if(processResponce.status == 200){
                res.status(200).send({message : processResponce.message})
            }else{
                res.status(400).json({ errors: [ {msg : processResponce.message}] });
            }


        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    processStockTransfer = async (data) => {
        try {

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //transation variables
            const dtCurrentDate = date // dt current date time
            const strDate = dtCurrentDate.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
            const strUniqueNumber = data.transactionId ? data.transactionId : await dataBaseId(dtCurrentDate) //str unique number

            if(data.reciever_uuid == data.user_uuid) return {status : 400, message : 'Reciever and sender id cant be same.'}
            
            // check if stock transfer is allowed or not
                // let stockTransferStatus = await sqlQuery.searchQueryNoCon(this.tableName8,['stock_transfer'],'stock_transfer', 'ASC', 1, 0)
                // if(stockTransferStatus.length == 0 || stockTransferStatus[0].stock_transfer == 0) return {status : 400, message : 'Stock transfer is not allowed for a while.'}

            //1)- search for sender and reciever details
                var searchKeyValue = {
                    user_uuid: data.reciever_uuid, //str reciever uuid
                    Active : 1
                }
                // console.log(searchKeyValue);
                var key = ["username","userid","parent_id","CAST(user_uuid AS CHAR(16)) AS user_uuid","comm_type","region_id",'full_name','mobile','usertype_id','prefer_lang','user_status']
                var orderby = "userid"
                var ordertype = "ASC"

                const lisResponce4 = await sqlQuery.searchQuery(this.tableName4, searchKeyValue, key, orderby, ordertype, 1, 0)
                // console.log(lisResponce4)
                if(lisResponce4.length == 0) return {status : 400, message : 'reciever account not found.'}
                if(lisResponce4[0].user_status != 1) return {status : 400, message : 'Receiver account is In-Active'}
                // return res.status(400).json({ errors: [ {msg : "reciever account not found"}] });
                // console.log(lisResponce4)
                //assign values of proper variable
                
                if(data.checkParent == 1 && lisResponce4[0].parent_id != data.userid) return {status : 400, message : 'Stock transfer to direct child is only allowed'}
               
                var intSenderId = data.userid
                var strSenderName =  data.username
                var intRecieverId = lisResponce4[0].userid
                var strRecieverName = lisResponce4[0].username
                var intRecieverCommissionType = lisResponce4[0].comm_type

                let checkLastTransaction = await sqlQuery.searchQuery(this.tableName5, {
                    sender_id : intSenderId,
                    reciever_id : intRecieverId,
                    transfer_amt : Number(data.amount),
                    timeDifferent : {
                        key : 'created_on',
                        value : strDate,
                        diff : process.env.STOCK_TRANSFER_TIME_LIMIT
                    }

                },['COUNT(1)'],'id','DESC',1,0)

                if(checkLastTransaction[0]['COUNT(1)'] > 0) return {status : 400, message : `Same Transaction done within ${process.env.STOCK_TRANSFER_TIME_LIMIT} min`}

                // console.log(intSenderId,strSenderName,intRecieverId,strRecieverName)
            // 1.1)- if pre paid then add commission in the transfer amount
                if(intRecieverCommissionType == 0) return {status : 400, message : 'Agent commission not set, please set commission first'}
                // return res.status(400).json({ errors: [ {msg : "Agent commission not set, please set commission first"}] });
                if(intRecieverCommissionType == 1){
                    var commissionVal = await sqlQuery.searchQuery(this.tableName7,{user_uuid: data.reciever_uuid},["commission_value"],"userid","ASC",1,0)
                    commissionVal = commissionVal.length > 0 ? commissionVal[0].commission_value : 0
                }
                let commissionAmt = intRecieverCommissionType == 1 ? ((commissionVal/100)*Number(data.amount)) : 0
                if (data.rollbackStatus == 1) commissionAmt = 0
            //2)- check/update wallet transaction status
                //2.1)- update status for sender
                // sql query variables for sender
                var param = {
                    canTransfer: 0
                }
                var searchKeyValue = {
                        user_uuid: data.user_uuid, //str user_uuid
                        canTransfer: 1
                    }
                    // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);
                // checking sql responce
                if (!objResponce) {
                    return {status : 400, message : 'status update error'}
                }
                var { affectedRows, changedRows, info } = objResponce;
                // generating proper message
                if (!affectedRows) return {status : 400, message : 'Earlier transaction under process.'}
                // return res.status(400).json({ errors: [ {msg : 'sender account not found'}] });
                if (!(affectedRows && changedRows)) return {status : 400, message : 'Earlier transaction under process.'}
                // return res.status(200).send({ message: 'earlier transation under process' })

                //2.2)- update status for reciever 
                // sql query variable for reciever
                var param = {
                    canTransfer: 0
                }
                var searchKeyValue = {
                    user_uuid: data.reciever_uuid, //str user_uuid
                    canTransfer: 1
                }

                // fire sql query
                var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

                // checking sql responce
                if (!objResponce) {
                    await reset(this.tableName1, data.user_uuid)
                    return {status : 400, message : 'status update error'}
                }
                var { affectedRows, changedRows, info } = objResponce;

                // generating proper message
                if (!affectedRows){
                    await reset(this.tableName1, data.user_uuid)
                    return {status : 400, message : 'Reciever transaction under process.'}
                }
                if (!(affectedRows && changedRows)) {
                    await reset(this.tableName1, data.user_uuid)
                    return {status : 400, message : 'Reciever transation under process'}
                    // return res.status(200).send({ message: 'reviever earlier transation under process' })
                }

            // 3)- start transaction
                var objResponce = await sqlQuery.specialCMD('transaction')
                if (!objResponce) {
                    await reset(this.tableName1, data.user_uuid)
                    await reset(this.tableName1, data.reciever_uuid)
                    return {status : 400, message : 'Transaction error'}
                }

            //4)- deduct money from sender wallet
                //get the sender balance
                var searchKeyValue = {
                    user_uuid: data.user_uuid
                }
                var key = ["ex_wallet AS wallet", "min_wallet", "userid"]
                var orderby = "wallet_id"
                var ordertype = "ASC"

                // fire sql query to get balance
                const lisResponce1 = await sqlQuery.searchQueryTran(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

                // balance should be grater then minimum balance
                // console.log(Number(lisResponce1[0].wallet) ,data.amount,lisResponce1[0].min_wallet)
                if(lisResponce1[0].userid != 1){
                    if (lisResponce1[0].wallet - ( Number(data.amount) + commissionAmt ) < 0 ) {
                        await sqlQuery.specialCMD('rollback')
                        await reset(this.tableName1, data.user_uuid)
                        await reset(this.tableName1, data.reciever_uuid)
                        return {status : 400, message : `in sufficient balance`}
                        // return res.status(400).json({ errors: [ {msg : 'in sufficient balance'}] });
                    }

                    // get the channel access details
                    let channelList = ['Mobile','SMS','USSD','Web']
                    let channelType = channelList.includes(data.source) ? data.source : 'Web'
                    let channelLimit = await sqlQuery.searchQuery(this.tableName14,{userid : lisResponce1[0].userid, channel : channelType},['threshold','status'],'userid','ASC',1,0)        
                    if( channelLimit.length == 0 ) return ({status : 400, message : 'Channel limit not found' })
                    // console.log(channelLimit)

                    if(channelLimit[0].status != 1){
                        var lisresponce = await sqlQuery.specialCMD('rollback')
                        await reset(this.tableName1, data.user_uuid)
                        await reset(this.tableName1, data.reciever_uuid)
                        return ({status : 400, message : `Your ${data.source} channel is In-Active.` })
                    }

                    if(Number(channelLimit[0].threshold) > Number(lisResponce1[0].wallet)- Number(Number(data.amount) + commissionAmt)){
                        var lisresponce = await sqlQuery.specialCMD('rollback')
                        await reset(this.tableName1, data.user_uuid)
                        await reset(this.tableName1, data.reciever_uuid)
                        return ({status : 400, message : `Your ${data.source} channel Threshold limit reached.` })
                    }
                }
                
                //update sender balanced
                var param = {
                    deductBalance : {
                        key : 'ex_wallet',
                        value : Number(data.amount) + commissionAmt
                    }
                    // ex_wallet: Number(lisResponce1[0].wallet) - Number(data.amount) - commissionAmt //db amount
                }
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str sender_uuid
                }

                // fire sql query
                var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

                if(!objResponce.affectedRows){
                    console.log('update error')
                }
                
            //7)- create er wallet transaction recipt for sendfer
                param = {
                    wallet_txn_uuid: "uuid()",
                    userid: lisResponce1[0].userid, // str userid
                    user_uuid: data.user_uuid, // str user_uuid
                    trans_number: strUniqueNumber, // str unique number
                    trans_date_time: strDate, // dt date
                    amount: Number(data.amount) + commissionAmt, // db amount
                    trans_type: 2, // type credit
                    narration: data.senderTxnMessage || `Wallet Transfer to ${strRecieverName}`,
                    balance_amount: lisResponce1[0].wallet - Number(data.amount) - commissionAmt, //db balance
                    trans_for: data.senderTxnMessage ? "Received rollback amount" : "Wallet Transfer"
                }
                //fire sql query
                var objResponce = await sqlQuery.createQuery(this.tableName2, param)
                if(!objResponce.insertId){
                    console.log('amount debit record error')
                }

                let messageQueue = { 
                    userId : lisResponce1[0].userid, 
                    amount : Number(data.amount),  
                    comm : commissionAmt,
                    dateTime : strDate
                }
                sendMessage('processedStockTransfer',JSON.stringify(messageQueue),(err,msg)=>{
                    if(err) console.log(err)
                })

            //5)- add money to reciever wallet 
                //get the reciever balance
                var searchKeyValue = {
                    user_uuid: data.reciever_uuid //str reciever_uuid
                }
                var key = ["ex_wallet AS wallet", "userid","comm_wallet"]
                var orderby = "wallet_id"
                var ordertype = "ASC"

                // fire sql query to get reciever balance
                const lisResponce2 = await sqlQuery.searchQueryTran(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                
                const dbReviceBalance = lisResponce2.length === 0 ? 0 : lisResponce2[0].wallet
                var strRecieverId = lisResponce2.length === 0 ? 0 : lisResponce2[0].userid

            //update reciever balanced
                var param = {
                    addBalance : { 
                        key: "ex_wallet",
                        value: Number(data.amount) + commissionAmt
                    },
                    addBalance1 : { 
                        key: "comm_wallet",
                        value:  commissionAmt
                    }
                    // ex_wallet: Number(dbReviceBalance) + Number(data.amount) + commissionAmt, //db balance
                    // comm_wallet : Number(lisResponce2[0].comm_wallet) + commissionAmt
                }
                var searchKeyValue = {
                    user_uuid: data.reciever_uuid, // str reciever user uuid
                }

                // fire sql query
                var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);
                if(!objResponce.affectedRows){
                    console.log("recierer account  not updated")
                }
            //6)- create er wallet transaction recipt for reciever
                //sql varialbles
                param = {
                        wallet_txn_uuid: "uuid()",
                        userid: strRecieverId, // str userid
                        user_uuid: data.reciever_uuid, // str userid
                        trans_number: strUniqueNumber, // str unique number
                        trans_date_time: strDate, // str date
                        amount: Number(data.amount) + commissionAmt, // db amount
                        trans_type: 1, // type debit
                        narration: data.recieverTxnMessage || `Wallet Received from ${strSenderName}`,
                        balance_amount: Number(dbReviceBalance) + Number(data.amount) + commissionAmt, //db balance amount
                        trans_for: data.recieverTxnMessage ? "Transferred Rollback amount" : "Wallet Received"
                    }
                    //fire sql query
                var objResponce = await sqlQuery.createQuery(this.tableName2, param)
                if(!objResponce.insertId){
                    console.error("reciever account recipet not created")
                }

                messageQueue = { 
                    userId : strRecieverId, 
                    amount : Number(data.amount) + commissionAmt, 
                    dateTime : strDate
                }
                sendMessage('processedStockReceived',JSON.stringify(messageQueue),(err,msg)=>{
                    if(err) console.log(err)
                })
                
            //8)- add details to er_wallet_transfer_individual table
                    
                var SenderType =  process.env.USER_id == intSenderId ? 1 : 2
            
                var param = {
                    trxn_uuid : "uuid()", // function
                    trans_number : strUniqueNumber, // str unique number
                    sender_id : intSenderId, //
                    sender_username : strSenderName,
                    reciever_id : intRecieverId,
                    reciever_username : strRecieverName,
                    transfer_amt : Number(data.amount),
                    transfer_comm : Number(commissionAmt),
                    created_by : intSenderId,
                    created_on : strDate,
                    type : SenderType,
                    rollback : data.rollbackStatus == 1 ? 1 : 0
                }

                var objResponce = await sqlQuery.createQuery(this.tableName5, param)
                if(!objResponce.insertId){
                    console.log('metual log not generated')
                }
                
            // if commission type id prepaid then add data in er_pre_paid_commission_amount
                if(intRecieverCommissionType == 1){
                    var param = {
                        userid : lisResponce4[0].userid,
                        parent_id : lisResponce4[0].parent_id,
                        transaction_id : strUniqueNumber,
                        transfer_amt : Number(data.amount),
                        commission_amt : commissionAmt,
                        comm_per : commissionVal,
                        created_on : isodate, //dt current
                    }

                    var objResponce = await sqlQuery.createQuery(this.tableName9, param)
                    
                }   

            // add activity log
                let logData = [];

            // reciever details
                logData.push({ 
                    userid : lisResponce4[0].userid,
                    username : lisResponce4[0].username,
                    user_uuid : lisResponce4[0].user_uuid,
                    full_name : lisResponce4[0].full_name,
                    mobile : lisResponce4[0].mobile ? lisResponce4[0].mobile : 0,
                    created_on : isodate,
                    user_type : lisResponce4[0].usertype_id, // 1- Admin ,2- Member
                    created_by_type : (data.type === userList.Admin || data.type === userList.SubAdmin) ?  data.id : data.userid, // userList
                    ip_address : data.ip_address,
                    mac_address : data.mac_address,
                    os_details : data.os_details,
                    imei_no : data.imei_no,
                    gcm_id : data.gcm_id,  // to send notification
                    app_version : data.app_version,  // our app version
                    source : ['','Web','Mobile','USSD','SMS'].indexOf(data.source) || 1,  // 1: web, 2 : app
                    description : data.rollbackStatus == 1 ? `Dear ${lisResponce4[0].full_name} ${strRecieverName} You have received Rollback Amount: ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN against: ${data.rechangeNumber} actual Amount: ${data.rechargeAmount} AFN, Current Bal: ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount) + commissionAmt)).toFixed(2)} AFN, Thanks for being Afghan Pay Agent` : `Dear ${lisResponce4[0].full_name} ${strRecieverName}, You received amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN from ${data.name} ${strSenderName}, Bal: ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount) + commissionAmt)).toFixed(2)} AFN TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!` , 
                    activity_type : lisResponce4[0].usertype_id == 0 ? 17 : 24 , // 1-Login;2-Change Password;3-Change Profile
                    old_value : Number(dbReviceBalance),
                    modified_value : Number(dbReviceBalance) + Number(data.amount) + commissionAmt,
                    region_id : lisResponce4[0].region_id
                });
            
            // sender derails
                logData.push({ 
                    userid : data.userid,
                    username : data.username,
                    user_uuid : data.user_uuid,
                    full_name :  data.name,
                    mobile : data.mobile,
                    created_on : isodate,
                    user_type : data.type == userList.Admin || data.type == userList.SubAdmin ? 0 : data.type, // 1- Admin ,2- Member
                    created_by_type : (data.type === userList.Admin || data.type === userList.SubAdmin) ?  data.id : data.userid, // userList
                    ip_address : data.ip_address,
                    mac_address : data.mac_address,
                    os_details : data.os_details,
                    imei_no : data.imei_no,
                    gcm_id : data.gcm_id,  // to send notification
                    app_version : data.app_version,  // our app version
                    source : ['','Web','Mobile','USSD','SMS'].indexOf(data.source) || 1,  // 1: web, 2 : app
                    description : `Dear ${data.name} ${strSenderName}, You transferred amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN to ${lisResponce4[0].full_name} ${lisResponce4[0].username}, Bal: ${parseFloat(String(lisResponce1[0].wallet - Number(data.amount) - commissionAmt)).toFixed(2)} AFN TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay ${data.type === userList.Admin || data.type === userList.SubAdmin ? (data.type === userList.Admin ? 'Admin' : 'Sub-Admin') : 'Agent'}!`, 
                    activity_type : (data.type === userList.Admin || data.type === userList.SubAdmin) ? ( data.type === userList.Admin ? 17 : 26 ) : 24, // 1-Login;2-Change Password;3-Change Profile
                    old_value : lisResponce1[0].wallet,
                    modified_value : lisResponce1[0].wallet - Number(data.amount) - commissionAmt,
                    region_id : data.region_id
                });

            // console.log(logData)

            const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:logData})
            var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                // console.log('Server Log : '+strLog)
            if(intResult != 1){
                await sqlQuery.specialCMD('rollback')
                await reset(this.tableName1, data.user_uuid)
                await reset(this.tableName1, data.reciever_uuid)
                return {status : 400, message : 'Stock transfer Failed as log adding have issue'}
                // return res.status(400).json({ errors: [ {msg : 'log error'}] });
            }

            // add data in commissiontable table
            let commissionDetails = {
                userid : lisResponce4[0].userid,
                parent_id : lisResponce4[0].parent_id,
                recharge_id : strUniqueNumber,
                operator_id : 0,
                recharge_amount : Number(data.amount),
                commission_amount : commissionAmt,
                comm_per : intRecieverCommissionType == 1 ? commissionVal : 0,
                created_on : isodate, //dt current
                status : 2,
                total_commission : commissionAmt,
                distribute_commission : commissionAmt,
            }

            let commissionResponce = await sqlQuery.createQuery(this.tableName10, commissionDetails)

            //9)- commit transaction
                var response = await sqlQuery.specialCMD('commit')

            //10)- change wallet transaction status
                //sql query variables for sender
                await reset(this.tableName1, data.user_uuid)
                await reset(this.tableName1, data.reciever_uuid)

            // if(data.source == 3 || data.source == 4){
                // send sms to reciever and sender
                if(data.type === userList.Admin || data.type === userList.SubAdmin){
                    // send sms to admin
                    // let smsDetails = {
                    //     adminId : data.id,
                    //     recieverMessage : `Dear ${data.name}, You transferred amount ${Number(data.amount) + commissionAmt} to ${lisResponce4[0].mobile || lisResponce4[0].username}, TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay ${data.type === userList.Admin ? 'Admin' : 'Sub-Admin'}!`
                    // }
                    // smsFunction.adminSms(smsDetails).then((smsFunResponce)=>{ 
                    //     if(smsFunResponce.error){
                    //         console.log('send sms error for agent : ',data.username)
                    //     }else{
                    //         console.log('sms added')
                    //     }  
                    // })
                }else{
                    // send sms to sender
                    let smsDetails = {
                        agentId : data.userid,
                        recieverMessage : `Dear ${data.name} ${strSenderName}, You transferred amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN to ${lisResponce4[0].full_name} ${lisResponce4[0].username}, Bal: ${parseFloat(String(lisResponce1[0].wallet - Number(data.amount) - commissionAmt)).toFixed(2)} AFN TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                    }
                    switch(String(data.languageType)){
                        case '2' : // Pashto
                            smsDetails.recieverMessage = `ښاغلی ${data.name}! تاسو په ${lisResponce4[0].full_name} ${lisResponce4[0].username} حساب کې ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} افغانۍ اضافه کړې، ستاسو پاتې کریډیټ ${parseFloat(String(lisResponce1[0].wallet - Number(data.amount) - commissionAmt)).toFixed(2)} افغانۍ دی. مننه، افغان پی.`
                            break;
                        case '3' : // Dari
                            smsDetails.recieverMessage = `محترم ${data.name}! شما مبلغ ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} افغانی را به حساب ${lisResponce4[0].full_name} ${lisResponce4[0].username} اضافه نمودید، کریدیت باقیمانده شما ${parseFloat(String(lisResponce1[0].wallet - Number(data.amount) - commissionAmt)).toFixed(2)} افغانی است. تشکر، افغان پی.`
                            break;
                        case '1': // english
                        default :
                            smsDetails.recieverMessage = `Dear ${data.name} ${strSenderName}, You transferred amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN to ${lisResponce4[0].full_name} ${lisResponce4[0].username}, Bal: ${parseFloat(String(lisResponce1[0].wallet - Number(data.amount) - commissionAmt)).toFixed(2)} AFN TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                            break;
                    }
                    smsFunction.agentSms(smsDetails, data.mobile).then((smsFunResponce)=>{ 
                        if(smsFunResponce.error){
                            // console.log('send sms error for agent : ',data.username)
                        }else{
                            // console.log('sms added')
                        }  
                    })
                }
                let smsDetails

                if(data.rollbackStatus == 1){
                    smsDetails = {
                        agentId :  lisResponce4[0].userid,
                        recieverMessage : `Dear ${lisResponce4[0].full_name} ${strRecieverName} You have received Rollback Amount: ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN against: ${data.rechangeNumber} actual Amount: ${data.rechargeAmount} AFN, Current Bal: ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount) + commissionAmt)).toFixed(2)} AFN, Thanks for being Afghan Pay Agent`
                        // `Dear ${lisResponce4[0].full_name}, You received amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN from ${data.name}, TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                    }
                }else{
                    // send sms to reciever
                    smsDetails = {
                        agentId :  lisResponce4[0].userid,
                        recieverMessage : `Dear ${lisResponce4[0].full_name} ${strRecieverName}, You received amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN from ${data.name} ${strSenderName}, Bal: ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount) + commissionAmt)).toFixed(2)} AFN TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                    }
                    switch(String(lisResponce4[0].prefer_lang)){
                        case '2' : // Pashto
                            smsDetails.recieverMessage = `ښاغلی ${lisResponce4[0].full_name}! تاسو په اندازه ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} افغانۍ له ${data.name} څخه ترلاسه کړې. ستاسو د حساب اوسنی کریډیټ ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount) + commissionAmt)).toFixed(2)} افغانی دی. مننه، افغان پی.`
                            break;
                        case '3' : // Dari
                            smsDetails.recieverMessage = `محترم ${lisResponce4[0].full_name}!  شما به مقدار ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} افغانی از ${data.name} دریافت نمودید، کریدیت فعلی حساب شما ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount) + commissionAmt)).toFixed(2)} افغانی است. تشکر، افغان پی.`
                            break;
                        case '1': // english
                        default :
                            smsDetails.recieverMessage = `Dear ${lisResponce4[0].full_name} ${strRecieverName}, You received amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN from ${data.name} ${strSenderName}, Bal: ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount) + commissionAmt)).toFixed(2)} AFN TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                            break;
                    }
                }

                
                smsFunction.agentSms(smsDetails).then((smsFunResponce)=>{ 
                    if(smsFunResponce.error){
                        // console.log('send sms error for agent : ',lisResponce4[0].username)
                    }else{
                        // console.log('sms added')
                    }  
                })
            // }
            // res.status(200).send({ message: 'money transfer sucessfully' })
            return ({status : 200, message : 'money transfer sucessfully.',transactionId : strUniqueNumber, recieverNumber : lisResponce4[0].mobile, closingBalance : lisResponce1[0].wallet - Number(data.amount) - commissionAmt})

        } catch (error) {
            console.log(error);
            await sqlQuery.specialCMD('rollback')
            await reset(this.tableName1, data.user_uuid)
            await reset(this.tableName1, data.reciever_uuid)
            return {status : 400, message : 'function error'}
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    adminStockTransferReport = async ( req, res, next) =>{
        try{
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0
                // console.log('stock/adminStockTransferReport',JSON.stringify(req.body), JSON.stringify(req.query))
                // console.log(req.query)
            // search parameter
                // var offset = req.query.start
                // var limit = req.query.end - offset
                var searchKeyValue = {
                    sender_id : req.body.user_detials.userid, //str
                    rollback : 0
                }

                if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                    // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                    if(req.body.user_detials.region_list.length != 7){
                        searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    // searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
                }

            // check date for start and end 
                if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

                if (req.query.startDate) {
                    searchKeyValue.start_date = req.query.startDate //dt start date
                }
                if (req.query.endDate) {
                    searchKeyValue.end_date = req.query.endDate //dt end date
                }
            //other optional parameter
                if(req.query.name) searchKeyValue.full_name = req.query.name //str
                if(req.query.user_id) searchKeyValue.username = req.query.user_id
                if(req.query.user_type_uuid){
                    var responce = await commonQueryCommon.getAgentTypeId(req.query.user_type_uuid)
                    if(!responce) return res.status(400).json({ errors: [ {msg : "Agent Type not found"}] });
                    searchKeyValue.usertype_id = responce[0].agent_type_id
                }
                if(req.query.mobile) searchKeyValue.mobile = req.query.mobile
                if(req.query.amount) searchKeyValue.transfer_amt = req.query.amount
                // console.log(searchKeyValue)
                // console.log(Object.keys(searchKeyValue).length)
                if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : "Search Parameter are not proper"}] });

                const lisTotalRecords = await stockModule.adminStocksDetialsCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                const lisResult = await stockModule.adminStocksDetials(searchKeyValue, limit, offset)
                
                // if(lisResult.length === 0) return res.status(204).send({message:"no transactions found"})
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResult)
                }else{
                    res.status(200).send({
                        reportList : lisResult,
                        totalTransactionAmount : lisTotalRecords[0].transactionAmount || 0,
                        totalCommissionAmount : lisTotalRecords[0].commissionAmount || 0,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    stockRecievedReport = async (req,res) =>{ 
        try{

            const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('stock/StockRecievedReport',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

                // console.log(req.query)
            // search parameter
                // var offset = req.query.start
                // var limit = req.query.end - offset
                var searchKeyValue = {
                    reciever_id : req.body.user_detials.userid,
                    rollback : 0
                }

                if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                    // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                    if(req.body.user_detials.region_list.length != 7){
                        searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    // searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
                }

            // check date for start and end 
                if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

                if (req.query.startDate) {
                    searchKeyValue.start_date = req.query.startDate //dt start date
                }
                if (req.query.endDate) {
                    searchKeyValue.end_date = req.query.endDate //dt end date
                }
            //other optional parameter
                // if(req.query.name) searchKeyValue.full_name = req.query.name //str
                // if(req.query.user_id) searchKeyValue.username = req.query.user_id
                // if(req.query.user_type_uuid){
                //     var responce = await commonQueryCommon.getAgentTypeId(req.query.user_type_uuid)
                //     if(!responce) return res.status(400).json({ errors: [ {msg : "Agent Type not found"}] });
                //     searchKeyValue.usertype_id = responce[0].agent_type_id
                // }
                // if(req.query.mobile) searchKeyValue.mobile = req.query.mobile
                if(req.query.amount) searchKeyValue.transfer_amt = req.query.amount
                // console.log(searchKeyValue)
                // console.log(Object.keys(searchKeyValue).length)
                if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : "Search Parameter are not proper"}] });

                const lisTotalRecords = await stockModule.stockRecievedReportCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                const lisResult = await stockModule.stockRecievedReport(searchKeyValue, limit, offset)
                
                // if(lisResult.length === 0) return res.status(204).send({message:"no transactions found"})
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResult)
                }else{
                    res.status(200).send({
                        reportList : lisResult,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        totalTransactionAmount : lisTotalRecords[0].transactionAmount || 0,
                        totalCommissionAmount : lisTotalRecords[0].commissionAmount || 0,
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    downlineStockTransferReport = async ( req, res, next) =>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('stock/downlineStockTransferReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // console.log(req.query)
            let searchQkeys = Object.keys(req.query)
            searchQkeys.forEach((key) => {
                if(key.includes('user_id')) req.query.userId = key.slice(7,key.length)
            })
            // user_idAFP-32585
            // console.log(req.query)
        // search parameter
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                Active : 1, 
                rollback : 0,
                "NOT sender_id" : req.body.user_detials.userid,
            }
        // all optional search parameter
            if(req.query.parentAgentUuid) {
                // searchKeyValue.parent_id = req.query.parentAgentUuid
                let agentList = await sqlQueryReplica.searchQuery(this.tableName4,{user_uuid : req.query.parentAgentUuid,Active : 1},['child_id'],'userid','asc',1, 0)
                if(agentList.length == 0)return res.status(400).json({ errors: [ {msg : 'Parent Id not found'}] });
                searchKeyValue.child_ids = agentList[0].child_id
            }else{
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }
            
            if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

            if (req.query.userType_uuid) {
                const lisResponce = await commonQueryCommon.checkAgentType(req.query.userType_uuid)
                if (lisResponce == 0) return res.status(400).json({ errors: [ {msg : 'user type uuid not found'}] });
                searchKeyValue.usertype_id = lisResponce[0].agent_type_id //int user typeId
            }
            if (req.query.userId) searchKeyValue.sender_username = req.query.userId //str username
            if (req.query.name) searchKeyValue.reciever_username = req.query.name //str full name
            if (req.query.start_date) searchKeyValue.start_date = req.query.start_date //dt start date
            if (req.query.end_date) searchKeyValue.end_date = req.query.end_date // dt end date
            if (req.query.province_uuid) searchKeyValue.province_uuid = req.query.province_uuid //str uuid
            // if (req.query.region_uuid) searchKeyValue.region_uuid = req.query.region_uuid // str region_uuid
            if (req.query.status) searchKeyValue.Active = req.query.status // tinyint 1,2

            if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : "Search Parameter are not proper"}] });

            const lisTotalRecords = await stockModule.agentStocksDetialsCount(searchKeyValue)
            
            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            const lisResult = await stockModule.agentStocksDetials(searchKeyValue, limit, offset)
            
            // if(lisResult.length === 0) return res.status(204).send({message:"no transactions found"})

            // res.status(200).send(lisResult)

            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisResult)
            }else{
                res.status(200).send({
                    reportList : lisResult,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : lisTotalRecords[0].totalAmount || 0,
                    totalCommission : lisTotalRecords[0].totalCommission || 0
                })
            }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    stocksRequests = async ( req, res, next) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('stock/stockReports',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // var offset = req.query.start
            // var limit = req.query.end - offset
            let searchKeyValue = {
                Active: 1
            };
            if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            var lisTotalRecords = await stockModule.getPendingRequestCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            var results = await stockModule.getPendingRequest(searchKeyValue, limit, offset)
            if(results.length === 0) return res.status(204).send({message : "no pending requests"})

            var changeResults = results.map((sinResult) =>{
                var {rcptUrl,payment_mode, ...other} = sinResult
                // console.log(other)
                var mode = payment_mode == 1 ? "Cash" : "Bank Transfer"
                other.mode = mode
                other.rcptUrl = rcptUrl ? (rcptUrl.includes(awsURL) ? rcptUrl.replace(awsURL,'') : rcptUrl) : null
                return other
            })

            if( req.query.pageNumber == 0 ) {
                res.status(200).send(changeResults)
            }else{
                res.status(200).send({
                    reportList : changeResults,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : lisTotalRecords[0].totalAmount
                })
            }

            // res.status(200).send(changeResults)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    acceptStockRequest = async(req,res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('stock/acceptStockRequest',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // check if stock transfer is allowed or not
            let stockTransferStatus = await sqlQuery.searchQueryNoCon(this.tableName8,['stock_transfer'],'stock_transfer', 'ASC', 1, 0)
            if(stockTransferStatus.length == 0 || stockTransferStatus[0].stock_transfer == 0) return res.status(400).json({ errors: [ {msg : "Stock transfer is not allowed for a while."}] });

            //1)-get reciever user id by userid
            const lisResponce3 = await stockModule.getAgentUuid(req.body.transferNumber)
            if(lisResponce3.length === 0 ) return res.status(400).json({ errors: [ {msg : "reference number not found"}] });
            // console.log(lisResponce3)
            req.body.reciever_uuid = lisResponce3[0].user_uuid
            req.body.amount = lisResponce3[0].request_amt

            //2)- search for sender and reciever details
            var searchKeyValue = {
                user_uuid: req.body.reciever_uuid, //str reciever uuid
                Active : 1
            }
            
            var key = ["username","userid","parent_id","CAST(user_uuid AS CHAR(16)) AS user_uuid","comm_type","region_id",'full_name','mobile','usertype_id']
            var orderby = "userid"
            var ordertype = "ASC"

            const lisResponce4 = await sqlQuery.searchQuery(this.tableName4, searchKeyValue, key, orderby, ordertype, 1, 0)
            // console.log(lisResponce4)
            if(lisResponce4.length == 0) return res.status(400).json({ errors: [ {msg : "reciever account not found"}] });
            // console.log("lisResponce4",lisResponce4)
            //assign values of proper variable
            var intSenderId = req.body.user_detials.userid
            var strSenderName = req.body.user_detials.username
            var intRecieverId = lisResponce4[0].userid
            var strRecieverName = lisResponce4[0].username
            var intRecieverCommissionType = lisResponce4[0].comm_type

        // 2.1)- if pre paid then add commission in the transfer amount
        var commissionLengt = 0
        if(intRecieverCommissionType == 0) return res.status(400).json({ errors: [ {msg : "Agent commission not set, please set commission first"}] });
        if(intRecieverCommissionType == 1){
            var commissionVal = await sqlQuery.searchQuery(this.tableName7,{user_uuid: req.body.reciever_uuid},["commission_value"],"userid","ASC",1,0)
            commissionLengt = commissionVal.length
        }    
        commissionVal = commissionLengt > 0 ? commissionVal[0].commission_value : 0

        //3)- check/update wallet transaction status
            //3.1)- update status for sender
            // sql query variables for sender
            var param = {
                canTransfer: 0
            }
            var searchKeyValue = {
                    user_uuid: req.body.user_detials.user_uuid, //str user_uuid
                    canTransfer: 1
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);
            // checking sql responce
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            var { affectedRows, changedRows, info } = objResponce;
            // generating proper message
            if (!affectedRows) return res.status(400).json({ errors: [ {msg : 'sender account not found'}] });
            if (!(affectedRows && changedRows)) return res.status(200).send({ message: 'earlier transation under process' })

            //3.2)- update status for reciever 
            // sql query variable for reciever
            var param = {
                canTransfer: 0
            }
            var searchKeyValue = {
                user_uuid: req.body.reciever_uuid, //str user_uuid
                canTransfer: 1
            }

            // fire sql query
            var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // checking sql responce
            if (!objResponce) {
                await reset(this.tableName1, req.body.user_detials.user_uuid)
                throw new HttpException(500, 'Something went wrong');
            }
            var { affectedRows, changedRows, info } = objResponce;

            // generating proper message
            // if (!affectedRows) return res.status(400).send({ message: 'reciever account not found' })
            if (!(affectedRows && changedRows)) {
                await reset(this.tableName1, req.body.user_detials.user_uuid)
                return res.status(200).send({ message: 'reviever earlier transation under process' })
            }

        //4)- start transaction
            var objResponce = await sqlQuery.specialCMD('transaction')
            if (!objResponce) {
                await reset(this.tableName1, req.body.user_detials.user_uuid)
                await reset(this.tableName1, req.body.reciever_uuid)
                throw new HttpException(500, 'Something went wrong');
            }

        //5)- deduct money from sender wallet
            //get the sender balance
            var searchKeyValue = {
                user_uuid: req.body.user_detials.user_uuid
            }
            var key = ["ex_wallet AS wallet", "min_wallet", "userid"]
            var orderby = "wallet_id"
            var ordertype = "ASC"

            // fire sql query to get balance
            const lisResponce1 = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)
            const commissionAmt = intRecieverCommissionType == 1 ? ((commissionVal/100)*Number(req.body.amount)) : 0
            // balance should be grater then minimum balance
            // console.log(Number(req.body.amount),((commissionVal/100)*Number(req.body.amount)) )
            if(lisResponce1[0].userid != 1){
                if (lisResponce1[0].wallet - ( Number(req.body.amount) + commissionAmt  ) < 0) {
                    await sqlQuery.specialCMD('rollback')
                    await reset(this.tableName1, req.body.user_detials.user_uuid)
                    await reset(this.tableName1, req.body.reciever_uuid)
                    return res.status(400).json({ errors: [ {msg : 'in sufficient balance'}] });
                }
            }
            //update reciever balanced
            var param = {
                deductBalance : {
                    key : "ex_wallet",
                    value : Number(req.body.amount) + commissionAmt
                },
                // ex_wallet: lisResponce1[0].wallet -  //db amount
            }
            var searchKeyValue = {
                user_uuid: req.body.user_detials.user_uuid, //str sender_uuid
            }

            // fire sql query
            var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

        //6)- add money to reciever wallet 
            //get the reciever balance
            var searchKeyValue = {
                user_uuid: req.body.reciever_uuid //str reciever_uuid
            }
            var key = ["ex_wallet AS wallet", "userid","comm_wallet"]
            var orderby = "wallet_id"
            var ordertype = "ASC"

            // fire sql query to get reciever balance
            const lisResponce2 = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)
            
            const dbReviceBalance = lisResponce2.length === 0 ? 0 : lisResponce2[0].wallet
            var strRecieverId = lisResponce2.length === 0 ? 0 : lisResponce2[0].userid

            //create account as account not created
            if (lisResponce2.length === 0) {
                //get reciever user id
                var key = ["userid"]
                var orderby = "userid"
                var ordertype = "ASC"

                // fire sql query to get str user_uuid, str full name, int monile number
                const lisResponce3 = await sqlQuery.searchQuery(this.tableName4, searchKeyValue, key, orderby, ordertype, 100, 0)
            
                strRecieverId = lisResponce3[0].userid

                //create wallet
                var param = {
                    wallet_uuid: "uuid()",
                    user_uuid: req.body.reciever_uuid,
                    userid: lisResponce3[0].userid,
                    ex_wallet: Number(req.body.amount) + commissionAmt , //db balance
                    comm_wallet: commissionAmt,
                    canTransfer: 0
                }

                //fire sql query
                const objResult = await sqlQuery.createQuery(this.tableName1, param)

            } else {
                //update reciever balanced
                var param = {
                    addBalance : { 
                        key: "ex_wallet",
                        value: Number(req.body.amount) + commissionAmt
                    },
                    addBalance1 : { 
                        key: "comm_wallet",
                        value:  commissionAmt
                    }
                    // ex_wallet: Number(dbReviceBalance) + , //db balance
                    // comm_wallet : Number(lisResponce2[0].comm_wallet) + 
                }
                var searchKeyValue = {
                    user_uuid: req.body.reciever_uuid, // str reciever user uuid
                }

                // fire sql query
                var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);
            }

            //transation variables
            const dtCurrentDate = date // dt current date time
            const strDate = dtCurrentDate.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
            const strUniqueNumber = await dataBaseId(dtCurrentDate) //str unique number

        //7)- create er wallet transaction recipt for reciever
            //sql varialbles
            param = {
                    wallet_txn_uuid: "uuid()",
                    userid: strRecieverId, // str userid
                    user_uuid: req.body.reciever_uuid, // str userid
                    trans_number: strUniqueNumber, // str unique number
                    trans_date_time: strDate, // str date
                    amount: Number(req.body.amount) + commissionAmt, // db amount
                    trans_type: 1, // type debit
                    narration: req.body.narration || `Wallet Recieved from ${strSenderName}`,
                    balance_amount: Number(dbReviceBalance) + Number(req.body.amount) + commissionAmt, //db balance amount
                    trans_for: req.body.transFor || "Wallet Recieved"
                }
                //fire sql query
            var objResponce = await sqlQuery.createQuery(this.tableName2, param)

            let messageQueue = { 
                userId : strRecieverId, 
                amount : Number(req.body.amount) + commissionAmt, 
                dateTime : strDate
            }
            sendMessage('processedStockReceived',JSON.stringify(messageQueue),(err,msg)=>{
                if(err) console.log(err)
            })
        
        //8)- create er wallet transaction recipt for sendfer
            param = {
                    wallet_txn_uuid: "uuid()",
                    userid: lisResponce1[0].userid, // str userid
                    user_uuid: req.body.user_detials.user_uuid, // str user_uuid
                    trans_number: strUniqueNumber, // str unique number
                    trans_date_time: strDate, // dt date
                    amount: Number(req.body.amount) + commissionAmt, // db amount
                    trans_type: 2, // type credit
                    narration: req.body.narration || `Wallet Transfer to ${strRecieverName}`, 
                    balance_amount: lisResponce1[0].wallet - Number(req.body.amount) - commissionAmt, //db balance
                    trans_for: req.body.transFor || "Wallet Transfer"
                }
                //fire sql query
            var objResponce = await sqlQuery.createQuery(this.tableName2, param)

            messageQueue = { 
                userId : lisResponce1[0].userid, 
                amount : Number(req.body.amount),  
                comm : commissionAmt,
                dateTime : strDate
            }
            sendMessage('processedStockTransfer',JSON.stringify(messageQueue),(err,msg)=>{
                if(err) console.log(err)
            })
        
        //9)- add details to er_wallet_transfer_individual table
                
            var SenderType =  process.env.USER_id == intSenderId ? 1 : 2
        
            var param = {
                trxn_uuid : "uuid()", // function
                trans_number : strUniqueNumber, // str unique number
                sender_id : intSenderId, //
                sender_username : strSenderName,
                reciever_id : intRecieverId,
                reciever_username : strRecieverName,
                transfer_amt : Number(req.body.amount) + commissionAmt,
                transfer_comm : commissionAmt,
                created_by : intSenderId,
                created_on : strDate,
                type : SenderType
            }

            var objResponce = await sqlQuery.createQuery(this.tableName5, param)

            // if commission type id prepaid then add data in er_pre_paid_commission_amount
            // console.log("intRecieverCommissionType ", intRecieverCommissionType)
            if(intRecieverCommissionType == 1){
                var param = {
                    userid : lisResponce4[0].userid,
                    parent_id : lisResponce4[0].parent_id,
                    transaction_id : strUniqueNumber,
                    transfer_amt : Number(req.body.amount),
                    commission_amt : commissionAmt,
                    comm_per : commissionVal,
                    created_on : isodate, //dt current
                }

                var objResponce = await sqlQuery.createQuery(this.tableName9, param)
            }

        //10)- update request table
            //variables for sql query
            var param = {
                confirmed_by : req.body.user_detials.userid,
                confirmed_on : isodate,
                transfer_amt : Number(req.body.amount) + commissionAmt,
                status : 1
            }
            var searchKeyValue = {
                trans_number : req.body.transferNumber,
                parent_id : req.body.user_detials.userid,
                status : 0
            }
            // console.log(searchKeyValue,param)
            // fire sql query to update country name
            const objResult = await sqlQuery.updateQuery(this.tableName6, param, searchKeyValue);
                // console.log("responce",objResult)

        // add activity log
            let logData = [];

        // reciever details
            logData.push({ 
                userid : lisResponce4[0].userid,
                username : lisResponce4[0].username,
                user_uuid : lisResponce4[0].user_uuid,
                full_name : lisResponce4[0].full_name,
                mobile : lisResponce4[0].mobile ? lisResponce4[0].mobile : 0,
                created_on : isodate,
                created_by_type : (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid,
                user_type : lisResponce4[0].usertype_id, // 1- Admin ,2- Member
                ip_address :req.body.userIpAddress ?  req.body.userIpAddress : 0,
                mac_address : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                os_details : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                imei_no : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                gcm_id : req.body.userGcmId ?  req.body.userGcmId : 0,  // to send notification
                app_version : req.body.userAppVersion ?  req.body.userAppVersion : 0,  // our app version
                source : req.body.userApplicationType ?  req.body.userApplicationType : 0,  // 1: web, 2 : app
                description : "Fund received from " + ((req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ? ( req.body.user_detials.type === userList.Admin ? (" Admin - " + req.query.username) : (" Sub-Admin - " + req.query.username) ) : req.query.username), 
                activity_type : (req.body.user_detials.type == 0) ? 17 : 24, // 1-Login;2-Change Password;3-Change Profile
                old_value : Number(dbReviceBalance),
                modified_value : Number(dbReviceBalance) + Number(req.body.amount) + commissionAmt,
                region_id : lisResponce4[0].region_id
            });
        
        // reciever derails
            logData.push({ 
                userid : req.body.user_detials.userid,
                username : req.body.user_detials.username,
                user_uuid : req.body.user_detials.user_uuid,
                full_name : req.body.user_detials.name,
                mobile : req.body.user_detials.mobile,
                created_on : isodate,
                user_type : req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ? 0 : req.body.user_detials.type, // 1- Admin ,2- Member
                created_by_type : (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, // userList
                ip_address :req.body.userIpAddress ?  req.body.userIpAddress : 0,
                mac_address : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                os_details : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                imei_no : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                gcm_id : req.body.userGcmId ?  req.body.userGcmId : 0,  // to send notification
                app_version : req.body.userAppVersion ?  req.body.userAppVersion : 0,  // our app version
                source : req.body.userApplicationType ?  req.body.userApplicationType : 0,  // 1: web, 2 : app
                description : "Fund transferred to "+ ( req.body.user_detials.type == 0 ? (" Admin - " + lisResponce4[0].username) : lisResponce4[0].username ), 
                activity_type : (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ? ( req.body.user_detials.type === userList.Admin ? 17 : 26 ) : 24, // 1-Login;2-Change Password;3-Change Profile
                old_value : lisResponce1[0].wallet,
                modified_value : lisResponce1[0].wallet - Number(req.body.amount) - commissionAmt,
                region_id : req.body.user_detials.region_id
            });

        const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:logData})
        var strLog = intResult == 1 ? 'activity log successfully' : intResult == 2 ? 'activity log error' : 'end point not found'
            // console.log('Server Log : '+strLog)
        if(intResult != 1){
            await sqlQuery.specialCMD('rollback')
            await reset(this.tableName1, req.body.user_detials.user_uuid)
            await reset(this.tableName1, req.body.reciever_uuid)
            return res.status(400).json({ errors: [ {msg : 'log error'}] });
        }

        // add data in commissiontable table
            let commissionDetails = {
                userid : lisResponce4[0].userid,
                parent_id : lisResponce4[0].parent_id,
                recharge_id : strUniqueNumber,
                operator_id : 0,
                recharge_amount : Number(req.body.amount),
                commission_amount : commissionAmt,
                comm_per : intRecieverCommissionType == 1 ? commissionVal : 0,
                created_on : isodate, //dt current
                status : 2,
                total_commission : commissionAmt,
                distribute_commission : commissionAmt,
            }

            let commissionResponce = await sqlQuery.createQuery(this.tableName10, commissionDetails)

        //11)- commit transaction
            var response = await sqlQuery.specialCMD('commit')

        //12)- change wallet transaction status
            //sql query variables for sender
            await reset(this.tableName1, req.body.user_detials.user_uuid)
            await reset(this.tableName1, req.body.reciever_uuid)

            res.status(200).send({ message: 'money transfer sucessfully' })

        }catch(error){
            console.log(error);
            await sqlQuery.specialCMD('rollback')
            await reset(this.tableName1, req.body.user_detials.user_uuid)
            await reset(this.tableName1, req.body.reciever_uuid)
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    stockRequestReport = async (req, res) =>{
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('stock/stockRequestReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

        // search parameter
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                Active : 1,
            }

            if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

        // check date for start and end 
            if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate //dt end date
            }
            console.log("Status",req.query.stocktransferStatus)

        //other optional parameter
            if(req.query.name) searchKeyValue.full_name = req.query.name //str
            if(req.query.user_id) searchKeyValue.username = req.query.user_id
            if(req.query.mobile) searchKeyValue.mobile = req.query.mobile
            if(req.query.stocktransferStatus != null && req.query.stocktransferStatus != undefined && req.query.stocktransferStatus != "" ) searchKeyValue.status = req.query.stocktransferStatus
            if(req.query.user_type_uuid){
                var responce = await commonQueryCommon.getAgentTypeId(req.query.user_type_uuid)
                console.log(responce)
                if(!responce) return res.status(400).json({ errors: [ {msg : "Agent Type not found"}] });
                searchKeyValue.usertype_id = responce[0].agent_type_id
            }

            if(Object.keys(searchKeyValue).length === 0) return res.status(404).json({errors: [ {msg : "Search Parameter are not proper"}]})
            console.log(typeof(searchKeyValue))

            const lisTotalRecords = await stockModule.stockTransferReportCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            const lisResult = await stockModule.stockTransferReport(searchKeyValue, limit, offset)
            console.log("lisResult",lisResult);
            
            if(lisResult.length === 0) return res.status(200).send([])

            const agentTypeLis = await commonQueryCommon.getAllAgentType()

            var changeResults = lisResult.map((sinResult) =>{
                var {rcptUrl,payment_mode,status,usertype_id, ...other} = sinResult
                // console.log("mode",payment_mode)
                other.mode = payment_mode == 1 ? "Cash" : "Bank Transfer"
                other.status = status == 0 ? "Pending" : status == 1 ? "Confirmed" : "Rejected"
                other.usertype = agentTypeLis[usertype_id-1].agent_type_name
                other.rcptUrl = rcptUrl ? (rcptUrl.includes(awsURL) ? rcptUrl.replace(awsURL,'') : rcptUrl) : null
                return other
            })

            if( req.query.pageNumber == 0 ) {
                res.status(200).send(changeResults)
            }else{
                res.status(200).send({
                    reportList : changeResults,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : lisTotalRecords[0].totalAmount || 0
                })
            }

            // res.status(200).send(changeResults)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    rejectStockRequest = async(req,res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('stock/rejectStockReport',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query
            var param = {
                confirmed_comment : req.body.comment,
                confirmed_by : req.body.user_detials.userid,
                confirmed_on : isodate,
                status : 2
            }
            var searchKeyValue = {
                trans_number : req.body.transferNumber,
                parent_id : req.body.user_detials.userid,
                status : 0
            }

            // fire sql query to update country name
            const objResult = await sqlQuery.updateQuery(this.tableName6, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Request not found' :
                affectedRows && changedRows ? 'request rejected successfully' : 'request reject faild, values are same';

            // send responce to fornt end
            res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    createStockRequest = async ( req, res ) =>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('stock/createStockRequest',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //search parent id
                var searchKeyValue1 = {
                    userid: req.body.user_detials.userid, //str
                    Active : 1
                }
                var key = ["parent_id"]
                var orderby = "parent_id"
                var ordertype = "DESC"

                // fire sql query to get str user_uuid, str full_name, str email, str gender, int mobile, str address,str shop_name, str parent_id,str region_name,int usertype_id, str country name, str province name, str district name
                const lisResponce1 = await sqlQuery.searchQuery(this.tableName4, searchKeyValue1, key, orderby, ordertype, 1, 0)

                // check sql rsponce
                if (lisResponce1.length === 0) {
                    return res.status(400).json({ errors: [ {msg : 'user id not found'}] });
                }

            // unique transation number 
                //transation variables
                const dtCurrentDate = date // dt current date time
                const strUniqueNumber = await dataBaseId(dtCurrentDate) //str unique number
                
            // add data in the table
                var param = {
                    trans_number : strUniqueNumber, // str unique number
                    userid : req.body.user_detials.userid, //str user id
                    parent_id : lisResponce1[0].parent_id,
                    request_amt : req.body.amount, // db request_amt 
                    payment_mode : req.body.paymentMode, // int 1
                    created_on : isodate, //dt current date time
                    comment : req.body.comment, // comment
                    status : 0,
                }

                if(req.body.paymentMode == 2) {
                    // add to the parm object
                        if(!req.body.referenceNumber.match(/^[0-9a-zA-Z]+$/)) return res.status(400).json({ errors: [ {msg : 'Reference number should be proper'}] });
                        param.reference_no = req.body.referenceNumber
                        param.rcpt_url = req.body.filename
                }

                var objResult = await sqlQuery.createQuery(this.tableName6, param)
                // console.log(objResult)

                res.status(200).send({ message : "Request created sucessfully"})

        }catch(error){
            console.log(error);
            let message = error.message
            if(message.includes("Column 'parent_id' cannot be null")) return res.status(400).json({ errors: [ {msg : "not allowed to add request" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    topStockRequestReport = async (req, res) => {
        try{
            // body and query validators
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('stock/topStockRequestReport',JSON.stringify(req.body), JSON.stringify(req.query))
                var searchKeyValue = {
                    status : 1
                }

                if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                    // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                    if(req.body.user_detials.region_list.length != 7){
                        searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
                }

                if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

                if (req.query.startDate) {
                    searchKeyValue.start_date = req.query.startDate //dt start date
                }
                if (req.query.endDate) {
                    searchKeyValue.end_date = req.query.endDate //dt end date
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

                const lisTotalRecords = await stockModule.topStockRequestReportCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords.length)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // sql query 
                const topAgentList = await stockModule.topStockRequestReport(searchKeyValue, limit, offset)
                // if(topAgentList.length == 0) return res.status(204).send({message:"No agnet found"})
            
            // sned responce to front end
                // res.status(200).send(topAgentList)

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(topAgentList)
                }else{
                    res.status(200).send({
                        reportList : topAgentList,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    saveImage = async (req, res) => {
        try{
            // check if upload is done or not
                // console.log(Number(req.file.size)/(1024*1024))
                if(!req.file) return res.status(400).json({ errors: [ {msg : "Image upload faild"}] });
                console.log('stock/saveImage',JSON.stringify(req.body), JSON.stringify(req.query))
            // upload to aws
                let uploadDetails = await awsCommon.upload(req.file)
                // console.log(uploadDetails)

                if(uploadDetails){
                    return res.status(200).send({message : 'image upload sucessfully', location : uploadDetails.Location});
                }else{
                    return res.status(400).json({ errors: [ {msg :'image uplaod upload faild'}]})
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getImage = async (req, res) => {
        try{
            // console.log(req.params)
            const key = req.params.key
            // console.log('stock/getImage',JSON.stringify(req.body), JSON.stringify(req.query))
            const readStream = await awsS3Common.getFileStream(key)
            readStream.pipe(res)
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getRequestStatus = async (req, res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('stock/getRequestStatus',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

             // search parameter
            //  var offset = req.query.start
            //  var limit = req.query.end - offset
             var searchKeyValue = {
                 userid : req.body.user_detials.userid
             }
         // check date for start and end 
             if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
 
             if (req.query.startDate) {
                 searchKeyValue.start_date = req.query.startDate //dt start date
             }
             if (req.query.endDate) {
                 searchKeyValue.end_date = req.query.endDate //dt end date
             }
             // console.log(req.query.stocktransferStatus)
         //other optional parameter
             if(req.query.amount) searchKeyValue.request_amt = req.query.amount //str
             if(req.query.status) searchKeyValue.status = req.query.status

            //  console.log(searchKeyValue,searchKeyValue.length)
             if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : "Search Parameter are not proper"}] });

             var key = ["trans_number AS requestId", "request_amt AS amount", "CAST(created_on AS CHAR(20)) AS requestDate", "payment_mode AS mode", "status", "comment","rcpt_url AS rcptUrl"]
             var orderby = "id"
             var ordertype = "DESC"

             var lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName6, searchKeyValue, ['COUNT(1) AS count', 'SUM(request_amt) AS totalAmount'], orderby, ordertype)

             let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


             var lisresult = await sqlQueryReplica.searchQuery(this.tableName6, searchKeyValue, key, orderby, ordertype, limit, offset)

            //  if(lisresult.length == 0) return res.status(204).send({message : "no request made"})

             var finalresult = lisresult.map((result) => {
                 var {rcptUrl,mode,status,...other} = result
                other.mode = mode == 1 ? "Cash" : "Bank Transfer"
                other.status = status == 0 ? "Pending" : status == 1 ? "Confirmed" : "Rejected"
                other.rcptUrl = rcptUrl ? (rcptUrl.includes(awsURL) ? rcptUrl.replace(awsURL,'') : rcptUrl) : null
                return other
             })
            
            //  res.status(200).send(finalresult)
             if( req.query.pageNumber == 0 ) {
                res.status(200).send(finalresult)
            }else{
                res.status(200).send({
                    reportList : finalresult,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : lisTotalRecords[0].totalAmount
                })
            }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });  
        }
    }

    checkValidation = (req) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors)
            throw new HttpException(400, 'Validation faild', errors);
        }
    }
}

function pad2(n) { return n < 10 ? '0' + n : n }

async function dataBaseId(date) {
    // console.log(date)
    let randomNumber = await redisMaster.incr('RECH_RANDUM_ID')
    if(randomNumber < 100){
        await redisMaster.post('RECH_RANDUM_ID',100)
        randomNumber = 100
    }
    var id = pad2(date.getDate())
    id += pad2(date.getMonth() + 1)
    id += date.toISOString().slice(2, 4)
    id += pad2(date.getHours())
    id += pad2(date.getMinutes())
    id += pad2(date.getSeconds())
    // id += varRandomString.generateRandomNumber(3)

    id += String(randomNumber)

    if(randomNumber > 900){
        await redisMaster.post('RECH_RANDUM_ID',100)
    }

    return id
}

async function reset(tableName, user_uuid) {
    var param = {
        canTransfer: 1
    }
    var searchKeyValue = {
            user_uuid: user_uuid,
            canTransfer: 0
        }
        // fire sql query
    var responce = await sqlQuery.updateQuery(tableName, param, searchKeyValue);
    // checking sql responce
    if (!responce) {
        throw new HttpException(500, 'Something went wrong');
    }
    var { affectedRows, changedRows, info } = responce;
    // generating proper message
    if (!affectedRows) return { status: 204, send: 'sender account not found' }
    if (!(affectedRows && changedRows)) return { status: 204, send: 'Previous transation under process' }

}

module.exports = new stockController