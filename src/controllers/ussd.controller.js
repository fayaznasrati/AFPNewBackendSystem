const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const varEncryptionString = require('../utils/encryption.utils');

const rechargeController = require('../controllers/recharge.controller')
const stockTransferController = require('../controllers/stock.controller')

const smsFunction = require('../common/smsFunction.common')

// const { toIsoString } = require('../common/timeFunction.common')

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');

const ussdMOdule = require('../models/ussd.model');
const ussdModel = require('../models/ussd.model');

const redisMaster = require('../common/master/radisMaster.common')

class ussdController {

    tableName1 = "er_login"
    tableName2 = "er_wallet"
    tableName3 = "er_recharge"
    tableName4 = "er_wallet_transfer_individual"
    tableName5 = "er_ussd_sms_activity"
    tableName8 = 'er_access_status'

    ussdMain = async (req,res) => {
        try{
            req.body.userApplicationType = 3
            let ussdMenuresponce = await this.runMenu(req.body)
            console.log('req.body',req.body)
            
            if(ussdMenuresponce.error){
                return res.send({error : ussdMenuresponce.error})
            }else{
                return res.send(ussdMenuresponce)
            }
        }catch(error){
            console.log(error)
            res.status(400).send({error : "Logic error"})
        }
    }

    runMenu = async(reqDetails) =>{
        try{    
            // checkUser.userApplicationType = reqDetails.userApplicationType || 3

            // console.log('req.body',req.body)
            let checkUser = await this.verifyUser(reqDetails.userNumber, reqDetails.userApplicationType)
            console.log('user details : ',checkUser)
            if(checkUser.error) return ({error})
            // console.log(checkUser == 0 , checkUser == 1)
            if( checkUser == 0 || checkUser == 1 ) return ({userState : checkUser})
            if( checkUser == 2 ) return ({error : reqDetails.userApplicationType == 3 ? 'Your USSD channel is In-Active!' : 'Your SMS channel is In-Active!'})
            if( checkUser.mpinStatus != 1 && reqDetails.mpin != '' && reqDetails.method != 'changeMpin') return ({error : 'M-pin is in active no need to enter pin'})
            if( checkUser.mpinStatus == 1 && reqDetails.mpin == '') return ({userState : 3, mpinStatus : 0})
            if( checkUser.mpinStatus == 1 && checkUser.pin != reqDetails.mpin  ){
                let attempt = await redisMaster.incr(`AGENT_USSD/SMS_ATTEMPT_${checkUser.user_uuid}`)
                attempt = Number(attempt)

                let allowedAttempt = Number(process.env.WRONG_PASSWORD_ATTEMPTS)

                if( allowedAttempt-attempt <= 0 ){
                    // update agent as in-active
                    console.log('agentLoginFun/USSD-SMS/failed',checkUser.userName)
                    const updateResponce = await sqlQuery.updateQuery(this.tableName1,{user_status : 2},{username : checkUser.userName,Active : 1})
                }

                // return res.status(400).json({ errors: [ {msg : `Wrong password, ${allowedAttempt-attempt} left.`}] });
                return ({error : `Incorrect M-pin, ${allowedAttempt-attempt > 0 ? allowedAttempt-attempt : 0} left.`})
            }

            redisMaster.delete(`AGENT_USSD/SMS_ATTEMPT_${checkUser.user_uuid}`)

            checkUser.userApplicationType = reqDetails.userApplicationType || 3
            
            let funRespnce = {}
            let activityType = 0, activityName = ''

            switch(reqDetails.method){
                case "checkBalance":
                    activityType = 1
                    activityName = 'Balance enquiry'
                    funRespnce = await this.getBalance(checkUser) 
                    break;
                case "dailyTopUpReport":
                    activityType = 2
                    activityName = 'Daily Top-up Report'
                    funRespnce = await this.dailyTopUpReport(checkUser) 
                    break;
                case 'last5TxnReport':
                    activityType = 3
                    activityName = 'Last 5 transaction report'
                    funRespnce = await this.last5TxnReport(checkUser) 
                    break;
                case 'changeMpin':
                    activityType = 4
                    activityName = 'Change M-pin'
                    checkUser.oldPin = reqDetails.mpin
                    checkUser.newPin = reqDetails.newPin
                    funRespnce = await this.changeMpin(checkUser)
                    break;
                case 'stockTransfer':
                    activityType = 5
                    activityName = 'Stock Transfer'
                    checkUser.amountTransfered = reqDetails.amountTransfered
                    checkUser.recieverId = reqDetails.recieverId
                    funRespnce = await this.stockTransfer(checkUser)
                    break;
                case 'dailyStockTransferReport':
                    activityType = 6
                    activityName = 'Daily Stock Transfer Report Amount'
                    funRespnce = await this.dailyStockTransferReport(checkUser)
                    break;
                case 'checkTxnStatusByNumber':
                    activityType = 7
                    activityName = 'Check Transaction status by Mobile number'
                    checkUser.checkNumber = reqDetails.checkNumber
                    funRespnce = await this.checkTxnStatusByNumber(checkUser)
                    break;
                case 'checkRollbackAmount':
                    activityType = 8
                    activityName = 'Check Received Rollback Amounts:'
                    funRespnce = await this.checkRollbackAmount(checkUser)
                    break;
                case 'checkRollbackByNumber':
                    activityType = 9
                    activityName = 'Check Received Rollback by Rollback phone number:'
                    checkUser.checkNumber = reqDetails.checkNumber
                    funRespnce = await this.checkRollbackByNumber(checkUser)
                    break;
                case 'recharge':
                    activityType = 10
                    activityName = 'Recharge'
                    checkUser.rechargeNumber = reqDetails.rechargeNumber
                    checkUser.rechargeAmount = reqDetails.rechargeAmount
                    funRespnce = await this.processRecharge(checkUser)
                    break;
                default:
                    funRespnce.error = 'Internal method error'
                    break;
            }

            if (funRespnce.error){
                return({status : 400, error:funRespnce.error})
                // return res.status(400).send({error : funRespnce.error})
            }

            if(activityType != 0){

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                // add activity type log
                let addDetails = {
                    userid : checkUser.id,
                    activity_type : activityType,
                    activity_name : activityName,
                    channel : checkUser.userApplicationType == 3 ? 1 : 2,
                    created_on : isodate
                }

                let createResponce = sqlQuery.createQuery(this.tableName5,addDetails)
            }

            // console.log(funRespnce)

            funRespnce.languageType = checkUser.languageType
            funRespnce.userName = checkUser.fullName
            funRespnce.userState = 3 // user exists
            funRespnce.mpinStatus = 2 // pin ok
            funRespnce.userId = checkUser.userName

            return(funRespnce);
        }catch(error){
            console.log(error)
            return ({error: "Internal error"})
        }
    }

