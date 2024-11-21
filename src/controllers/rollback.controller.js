const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const rollbackModule = require('../models/rollback.module')
const commonQueryCommon = require('../common/commonQuery.common')
const role = require('../utils/userRoles.utils')
const { apiCall, apiCallData } = require('../common/makeApiCall.common')

const dotenv = require('dotenv');
const path = require('path');

const { start,sendMessage,createWorker } = require('../common/rabbitmq.common')

const smsFunction = require('../common/smsFunction.common')

const stockTransfer = require('./stock.controller')

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');

const redisMaster = require('../common/master/radisMaster.common')

// configer env
dotenv.config()

// const { toIsoString } = require('../common/timeFunction.common')

const varRandomString = require('../utils/randomString.utils');

class rollbackController {

    // table names
    // tableName1 = `er_rollback`
    tableName2 = `er_wallet`
    tableName3 = 'er_wallet_transaction'
    tableName4 = 'er_login'
    tableName5 = 'er_wallet_transfer_individual'
    tableName6 = 'er_rollback_amount'
    tableName7 = 'er_money_current_balance'
    tableName8 = 'er_operator_current_balance'
    tableName9 = 'er_rollback_amount'
    tableName10 = 'er_master_operator'
    tableName11 = 'er_emoney'
    tableName12 = 'er_recharge'
    tableName13 = 'er_postpaid_commission'
    tableName14 = 'er_mno_details'
    tableName15 = 'er_access_status'

    constructor(){
        start().then((msg) =>{
            if(process.env.START_RABBIT_MQ_WORKER == 1){
                // console.log(msg);
                // createWorker('SMS',this.smsWorker)
                if(msg == 'connection created'){
                    // createWorker('deductRollback', this.cons)
                    createWorker('deductRollback', this.deductRollback)

                    // createWorker('processTransferRollbackAmount', this.cons)
                    createWorker('processTransferRollbackAmount', this.processTransferRollbackAmount)
                }
            }
        })
    }

    cons = (msg) =>{
        console.log(msg)
    }

