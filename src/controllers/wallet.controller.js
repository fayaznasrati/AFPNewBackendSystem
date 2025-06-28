const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const varRandomString = require('../utils/randomString.utils');

const commonQueryCommon = require('../common/commonQuery.common');
const httpRequestMakerCommon = require('../common/httpRequestMaker.common');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const role = require('../utils/userRoles.utils');

const walletModel = require('../models/wallet.model')

const smsFunction = require('../common/smsFunction.common')

const dotenv = require('dotenv');
const path = require('path');

const { start,sendMessage,createWorker } = require('../common/rabbitmq.common')

const redisMaster = require('../common/master/radisMaster.common')

// configer env
dotenv.config()

class walletController {
    //tablename
    tableName1 = 'er_wallet'
    tableName2 = 'er_login'
    tableName3 = 'er_wallet_transaction'
    tableName4 = 'er_wallet_transfer_individual'
    tableName5 = 'er_fund_reverse'
    tableName6 = 'er_money_current_balance'
    tableName7 = 'er_operator_current_balance'
    tableName8 = 'er_access_status'
    tableName9 = 'er_prepaid_commission'
    tableName10 = 'er_pre_paid_commission_amount'

    constructor ( ) {
        // this.#InsertMissionEntry()
        // this.#InsertMissingStockTransfer()
        // this.#checkWalletTransactions()
        // this.#missingRecordCounting()
    }

    #missingRecordCounting = async() => {
        let searchQuery = {
            between : {
                key : 'wallet_txn_id',
                value : ['5552321','5553910']
            }
        }
        let key = ['wallet_txn_id', 'cast(user_uuid as CHAR(16)) as user_uuid','userid','trans_number','amount','trans_type','balance_amount']
        
        let records = await sqlQuery.searchQueryNoLimit(this.tableName3, searchQuery, key, 'wallet_txn_id', 'asc')
        

        if(records.length > 0){
            let baseId = records[0].wallet_txn_id
            for(let j = 1; j < records.length; j++){
                if(baseId+1 == records[j].wallet_txn_id){
                    console.log('record is present')
                }else{
                    console.log('missing id can bu used',baseId)
                }
                baseId = records[j].wallet_txn_id
            }
        }else{
            console.log('no records found')
        }