    verifyUser = async (mobileNumber,userApplicationType) =>{
        try{
            // let serarchKeyValue = {
            //     mobile : mobileNumber,
            //     Active : 1
            // }
            // let keyValue = ['CAST(user_uuid AS CHAR(16)) AS user_uuid','userid','username','usertype_id','full_name','m_pin','mpin_status','encryption_key','user_status','region_id','prefer_lang']
            // let userDetials = await sqlQuery.searchQuery(this.tableName1,serarchKeyValue,keyValue,'userid','ASC',1,0)
            // console.log('user Detials',userDetials)
            let channel = userApplicationType == 3 ? 'USSD' : 'SMS'
            let userDetials = await ussdModel.verifyAgent(mobileNumber,channel)
            if(userDetials.length == 0) return(0)
            userDetials = userDetials[0]

            if(userDetials.user_status != 1) return(1)
            if(userDetials.channelStatus != 1) return(2)

            let userDetails = {
                id : userDetials.userid,
                user_uuid : userDetials.user_uuid,
                userName : userDetials.username,
                fullName : userDetials.full_name,
                mobile : mobileNumber,
                redionId : userDetials.region_id,
                type : userDetials.usertype_id,
                languageType : userDetials.prefer_lang
            }

            let decryptMpin = varEncryptionString.decryptString(userDetials.encryption_key,userDetials.m_pin)
            // console.log('pin : ',decryptMpin)
            userDetails.pin = decryptMpin
            userDetails.mpinStatus = userDetials.mpin_status
                        
            return ( userDetails )

        }catch(error){
            console.log(error)
            return ({error: "Internal error"})
        }
    }

