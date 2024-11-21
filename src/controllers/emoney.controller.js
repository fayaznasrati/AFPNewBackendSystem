const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const varRandomString = require('../utils/randomString.utils');
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const commonQueryCommon = require('../common/commonQuery.common')
const redisMaster = require('../common/master/radisMaster.common')

const dotenv = require('dotenv');
const path = require('path');

const emoneyModule = require('../models/emoney.module')

// const { toIsoString } = require('../common/timeFunction.common')

const { apiCall } = require('../common/makeApiCall.common')

const { start,sendMessage,createWorker } = require('../common/rabbitmq.common')

// configer env
dotenv.config()

class emoneyController {
    //table names
    tableName1 = 'er_wallet'
    tableName2 = 'er_emoney'
    tableName3 = 'er_wallet_transaction'
    tableName4 = 'er_master_operator'
    tableName5 = 'er_operator_current_balance'
    tableName8 = 'er_mno_details' 
    tableName9 = 'er_commission_amount'  

    //function to add e-money and update/create wallet
    addEmoney = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('emoney/addEmoney',JSON.stringify(req.body), JSON.stringify(req.query))
            if((Number(req.body.amountAdded) + Number(req.body.commAmount)) < 1) return res.status(400).json({ errors: [ {msg : "Sum of Amount and Commission amount should be grater then 1"}] });

                // console.log(req.body)
            // get emoney balance 
                const mnoDetails = await sqlQueryReplica.searchQuery(this.tableName8, {mno_uuid : req.body.operator_uuid,mno_name : req.body.operatorName,status : 1},["mno_name","current_balance","balance_url"],'id','ASC', 1, 0)
                if(mnoDetails.length ==0) return res.status(400).json({ errors: [ {msg : "mno id not found"}] });

            //2)- check the last transaction time
                //date variables 
                var dtCurrentDateTime = new Date()
                dtCurrentDateTime.setHours(dtCurrentDateTime.getHours() + 4, dtCurrentDateTime.getMinutes() + 30);
                var dtCheckDateTime = dtCurrentDateTime.toISOString().slice(0, 19).replace('T', ' ')

                // console.log(dtCheckDateTime)
                //variable fro sql query
                var searchKeyValue = {
                    amount_added : Number(req.body.amountAdded),
                    comm_amount : Number(req.body.commAmount),
                    mno_uuid : req.body.operator_uuid,
                    timeDifferent : {
                        key : 'created_on',
                        value : dtCheckDateTime,
                        diff : process.env.EMONEY_TIME_LIMIT
                    }
                }
                var key = ["COUNT(1)"]
                var orderby = "emoney_id"
                var ordertype = "DESC"

                // fire sql query to check data
                var lisResponse = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
                if (lisResponse[0]["COUNT(1)"]) {
                    return res.status(400).json({ errors: [ {msg : "same amount added earlier please wait for a while to add again"}] });
                }
            
            // get api balance
                let api_balance = Number(process.env.MNO_TEST_BALANCE) == 0 ? await apiCall(mnoDetails[0].balance_url) : Number(process.env.MNO_TEST_BALANCE)
                // if(api_balance.error) return res.status(400).json({ errors: [ {msg : ' api balance url issue '}] });
                // console.log(api_balance, operatorUrlDetails[0].balance_url, intOperatorId[0].operator_id)

                api_balance = Number(process.env.MNO_TEST_BALANCE) == 0 ? (Number(api_balance.balance) ? Number(api_balance.balance) : 0) : Number(process.env.MNO_TEST_BALANCE)

            // check of operator balance + amount < api balance
                // console.log(Number(mnoDetails[0].current_balance), Number(req.body.amountAdded), Number(req.body.commAmount), Number(api_balance.balance))
                if (mnoDetails[0].mno_name == 'Etisalat'){
                    let newBal = Number(mnoDetails[0].current_balance) + Number(req.body.amountAdded) + Number(req.body.commAmount) + 100
                    api_balance = newBal
                    redisMaster.post('ETISALAT_BALANCE', String(newBal))
                }
                if ( Number(mnoDetails[0].current_balance) + Number(req.body.amountAdded) + Number(req.body.commAmount) >= Number(api_balance) ) return res.status(400).json({ errors: [ {msg : 'amount should be less then api balance'}] });

            //4)-start transaction to make thing secure
                var objResponse = await sqlQuery.specialCMD('transaction')
                if (!objResponse) {
                    throw new HttpException(500, 'Something went wrong');
                }    