        console.log('missing record done')
    }

    #InsertMissionEntry = async () => {
        try{

            let keyValue = {
                wallet_txn_uuid : 'uuid()',
                userid : 9037,
                user_uuid : '81f823c4-adb5-11',
                trans_number : '020323215951673',
                trans_date_time : '2023-03-02 17:32:43',
                amount : '1582',
                trans_type : '1',
                narration : 'Wallet Received from AFP-58488',
                balance_amount : '1757',
                trans_for : 'Wallet Transfer'
            }
            let response = await sqlQuery.createQuery(this.tableName4,keyValue)
            console.log(response)
        }catch(error){
            console.error(error)
        }
    }

    #InsertMissingStockTransfer = async() => {
        var param = {
            trxn_uuid : "uuid()", // function
            trans_number : '020323215951673', // str unique number
            sender_id : 2498, //
            sender_username : 'AFP-58488',
            reciever_id : '9037',
            reciever_username : 'AFP-33938',
            transfer_amt : '1582',
            transfer_comm : 0,
            created_by : 2498,
            created_on : '2023-03-02 17:32:43',
            type : 2,
            rollback : 0
        }

        var objResponce = await sqlQuery.createQuery(this.tableName4, param)
        console.log(objResponce)
    }

    #checkWalletTransactions = async () => {
        try{
            let finalId = 104661
            let i = 2498                                                                                                                 
            let error = 0

            let balance, amount, difference

            for (i;i<=finalId;i++){

                let blockSearchKey = {
                    canTransfer : 1,
                    userid : 0
                }
                let blockValue = {
                    canTransfer : 0
                }
                let blockAccount = await sqlQuery.updateQuery(this.tableName1, blockValue, blockSearchKey)

                if(blockAccount.affectedRows == 1 || 0){
                    let searchQuery = {
                        userid : i,
                        between : {
                            key : 'trans_date_time',
                            value : ['2023-03-01', '2023-03-06']
                        }
                    }
                    let key = ['wallet_txn_id', 'cast(user_uuid as CHAR(16)) as user_uuid','userid','trans_number','amount','trans_type','balance_amount']
                    
                    let records = await sqlQuery.searchQueryNoLimit(this.tableName3, searchQuery, key, 'trans_date_time', 'asc')
    
                    if(records.length > 0){
    
                        balance = records[0].balance_amount
    
                        for(let j = 1; j < records.length; j++){
                            amount = records[j].amount
                            difference = records[j].trans_type == 2 ? Math.round((balance - amount) * 100) / 100 : Math.round((balance + amount) * 100) / 100
                            if(difference == records[j].balance_amount){
                                console.log(i,records[j].trans_number,'ok',records[j].balance_amount)
                                balance = records[j].balance_amount
                                continue
                            }else{
                                if(difference > records[j].balance_amount){
                                    // error = 1
                                    console.error(i,records[j].trans_number,difference,records[j].user_uuid)
                                    // break

                                    // update records
                                    let updateValue = {
                                        balance_amount : difference
                                    }
                                    let searchRec = {
                                        wallet_txn_id : records[j].wallet_txn_id
                                    }
                                    let updateResponse = await sqlQuery.updateQuery(this.tableName3, updateValue, searchRec)

                                    if(updateResponse.affectedRows == 1){
                                        console.log('record update Successfully')
                                        balance = difference
                                    }else{
                                        console.log('error with user Records')
                                    }
                                }else{
                                    console.error(i,records[j].trans_number,difference,records[j].user_uuid)
                                    console.log('require to debit account')
                                }
                            }
                        }

                        console.log('finally update the user wallet manually')
                    }
    
                    if(error == 1){
                        // break
                    }else{
                        console.log(`${i} all transaction ok`)
                    }
                }else{
                    console.log('account under transaction')
                }

            }

        }catch(err){
            console.log(err);
        }
    }

    //fucntion to create e wallet
    createWallet = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('wallet/createWallet',JSON.stringify(req.body), JSON.stringify(req.query))
            //1)- check if wallet already exist or not
            var searchKeyValue = {
                user_uuid: req.body.user_uuid //str user_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to check if wallet already exist or not
            const lisResponce1 = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // check sql response
            if (!lisResponce1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponce1[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg : 'wallet allready created'}] });
            }

            //2)- check user id
            //variable for sql query
            var searchKeyValue = {
                user_uuid: req.body.user_uuid,
                Active : 1
            }
            var key = ["userid"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query
            const lisResponce = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 100, 0)

            // check sql response
            if (!lisResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponce.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }

            //3)- create wallet
            //variable for sql query
            var param = {
                wallet_uuid: "uuid()",
                user_uuid: req.body.user_uuid,
                userid: lisResponce[0].userid,
            }

            //fire sql query
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            // check sql responce
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            // send responce to front end
            res.status(201).send({ message: 'wallet created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get wallet balance
    getWalletBalance = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('wallet/getWalletBalance',JSON.stringify(req.body), JSON.stringify(req.query))
            //varibale  from sql query
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                user_uuid: req.body.user_detials.user_uuid //str user_uuid
            }
            var key = ["ex_wallet AS exWallet", "comm_wallet AS commisionWallet", "wallet1 AS salaamBal", "wallet2 AS etisalatBal", "wallet3 AS roshanBal", "wallet4 AS mtnBal", "wallet5 AS awccBal"]
            var orderby = "wallet_id"
            var ordertype = 'desc'

            //fire sql query to get db exWallet, db commWallet, db wallet1, db wallet2, db wallet3, db wallet4, db wallet5
            const lisResult = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, key, orderby, ordertype)
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'No wallet found' })
            }
            // send responce to front end
            return res.status(200).send(lisResult)
        } catch (error) {
            console.error('getWalletBalance',error);
            return res.status(200).send([{}])
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //################--waller transaction----#######################
    //function to get wallet transation details
    getTransationDetialsByUserId = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('wallet/getTransactionDetailsByUserId',JSON.stringify(req.body), JSON.stringify(req.query))
            // for admin and user_uuid,set user uuid to default user id if user_uuid is not provided
            if (req.body.user_detials && req.body.user_detials.type === 'Admin' && req.query.user_uuid === undefined) {
                req.query.user_uuid = "5ad59565-cd7c-11"
            }

            //check if user_uuid is there or not
            if (!req.query.user_uuid) {
                return res.status(400).send({ message: 'incalid request' })
            }

            //varibale  from sql query
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                user_uuid: req.query.user_uuid //str user_uuid
            }

            if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

            //if start date and end date are given
            if (req.query.start_date) {
                searchKeyValue.start_trans_date_time = req.query.start_date
            }
            if (req.query.end_date) {
                searchKeyValue.end_trans_date_time = req.query.end_date
            }

            //variable for sql query
            var key = ["CAST(wallet_txn_uuid AS CHAR(16)) AS wallet_txn_uuid", "trans_number AS transationNumber", "trans_date_time AS dateTime", "amount", "trans_type AS type", "trans_for AS transactionFor"]
            var orderby = "trans_date_time"
            var ordertype = 'DESC'

            //fire sql query to get wallet_txn_uuid, str transaction number, dt transaction time, db amount, tinyint type, str transaction for
            const lisResult = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName3, searchKeyValue, key, orderby, ordertype)
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'No transaction found !!' })
            }
            // send responce to front end
            return res.status(200).send(lisResult)
        } catch (error) {
            console.error('getTransationDetialsByUserId',error);
            return res.status(200).send([{}])
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to make transaction reports 
    adwnaceSearch = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('wallet/adwanceSearch',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            //limit and offset variables
            // var offset = req.query.start
            // var limit = req.query.end - offset

            if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

            //optional search query
            var param = {user_uuid : req.body.user_detials.user_uuid}
            if (req.query.user_uuid) param.user_uuid = req.query.user_uuid // str user_uuid
            if (req.query.userName) param.userName = req.query.userName // str userName
            if (req.query.number) param.number = req.query.number // str number 
            if (req.query.transactionId) param.transactionId = req.query.transactionId // str transactionId
            if (req.query.start_date) param.start_date = req.query.start_date //dt date
            if (req.query.end_date) param.end_date = req.query.end_date //dt date
            if (req.query.transactionType) param.transactionType = req.query.transactionType //int [1,2]
            if (req.query.region_uuid) param.region_uuid = req.query.region_uuid // str region_uuid
            if (req.query.country_uuid) param.country_uuid = req.query.country_uuid // str country_uuid
            if (req.query.district_uuid) param.district_uuid = req.query.district_uuid // str district_uuid
            
            //check for empty param
            if (Object.keys(param).length === 0) return res.status(400).json({ errors: [ {msg : 'Search parameter have no value'}] });

            const lisTotalRecords = await walletModel.adwnaceSearchModelCount(param)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            //fire sql query
            const lisResult = await walletModel.adwnaceSearchModel(param, limit, offset)

            // check for sql results and send responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            // if (lisResult.length === 0) {
            //     return res.status(204).send({ message: 'No transaction found !!' })
            // }
            var finalResult = lisResult.map((result) => { 
                var {trans_type,amount,closingBalance,...other} = result;
                other.closingBalance = closingBalance
                other.amount = amount
                other.trans_type = trans_type == 1 ? "Credit" : "Debit"
                other.openingBalance = trans_type == 1 ? Number(closingBalance)-Number(amount) : Number(closingBalance) + Number(amount)
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
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : lisTotalRecords[0].totalAmount
                })
            }

            // res.status(200).send(finalResult)
        } catch (error) {
            console.error('adwnaceSearch',error);
            if( req.query.pageNumber == 0 ) {
                res.status(200).send([{}])
            }else{
                res.status(200).send({
                    reportList : [{}],
                    totalRepords : 0,
                    pageCount : 0,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    walletBalance = async (req,res) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('wallet/walletBalance',JSON.stringify(req.body), JSON.stringify(req.query))
            // search user wallet
                var searchKeyValue = {
                    user_uuid: req.body.user_detials.user_uuid
                }
                var key = ["ex_wallet","comm_wallet"]
                var orderby = "userid"
                var ordertype = "ASC"

                const lisResponce1 = await sqlQueryReplica.searchQueryTimeout(this.tableName1,searchKeyValue, key, orderby, ordertype,1, 0)
            
            // check balance and commission amount 
                const dbAvaliableBalance = lisResponce1.length > 0 ? lisResponce1[0].ex_wallet : 0
                const dbTotalCommission = lisResponce1.length > 0 ? lisResponce1[0].comm_wallet : 0

            // sear last 10 transaction
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid
                }
                var key = ["trans_number AS transactionId","trans_type AS transactionType","amount","balance_amount AS closingBalance","narration","trans_for","trans_date_time AS transactionDate"]
                var orderby = "trans_date_time"
                var ordertype = "DESC"

                const lisResponce2 = await sqlQueryReplica.searchQueryTimeout(this.tableName3,searchKeyValue, key, orderby, ordertype,10, 0)
                
                var transactionList = lisResponce2.map((transaction)=>{
                    var {transactionType,closingBalance,amount,narration,trans_for,...other} = transaction
                    other.transactionType = transactionType == 1 ? "Credit" : "Debit"
                    other.openingBalance = transactionType == 1 ? closingBalance - amount : closingBalance + amount
                    other.transactionAmount = amount
                    other.closingBalance = closingBalance
                    other.narration = ( req.body.user_detials.type === role.Admin || req.body.user_detials.type === role.SubAdmin ) ? narration : trans_for
                    return other
                })

            // get total transaction made bt the user
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid
                }
                var key = ["COUNT(*)"]
                var orderby = "userid"
                var ordertype = "ASC"

                const lisResponce3 = await sqlQueryReplica.searchQueryTimeout(this.tableName3,searchKeyValue, key, orderby, ordertype,1, 0)
                
                var intTransactionCount = lisResponce3.length > 0 ? lisResponce3[0]["COUNT(*)"] : 0

            res.status(200).json({dbAvaliableBalance,intTransactionCount,dbTotalCommission,transactionList})

        }catch (error) {
            console.error('walletBalance',error);
            res.status(200).json({dbAvaliableBalance:0,intTransactionCount:0,dbTotalCommission:0,transactionList:[{}]})
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }


   getAgentBalanceReport = async (req, res) => {
    try {
        let child_ids = [];

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.query.pageNumber) req.query.pageNumber = 0;

        // SQL search parameter
        let param = { Active: 1 };

        if (req.body.user_detials.region_list.length !== 7) {
            param.region_ids = req.body.user_detials.region_list.join(',');
        }

        // if (req.query.userid) param.userid = req.query.userid;
         if (req.query.userid) {
                const userid = req.query.userid;
                param.userid = userid.startsWith("AFP-") ? userid : `AFP-${userid}`;
              }
        if (req.query.name) param.userName = req.query.name;
        if (req.query.mobile) param.number = req.query.mobile;

        // Get child_ids from parent_uuid
        if (req.query.parent_uuid) {
            const lisResponse1 = await sqlQueryReplica.searchQuery(
                this.tableName2,
                { user_uuid: req.query.parent_uuid, Active: 1 },
                ['userid', 'child_id'],
                'userid',
                'asc',
                1,
                0
            );

            if (lisResponse1.length === 0) {
                return res.status(404).json({ errors: [{ msg: 'parent not found' }] });
            }

            const rawChildIds = lisResponse1[0].child_id;
            child_ids = rawChildIds.split(',').map(id => parseInt(id.trim())).filter(Boolean);
            // child_ids = lisResponse1[0].child_id.split(',').map(c => c.trim());
        }

        if (Object.keys(param).length === 0) {
            return res.status(204).json({ errors: [{ msg: 'Improper search parem' }] });
        }

        // Date validation
        if (req.query.start_date) param.start_date = req.query.start_date;
        if (req.query.end_date) param.end_date = req.query.end_date;
        if ((req.query.start_date && !req.query.end_date) || (req.query.end_date && !req.query.start_date)) {
            return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
        }

        const lisTotalRecordsBlance = await walletModel.getAgentBalanceReportCount(param);
        console.log('lisTotalRecordsBlance:', lisTotalRecordsBlance[0].totalBalance );
        // let intTotlaRecords = Number(lisTotalRecords[0].count);
        // let intPageCount =  intTotlaRecords % Number(process.env.PER_PAGE_COUNT) === 0
        //         ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT)
        //         : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1;
        // totalBalance: 43917420.53}
      
        // let limit = intTotlaRecords;

        // Final param with child_id list
        if (child_ids.length > 0) {
            param.child_ids = child_ids;
        }
        
        let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0;
        let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords;

        const lisTotalRecords = await walletModel.getAgentBalanceTotalReport(param);
        // const totalBalance = lisTotalRecords.reduce((sum, agent) => sum + Number(agent.balance || 0), 0);
        // console.log('Total balance:', totalBalance);
        const uniqueBalances = new Map();

        lisTotalRecords.forEach(agent => {
        if (!uniqueBalances.has(agent.userid)) {
            uniqueBalances.set(agent.userid, Number(agent.balance || 0));
        }
        });
       
        const totalBalance = Array.from(uniqueBalances.values()).reduce((sum, val) => sum + val, 0);
        console.log('Total balance:', totalBalance);

        console.log('lisTotalRecordsx:', lisTotalRecords.length, lisTotalRecords);
        let intTotlaRecords = Number(lisTotalRecords.length);
        let intPageCount =  intTotlaRecords % Number(process.env.PER_PAGE_COUNT) === 0
        ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT)
        : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1;

        const lisResponce2 = await walletModel.getAgentBalanceReport(param, limit, offset);
        console.log('lisResponce2', lisResponce2.length, lisResponce2);
       
        if (lisResponce2.length === 0) {
          return  res.status(200).send({
            reportList: [{}],
            totalRepords: 0,
            pageCount: 0,
            currentPage: Number(req.query.pageNumber),
            pageLimit: Number(process.env.PER_PAGE_COUNT),
            totalBalance: 0,
        });
            // return res.status(204).json({ errors: [{ msg: 'no Agent Report not found' }] });
        }
        // intTotlaRecords = Number(lisResponce2.length);
        intPageCount = intTotlaRecords % Number(process.env.PER_PAGE_COUNT) === 0
            ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT)
            : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1;
            
        const results = lisResponce2.map(result => {
            const { balance, commission_value, ...other } = result;
            return {
                ...other,
                balance: balance || 0,
                commissionType: commission_value ? 'Pre-Paid' : 'Post-Paid',
                commissionPercent: commission_value || 0,
            };
        });

        if (req.query.pageNumber == 0) {
            res.status(200).send(results);
        } else {
            res.status(200).send({
                reportList: results,
                totalRepords: intTotlaRecords,
                pageCount: intPageCount,
                currentPage: Number(req.query.pageNumber),
                pageLimit: Number(process.env.PER_PAGE_COUNT),
                totalBalance: totalBalance || 0,
                lisTotalRecordsBlance: lisTotalRecordsBlance[0].totalBalance || 0,
            });
        }
    } catch (error) {
        console.error('getAgentBalanceReport', error);
        if (req.query.pageNumber == 0) {
            res.status(200).send([{}]);
        } else {
            res.status(200).send({
                reportList: [{}],
                totalRepords: 0,
                pageCount: 0,
                currentPage: Number(req.query.pageNumber),
                pageLimit: Number(process.env.PER_PAGE_COUNT),
                totalBalance: 0,
            });
        }
        }
    };
    
    transactionReport = async(req, res, next) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0
                // console.log('wallet/transactionReport',JSON.stringify(req.body), JSON.stringify(req.query))
            // search param limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset 
            
            // check search options
                var param = {
                    Active: 1,
                }

                if (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin){
                    req.body.user_detials.region_list.push('0')
                    // param.region_ids = req.body.user_detials.region_list
                    if(req.body.user_detials.region_list.length != 8){
                        param.region_ids = req.body.user_detials.region_list.join(',')
                    }
                    // console.log(param)
                }else{
                    param.userid = req.query.username
                }

                // search param related to user
                // if(req.query.userid) param.userid = req.query.userid
                 if (req.query.userid) {
                const userid = req.query.userid;
                param.userid = userid.startsWith("AFP-") ? userid : `AFP-${userid}`;
              }
                if(req.query.name) param.userName = req.query.name
                if(req.query.mobile) param.number = req.query.mobile
                if(req.query.region_uuid) param.region_uuid = req.query.region_uuid
                if(req.query.province_uuid) param.province_uuid = req.query.province_uuid
                if(req.query.district_uuid) param.district_uuid = req.query.district_uuid

                // check date range
                if (req.query.start_date) param.start_date = req.query.start_date //dt date
                if (req.query.end_date) param.end_date = req.query.end_date //dt date
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

                //search param related to transaction
                if(req.query.transactionId) param.transactionId = req.query.transactionId
                if(req.query.transactionType) param.transactionType = req.query.transactionType

                if(Object.keys(param).length == 0) return res.status(404).json({ errors: [ {msg : "Improper search parameter"}] })

            // sql request to get data
                
                var lisTotalRecords = await walletModel.transactionReportCount(param);

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                var lisResponce1 = await walletModel.transactionReport(param, limit, offset);
                // if(lisResponce1.length == 0) return res.status(204).json({ errors: [ {msg : "no transaction Report not found"}] });
                
                var results = lisResponce1.map((result) => {
                    var {type,...other} = result;
                    other.type = type == 1 ? 'Credit' : 'Debit'
                    return other;
                })

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(results)
                }else{
                    res.status(200).send({
                        reportList : results,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT),
                        totalAmount : lisTotalRecords[0].totalAmount
                    })
                }

                // res.status(200).send(results);

        }catch(error){
            console.error('transactionReport',error);
            if( req.query.pageNumber == 0 ) {
                res.status(200).send([{}])
            }else{
                res.status(200).send({
                    reportList : [{}],
                    totalRepords : 0,
                    pageCount : 0,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    // transaction summery report
    getTransactionSummeryReport = async (req,res) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('wallet/getTransactionSummeryReport',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // search param limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset 
            
            // search paremeters
                var param = {
                    Active : 1
                }

                if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                    // param.region_ids = req.body.user_detials.region_list.join(',');
                    if(req.body.user_detials.region_list.length != 7){
                        param.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    param.child_ids =  req.body.user_detials.child_list.join(',');
                }

                // optional search paremeters
                // if(req.query.userid) param.userid = req.query.userid
                 if (req.query.userid) {
                const userid = req.query.userid;
                param.userid = userid.startsWith("AFP-") ? userid : `AFP-${userid}`;
              }
                if(req.query.name) param.userName = req.query.name
                if(req.query.mobile) param.number = req.query.mobile
                if(req.query.region_uuid) param.region_uuid = req.query.region_uuid
                if(req.query.provience_uuid) param.province_uuid = req.query.provience_uuid
                if(req.query.district_uuid) param.district_uuid = req.query.district_uuid

                // check date range
                if (req.query.start_date) param.start_date = req.query.start_date //dt date
                if (req.query.end_date) param.end_date = req.query.end_date //dt date
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
                // console.log(param)
                if(Object.keys(param).length == 1) return res.status(404).json({ errors: [ {msg : "Improper search parameter"}] })

                const lisTotalRecords = await walletModel.getTransactionSummeryReportCount(param)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // sql query to get details
                const lisResponce1 = await walletModel.getTransactionSummeryReport(param, limit, offset)
                // if(lisResponce1.length == 0 ) return res.status(204).json({ errors: [ {msg : "No transaction summery report found"}] })
                
                // console.log(lisResponce1)

                // let listAgentuserId = []
                // let results = []
                // let i,id = 0
                // for ( i = 0; i<lisResponce1.length ; i++){
                //     var {userid,name,amount,trans_type} =lisResponce1[i];
                //     // console.log("i = ",i,listAgentuserId,results)

                //     if(listAgentuserId.includes(userid)){
                //         id = listAgentuserId.indexOf(userid)
                //         if(trans_type == 1){ 
                //             results[id].totalTransaction += 1
                //             results[id].creditAmount += amount
                //         }else{ 
                //             results[id].totalTransaction += 1
                //             results[id].debitAmount += amount
                //         }
                //     }else{ 
                //         listAgentuserId.push(userid)

                //         if(trans_type == 1){
                //             results.push({ 
                //                 userid,
                //                 name,
                //                 creditAmount : amount,
                //                 debitAmount : 0,
                //                 totalTransaction : 1
                //             })
                //         }else{
                //             results.push({ 
                //                 userid,
                //                 name,
                //                 creditAmount : 0,
                //                 debitAmount : amount,
                //                 totalTransaction : 1
                //             })
                //         }
                //     }
                // }

                // res.status(200).send(lisResponce1)

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResponce1)
                }else{
                    res.status(200).send({
                        reportList : lisResponce1,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
            console.log('getTransactionSummeryReport',error);
            if( req.query.pageNumber == 0 ) {
                res.status(200).send([{}])
            }else{
                res.status(200).send({
                    reportList : [{}],
                    totalRepords : 0,
                    pageCount : 0,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    // stock transfer summery reports
    getStockTransferSummeryReports = async(req,res) => {
        try{

            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('wallet/getStockTrasnferSummeryReport',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // console.log(req.query);

            // search param limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset 

            // sql query paremeters
                var param = {
                    sender_id : req.body.user_detials.userid,
                    // region_ids : req.body.user_detials.region_list.join(',')
                }

                if(req.body.user_detials.region_list.length != 7){
                    param.region_ids = req.body.user_detials.region_list.join(',')
                }

                // optional search paremeters
                // if(req.query.userid) param.userid = req.query.userid
                 if (req.query.userid) {
                const userid = req.query.userid;
                param.userid = userid.startsWith("AFP-") ? userid : `AFP-${userid}`;
              }
                if(req.query.name) param.userName = req.query.name
                if(req.query.userType_uuid){
                    var intUserTypeId = await commonQueryCommon.getAgentTypeId(req.query.userType_uuid)
                    // console.log(intUserTypeId)
                    if(intUserTypeId.length == 0) return res.status(204).json({ errors: [ {msg : "user type id not found"}] })
                    param.userType = intUserTypeId[0].agent_type_id
                }
                if(req.query.amount) param.transferAmount = req.query.amount
                
                // check date range
                if (req.query.start_date) param.trans_start_date = req.query.start_date //dt date
                if (req.query.end_date) param.trans_end_date = req.query.end_date //dt date
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

                if(Object.keys(param).length == 1) return res.status(404).json({ errors: [ {msg : "Improper search parameter"}] })

                const lisTotalRecords = await walletModel.getStockTransferSummeryReportsCount(param);

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // make sql query from module
                const lisResponce1 = await walletModel.getStockTransferSummeryReports(param, limit, offset);
                // if(lisResponce1.length == 0) return res.status(204).json({ errors: [ {msg : "No stock transaction found"}] })

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResponce1)
                }else{
                    res.status(200).send({
                        reportList : lisResponce1,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT),
                        totalAmount : lisTotalRecords[0].totalAmount || 0
                    })
                }

                // res.status(200).send(lisResponce1)

        }catch(error){
            console.log('getStockTransferSummeryReports',error);
            if( req.query.pageNumber == 0 ) {
                res.status(200).send([{}])
            }else{
                res.status(200).send({
                    reportList : [{}],
                    totalRepords : 0,
                    pageCount : 0,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    // rollback related APIs
    // get agent list and balance
    getAgentAcountBalanceForRollback = async (req,res) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('wallet/getAgentAccountBalanceForRollback',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // search param limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // search agent paremeters
                var param = {
                    Active : 1,
                    // region_ids : req.body.user_detials.region_list.join(',')
                }

                if(req.body.user_detials.region_list.length != 7){
                    param.region_ids = req.body.user_detials.region_list.join(',')
                }

                // if(req.query.userid) param.userid = req.query.userid
                 if (req.query.userid) {
                const userid = req.query.userid;
                param.userid = userid.startsWith("AFP-") ? userid : `AFP-${userid}`;
              }
                if(req.query.name) param.userName = req.query.name
                if(req.query.mobile) param.number = req.query.mobile

                if(Object.keys(param).length == 0) return res.status(400).json({ errors: [ {msg : "search parameter are not proper"}] });

                const lisTotalRecords = await walletModel.getAgentAcountBalanceForRollbackCount(param);

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


                const lisResponce1 = await walletModel.getAgentAcountBalanceForRollback(param, limit, offset);
                // if(lisResponce1.length == 0) return res.status(204).json({ errors: [ {msg : "No account found"}] });
                // console.log(lisResponce1);

                var results = lisResponce1.map((result) => {
                    var {balance, ...other} = result
                    other.balance = balance ? balance : 0
                    return other
                })

                // res.status(200).send(results)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(results)
                }else{
                    res.status(200).send({
                        reportList : results,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT),
                        totalBalance : lisTotalRecords[0].totalBalance
                    })
                }

        }catch(error){
            console.error('getAgentAcountBalanceForRollback',error);
            if( req.query.pageNumber == 0 ) {
                res.status(200).send([{}])
            }else{
                res.status(200).send({
                    reportList : [{}],
                    totalRepords : 0,
                    pageCount : 0,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalBalance : 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    transferRollbackAmount = async (req,res) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('wallet/transferRollbackAmount',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            let stockTransferStatus = await sqlQuery.searchQueryNoCon(this.tableName8,['stock_transfer'],'stock_transfer', 'ASC', 1, 0)
            if(stockTransferStatus.length == 0 || stockTransferStatus[0].stock_transfer == 0) return res.status(400).json({ errors: [ {msg : 'Stock transfer is not allowed for a while'}] });// return {status : 400, message : 'Stock transfer is not allowed for a while.'}
            
            // get the reciever user id
                let recieverid = 0
                // if admin then set reiever userid as default user id
                if(req.body.reciever == 1){
                    recieverid = 1
                }
                // if parent then get the user parent id 
                if(req.body.reciever == 2){
                    const lisResponse5 = await sqlQuery.searchQuery(this.tableName2,{user_uuid : req.body.user_uuid,Active : 1},["parent_id"],'userid','ASC',1,0)
                    if(lisResponse5.length == 0) return res.status(400).json({ errors: [ {msg : 'Parent not found'}] }); 
                    recieverid = lisResponse5[0].parent_id
                }
            // get reciever user_uuid
                const lisResponse6 = await sqlQuery.searchQuery(this.tableName2,{userid : recieverid,Active : 1},['CAST(user_uuid AS CHAR(16)) AS user_uuid','userid'],"userid","ASC",1,0)
                if(lisResponse6.length == 0) return res.status(400).json({ errors: [ {msg : 'reciever user id not found'}] });

            // transfer the amount and add log in different table
            //1)- check if we can transfer the amount by checking the user's status
                var searchKeyValue = {
                    user_uuid_1: req.body.user_uuid, //str sender uuid
                    user_uuid_2: lisResponse6[0].user_uuid, //str reciever uuid
                }

                req.body.reciever_uuid = lisResponse6[0].user_uuid
                
                var key = ["username","userid","CAST(user_uuid AS CHAR(16)) AS user_uuid","comm_type","mobile","full_name","usertype_id",'region_id','parent_id']
                var orderby = "userid"
                var ordertype = "ASC"

                const lisResponce4 = await sqlQuery.searchOrQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 2, 0)
                // console.log(lisResponce4)
                if(lisResponce4.length != 2) return res.status(400).json({ errors: [ {msg : "sender and reciever id are same"}] });

                //assign values of proper variable
                var intSenderId = lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].userid : lisResponce4[1].userid
                var strSenderName = lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].username : lisResponce4[1].username
                var senderName = lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].full_name : lisResponce4[1].full_name
                var agentRegionId = lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].region_id : lisResponce4[1].region_id
                var intSenderCommissionType = lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].comm_type : lisResponce4[1].comm_type

                var intRecieverId = lisResponce4[0].user_uuid == lisResponse6[0].user_uuid ? lisResponce4[0].userid : lisResponce4[1].userid
                var strRecieverName = lisResponce4[0].user_uuid == lisResponse6[0].user_uuid ? lisResponce4[0].username : lisResponce4[1].username
                var recieverName = lisResponce4[0].user_uuid == lisResponse6[0].user_uuid ? lisResponce4[0].full_name : lisResponce4[1].full_name
            
            var commissionVal = 0
            // 1.1)- if pre paid then add commission in the transfer amount
            if(intSenderCommissionType == 0) return {status : 400, message : 'Agent commission not set, please set commission first'}
            // return res.status(400).json({ errors: [ {msg : "Agent commission not set, please set commission first"}] });
            if(intSenderCommissionType == 1){
                commissionVal = await sqlQuery.searchQuery(this.tableName9,{user_uuid: req.body.user_uuid},["commission_value"],"userid","ASC",1,0)
                commissionVal = commissionVal.length > 0 ? commissionVal[0].commission_value : 0
            }
            let commissionAmt = intSenderCommissionType == 1 ? ((commissionVal/100)*Number(req.body.amount)) : 0

            //2)- check/update wallet transaction status
                //2.1)- update status for sender
                // sql query variables for sender
                var param = {
                    canTransfer: 0
                }
                var searchKeyValue = {
                        user_uuid: req.body.user_uuid, //str user_uuid
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
                // if (!affectedRows) return res.status(400).json({ errors: [ {msg : 'sender account not found'}] });
                if (!(affectedRows && changedRows)) return res.status(200).send({ message: 'earlier transation under process' })

                //2.2)- update status for reciever 
                // sql query variable for reciever
                var param = {
                    canTransfer: 0
                }
                var searchKeyValue = {
                    user_uuid: lisResponse6[0].user_uuid, //str user_uuid
                    canTransfer: 1
                }

                // fire sql query
                var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

                // checking sql responce
                if (!objResponce) {
                    await reset(this.tableName1, req.body.user_uuid)
                    throw new HttpException(500, 'Something went wrong');
                }
                var { affectedRows, changedRows, info } = objResponce;

                // generating proper message
                // if (!affectedRows) return res.status(400).send({ message: 'reciever account not found' })
                if (!(affectedRows && changedRows)) {
                    await reset(this.tableName1, req.body.user_uuid)
                    return res.status(200).send({ message: 'reviever earlier transation under process' })
                }
            //3)- start transaction
                var objResponce = await sqlQuery.specialCMD('transaction')
                if (!objResponce) {
                    await reset(this.tableName1, req.body.user_uuid)
                    await reset(this.tableName1, lisResponse6[0].user_uuid)
                    throw new HttpException(500, 'Something went wrong');
                }

            //4)- deduct money from sender wallet
                //get the sender balance
                var searchKeyValue = {
                    user_uuid: req.body.user_uuid
                }
                var key = ["ex_wallet AS wallet", "min_wallet", "userid"]
                var orderby = "wallet_id"
                var ordertype = "ASC"

                // fire sql query to get balance
                const lisResponce1 = await sqlQuery.searchQueryTran(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

                // balance should be grater then minimum balance
                // console.log(Number(lisResponce1[0].wallet) ,req.body.amount,lisResponce1[0].min_wallet)
                if (Number(lisResponce1[0].wallet) - Number(req.body.amount) - Number(commissionAmt) < 0 )  {
                    await sqlQuery.specialCMD('rollback')
                    await reset(this.tableName1, req.body.user_uuid)
                    await reset(this.tableName1, lisResponse6[0].user_uuid)
                    return res.status(400).json({ errors: [ {msg : 'amount is more then the balance'}] });
                }

                //update sender balanced
                var param = {
                    deductBalance  : {
                        key: 'ex_wallet',
                        value : Number(req.body.amount) + commissionAmt
                    }, //db amount
                    canTransfer : 1
                }
                var searchKeyValue = {
                    user_uuid: req.body.user_uuid, //str sender_uuid
                }

                // fire sql query
                var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            //5)- add money to reciever wallet 
                //get the reciever balance
                var searchKeyValue = {
                    user_uuid: lisResponse6[0].user_uuid //str reciever_uuid
                }
                var key = ["ex_wallet AS wallet", "userid","comm_wallet"]
                var orderby = "wallet_id"
                var ordertype = "ASC"

                // fire sql query to get reciever balance
                const lisResponce2 = await sqlQuery.searchQueryTran(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                
                const dbReviceBalance = lisResponce2.length === 0 ? 0 : lisResponce2[0].wallet
                var strRecieverId = lisResponce2.length === 0 ? 0 : lisResponce2[0].userid

                //create account as account not created
                if (lisResponce2.length === 0) {
                    //get reciever user id
                    var key = ["userid"]
                    var orderby = "userid"
                    var ordertype = "ASC"

                    // fire sql query to get str user_uuid, str full name, int monile number
                    const lisResponce3 = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)
                
                    strRecieverId = lisResponce3[0].userid

                    //create wallet
                    var param = {
                        wallet_uuid: "uuid()",
                        user_uuid: lisResponse6[0].user_uuid,
                        userid: lisResponce3[0].userid,
                        ex_wallet: Number(req.body.amount) + commissionAmt,
                        canTransfer: 1
                    }

                    //fire sql query
                    const objResult = await sqlQuery.createQuery(this.tableName1, param)

                } else {
                    //update reciever balanced
                    var param = {
                        addBalance : {
                            key: "ex_wallet",
                            value : Number(req.body.amount) + commissionAmt
                        },
                        addBalance1 : { 
                            key: "comm_wallet",
                            value:  commissionAmt
                        },
                        canTransfer : 1
                    }
                    var searchKeyValue = {
                        user_uuid: lisResponse6[0].user_uuid, // str reciever user uuid
                    }

                    // fire sql query
                    var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);
                }

                //transation variables
                const dtCurrentDate = date // dt current date time
                const strDate = dtCurrentDate.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
                const strUniqueNumber = await dataBaseId(dtCurrentDate) //str unique number

            //6)- create er wallet transaction recipt for reciever
                //sql varialbles
                param = {
                    wallet_txn_uuid: "uuid()",
                    userid: strRecieverId, // str userid
                    user_uuid: lisResponse6[0].user_uuid, // str userid
                    trans_number: strUniqueNumber, // str unique number
                    trans_date_time: strDate, // str date
                    amount: Number(req.body.amount) + commissionAmt, // db amount
                    trans_type: 1, // type credit
                    narration: "Received Fund from "+ strSenderName + " by "+ req.body.user_detials.username,
                    balance_amount: Number(dbReviceBalance) + Number(req.body.amount) + commissionAmt, //db balance amount
                    trans_for: req.body.transFor || "Wallet Received fund reverse"
                }
                //fire sql query
                var objResponce = await sqlQuery.createQuery(this.tableName3, param)

                let messageQueue = { 
                    userId : strRecieverId, 
                    amount : Number(req.body.amount) + commissionAmt, 
                    dateTime : strDate
                }
                sendMessage('processedStockReceived',JSON.stringify(messageQueue),(err,msg)=>{
                    if(err) console.log(err)
                })

            //7)- create er wallet transaction recipt for sendfer
                param = {
                    wallet_txn_uuid: "uuid()",
                    userid: lisResponce1[0].userid, // str userid
                    user_uuid: req.body.user_uuid, // str user_uuid
                    trans_number: strUniqueNumber, // str unique number
                    trans_date_time: strDate, // dt date
                    amount: Number(req.body.amount) + commissionAmt, // db amount
                    trans_type: 2, // type debit
                    narration: req.body.narration || "Fund reversed to "+ ( recieverid == 1 ? 'Admin' : strRecieverName ) + " by " + req.body.user_detials.username,
                    balance_amount: lisResponce1[0].wallet - Number(req.body.amount) - commissionAmt, //db balance
                    trans_for: req.body.transFor || "Wallet Transfer fund reverse"
                }
                //fire sql query
                var objResponce = await sqlQuery.createQuery(this.tableName3, param)

                messageQueue = { 
                    userId : lisResponce1[0].userid, 
                    amount : Number(req.body.amount) + commissionAmt, 
                    dateTime : strDate
                }
                sendMessage('processedStockSend',JSON.stringify(messageQueue),(err,msg)=>{
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
                    transfer_amt : Number(req.body.amount),
                    transfer_comm : Number(commissionAmt),
                    created_by : intSenderId,
                    created_on : strDate,
                    type : SenderType,
                    rollback : 1
                }

                var objResponce = await sqlQuery.createQuery(this.tableName4, param)

                if(intSenderCommissionType == 1){
                    var param = {
                        userid : lisResponce4[0].user_uuid == lisResponse6[0].user_uuid ? lisResponce4[0].userid : lisResponce4[1].userid,
                        parent_id : lisResponce4[0].user_uuid == lisResponse6[0].user_uuid ? (lisResponce4[0].parent_id?lisResponce4[0].parent_id:0) : (lisResponce4[1].parent_id?lisResponce4[1].parent_id:0),
                        transaction_id : strUniqueNumber,
                        transfer_amt : Number(req.body.amount),
                        commission_amt : commissionAmt,
                        comm_per : commissionVal,
                        created_on : isodate, //dt current
                    }

                    var objResponce = await sqlQuery.createQuery(this.tableName10, param)
                    
                }

            //9)- add details in er_fund reverse
                
                var param = {
                    userid : lisResponce1[0].userid,
                    user_uuid : req.body.user_uuid,
                    amount : Number(req.body.amount) ,
                    commission : commissionAmt,
                    trans_date_time : strDate,
                    reverted_to : recieverid == 1 ? 1 : 2,
                    revert_by_username : req.query.username,
                    revert_by_full_name : req.body.user_detials.name,
                    wallet_txn_id : strUniqueNumber,
                }

                var objResponce = await sqlQuery.createQuery(this.tableName5, param)

            //10)- commit transaction
                var response = await sqlQuery.specialCMD('commit')

            // send sms to agent that there account is rollbacks
            let smsDetails = {
                agentId : intSenderId,
                // recieverMessage : `Dear ${data.name}, You transferred amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN to ${lisResponce4[0].mobile || lisResponce4[0].username}, TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                recieverMessage : `Dear ${strSenderName} ${senderName} Your account has be debited with Amount: ${parseFloat(String(Number(req.body.amount) + commissionAmt)).toFixed(2)} AFN by ${req.body.user_detials.username} to ${strRecieverName} ${recieverName} Thanks for Being Afghan Pay Agent!`

            }
            smsFunction.agentSms(smsDetails).then((smsFunResponce)=>{ 
                if(smsFunResponce.error){
                    // console.log('send sms error for agent : ',data.username)
                }else{
                    // console.log('sms added')
                }  
            })

            if(req.body.reciever == 2){
                smsDetails = {
                    agentId : strRecieverId,
                    // recieverMessage : `Dear ${data.name}, You transferred amount ${parseFloat(String(Number(data.amount) + commissionAmt)).toFixed(2)} AFN to ${lisResponce4[0].mobile || lisResponce4[0].username}, TXN ID ${strUniqueNumber}, Thanks for being Afghan Pay agent!`
                    recieverMessage : `Dear ${strRecieverName} ${recieverName} Your account has be credited with Amount: ${parseFloat(String(Number(req.body.amount) + commissionAmt)).toFixed(2)} AFN by ${req.body.user_detials.username} from ${strSenderName} ${senderName} Thanks for Being Afghan Pay Agent!`
    
                }
                smsFunction.agentSms(smsDetails).then((smsFunResponce)=>{ 
                    if(smsFunResponce.error){
                        // console.log('send sms error for agent : ',data.username)
                    }else{
                        // console.log('sms added')
                    }  
                })
            }

            //11)- add log by api call
                // api call variable
                var data = { 
                    userid : lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].userid : lisResponce4[1].userid,
                    username : lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].username : lisResponce4[1].username,
                    full_name : lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].full_name : lisResponce4[1].full_name,
                    mobile : lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].mobile : lisResponce4[1].mobile,
                    user_uuid : req.body.user_uuid,
                    intCreatedByType : req.body.user_detials.type == role.Admin ? 1 : req.body.user_detials.type == role.SubAdmin ? 2 : req.body.user_detials.type, 
                    intUserType : lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].usertype_id : lisResponce4[1].usertype_id,
                    userIpAddress : req.body.userIpAddress ? req.body.userIpAddress : 0, 
                    userMacAddress : req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                    userOsDetails : req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                    userImeiNumber : req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                    userGcmId : req.body.userGcmId ? req.body.userGcmId : 0, //str
                    userAppVersion : req.body.userAppVersion ? req.body.userAppVersion : 0, //str
                    userApplicationType : req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                    description :  req.body.user_detials.type == role.Admin ? ('Admin '+req.query.username+ " transfer fund of "+(lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].username : lisResponce4[1].username)+" Agent") : req.body.user_detials.type == role.SubAdmin ? ('Sub-Admin '+req.query.username+ " transfer fund of "+(lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].username : lisResponce4[1].username)+" Agent") : ('Agent '+req.query.username+ " transfer fund of "+(lisResponce4[0].user_uuid == req.body.user_uuid ? lisResponce4[0].username : lisResponce4[1].username)+" Agent"),
                    userActivityType : ( req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) ? (req.body.user_detials.type == role.Admin ? 17 : 18 ) : 19,
                    oldValue : lisResponce1[0].wallet,
                    newValue : Number(lisResponce1[0].wallet) - Number(req.body.amount) - commissionAmt,
                    region_id : agentRegionId
                }
            
                // make api call
                var intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
                var strLog = intResult == 1 ? 'fund reverse log in activity log added successfully' : intResult == 2 ? 'fund reverse log error in activity log' : 'activity log end point not found'
                    console.log('Server Log : '+strLog)

                res.status(200).send({ message: 'money transfer sucessfully' })
        

        }catch(error){
            console.log(error);
            await sqlQuery.specialCMD('rollback')
            await reset(this.tableName1, req.body.user_uuid)
            await reset(this.tableName1, req.body.reciever_uuid)
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    getTransferRollbackDetails = async (req, res) => {
        try{

            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }  
                // console.log('wallet/getTransferRollbackDetails',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0
            
            // get agent list
                const lisResponce = await commonQueryCommon.getAllAgentType()
                if (!lisResponce) return res.status(400).json({ errors: [ {msg : 'User type list not found'}] });
                // console.log(lisResponce)
                var agetTypeList = lisResponce.map((result)=>{
                    return result.agent_type_name
                })

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset
            
            // search parameters 
                var param = {
                    Active: 1,
                    // region_ids : req.body.user_detials.region_list.join(',')
                };

                if(req.body.user_detials.region_list.length != 7){
                    param.region_ids = req.body.user_detials.region_list.join(',')
                }

                // if(req.query.userid) param.userid = req.query.userid;
                 if (req.query.userid) {
                const userid = req.query.userid;
                param.userid = userid.startsWith("AFP-") ? userid : `AFP-${userid}`;
              }
                if(req.query.name) param.userName = req.query.name;
                if(req.query.contactNumber) param.number = req.query.contactNumber;
                if(req.query.revertedTo) param.reverted_to = req.query.revertedTo;
                if(req.query.agentType_uuid) {
                    const lisResponce2 = await commonQueryCommon.getAgentTypeId(req.query.agentType_uuid)
                    if (!lisResponce2) return res.status(400).json({ errors: [ {msg : 'User type not found'}] });
                    // console.log(lisResponce2)
                    param.userType = lisResponce2[0].agent_type_id
                }
                if (req.query.startDate && req.query.endDate) {
                    param.between = {
                        key : 'trans_date_time',
                        value : [req.query.startDate, req.query.endDate]
                    }
                }

                if(Object.keys(param).length == 0) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });

                const lisTotalRecords = await walletModel.getTransferRollbackDetailsCount(param)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


                const lisResponce1 = await walletModel.getTransferRollbackDetails(param, limit, offset)
                // if(lisResponce1.length == 0 ) return res.status(204).json({ errors: [ {msg : 'No result found'}] });

                // console.log(lisResponce1)

                var results = lisResponce1.map((result) => {
                    var {usertype_id,...other} = result
                    other.userType = agetTypeList[usertype_id-1]
                    return other
                })

                // res.status(200).send(results)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(results)
                }else{
                    res.status(200).send({
                        reportList : results,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT),
                        totalAmount : lisTotalRecords[0].totalAmount || 0,
                        totalCommission : lisTotalRecords[0].totalCommission || 0
                    })
                }

        }catch(error){
            console.error('getTransferRollbackDetails',error)
            if( req.query.pageNumber == 0 ) {
                res.status(200).send([{}])
            }else{
                res.status(200).send({
                    reportList : [{}],
                    totalRepords : 0,
                    pageCount : 0,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT),
                    totalAmount : 0,
                    totalCommission : 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    getAgentRollbackReport = async (req,res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('wallet/getAgentRollbackReport',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0
            
                let searchKeyValue = {
                    userid : req.body.user_detials.userid,
                }

                if (req.query.startDate && req.query.endDate) {
                    searchKeyValue.between = {
                        key : 'trans_date_time',
                        value : [req.query.startDate, req.query.endDate]
                    }
                }

                let keyValue = ['COUNT(1) AS count','SUM(amount) AS amount']

                let lisRollbackTotlaRecord = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName5, searchKeyValue, keyValue, 'id', 'DESC')

                let intTotlaRecords = Number(lisRollbackTotlaRecord[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1
                let sumRollbackAmount = Number(lisRollbackTotlaRecord[0].amount) || 0

                if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : "Improper search paremeters"}] });
                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                keyValue = ['revert_by_username AS revertByID','revert_by_full_name AS revertByName','CAST(trans_date_time  AS CHAR(20)) AS dateTime','amount + commission AS amount', 'wallet_txn_id AS transactionId']

                let rollbackReport = await sqlQueryReplica.searchQueryTimeout(this.tableName5, searchKeyValue, keyValue, 'id', 'DESC', limit, offset)

                // if(rollbackReport.length == 0) return res.status(204).json({ errors: [ {msg : 'No rollback found'}] });

                if(req.query.pageNumber == 0){
                    res.status(200).send(rollbackReport)
                }else{
                    res.status(200).send({ 
                        reportList : rollbackReport,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        totalRollbackAmount : sumRollbackAmount || 0,
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
            console.log('getAgentRollbackReport',error)
            if(req.query.pageNumber == 0){
                res.status(200).send([{}])
            }else{
                res.status(200).send({ 
                    reportList : [{}],
                    totalRepords : 0,
                    pageCount : 0,
                    currentPage : Number(req.query.pageNumber),
                    totalRollbackAmount : 0,
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
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
                // console.log('wallet/getSystmeWalletBal',JSON.stringify(req.body), JSON.stringify(req.query))
            // get operator list
                const lisOperatorIds = await commonQueryCommon.getAllOperatorWithId()
                if(!lisOperatorIds) return res.status(400).json({ errors: [ {msg : 'operator list not found'}]})

            // get the balance
                var key = ["wallet_1","wallet_2","wallet_3","wallet_4","wallet_5"]

            //fire sql query 
                const lisResult1 = await sqlQueryReplica.selectStar(this.tableName6,key)
                //check responce 
                if (lisResult1.length === 0) {
                    return res.status(204).send({ message: 'system wallet not found' })
                }
            //fire sql query
                const lisResult2 = await sqlQueryReplica.selectStar(this.tableName7,key)
                //check responce 
                if (lisResult2.length === 0) {
                    return res.status(204).send({ message: 'Api wallet not found' })
                }
            
            // rearrange the responces
                var listFinalResponce = []
    
                var intTotalSystemBalance = 0, intTotalApibalance = 0
                    
                for (var i = 0; i <lisOperatorIds.length; i++){
                    // console.log("i "+ i)
                    // console.log(listFinalResponce)
                    intTotalSystemBalance += Number(lisResult1[0]['wallet_'+lisOperatorIds[i].operator_id])
                    intTotalApibalance += Number(lisResult2[0]['wallet_'+lisOperatorIds[i].operator_id])
                    let objData = {
                        operator_uuid : lisOperatorIds[i].operatorUuid,
                        operatorName : lisOperatorIds[i].operator_name,
                        systemBalance : lisResult1[0]['wallet_'+lisOperatorIds[i].operator_id],
                        apiBalance : lisResult2[0]['wallet_'+lisOperatorIds[i].operator_id]
                    }
                    listFinalResponce.push(objData)
                }
    
                return res.status(200).send(listFinalResponce)
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

module.exports = new walletController