    processRecharge = async (userDetials) =>{ 
        try{    
            // console.log(userDetials)
            let operatorDetails = this.getOperatorUuid(userDetials.rechargeNumber)
            if( operatorDetails.error ) return ({error : operatorDetails.error})

            let data = {
                operator_uuid : operatorDetails.operator_uuid,
                operatorName : operatorDetails.operatorName,
                amount : userDetials.rechargeAmount,
                mobile : userDetials.rechargeNumber,
                channelType : userDetials.userApplicationType == 4 ? "SMS" :"USSD",
                userid : userDetials.id,
                userType :  userDetials.type,
                user_uuid : userDetials.user_uuid,
                username : userDetials.userName,
                full_name : userDetials.fullName,
                user_mobile : String(userDetials.mobile).length == 10 ? userDetials.mobile : '0' + String(userDetials.mobile),
                userIpAddress : 0,
                userMacAddress : 0,
                userOsDetails : 0,
                userImeiNumber : 0,
                userGcmId : 0,
                userAppVersion : 0,
                userApplicationType : userDetials.userApplicationType //ussd request
            }

            let processRecharge = await rechargeController.processRecharge(data)

            if(processRecharge.status == 200) {

                return ({
                    rechargeAmount : userDetials.rechargeAmount,
                    rechargeNumber : userDetials.rechargeNumber,
                    rechargeTxnNumber : processRecharge.rechargeTxnNumber,
                    closingBalance : processRecharge.closingBalance
                })
            }
            else return ({ error : processRecharge.message})
            
        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    getOperatorUuid =  (recieverNumber) => {
        try{
            // Etisalat : 78 and 73
            // Roshan : 79 and 72 
            // MTN : 77 and 76
            // Salaam : 74
            // AWCC : 70 and 71

            let operatorInitial = recieverNumber.slice(0,3)

            // console.log(operatorInitial)

            switch(operatorInitial){
                case "078":
                case "073":
                    // Etisalat
                    return ({operator_uuid : "70b9906d-c2ba-11",operatorName : "Etisalat"})
                    break;
                case "079":
                case "072":
                    // Roshan
                    return ({operator_uuid : "9edb602c-c2ba-11",operatorName : "Roshan"})
                    break;
                case "077":
                case "076":
                    // MTN
                    return ({operator_uuid : "456a6b47-c2ba-11",operatorName : "MTN"})
                    break;
                case "074" :
                    // Salaam
                    return ({operator_uuid : "1e0e1eeb-c2a6-11",operatorName : "Salaam"})
                    break;
                case "070":
                case "071":
                    // AWCC
                    return ({operator_uuid : "6a904d84-c2a6-11",operatorName : "AWCC"})
                    break;
                default:
                    return ({ error : "Operator error for reciever number"})
            }
        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    getBalance = async (userDetials) =>{
        try{
            let searchKeyValue = { 
                userid : userDetials.id
            }
            let keyValue = ['ex_wallet']
            let balanceDetails = await sqlQuery.searchQuery(this.tableName2,searchKeyValue,keyValue,'userid','ASC', 1, 0)
            if(balanceDetails.length == 0) return ({error : "user balance not found"})

            // send sms
            let smsDetails = {
                agentId : userDetials.id,
                recieverMessage : `Dear ${userDetials.fullName} ${userDetials.userName}, Your available Bal is:${parseFloat(String(balanceDetails[0].ex_wallet)).toFixed(2)} AFN, Thank you for being Afghan Pay Agent!`
            }
            switch(String(userDetials.languageType)){
                case '2' : // Pashto
                    smsDetails.recieverMessage = `ښاغلی ${userDetials.userName}! ستاسو په حساب کې موجود کریډیټ ${parseFloat(String(balanceDetails[0].ex_wallet)).toFixed(2)} افغانی دی.  مننه، افغان پی.`
                    break;
                case '3' : // Dari
                    smsDetails.recieverMessage = `محترم ${userDetials.userName}! کریدت موجود در حساب شما ${parseFloat(String(balanceDetails[0].ex_wallet)).toFixed(2)} افغانی است. تشکر، افغان پی.`
                    break;
                case '1': // english
                default :
                    smsDetails.recieverMessage = `Dear ${userDetials.fullName} ${userDetials.userName}, Your available Bal is:${parseFloat(String(balanceDetails[0].ex_wallet)).toFixed(2)} AFN, Thank you for being Afghan Pay Agent!`
                    break;
            }
            smsFunction.agentSms(smsDetails, userDetials.mobile).then((smsFunResponce)=>{ 
                if(smsFunResponce.error){
                    // console.log('send sms error for agent : ',userDetials.userName)
                }else{
                    // console.log('sms added')
                }  
            })

            return ({userBalance : balanceDetails[0].ex_wallet})

        }catch(error){
            console.log(error)
            return({ error : "Internal error"})
        }
    }

    dailyTopUpReport = async (userDetials) =>{
        try{

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let searchKeyValue = {
                userid : userDetials.id,
                status : 2,
                created_on : isodate.slice(0, 10)
            }
            let keyValue = ['SUM(amount) as totalAmount']
            let dailyRechargeAmount = await sqlQueryReplica.searchQueryNoLimit(this.tableName3,searchKeyValue,keyValue,'id','asc')
            // if(dailyRechargeAmount.length == 0) return ({error : 'No recharge done today'})

            let topupAmount = dailyRechargeAmount[0].totalAmount == null ? 0 : dailyRechargeAmount[0].totalAmount
            
            // send sms
            let smsDetails = {
                agentId : userDetials.id,
                recieverMessage : `Your Today Total Recharge is:${parseFloat(String(topupAmount)).toFixed(2)} AFN, Thank you for being Afghan Pay Agent!`
            }
            switch(String(userDetials.languageType)){
                case '2' : // Pashto
                    smsDetails.recieverMessage = `ښاغلی ${userDetials.fullName}! ستاسو د نن ورځې ټول پرچون خرڅلاو ${parseFloat(String(topupAmount)).toFixed(2)} افغانۍ دي. مننه، افغان پی.`
                    break;
                case '3' : // Dari
                    smsDetails.recieverMessage = `محترم ${userDetials.fullName}! مجموعه فروشات پرچون امروز شما ${parseFloat(String(topupAmount)).toFixed(2)} افغانی است. تشکر، افغان پی.`
                    break;
                case '1': // english
                default :
                    smsDetails.recieverMessage = `Dear ${userDetials.fullName} ${userDetials.userName}, Your Today Total Recharge is:${parseFloat(String(topupAmount)).toFixed(2)} AFN,Thank you for being Afghan Pay Agent!`
                    break;
            }
            smsFunction.agentSms(smsDetails, userDetials.mobile).then((smsFunResponce)=>{ 
                if(smsFunResponce.error){
                    // console.log('send sms error for agent : ',userDetials.userName)
                }else{
                    // console.log('sms added')
                }  
            })

            return ({topupAmount })
        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    last5TxnReport = async (userDetials) => {
        try{    
            let searchKeyValue = {
                userid : userDetials.id,
            }
            let keyValue = ['status','mobile_number as rechargeNumber','amount','trans_number as txnId']
            let rechargeList = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, keyValue, 'id', 'desc', 5, 0)
            // console.log(rechargeList)

            // send sms
            if(rechargeList.length > 0){
                let smsList = []
                let message, allMessage = ''
                rechargeList.forEach((recharge)=>{
                    let {status,rechargeNumber,amount,txnId} = recharge
                    status = status == 1 ? 'Pending' : ( status == 2 ? 'Success' : 'Failed' )
                    message = `TXN Status:${status},Number:${rechargeNumber},Amount:${amount}AFN,ID:${txnId}`
                    switch(String(userDetials.languageType)){
                        case '2' : // Pashto
                            message = `حالت ${status} موبايل شمېره ${rechargeNumber} اندازه ${parseFloat(String(amount)).toFixed(2)}  افغانی د ترانزکشن شمېره ${txnId}.`
                            break;
                        case '3' : // Dari
                            message = `حالت ${status} نمبر مبایل ${rechargeNumber} مقدار ${parseFloat(String(amount)).toFixed(2)} افغانی نمبر ترانزکشن ${txnId}.`
                            break;
                        case '1': // english
                        default :
                            message = `TXN Status:${status}, Number:${rechargeNumber}, Amount:${parseFloat(String(amount)).toFixed(2)} AFN, ID:${txnId}`
                            break;
                    }

                    // if( message.length + allMessage.length < 140 ){
                    //     if(allMessage == ''){
                    //         allMessage = message
                    //     }else{
                    //         allMessage = allMessage + '\n' + message
                    //     }
                    // }else{
                    //     smsList.push(allMessage)
                    //     allMessage = ''
                    // }

                    smsList.push(message)
                })

                // console.log(smsList)

                smsList.forEach((smsMessage) => {
                    let smsDetails = {
                        agentId : userDetials.id,
                        recieverMessage : smsMessage
                    }
                    smsFunction.agentSms(smsDetails, userDetials.mobile).then((smsFunResponce)=>{ 
                        if(smsFunResponce.error){
                            // console.log('send sms error for agent : ',userDetials.userName)
                        }else{
                            // console.log('sms added')
                        }  
                    })
                })
            }
            return({txnCount : rechargeList.length})
        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    changeMpin = async (userDetials) =>{ 
        try{
            //start txn
            let transaction = await sqlQuery.specialCMD('transaction')

            // get increption key
            let serarchKeyValue = {
                userid : userDetials.id,
                Active : 1
            }
            let keyValue = ['m_pin','encryption_key','mpin_status']
            let encryptionKey = await sqlQueryReplica.searchQueryTran(this.tableName1,serarchKeyValue,keyValue,'userid','ASC',1,0) 

            let oldPin = varEncryptionString.decryptString(encryptionKey[0].encryption_key, encryptionKey[0].m_pin)

            // check old pin nad new pin
            if ( oldPin !=  userDetials.oldPin){
                return({error : 'Old pin not match'})
            }
    
            // update mpin
            let encryptedPin = varEncryptionString.encryptString(encryptionKey[0].encryption_key, String(userDetials.newPin))

            let updateDetails = {
                m_pin : encryptedPin
            }
            let updateResponce = await sqlQuery.updateQuery(this.tableName1, updateDetails, serarchKeyValue)
            const { affectedRows, changedRows, info } = updateResponce;
            if(affectedRows && changedRows){
                // add data in log tabel
                var data = { 
                    userid : userDetials.id,
                    username : userDetials.userName,
                    full_name : userDetials.fullName,
                    mobile : userDetials.mobile,
                    user_uuid : userDetials.user_uuid,
                    intCreatedByType : userDetials.id, 
                    intUserType : userDetials.type,
                    userIpAddress : 0, 
                    userMacAddress : 0, //str
                    userOsDetails : 0, //str
                    userImeiNumber : 0, //str
                    userGcmId : 0, //str
                    userAppVersion : 0, //str
                    userApplicationType : userDetials.userApplicationType,
                    description : 'Update Mpin',
                    userActivityType : 22,
                    oldValue : oldPin,
                    newValue : String(userDetials.newPin),
                    regionId : userDetials.redionId
                }

                // make api call
                const intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
                if( intResult != 1 ) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return({pinChangeMessage : 'error in adding log',pinChangeStatus : 0})
                }else{
                    let commit = await sqlQuery.specialCMD('commit')

                    // send sms
                    let smsDetails = {
                        agentId : userDetials.id,
                        recieverMessage : `Dear ${userDetials.fullName} ${userDetials.userName} your M-pin successfully changed to ${String(userDetials.newPin)}, Thank you for being Afghan Pay Agent!`
                    }
                    switch(String(userDetials.languageType)){
                        case '2' : // Pashto
                            smsDetails.recieverMessage = `ښاغلی ${userDetials.fullName}! ستاسو کوډ ${String(userDetials.newPin)} بدل شو، ډېره مننه چې د افغان پی استازی یاست!`
                            break;
                        case '3' : // Dari
                            smsDetails.recieverMessage = `محترم ${userDetials.fullName}! کود شما به ${String(userDetials.newPin)} تغییر کرد، تشکر از اینکه نماینده افغان پی هستد!`
                            break;
                        case '1': // english
                        default :
                            smsDetails.recieverMessage = `Dear ${userDetials.fullName} ${userDetials.userName} your M-pin successfully changed to ${String(userDetials.newPin)}, Thank you for being Afghan Pay Agent!`
                            break;
                    }
                    smsFunction.agentSms(smsDetails, userDetials.mobile).then((smsFunResponce)=>{ 
                        if(smsFunResponce.error){
                            // console.log('send sms error for agent : ',userDetials.userName)
                        }else{
                            // console.log('sms added')
                        }  
                    })

                    return({pinChangeMessage : 'M-Pin updates successfullt',
                            pinChangeStatus : 1,
                            newPin : String(userDetials.newPin)})
                }
            }else{
                return({pinChangeMessage : 'error in updating m-pin',
                            pinChangeStatus : 0})
            }

        }catch(error){
            let rollback = await sqlQuery.specialCMD('rollback')
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    stockTransfer = async (userDetials) =>{ 
        try{
            // get user details
            let serarchKeyValue = {
                username : userDetials.recieverId,
                Active : 1
            }
            let keyValue = ['userid','CAST(user_uuid AS CHAR(16)) AS user_uuid','username','full_name']
            let recieverDetails = await sqlQueryReplica.searchQuery(this.tableName1,serarchKeyValue,keyValue,'userid','ASC',1,0)
            if(recieverDetails.length == 0){
                return({ error : 'Reciever id not found'})
            }
            // call function to transfer the stock
            let data = {
                id : 0,
                userid :  userDetials.id, //str
                user_uuid : userDetials.user_uuid,
                username : userDetials.userName,
                name :  userDetials.fullName,
                mobile : userDetials.mobile,
                region_id : userDetials.redionId,
                type : userDetials.type, // userList
                amount : userDetials.amountTransfered,
                reciever_uuid : recieverDetails[0].user_uuid, // str
                ip_address : 0,
                mac_address : 0,
                os_details : 0,
                imei_no : 0,
                gcm_id : 0,  // to send notification
                app_version : 0,  // our app version
                source : userDetials.userApplicationType == 4 ? "SMS" :"USSD",  // 1: web, 2 : app
                languageType : userDetials.languageType,
                checkParent : 1
            }
            let stockTransferResponce
            let stockTransferStatus = await sqlQuery.searchQueryNoCon(this.tableName8,['stock_transfer'],'stock_transfer', 'ASC', 1, 0)
            if(stockTransferStatus.length == 0 || stockTransferStatus[0].stock_transfer == 0){
                stockTransferResponce = {status : 400, message : 'Stock transfer is not allowed for a while.'}
            }else{
                stockTransferResponce = await stockTransferController.processStockTransfer(data)
            }

            // console.log(stockTransferResponce)

            if (stockTransferResponce.status == 200){
                return({
                    transferedAmount : userDetials.amountTransfered,
                    recieverNumber : stockTransferResponce.recieverNumber || 0,
                    recieverName : recieverDetails[0].full_name,
                    recieverUsername : recieverDetails[0].username,
                    transactionId : stockTransferResponce.transactionId,
                    closingBalance : stockTransferResponce.closingBalance
                })
            }else{
                return ({ error : stockTransferResponce.message})
            }

        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    dailyStockTransferReport = async (userDetials) =>{ 
        try{

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // sql query to get sum of all stock transfered
            let searchKeyValue = {
                sender_id : userDetials.id,
                created_on : isodate.slice(0, 10)
            }
            let keyValue = ['SUM(transfer_amt) as totalAmount']
            let dailyRechargeAmount = await sqlQueryReplica.searchQueryNoLimit(this.tableName4,searchKeyValue,keyValue,'id','asc')
            // if(dailyRechargeAmount.length == 0) return ({error : 'No recharge done today'})
            let stockTransferAmount = dailyRechargeAmount[0].totalAmount == null ? 0 : dailyRechargeAmount[0].totalAmount
            
            // send sms
            let smsDetails = {
                agentId : userDetials.id,
                recieverMessage : `Dear ${userDetials.fullName} ${userDetials.userName} your today total stock transfer amount is ${parseFloat(String(stockTransferAmount)).toFixed(2)} AFN, Thanks for being Afghan Pay agent!`
            }
            switch(String(userDetials.languageType)){
                case '2' : // Pashto
                    smsDetails.recieverMessage = `محترم ${userDetials.fullName}! ستاسو د نن ورځې ټول عمده خرڅلاو ${parseFloat(String(stockTransferAmount)).toFixed(2)} افغانۍ دي. مننه، افغان پی.`
                    break;
                case '3' : // Dari
                    smsDetails.recieverMessage = `محترم ${userDetials.fullName} مجموعه فروشات عمده امروز شما ${parseFloat(String(stockTransferAmount)).toFixed(2)} است، تشکر افغان پی.`
                    break;
                case '1': // english
                default :
                    smsDetails.recieverMessage = `Dear ${userDetials.fullName} ${userDetials.userName} your today total stock transfer amount is ${parseFloat(String(stockTransferAmount)).toFixed(2)} AFN, Thanks for being Afghan Pay agent!`
                    break;
            }
            smsFunction.agentSms(smsDetails, userDetials.mobile).then((smsFunResponce)=>{ 
                if(smsFunResponce.error){
                    // console.log('send sms error for agent : ',userDetials.userName)
                }else{
                    // console.log('sms added')
                }  
            })
            
            return ({stockTransferAmount })
        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    checkTxnStatusByNumber = async (userDetials) =>{ 
        try{
            // sql query to get recharge status for perticular number
            let searchKeyValue = {
                userid : userDetials.id,
                mobile_number : userDetials.checkNumber
            }
            let keyValue = ['mobile_number AS txnNumber','status','amount','CAST(created_on AS CHAR(20)) as created_on']
            let rechargeDetails = await sqlQueryReplica.searchQuery(this.tableName3,searchKeyValue,keyValue,'id','desc',1,0)
            if(rechargeDetails.length == 0) return ({ error : 'No record found' })

            let responceDetails = {
                rechargeDetails : 1,
                txnNumber : rechargeDetails[0].txnNumber,
                rechargeStatus : rechargeDetails[0].status == 1 ? 'Pending' : (rechargeDetails[0].status == 2 ? 'Success' : 'Failed'),
                rechargeAmount : rechargeDetails[0].amount,
                rechargeDate : rechargeDetails[0].created_on 
            }

            // send sms
            let smsDetails = {
                agentId : userDetials.id,
                recieverMessage : `TXN Status ${responceDetails.rechargeStatus}, TXN Amount ${responceDetails.rechargeAmount} AFN, Recharged No ${responceDetails.txnNumber}, TXN Date ${responceDetails.rechargeDate}`
            }
            switch(String(userDetials.languageType)){
                case '2' : // Pashto
                    smsDetails.recieverMessage = `حالت ${responceDetails.rechargeStatus} ګرځنده شمیره ${responceDetails.txnNumber} اندازه ${parseFloat(String(responceDetails.rechargeAmount)).toFixed(2)} افغاتی. تاریخ ${responceDetails.rechargeDate}`
                    break;
                case '3' : // Dari
                    smsDetails.recieverMessage = `حالت ${responceDetails.rechargeStatus} نمبر مبایل ${responceDetails.txnNumber} مقدار ${parseFloat(String(responceDetails.rechargeAmount)).toFixed(2)} افغانی. تاریخ: ${responceDetails.rechargeDate}.`
                    break;
                case '1': // english
                default :
                    smsDetails.recieverMessage = `TXN Status ${responceDetails.rechargeStatus}, TXN Amount ${parseFloat(String(responceDetails.rechargeAmount)).toFixed(2)} AFN, Recharged No ${responceDetails.txnNumber}, TXN Date ${responceDetails.rechargeDate}`
                    break;
            }
            smsFunction.agentSms(smsDetails, userDetials.mobile).then((smsFunResponce)=>{ 
                if(smsFunResponce.error){
                    // console.log('send sms error for agent : ',userDetials.userName)
                }else{
                    // console.log('sms added')
                }  
            })

            return(responceDetails)
        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    checkRollbackAmount = async (userDetials) =>{ 
        try{

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var endDate = date.toISOString().slice(0, 10);

            var date = new Date();
            date.setDate(date.getDate() - 7);
            var startDate = date.toISOString().slice(0, 10);

            // call sql for sum of all rollback amount today
            // sql query to get recharge status for perticular number
            let searchKeyValue = {
                userid : userDetials.id,
                rollback_status : 3,
                between : {
                    key : 'date(rollback_confirm_on)',
                    value : [startDate, endDate]
                }
            }
            let keyValue = ['SUM(rollback_amount) As rollbackAmount']
            let rollbackDetails = await sqlQueryReplica.searchQueryNoLimit(this.tableName3,searchKeyValue,keyValue,'id','desc')

            let rollbackAmount = rollbackDetails[0].rollbackAmount == null ? 0 : rollbackDetails[0].rollbackAmount

            // send sms
            let smsDetails = {
                agentId : userDetials.id,
                recieverMessage : `Dear ${userDetials.fullName} ${userDetials.userName}, you received amount of ${parseFloat(String(rollbackAmount)).toFixed(2)} AFN against your rollback requests`
            }
            switch(String(userDetials.languageType)){
                case '2' : // Pashto
                    smsDetails.recieverMessage = `ښاغلی ${userDetials.fullName}! تاسو ${parseFloat(String(rollbackAmount)).toFixed(2)} افغانۍ د خپلو بېرته ګرځېدلو څخه ترلاسه کړې. مننه چې د افغان پی استازی یاست!`
                    break;
                case '3' : // Dari
                    smsDetails.recieverMessage = `محترم ${userDetials.fullName}! شما مقدار ${parseFloat(String(rollbackAmount)).toFixed(2)} افغانی را در بدل برگشتی هایتان دریافت نمودید، تشکر از اینکه نماینده افغان پی هستید!`
                    break;
                case '1': // english
                default :
                    smsDetails.recieverMessage = `Dear ${userDetials.fullName} ${userDetials.userName}, you received amount of ${parseFloat(String(rollbackAmount)).toFixed(2)} AFN against your rollback requests`
                    break;
            }
            smsFunction.agentSms(smsDetails, userDetials.mobile).then((smsFunResponce)=>{ 
                if(smsFunResponce.error){
                    // console.log('send sms error for agent : ',userDetials.userName)
                }else{
                    // console.log('sms added')
                }  
            })

            return ({ rollbackAmount })
        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }

    checkRollbackByNumber = async (userDetials) =>{ 
        try{

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // call sql for sum of all rollback amount today
            // sql query to get recharge status for perticular number
            let searchKeyValue = {
                userid : userDetials.id,
                mobile_number : userDetials.checkNumber,
                rollback_status : 3,
                // 'CAST(rollback_confirm_on AS DATE)': isodate.slice(0, 10)
            }
            let keyValue = ['SUM(rollback_amount) As rollbackAmount']
            let rollbackDetails = await sqlQueryReplica.searchQuery(this.tableName3,searchKeyValue,keyValue,'rollback_confirm_on','desc',3,0)
            // if(rechargeDetails.length == 0) return ({ rechargeDetails : 0 })
            
            let rollbackDetail = {
                rollbackAmount : rollbackDetails[0].rollbackAmount == null ? 0 : rollbackDetails[0].rollbackAmount,
                rollbackNumber : userDetials.checkNumber
            }

            // send sms
            let smsDetails = {
                agentId : userDetials.id,
                recieverMessage : `Dear ${userDetials.fullName} ${userDetials.userName}, you received amount of ${parseFloat(String(rollbackDetail.rollbackAmount)).toFixed(2)} AFN from your rollback request ${rollbackDetail.rollbackNumber}`
            }
            switch(String(userDetials.languageType)){
                case '2' : // Pashto
                    smsDetails.recieverMessage = `ښاغلی ${userDetials.fullName}! تاسو د ${rollbackDetail.rollbackNumber}  بېرته ګرځېدلو په بدل کې ${parseFloat(String(rollbackDetail.rollbackAmount)).toFixed(2)} افغانی ترلاسه کړی. مننه چې د افغان پی استازی یاست!`
                    break;
                case '3' : // Dari
                    smsDetails.recieverMessage = `محترم ${userDetials.fullName}! شما ${parseFloat(String(rollbackDetail.rollbackAmount)).toFixed(2)} افغانی در بدل برگشتی ${rollbackDetail.rollbackNumber} دریافت نمودید. تشکراز اینکه نماینده افغان پی هستید!`
                    break;
                case '1': // english
                default :
                    smsDetails.recieverMessage = `Dear ${userDetials.fullName} ${userDetials.userName}, you received amount of ${parseFloat(String(rollbackDetail.rollbackAmount)).toFixed(2)} AFN  from your rollback request ${rollbackDetail.rollbackNumber}`
                    break;
            }
            smsFunction.agentSms(smsDetails, userDetials.mobile).then((smsFunResponce)=>{ 
                if(smsFunResponce.error){
                    // console.log('send sms error for agent : ',userDetials.userName)
                }else{
                    // console.log('sms added')
                }  
            })
            
            return(rollbackDetail)
        }catch(error){
            console.log(error)
            return ({ error : "Internal error"})
        }
    }
}

module.exports = new ussdController