    // functions
    rollbackTransaction = async (req, res, next) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('rollback/rollbackTransaction',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit offset
                // let offset = req.query.start
                // let limit = req.query.end - offset

            // search param
                let searchKeyValue = {
                    rollback_status : 1,
                    // region_ids : req.body.user_detials.region_list.join(',')
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                if ( req.query.userid ) searchKeyValue.userid = req.query.userid
                if ( req.query.name ) searchKeyValue.userName = req.query.name
                if ( req.query.mobile ) searchKeyValue.mobile_number = req.query.mobile
                if ( req.query.txnNumber ) searchKeyValue.trans_number = req.query.txnNumber
                if ( req.query.operator_uuid ){
                    let operatorList = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                    if(operatorList == 0) return res.status(400).json({ errors: [ {msg : "operator id not found"}] });  
                    searchKeyValue.operator_id = operatorList[0].operator_id
                }
                // check date for start and end 
                if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
                
                if (req.query.startDate) {
                    searchKeyValue.between = {
                        key : 'rollback_confirm_on',
                        value : [req.query.startDate,req.query.endDate]
                    }
                }

            // if search param is proper
                if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : 'Improper search param'}] }); 

                let lisTotalRecords = await rollbackModule.rollbackTransactionCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // get report from model
                let rollbackList = await rollbackModule.rollbackTransaction(searchKeyValue, limit, offset)
                // if(rollbackList.length == 0) return res.status(204).send({ message : 'no rollback report found'})
                
            // send responce to front end_date
                // res.status(200).send(rollbackList)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(rollbackList)
                }else{
                    res.status(200).send({
                        reportList : rollbackList,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT),
                        totalRechargeAmount : lisTotalRecords[0].totalRechargeAmount || 0,
                        totalDeductedAmt : lisTotalRecords[0].totalDeductedAmt || 0
                    })
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    acceptRollbackTransaction = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('rollback/acceptRollbackTransaction',JSON.stringify(req.body), JSON.stringify(req.query))
            // check for rollback details
                let searchKeyValue = {
                    // region_ids : req.body.user_detials.region_list.join(','), //db
                    rollback_status : 1,
                    trans_number : req.body.txnNumber
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
                
                let rollbackDetails = await rollbackModule.rollbackTransactionDetails(searchKeyValue, 1, 0)

                if(rollbackDetails.length == 0) return res.status(400).json({ errors: [ {msg : "Rollback request not found"}] }); 

                if(rollbackDetails[0].apiType == 4){
                    // make api call and get response from mno
                    let data = {
                        "rollbackId" : req.body.txnNumber,
                        "amount" : rollbackDetails[0].recargeAmt,
                    }
                    let url = process.env.ETISALAT_ROLLBACK_API
                    let apiResponse = await apiCallData(url,data)
                    if(apiResponse.error) return res.status(400).json({ errors: [ {msg : "Rollback Failed, please try after some time"}] });
                    apiResponse = JSON.parse(apiResponse)
                    if(apiResponse.error) return res.status(400).json({ errors: [ {msg : "Rollback error from mno"}] });

                    // message : String(data).replace("'SC'","SC"),
                    // rechargeId : rechargeMML.rechargeId,
                    // rechargeRequest : rechargeMML.message,
                    // rollbackId : rechargeMML.rollbackId,
                    // status : status,
                    // rollbackAmount : rollbackAmount

                    if(apiResponse.status == "FAILED"){

                        var date = new Date();
                        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                        var isodate = date.toISOString();

                        // process rollback 
                        data = {
                            amount : Number(apiResponse.rollbackAmount), 
                            txnNumber : req.body.txnNumber,
                            user_detials : req.body.user_detials
                        }

                        // update param
                        let param = {
                            rollback_confirm_on : isodate, //dt current date time
                            concat : {
                                key : 'os_details',
                                value :  " @@ "+ apiResponse.message,
                            },
                        }
                        searchKeyValue = {
                            rollback_status : 1,
                            trans_number : req.body.txnNumber
                        }
                        let updateQueResponce = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

                        return res.status(400).json({ errors: [ {msg :"Rollback process failed, please try again."}]})
                    } 

                    var date = new Date();
                    date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                    var isodate = date.toISOString();

                    // process rollback 
                    data = {
                        amount : Number(apiResponse.rollbackAmount), 
                        txnNumber : req.body.txnNumber,
                        user_detials : req.body.user_detials
                    }

                    // update param
                    let param = {
                        rollback_status : 2,
                        rollback_confirm_on : isodate, //dt current date time
                        concat : {
                            key : 'os_details',
                            value :  " @@ "+ apiResponse.message,
                        },
                    }
                    searchKeyValue = {
                        rollback_status : 1,
                        trans_number : req.body.txnNumber
                    }
                    let updateQueResponce = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

                    let rollbackResponse = await this.processTransferRollbackAmount(data)

                    if (rollbackResponse.status == 200){
                        return res.status(200).send({message : `Rollback successfully, ${Number(apiResponse.rollbackAmount)} AFN rollback's to Agent Account`})
                    }else{
                        return res.status(400).json({ errors: [ {msg : rollbackResponse.message}] }); 
                    }

                }else{
                    var date = new Date();
                    date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                    var isodate = date.toISOString();

                // update param
                    let param = {
                        rollback_status : 2,
                        rollback_confirm_on : isodate, //dt current date time
                    }
                    searchKeyValue = {
                        rollback_status : 1,
                        trans_number : req.body.txnNumber
                    }
                    let updateQueResponce = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

                // send responce to front end
                    const { affectedRows, changedRows, info } = updateQueResponce;
                    const message = !affectedRows ? 'Rollback request already processed' :
                        affectedRows && changedRows ? 'Rollback accepted successfully' : 'Rollback action already done';

                    res.send({ message, info });
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    rejectRollbackTransaction = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('rollback/rejectRollbackTransaction',JSON.stringify(req.body), JSON.stringify(req.query))
            // check for rollback details
                let searchKeyValue = {
                    // region_ids : req.body.user_detials.region_list.join(','), //db
                    trans_number : req.body.txnNumber
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                let rollbackDetails = await rollbackModule.rollbackTxnDetails(searchKeyValue)

                if(rollbackDetails.length == 0) return res.status(400).json({ errors: [ {msg : "Rollback request not found"}] });

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // update param
                let param = {
                    rollback_status : 4,
                    rollback_confirm_on : isodate, //dt current date time
                    comment : req.body.comment
                }
                searchKeyValue = {
                    rollback_status : 1,
                    trans_number : req.body.txnNumber
                }
                let updateQueResponce = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

            // send responce to front end
                const { affectedRows, changedRows, info } = updateQueResponce;
                const message = !affectedRows ? 'Rollback request already processed' :
                    affectedRows && changedRows ? 'Rollback request rejected successfully' : 'Rollback action already done';

                if(affectedRows && changedRows){
                    // send sms to agent
                    let smsDetails = {
                        agentId :  rollbackDetails[0].userid,
                        recieverMessage : `Dear ${rollbackDetails[0].agnetName} Your Rollback for amount of: ${rollbackDetails[0].recargeAmt} AFN Against No: ${rollbackDetails[0].rechangeMobile} has been failed due to low balance in customer GSM, Thanks for being Afghan Pay Agent`
                        // `Dear ${lisResponce4[0].full_name}, You received amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN from ${data.name}, TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                    }

                    smsFunction.agentSms(smsDetails).then((smsFunResponce)=>{ 
                        if(smsFunResponce.error){
                            // console.log('send sms error for agent : ',lisResponce4[0].username)
                        }else{
                            // console.log('sms added')
                        }  
                    })
                }

                res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    pendingRollback = async (req, res) => {
        try{

            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('rollback/pendingRollback',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // search param
                let searchKeyValue = {
                    Active: 1,
                    // region_ids : req.body.user_detials.region_list.join(',')
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                if ( req.query.userid ) searchKeyValue.userid = req.query.userid
                if ( req.query.name ) searchKeyValue.userName = req.query.name
                if ( req.query.mobile ) searchKeyValue.mobile_number = req.query.mobile
                if ( req.query.operator_uuid ){
                    let operatorList = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                    if(operatorList == 0) return res.status(400).json({ errors: [ {msg : "operator id not found"}] });  
                    searchKeyValue.operator_id = operatorList[0].operator_id
                }
                
                if(req.query.status){
                    searchKeyValue.status = req.query.status
                }else{
                    searchKeyValue.status = ' 1,2,3,4 '
                }

                // check date for start and end 
                if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

                if (req.query.startDate) {
                    searchKeyValue.between = {
                        key : 'rollback_confirm_on',
                        value : [req.query.startDate,req.query.endDate]
                    }
                }

                let lisTotalRecords = await rollbackModule.pendingRollbackCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // if search param is proper
                if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : 'Improper search param'}] }); 

                let rollbackList = await rollbackModule.pendingRollback(searchKeyValue, limit, offset)
                // if(rollbackList.length == 0) return res.status(204).send('No report found')

                // let statusList = ['','Pending','Accept','Complete','Reject']

                // rollbackList = rollbackList.map((rollback) => {
                //     let {status,comment, ...other} = rollback
                //     other.comment = comment == null ? 'NA' : comment
                //     other.status = statusList[status]
                //     return other
                // })
                
                // res.status(200).send(rollbackList)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(rollbackList)
                }else{
                    res.status(200).send({
                        reportList : rollbackList,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT),
                        totalRechargeAmt : lisTotalRecords[0].totalRechargeAmt || 0,
                        totalDeductedAmt : lisTotalRecords[0].totalDeductedAmt || 0,
                        totalRollbackAmt : lisTotalRecords[0].totalRollbackAmt || 0
                    })
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    etisalatPen = async (req,res) =>{
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('rollback/etisaltPen',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

                let searchKeyValue = {
                    // region_ids : req.body.user_detials.region_list.join(','),
                    operator_id : 4
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                if ( req.query.userid ) searchKeyValue.userid = req.query.userid
                if ( req.query.name ) searchKeyValue.userName = req.query.name
                if ( req.query.mobile ) searchKeyValue.mobile_number = req.query.mobile

                if(req.query.status){
                    switch(String(req.query.status)){
                        case '1' : 
                            searchKeyValue.status = ' 1,2 '
                            break;
                        case '2' :
                            searchKeyValue.status = ' 3 '
                            break;
                        case '3' :
                            searchKeyValue.status = ' 4 '
                            break;
                        default :
                            searchKeyValue.status = ' 1,2,3,4 '
                            break;
                    }
                }else{
                    searchKeyValue.status = ' 1,2,3,4 '
                }

                if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

                if (req.query.startDate) {
                    searchKeyValue.between = {
                        key : 'rollback_confirm_on',
                        value : [req.query.startDate,req.query.endDate]
                    }
                }

                let lisTotalRecords = await rollbackModule.pendingRollbackCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                let rollbackList = await rollbackModule.pendingRollback(searchKeyValue, limit, offset)
                // if(rollbackList.length == 0) return res.status(204).send('No report found')

                // rollbackList = rollbackList.map((rollback) => {
                //     let {status,comment, ...other} = rollback
                //     other.comment = comment == null ? 'NA' : comment
                //     other.status = status == 3 ? 'Accept' : ( status == 4 ? 'Reject' : 'Pending')
                //     return other
                // })

                // res.status(200).send(rollbackList)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(rollbackList)
                }else{
                    res.status(200).send({
                        reportList : rollbackList,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT),
                        totalRechargeAmt : lisTotalRecords[0].totalRechargeAmt,
                        totalDeductedAmt : lisTotalRecords[0].totalDeductedAmt,
                        totalRollbackAmt : lisTotalRecords[0].totalRollbackAmt
                    })
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    acceptRollbackTransactionMNO = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('rollback/acceptRollbackTreansactionMno',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // update param
                let param = {
                    rollback_status : 3,
                    rollback_confirm_on : isodate,
                    rollback_amount : req.body.amount
                }
                let searchKeyValue = {
                    rollback_status : 1,
                    trans_number : req.body.txnNumber
                }
                let updateQueResponce = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

            // send responce to front end
                const { affectedRows, changedRows, info } = updateQueResponce;
                const message = !affectedRows ? 'Rollback not found' :
                    affectedRows && changedRows ? 'Rollback updated successfully' : 'Details Updated';

                res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    rejectRollbackTransactionMNO = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('rollback/rejectRollbackTransactionMNo',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // update param
                let param = {
                    rollback_status : 5,
                    rollback_confirm_on : isodate
                }
                let searchKeyValue = {
                    rollback_status : 1,
                    trans_number : req.body.txnNumber
                }
                let updateQueResponce = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

            // send responce to front end
                const { affectedRows, changedRows, info } = updateQueResponce;
                const message = !affectedRows ? 'Rollback not found' :
                    affectedRows && changedRows ? 'Rollback updated successfully' : 'Details Updated';

                res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    transferAmtForRollback = async (req,res) => {
        try{
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('rollback/transferAmtForRollback',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let data = {
                amount : req.body.amount, 
                txnNumber : req.body.txnNumber,
                user_detials : req.body.user_detials,
                userIpAddress : req.body.userIpAddress, //str
                userMacAddress : req.body.userMacAddress, //str
                userOsDetails :  req.body.userOsDetails,
                userImeiNumber : req.body.userImeiNumber,
                userGcmId : req.body.userGcmId,
                userAppVersion : req.body.userAppVersion,
                userApplicationType : req.body.userApplicationType
            }

            let rollbackResponse = await this.processTransferRollbackAmount(data)

            if (rollbackResponse.status == 200){
                res.status(200).send({message : rollbackResponse.message})
            }else{
                return res.status(400).json({ errors: [ {msg : rollbackResponse.message}] }); 
            }

        }catch(error){
            console.log(error)
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    processTransferRollbackAmount = async (data) => {
        try{    
                // console.log(typeof data,typeof JSON.stringify(data))
                if(typeof data == "string"){
                    data = JSON.parse(data);
                }

                let dataString = JSON.stringify(data);

                var date = new Date();  
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                if((!Number(data.amount)) || (Number(data.amount) <= 0)) return{status : 400, message :'Rollback amount should be more then 0' }

                let stockTransferStatusCheck = await sqlQuery.searchQueryNoCon(this.tableName15,['stock_transfer'],'stock_transfer', 'ASC', 1, 0)
                if(stockTransferStatusCheck.length == 0 || stockTransferStatusCheck[0].stock_transfer == 0) return {status : 400, message :  'Stock transfer is not allowed for a while'}

            // search the rollback request
                let rollbackSearchKeyValue = {
                    trans_number : data.txnNumber,
                    rollback_status : 2,
                }

                let rollbackRequest = await rollbackModule.agentRollback(rollbackSearchKeyValue)
                if(rollbackRequest.length == 0) return {status : 400, message : 'Rollback request not found'}

                // console.log(rollbackRequest[0].rollbackAmt)
                if(Number(data.amount) > Number(rollbackRequest[0].rechargeAmount)) return {status : 400, message : "Amount can't be more then recharge amount"}
                // if(Number(rollbackRequest[0].rechargeAmount) )

            // update recharge status
                rollbackSearchKeyValue = {
                    rollback_status : 2,
                    trans_number : data.txnNumber,
                }
                let updateResponce = await sqlQuery.updateQuery(this.tableName12,{
                    // status : 3,
                    rollback_status : 3,
                    rollback_confirm_on : isodate,
                    rollback_amount : (Number(data.amount)),
                    deductBalance : {
                        key : 'deduct_amt',
                        value : data.amount
                    }
                },rollbackSearchKeyValue)
                
                if(!(updateResponce.affectedRows && updateResponce.changedRows)) return {status : 400, message : 'Rollback request not found'}  

                data.reciever_uuid = rollbackRequest[0].user_uuid

                data = {
                    id : data.user_detials.id,
                    reciever_uuid : data.reciever_uuid, // str
                    userid :  data.user_detials.userid, //str
                    name :  data.user_detials.name,
                    mobile : data.user_detials.mobile,
                    amount : data.amount,
                    user_uuid : data.user_detials.user_uuid,
                    username : data.user_detials.username,
                    region_id : data.user_detials.region_id,
                    type : data.user_detials.type, // userList
                    ip_address :data.userIpAddress ?  data.userIpAddress : 0,
                    mac_address : data.userMacAddress ?  data.userMacAddress : 0,
                    os_details : data.userOsDetails ?  data.userOsDetails : 0,
                    imei_no : data.userImeiNumber ?  data.userImeiNumber : 0,
                    gcm_id : data.userGcmId ?  data.userGcmId : 0,  // to send notification
                    app_version : data.userAppVersion ?  data.userAppVersion : 0,  // our app version
                    source : data.userApplicationType ?  data.userApplicationType : 1,  // 1: web, 2 : app
                    transactionId : data.txnNumber,
                    senderTxnMessage : 'Transferred Rollback amount for '+rollbackRequest[0].rechargeNumber,
                    recieverTxnMessage : 'Received rollback amount for '+rollbackRequest[0].rechargeNumber,
                    rechargeAmount : Number(rollbackRequest[0].rechargeAmount), 
                    rechangeNumber : rollbackRequest[0].rechargeNumber,
                    rollbackStatus : 1,
                }
/***********************************************************************************************************/
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
                if(lisResponce4.length == 0) {
                    await this.#resetRollbackStatus(data)
                    return {status : 400, message : 'reciever account not found!'}
                }
                if(lisResponce4[0].user_status != 1){
                    await this.#resetRollbackStatus(data)
                    setTimeout(()=>{
                        sendMessage('processTransferRollbackAmount',dataString,(err,msg)=>{
                            if(err) console.log(err)
                        })
                    },1000)
                    return {status : 400, message : 'Activate the reciever account to complete the rollback process!'}
                } 
            
            // 2
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
                var objResponce = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

                // checking sql responce
                if (!objResponce) {
                    await this.#resetRollbackStatus(data)
                    // await reset(this.tableName1, data.user_uuid)
                    setTimeout(()=>{
                        sendMessage('processTransferRollbackAmount',dataString,(err,msg)=>{
                            if(err) console.log(err)
                        })
                    },1000)
                    return {status : 400, message : 'Transaction status error'}
                }
                var { affectedRows, changedRows, info } = objResponce;

                // generating proper message
                if (!affectedRows) {
                    await this.#resetRollbackStatus(data)
                    // await reset(this.tableName2, data.user_uuid)
                    setTimeout(()=>{
                        sendMessage('processTransferRollbackAmount',dataString,(err,msg)=>{
                            if(err) console.log(err)
                        })
                    },1000)
                    return {status : 400, message : 'Earlier transaction under process.'}
                }
                if (!(affectedRows && changedRows)) {
                    await this.#resetRollbackStatus(data)
                    // await reset(this.tableName2, data.user_uuid)
                    setTimeout(()=>{
                        sendMessage('processTransferRollbackAmount',dataString,(err,msg)=>{
                            if(err) console.log(err)
                        })
                    },1000)
                    return {status : 400, message : 'Earlier transation under process'}
                    // return res.status(200).send({ message: 'reviever earlier transation under process' })
                }
            
            // 3)- start transaction
                var objResponce = await sqlQuery.specialCMD('transaction')
                if (!objResponce) {
                    await this.#resetRollbackStatus(data)
                    setTimeout(()=>{
                        sendMessage('processTransferRollbackAmount',dataString,(err,msg)=>{
                            if(err) console.log(err)
                        })
                    },1000)
                    await reset(this.tableName2, data.reciever_uuid)
                    return {status : 400, message : 'Transaction error'}
                }

            //5)- add money to reciever wallet 
                //get the reciever balance
                var searchKeyValue = {
                    user_uuid: data.reciever_uuid //str reciever_uuid
                }
                var key = ["ex_wallet AS wallet", "userid","comm_wallet"]
                var orderby = "wallet_id"
                var ordertype = "ASC"

                // fire sql query to get reciever balance
                const lisResponce2 = await sqlQuery.searchQueryTran(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)
                
                const dbReviceBalance = lisResponce2.length === 0 ? 0 : lisResponce2[0].wallet
                var strRecieverId = lisResponce2.length === 0 ? 0 : lisResponce2[0].userid

            //update reciever balanced
                var param = {
                    addBalance : { 
                        key: "ex_wallet",
                        value: Number(data.amount)
                    },
                    canTransfer: 1
                    // ex_wallet: Number(dbReviceBalance) + Number(data.amount) + commissionAmt, //db balance
                    // comm_wallet : Number(lisResponce2[0].comm_wallet) + commissionAmt
                }
                var searchKeyValue = {
                    user_uuid: data.reciever_uuid, // str reciever user uuid
                }

                let messageQueue = { 
                    userId : lisResponce4[0].userid, 
                    amount : data.amount, 
                    dateTime : isodate
                }
                sendMessage('processedStockReceived',JSON.stringify(messageQueue),(err,msg)=>{
                    if(err) console.log(err)
                })

                // fire sql query
                var objResponce = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);
                if(!objResponce.affectedRows){
                    await this.#resetRollbackStatus(data)
                    console.log("rollback recierer account  not updated: ",data.reciever_uuid)
                    return {status : 400, message : 'Receiver account updated error'}
                }

            //6)- create er wallet transaction recipt for reciever
                //sql varialbles
                param = {
                    wallet_txn_uuid: "uuid()",
                    userid: strRecieverId, // str userid
                    user_uuid: data.reciever_uuid, // str userid
                    trans_number: data.transactionId, // str unique number
                    trans_date_time: isodate, // str date
                    amount: Number(data.amount), // db amount
                    trans_type: 1, // type credit
                    narration: data.recieverTxnMessage || `Wallet Received from ${strSenderName}`,
                    balance_amount: Number(dbReviceBalance) + Number(data.amount), //db balance amount
                    trans_for: data.recieverTxnMessage ? "Transferred Rollback amount" : "Wallet Received"
                }
                //fire sql query
                var objResponce = await sqlQuery.createQuery(this.tableName3, param)
                if(!objResponce.insertId){
                    console.error("rollback reciever account recipet not created :",data.reciever_uuid)
                    return {status : 400, message : 'reciever account statement not added'}
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
                    created_by_type : (data.type === role.Admin || data.type === role.SubAdmin) ?  data.id : data.userid, // userList
                    ip_address : data.ip_address,
                    mac_address : data.mac_address,
                    os_details : data.os_details,
                    imei_no : data.imei_no,
                    gcm_id : data.gcm_id,  // to send notification
                    app_version : data.app_version,  // our app version
                    source : data.source,  // 1: web, 2 : app
                    description : `Dear ${lisResponce4[0].full_name} ${lisResponce4[0].username} You have received Rollback Amount: ${parseFloat(String(Number(data.amount))).toFixed(2)} AFN against: ${data.rechangeNumber} actual Amount: ${data.rechargeAmount} AFN, Current Bal: ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount))).toFixed(2)} AFN, Thanks for being Afghan Pay Agent`, 
                    activity_type : lisResponce4[0].usertype_id == 0 ? 17 : 24 , // 1-Login;2-Change Password;3-Change Profile
                    old_value : Number(dbReviceBalance),
                    modified_value : Number(dbReviceBalance) + Number(data.amount),
                    region_id : lisResponce4[0].region_id
                });
            
            // reciever derails
                logData.push({ 
                    userid : data.userid,
                    username : data.username,
                    user_uuid : data.user_uuid,
                    full_name :  data.name,
                    mobile : data.mobile,
                    created_on : isodate,
                    user_type : data.type == role.Admin || data.type == role.SubAdmin ? 0 : data.type, // 1- Admin ,2- Member
                    created_by_type : (data.type === role.Admin || data.type === role.SubAdmin) ?  data.id : data.userid, // userList
                    ip_address : data.ip_address,
                    mac_address : data.mac_address,
                    os_details : data.os_details,
                    imei_no : data.imei_no,
                    gcm_id : data.gcm_id,  // to send notification
                    app_version : data.app_version,  // our app version
                    source : data.source,  // 1: web, 2 : app
                    description : "Rollback Fund transferred to "+ lisResponce4[0].username , 
                    activity_type : (data.type === role.Admin || data.type === role.SubAdmin) ? ( data.type === role.Admin ? 17 : 26 ) : 24, // 1-Login;2-Change Password;3-Change Profile
                    old_value : 0,
                    modified_value :  Number(data.amount),
                    region_id : data.region_id
                });

            // console.log(logData)

            const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:logData})
            var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                // console.log('Server Log : '+strLog)
            if(intResult != 1){
                await sqlQuery.specialCMD('rollback')
                // await reset(this.tableName1, data.reciever_uuid)
                console.log('error: rollback Stock transfer Failed as log adding have issue')
                return {status : 400, message : 'Stock transfer Failed as log adding have issue'}
                // return res.status(400).json({ errors: [ {msg : 'log error'}] });
            }

            let smsDetails = {
                agentId :  lisResponce4[0].userid,
                recieverMessage : `Dear ${lisResponce4[0].full_name} ${lisResponce4[0].username} You have received Rollback Amount: ${parseFloat(String(Number(data.amount))).toFixed(2)} AFN against: ${data.rechangeNumber} actual Amount: ${data.rechargeAmount} AFN, Current Bal: ${parseFloat(String(Number(dbReviceBalance) + Number(data.amount))).toFixed(2)} AFN, Thanks for being Afghan Pay Agent`
                // `Dear ${lisResponce4[0].full_name}, You received amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN from ${data.name}, TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
            }

            smsFunction.agentSms(smsDetails).then((smsFunResponce)=>{ 
                if(smsFunResponce.error){
                    // console.log('send sms error for agent : ',lisResponce4[0].username)
                }else{
                    // console.log('sms added')
                }  
            })

/***********************************************************************************************************/
                // if(stockTransferStatus.status == 400){
                //     rollbackSearchKeyValue = {
                //         trans_number : data.txnNumber,
                //     }
                //     let updateResponce = await sqlQuery.updateQuery(this.tableName12,{
                //         status : 2,
                //         rollback_status : 2,
                //         rollback_amount : 0,
                //         addBalance1 : {
                //         key : 'deduct_amt',
                //         value : data.amount
                //     }},rollbackSearchKeyValue)
                //     return res.status(400).json({ errors: [ {msg : stockTransferStatus.message}] }); 
                // }

                sendMessage('deductRollback',JSON.stringify({userid :rollbackRequest[0].userid, operator_id: rollbackRequest[0].operator_id, amount : data.amount, oldComPer: 0, txnNum: data.transactionId}),(err,msg)=>{
                    if(err) console.log(err)
                })

                // get mno balance
                let mnoDetails = await sqlQuery.searchQuery(this.tableName14,{id:rollbackRequest[0].mnoId},['mno_uuid','mno_name','current_balance'],'id','asc',1, 0)
                if(mnoDetails.length == 0) return { status : 400,message :  'MNO derails error'} 

                // update mno balance
                let updateKey = {
                    addBalance : {
                        key : 'current_balance',
                        value : Number(data.amount),
                    },
                    // deductBalance : {
                    //     key : "rollback_amount",
                    //     value : Number(data.amount)
                    // },
                }
                let mnoBalanceUpdate = await sqlQuery.updateQuery(this.tableName14, updateKey, {id:rollbackRequest[0].mnoId})

                // add report in e_money
                var param = {
                    emoney_uuid: "uuid()",
                    mno_uuid: mnoDetails[0].mno_uuid, //str operator uuid
                    mno_name: mnoDetails[0].mno_name, //str operator name
                    amount_added: data.amount, //db amount added
                    comm_amount: 0, //db commision amount
                    opening_balance: mnoDetails[0].current_balance, //db opening balance
                    closing_balance: Number(mnoDetails[0].current_balance) + Number(data.amount) , //db closing balance
                    emoney_txn_id: data.transactionId, //int transaction id
                    emoney_txn_date: isodate, //dt transaction date
                    type : 2, // rollback mnoney deducted
                    created_by: data.id, //str user id
                    created_on: isodate, //dt current date time
                    last_modified_by: data.id, // str user id
                    last_modified_on: isodate //dt current date time
                }
                let emoneyEntryResponse = await sqlQuery.createQuery(this.tableName11,param)

                return {status : 200,message: 'money transfer sucessfully' }

        }catch(error){
            console.log(error);
            await reset(this.tableName2, req.body.reciever_uuid)
            return {status : 400, message : error.message} 
        }
    }

    #resetRollbackStatus = async (data) => {
        try{
            let rollbackSearchKeyValue = {
                trans_number : data.transactionId,
            }
            let updateResponce = await sqlQuery.updateQuery(this.tableName12,{
                status : 2,
                rollback_status : 2,
                rollback_amount : 0,
                addBalance : {
                    key : 'deduct_amt',
                    value : data.amount
                }
            },rollbackSearchKeyValue)
        }catch(error){
            console.log(error);
        }
    }

    deductRollback = async (rollbackdetails) => {
        try{

            let {userid, operator_id, amount, oldComPer, txnNum} = JSON.parse(rollbackdetails)

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get commission percentage details
                let searchKeyValue = { userid : userid}
                let key = ["op"+operator_id+"_comm AS comPer"]

                let commissionPer = await sqlQuery.searchQuery(this.tableName13,searchKeyValue,key,'userid','ASC', 1, 0)
                if(commissionPer.length == 0) return 0 

                let dedAmt = ((Number(commissionPer[0].comPer) - Number(oldComPer))/ 100) * Number(amount)
                oldComPer = Number(commissionPer[0].comPer)

                let updateResponce = await sqlQuery.updateQuery(this.tableName2,{canTransfer: 0},{userid : userid,canTransfer: 1})

                if(!(updateResponce.affectedRows && updateResponce.changedRows)){
                    sendMessage('deductRollback',rollbackdetails,(err,msg)=>{
                        if(err) console.log(err)
                    })
                    return 1
                }

            // get agent current balance
                let agentCurrBal = await sqlQuery.searchQuery(this.tableName2,searchKeyValue,['ex_wallet'],'userid','ASC', 1, 0)
                if(commissionPer.length == 0) return 0 

                let updateBalance = {
                    canTransfer: 1, 
                    deductBalance :{
                        key : "ex_wallet",
                        value : dedAmt
                    }
                }
                
            // update the agent balance
                let updateDetails = await sqlQuery.updateQuery(this.tableName2, updateBalance, searchKeyValue)
                
            // search agent details 
                let agentDetails = await sqlQuery.searchQuery(this.tableName4, searchKeyValue, ['user_uuid','parent_id','user_uuid'], 'userid', 'ASC', 1, 0)
                if(agentDetails.length == 0) return 0

            // insert into transaction table
                const dtCurrentDate = date // dt current date time
                const strDate = dtCurrentDate.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
                const strUniqueNumber = await dataBaseId(dtCurrentDate) //str unique number

                let param = {
                    wallet_txn_uuid: "uuid()",
                    userid: userid, // str userid
                    user_uuid: agentDetails[0].user_uuid, // str user_uuid
                    trans_number: txnNum, // str unique number
                    trans_date_time: strDate, // dt date
                    amount: dedAmt , // db amount
                    trans_type: 2, // type debited
                    narration: "Commission Rollback",
                    balance_amount: Number(agentCurrBal[0].ex_wallet) - Number(dedAmt) , //db balance
                    trans_for: "Commission Rollback"
                }
                //fire sql query
                var objResponce = await sqlQuery.createQuery(this.tableName3, param)

                let messageQueue = { 
                    userId : userid, 
                    amount : 0, 
                    comm : dedAmt, 
                    operatorId : operator_id, 
                    dateTime : strDate
                }
                sendMessage('rechargeFailedDeductUserSummery',JSON.stringify(messageQueue),(err,msg)=>{
                    if(err) console.log(err)
                })

                messageQueue = { 
                    userId : userid, 
                    amount : dedAmt, 
                    dateTime : strDate
                }
                sendMessage('processedStockSend',JSON.stringify(messageQueue),(err,msg)=>{
                    if(err) console.log(err)
                })

            // recall the function pith parent id
                // console.log(userid)
                if(userid != 1){
                    // sendMessage('deductRollback',JSON.stringify(agentDetails[0].parent_id, operator_id, amount, oldComPer, txnNum),())
                    sendMessage('deductRollback',JSON.stringify({userid : agentDetails[0].parent_id, operator_id, amount, oldComPer, txnNum}),(err,msg)=>{
                        if(err) console.log(err)
                    })
                    return 1
                }
                return 1

        }catch(error){
            console.log(error);
            throw new error
        }
    }

    rejectRollback = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('rollback/rejectRollback',JSON.stringify(req.body), JSON.stringify(req.query))
                // check for rollback details
                let searchKeyValue = {
                    // region_ids : req.body.user_detials.region_list.join(','), //db
                    trans_number : req.body.txnNumber
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                let rollbackDetails = await rollbackModule.rollbackTxnDetails(searchKeyValue)

                if(rollbackDetails.length == 0) return res.status(400).json({ errors: [ {msg : "Rollback request not found"}] });

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // update param
                let param = {
                    rollback_status : 4,
                    rollback_confirm_on : isodate, //dt current date time
                    comment : req.body.comment
                }
                searchKeyValue = {
                    rollback_status : 2,
                    trans_number : req.body.txnNumber
                }
                let updateQueResponce = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

            // send responce to front end
                const { affectedRows, changedRows, info } = updateQueResponce;
                const message = !affectedRows ? 'Rollback request already processed' :
                    affectedRows && changedRows ? 'Rollback request rejected successfully' : 'Rollback action already done';

                const status = !affectedRows ? 400 :
                affectedRows && changedRows ? 200 : 400;

                if(affectedRows && changedRows){
                    // send sms to agent
                    let smsDetails = {
                        agentId :  rollbackDetails[0].userid,
                        recieverMessage : `Dear ${rollbackDetails[0].agnetName} Your Rollback for amount of: ${rollbackDetails[0].recargeAmt} AFN Against No: ${rollbackDetails[0].rechangeMobile} has been failed due to low balance in customer GSM, Thanks for being Afghan Pay Agent`
                        // `Dear ${lisResponce4[0].full_name}, You received amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN from ${data.name}, TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                    }

                    smsFunction.agentSms(smsDetails).then((smsFunResponce)=>{ 
                        if(smsFunResponce.error){
                            // console.log('send sms error for agent : ',lisResponce4[0].username)
                        }else{
                            // console.log('sms added')
                        }  
                    })
                }

                res.status(status).send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    rollbackComplete = async (req, res, next) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('rollback/rollbackComplete',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit offset
                // let offset = req.query.start
                // let limit = req.query.end - offset

            // search param
                let searchKeyValue = {
                    rollback_status : 2,
                    // region_ids : req.body.user_detials.region_list.join(',')
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                if ( req.query.userid ) searchKeyValue.userid = req.query.userid
                if ( req.query.name ) searchKeyValue.userName = req.query.name
                if ( req.query.mobile ) searchKeyValue.mobile_number = req.query.mobile
                if ( req.query.txnNumber ) searchKeyValue.trans_number = req.query.txnNumber
                if ( req.query.operator_uuid ){
                    let operatorList = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                    if(operatorList == 0) return res.status(400).json({ errors: [ {msg : "operator id not found"}] });  
                    searchKeyValue.operator_id = operatorList[0].operator_id
                }
                // check date for start and end 
                if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
    
                if (req.query.startDate) {
                    searchKeyValue.between = {
                        key : 'rollback_confirm_on',
                        value : [req.query.startDate,req.query.endDate]
                    }
                }

            // if search param is proper
                if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : 'Improper search param'}] }); 

                let lisTotalRecords = await rollbackModule.rollbackTransactionCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // get report from model
                let rollbackList = await rollbackModule.rollbackTransaction(searchKeyValue, limit, offset)
                // if(rollbackList.length == 0) return res.status(204).send({ message : 'no rollback report found'})
                
            // send responce to front end_date
                // res.status(200).send(rollbackList)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(rollbackList)
                }else{
                    res.status(200).send({
                        reportList : rollbackList,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT),
                        totalRechargeAmount : lisTotalRecords[0].totalRechargeAmount || 0,
                        totalDeductedAmt : lisTotalRecords[0].totalDeductedAmt || 0
                    })
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    // agent self rollback report
    agentRollbackReport = async (req, res) => {
        try{

            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('rollback/agentRollbackReport',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // search paremeters
                let searchKeyValue = {
                    userid : req.body.user_detials.userid, //str
                    'NOT rollback_status' : 0,
                }

                if ( req.query.mobile ) searchKeyValue.mobile_number = req.query.mobile
                if ( req.query.txnNumber ) searchKeyValue.trans_number = req.query.txnNumber
                if ( req.query.operator_uuid ){
                    let operatorList = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                    if(operatorList == 0) return res.status(400).json({ errors: [ {msg : "operator id not found"}] });  
                    searchKeyValue.operator_id = operatorList[0].operator_id
                }
                // check date for start and end 
                if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
    
                if (req.query.startDate) {
                    searchKeyValue.between = {
                        key : 'rollback_request_on',
                        value : [req.query.startDate,req.query.endDate]
                    }
                }

                let key = ['COUNT(1) AS count', 'SUM(amount) AS totalRechargeAmount', 'SUM(res_deduct_amt) AS totalRollbackAmount']
                let lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName12, searchKeyValue, key, 'rollback_confirm_on', 'DESC')

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // search key value
                key = ['trans_number AS txnNumber','mobile_number AS rechangeMobile','operator_name AS operatorName','amount AS rechargeAmt','rollback_amount AS rollbackAmt','rollback_status AS status','CAST(rollback_request_on AS CHAR(20)) AS dateTime','comment']

            // make sql query
                let searchResult = await sqlQueryReplica.searchQuery(this.tableName12, searchKeyValue, key, 'rollback_confirm_on', 'DESC', limit, offset)
                // if(searchResult.length == 0) return res.status(204).send({ message : 'no rollback report found'})

                let statusList = ['','Pending','Accept','Complete','Reject']

            // set the status of rollback
                let finalResult = searchResult.map((result)=>{
                    let {status, ...other} = result
                    // other.status = status == 0 ? 'Pending' : ( status == 2 ? 'Reject' : ( status == 4 ? 'Complete' : 'Accept') )
                    other.status = statusList[status]
                    return other
                })

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(finalResult)
                }else{
                    res.status(200).send({
                        reportList : finalResult,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        totalRechargeAmount : lisTotalRecords[0].totalRechargeAmount || 0, 
                        totalRollbackAmount : lisTotalRecords[0].totalRollbackAmount || 0,
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

            // send responce 
                // res.status(200).send(finalResult)
        
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }
    

    // get system and api balance  
    getSystemWalletBal = async (req,res) =>{
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('rollback/getSystemWalletBal',JSON.stringify(req.body), JSON.stringify(req.query))
            // search param
                let searchKeyValue = {
                    status: 1
                }
                let param = ['CAST(mno_uuid AS CHAR(16)) AS operator_uuid','mno_name as operatorName', 'current_balance AS systemBalance', 'rollback_amount as rollbackAmount']
                let searchResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName14, searchKeyValue, param, 'id', 'DESC')
            
            // rearrange the responces
    
                return res.status(200).send(searchResult)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
    
    // remove extra emoney amount in system 
    addMoneyInSystem = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('rollback/addMoneyInSystem',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get emoney balance 
            // let mnoDetails = await sqlQuery.searchQuery(this.tableName14, {mno_uuid : req.body.operator_uuid,mno_name : req.body.operatorName,status : 1},["COUNT(1)"],'id','ASC', 1, 0)
            // if(mnoDetails[0]['COUNT(1)'] == 0) return res.status(400).json({ errors: [ {msg : "mno id not found"}] });
            let mnoDetails = await sqlQuery.searchQuery(this.tableName14, {mno_uuid : req.body.operator_uuid,mno_name : req.body.operatorName,status : 1},["mno_name","rollback_amount","current_balance","balance_url"],'id','ASC', 1, 0)
            if(mnoDetails.length == 0) return res.status(400).json({ errors: [ {msg : "mno id not found"}] });

            // // check of operator balance + amount < api balance
            // let api_balance = Number(process.env.MNO_TEST_BALANCE) == 0 ? await apiCall(mnoDetails[0].balance_url) : Number(process.env.MNO_TEST_BALANCE)
            // if(api_balance.error) return res.status(400).json({ errors: [ {msg : ' api balance url issue '}] });
            // if ( Number(mnoDetails[0].current_balance) + Number(req.body.amountAdded) >= Number(api_balance.balance) ) return res.status(400).json({ errors: [ {msg : 'amount should be less then api balance'}] });

            // change can transfer status
            var searchKeyValue = {
                userid: req.body.user_detials.userid, //str user uuid
                canTransfer: 1
            }
            var objResponce = await sqlQuery.updateQuery(this.tableName2, {canTransfer: 0}, searchKeyValue);
            var { affectedRows, changedRows, info } = objResponce;

            if (!affectedRows) return ({status : 400, message : 'earlier transation under process' })
            if (!(affectedRows && changedRows)) return ({status : 400, message : 'Earlier transation under process' })

            //4)-start transaction to make thing secure
            var objResponse = await sqlQuery.specialCMD('transaction')
            if (!objResponse) {
                throw new HttpException(500, 'Something went wrong');
            }

            //5)- check the initial wallet balanced/ if wallet not found then create one with 0 blances
            //check wallet 
            var searchKeyValue = {
                userid: req.body.user_detials.userid, //str user uuid
            }
            //sql query variable to check wallet
            var key = ["ex_wallet", "comm_wallet"]
            var orderby = "wallet_id"
            var ordertype = "ASC"

            // fire sql query to search wallet
            const lisResponce2 = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (lisResponce2.length === 0) return res.status(400).json({ errors: [ {msg : "Admin balance not found"}] });

            // creating wallet variables
            const dbAccountBalance = lisResponce2[0].ex_wallet

            if( Number(dbAccountBalance) - Number(req.body.amountAdded) <= 0){
                var param = {
                    canTransfer: 1
                }
                var searchKeyValue = {
                    userid: req.body.user_detials.userid, //str user uuid
                }
    
                // fire sql query to update wallet
                var objResponce = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

                return res.status(400).json({ errors: [ {msg : "Admin balance is not enough to process this request."}] });
            } 

            //6)- create er wallet transaction recipt
            var dtCurrentDateTime = date
            const dtTransactionDate = dtCurrentDateTime.toISOString().slice(0, 19).replace('T', ' ')
            const strTransactionDateId = await dataBaseId(dtCurrentDateTime)

            // add money to wallet
            // creating the search variable for sql query
            var param = {
                deductBalance : {
                    key : "ex_wallet",
                    value : Number(req.body.amountAdded),
                },
                canTransfer: 1
            }
            var searchKeyValue = {
                userid: req.body.user_detials.userid, //str user uuid
            }

            // fire sql query to update wallet
            var objResponce = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // variables for sqlQuery
            var param = {
                wallet_txn_uuid: "uuid()",
                userid: req.body.user_detials.userid, // str userid
                user_uuid: req.body.user_detials.user_uuid, // str user uuid
                trans_date_time: dtTransactionDate, //dtTransactionDate
                amount: Number(req.body.amountAdded), //db amount
                trans_number: strTransactionDateId, //str unique number
                narration: req.body.narration || "Rollback E-money by" + req.body.user_detials.username, //str narration
                trans_for: req.body.trans_for || "Rollback E-money", // str trans_for
                trans_type: 2, // tinyint [1,2]
                balance_amount: Number(dbAccountBalance) - Number(req.body.amountAdded) //db amount blance
            }

            //fire sql query to create wallet transation
            var objresponse = await sqlQuery.createQuery(this.tableName3, param)

            let messageQueue = { 
                userId : req.body.user_detials.userid, 
                amount : Number(req.body.amountAdded),  
                dateTime : dtTransactionDate
            }
            sendMessage('processedStockSend',JSON.stringify(messageQueue),(err,msg)=>{
                if(err) console.log(err)
            })

            //  get operator balance & update balance
            var keyValue = {
                deductBalance : {
                    key : "current_balance",
                    value : Number(req.body.amountAdded)
                },
                addBalance : {
                    key : "rollback_amount",
                    value : Number(req.body.amountAdded)
                }
            }
    
            var objResponce = await sqlQuery.updateQuery(this.tableName14,keyValue,{mno_uuid : req.body.operator_uuid})

            // get emoney balance 
            // mnoDetails = await sqlQuery.searchQuery(this.tableName14, {mno_uuid : req.body.operator_uuid,mno_name : req.body.operatorName,status : 1},["mno_name","current_balance","balance_url"],'id','ASC', 1, 0)
            // if(mnoDetails.length == 0) return res.status(400).json({ errors: [ {msg : "mno id not found"}] });

            // variables for sqlQuery
            var param = {
                emoney_uuid: "uuid()",
                mno_uuid: req.body.operator_uuid, //str operator uuid
                mno_name: req.body.operatorName, //str operator name
                amount_added: req.body.amountAdded, //db amount added
                comm_amount: 0, //db commision amount
                opening_balance: mnoDetails[0].current_balance, //db opening balance
                closing_balance: Number(mnoDetails[0].current_balance) - Number(req.body.amountAdded) , //db closing balance
                emoney_txn_id: strTransactionDateId, //int transaction id
                emoney_txn_date: dtTransactionDate, //dt transaction date
                type : 3, // credit
                created_by: req.body.user_detials.id, //str user id
                created_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, // str user id
                last_modified_on: isodate //dt current date time
            }

            //fire sql query to create er money 
            var objResponce = await sqlQuery.createQuery(this.tableName11, param)

            //9)- commit
            var objResponce = await sqlQuery.specialCMD('commit')
            if (!objResponce) {
                await sqlQuery.specialCMD('rollback')
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'Amount rollback sucessfully' })

        } catch (error) {
            console.log(error);
            await sqlQuery.specialCMD('rollback')
            return res.status(400).json({ errors: [ {msg : error.message}] })
        }
    }

    // add rollback request
    addRollBackRequest = async (req, res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('rollback/addRollbackRequest',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let searchReport = await sqlQuery.searchQuery(this.tableName12,{
                trans_number : req.body.transactionId,
                userid : req.body.user_detials.userid,
            },['status','rollback_status'],'id','ASC', 1, 0)

            if(searchReport.length == 0) return res.status(400).json({ errors: [ {msg : 'Rollback Request not found'}] })
            if(searchReport[0].status != 2) return res.status(400).json({ errors: [ {msg : 'Recharge is not success, not allowed to rollback it'}] })
            if(searchReport[0].rollback_status == 1 || searchReport[0].rollback_status == 2) return res.send({ message: "Already is under process" });
            if(searchReport[0].rollback_status == 3 ) return res.send({ message: "Rollback request already accepted" });
            if(searchReport[0].rollback_status == 4 ) return res.status(400).json({ errors: [ {msg : 'Rollback request already rejected'}] }) //res.send({ message: "Rollback request rejected" });

            // update rechange request
                let searchKeyValue = {
                    trans_number : req.body.transactionId,
                    userid : req.body.user_detials.userid,
                    rollback_status : 0
                }
                let param = {
                    rollback_status : 1,
                    // comment : req.body.comment,
                    rollback_request_on : isodate,
                    rollback_confirm_on : isodate
                }
                let updateResult = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

                const { affectedRows, changedRows, info } = updateResult;
                const message = !affectedRows ? 'Rollback request allready' :
                    affectedRows && changedRows ? 'Rollback request accepted' : 'rollback request added already';

                res.send({ message, info });

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] })
        }
    }

    // admin, sub admin and agent add rollback report
    addRollback = async (req, res) =>{
        try{
            // console.log('addRollback',req.body)
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('rollback/addRollback',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let searchReport = await sqlQuery.searchQuery(this.tableName12,{
                trans_number : req.body.transactionId,
            },['status','rollback_status'],'id','ASC', 1, 0)

            if(searchReport.length == 0) return res.status(400).json({ errors: [ {msg : 'Rollback Request not found'}] })
            if(searchReport[0].status != 2) return res.status(400).json({ errors: [ {msg : 'Recharge is not success, not allowed to rollback it'}] })
            if(searchReport[0].rollback_status == 1 || searchReport[0].rollback_status == 2) return res.send({ message: "Already is under process" });
            if(searchReport[0].rollback_status == 3 ) return res.send({ message: "Rollback request already accepted" });
            if(searchReport[0].rollback_status == 4 ) return res.status(400).json({ errors: [ {msg : 'Rollback request already rejected'}] }) //res.send({ message: "Rollback request rejected" });

        // update rechange request
            let searchKeyValue = {
                trans_number : req.body.transactionId,
                rollback_status : 0,
                status : 2
            }
            let param = {
                rollback_status : 1,
                // comment : req.body.comment,
                rollback_request_on : isodate,
                rollback_confirm_on : isodate
            }
            let updateResult = await sqlQuery.updateQuery(this.tableName12, param, searchKeyValue)

            const { affectedRows, changedRows, info } = updateResult;
            const message = !affectedRows ? 'Rollback request not accepted' :
                affectedRows && changedRows ? 'Rollback request accepted' : 'Rollback request added already';

            res.send({ message, info });

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] })
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

async function getRandomid(tableName) {
    var intrandomNumber = varRandomString.generateRandomNumber(15)
    var searchKeyValue = {
        emoney_txn_id: intrandomNumber,
    }
    var key = ["emoney_uuid"]
    var orderby = "emoney_uuid"
    var ordertype = "DESC"
        // fire sql query to search message
    var results = await sqlQuery.searchQuery(tableName, searchKeyValue, key, orderby, ordertype, 100, 0)
        // check if the result is there and responce accordingly
    if (!results) {
        return "error"
    }
    if (results.length !== 0) {
        return getRandomid(tableName)
    }
    return intrandomNumber
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



module.exports = new rollbackController()