            //5)- check the initial wallet balanced/ if wallet not found then create one with 0 blances
            //check wallet 
            //sql query variable to check wallet
                var searchKeyValue = {
                    userid: req.body.user_detials.userid, //str user uuid
                }
                var key = ["ex_wallet", "comm_wallet"]
                var orderby = "wallet_id"
                var ordertype = "ASC"

            // fire sql query to search wallet
                const lisResponce2 = await sqlQuery.searchQueryTran(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (lisResponce2.length === 0) {
                //create wallet as not found
                // variables for sqlQuery
                var param = {
                    wallet_uuid: "uuid()",
                    userid: req.body.user_detials.userid,
                    user_uuid: req.body.user_detials.user_uuid
                }

                //fire sql query to create wallet
                var objResult = await sqlQuery.createQuery(this.tableName1, param)
            }

            //creating wallet variables
            const dbAccountBalance = lisResponce2.length === 0 ? 0 : lisResponce2[0].ex_wallet
            const dbAccountCommission = lisResponce2.length === 0 ? 0 : lisResponce2[0].comm_wallet

            //6)- create er wallet transaction recipt
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();
            
            var dtCurrentDateTime = date
            const dtTransactionDate = dtCurrentDateTime.toISOString().slice(0, 19).replace('T', ' ')
            const strTransactionDateId = await dataBaseId(dtCurrentDateTime)

            // variables for sqlQuery
            var param = {
                wallet_txn_uuid: "uuid()",
                userid: req.body.user_detials.userid, // str userid
                user_uuid: req.body.user_detials.user_uuid, // str user uuid
                trans_date_time: dtTransactionDate, //dtTransactionDate
                amount: Number(req.body.amountAdded) + Number(req.body.commAmount), //db amount
                trans_number: strTransactionDateId, //str unique number
                narration: req.body.narration || "fund added by "+ req.body.user_detials.username, //str narration
                trans_for: req.body.trans_for || "Wallet Received", // str trans_for
                trans_type: 1, // tinyint [1,2]
                balance_amount: Number(dbAccountBalance) + Number(req.body.amountAdded) + Number(req.body.commAmount) //db amount blance
            }

            //fire sql query to create wallet transation
            var objresponse = await sqlQuery.createQuery(this.tableName3, param)

            let messageQueue = { 
                userId : req.body.user_detials.userid, 
                amount : Number(req.body.amountAdded) + Number(req.body.commAmount),  
                dateTime : dtTransactionDate
            }
            sendMessage('processedStockReceived',JSON.stringify(messageQueue),(err,msg)=>{
                if(err) console.log(err)
            })

            //7)- create emoney recipt and er wallet transaction repict id to er money
            //generate uniqu 15 digit id random
            // const intRandomTransactionsId = await getRandomid(this.tableName2)
            // if (!intRandomTransactionsId || intRandomTransactionsId === "error") {
            //     await sqlQuery.specialCMD('rollback')
            //     throw new HttpException(500, 'Something went wrong');
            // }

            // var date = new Date();
            // date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            // var isodate = date.toISOString();

            // variables for sqlQuery
            var param = {
                emoney_uuid: "uuid()",
                mno_uuid: req.body.operator_uuid, //str operator uuid
                mno_name: req.body.operatorName, //str operator name
                amount_added: req.body.amountAdded, //db amount added
                comm_amount: req.body.commAmount, //db commision amount
                opening_balance: mnoDetails[0].current_balance, //db opening balance
                closing_balance: Number(mnoDetails[0].current_balance) + Number(req.body.amountAdded) + Number(req.body.commAmount), //db closing balance
                emoney_txn_id: strTransactionDateId, //int transaction id
                emoney_txn_date: dtTransactionDate, //dt transaction date
                created_by: req.body.user_detials.id, //str user id
                type : 1, // credit
                created_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, // str user id
                last_modified_on: isodate //dt current date time
            }

            //fire sql query to create er money 
            var objResponce = await sqlQuery.createQuery(this.tableName2, param)

            //8)- add money to wallet
            // creating the search variable for sql query
            var param = {
                addBalance : {
                    key : "ex_wallet",
                    value : Number(req.body.amountAdded) + Number(req.body.commAmount),
                },
                addBalance1 : {
                    key : "comm_wallet",
                    value : Number(req.body.commAmount)
                }
            }
            var searchKeyValue = {
                userid: req.body.user_detials.userid, //str user uuid
            }

            // fire sql query to update wallet
            var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            //9)- get operator balance & update balance
            var keyValue = {
                addBalance : {
                    key : "current_balance",
                    value : Number(req.body.amountAdded) + Number(req.body.commAmount)
                }
            }
    
            var objResponce = await sqlQuery.updateQuery(this.tableName8,keyValue,{mno_uuid : req.body.operator_uuid})

            // add data in commissiontable table
            let commissionDetails = {
                userid : req.body.user_detials.userid,
                parent_id : 0,
                recharge_id : strTransactionDateId,
                operator_id : 0,
                recharge_amount : Number(req.body.amountAdded),
                commission_amount : Number(req.body.commAmount),
                comm_per : Number(req.body.commAmount) && Number(req.body.amountAdded) ? ( Number(req.body.commAmount) * 100 )/ Number(req.body.amountAdded) : 0,
                created_on : isodate, //dt current
                status : 2,
                total_commission : Number(req.body.commAmount),
                distribute_commission : Number(req.body.commAmount),
            }

            let commissionResponce = await sqlQuery.createQuery(this.tableName9, commissionDetails)

            //9)- commit
            var objResponce = await sqlQuery.specialCMD('commit')
            if (!objResponce) {
                await sqlQuery.specialCMD('rollback')
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'E-Money added sucessfully' })

        } catch (error) {
            console.log(error);
            await sqlQuery.specialCMD('rollback')
            return res.status(400).json({ errors: [ {msg : error.message}] })
        }
    }

    //function to get emoney detials
    getEmoneyDetailByDate = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('emoney/getEmoneyDetailsByDate',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            //sql query variables
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                active: 1,
                type : 1
            }
            var key = ["CAST(emoney_uuid AS CHAR(16)) AS emoney_uuid", "emoney_txn_id AS txnId", "mno_name AS operator", "amount_added AS amount", "comm_amount AS commAmount", "opening_balance As openingBalance", "closing_balance As closingBalance", "CAST(emoney_txn_date as CHAR(20)) As txnDate"]
            var orderby = "emoney_id"
            var ordertype = "DESC"

            const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, ['COUNT(1) AS count','SUM(amount_added) AS totalAmount', 'SUM(comm_amount) AS totalCommAmount'], orderby, ordertype)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // fire sql query to get str emoney_uuid, str emoney_txn_id, str operator name, db amount, db openeing_blanace, db closing_balance, dt date
            const lisResults = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, limit, offset)

            // check if the result is there and responce accordingly
            if (lisResults.length === 0) {
                // return res.status(204).send({ message: 'no emoney found !!' })
            }
            // send responce to the frontend
            // return res.status(200).send(lisResults)

            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisResults)
            }else{
                res.status(200).send({
                    reportList : lisResults,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : lisTotalRecords[0].totalAmount || 0,
                    totalCommAmount : lisTotalRecords[0].totalCommAmount || 0
                })
            }

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to search e-money details by date range or by operator
    getEmoneyReport = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('emoney/getEmoneyReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            //sql query variables
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                active: 1,
                IsIn : {
                    key : 'type',
                    value : '0,2'
                }
            }

            if((req.query.startDate && !req.query.endDate )||(req.query.endDate && !req.query.startDate )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate //dt end date
            }
            if (req.query.operator_uuid) {
                searchKeyValue.mno_uuid = req.query.operator_uuid //str operator_uuid
            }
            if (Object.keys(searchKeyValue).length === 0) {
                return res.status(400).json({ errors: [ {msg : "Use atleast one search parameter"}] });
            }
            var key = ["CAST(emoney_uuid AS CHAR(16)) AS emoney_uuid", "emoney_txn_id AS txnId", "mno_name AS operator", "amount_added AS amount", "comm_amount AS commAmount", "IF ( closing_balance > opening_balance, 'credit', 'debit' ) AS type ","opening_balance As openingBalance", "closing_balance As closingBalance", "CAST(emoney_txn_date as CHAR(16)) As txnDate"]
            var orderby = "emoney_id"
            var ordertype = "DESC"

            const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, ['COUNT(1) AS count','SUM(amount_added) AS totalAmount', 'SUM(comm_amount) AS totalCommAmount'], orderby, ordertype)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // fire sql query to get str emoney_uuid, str emoney_txn_id, str operator name, db amount, db openeing_blanace, db closing_balance, dt date
            const lisResult = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, limit, offset)

            // check if the result is there and responce accordingly
            if (lisResult.length === 0) {
                // return res.status(204).send({ message: 'No details found' })
            }
            // send responce to the frontend
            // return res.status(200).send(lisResult)
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
                    totalCommAmount : lisTotalRecords[0].totalCommAmount || 0
                })
            }

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getOperatorBalance = async ( req, res, next) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('emoney/getOperatorBalance',JSON.stringify(req.body), JSON.stringify(req.query))
            // search param
                let keyValue = ['CAST(mno_uuid AS CHAR(16)) AS mno_uuid', "mno_name as operatorName","balance_url as url","current_balance AS balance"]
                let mnoDetails = await sqlQueryReplica.searchQueryNoLimit(this.tableName8, { status : 1 }, keyValue, "id", "DESC")
                if(mnoDetails.length == 0 ) return res.status(400).json({ errors: [ {msg : "mno list not found"}] });
                
                for(let i=0; i < mnoDetails.length ; i++){
                    let {url, ...other} = mnoDetails[i]
 
                    let apiBalance = Number(process.env.MNO_TEST_BALANCE) == 0 ? await apiCall( url ) : Number(process.env.MNO_TEST_BALANCE)
                    other.apiBalance = apiBalance.balance ? apiBalance.balance : Number(process.env.MNO_TEST_BALANCE)

                    mnoDetails[i] = other
                }

                res.status(200).send(mnoDetails)

        } catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // add mno details
    addMno = async (req, res, next) =>{
        try{
            // check body
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('emoney/addMno',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // set varialbe for mno
                let mnoDetials = {
                    mno_uuid : "uuid()",
                    mno_name : req.body.name,
                    balance_url : req.body.url,
                    current_balance : 0,
                    status : 1, 
                    updated_by : req.body.user_detials.id,
                    updated_on : date.toISOString().slice(0, 19).replace('T',' '),
                };

            // add data in table
                let insertResponce = await sqlQuery.createQuery(this.tableName8, mnoDetials)

            // send responce
                res.status(200).send({message : 'mno added successfully'})

                redisMaster.delete('mno')

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getMnoList = async(req, res) => {
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('emoney/getMnoList',JSON.stringify(req.body), JSON.stringify(req.query))
            // call redis to get mno list
            redisMaster.get('mno', async(err, reply) => {

                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    // operator not in redis get from sql and into redis server
                    // variables for sql query to serarch operator
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    var searchKeyValue = {
                        status: 1,
                    }
                    var key = ["CAST(mno_uuid AS CHAR(16)) AS operator_uuid", "mno_name AS operatorName"]
                    var orderby = "id"
                    var ordertype = "desc"

                    // fire sql query to get str operator_uuid, str name
                    const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName8, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (!lisResult) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (lisResult.length === 0) {
                        return res.status(204).send({ message: 'mno list not found' })
                    }

                    //conver the json to string to send to redis server
                    const strResponse = JSON.stringify(lisResult)
                    redisMaster.post('mno', strResponse)

                    // send responce to frontend
                    return res.status(200).send(lisResult)

                }
                // redis have the data, convert it back to json and send to front end
                res.status(200).send(JSON.parse(reply))
            })
            
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateMnoDetails = async ( req, res ) => {
        try{
            // checl body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('emoney/updateMnoDetails',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();
            
            // update param
                let param = {
                    mno_name : req.body.name,
                    balance_url : req.body.url,
                    updated_by : req.body.user_detials.id,
                    updated_on : date.toISOString().slice(0, 19).replace('T',' '),
                }

                let searchKeyValue = {
                    status : 1,
                    mno_uuid : req.body.mno_uuid,
                }   

                let updateResult = await sqlQuery.updateQuery(this.tableName8, param, searchKeyValue)

                const { affectedRows, changedRows, info } = updateResult;
                const message = !affectedRows ? 'mno not found' :
                    affectedRows && changedRows ? 'mno updated successfully' : 'mno faild, values are same';
            
                res.send({ message, info });

                redisMaster.delete('mno')

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    deleteMno = async ( req, res ) => {
        try{
            // checl body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('emoney/deleteMno',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();
            
            // update param
                let param = {
                    status : 0,
                    updated_by : req.body.user_detials.id,
                    updated_on : date.toISOString().slice(0, 19).replace('T',' '),
                }

                let searchKeyValue = {
                    status : 1,
                    mno_uuid : req.query.mno_uuid,
                }   

                let updateResult = await sqlQuery.updateQuery(this.tableName8, param, searchKeyValue)

                const { affectedRows, changedRows, info } = updateResult;
                const message = !affectedRows ? 'mno not found' :
                    affectedRows && changedRows ? 'mno deleted successfully' : 'mno delte, already deleted';
            
                res.send({ message, info });

                redisMaster.delete('mno')

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    checkValidation = (req) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            throw new HttpException(400, 'Validation faild', errors);
        }
    }
}

function pad2(n) { return n < 10 ? '0' + n : n }

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

async function dataBaseId(date) {

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

module.exports = new emoneyController