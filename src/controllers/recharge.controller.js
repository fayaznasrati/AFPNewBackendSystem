const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const varRandomString = require('../utils/randomString.utils');

const multer = require('multer');
const upload = multer({ dest: 'bulk_topup_files/' }); // temp folder
const xlsx = require('xlsx'); // ✅ CommonJS syntax


const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const commonQueryCommon = require('../common/commonQuery.common')
// const { createWorker, sendMessage, endWorker, start } = require('../common/rabbitmq.common')

const smsFunction = require('../common/smsFunction.common')

const rechargeModule = require('../models/recharge.model')

const roles = require('../utils/userRoles.utils');
const rechargeModel = require('../models/recharge.model');

const { start, sendMessage, createWorker } = require('../common/rabbitmq.common')

const rechargeRouteController = require('./rechargeRoute.controller')

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');

// const { toIsoString } = require('../common/timeFunction.common')

const dotenv = require('dotenv');
const path = require('path');
const { type, send, sendStatus, status } = require('express/lib/response');

const redisMaster = require('../common/master/radisMaster.common')
const { format } = require('fast-csv');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { env } = require('process');


// configer env
dotenv.config()

let failedRechargeCount = {
    1: 0,
    2: 0
}
const REPORT_DIR = '/var/www/html/AFPNewBackendSystem/the_topup_reports';

class rechargeController {

    tableName1 = 'er_recharge'
    tableName2 = 'er_login'
    tableName3 = 'er_agent_operator_access'
    tableName4 = 'er_wallet'
    tableName5 = 'er_wallet_transaction'
    tableName6 = 'er_operator_topup'
    tableName7 = 'er_member'
    tableName8 = 'er_postpaid_commission'
    tableName9 = 'er_commission_amount'
    tableName10 = 'er_member_group'
    tableName11 = 'er_money_current_balance'
    tableName12 = 'er_monthly_recharge'
    tableName13 = 'er_prepaid_commission'
    tableName14 = 'er_agent_stock_transfer_channel'
    tableName15 = 'er_salaam_topup'
    tableName16 = 'er_awcc_topup'
    tableName17 = 'er_mtn_topup'
    tableName18 = 'er_etisalat_topup'
    tableName19 = 'er_roshan_topup'
    tableName20 = 'er_mno_details'
    tableName21 = 'er_emoney'
    tableName22 = 'er_monthly_recharge'
    tableName23 = 'er_admin_notification_numbers'
    tableName24 = 'er_access_status'
    tableName25 = `er_daily_topup_summery`

    constructor() {
        start().then((msg) => {
            // console.log(msg);
            if (process.env.START_RABBIT_MQ_WORKER == 1) {
                // createWorker('SMS',this.smsWorker)
                if (msg == 'connection created') {
                    createWorker('giveCommissionToAgent', this.giveCommissionToAgent)
                    createWorker('refundFailedRechargeBalance', this.refundFailedRechargeBalance)
                    createWorker('rollbackCommissionFromAgent', this.rollbackCommissionFromAgent)
                }
            }

        })
        // this.failedRechargeRollback()

        // this.fun()
    }

    fun = async (data) => {
        console.log('data', data)

        // // redisMaster.post(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`,0)
        // let response = await redisMaster.asyncGet(`PENDING_RECHARGE_2`)
        // console.log(response)
        // response = await redisMaster.decr(`PENDING_RECHARGE_2`)
        // console.log(response)
        // response = await redisMaster.incr(`PENDING_RECHARGE_2`)
        // console.log(response)
        // response = await redisMaster.asyncGet(`PENDING_RECHARGE_2`)
        // console.log(response)
    }

    failedRechargeRollback = async () => {
        try {
            let data = {
                mno_id: 1,
                operator_uuid: '70b9906d-c2ba-11',
                userid: 810,
                user_uuid: '42cc1aef-2453-11',
                amount: 60,
                strUniqueNumber: '050922162835376',
                mobile: '0786222971'
            }
            // mno_id, operator_uuid, user_uuid, amount, userid

            const lisResponce1 = await commonQueryCommon.getOperatorById(data.operator_uuid);
            if (lisResponce1 == 0) return ({ status: 400, message: 'operator id not found' })

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            const strDate = date.toISOString().slice(0, 19).replace('T', ' ')
            var isodate = date.toISOString();

            // get system balance
            let balanceDe = await sqlQuery.searchQuery(this.tableName20, { id: data.mno_id, status: 1 }, ['current_balance', 'CAST(mno_uuid AS CHAR(16)) AS mno_uuid', 'mno_name'], 'id', 'desc', 1, 0)
            if (balanceDe.length == 0) return ({ status: 400, message: 'System balance not found' })

            // update agent account so it cant do any transactions
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 1
            }

            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 0 }, searchKeyValue);
            var { affectedRows, changedRows, info } = objResponce;

            // generating proper message
            if (!affectedRows) return ({ status: 400, message: 'earlier transation under process' })
            if (!(affectedRows && changedRows)) return ({ status: 400, message: 'Earlier transation under process' })

            const lisResponce3 = await sqlQuery.searchQueryTran(this.tableName4, { user_uuid: data.user_uuid }, ["ex_wallet", "min_wallet"], 'userid', "ASC", 1, 0)

            // decuct the amount from the agent balance and update the transaction status
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 0,
            }
            var param = {
                addBalance: {
                    key: "ex_wallet",
                    value: Number(data.amount)
                },
                // ex_wallet : Number(lisResponce3[0].ex_wallet) + Number(data.amount), // remaining amount
                canTransfer: 1
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

            // get mno balance 
            // let mnoBalance = await sqlQuery.searchQuery(this.tableName20,{id : mno_id},['current_balance'],'id','desc',1,0)

            // deduct amount from system
            var keyValue = {
                deductBalance: {
                    key: "current_balance",
                    value: Number(data.amount)
                }
            }
            var objResponce = await sqlQuery.updateQuery(this.tableName20, keyValue, { id: data.mno_id })

            // add record to mno details
            var param = {
                emoney_uuid: "uuid()",
                mno_uuid: balanceDe[0].mno_uuid, //str operator uuid
                mno_name: balanceDe[0].mno_name, //str operator name
                amount_added: Number(data.amount), //db amount added
                comm_amount: 0, //db commision amount
                opening_balance: balanceDe[0].current_balance, //db opening balance
                closing_balance: Number(balanceDe[0].current_balance) + Number(data.amount), //db closing balance
                emoney_txn_id: data.strUniqueNumber, //int transaction id
                emoney_txn_date: isodate, //dt transaction date
                created_by: data.userid, //str user id
                type: 2, // recharge process
                created_on: isodate, //dt current date time
                last_modified_by: data.userid, // str user id
                last_modified_on: isodate //dt current date time
            }

            //fire sql query to create er money 
            var objResponce = await sqlQuery.createQuery(this.tableName21, param)

            // add reciept data in er wallet transaction
            var param = {
                wallet_txn_uuid: "uuid()",
                userid: data.userid, // str userid
                user_uuid: data.user_uuid, // str userid
                trans_number: data.strUniqueNumber, // str unique number
                trans_date_time: strDate, // str date
                amount: Number(data.amount), // db amount
                trans_type: 1, // type credit
                narration: `Refund for Top-Up to ${data.mobile}`,
                balance_amount: Number(lisResponce3[0].ex_wallet) + Number(data.amount), //db balance amount
                trans_for: "Error Top-Up Refund"
            }
            //fire sql query
            var objResponce = await sqlQuery.createQuery(this.tableName5, param)


        } catch (error) {
            console.log(error)
        }
    }

    groupRecharge = async (req, res) => {
        try {
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/groupRecharge',JSON.stringify(req.body), JSON.stringify(req.query))
            // check operator details
            // const lisResponce1 = await commonQueryCommon.getOperatorById(req.body.operator_uuid);
            // if (lisResponce1 == 0) return res.status(400).json({ errors: [ {msg : 'operator id not found'}] });

            // get the contact list 
            const lisResponce4 = await sqlQueryReplica.searchQueryNoLimit(this.tableName7, { group_uuid: req.body.group_uuid, active: 1 }, ["mobile", "group_id","amount"], 'name', "ASC")
            // console.log(lisResponce4)
            if (lisResponce4.length == 0) {
                // var lisresponce = await sqlQuery.specialCMD('rollback')
                // var searchKeyValue = {
                //     user_uuid: req.body.user_detials.user_uuid, //str user_uuid
                //     canTransfer: 0
                // }
                // // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                // var objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);
                return res.status(400).json({ errors: [{ msg: 'Group list dont have any contact number' }] });
            }

            // for loop to create list for recharge table and for transaction table lisResponce4[i].group_id lisResponce4[i].mobile
            var status = [], message = []
            let i = 0, responce, data
            for (i = 0; i < lisResponce4.length; i++) {

                let operator_uuid = '', operatorName = ''

                switch (lisResponce4[i].mobile.slice(0, 3)) {
                    case "078":
                    case "073":
                        // Etisalat
                        operator_uuid = "70b9906d-c2ba-11"
                        operatorName = "Etisalat"
                        break;
                    case "079":
                    case "072":
                        // Roshan
                        operator_uuid = "9edb602c-c2ba-11"
                        operatorName = "Roshan"
                        break;
                    case "077":
                    case "076":
                        // MTN
                        operator_uuid = "456a6b47-c2ba-11",
                            operatorName = "MTN"
                        break;
                    case "074":
                        // Salaam
                        operator_uuid = "1e0e1eeb-c2a6-11"
                        operatorName = "Salaam"
                        break;
                    case "070":
                    case "071":
                        // AWCC
                        operator_uuid = "6a904d84-c2a6-11"
                        operatorName = "AWCC"
                        break;
                }

                if (!operator_uuid || !operatorName) {
                    status.push(400)
                    message.push('Mobile number operator error')
                    continue;
                }
                // console.log(Number(lisResponce4[i].mobile),String(Number(lisResponce4[i].mobile)).length)
                if (String(Number(lisResponce4[i].mobile)).length != 9) {
                    status.push(400)
                    message.push('Mobile number error')
                    continue;
                }

                data = {
                    operatorName: operatorName,
                    operator_uuid: operator_uuid,
                    amount: lisResponce4[i].amount,
                    mobile: lisResponce4[i].mobile,
                    userid: req.body.user_detials.userid,
                    user_uuid: req.body.user_detials.user_uuid,
                    user_mobile: req.body.user_detials.mobile,
                    channelType: ['Mobile', 'SMS', 'USSD', 'Web', 'Company'].includes(req.body.userApplicationType) ? req.body.userApplicationType : 'Web',
                    userType: req.body.user_detials.type,
                    group_topup_id: lisResponce4[i].group_id,
                    full_name: req.body.user_detials.name,
                    username: req.body.user_detials.username,
                    region_id: req.body.user_detials.region_id,
                    userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
                    userMacAddress: req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                    userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                    userImeiNumber: req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                    userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
                    userAppVersion: req.body.userAppVersion ? req.body.userAppVersion : null, //str
                    userApplicationType: req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                }
                console.log('data', data)

                responce = await this.processRecharge(data)
                status.push(responce.status)
                message.push(responce.message)
            }
            if (status.includes(200)) {
                if (status.includes(400)) {
                    // return res.status(responce.status).send({ message: "Some recharge request added successfully" })
                    return res.json({
                        status: responce.status,
                        message: "Some recharge request added successfully",
                        results: message
                    });
                }
                else return res.json({
                    status: responce.status,
                    message: "All recharge request added successfully",
                    results: message
                });
            }
            res.status(400).json({ errors: [{ msg: message[status.indexOf(400)] }] });

        } catch (error) {
            console.log(error);
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    bulkTopupRecharge = async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ msg: 'Excel file is required' });

            const workbook = xlsx.readFile(req.file.path);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(sheet);

            if (!rows.length) return res.status(400).json({ msg: 'Excel sheet is empty' });

            let statusList = [], messageList = [];

            for (let i = 0; i < rows.length; i++) {
                const mobile = String(rows[i].mobile).trim();
                const amount = Number(rows[i].amount);
                // const amount = Number(rows[i].amount);;
                // const mobile = 730720003;
                console.log('Amount:', amount, 'Type:', typeof amount);
                console.log('Mobile:', mobile, 'Type:', typeof mobile);
                if (!mobile || !amount || isNaN(amount)) {
                    statusList.push(400);
                    messageList.push(`Row ${i + 2}: Invalid mobile or amount`);
                    continue;
                }

                //     // Determine operator
                //    console.log('recharge/BulkTopupRecharge', JSON.stringify(req.body), JSON.stringify(req.query))
                let operator_uuid = '', operatorName = ''
                let normalized = String(mobile).trim();

                if (normalized.startsWith('+93') && normalized.length === 12) {
                    normalized = '0' + normalized.slice(3);  // +9373... => 073...
                    console.log("no",)
                } else if (normalized.startsWith('93') && normalized.length === 11) {
                    normalized = '0' + normalized.slice(2);  // 9373...  => 073...
                } else if (!normalized.startsWith('0') && normalized.length === 9) {
                    normalized = '0' + normalized;           // 731234567 => 0731234567
                }
                // Use switch on first 3 digits
                console.log("normalized", normalized)
                switch (normalized.slice(0, 3)) {
                    case "078":
                    case "073":
                        // Etisalat
                        operator_uuid = "70b9906d-c2ba-11"
                        operatorName = "Etisalat"
                        break;
                    case "079":
                    case "072":
                        // Roshan
                        operator_uuid = "9edb602c-c2ba-11"
                        operatorName = "Roshan"
                        break;
                    case "077":
                    case "076":
                        // MTN
                        operator_uuid = "456a6b47-c2ba-11",
                            operatorName = "MTN"
                        break;
                    case "074":
                        // Salaam
                        operator_uuid = "1e0e1eeb-c2a6-11"
                        operatorName = "Salaam"
                        break;
                    case "070":
                    case "071":
                        // AWCC
                        operator_uuid = "6a904d84-c2a6-11"
                        operatorName = "AWCC"
                        break;
                }

                if (!operator_uuid) {
                    statusList.push(400);
                    messageList.push(`Row ${i + 2}: Unknown operator`);
                    continue;
                }

                // console.log('Amount:', amount, 'Type:', typeof amount);
                // console.log('Mobile:', normalized, 'Type:', typeof normalized);

                // Safe conversion and fallback
                const safeAmount = amount ? String(amount).trim() : '0';
                const safeMobile = normalized ? String(normalized).trim() : '0000000000'; // fallback value

                let data = {
                    operatorName: operatorName,
                    operator_uuid: operator_uuid,
                    amount: safeAmount, // now always a string
                    mobile: safeMobile, // now always a string
                    userid: req.body.user_detials.userid,
                    user_uuid: req.body.user_detials.user_uuid,
                    user_mobile: req.body.user_detials.mobile,
                    userType: req.body.user_detials.type,
                    channelType: ['Mobile', 'SMS', 'USSD', 'Web', "Company"].includes(req.body.userApplicationType) ? req.body.userApplicationType : 'Web',
                    group_topup_id: 0,
                    full_name: req.body.user_detials.name,
                    username: req.body.user_detials.username,
                    region_id: req.body.user_detials.region_id,
                    userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
                    userMacAddress: req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                    userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                    userImeiNumber: req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                    userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
                    userAppVersion: req.body.userAppVersion ? req.body.userAppVersion : null, //str
                    userApplicationType: req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                }
                // console.log('data', data)
                const response = await this.processRecharge(data);
                // console.log('response', response);
                statusList.push(response.status);
                messageList.push(`Row ${i + 2}: ${response.message}`);

            }

            // Delete file after processing
            fs.unlinkSync(req.file.path);;
            // deleteUploadedFile(req.file.path);
            return res.json({
                status: 'success',
                results: messageList
            });

        } catch (err) {
            console.error(err);
            //  deleteUploadedFile(req.file.path);
            // Try to delete file even on error
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(500).json({ msg: 'Server error', error: err.message });
        }
    }

    deleteUploadedFile = (fileId) => {
        const filePath = path.join(__dirname, 'src/uploads', fileId);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`❌ Failed to delete file ${filePath}:`, err.message);
            } else {
                console.log(`✅ File deleted: ${filePath}`);
            }
        });
    };

    #checkStockTransferStatus = async () => {
        let strStockTransferStatus = await redisMaster.asyncGet('STOCK_TRANSFER_STATUS')
        if (strStockTransferStatus) {
            return (JSON.parse(strStockTransferStatus))
        } else {
            let stockTransferStatus = await sqlQuery.searchQueryNoCon(this.tableName24, ['stock_transfer'], 'stock_transfer', 'ASC', 1, 0)
            redisMaster.post('STOCK_TRANSFER_STATUS', JSON.stringify(stockTransferStatus))
            return (stockTransferStatus)
        }
    }

    singlerecharge = async (req, res) => {
        try {
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('recharge/singleRecharge', JSON.stringify(req.body), JSON.stringify(req.query))
            let operator_uuid = '', operatorName = ''

            switch (req.body.mobile.slice(0, 3)) {
                case "078":
                case "073":
                    // Etisalat
                    operator_uuid = "70b9906d-c2ba-11"
                    operatorName = "Etisalat"
                    break;
                case "079":
                case "072":
                    // Roshan
                    operator_uuid = "9edb602c-c2ba-11"
                    operatorName = "Roshan"
                    break;
                case "077":
                case "076":
                    // MTN
                    operator_uuid = "456a6b47-c2ba-11",
                        operatorName = "MTN"
                    break;
                case "074":
                    // Salaam
                    operator_uuid = "1e0e1eeb-c2a6-11"
                    operatorName = "Salaam"
                    break;
                case "070":
                case "071":
                    // AWCC
                    operator_uuid = "6a904d84-c2a6-11"
                    operatorName = "AWCC"
                    break;
            }

            if (operator_uuid != req.body.operator_uuid || operatorName != req.body.operatorName) {
                return res.status(400).json({ errors: [{ msg: "Mobile number does not match with selected operator" }] });
            }

            let data = {
                operatorName: req.body.operatorName,
                operator_uuid: req.body.operator_uuid,
                amount: req.body.amount,
                mobile: req.body.mobile,
                userid: req.body.user_detials.userid,
                user_uuid: req.body.user_detials.user_uuid,
                user_mobile: req.body.user_detials.mobile,
                userType: req.body.user_detials.type,
                channelType: ['Mobile', 'SMS', 'USSD', 'Web', "Company"].includes(req.body.userApplicationType) ? req.body.userApplicationType : 'Web',
                group_topup_id: 0,
                full_name: req.body.user_detials.name,
                username: req.body.user_detials.username,
                region_id: req.body.user_detials.region_id,
                userIpAddress: req.body.userIpAddress ? req.body.userIpAddress : 0,
                userMacAddress: req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                userOsDetails: req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                userImeiNumber: req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                userGcmId: req.body.userGcmId ? req.body.userGcmId : 0, //str
                userAppVersion: req.body.userAppVersion ? req.body.userAppVersion : null, //str
                userApplicationType: req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
            }

            let responce
            console.log('data', data)
            let stockTransferStatus = await this.#checkStockTransferStatus()
            if (stockTransferStatus.length == 0 || stockTransferStatus[0].stock_transfer == 0) {
                responce = { status: 400, message: 'Recharge is not allowed for a while.' }
            } else {
                responce = await this.processRecharge(data)
            }

            // send responce to front end
            if (responce.status == 200) res.status(responce.status).send({ message: responce.message })
            else res.status(responce.status).json({ errors: [{ msg: responce.message }] });

        } catch (error) {
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    #getOperatorList = async (operator_uuid) => {
        let operatorUuid = 'OPERATOR_UUID_' + operator_uuid
        let strOperatorDetails = await redisMaster.asyncGet(operatorUuid)
        if (strOperatorDetails) {
            return (JSON.parse(strOperatorDetails))
        } else {
            const lisResponce1 = await commonQueryCommon.getOperatorById(operator_uuid);
            if (lisResponce1) redisMaster.post(operatorUuid, JSON.stringify(lisResponce1))
            return lisResponce1
        }
    }

    #getOperatorSystemList = async (operator_id) => {
        let operatorName = 'RECHARGE_OPERATOR_' + operator_id
        let strOperatorSystemList = await redisMaster.asyncGet(operatorName)
        if (strOperatorSystemList) {
            return (JSON.parse(strOperatorSystemList))
        } else {
            let systemDetails = await sqlQuery.searchQueryNoLimit(this.tableName6, { operator_id: operator_id, active: 1 }, ['mno_id', "queue_name", "status", "min_amount", "max_amount"], "operator_access_id", "DESC");
            redisMaster.post(operatorName, JSON.stringify(systemDetails))
            return systemDetails
        }
    }

    #getOperatorAccess = async (user_uuid, operatorId) => {
        let operatorName = `AGENT_OPERATOR_${user_uuid}`
        let strOperatorPermission = await redisMaster.asyncGet(operatorName)

        let lisResponce2
        if (strOperatorPermission) {
            lisResponce2 = JSON.parse(strOperatorPermission)
            lisResponce2 = {
                status: lisResponce2[`oper${operatorId}_status`],
                comm_type: lisResponce2.comm_type
            }
        } else {
            lisResponce2 = await sqlQuery.searchQuery(this.tableName2, { user_uuid: user_uuid },
                ["oper1_status", "oper2_status", "oper3_status", "oper4_status", "oper5_status", "comm_type"]
                , "userid", "ASC", 1, 0)
            if (lisResponce2.length > 0 && lisResponce2[0].comm_type != 0) {
                redisMaster.post(operatorName, JSON.stringify(lisResponce2[0]))
                lisResponce2 = {
                    status: lisResponce2[0][`oper${operatorId}_status`],
                    comm_type: lisResponce2[0].comm_type
                }
            } else {
                return lisResponce2
            }
        }
        return [lisResponce2]
    }

    #getUserChannel = async (user_uuid, channelType) => {
        let channelName = `AGENT_CHANNEL_${user_uuid}`
        let strChannelPermission = await redisMaster.asyncGet(channelName)

        let channelList, finalPermission = {}, permission = {}
        if (strChannelPermission) {
            finalPermission = JSON.parse(strChannelPermission)
        } else {
            channelList = await sqlQuery.searchQueryNoLimit(this.tableName14, { user_uuid: user_uuid }, ['threshold', 'status', 'channel'], 'userid', 'ASC', 1, 0)
            if (channelList.length > 0) {
                for (let i = 0; i < channelList.length; i++) {
                    permission = {
                        threshold: channelList[i].threshold,
                        status: channelList[i].status
                    }

                    finalPermission[channelList[i].channel] = permission
                }
                redisMaster.post(channelName, JSON.stringify(finalPermission))
            } else {
                return channelList
            }
        }

        return [finalPermission[channelType]]
    }

    processRecharge = async (data) => {
        try {

            // check operator details
            const lisResponce1 = await this.#getOperatorList(data.operator_uuid);
            if (lisResponce1 == 0) return ({ status: 400, message: 'operator id not found' })

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get system balance 
            let systemDetails = await this.#getOperatorSystemList(lisResponce1[0].operator_id)
            if (systemDetails.length == 0) return ({ status: 400, message: 'operator not active' })
            let mno_id, queue_name, minRechargeLimit, maxRechargeList, status = 0
            for (let i = 0; i < systemDetails.length; i++) {
                mno_id = systemDetails[i].mno_id
                // operator_access_uuid = systemDetails[i].operator_access_uuid
                // display_name = systemDetails[i].display_name 
                queue_name = systemDetails[i].queue_name
                status = systemDetails[i].status
                minRechargeLimit = systemDetails[i].min_amount
                maxRechargeList = systemDetails[i].max_amount

                if (status == 1) break
            }

            if (status != 1) return ({ status: 400, message: 'Operator in active' })
            // console.log(Number(minRechargeLimit),Number(data.amount))
            if (Number(minRechargeLimit) > Number(data.amount)) {
                return ({ status: 400, message: `Please enter amount more then or equal to ${minRechargeLimit}` })

            }
            if (Number(maxRechargeList) > 0 && Number(maxRechargeList) < Number(data.amount)) return ({ status: 400, message: `Please enter amount less then or equal to ${maxRechargeList}` })

            // get recharge count
            let pendingCount = await redisMaster.incr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
            let allowedPendingCount = await redisMaster.asyncGet(`PENDING_ALLOWED_${lisResponce1[0].operator_id}`)
            if (pendingCount && allowedPendingCount) {
                if (Number(pendingCount) > Number(allowedPendingCount)) {
                    redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                    return ({ status: 400, message: 'Request Failed, Please try again..!' })
                }
            }

            // get system balance
            let balanceDe = await sqlQuery.searchQuery(this.tableName20, { id: mno_id, status: 1 }, ['current_balance', 'CAST(mno_uuid AS CHAR(16)) AS mno_uuid', 'mno_name'], 'id', 'desc', 1, 0)
            if (balanceDe.length == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'System balance not found' })
            }
            // check system balance
            if (Number(data.amount) > Number(balanceDe[0].current_balance)) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'We have encountered an issue on wallet, Please contact our Customer Service' })
            }
            //transation variables
            const dtCurrentDate = date // dt current date time
            const strDate = date.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
            const strUniqueNumber = await dataBaseId(date) //str unique number

            // check if the agent can do the recharge
            // const lisResponce2 = await sqlQuery.searchQuery(this.tableName2,{user_uuid : data.user_uuid},["oper"+lisResponce1[0].operator_id+"_status AS status","comm_type"],"userid","ASC",1,0)    
            const lisResponce2 = await this.#getOperatorAccess(data.user_uuid, lisResponce1[0].operator_id)
            if (lisResponce2.length == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'operator permission not found' })
            }
            if (lisResponce2[0].status == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'operator permission is not given' })
            }
            if (lisResponce2[0].comm_type == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'Commission not set feature not active' })
            }

            // check if recahnge is done in last 5 min
            var lastRechangeCount = await sqlQuery.searchQuery(this.tableName1, {
                operator_id: lisResponce1[0].operator_id,
                amount: Number(data.amount),
                mobile_number: data.mobile,
                userid: data.userid,
                'NOT status': 3,
                timeDifferent: {
                    key: 'created_on',
                    value: strDate,
                    diff: process.env.RECHARGE_TIME_LIMIT
                }
            }, ['COUNT(1)'], 'userid', 'ASC', 1, 0)
            // console.log(lastRechangeCount[0])
            if (lastRechangeCount[0]["COUNT(1)"] != 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: `Same recharge is already done within ${process.env.RECHARGE_TIME_LIMIT} min` })
            }
            // update agent account so it cant do any transactions
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 1
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 0 }, searchKeyValue);
            var { affectedRows, changedRows, info } = objResponce;
            // fayaz uncomment this section 
            // generating proper message
            if (!affectedRows) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'earlier transation under process' })
            }
            if (!(affectedRows && changedRows)) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'Earlier transation under process' })
            }

            // start transaction
            var lisresponce = await sqlQuery.specialCMD('transaction')

            // // if prepaid then check for limit and deduct amount from limit
            //     if(lisResponce2[0].comm_type == 0) ({status : 400, message : 'Commission not set feature not active' })

            // check balance of the agent and minimum amount limit
            const lisResponce3 = await sqlQuery.searchQueryTran(this.tableName4, { user_uuid: data.user_uuid }, ["ex_wallet", "min_wallet"], 'userid', "ASC", 1, 0)
            // console.log(lisResponce3[0])
            if (lisResponce3.length == 0) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'user dont have enough balance to do recharge' })
            }
            if (lisResponce3[0].ex_wallet - Number(data.amount) < 0) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'user dont have enough balance to do recharge' })
            }

            // get the channel access details
            let channelList = ['Mobile', 'SMS', 'USSD', 'Web', 'Company']
            let channelType = channelList.includes(data.channelType) ? data.channelType : 'Web'
            // let channelLimit = await sqlQuery.searchQuery(this.tableName14,{userid : data.userid, channel : channelType},['threshold','status'],'userid','ASC',1,0) 
            let channelLimit = await this.#getUserChannel(data.user_uuid, channelType)
            if (channelLimit.length == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'Channel limit not found' })
            }
            console.log(channelLimit)
            if (channelLimit[0].status != 1) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: `Your ${data.channelType} channel is In-Active.` })
            }

            if (Number(channelLimit[0].threshold) > Number(lisResponce3[0].ex_wallet) - Number(data.amount)) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: `Your ${data.channelType} channel Threshold limit reached.` })
            }

            if (lisResponce2[0].comm_type == '1') {
                let limitStatus = await sqlQuery.searchQueryTran(this.tableName13, { userid: data.userid }, ['op' + lisResponce1[0].operator_id + '_wallet_active AS limit_state', 'op' + lisResponce1[0].operator_id + '_wallet_limit as limit_value'], 'userid', 'ASC', 1, 0)
                if (limitStatus.length == 0) {
                    redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                    return ({ status: 400, message: 'Recharge limit not found' })
                }
                if (limitStatus[0].limit_state == 1) {
                    // check limit and update its
                    if (Number(limitStatus[0].limit_value) - Number(data.amount) >= 0) {
                        // update limit
                        let updateLimit = await sqlQuery.updateQuery(this.tableName13, {
                            deductBalance: {
                                key: 'op' + lisResponce1[0].operator_id + '_wallet_limit',
                                value: Number(data.amount)
                            }
                        }, { userid: data.userid })
                    } else {
                        var lisresponce = await sqlQuery.specialCMD('rollback')
                        var searchKeyValue = {
                            user_uuid: data.user_uuid, //str user_uuid
                            canTransfer: 0
                        }
                        // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                        var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                        redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                        return ({ status: 400, message: 'Recharge amount is more then Operator limit' })
                    }
                }
            }

            // add data in er recharge table
            param = {
                userid: data.userid,
                trans_number: strUniqueNumber,
                Operater_table_id: lisResponce1[0].operator_id,
                type_id: 1, // top up
                type_name: 'Top Up',
                operator_id: lisResponce1[0].operator_id,
                api_type: mno_id,
                operator_name: data.operatorName,
                mobile_number: data.mobile,
                amount: data.amount,
                deduct_amt: data.amount,
                source: channelType,
                group_topup_id: data.group_topup_id || 0,
                closing_balance: Number(lisResponce3[0].ex_wallet) - Number(data.amount),
                created_on: strDate, //date curren date time
                modified_on: strDate, //date curren date time
                os_details: '',
                status: 1,
                request_mobile_no: data.user_mobile
            }

            //fire sql query
            var objResponce = await sqlQuery.createQuery(this.tableName1, param)

            // decuct the amount from the agent balance and update the transaction status
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 0,
            }
            var param = {
                deductBalance: {
                    key: "ex_wallet",
                    value: Number(data.amount),
                },
                // ex_wallet : Number(lisResponce3[0].ex_wallet) - Number(data.amount), // remaining amount
                // canTransfer: 1
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

            // get mno balance 
            // let mnoBalance = await sqlQuery.searchQuery(this.tableName20,{id : mno_id},['current_balance'],'id','desc',1,0)

            // deduct amount from system
            var keyValue = {
                deductBalance: {
                    key: "current_balance",
                    value: Number(data.amount)
                }
            }
            var objResponce = await sqlQuery.updateQuery(this.tableName20, keyValue, { id: mno_id })

            // rabbit mq message list
            let reqLis = [strUniqueNumber, data.operatorName, data.mobile, data.amount]

            console.log(queue_name, reqLis)
            sendMessage(queue_name, reqLis.join('|'), (err, result) => {
                if (err) console.error(err)
                // console.log(result)
            })

            // add record to mno details
            var param = {
                emoney_uuid: "uuid()",
                mno_uuid: balanceDe[0].mno_uuid, //str operator uuid
                mno_name: balanceDe[0].mno_name, //str operator name
                amount_added: Number(data.amount), //db amount added
                comm_amount: 0, //db commision amount
                opening_balance: balanceDe[0].current_balance, //db opening balance
                closing_balance: Number(balanceDe[0].current_balance) - Number(data.amount), //db closing balance
                emoney_txn_id: strUniqueNumber, //int transaction id
                emoney_txn_date: isodate, //dt transaction date
                created_by: data.userid, //str user id
                type: 2, // debit
                created_on: isodate, //dt current date time
                last_modified_by: data.userid, // str user id
                last_modified_on: isodate //dt current date time
            }

            //fire sql query to create er money 
            var objResponce = await sqlQuery.createQuery(this.tableName21, param)

            // add reciept data in er wallet transaction
            var param = {
                wallet_txn_uuid: "uuid()",
                userid: data.userid, // str userid
                user_uuid: data.user_uuid, // str userid
                trans_number: strUniqueNumber, // str unique number
                trans_date_time: strDate, // str date
                amount: Number(data.amount), // db amount
                trans_type: 2, // type debit
                narration: `Top-Up to ${data.mobile}`,
                balance_amount: Number(lisResponce3[0].ex_wallet) - Number(data.amount), //db balance amount
                trans_for: "Top-Up"
            }
            //fire sql query
            var objResponce = await sqlQuery.createQuery(this.tableName5, param)

            let messageQueue = {
                userId: data.userid,
                amount: Number(data.amount),
                dateTime: strDate
            }
            sendMessage('processedStockSend', JSON.stringify(messageQueue), (err, msg) => {
                if (err) console.log(err)
            })

            // add entry to log tables  
            let tableName, insertData
            // redisMaster.incr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
            switch (lisResponce1[0].operator_id) {
                case 3:
                    tableName = this.tableName17
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        source: channelType,
                        topupRequest: " ",
                        response: " "
                    }
                    break;
                case 2:
                    tableName = this.tableName16
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        source: channelType,
                        topupRequest: " ",
                        topupResponse: " "
                    }
                    break;
                case 4:
                    tableName = this.tableName18
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        login_request: " ",
                        login_response: " "
                    }
                    break;
                case 5:
                    tableName = this.tableName19
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        top_up_request: " ",
                        top_up_response: " "
                    }
                    break;
                case 1:
                    tableName = this.tableName15
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        request: " ",
                        response: " "
                    }
                    break;
            }

            if (!tableName || !insertData) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'Recharge log error' })
            }

            objResponce = await sqlQuery.createQuery(tableName, insertData)

            var logData = {
                userid: data.userid,
                user_uuid: data.user_uuid,
                username: data.username,
                full_name: data.full_name,
                mobile: data.user_mobile,
                intCreatedByType: data.userid,
                intUserType: data.userType,
                userIpAddress: data.userIpAddress,
                userMacAddress: data.userMacAddress, //str
                userOsDetails: data.userOsDetails, //str
                userImeiNumber: data.userImeiNumber, //str
                userGcmId: data.userGcmId, //str
                userAppVersion: data.userAppVersion, //str
                userApplicationType: data.userApplicationType,
                description: `Dear ${data.full_name}, Your Recharge to ${data.mobile} Amount: ${parseFloat(String(data.amount)).toFixed(2)} AFN is Accepted, Bal:${Number(lisResponce3[0].ex_wallet) - Number(data.amount)} AFN TX:${strUniqueNumber} Thank You for being Afghan Pay agent!`,
                userActivityType: 25,
                oldValue: Number(lisResponce3[0].ex_wallet),
                newValue: Number(lisResponce3[0].ex_wallet) - Number(data.amount),
                regionId: data.region_id
            }

            // make api call
            let intResult = await httpRequestMakerCommon.httpPost("activity-log", logData)
            var strLog = intResult == 1 ? 'Admin change password log added successfully' : intResult == 2 ? 'Admin chain password log error' : 'end point not found'
            // console.log('Server Log : '+strLog)

            if (intResult != 1) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'log error' })
            }

            // update transactions status
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 0
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);

            // no error commit the transactions
            var lisresponce = await sqlQuery.specialCMD('commit')
            // console.log("data",data);
            let responceMessage = `Dear ${data.full_name}, Your Recharge to ${data.mobile} Amount: ${parseFloat(String(data.amount)).toFixed(2)} AFN is Accepted, Bal:${Number(lisResponce3[0].ex_wallet) - Number(data.amount)} AFN TX:${strUniqueNumber} Thank You for being Afghan Pay agent!`

            return ({
                status: 200,
                rechargeTxnNumber: strUniqueNumber,
                closingBalance: Number(lisResponce3[0].ex_wallet) - Number(data.amount),
                message: responceMessage
            })

        } catch (error) {
            console.log(error);
            var errMessage = error.message
            var lisresponce = await sqlQuery.specialCMD('rollback')  // roll back due to some error
            // update transactions status
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 0
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);

            const lisResponce1 = await this.#getOperatorList(data.operator_uuid);
            redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)

            if (errMessage.includes("Duplicate entry")) {
                return ({ status: 400, message: 'Recharge request Failed with Error' })
            }
            return ({ status: 400, message: error.message })
        }
    }

    CompanyProcessRecharge = async (data) => {
        try {

            // check operator details
            const lisResponce1 = await this.#getOperatorList(data.operator_uuid);
            if (lisResponce1 == 0) return ({ status: 403, message: 'operator id not found' })

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get system balance 
            let systemDetails = await this.#getOperatorSystemList(lisResponce1[0].operator_id)
            if (systemDetails.length == 0) return ({ status: 403, message: 'operator is not active' })
            let mno_id, queue_name, minRechargeLimit, maxRechargeList, status = 0
            for (let i = 0; i < systemDetails.length; i++) {
                mno_id = systemDetails[i].mno_id
                // operator_access_uuid = systemDetails[i].operator_access_uuid
                // display_name = systemDetails[i].display_name 
                queue_name = systemDetails[i].queue_name
                status = systemDetails[i].status
                minRechargeLimit = systemDetails[i].min_amount
                maxRechargeList = systemDetails[i].max_amount

                if (status == 1) break
            }

            if (status != 1) return ({ status: 400, message: 'Operator in active' })
            // console.log(Number(minRechargeLimit),Number(data.amount))
            if (Number(minRechargeLimit) > Number(data.amount)) {
                return ({ status: 400, message: `Please enter amount more then or equal to ${minRechargeLimit}` })

            }
            if (Number(maxRechargeList) > 0 && Number(maxRechargeList) < Number(data.amount)) return ({ status: 400, message: `Please enter amount less then or equal to ${maxRechargeList}` })

            // get recharge count
            let pendingCount = await redisMaster.incr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
            let allowedPendingCount = await redisMaster.asyncGet(`PENDING_ALLOWED_${lisResponce1[0].operator_id}`)
            if (pendingCount && allowedPendingCount) {
                if (Number(pendingCount) > Number(allowedPendingCount)) {
                    redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                    return ({ status: 400, message: 'Request Failed, Please try again..!' })
                }
            }

            // get system balance
            let balanceDe = await sqlQuery.searchQuery(this.tableName20, { id: mno_id, status: 1 }, ['current_balance', 'CAST(mno_uuid AS CHAR(16)) AS mno_uuid', 'mno_name'], 'id', 'desc', 1, 0)
            if (balanceDe.length == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 503, message: 'System balance not found' })
            }
            // check system balance
            if (Number(data.amount) > Number(balanceDe[0].current_balance)) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 503, message: 'We have encountered an issue on wallet, Please contact our Customer Service' })
            }
            //transation variables
            const dtCurrentDate = date // dt current date time
            const strDate = date.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
            const strUniqueNumber = await dataBaseId(date) //str unique number

            // check if the agent can do the recharge
            // const lisResponce2 = await sqlQuery.searchQuery(this.tableName2,{user_uuid : data.user_uuid},["oper"+lisResponce1[0].operator_id+"_status AS status","comm_type"],"userid","ASC",1,0)    
            const lisResponce2 = await this.#getOperatorAccess(data.user_uuid, lisResponce1[0].operator_id)
            if (lisResponce2.length == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 403, message: 'operator permission not found' })
            }
            if (lisResponce2[0].status == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 403, message: 'operator permission is not given' })
            }
            if (lisResponce2[0].comm_type == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 403, message: 'Commission not set feature not active' })
            }

            // check if recahnge is done in last 5 min
            var lastRechangeCount = await sqlQuery.searchQuery(this.tableName1, {
                operator_id: lisResponce1[0].operator_id,
                amount: Number(data.amount),
                mobile_number: data.mobile,
                userid: data.userid,
                'NOT status': 3,
                timeDifferent: {
                    key: 'created_on',
                    value: strDate,
                    diff: process.env.RECHARGE_TIME_LIMIT
                }
            }, ['COUNT(1)'], 'userid', 'ASC', 1, 0)
            // console.log(lastRechangeCount[0])
            if (lastRechangeCount[0]["COUNT(1)"] != 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 409, message: `Same recharge is already done within ${process.env.RECHARGE_TIME_LIMIT} min` })
            }
            // update agent account so it cant do any transactions
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 1
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 0 }, searchKeyValue);
            var { affectedRows, changedRows, info } = objResponce;
            // fayaz uncomment this section 
            // generating proper message
            if (!affectedRows) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 409, message: 'earlier transation under process' })
            }
            if (!(affectedRows && changedRows)) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 409, message: 'Earlier transation under process' })
            }

            // start transaction
            var lisresponce = await sqlQuery.specialCMD('transaction')

            // // if prepaid then check for limit and deduct amount from limit
            //     if(lisResponce2[0].comm_type == 0) ({status : 400, message : 'Commission not set feature not active' })

            // check balance of the agent and minimum amount limit
            const lisResponce3 = await sqlQuery.searchQueryTran(this.tableName4, { user_uuid: data.user_uuid }, ["ex_wallet", "min_wallet"], 'userid', "ASC", 1, 0)
            // console.log(lisResponce3[0])
            if (lisResponce3.length == 0) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 402, message: 'user do not have enough balance to do recharge' })
            }
            if (lisResponce3[0].ex_wallet - Number(data.amount) < 0) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 402, message: 'user dont have enough balance to do recharge' })
            }

            // get the channel access details
            let channelList = ['Mobile', 'SMS', 'USSD', 'Web', 'Company']
            let channelType = channelList.includes(data.channelType) ? data.channelType : 'Web'
            // let channelLimit = await sqlQuery.searchQuery(this.tableName14,{userid : data.userid, channel : channelType},['threshold','status'],'userid','ASC',1,0) 
            let channelLimit = await this.#getUserChannel(data.user_uuid, channelType)
            if (channelLimit.length == 0) {
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 404, message: 'Channel limit not found' })
            }
            console.log(channelLimit)
            if (channelLimit[0].status != 1) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 403, message: `Your ${data.channelType} channel is In-Active.` })
            }

            if (Number(channelLimit[0].threshold) > Number(lisResponce3[0].ex_wallet) - Number(data.amount)) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 429, message: `Your ${data.channelType} channel Threshold limit reached.` })
            }

            if (lisResponce2[0].comm_type == '1') {
                let limitStatus = await sqlQuery.searchQueryTran(this.tableName13, { userid: data.userid }, ['op' + lisResponce1[0].operator_id + '_wallet_active AS limit_state', 'op' + lisResponce1[0].operator_id + '_wallet_limit as limit_value'], 'userid', 'ASC', 1, 0)
                if (limitStatus.length == 0) {
                    redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                    return ({ status: 404, message: 'Recharge limit not found' })
                }
                if (limitStatus[0].limit_state == 1) {
                    // check limit and update its
                    if (Number(limitStatus[0].limit_value) - Number(data.amount) >= 0) {
                        // update limit
                        let updateLimit = await sqlQuery.updateQuery(this.tableName13, {
                            deductBalance: {
                                key: 'op' + lisResponce1[0].operator_id + '_wallet_limit',
                                value: Number(data.amount)
                            }
                        }, { userid: data.userid })
                    } else {
                        var lisresponce = await sqlQuery.specialCMD('rollback')
                        var searchKeyValue = {
                            user_uuid: data.user_uuid, //str user_uuid
                            canTransfer: 0
                        }
                        // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                        var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                        redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                        return ({ status: 400, message: 'Recharge amount is more then Operator limit' })
                    }
                }
            }

            // add data in er recharge table
            param = {
                userid: data.userid,
                trans_number: strUniqueNumber,
                Operater_table_id: lisResponce1[0].operator_id,
                type_id: 1, // top up
                type_name: 'Top Up',
                operator_id: lisResponce1[0].operator_id,
                api_type: mno_id,
                operator_name: data.operatorName,
                mobile_number: data.mobile,
                amount: data.amount,
                deduct_amt: data.amount,
                source: channelType,
                group_topup_id: data.group_topup_id || 0,
                closing_balance: Number(lisResponce3[0].ex_wallet) - Number(data.amount),
                created_on: strDate, //date curren date time
                modified_on: strDate, //date curren date time
                os_details: '',
                status: 1,
                request_mobile_no: data.user_mobile,
                company_trans_id: data.company_transaction_id
            }

            //fire sql query
            var objResponce = await sqlQuery.createQuery(this.tableName1, param)

            // decuct the amount from the agent balance and update the transaction status
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 0,
            }
            var param = {
                deductBalance: {
                    key: "ex_wallet",
                    value: Number(data.amount),
                },
                // ex_wallet : Number(lisResponce3[0].ex_wallet) - Number(data.amount), // remaining amount
                // canTransfer: 1
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

            // get mno balance 
            // let mnoBalance = await sqlQuery.searchQuery(this.tableName20,{id : mno_id},['current_balance'],'id','desc',1,0)

            // deduct amount from system
            var keyValue = {
                deductBalance: {
                    key: "current_balance",
                    value: Number(data.amount)
                }
            }
            var objResponce = await sqlQuery.updateQuery(this.tableName20, keyValue, { id: mno_id })

            // rabbit mq message list
            let reqLis = [strUniqueNumber, data.operatorName, data.mobile, data.amount]

            console.log(queue_name, reqLis)
            sendMessage(queue_name, reqLis.join('|'), (err, result) => {
                if (err) console.error(err)
                // console.log(result)
            })

            // add record to mno details
            var param = {
                emoney_uuid: "uuid()",
                mno_uuid: balanceDe[0].mno_uuid, //str operator uuid
                mno_name: balanceDe[0].mno_name, //str operator name
                amount_added: Number(data.amount), //db amount added
                comm_amount: 0, //db commision amount
                opening_balance: balanceDe[0].current_balance, //db opening balance
                closing_balance: Number(balanceDe[0].current_balance) - Number(data.amount), //db closing balance
                emoney_txn_id: strUniqueNumber, //int transaction id
                emoney_txn_date: isodate, //dt transaction date
                created_by: data.userid, //str user id
                type: 2, // debit
                created_on: isodate, //dt current date time
                last_modified_by: data.userid, // str user id
                last_modified_on: isodate //dt current date time
            }

            //fire sql query to create er money 
            var objResponce = await sqlQuery.createQuery(this.tableName21, param)

            // add reciept data in er wallet transaction
            var param = {
                wallet_txn_uuid: "uuid()",
                userid: data.userid, // str userid
                user_uuid: data.user_uuid, // str userid
                trans_number: strUniqueNumber, // str unique number
                trans_date_time: strDate, // str date
                amount: Number(data.amount), // db amount
                trans_type: 2, // type debit
                narration: `Top-Up to ${data.mobile}`,
                balance_amount: Number(lisResponce3[0].ex_wallet) - Number(data.amount), //db balance amount
                trans_for: "Top-Up"
            }
            //fire sql query
            var objResponce = await sqlQuery.createQuery(this.tableName5, param)

            let messageQueue = {
                userId: data.userid,
                amount: Number(data.amount),
                dateTime: strDate
            }
            sendMessage('processedStockSend', JSON.stringify(messageQueue), (err, msg) => {
                if (err) console.log(err)
            })

            // add entry to log tables  
            let tableName, insertData
            // redisMaster.incr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
            switch (lisResponce1[0].operator_id) {
                case 3:
                    tableName = this.tableName17
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        source: channelType,
                        topupRequest: " ",
                        response: " "
                    }
                    break;
                case 2:
                    tableName = this.tableName16
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        source: channelType,
                        topupRequest: " ",
                        topupResponse: " "
                    }
                    break;
                case 4:
                    tableName = this.tableName18
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        login_request: " ",
                        login_response: " "
                    }
                    break;
                case 5:
                    tableName = this.tableName19
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        top_up_request: " ",
                        top_up_response: " "
                    }
                    break;
                case 1:
                    tableName = this.tableName15
                    insertData = {
                        userid: data.userid,
                        recharge_id: strUniqueNumber,
                        created_on: strDate,
                        status: 0,
                        request: " ",
                        response: " "
                    }
                    break;
            }

            if (!tableName || !insertData) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'Recharge log error' })
            }

            objResponce = await sqlQuery.createQuery(tableName, insertData)

            var logData = {
                userid: data.userid,
                user_uuid: data.user_uuid,
                username: data.username,
                full_name: data.full_name,
                mobile: data.user_mobile,
                intCreatedByType: data.userid,
                intUserType: data.userType,
                userIpAddress: data.userIpAddress,
                userMacAddress: data.userMacAddress, //str
                userOsDetails: data.userOsDetails, //str
                userImeiNumber: data.userImeiNumber, //str
                userGcmId: data.userGcmId, //str
                userAppVersion: data.userAppVersion, //str
                userApplicationType: data.userApplicationType,
                description: `Dear valuable partner ${data.full_name}, Your Recharge to ${data.mobile} Amount: ${parseFloat(String(data.amount)).toFixed(2)} AFN is Accepted, Bal:${Number(lisResponce3[0].ex_wallet) - Number(data.amount)} AFN TX:${strUniqueNumber} and Company TX:${data.company_transaction_id} Thank you for being an Afghan Pay partner!`,
                userActivityType: 25,
                oldValue: Number(lisResponce3[0].ex_wallet),
                newValue: Number(lisResponce3[0].ex_wallet) - Number(data.amount),
                regionId: data.region_id
            }

            // make api call
            let intResult = await httpRequestMakerCommon.httpPost("activity-log", logData)
            var strLog = intResult == 1 ? 'Admin change password log added successfully' : intResult == 2 ? 'Admin chain password log error' : 'end point not found'
            // console.log('Server Log : '+strLog)

            if (intResult != 1) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                var searchKeyValue = {
                    user_uuid: data.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
                return ({ status: 400, message: 'log error' })
            }

            // update transactions status
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 0
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);

            // no error commit the transactions
            var lisresponce = await sqlQuery.specialCMD('commit')
            // console.log("data",data);
            let responceMessage = `Dear valuable partner ${data.full_name}, Your Recharge to ${data.mobile} Amount: ${parseFloat(String(data.amount)).toFixed(2)} AFN is Accepted, Bal:${Number(lisResponce3[0].ex_wallet) - Number(data.amount)} AFN TX:${strUniqueNumber}  Thank you for being an Afghan Pay partner!`;

            return ({
                status: 200,
                rechargeTxnNumber: strUniqueNumber,
                companyRechargeTxnNumber: data.company_transaction_id,
                closingBalance: Number(lisResponce3[0].ex_wallet) - Number(data.amount),
                message: responceMessage
            })

        } catch (error) {
            console.log(error);
            var errMessage = error.message
            var lisresponce = await sqlQuery.specialCMD('rollback')  // roll back due to some error
            // update transactions status
            var searchKeyValue = {
                user_uuid: data.user_uuid, //str user_uuid
                canTransfer: 0
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            var objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);

            const lisResponce1 = await this.#getOperatorList(data.operator_uuid);
            redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)

            if (errMessage.includes("Duplicate entry")) {
                return ({ status: 400, message: 'Recharge request Failed with Error' })
            }
            return ({ status: 400, message: error.message })
        }
    }

    // pending recharge list
    getPendingRechargeList = async (req, res) => {
        try {
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/getPendingRechargeList',JSON.stringify(req.body), JSON.stringify(req.query))
            // limit offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // sql search param
            var searchKeyValue = {
                status: 1
            }
            var key = ["trans_number AS transNumber", "operator_name AS operatorName", "mobile_number AS number", "amount", "api_type", "CAST(created_on AS CHAR(20)) AS rechargeDate"]

            const lisResponce1 = await sqlQuery.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, key, "id", "ASC")
            if (lisResponce1.length == 0) return res.status(204).send({ message: 'no pending recharge found' })

            // get mno list
            // let mnoList = await sqlQuery.searchQueryNoConNolimit(this.tableName20,['mno_name'],'id','asc')

            // let finalResult = lisResponce1.map((result) => {
            //     let {api_type, ...other} = result
            //     if(api_type) other.apiType = mnoList[Number(api_type)-1].mno_name
            //     return other
            // })

            res.status(200).send({ count: lisResponce1.length, lisResponce1 });


        } catch (error) {
            console.error('getPendingRechargeList', error);
            res.status(200).send({ count: 0, lisResponce1: [{}] });
        }
    }


    // change the status of recharge
    acceptRecharge = async (req, res) => {
        this.#acceptRecharge(req, res, 1)
    }

    acceptRechargeNoResponse = async (req, res) => {
        this.#acceptRecharge(req, res, 0)
    }

    #acceptRecharge = async (req, res, sendSms) => {
        try {
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/acceptRecharge',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // update status to 
            let updateStatusResponce = await sqlQuery.updateQuery(this.tableName1, { status: 4 }, { trans_number: req.body.transNumber, status: 1 })
            if (!(updateStatusResponce.affectedRows && updateStatusResponce.changedRows)) return res.status(400).json({ errors: [{ msg: "Transaction Not Found" }] });

            // get recharge details
            var searchKeyValue = {
                trans_number: req.body.transNumber,
                // status : 4, 
            }
            var key = ['userid', 'amount', 'mobile_number', 'operator_id', "closing_balance", 'api_type', 'request_mobile_no', 'source', 'CAST(created_on as CHAR(16)) AS created_on']
            const lisResponce1 = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, 'userid', 'ASC', 1, 0)
            if (lisResponce1.length == 0) return res.status(400).json({ errors: [{ msg: "transaction not found" }] });

            // set recharge failed count 0
            failedRechargeCount[lisResponce1[0].api_type] = 0

            let updateResponce
            // console.log(lisResponce1[0].operator_id)
            // update responce in respective table
            redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
            switch (lisResponce1[0].operator_id) {
                case '1':
                    updateResponce = await this.updateSalamResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 1)
                    break;
                case '2':
                    updateResponce = await this.updateAwccResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 1)
                    break;
                case '3':
                    updateResponce = await this.updateMtnResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 1)
                    break;
                case '4':
                    updateResponce = await this.updateEtisalatResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 1)
                    break;
                case '5':
                    updateResponce = await this.updateRoshanResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 1)
                    break;
            }
            // console.log(updateResponce)

            // start transaction
            var lisresponce = await sqlQuery.specialCMD('transaction')

            // check commission type if post-paid then add to add to the queue of rabitMQ


            const lisResponce2 = await sqlQuery.searchQuery(this.tableName2, { userid: lisResponce1[0].userid, Active: 1 }, ["comm_type", "region_id", 'prefer_lang'], 'userid', 'ASC', 1, 0)
            if (lisResponce2.length == 0) {
                // rollback
                let rollback = await sqlQuery.specialCMD('rollback')
                // res
                return res.status(400).json({ errors: [{ msg: "agent details not found" }] });
            }

            // console.log('userDetails',lisResponce1)
            let distributeCommissionResponce = {
                agentCommissionAmount: 0,
                agnetCommissionPer: 0
            }

            // add to summery report
            let messageQueue = {
                userId: lisResponce1[0].userid,
                amount: lisResponce1[0].amount,
                comm: 0,
                operatorId: lisResponce1[0].operator_id,
                dateTime: lisResponce1[0].created_on
            }
            sendMessage('rechargeSuccessAddUserSummery', JSON.stringify(messageQueue), (err, msg) => {
                if (err) console.log(err)
            })
            messageQueue = {
                amount: lisResponce1[0].amount,
                operatorId: lisResponce1[0].operator_id,
                dateTime: lisResponce1[0].created_on
            }
            sendMessage('rechargeSuccessAddSystemSummery', JSON.stringify(messageQueue), (err, msg) => {
                if (err) console.log(err)
            })

            if (lisResponce2[0].comm_type == 2) {
                distributeCommissionResponce = await this.distributeCommission(lisResponce1, req.body.transNumber, lisResponce2[0].region_id)
                // console.log('distributeCommissionResponce',distributeCommissionResponce)
                if (distributeCommissionResponce.error) {
                    // rollback
                    let rollback = await sqlQuery.specialCMD('rollback')
                    // res
                    return res.status(400).json({ errors: [{ msg: distributeCommissionResponce.error }] });
                }
            }

            // update the recharge status in er recharge table
            // sql query param
            var param = {
                modified_on: isodate,
                comm_amt: distributeCommissionResponce.agentCommissionAmount,
                comm_per: distributeCommissionResponce.agnetCommissionPer,
                operator_transid: req.body.op_txn_id,
                operator_balance: req.body.mnoBalance || 0,
                ap_transid: req.body.ap_txn_id,
                // deductBalance : {
                //     key : 'deduct_amt',
                //     value : distributeCommissionResponce.agentCommissionAmount,
                // },
                concat: {
                    key: 'os_details',
                    value: " @@ " + req.body.rechargeResponce,
                },
                status: 2
            }

            // update the status
            const lisResponce3 = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

            await sqlQuery.specialCMD('commit')

            // get agent details
            let agentDetails = await sqlQuery.searchOrQuery(this.tableName2, { userid: lisResponce1[0].userid }, ['userid', 'CAST(user_uuid AS CHAR(16)) AS user_uuid', 'full_name', 'username', 'mobile', 'usertype_id', 'region_id'], 'userid', 'asc', 1, 0)

            // send sms to agent
            let smsDetails = {
                agentId: lisResponce1[0].userid,
                recieverMessage: `Dear ${agentDetails[0].full_name} ${agentDetails[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Success, Bal: ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`
            }

            switch (String(lisResponce2[0].prefer_lang)) {
                case '2': // Pashto
                    smsDetails.recieverMessage = `ښاغلی ${agentDetails[0].full_name}! شمېرې ${lisResponce1[0].mobile_number} ته  ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانۍ په بریالیتوب سره ولېږل شوې، ستاسو پاتی کریدیت ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} افغانی دی. مننه، افغان پی.`
                    break;
                case '3': // Dari 
                    smsDetails.recieverMessage = `محترم ${agentDetails[0].full_name}! به شماره ${lisResponce1[0].mobile_number} مبلغ ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانی موفقانه ارسال شد، کریدیت فعلی شما ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} افغانی است، افغان پی.`
                    break;
                case '1': // english
                default:
                    smsDetails.recieverMessage = `Dear ${agentDetails[0].full_name} ${agentDetails[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Success, Bal: ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`
                    break;
            }
            smsFunction.agentSms(smsDetails, lisResponce1[0].request_mobile_no).then((smsFunResponce) => {
                if (smsFunResponce.error) {
                    // console.log('send sms error for agent : ',agentDetails[0].username)
                } else {
                    // console.log('sms added')
                }
            })

            // send sms to customer
            smsDetails = {
                userId: lisResponce1[0].userid,
                username: agentDetails[0].username,
                mobile: lisResponce1[0].mobile_number,
                recieverMessage: `Your Mobile has been successfully Recharged with ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN by ${agentDetails[0].full_name}, TXN:${req.body.transNumber} Thank You (Afghan Pay)!`
            }
            switch (String(lisResponce2[0].prefer_lang)) {
                case '2': // Pashto
                    smsDetails.recieverMessage = `${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانۍ کریډیټ ستاسو شمېرې ته د ${agentDetails[0].full_name} لخوا په بریالۍ توګه زیاته شوه. مننه، افغان پی.`
                    break;
                case '3': // Dari
                    smsDetails.recieverMessage = `مبلغ ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانی کریدت به شماره شما توسط ${agentDetails[0].full_name} موفقانه اضافه گردید، تشکر، افغان پی.`
                    break;
                case '1': // english
                default:
                    smsDetails.recieverMessage = `Your Mobile has been successfully Recharged with ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN by ${agentDetails[0].full_name}, TXN:${req.body.transNumber} Thank You (Afghan Pay)!`
                    break;
            }

            smsFunction.directSMS(smsDetails, sendSms).then((smsFunResponce) => {
                if (smsFunResponce.error) {
                    console.log('send sms error for reciever : ', lisResponce1[0].mobile_number)
                } else {
                    // console.log('sms added')
                }
            })

            var logData = {
                userid: agentDetails[0].userid,
                user_uuid: agentDetails[0].user_uuid,
                username: agentDetails[0].username,
                full_name: agentDetails[0].full_name,
                mobile: agentDetails[0].mobile,
                intCreatedByType: agentDetails[0].userid,
                intUserType: agentDetails[0].usertype_id,
                userIpAddress: 'NA',
                userMacAddress: 'NA', //str
                userOsDetails: 'NA', //str
                userImeiNumber: 'NA', //str
                userGcmId: 'NA', //str
                userAppVersion: 'NA', //str
                userApplicationType: lisResponce1[0].source == 'Web' ? 1 : (lisResponce1[0].source == 'Mobile' ? 2 : (lisResponce1[0].source == 'USSD' ? 3 : 4)),
                description: `Dear ${agentDetails[0].full_name} ${agentDetails[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Success, Bal: ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`,
                userActivityType: 25,
                oldValue: `Recharge Accepted ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)}`,
                newValue: `Closing Balance ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)}`,
                regionId: agentDetails[0].region_id
            }

            // make api call
            let intResult = await httpRequestMakerCommon.httpPost("activity-log", logData)

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = lisResponce3;
            const message = !affectedRows ? 'transaction number not found' :
                affectedRows && changedRows ? 'transaction status updated successfully' : 'Details Updated';

            // add amount in monthly recharge report
            // this.addRechargeAmount(lisResponce1[0].userid, lisResponce1[0].amount, lisResponce1[0].operator_id)
            // send responce to fornt end
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    resendConformationSms = async (req, res) => {
        try {

            // get recharge details
            var searchKeyValue = {
                trans_number: req.body.transNumber
            }
            var key = ['userid', 'amount', 'mobile_number', 'operator_id', "closing_balance", 'api_type', 'request_mobile_no', 'source']
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, 'userid', 'ASC', 1, 0)
            if (lisResponce1.length == 0) return res.status(400).json({ errors: [{ msg: "transaction not found" }] });

            // get agent details
            let agentDetails = await sqlQueryReplica.searchOrQuery(this.tableName2, { userid: lisResponce1[0].userid }, ['userid', 'CAST(user_uuid AS CHAR(16)) AS user_uuid', 'full_name', 'username', 'mobile', 'usertype_id', 'region_id', 'prefer_lang'], 'userid', 'asc', 1, 0)

            // send sms to agent
            let smsDetails = {
                agentId: lisResponce1[0].userid,
                recieverMessage: `Dear ${agentDetails[0].full_name} ${agentDetails[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Success, Bal: ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`
            }

            switch (String(agentDetails[0].prefer_lang)) {
                case '2': // Pashto
                    smsDetails.recieverMessage = `ښاغلی ${agentDetails[0].full_name}! شمېرې ${lisResponce1[0].mobile_number} ته  ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانۍ په بریالیتوب سره ولېږل شوې، ستاسو پاتی کریدیت ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} افغانی دی. مننه، افغان پی.`
                    break;
                case '3': // Dari 
                    smsDetails.recieverMessage = `محترم ${agentDetails[0].full_name}! به شماره ${lisResponce1[0].mobile_number} مبلغ ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانی موفقانه ارسال شد، کریدیت فعلی شما ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} افغانی است، افغان پی.`
                    break;
                case '1': // english
                default:
                    smsDetails.recieverMessage = `Dear ${agentDetails[0].full_name} ${agentDetails[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Success, Bal: ${parseFloat(String(lisResponce1[0].closing_balance)).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`
                    break;
            }
            smsFunction.agentSms(smsDetails, lisResponce1[0].request_mobile_no).then((smsFunResponce) => {
                if (smsFunResponce.error) {
                    res.send({ message: 'message send failed' });
                } else {
                    res.send({ message: 'message send successfully' });
                }
            })

        } catch (error) {
            console.log(error);
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    addRechargeAmount = async (userId, amount, operatorId) => {

        var date = new Date();
        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
        var isodate = date.toISOString().slice(0, 11);

        let key = {
            addBalance: {
                key: `oper_${operatorId}`,
                value: Number(amount)
            },
            addBalance1: {
                key: `oper_Ind_${operatorId}`,
                value: Number(amount)
            },
            addBalance2: {
                key: `oper_cou_${operatorId}`,
                value: 1
            }
        }
        let getCommissionPercentage = await sqlQuery.updateQuery(this.tableName22, key, { userid: userId, 'CAST(date AS DATE)': isodate })

        if (getCommissionPercentage.affectedRows == 0) {
            let insertDetails = {
                userid: userId,
                date: isodate,
            }
            insertDetails[`oper_${operatorId}`] = Number(amount)
            insertDetails[`oper_Ind_${operatorId}`] = Number(amount)
            insertDetails[`oper_cou_${operatorId}`] = 1
            await sqlQuery.createQuery(this.tableName22, insertDetails)
        }

        let getParentId = await sqlQuery.searchQuery(this.tableName2, { userid: userId }, ['parent_id'], 'userid', 'ASC', 1, 0)

        if (getParentId[0].parent_id != 1) {
            this.addRechargeAmountUpline(getParentId[0].parent_id, amount, operatorId)
        }
    }

    addRechargeAmountUpline = async (userId, amount, operatorId) => {

        var date = new Date();
        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
        var isodate = date.toISOString().slice(0, 11);

        let key = {
            addBalance: {
                key: `oper_${operatorId}`,
                value: Number(amount)
            },
            addBalance1: {
                key: `oper_cou_${operatorId}`,
                value: 1
            }
        }
        let getCommissionPercentage = await sqlQuery.updateQuery(this.tableName22, key, { userid: userId, 'CAST(date AS DATE)': isodate })
        if (getCommissionPercentage.affectedRows == 0) {
            let insertDetails = {
                userid: userId,
                date: isodate,
            }
            insertDetails[`oper_${operatorId}`] = Number(amount)
            insertDetails[`oper_cou_${operatorId}`] = 1
            await sqlQuery.createQuery(this.tableName22, insertDetails)
        }

        let getParentId = await sqlQuery.searchQuery(this.tableName2, { userid: userId }, ['parent_id'], 'userid', 'ASC', 1, 0)
        if (getParentId[0].parent_id != 1) {
            this.addRechargeAmountUpline(getParentId[0].parent_id, amount, operatorId)
        }
    }

    distributeCommission = async (lisResponce1, strUniqueNumber, regionId) => {
        try {

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // console.log("commission distribution",lisResponce1)
            let userid = lisResponce1[0].userid, commission = 0, givenCommissionPer = 0, commissionAmount = 0, amount = Number(lisResponce1[0].amount), operatorId = lisResponce1[0].operator_id
            let searchKeyValue, key, lisResponce3, objResponce, lisResponce4, dtCurrentDate, strDate, param, rollback, agentCommissionAmount = 0, agnetCommissionPer = 0, state = 0, rechargeCommission = 0, rechargeAmount = 0

            // rabitMQ worker functions
            while (true) {
                // get the user id, its commission, parent id
                searchKeyValue = {
                    userid: userid
                }
                key = ["CAST(user_uuid as CHAR(16)) AS user_uuid", "parent_id", "op" + operatorId + "_comm AS commissionPer"]
                lisResponce3 = await sqlQuery.searchQuery(this.tableName8, searchKeyValue, key, 'userid', 'ASC', 1, 0)
                // console.log(lisResponce3.length)
                if (lisResponce3.length == 0) return ({ error: 'commission not found' })

                givenCommissionPer = Number(lisResponce3[0].commissionPer) - commission > 0 ? Number(lisResponce3[0].commissionPer) - commission : 0
                commissionAmount = (givenCommissionPer) * amount / 100
                commission = lisResponce3[0].commissionPer
                agnetCommissionPer = agnetCommissionPer == 0 ? Number(lisResponce3[0].commissionPer) : agnetCommissionPer
                agentCommissionAmount = agentCommissionAmount == 0 ? commissionAmount : agentCommissionAmount

                if (state == 0) {
                    rechargeAmount = agentCommissionAmount
                    rechargeCommission = agnetCommissionPer
                    state = 1
                }

                // add commission with pending state in commission table
                // add data in commissiontable table
                let commissionDetails = {
                    userid: userid,
                    parent_id: lisResponce3[0].parent_id,
                    recharge_id: strUniqueNumber,
                    operator_id: operatorId,
                    recharge_amount: amount,
                    commission_amount: commissionAmount,
                    comm_per: givenCommissionPer,
                    created_on: isodate, //dt current
                    status: 1,
                    total_commission: commissionAmount,
                    distribute_commission: commissionAmount,
                    region_id: regionId
                }

                let commissionResponce = await sqlQuery.createQuery(this.tableName9, commissionDetails)

                let messageQueue = {
                    user_uuid: lisResponce3[0].user_uuid, //str
                    commissionAmount: commissionAmount, // str
                    parent_id: lisResponce3[0].parent_id,
                    strUniqueNumber: strUniqueNumber,
                    userid: userid,
                    date: date,
                    dtCurrentDate: date, // dt current date time
                    strDate: date.toISOString().slice(0, 19).replace('T', ' '),
                }

                sendMessage('giveCommissionToAgent', JSON.stringify(messageQueue), (err, msg) => {
                    if (err) console.log(err)
                })

                messageQueue = {
                    userId: userid,
                    amount: 0,
                    comm: commissionAmount,
                    operatorId: lisResponce1[0].operator_id,
                    dateTime: lisResponce1[0].created_on
                }
                sendMessage('rechargeSuccessAddUserSummery', JSON.stringify(messageQueue), (err, msg) => {
                    if (err) console.log(err)
                })

                // // change transaction status
                //     // update agent account so it cant do any transactions
                //     searchKeyValue = {
                //         user_uuid: lisResponce3[0].user_uuid, //str user_uuid
                //         canTransfer: 1
                //     }
                //     // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                //     objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 0}, searchKeyValue);

                //     let { affectedRows, changedRows, info } = objResponce;
                //     // generating proper message
                //     if (!affectedRows) console.log("user_uuid account not created "+lisResponce3[0].user_uuid + ' add commission '+ commissionAmount)
                //     if (!(affectedRows && changedRows)) console.log("user "+lisResponce3[0].user_uuid +" commission "+commissionAmount+" cant be added as erlier transaction under process")
                //     else{
                //         // start txn
                //             var lisresponce = await sqlQuery.specialCMD('transaction')
                //         // get wallet balance
                //             lisResponce4 = await sqlQuery.searchQueryTran(this.tableName4,{user_uuid: lisResponce3[0].user_uuid},['ex_wallet','comm_wallet'],'userid','ASC',1,0)

                //         // update wallet balance with commission and transaction status
                //             searchKeyValue = {
                //                 user_uuid: lisResponce3[0].user_uuid, //str user_uuid
                //                 canTransfer: 0
                //             }
                //             param = {
                //                 canTransfer: 1,
                //                 ex_wallet : Number(lisResponce4[0].ex_wallet) + Number(commissionAmount),
                //                 comm_wallet : Number(lisResponce4[0].comm_wallet) + Number(commissionAmount),
                //             }
                //             // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                //             objResponce = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

                //         //transation variables
                //             dtCurrentDate = date // dt current date time
                //             strDate = dtCurrentDate.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
                //             // strUniqueNumber = dataBaseId(dtCurrentDate) //str unique number

                //         // add details wallet transaction 
                //             param = {
                //                 wallet_txn_uuid: "uuid()",
                //                 userid: userid, // str userid
                //                 user_uuid: lisResponce3[0].user_uuid, // str userid
                //                 trans_number: strUniqueNumber, // str unique number
                //                 trans_date_time: strDate, // str date
                //                 amount: Number(commissionAmount), // db amount
                //                 trans_type: 1, // type credit
                //                 narration:  "Top-Up commission",
                //                 balance_amount: Number(lisResponce4[0].ex_wallet) + Number(commissionAmount), //db balance amount
                //                 trans_for: "Top-Up commission"
                //             }
                //             //fire sql query
                //             objResponce = await sqlQuery.createQuery(this.tableName5, param)

                //         // update commission state
                //             param = {
                //                 userid : userid,
                //                 parent_id : lisResponce3[0].parent_id,
                //                 recharge_id : strUniqueNumber,
                //             }

                //             objResponce = await sqlQuery.updateQuery(this.tableName9, {status : 2}, {userid : userid,recharge_id : strUniqueNumber});

                //             if (!(objResponce.affectedRows && objResponce.changedRows)) {
                //                 // update agent account so it cant do any transactions
                //                     searchKeyValue = {
                //                         user_uuid: lisResponce3[0].user_uuid, //str user_uuid
                //                         canTransfer: 0
                //                     }
                //                 // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                //                     objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);

                //                     await sqlQuery.specialCMD('rollback')
                //             }
                //             else  await sqlQuery.specialCMD('commit')
                //     } 

                // if userid is 1 and parent id is 0 break the loop else change userid to parent userid
                if (userid == 1 && lisResponce3[0].parent_id == 0) {
                    break
                } else {
                    userid = lisResponce3[0].parent_id
                }

            }
            return ({ message: "commission distributed", agentCommissionAmount: rechargeAmount, agnetCommissionPer: rechargeCommission })

        } catch (error) {
            return ({ error: error.message })
        }
    }

    giveCommissionToAgent = async (userDetailsString) => {
        try {
            let userDetails = JSON.parse(userDetailsString)

            // update agent account so it cant do any transactions
            let searchKeyValue = {
                user_uuid: userDetails.user_uuid, //str user_uuid
                canTransfer: 1
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            let objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 0 }, searchKeyValue);
            // console.log(objResponce)
            let { affectedRows, changedRows, info } = objResponce;
            // generating proper message
            // if (!affectedRows) console.log("user_uuid account not created "+userDetails.user_uuid + ' add commission '+ userDetails.commissionAmount)
            if (!(affectedRows && changedRows)) {
                // pusha again to rabbit mq 
                sendMessage('giveCommissionToAgent', userDetailsString, (err, msg) => {
                    if (err) console.log(err)
                })
            }
            else {
                // start txn
                var lisresponce = await sqlQuery.specialCMD('transaction')
                // get wallet balance
                let lisResponce4 = await sqlQuery.searchQueryTran(this.tableName4, { user_uuid: userDetails.user_uuid }, ['ex_wallet', 'comm_wallet'], 'userid', 'ASC', 1, 0)

                // update wallet balance with commission and transaction status
                searchKeyValue = {
                    user_uuid: userDetails.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                let param = {
                    canTransfer: 1,
                    addBalance: {
                        key: "ex_wallet",
                        value: Number(userDetails.commissionAmount)
                    },
                    addBalance1: {
                        key: "comm_wallet",
                        value: Number(userDetails.commissionAmount)
                    }
                    // ex_wallet : Number(lisResponce4[0].ex_wallet) + ,
                    // comm_wallet : Number(lisResponce4[0].comm_wallet) + ,
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                objResponce = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

                //transation variables
                // let dtCurrentDate = userDetails.date // dt current date time
                // let strDate = dtCurrentDate.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
                // strUniqueNumber = dataBaseId(dtCurrentDate) //str unique number

                // add details wallet transaction 
                param = {
                    wallet_txn_uuid: "uuid()",
                    userid: userDetails.userid, // str userid
                    user_uuid: userDetails.user_uuid, // str userid
                    trans_number: userDetails.strUniqueNumber, // str unique number
                    trans_date_time: userDetails.strDate, // str date
                    amount: Number(userDetails.commissionAmount), // db amount
                    trans_type: 1, // type credit
                    narration: "Top-Up commission",
                    balance_amount: Number(lisResponce4[0].ex_wallet) + Number(userDetails.commissionAmount), //db balance amount
                    trans_for: "Top-Up commission"
                }
                //fire sql query
                objResponce = await sqlQuery.createQuery(this.tableName5, param)

                let messageQueue = {
                    userId: userDetails.userid,
                    amount: Number(userDetails.commissionAmount),
                    dateTime: userDetails.strDate
                }
                sendMessage('processedStockReceived', JSON.stringify(messageQueue), (err, msg) => {
                    if (err) console.log(err)
                })

                // update commission state
                param = {
                    userid: userDetails.userid,
                    parent_id: userDetails.parent_id,
                    recharge_id: userDetails.strUniqueNumber,
                }

                objResponce = await sqlQuery.updateQuery(this.tableName9, { status: 2 }, { userid: userDetails.userid, recharge_id: userDetails.strUniqueNumber });

                if (!(objResponce.affectedRows && objResponce.changedRows)) {
                    // update agent account so it cant do any transactions
                    //     searchKeyValue = {
                    //         user_uuid: userDetails.user_uuid, //str user_uuid
                    //         canTransfer: 0
                    //     }
                    // // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                    //     objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);

                    await sqlQuery.specialCMD('rollback')
                }
                else await sqlQuery.specialCMD('commit')
            }

        } catch (error) {
            console.log(error);
        }
    }

    updateSalamResponce = async (id, request, responce, status) => {
        try {
            let keyValue = {
                concat: {
                    key: 'request',
                    value: " " + request,
                },
                concat1: {
                    key: 'response',
                    value: " " + responce,
                },
                status: status
            }

            let updateResponce = await sqlQuery.updateQuery(this.tableName15, keyValue, { recharge_id: id })

            var { affectedRows, changedRows, info } = updateResponce;
            const message = !affectedRows ? 'Update Successfull' :
                affectedRows && changedRows ? 'Update Successfull' : 'Recharge Id not found';

            return ({ message: message })

        } catch (error) {
            console.log(error);
            return { error: error.message }
        }
    }

    updateAwccResponce = async (id, request, responce, status) => {
        try {
            let keyValue = {
                concat: {
                    key: 'topupRequest',
                    value: " " + request,
                },
                concat1: {
                    key: 'topupResponse',
                    value: " " + responce,
                },
                status: status
            }

            let updateResponce = await sqlQuery.updateQuery(this.tableName16, keyValue, { recharge_id: id })

            var { affectedRows, changedRows, info } = updateResponce;
            const message = !affectedRows ? 'Update Successfull' :
                affectedRows && changedRows ? 'Update Successfull' : 'Recharge Id not found';

            return ({ message: message })

        } catch (error) {
            console.log(error);
            return { error: error.message }
        }
    }

    updateMtnResponce = async (id, request, responce, status) => {
        try {
            let keyValue = {
                concat: {
                    key: 'topupRequest',
                    value: " " + request,
                },
                concat1: {
                    key: 'response',
                    value: " " + responce,
                },
                status: status
            }

            let updateResponce = await sqlQuery.updateQuery(this.tableName17, keyValue, { recharge_id: id })

            var { affectedRows, changedRows, info } = updateResponce;
            const message = !affectedRows ? 'Update Successfull' :
                affectedRows && changedRows ? 'Update Successfull' : 'Recharge Id not found';

            return ({ message: message })

        } catch (error) {
            console.log(error);
            return { error: error.message }
        }
    }

    updateEtisalatResponce = async (id, request, responce, status) => {
        try {
            let keyValue = {
                concat: {
                    key: 'Transaction_Request',
                    value: " " + request,
                },
                concat1: {
                    key: 'Transaction_Response',
                    value: " " + responce,
                },
                status: status
            }

            let updateResponce = await sqlQuery.updateQuery(this.tableName18, keyValue, { recharge_id: id })

            var { affectedRows, changedRows, info } = updateResponce;
            const message = !affectedRows ? 'Update Successfull' :
                affectedRows && changedRows ? 'Update Successfull' : 'Recharge Id not found';

            return ({ message: message })

        } catch (error) {
            console.log(error);
            return { error: error.message }
        }
    }

    updateRoshanResponce = async (id, request, responce, status) => {
        try {
            let keyValue = {
                concat: {
                    key: 'top_up_request',
                    value: " @@ " + request,
                },
                concat1: {
                    key: 'top_up_response',
                    value: " @@ " + responce,
                },
                status: status
            }
            // console.log(keyValue)
            let updateResponce = await sqlQuery.updateQuery(this.tableName19, keyValue, { recharge_id: id })
            // console.log(updateResponce)
            var { affectedRows, changedRows, info } = updateResponce;
            const message = !affectedRows ? 'Update Successfull' :
                affectedRows && changedRows ? 'Update Successfull' : 'Recharge Id not found';

            return ({ message: message })

        } catch (error) {
            console.log(error);
            return { error: error.message }
        }
    }

    rejectRecharge = async (req, res) => {
        try {
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/rejectRecharge',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get recharge details
            var searchKeyValue = {
                trans_number: req.body.transNumber,
                status: 1,
            }
            var key = ['userid', 'mobile_number', 'amount', 'operator_id', "closing_balance", "api_type", 'request_mobile_no', 'source']
            const lisResponce1 = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, 'userid', 'ASC', 1, 0)
            if (lisResponce1.length == 0) return res.status(400).json({ errors: [{ msg: "transaction not found" }] });
            req.body.reciever_id = lisResponce1[0].userid
            // check failedCount
            this.failedCountCheck(lisResponce1[0].api_type)

            let updateResponce
            // update responce in respective table
            redisMaster.decr(`PENDING_RECHARGE_${lisResponce1[0].operator_id}`)
            switch (lisResponce1[0].operator_id) {
                case '1':
                    updateResponce = await this.updateSalamResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 2)
                    break;
                case '2':
                    updateResponce = await this.updateAwccResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 2)
                    break;
                case '3':
                    updateResponce = await this.updateMtnResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 2)
                    break;
                case '4':
                    updateResponce = await this.updateEtisalatResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 2)
                    break;
                case '5':
                    updateResponce = await this.updateRoshanResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 2)
                    break;
            }

            let messageQueue = {
                userid: lisResponce1[0].userid,
                amount: lisResponce1[0].amount,
                strDate: date.toISOString().slice(0, 19).replace('T', ' '),
                dtCurrentDate: date,
                transNumber: req.body.transNumber,
                mobileNumber: lisResponce1[0].mobile_number
            }

            sendMessage('refundFailedRechargeBalance', JSON.stringify(messageQueue), (err, msg) => {
                console.log(err, msg);
                if (err) console.log(err)
            })

            // get system balance
            // let balanceDe = await sqlQuery.searchQuery(this.tableName20,{id : lisResponce1[0].api_type},['current_balance'],'id','desc',1,0)
            // if( balanceDe.length == 0 ) return res.status(400).json({ errors: [ {msg : "System balance not found"}] });

            // // refund agent balance

            //     // update the transaction status to 0
            //         searchKeyValue = {
            //             userid: lisResponce1[0].userid, //str user_uuid
            //             canTransfer: 1
            //         }   
            //         let objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 0}, searchKeyValue);

            //         var { affectedRows, changedRows, info } = objResponce;

            //     // generating proper message
            //         if (!affectedRows) return res.status(400).json({ errors: [ {msg : "User transaction under process"}] });
            //         if (!(affectedRows && changedRows)) return res.status(400).json({ errors: [ {msg : "User transaction under process"}] });

            //     // start transaction
            //         var lisresponce = await sqlQuery.specialCMD('transaction')

            //     // get agent balance    
            //         const lisResponce3 = await sqlQuery.searchQueryTran(this.tableName4,{userid: lisResponce1[0].userid},['user_uuid','ex_wallet'],"userid","ASC",1,0)
            //         if(lisResponce1.length == 0){
            //             // rollback
            //             let rollback = await sqlQuery.specialCMD('rollback')
            //             return res.status(400).json({ errors: [ {msg : "User wallet detailsn not found"}] });
            //         }
            //         req.body.reciever_id = lisResponce1[0].userid

            //     // update wallet balance with commission and transaction status
            //         searchKeyValue = {
            //             canTransfer: 0,
            //             userid: lisResponce1[0].userid, //str user_uuid
            //         }
            //         let param = {
            //             ex_wallet : Number(lisResponce3[0].ex_wallet) + Number(lisResponce1[0].amount)
            //         }
            //         // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            //         objResponce = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);
            //         var { affectedRows, changedRows, info } = objResponce;

            //         if(!(affectedRows && changedRows)){
            //             var lisresponce = await sqlQuery.specialCMD('rollback')
            //             var searchKeyValue = {
            //                 userid: req.body.reciever_id, //str user_uuid
            //                 canTransfer: 0
            //             }
            //             // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            //             objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);
            //             return res.status(400).json({ errors: [ {msg : "Amount not reversed"}] });
            //         }

            //     //transation variables
            //         let dtCurrentDate = date // dt current date time
            //         let strDate = dtCurrentDate.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
            //         let strUniqueNumber = dataBaseId(dtCurrentDate) //str unique number

            //     // add details wallet transaction 
            //         param = {
            //             wallet_txn_uuid: "uuid()",
            //             userid: lisResponce1[0].userid, // str userid
            //             user_uuid: lisResponce3[0].user_uuid, // str userid
            //             trans_number: req.body.transNumber, // str unique number
            //             trans_date_time: strDate, // str date
            //             amount: Number(lisResponce1[0].amount), // db amount
            //             trans_type: 1, // type credit
            //             narration: req.body.narration || "Top-Up refund",
            //             balance_amount: Number(lisResponce3[0].ex_wallet) + Number(lisResponce1[0].amount), //db balance amount
            //             trans_for: req.body.transFor || "Top-Up refund"
            //         }
            //         //fire sql query
            //         objResponce = await sqlQuery.createQuery(this.tableName5, param)

            // sql query param
            searchKeyValue = {
                trans_number: req.body.transNumber,
                status: 1,
            }
            let param = {
                modified_on: isodate,
                deduct_amt: 0,
                operator_balance: req.body.mnoBalance || 0,
                closing_balance: Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount),
                concat: {
                    key: 'os_details',
                    value: " @@ " + req.body.rechargeResponce,
                },
                status: 3
            }

            // update the status
            const lisResponce2 = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

            // check if the result is there and responce accordingly
            var { affectedRows, changedRows, info } = lisResponce2;
            const message = !affectedRows ? 'transaction number not found' :
                affectedRows && changedRows ? 'transaction status updated successfully' : 'Details Updated';

            if (!(affectedRows && changedRows)) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                // var searchKeyValue = {
                //     userid: lisResponce1[0].userid, //str user_uuid
                //     canTransfer: 0
                // }
                // // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                // objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);
                return res.send({ message, info });
            }

            // get mno balance 
            let balanceDe = await sqlQuery.searchQuery(this.tableName20, { id: lisResponce1[0].api_type, status: 1 }, ['current_balance', 'CAST(mno_uuid AS CHAR(16)) AS mno_uuid', 'mno_name'], 'id', 'desc', 1, 0)

            // add amount to the system
            var keyValue = {
                addBalance: {
                    key: "current_balance",
                    value: Number(lisResponce1[0].amount)
                }
            }
            let objResponce = await sqlQuery.updateQuery(this.tableName20, keyValue, { id: lisResponce1[0].api_type })
            var { affectedRows, changedRows, info } = objResponce;
            if (!(affectedRows && changedRows)) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                // var searchKeyValue = {
                //     userid: lisResponce1[0].userid, //str user_uuid
                //     canTransfer: 0
                // }
                // // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                // objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);
                return res.send({ message, info });
            }

            // add record to mno details
            param = {
                emoney_uuid: "uuid()",
                mno_uuid: balanceDe[0].mno_uuid, //str operator uuid
                mno_name: balanceDe[0].mno_name, //str operator name
                amount_added: Number(lisResponce1[0].amount), //db amount added
                comm_amount: 0, //db commision amount
                opening_balance: balanceDe[0].current_balance, //db opening balance
                closing_balance: Number(balanceDe[0].current_balance) + Number(lisResponce1[0].amount), //db closing balance
                emoney_txn_id: req.body.transNumber, //int transaction id
                emoney_txn_date: isodate, //dt transaction date
                created_by: lisResponce1[0].userid, //str user id
                type: 2, // system credit
                created_on: isodate, //dt current date time
                last_modified_by: lisResponce1[0].userid, // str user id
                last_modified_on: isodate //dt current date time
            }

            //fire sql query to create er money 
            objResponce = await sqlQuery.createQuery(this.tableName21, param)

            // no error commit the transactions
            var lisresponce = await sqlQuery.specialCMD('commit')

            // update can transfer status    
            // searchKeyValue = {
            //     userid: lisResponce1[0].userid, //str user_uuid
            //     canTransfer: 0
            // }   
            // objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);

            // get agent name    
            const agentName = await sqlQuery.searchQuery(this.tableName2, { userid: lisResponce1[0].userid }, ['userid', 'CAST(user_uuid AS CHAR(16)) AS user_uuid', "username", "full_name", 'prefer_lang', 'mobile', 'usertype_id', 'region_id'], "userid", "ASC", 1, 0)

            // semd sms
            let smsDetails = {
                agentId: lisResponce1[0].userid,
                recieverMessage: `Dear ${agentName[0].full_name} ${agentName[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Failed, Bal: ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`
            }
            switch (String(agentName[0].prefer_lang)) {
                case '2': // Pashto
                    smsDetails.recieverMessage = `ښاغلی ${agentName[0].full_name}! شمېرې ${lisResponce1[0].mobile_number} ته ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانیو په اندازه د کریډیټ لیږل ناکام شول، ستاسو اوسنی کریډیټ ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} افغانی دی. مننه افغان پی.`
                    break;
                case '3': // Dari
                    smsDetails.recieverMessage = `محترم ${agentName[0].full_name}! ارسال کریدت به شماره ${lisResponce1[0].mobile_number} مبلغ ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانی ناکام گردید، کریدیت فعلی شما ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} افغانی است. تشکر،افغان پی.`
                    break;
                case '1': // english
                default:
                    smsDetails.recieverMessage = `Dear ${agentName[0].full_name} ${agentName[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Failed, Bal: ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`
                    break;
            }
            // console.log(smsDetails)
            smsFunction.agentSms(smsDetails, lisResponce1[0].request_mobile_no).then((smsFunResponce) => {
                if (smsFunResponce.error) {
                    // console.log('send sms error for agent : ',agentName[0].username)
                } else {
                    // console.log('sms added')
                }
            })

            // add failed recharge log in system
            var logData = {
                userid: agentName[0].userid,
                user_uuid: agentName[0].user_uuid,
                username: agentName[0].username,
                full_name: agentName[0].full_name,
                mobile: agentName[0].mobile,
                intCreatedByType: agentName[0].userid,
                intUserType: agentName[0].usertype_id,
                userIpAddress: 'NA',
                userMacAddress: 'NA', //str
                userOsDetails: 'NA', //str
                userImeiNumber: 'NA', //str
                userGcmId: 'NA', //str
                userAppVersion: 'NA', //str
                userApplicationType: lisResponce1[0].source == 'Web' ? 1 : (lisResponce1[0].source == 'Mobile' ? 2 : (lisResponce1[0].source == 'USSD' ? 3 : 4)),
                description: `Dear ${agentName[0].full_name} ${agentName[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Failed, Bal: ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`,
                userActivityType: 25,
                oldValue: `Recharge Rejected ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)}`,
                newValue: `Closing Balance ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)}`,
                regionId: agentName[0].region_id
            }

            // make api call
            let intResult = await httpRequestMakerCommon.httpPost("activity-log", logData)

            // send responce to fornt end
            return res.send({ message, info });

        } catch (error) {
            console.log(error);
            var lisresponce = await sqlQuery.specialCMD('rollback')  // roll back due to some error
            // if(req.body.reciever_id){
            //     // update transactions status
            //     var searchKeyValue = {
            //         userid: req.body.reciever_id, //str user_uuid
            //         canTransfer: 0
            //     }
            //     // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            //     var objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);
            // }
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    getMnoResponse = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let searchKeyValue = {
                trans_number: req.body.transNumber,
            };

            var key = ['mobile_number as mobile', 'amount as rech_amt', 'status', 'operator_name as operator', 'CAST(created_on AS CHAR(20)) as recharge_date', 'CAST(modified_on AS CHAR(20)) as update_on', 'rollback_status as rollback', 'CAST(rollback_confirm_on AS CHAR(20)) as rollback_date', 'os_details as mno_response']

            const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, 'userid', 'ASC', 1, 0)
            if (lisResponce.length == 0) return res.status(400).json({ errors: [{ msg: "transaction not found" }] });

            return res.send(lisResponce[0]);

        } catch (error) {
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    successToFailedRecharge = async (req, res) => {
        try {
            // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('recharge/successToFailedRecharge', JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get recharge details
            var searchKeyValue = {
                trans_number: req.body.transNumber,
                status: 2,
            }
            var key = ['userid', 'mobile_number', 'amount', 'operator_id', "closing_balance", "api_type", 'request_mobile_no', 'source', 'CAST(created_on AS CHAR(16)) AS created_on']
            const lisResponce1 = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, 'userid', 'ASC', 1, 0)
            if (lisResponce1.length == 0) return res.status(400).json({ errors: [{ msg: "transaction not found" }] });
            req.body.reciever_id = lisResponce1[0].userid

            let messageQueue = {
                userid: lisResponce1[0].userid,
                amount: lisResponce1[0].amount,
                strDate: date.toISOString().slice(0, 19).replace('T', ' '),
                dtCurrentDate: date,
                transNumber: req.body.transNumber,
                mobileNumber: lisResponce1[0].mobile_number,
                narration: `Top up refund after success for ${lisResponce1[0].mobile_number}`
            }

            sendMessage('refundFailedRechargeBalance', JSON.stringify(messageQueue), (err, msg) => {
                console.log(err, msg);
                if (err) console.log(err)
            })

            messageQueue = {
                userId: lisResponce1[0].userid,
                amount: lisResponce1[0].amount,
                comm: 0,
                operatorId: lisResponce1[0].operator_id,
                dateTime: lisResponce1[0].created_on
            }
            sendMessage('rechargeFailedDeductUserSummery', JSON.stringify(messageQueue), (err, msg) => {
                if (err) console.log(err)
            })
            messageQueue = {
                amount: lisResponce1[0].amount,
                operatorId: lisResponce1[0].operator_id,
                dateTime: lisResponce1[0].created_on
            }
            sendMessage('rechargeFailedDeductSystemSummery', JSON.stringify(messageQueue), (err, msg) => {
                if (err) console.log(err)
            })

            // sql query param
            searchKeyValue = {
                trans_number: req.body.transNumber,
                IsIn: {
                    key: "rollback_status",
                    value: "0,4"
                },
                status: 2,
            }
            let param = {
                modified_on: isodate,
                deduct_amt: 0,
                comm_amt: 0,
                operator_balance: req.body.mnoBalance || 0,
                closing_balance: Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount),
                status: 3
            }

            // update the status
            const lisResponce2 = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

            // check if the result is there and responce accordingly
            var { affectedRows, changedRows, info } = lisResponce2;
            const message = !affectedRows ? 'transaction number not found' :
                affectedRows && changedRows ? 'transaction status updated successfully' : 'Details Updated';

            if (!(affectedRows && changedRows)) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                // var searchKeyValue = {
                //     userid: lisResponce1[0].userid, //str user_uuid
                //     canTransfer: 0
                // }
                // // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                // objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);
                return res.send({ message, info });
            }

            // get mno balance 
            let balanceDe = await sqlQuery.searchQuery(this.tableName20, { id: lisResponce1[0].api_type, status: 1 }, ['current_balance', 'CAST(mno_uuid AS CHAR(16)) AS mno_uuid', 'mno_name'], 'id', 'desc', 1, 0)

            // add amount to the system
            var keyValue = {
                addBalance: {
                    key: "current_balance",
                    value: Number(lisResponce1[0].amount)
                }
            }
            let objResponce = await sqlQuery.updateQuery(this.tableName20, keyValue, { id: lisResponce1[0].api_type })
            var { affectedRows, changedRows, info } = objResponce;
            if (!(affectedRows && changedRows)) {
                var lisresponce = await sqlQuery.specialCMD('rollback')
                // var searchKeyValue = {
                //     userid: lisResponce1[0].userid, //str user_uuid
                //     canTransfer: 0
                // }
                // // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                // objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);
                return res.send({ message, info });
            }

            // add record to mno details
            param = {
                emoney_uuid: "uuid()",
                mno_uuid: balanceDe[0].mno_uuid, //str operator uuid
                mno_name: balanceDe[0].mno_name, //str operator name
                amount_added: Number(lisResponce1[0].amount), //db amount added
                comm_amount: 0, //db commision amount
                opening_balance: balanceDe[0].current_balance, //db opening balance
                closing_balance: Number(balanceDe[0].current_balance) + Number(lisResponce1[0].amount), //db closing balance
                emoney_txn_id: req.body.transNumber, //int transaction id
                emoney_txn_date: isodate, //dt transaction date
                created_by: lisResponce1[0].userid, //str user id
                type: 2, // system credit
                created_on: isodate, //dt current date time
                last_modified_by: lisResponce1[0].userid, // str user id
                last_modified_on: isodate //dt current date time
            }

            //fire sql query to create er money 
            objResponce = await sqlQuery.createQuery(this.tableName21, param)

            // no error commit the transactions
            var lisresponce = await sqlQuery.specialCMD('commit')

            // update can transfer status    
            // searchKeyValue = {
            //     userid: lisResponce1[0].userid, //str user_uuid
            //     canTransfer: 0
            // }   
            // objResponce = await sqlQuery.updateQuery(this.tableName4, {canTransfer: 1}, searchKeyValue);

            // get agent name    
            const agentName = await sqlQuery.searchQuery(this.tableName2, { userid: lisResponce1[0].userid }, ['userid', 'CAST(user_uuid AS CHAR(16)) AS user_uuid', "username", "full_name", 'prefer_lang', 'mobile', 'usertype_id', 'region_id', 'comm_type'], "userid", "ASC", 1, 0)

            // rollback given commission
            if (agentName[0].comm_type == 2) {
                this.rollbackCommission(req.body.transNumber, lisResponce1[0].operator_id, lisResponce1[0].created_on)
            }

            // semd sms
            let smsDetails = {
                agentId: lisResponce1[0].userid,
                recieverMessage: `Dear ${agentName[0].full_name} ${agentName[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Failed, Bal: ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`
            }
            switch (String(agentName[0].prefer_lang)) {
                case '2': // Pashto
                    smsDetails.recieverMessage = `ښاغلی ${agentName[0].full_name}! شمېرې ${lisResponce1[0].mobile_number} ته ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانیو په اندازه د کریډیټ لیږل ناکام شول، ستاسو اوسنی کریډیټ ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} افغانی دی. مننه افغان پی.`
                    break;
                case '3': // Dari
                    smsDetails.recieverMessage = `محترم ${agentName[0].full_name}! ارسال کریدت به شماره ${lisResponce1[0].mobile_number} مبلغ ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} افغانی ناکام گردید، کریدیت فعلی شما ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} افغانی است. تشکر،افغان پی.`
                    break;
                case '1': // english
                default:
                    smsDetails.recieverMessage = `Dear ${agentName[0].full_name} ${agentName[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Failed, Bal: ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`
                    break;
            }
            // console.log(smsDetails)
            smsFunction.agentSms(smsDetails, lisResponce1[0].request_mobile_no).then((smsFunResponce) => {
                if (smsFunResponce.error) {
                    // console.log('send sms error for agent : ',agentName[0].username)
                } else {
                    // console.log('sms added')
                }
            })

            // add failed recharge log in system
            var logData = {
                userid: agentName[0].userid,
                user_uuid: agentName[0].user_uuid,
                username: agentName[0].username,
                full_name: agentName[0].full_name,
                mobile: agentName[0].mobile,
                intCreatedByType: agentName[0].userid,
                intUserType: agentName[0].usertype_id,
                userIpAddress: 'NA',
                userMacAddress: 'NA', //str
                userOsDetails: 'NA', //str
                userImeiNumber: 'NA', //str
                userGcmId: 'NA', //str
                userAppVersion: 'NA', //str
                userApplicationType: lisResponce1[0].source == 'Web' ? 1 : (lisResponce1[0].source == 'Mobile' ? 2 : (lisResponce1[0].source == 'USSD' ? 3 : 4)),
                description: `Dear ${agentName[0].full_name} ${agentName[0].username}, Your Recharge to ${lisResponce1[0].mobile_number} Amount: ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)} AFN is Failed, Bal: ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)} AFN TX:${req.body.transNumber} Thank You for being Afghan Pay agent!`,
                userActivityType: 25,
                oldValue: `Recharge Rejected ${parseFloat(String(lisResponce1[0].amount)).toFixed(2)}`,
                newValue: `Closing Balance ${parseFloat(String(Number(lisResponce1[0].closing_balance) + Number(lisResponce1[0].amount))).toFixed(2)}`,
                regionId: agentName[0].region_id
            }

            // make api call
            let intResult = await httpRequestMakerCommon.httpPost("activity-log", logData)

            // send responce to fornt end
            return res.send({ message, info });

        } catch (error) {
            console.log(error);
            res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    rollbackCommission = async (strUniqueNumber, operatorId, dateTime) => {
        try {

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let rechargeList = await rechargeModel.getCommissionRollbackList(strUniqueNumber, operatorId)

            for (let i = 0; i < rechargeList.length; i++) {
                let messageQueue = {
                    user_uuid: rechargeList[i].user_uuid, //str
                    commissionAmount: rechargeList[i].commission_amount, // str
                    parent_id: rechargeList[i].parent_id,
                    strUniqueNumber: strUniqueNumber,
                    userid: rechargeList[i].userid,
                    operator_id: operatorId,
                    dateTime: dateTime,
                    date: date,
                    dtCurrentDate: date, // dt current date time
                    strDate: date.toISOString().slice(0, 19).replace('T', ' '),
                }

                sendMessage('rollbackCommissionFromAgent', JSON.stringify(messageQueue), (err, msg) => {
                    if (err) console.log(err)
                })
            }

        } catch (error) {
            console.log(error);
            return ({ error: error.message })
        }
    }

    rollbackCommissionFromAgent = async (userDetailsString) => {
        try {
            let userDetails = JSON.parse(userDetailsString)

            // update agent account so it cant do any transactions
            let searchKeyValue = {
                user_uuid: userDetails.user_uuid, //str user_uuid
                canTransfer: 1
            }
            // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
            let objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 0 }, searchKeyValue);
            // console.log(objResponce)
            let { affectedRows, changedRows, info } = objResponce;
            // generating proper message
            // if (!affectedRows) console.log("user_uuid account not created "+userDetails.user_uuid + ' add commission '+ userDetails.commissionAmount)
            if (!(affectedRows && changedRows)) {
                // pusha again to rabbit mq 
                sendMessage('rollbackCommissionFromAgent', userDetailsString, (err, msg) => {
                    if (err) console.log(err)
                })
            }
            else {
                // start txn
                var lisresponce = await sqlQuery.specialCMD('transaction')
                // get wallet balance
                let lisResponce4 = await sqlQuery.searchQueryTran(this.tableName4, { user_uuid: userDetails.user_uuid }, ['ex_wallet', 'comm_wallet'], 'userid', 'ASC', 1, 0)

                // update wallet balance with commission and transaction status
                searchKeyValue = {
                    user_uuid: userDetails.user_uuid, //str user_uuid
                    canTransfer: 0
                }
                let param = {
                    canTransfer: 1,
                    deductBalance: {
                        key: "ex_wallet",
                        value: Number(userDetails.commissionAmount)
                    },
                    deductBalance1: {
                        key: "comm_wallet",
                        value: Number(userDetails.commissionAmount)
                    }
                    // ex_wallet : Number(lisResponce4[0].ex_wallet) + ,
                    // comm_wallet : Number(lisResponce4[0].comm_wallet) + ,
                }
                // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                objResponce = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

                let messageQueue = {
                    userId: userDetails.userid,
                    amount: 0,
                    comm: Number(userDetails.commissionAmount),
                    operatorId: userDetails.operator_id,
                    dateTime: userDetails.dateTime
                }
                sendMessage('rechargeFailedDeductUserSummery', JSON.stringify(messageQueue), (err, msg) => {
                    if (err) console.log(err)
                })

                messageQueue = {
                    userId: userDetails.userid,
                    amount: Number(userDetails.commissionAmount),
                    dateTime: userDetails.strDate
                }
                sendMessage('processedStockSend', JSON.stringify(messageQueue), (err, msg) => {
                    if (err) console.log(err)
                })

                // add details wallet transaction 
                param = {
                    wallet_txn_uuid: "uuid()",
                    userid: userDetails.userid, // str userid
                    user_uuid: userDetails.user_uuid, // str userid
                    trans_number: userDetails.strUniqueNumber, // str unique number
                    trans_date_time: userDetails.strDate, // str date
                    amount: Number(userDetails.commissionAmount), // db amount
                    trans_type: 2, // type debit
                    narration: "Top-Up commission rollback for failed recahrge",
                    balance_amount: Number(lisResponce4[0].ex_wallet) - Number(userDetails.commissionAmount), //db balance amount
                    trans_for: "Top-Up commission rollback for failed recahrge"
                }
                //fire sql query
                objResponce = await sqlQuery.createQuery(this.tableName5, param)

                // update commission state
                param = {
                    userid: userDetails.userid,
                    parent_id: userDetails.parent_id,
                    recharge_id: userDetails.strUniqueNumber,
                }

                objResponce = await sqlQuery.updateQuery(this.tableName9, { status: 3 }, { userid: userDetails.userid, recharge_id: userDetails.strUniqueNumber });

                if (!(objResponce.affectedRows && objResponce.changedRows)) {

                    await sqlQuery.specialCMD('rollback')
                }
                else await sqlQuery.specialCMD('commit')
            }

        } catch (error) {
            console.log(error);
        }
    }

    refundFailedRechargeBalance = async (message) => {
        try {
            // console.log(message);
            let userDetails = JSON.parse(message)
            // console.log(userDetails);
            // let {userid, amount, strDate, dtCurrentDate, transNumber} = userDetails

            let searchQuery = {
                trans_number: userDetails.transNumber
            }

            let sqlResponse = await sqlQuery.searchQuery(this.tableName5, searchQuery, ['count(1)'], 'trans_number', 'desc', 1, 0)
            if (sqlResponse[0]['count(1)'] == 1) {
                // update the transaction status to 0
                let searchKeyValue = {
                    userid: userDetails.userid, //str user_uuid
                    canTransfer: 1
                }
                let objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 0 }, searchKeyValue);

                var { affectedRows, changedRows, info } = objResponce;

                // generating proper message
                // if (!affectedRows) return res.status(400).json({ errors: [ {msg : "User transaction under process"}] });
                if (!(affectedRows && changedRows)) {
                    // send message to rabbitmq
                    // console.log('account in active')
                    sendMessage('refundFailedRechargeBalance', message, (err, msg) => {
                        if (err) console.log(err)
                    })
                } else {
                    // start transaction
                    var lisresponce = await sqlQuery.specialCMD('transaction')

                    // get agent balance    
                    const lisResponce3 = await sqlQuery.searchQueryTran(this.tableName4, { userid: userDetails.userid }, ['user_uuid', 'ex_wallet'], "userid", "ASC", 1, 0)
                    if (lisResponce3.length == 0) {
                        // rollback
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [{ msg: "User wallet detailsn not found" }] });
                    }
                    // req.body.reciever_id = userid

                    // update wallet balance with commission and transaction status
                    searchKeyValue = {
                        canTransfer: 0,
                        userid: userDetails.userid, //str user_uuid
                    }
                    let param = {
                        addBalance: {
                            key: "ex_wallet",
                            value: Number(userDetails.amount)
                        },
                        // ex_wallet : Number(lisResponce3[0].ex_wallet) + Number(userDetails.amount),
                        canTransfer: 1
                    }
                    // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                    objResponce = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);
                    var { affectedRows, changedRows, info } = objResponce;

                    if (!(affectedRows && changedRows)) {
                        var lisresponce = await sqlQuery.specialCMD('rollback')
                        searchKeyValue = {
                            userid: userDetails.userid, //str user_uuid
                            canTransfer: 0
                        }
                        // fire sql update query to change the can transfer status to 0 only when the can transfer is 1
                        objResponce = await sqlQuery.updateQuery(this.tableName4, { canTransfer: 1 }, searchKeyValue);
                        return res.status(400).json({ errors: [{ msg: "Amount not reversed" }] });
                    }

                    //transation variables
                    // let dtCurrentDate = date // dt current date time
                    // let strDate = dtCurrentDate.toISOString().slice(0, 19).replace('T', ' ') //dt current date time
                    // let strUniqueNumber = dataBaseId(dtCurrentDate) //str unique number

                    // add details wallet transaction 
                    param = {
                        wallet_txn_uuid: "uuid()",
                        userid: userDetails.userid, // str userid
                        user_uuid: lisResponce3[0].user_uuid, // str userid
                        trans_number: userDetails.transNumber, // str unique number
                        trans_date_time: userDetails.strDate, // str date
                        amount: Number(userDetails.amount), // db amount
                        trans_type: 1, // type credit
                        narration: userDetails.narration ? userDetails.narration : `Top-Up refund for ${userDetails.mobileNumber}`,
                        balance_amount: Number(lisResponce3[0].ex_wallet) + Number(userDetails.amount), //db balance amount
                        trans_for: "Top-Up refund"
                    }
                    //fire sql query
                    objResponce = await sqlQuery.createQuery(this.tableName5, param)

                    let messageQueue = {
                        userId: userDetails.userid,
                        amount: Number(userDetails.amount),
                        dateTime: userDetails.strDate
                    }
                    sendMessage('processedStockReceived', JSON.stringify(messageQueue), (err, msg) => {
                        if (err) console.log(err)
                    })
                }
            } else {
                console.log('error: failed transaction :', userDetails.transNumber)
            }

        } catch (error) {
            console.log(error)
        }
    }

    // failed recharge count check
    failedCountCheck = async (mnoId) => {
        try {
            failedRechargeCount[mnoId] = failedRechargeCount[mnoId] + 1;

            if (failedRechargeCount[mnoId] == 1) {
                // send sms to respectivue admin
                // let searchKeyValue = {
                //     nn_type: failedRechargeCount[mnoId],
                //     active : 1
                // }
                // let searchKey = ['nn_type', 'created_by','nn_number']
                let mobileNumberList = await rechargeModel.failedRechargeNumberList(failedRechargeCount[mnoId])

                mobileNumberList.forEach((mobileNumber) => {
                    let smsDetails = {
                        userId: mobileNumber.userId,
                        username: mobileNumber.userName,
                        mobile: mobileNumber.nn_number,
                        recieverMessage: mobileNumber.nt_name,
                    }
                    // console.log(smsDetails)
                    smsFunction.directSMS(smsDetails).then((smsFunResponce) => {
                        if (smsFunResponce.error) {
                            // console.log('send sms error for agent : ',agentName[0].username)
                        } else {
                            // console.log('sms added')
                        }
                    })
                })
            }

        } catch (error) {
            console.log(error);
        }
    }

    // pending Rechange
    pendingRechange = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/pendigRecharge',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let searchKeyValue = {
                trans_number: req.body.transNumber,
                status: 1,
            }
            var key = ['userid', 'mobile_number', 'amount', 'operator_id', "closing_balance", "api_type"]
            const lisResponce1 = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, 'userid', 'ASC', 1, 0)
            if (lisResponce1.length == 0) return res.status(400).json({ errors: [{ msg: "transaction not found" }] });

            let updateResponce
            // update responce in respective table
            switch (lisResponce1[0].operator_id) {
                case "1":
                    updateResponce = await this.updateSalamResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 3)
                    break;
                case '2':
                    updateResponce = await this.updateAwccResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 3)
                    break;
                case '3':
                    updateResponce = await this.updateMtnResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 3)
                    break;
                case '4':
                    updateResponce = await this.updateEtisalatResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 3)
                    break;
                case '5':
                    updateResponce = await this.updateRoshanResponce(req.body.transNumber, req.body.rechargeRequest, req.body.rechargeResponce, 3)
                    break;
            }

            searchKeyValue = {
                trans_number: req.body.transNumber,
                status: 1,
            }
            let param = {
                modified_on: isodate,
                os_details: req.body.rechargeResponce,
                operator_balance: req.body.mnoBalance || 0,
            }

            // update the status
            const lisResponce2 = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

            // check if the result is there and responce accordingly
            var { affectedRows, changedRows, info } = lisResponce2;
            const message = !affectedRows ? 'transaction number not found' :
                affectedRows && changedRows ? 'transaction status updated successfully' : 'Details Updated';

            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    // agent panel #########################################
    // reports
    topUpreports = async (req, res) => {
        try {

            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/toupUpReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            // // limit offset
            //     var offset = req.query.start
            //     var limit = req.query.end - offset
            let childList = req.body.user_detials.child_list.join(',');
            // sql search param
            var searchKeyValue = {
                // child_ids : childList == '' ? req.body.user_detials.userid : childList + "," + req.body.user_detials.userid 
                userid: req.body.user_detials.userid
            }
            if (req.query.mobile) searchKeyValue.mobile_number = req.query.mobile
            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce1[0].operator_id
            }
            if (req.query.status) searchKeyValue.status = req.query.status

            // check date for start and end 
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate //dt end date
            }

            // check search parameters 
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Im proper search paremeters" }] });

            const totalTopUpAmount = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, ['SUM(amount) AS totalAmount', 'count(1) AS count'], "id", "DESC")

            let intTotlaRecords = Number(totalTopUpAmount[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            var key = ['trans_number AS transactionId', "operator_name AS operatorName", "mobile_number as mobile", "amount", "comm_amt AS commissionAmount", "IF(status = 1,'Pending',IF(status = 2,'Success',IF(status = 3,'Failed','NA'))) as status", "CAST(created_on AS CHAR(20)) AS rechargeDate"]

            const lisResponce2 = await sqlQueryReplica.searchQueryTimeout(this.tableName1, searchKeyValue, key, "id", "DESC", limit, offset)
            // if(lisResponce2.length == 0) return res.status(204).send({message : 'no recharge found'})

            // var finalResult = lisResponce2.map((result)=>{
            //     var {status,...other} = result
            //     other.status = status == 1 ? "Pending" : status == 2 ? "Success" : "Failed"
            //     return other
            // })

            res.status(200).send({
                totalTopUpAmount: totalTopUpAmount[0].totalAmount || 0,
                finalResult: lisResponce2,
                totalRepords: intTotlaRecords,
                pageCount: intPageCount,
                currentPage: Number(req.query.pageNumber),
                pageLimit: Number(process.env.PER_PAGE_COUNT)
            })

        } catch (error) {
            console.error('topUpreports', error);
            res.status(200).send({
                totalTopUpAmount: 0,
                finalResult: [{}],
                totalRepords: 0,
                pageCount: 0,
                currentPage: Number(req.query.pageNumber),
                pageLimit: Number(process.env.PER_PAGE_COUNT)
            })
        }
    }

    downloadtopUpreports = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if (!req.query.pageNumber) req.query.pageNumber = 0;
            const isExcel = req.query.pageNumber == 0;

            let childList = req.body.user_detials.child_list.join(',');
            let searchKeyValue = {
                userid: req.body.user_detials.userid,
            };

            if (req.query.mobile) searchKeyValue.mobile_number = req.query.mobile;

            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid);
                if (lisResponce1 == 0) {
                    return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                }
                searchKeyValue.operator_id = lisResponce1[0].operator_id;
            }

            if (req.query.status) searchKeyValue.status = req.query.status;

            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) {
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            }

            if (req.query.startDate) searchKeyValue.start_date = req.query.startDate;
            if (req.query.endDate) searchKeyValue.end_date = req.query.endDate;

            if (Object.keys(searchKeyValue).length == 0) {
                return res.status(400).json({ errors: [{ msg: "Im proper search paremeters" }] });
            }

            const totalTopUpAmount = await sqlQueryReplica.searchQueryNoLimitTimeout(
                this.tableName1,
                searchKeyValue,
                ['SUM(amount) AS totalAmount', 'count(1) AS count'],
                "id",
                "DESC"
            );

            let intTotlaRecords = Number(totalTopUpAmount[0].count);
            let intPageCount = Math.ceil(intTotlaRecords / Number(process.env.PER_PAGE_COUNT));

            let offset = req.query.pageNumber > 0 ? (Number(req.query.pageNumber) - 1) * Number(process.env.PER_PAGE_COUNT) : 0;
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords;

            let key = [
                'trans_number AS transactionId',
                'operator_name AS operatorName',
                'mobile_number as mobile',
                'amount',
                'comm_amt AS commissionAmount',
                "IF(status = 1,'Pending',IF(status = 2,'Success',IF(status = 3,'Failed','NA'))) as status",
                'CAST(created_on AS CHAR(20)) AS rechargeDate'
            ];

            const lisResponce2 = await sqlQueryReplica.searchQueryTimeout(
                this.tableName1,
                searchKeyValue,
                key,
                "id",
                "DESC",
                limit,
                offset
            );

            if (isExcel) {
                const now = new Date();
                const dateStr = new Date().toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
                const filename = `topup_report_${dateStr}_${timeStr}.xlsx`;
                const filePath = path.join(REPORT_DIR, filename);

                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    if (moment().diff(moment(stats.ctime), 'minutes') < 30) {
                        return res.status(200).json({
                            success: true,
                            downloadUrl: `/api/v1/recharge/agent-report/files/${filename}`,
                        });
                    }
                }

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Top-Up Report');

                if (lisResponce2.length > 0) {
                    worksheet.columns = Object.keys(lisResponce2[0]).map((key) => ({
                        header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                        key,
                        width: 25,
                    }));

                    worksheet.getRow(1).font = { bold: true };
                    worksheet.addRows(lisResponce2);
                }

                await workbook.xlsx.writeFile(filePath);

                setTimeout(() => {
                    fs.unlink(filePath, (err) => {
                        if (err && err.code !== 'ENOENT') {
                            console.error(`Error deleting ${filename}:`, err.message);
                        }
                    });
                }, 30 * 60 * 1000);

                return res.status(200).json({
                    success: true,
                    downloadUrl: `/api/v1/recharge/agent-report/files/${filename}`,
                });
            }

            return res.status(200).send({
                totalTopUpAmount: totalTopUpAmount[0].totalAmount || 0,
                finalResult: lisResponce2,
                totalRepords: intTotlaRecords,
                pageCount: intPageCount,
                currentPage: Number(req.query.pageNumber),
                pageLimit: Number(process.env.PER_PAGE_COUNT)
            });

        } catch (error) {
            console.error('topUpreports', error);
            if (req.query.pageNumber == 0) {
                return res.status(200).send([{}]);
            } else {
                return res.status(200).send({
                    totalTopUpAmount: 0,
                    finalResult: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                });
            }
        }
    };


    // downlaine top-up report
    downlineTopUpReport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/downlineTopupReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            // limit offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // search agent id with parent param

            var searchkeyval1 = {}

            if (req.query.filterType && req.query.filterValue) {
                if (req.query.filterType == 1 || req.query.filterType == 2) {
                    var searchKeyValue = {
                        child_ids: req.body.user_detials.child_list.join(','),
                        Active: 1
                    }
                    if (req.query.filterType == 1 || req.query.filterType == '1') searchKeyValue.username = req.query.filterValue
                    if (req.query.filterType == 2 || req.query.filterType == '2') searchKeyValue.mobile = req.query.filterValue

                    if (Object.keys(searchKeyValue).length == 2) return res.status(400).json({ errors: [{ msg: "Impoper search parementer" }] });

                    // search child
                    var lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, ['userid', 'child_id'], 'userid', 'ASC', 1, 0)
                    if (lisResponce1.length == 0) return res.status(400).json({ errors: [{ msg: "user not found" }] });
                    // searchkeyval1.userid = lisResponce1[0].userid
                    searchkeyval1.child_ids = lisResponce1[0].child_id != '' ? lisResponce1[0].child_id + "," + lisResponce1[0].userid : lisResponce1[0].userid
                }
                if (req.query.filterType == 3) {
                    searchkeyval1.mobile_number = req.query.filterValue
                    searchkeyval1.child_ids = req.body.user_detials.child_list.join(',')
                }
            } else {
                searchkeyval1.child_ids = req.body.user_detials.child_list.join(',')
            }

            // checking search param
            if (Object.keys(searchkeyval1).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search parameter" }] });

            //other optional search param
            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchkeyval1.operator_id = lisResponce1[0].operator_id
            }
            if (req.query.status) searchkeyval1.status = req.query.status

            // check date for start and end 
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.startDate) {
                searchkeyval1.between = {
                    key: 'created_on',
                    value: [req.query.startDate, req.query.startDate]
                } //dt start date
            }
            if (req.query.endDate) {
                searchkeyval1.between.value[1] = req.query.endDate //dt end date
            }

            const lisTotalRecords = await rechargeModel.downlineTopUpReportCount(searchkeyval1);

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            const lisResponce2 = await rechargeModel.downlineTopUpReport(searchkeyval1, limit, offset);
            if (lisResponce2.length == 0) return res.status(204).send({ message: 'no recharge found' })

            // var finalResult = lisResponce2.map((result)=>{
            //     var {status,...other} = result
            //     other.status = status == 1 ? "Pending" : status == 2 ? "Success" : "Failed"
            //     return other
            // })

            // res.status(200).send(finalResult)
            if (req.query.pageNumber == 0) {
                res.status(200).send(lisResponce2)
            } else {
                res.status(200).send({
                    reportList: lisResponce2,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: lisTotalRecords[0].totalAmount || 0,
                    totalCommissionAmount: lisTotalRecords[0].totalCommissionAmount || 0
                })
            }

        } catch (error) {
            console.error('downlineTopUpReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: 0,
                    totalCommissionAmount: 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    downlineDownlineTopUpReport = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if (!req.query.pageNumber) req.query.pageNumber = 0;
            const isExcel = req.query.pageNumber == 0;

            let searchkeyval1 = {};

            if (req.query.filterType && req.query.filterValue) {
                if (req.query.filterType == 1 || req.query.filterType == 2) {
                    let searchKeyValue = {
                        child_ids: req.body.user_detials.child_list.join(','),
                        Active: 1
                    };

                    if (req.query.filterType == 1) searchKeyValue.username = req.query.filterValue;
                    if (req.query.filterType == 2) searchKeyValue.mobile = req.query.filterValue;

                    if (Object.keys(searchKeyValue).length == 2)
                        return res.status(400).json({ errors: [{ msg: "Impoper search parementer" }] });

                    const lisResponce1 = await sqlQueryReplica.searchQuery(
                        this.tableName2,
                        searchKeyValue,
                        ['userid', 'child_id'],
                        'userid',
                        'ASC',
                        1,
                        0
                    );
                    if (lisResponce1.length == 0)
                        return res.status(400).json({ errors: [{ msg: "user not found" }] });

                    searchkeyval1.child_ids = lisResponce1[0].child_id != ''
                        ? lisResponce1[0].child_id + "," + lisResponce1[0].userid
                        : lisResponce1[0].userid;
                }

                if (req.query.filterType == 3) {
                    searchkeyval1.mobile_number = req.query.filterValue;
                    searchkeyval1.child_ids = req.body.user_detials.child_list.join(',');
                }
            } else {
                searchkeyval1.child_ids = req.body.user_detials.child_list.join(',');
            }

            if (Object.keys(searchkeyval1).length == 0)
                return res.status(400).json({ errors: [{ msg: "Improper search parameter" }] });

            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid);
                if (lisResponce1 == 0)
                    return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchkeyval1.operator_id = lisResponce1[0].operator_id;
            }

            if (req.query.status) searchkeyval1.status = req.query.status;

            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) {
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            }

            if (req.query.startDate) {
                searchkeyval1.between = {
                    key: 'created_on',
                    value: [req.query.startDate, req.query.startDate]
                };
            }

            if (req.query.endDate) {
                searchkeyval1.between.value[1] = req.query.endDate;
            }

            const lisTotalRecords = await rechargeModel.downlineTopUpReportCount(searchkeyval1);

            let intTotlaRecords = Number(lisTotalRecords[0].count);
            let intPageCount = Math.ceil(intTotlaRecords / Number(process.env.PER_PAGE_COUNT));
            let offset = req.query.pageNumber > 0
                ? (Number(req.query.pageNumber) - 1) * Number(process.env.PER_PAGE_COUNT)
                : 0;
            let limit = req.query.pageNumber > 0
                ? Number(process.env.PER_PAGE_COUNT)
                : intTotlaRecords;

            const lisResponce2 = await rechargeModel.downlineTopUpReport(searchkeyval1, limit, offset);

            if (lisResponce2.length == 0) {
                return res.status(204).send({ message: 'no recharge found' });
            }

            if (isExcel) {
                const now = new Date();
                const dateStr = new Date().toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
                const filename = `downline_topup_report_${dateStr}_${timeStr}.xlsx`;
                const filePath = path.join(REPORT_DIR, filename);

                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    if (moment().diff(moment(stats.ctime), 'minutes') < 30) {
                        return res.status(200).json({
                            success: true,
                            downloadUrl: `/api/v1/recharge/agent-report/files/${filename}`,
                        });
                    }
                }

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Downline Top-Up Report');

                if (lisResponce2.length > 0) {
                    worksheet.columns = Object.keys(lisResponce2[0]).map((key) => ({
                        header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                        key,
                        width: 25,
                    }));

                    worksheet.getRow(1).font = { bold: true };
                    worksheet.addRows(lisResponce2);
                }

                await workbook.xlsx.writeFile(filePath);

                setTimeout(() => {
                    fs.unlink(filePath, (err) => {
                        if (err && err.code !== 'ENOENT') {
                            console.error(`Error deleting ${filename}:`, err.message);
                        }
                    });
                }, 30 * 60 * 1000);

                return res.status(200).json({
                    success: true,
                    downloadUrl: `/api/v1/recharge/agent-report/files/${filename}`,
                });
            }

            res.status(200).send({
                reportList: lisResponce2,
                totalRepords: intTotlaRecords,
                pageCount: intPageCount,
                currentPage: Number(req.query.pageNumber),
                pageLimit: Number(process.env.PER_PAGE_COUNT),
                totalAmount: lisTotalRecords[0].totalAmount || 0,
                totalCommissionAmount: lisTotalRecords[0].totalCommissionAmount || 0
            });

        } catch (error) {
            console.error('downlineTopUpReport', error);

            if (req.query.pageNumber == 0) {
                res.status(200).send([{}]);
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: 0,
                    totalCommissionAmount: 0
                });
            }
        }
    };
    // group topup report
    groupTopUpReport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/groupTopupReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            // limit offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // required search param
            var searchKeyValue = {
                userid: req.body.user_detials.userid,
                "NOT group_topup_id": 0
            }
            if (req.query.group_uuid) {
                // get the group id from group uuid
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName10, { userid: req.body.user_detials.userid, group_uuid: req.query.group_uuid, active: 1 }, ['group_id'], 'group_id', 'ASc', 1, 0)
                if (lisResponce1.length == 0) return res.status(400).json({ errors: [{ msg: "group id not found" }] });
                searchKeyValue.group_topup_id = lisResponce1[0].group_id
            }
            if (req.query.mobile) searchKeyValue.mobile_number = req.query.mobile
            if (req.query.operator_uuid) {
                const lisResponce3 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce3 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce3[0].operator_id
            }
            if (req.query.status) searchKeyValue.status = req.query.status

            // check date for start and end 
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.startDate) {
                searchKeyValue.between = {
                    key: 'created_on',
                    value: [req.query.startDate, req.query.startDate]
                } //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.between.value[1] = req.query.endDate //dt end date
            }

            // check search parameters 
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Im proper search paremeters" }] });

            var key = ['trans_number AS transactionId', "operator_name AS operatorName", "mobile_number as mobile", "amount", "comm_amt AS commissionAmount", "IF(status = 1,'Pending',IF(status = 2,'Success',IF(status = 3,'Failed','NA'))) as status", "CAST(created_on AS CHAR(20)) AS rechargeDate"]

            const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, ["COUNT(1) AS count", "SUM(amount) AS totalAmount", "SUM(comm_amt) AS totalCommissionAmount"], "id", "DESC")

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            const lisResponce2 = await sqlQueryReplica.searchQueryTimeout(this.tableName1, searchKeyValue, key, "id", "DESC", limit, offset)
            if (lisResponce2.length == 0) return res.status(204).send({ message: 'no recharge found' })

            // var finalResult = lisResponce2.map((result)=>{
            //     var {status,...other} = result
            //     other.status = status == 1 ? "Pending" : status == 2 ? "Success" : "Failed"
            //     return other
            // })

            // res.status(200).send(finalResult)
            if (req.query.pageNumber == 0) {
                res.status(200).send(lisResponce2)
            } else {
                res.status(200).send({
                    reportList: lisResponce2,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: lisTotalRecords[0].totalAmount || 0,
                    totalCommissionAmount: lisTotalRecords[0].totalCommissionAmount || 0
                })
            }
        } catch (error) {
            console.error('groupTopUpReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: 0,
                    totalCommissionAmount: 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    telcoWiseTopUpReport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/telcoWiseTopUpReport',JSON.stringify(req.body), JSON.stringify(req.query))
            // variable search option 
            var searchKeyValue = {
                userid: req.body.user_detials.userid
            };

            // check date for start and end 
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.startDate) {
                searchKeyValue.between = {
                    key: 'created_on',
                    value: [req.query.startDate, req.query.startDate]
                } //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.between.value[1] = req.query.endDate //dt end date
            }

            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce1[0].operator_id
            }
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search paremeters" }] });

            var key = ["operator_id", "operator_name", "amount", "status"]
            const lisResponce1 = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, key, "operator_id", "ASC")
            if (lisResponce1.length == 0) return res.status(204).send({ message: 'no search result found' });

            let finalResult = [], operatorIds = [], i = 0, operatorIndex = 0

            for (i = 0; i < lisResponce1.length; i++) {
                if (operatorIds.includes(lisResponce1[i].operator_id)) {
                    operatorIndex = operatorIds.indexOf(lisResponce1[i].operator_id)
                    // console.log("operatorIndex ",operatorIndex,"finalResult[operatorIndex] ", finalResult[operatorIndex])
                    finalResult[operatorIndex].totalTrans += 1
                    finalResult[operatorIndex].txnsAmount += lisResponce1[i].status == 2 ? lisResponce1[i].amount : 0
                    finalResult[operatorIndex].successTxns += lisResponce1[i].status == 2 ? 1 : 0
                    finalResult[operatorIndex].pendingsTxns += lisResponce1[i].status == 1 ? 1 : 0
                    finalResult[operatorIndex].failedTxns += lisResponce1[i].status == 3 ? 1 : 0

                } else {
                    operatorIds.push(lisResponce1[i].operator_id)
                    finalResult.push({
                        operatorName: lisResponce1[i].operator_name,
                        totalTrans: 1,
                        txnsAmount: lisResponce1[i].amount,
                        successTxns: lisResponce1[i].status == 2 ? 1 : 0,
                        pendingsTxns: lisResponce1[i].status == 1 ? 1 : 0,
                        failedTxns: lisResponce1[i].status == 3 ? 1 : 0
                    })
                }
            }

            res.status(200).send(finalResult)

        } catch (error) {
            console.error('telcoWiseTopUpReport', error);
            res.status(200).send([{}])
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // Admin panel #########################################
    agentTopupReport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/agentTopUpReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            // limit offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // optional search paremeters
            var searchKeyValue = {
                Active: 1,
                // region_ids : req.body.user_detials.region_list.join(',')
            }

            if (req.body.user_detials.region_list.length != 7) {
                searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
            }

            // user search parem
            // if(Number(req.query.userName)){
            //     searchKeyValue.mobile_number = req.query.userName
            // }
            if (req.query.contactNumber) {
                if (req.query.contactNumber.length == 10) searchKeyValue.mobile_number = req.query.contactNumber;
                else searchKeyValue.trans_number = req.query.contactNumber;
            }

            // if(req.query.userId || req.query.userName ){
            //     let searchKeyValue1 = {
            //         region_ids : req.body.user_detials.region_list.join(',')
            //     }
            //     if(req.query.userId) searchKeyValue1.username = req.query.userId;
            //     if(req.query.userName){
            //         if(Number(req.query.userName)){
            //             searchKeyValue1.mobile = req.query.userName
            //         }else{
            //             searchKeyValue1.full_name = req.query.userName;
            //         }
            //     }
            //     if(req.query.contactNumber) searchKeyValue1.mobile = req.query.contactNumber;

            //     // search that agent
            //     let lisAgentDetails = await sqlQuery.searchQuery(this.tableName2,searchKeyValue1,['userid,child_id'],'userid','asc',1,0)
            //     if(lisAgentDetails.length == 0) return res.status(400).json({ errors: [ {msg : "User not found"}] });
            //     // searchKeyValue.child_ids = lisAgentDetails[0].child_id != '' ? lisAgentDetails[0].child_id + ',' + lisAgentDetails[0].userid : lisAgentDetails[0].userid
            // }else{
            //     searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
            // }
            // if (req.query.userId) searchKeyValue.username = req.query.userId;

            if (req.query.userId) {
                const userId = req.query.userId;
                searchKeyValue.username = userId.startsWith("AFP-") ? userId : `AFP-${userId}`;
            }
            if (req.query.userName) {
                if (Number(req.query.userName)) {
                    let reqNum = []
                    if (req.query.userName.length == 10) {
                        reqNum = [req.query.userName, req.query.userName.slice(1, 11)]
                    } else {
                        reqNum = [req.query.userName, 0 + req.query.userName]
                    }
                    searchKeyValue.request_mobile_no = reqNum
                } else {
                    searchKeyValue.full_name = req.query.userName;
                }
            }
            if (req.query.region_uuid) searchKeyValue.region_uuid = req.query.region_uuid;
            if (req.query.province_uuid) searchKeyValue.province_uuid = req.query.province_uuid;
            if (req.query.district_uuid) searchKeyValue.district_uuid = req.query.district_uuid;
            // transaction search parem
            // check date for start and end 
            if (!searchKeyValue.trans_number) {
                if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

                if (req.query.startDate) {
                    searchKeyValue.start_date = req.query.startDate //dt start date
                }
                if (req.query.endDate) {
                    searchKeyValue.end_date = req.query.endDate //dt end date
                }
            }

            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce1[0].operator_id
            }
            if (req.query.status) {
                if (req.query.status == 4) {
                    searchKeyValue.rollback_status = 3
                } else {
                    if (req.query.status == 2) {
                        searchKeyValue.isIn = {
                            key: 'rollback_status',
                            value: ' 0,1,2,4 '
                        }
                    }
                    searchKeyValue.status = req.query.status
                }
            }

            // let sum and count
            const lisTotalRecords = await rechargeModel.agentTopupSumCountReport(searchKeyValue)
            if (lisTotalRecords.length == 0) return res.status(400).send({ message: "Calculation error" })

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1
            let sumRechargeAmount = Number(lisTotalRecords[0].amount) || 0
            let sumDebitedAmount = Number(lisTotalRecords[0].deductAdmount) || 0

            // check the searchKeyValue parem
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search paremeters" }] });
            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // use module to search list
            const lisResponce1 = await rechargeModel.agentTopupReport(searchKeyValue, limit, offset);
            // if(lisResponce1.length == 0) return res.status(204).send({message:"no transaction found"})

            // let mnoList = await sqlQuery.searchQueryNoConNolimit(this.tableName20,['mno_name'],'id','asc')

            // send reponce to frontend    
            // var finalResult = lisResponce1.map((result)=>{
            //     var {apiResponce,apiType,status,rollbackStatus,...other} = result
            //     other.status = status == 1 ? "Pending" : status == 2 ? "Success" : ( rollbackStatus ==  3 ? "Complete" : "Failed")
            //     other.apiType = apiType ? mnoList[Number(apiType)-1].mno_name : apiType
            //     other.apiResponce = apiResponce
            //     return other
            // })

            if (req.query.pageNumber == 0) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Transfer-Encoding', 'chunked');

                // Stream JSON data
                res.write('[');
                lisResponce1.forEach((item, index) => {
                    const json = JSON.stringify(item);
                    res.write(json);

                    if (index < lisResponce1.length - 1) {
                        res.write(',');
                    }
                });
                res.write(']');
                res.end();
                // res.status(200).send(lisResponce1)   
            } else {
                res.status(200).send({
                    reportList: lisResponce1,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    totalRechargeAmount: lisTotalRecords[0].amount || 0,
                    totalDebitedAmount: lisTotalRecords[0].deductAmount || 0,
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                })
            }

        } catch (error) {
            console.error('agentTopupReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    totalRechargeAmount: 0,
                    totalDebitedAmount: 0,
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }



    downloadAgentTopupReport = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const searchKeyValue = { Active: 1 };
            const filters = [];

            if (req.body.user_detials?.region_list?.length !== 7) {
                searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                filters.push(`region_ids=${searchKeyValue.region_ids}`);
            }

            if (req.query.contactNumber) {
                if (req.query.contactNumber.length === 10) {
                    searchKeyValue.mobile_number = req.query.contactNumber;
                    filters.push(`mobile=${req.query.contactNumber}`);
                } else {
                    searchKeyValue.trans_number = req.query.contactNumber;
                    filters.push(`txn=${req.query.contactNumber}`);
                }
            }

            if (req.query.userId) {
                const userId = req.query.userId.startsWith("AFP-") ? req.query.userId : `AFP-${req.query.userId}`;
                searchKeyValue.username = userId;
                filters.push(`userId=${userId}`);
            }

            if (req.query.userName) {
                if (!isNaN(req.query.userName)) {
                    searchKeyValue.request_mobile_no = [req.query.userName, "0" + req.query.userName];
                    filters.push(`userPhone=${req.query.userName}`);
                } else {
                    searchKeyValue.full_name = req.query.userName;
                    filters.push(`userName=${req.query.userName}`);
                }
            }

            if (req.query.region_uuid) {
                searchKeyValue.region_uuid = req.query.region_uuid;
                filters.push(`region=${req.query.region_uuid}`);
            }

            if (req.query.province_uuid) {
                searchKeyValue.province_uuid = req.query.province_uuid;
                filters.push(`province=${req.query.province_uuid}`);
            }

            if (req.query.district_uuid) {
                searchKeyValue.district_uuid = req.query.district_uuid;
                filters.push(`district=${req.query.district_uuid}`);
            }

            if (!searchKeyValue.trans_number) {
                if ((req.query.startDate && !req.query.endDate) || (!req.query.startDate && req.query.endDate)) {
                    return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
                }
                if (req.query.startDate) {
                    searchKeyValue.start_date = req.query.startDate;
                    filters.push(`from=${req.query.startDate}`);
                }
                if (req.query.endDate) {
                    searchKeyValue.end_date = req.query.endDate;
                    filters.push(`to=${req.query.endDate}`);
                }
            }

            if (req.query.operator_uuid) {
                const operator = await commonQueryCommon.getOperatorById(req.query.operator_uuid);
                if (!operator || operator.length === 0) {
                    return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                }
                searchKeyValue.operator_id = operator[0].operator_id;
                filters.push(`op=${req.query.operator_uuid}`);
            }

            if (req.query.status) {
                if (req.query.status == 4) {
                    searchKeyValue.rollback_status = 3;
                } else {
                    if (req.query.status == 2) {
                        searchKeyValue.isIn = {
                            key: 'rollback_status',
                            value: '0,1,2,4'
                        };
                    }
                    searchKeyValue.status = req.query.status;
                }
                filters.push(`status=${req.query.status}`);
            }
            // Generate timestamp for filename
            const now = new Date();
            const dateStr = new Date().toISOString().split('T')[0];
            // const filterHash = Buffer.from(filters.sort().join('&')).toString('base64').replace(/[+/=]/g, '');
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
            const fileName = `topup_report_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            // ✅ Reuse file if created within last 30 minutes
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const ageMinutes = (Date.now() - stats.mtimeMs) / (60 * 1000);
                if (ageMinutes < 30) {
                    console.log("Reusing cached report:", fileName);
                    return res.json({
                        success: true,
                        downloadUrl: `${process.env.THE_DOMAIN_NAME}/api/v1/recharge/admin-report/files/${fileName}`,
                        reused: true
                    });
                }
            }

            // ✅ Otherwise, generate new file
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('TopUp Report');
            const perPage = 1000;
            let page = 1;
            let isFirstBatch = true;

            while (true) {
                const offset = (page - 1) * perPage;
                const chunk = await rechargeModel.agentTopupReport(searchKeyValue, perPage, offset);
                if (!chunk.length) break;

                if (isFirstBatch) {
                    sheet.columns = Object.keys(chunk[0]).map(key => ({ header: key, key }));
                    isFirstBatch = false;
                }

                sheet.addRows(chunk);
                if (chunk.length < perPage) break;
                page++;
            }

            await workbook.xlsx.writeFile(filePath);
            fs.chmodSync(filePath, 0o644);

            // ⏱ Delete file after 30 minutes
            setTimeout(() => {
                fs.unlink(filePath, err => {
                    if (err) console.error('Error deleting file:', filePath, err);
                    else console.log('Deleted expired report file:', fileName);
                });
            }, 30 * 60 * 1000);

            const downloadUrl = `${process.env.THE_DOMAIN_NAME}/api/v1/recharge/admin-report/files/${fileName}`;
            res.json({ success: true, downloadUrl, reused: false });

        } catch (err) {
            console.error("Export error:", err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };






    topUpSummeryReport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/topUpSummeryReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            // limit offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // search parem
            let searchKeyValue = {
                Active: 1,
                // region_ids : req.body.user_detials.region_list.join(',')
            }
            if (req.body.user_detials.region_list.length != 7) {
                searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
            }
            // if(req.query.status) searchKeyValue.status = req.query.status
            // if(req.query.agent_type_uuid){
            //     const lisResponce1 = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid)
            //     if(lisResponce1.length == 0) return res.status(400).json({ errors: "Agent type id not found" }); 
            //     searchKeyValue.usertype_id = lisResponce1[0].agent_type_idf
            // }
            if (req.query.parent_uuid) {
                let parentDetails = await sqlQueryReplica.searchQuery(this.tableName2, {
                    // region_ids : req.body.user_detials.region_list.join(','),
                    user_uuid: req.query.parent_uuid
                }, ['userid'], 'userid', "ASC", 1, 0)
                if (parentDetails.length == 0) return res.status(400).json({ errors: [{ msg: 'Parent id not found' }] });
                searchKeyValue.parent_id = parentDetails[0].userid
            } else {
                if (!req.query.userId) {
                    searchKeyValue.parent_id = 1
                }
            }
            // if (req.query.userId) searchKeyValue.username = req.query.userId;"
            if (req.query.userId) {
                const userId = req.query.userId;
                searchKeyValue.username = userId.startsWith("AFP-") ? userId : `AFP-${userId}`;
            }
            if (req.query.userName) searchKeyValue.full_name = req.query.userName;

            let lisTotalRecords = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName2, searchKeyValue, ['COUNT(1) AS count'], 'userid', "ASC")

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: "Improper search key value" }); 
            let agentList = await sqlQueryReplica.searchQueryTimeout(this.tableName2, searchKeyValue, ['username', 'full_name', 'child_id', 'userid', 'province_Name', 'region_name', "IF(usertype_id = 1,'Master Distributor',IF(usertype_id = 2,'Distributor',IF(usertype_id = 3,'Reseller','Retailer'))) as agentType"], 'userid', "ASC", limit, offset)
            // check date for start and end 

            searchKeyValue = {}

            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            // let startDate, endDate, status
            if (req.query.startDate && req.query.endDate) {
                searchKeyValue.start_date = req.query.startDate
                searchKeyValue.end_date = req.query.endDate
            }
            if (req.query.status) {
                if (req.query.status == 4) {
                    searchKeyValue.rollback_status = 3
                } else {
                    // searchKeyValue.isIn = {
                    //     key : 'rollback_status',
                    //     value : ' 0,1,2,4 '
                    // }
                    // searchKeyValue['not rollback_status'] = 3
                    searchKeyValue.status = req.query.status
                }
            } else {
                // searchKeyValue.isIn = {
                //     key : 'rollback_status',
                //     value : ' 0,1,2,4 '
                // }
                // searchKeyValue['not rollback_status'] = 3
                searchKeyValue.status = 2
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Transfer-Encoding', 'chunked');
            if (req.query.pageNumber) {
                res.write('{ "reportList" : ');
            }
            res.write('[');
            let lisPendingQuery = []
            for (let i = 0; i < agentList.length; i++) {
                let { full_name, username, child_id, userid, region_name, province_Name, agentType } = agentList[i]
                if (child_id) {
                    child_id = child_id + ',' + userid
                } else {
                    child_id = userid
                }
                // console.log(child_id)
                let rechargeDetails = await rechargeModel.topUpSummeryReport(searchKeyValue, child_id)
                // lisPendingQuery.push({
                //     userId : username, 
                //     userName : full_name,
                //     regionName : region_name,
                //     provicneName : province_Name,
                //     agentType,
                //     "Salam": rechargeDetails?.Salam | 0,
                //     "AWCC":  rechargeDetails?.AWCC | 0,
                //     "MTN":  rechargeDetails?.MTN | 0,
                //     "Etisalat":  rechargeDetails?.Etisalat | 0,
                //     "Roshan":  rechargeDetails?.Roshan | 0,
                //     "topUpAmount": rechargeDetails?.topUpAmount | 0,
                //     "topUpCount":  rechargeDetails?.topUpCount | 0})

                const json = JSON.stringify({
                    userId: username,
                    userName: full_name,
                    regionName: region_name,
                    provicneName: province_Name,
                    agentType,
                    "Salam": rechargeDetails?.Salam | 0,
                    "AWCC": rechargeDetails?.AWCC | 0,
                    "MTN": rechargeDetails?.MTN | 0,
                    "Etisalat": rechargeDetails?.Etisalat | 0,
                    "Roshan": rechargeDetails?.Roshan | 0,
                    "topUpAmount": rechargeDetails?.topUpAmount | 0,
                    "topUpCount": rechargeDetails?.topUpCount | 0
                });
                res.write(json);

                if (i < agentList.length - 1) {
                    res.write(',');
                }

            }

            res.write(']');

            // let finalResult = []
            // for (let i = 0; i <lisPendingQuery.length; i++) {
            //     let {username, full_name, rechargeDetails} = lisPendingQuery[i]
            //     let processedRechargeDetails = await rechargeDetails
            //     // console.log(processedRechargeDetails)
            //     finalResult.push({
            //         userId : username,
            //         userName : full_name,
            //         ...processedRechargeDetails
            //     })
            // }

            // Stream JSON data
            if (req.query.pageNumber) {
                res.write(`,
                    "totalRepords" : ${intTotlaRecords},
                    "pageCount" : ${intPageCount},
                    "currentPage" : ${Number(req.query.pageNumber)},
                    "pageLimit" : ${Number(process.env.PER_PAGE_COUNT)}
                    }`);
            }

            res.end();

            // if( req.query.pageNumber == 0 ) {
            //     res.status(200).send(lisPendingQuery)
            // }else{
            //     res.status(200).send({
            //         reportList : lisPendingQuery,
            //         totalRepords : intTotlaRecords,
            //         pageCount : intPageCount,
            //         currentPage : Number(req.query.pageNumber),
            //         pageLimit : Number(process.env.PER_PAGE_COUNT)
            //     })
            // }

            // send responce to front end 
            // res.status(200).send(finalResult)

        } catch (error) {
            console.error('topUpSummeryReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    downloadTopUpSummeryReport = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let searchKeyValue = { Active: 1 };
            if (req.body.user_detials.region_list.length !== 7) {
                searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
            }
            if (req.query.parent_uuid) {
                const parentDetails = await sqlQueryReplica.searchQuery(this.tableName2, { user_uuid: req.query.parent_uuid }, ['userid'], 'userid', 'ASC', 1, 0);
                if (!parentDetails.length) return res.status(400).json({ errors: [{ msg: 'Parent id not found' }] });
                searchKeyValue.parent_id = parentDetails[0].userid;
            } else if (!req.query.userId) {
                searchKeyValue.parent_id = 1;
            }
            if (req.query.userId) {
                const userId = req.query.userId;
                searchKeyValue.username = userId.startsWith('AFP-') ? userId : `AFP-${userId}`;
            }
            if (req.query.userName) searchKeyValue.full_name = req.query.userName;

            const agentList = await sqlQueryReplica.searchQueryTimeout(
                this.tableName2,
                searchKeyValue,
                ['username', 'full_name', 'child_id', 'userid', 'province_Name', 'region_name', "IF(usertype_id = 1,'Master Distributor',IF(usertype_id = 2,'Distributor',IF(usertype_id = 3,'Reseller','Retailer'))) as agentType"],
                'userid',
                'ASC',
                10000,
                0
            );

            const rechargeSearch = {};
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) {
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            }
            if (req.query.startDate && req.query.endDate) {
                rechargeSearch.start_date = req.query.startDate;
                rechargeSearch.end_date = req.query.endDate;
            }
            rechargeSearch.status = req.query.status == 4 ? 3 : (req.query.status || 2);

            // Generate timestamp for filename
            const now = new Date();
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
            const fileName = `Topup_Summary_Report_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (Date.now() - stats.mtimeMs < 30 * 60 * 1000) {
                    return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
                }
            }

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('TopUp Summary Report');
            const rows = [];

            for (const agent of agentList) {
                const { full_name, username, child_id, userid, region_name, province_Name, agentType } = agent;
                const allChildIds = child_id ? `${child_id},${userid}` : `${userid}`;
                const rechargeDetails = await rechargeModel.topUpSummeryReport(rechargeSearch, allChildIds);
                rows.push({
                    userId: username,
                    userName: full_name,
                    regionName: region_name,
                    provicneName: province_Name,
                    agentType,
                    Salam: rechargeDetails?.Salam || 0,
                    AWCC: rechargeDetails?.AWCC || 0,
                    MTN: rechargeDetails?.MTN || 0,
                    Etisalat: rechargeDetails?.Etisalat || 0,
                    Roshan: rechargeDetails?.Roshan || 0,
                    topUpAmount: rechargeDetails?.topUpAmount || 0,
                    topUpCount: rechargeDetails?.topUpCount || 0
                });
            }

            sheet.columns = Object.keys(rows[0] || {}).map(key => ({ header: key, key }));
            sheet.addRows(rows);
            await workbook.xlsx.writeFile(filePath);
            fs.chmodSync(filePath, 0o644);

            setTimeout(() => {
                fs.access(filePath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        fs.unlink(filePath, err => {
                            if (err) console.error('Error deleting file:', filePath, err);
                            else console.log('Deleted file:', fileName);
                        });
                    } else {
                        console.warn('File already deleted or missing:', filePath);
                    }
                });
            }, 30 * 60 * 1000);

            res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });

        } catch (error) {
            console.error('downloadTopUpSummeryReport', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };


    agentDownlineTopUpReport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if (!req.query.pageNumber) req.query.pageNumber = 0
            // console.log('recharge/agentDownlianeTopUpReport',JSON.stringify(req.body), JSON.stringify(req.query))
            // limit offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            var searchKeyValue = {
                Active: 1,
            }
            // search parent id 
            if (req.query.parent_uuid) {
                var searchKeyValue1 = {
                    user_uuid: req.query.parent_uuid,
                    Active: 1,
                    // region_ids : req.body.user_detials.region_list.join(',')
                }
                if (req.body.user_detials.region_list.length != 7) {
                    searchKeyValue1.region_ids = req.body.user_detials.region_list.join(',')
                }
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue1, ['userid', 'child_id'], 'userid', 'ASC', 1, 0)
                if (lisResponce1.length == 0) return res.status(400).json({ errors: "parent id ont found" });
                searchKeyValue.child_ids = lisResponce1[0].child_id || ' 0 ';
            } else {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                if (req.body.user_detials.region_list.length != 7) {
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }

            // optional search paremeter

            if (req.query.agentId) searchKeyValue.username = req.query.agentId
            if (req.query.agentName) searchKeyValue.full_name = req.query.agentName
            if (req.query.agentMobile) searchKeyValue.mobile = req.query.agentMobile
            if (req.query.agentEmail) searchKeyValue.emailid = req.query.agentEmail

            // transaction search options
            // check date for start and end 
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate //dt end date
            }
            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce1[0].operator_id
            }
            if (req.query.status) {
                if (req.query.status == 4) {
                    searchKeyValue.rollback_status = 3
                } else {
                    // searchKeyValue.isIn = {
                    //     key : 'rollback_status',
                    //     value : ' 0,1,2,4 '
                    // }
                    searchKeyValue.status = req.query.status
                }
            }

            // check search parem
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search key parem" }] });

            const lisTotalRecords = await rechargeModel.agentDownlineTopUpReportCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // recharge model search query 
            const lisResponce2 = await rechargeModel.agentDownlineTopUpReport(searchKeyValue, limit, offset)
            // if(lisResponce2.length == 0) return res.status(204).send({message : "no transaction report found"})

            // let mnoList = await sqlQuery.searchQueryNoConNolimit(this.tableName20,['mno_name'],'id','asc')

            // send reponce to frontend    
            // var finalResult = lisResponce2.map((result)=>{
            //     var {status,apiType,rollbackStatus,...other} = result
            //     other.status = status == 1 ? "Pending" : status == 2 ? "Success" : "Failed"
            //     other.apiType = apiType ? mnoList[Number(apiType)-1].mno_name : apiType
            //     return other
            // })

            if (req.query.pageNumber == 0) {
                res.status(200).send(lisResponce2)
            } else {
                res.status(200).send({
                    reportList: lisResponce2,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: lisTotalRecords[0].totalAmount || 0,
                    totalDeductAdmount: lisTotalRecords[0].totalDeductAmount || 0
                })
            }

            // res.status(200).send(finalResult)

        } catch (error) {
            console.error('agentDownlineTopUpReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: 0,
                    totalDeductAdmount: 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    agentDownloadDownlineTopUpReport = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const searchKeyValue = { Active: 1 };

            if (req.query.parent_uuid) {
                const searchKeyValue1 = {
                    user_uuid: req.query.parent_uuid,
                    Active: 1
                };
                if (req.body.user_detials.region_list.length !== 7) {
                    searchKeyValue1.region_ids = req.body.user_detials.region_list.join(',');
                }
                const parentResult = await sqlQueryReplica.searchQuery(
                    this.tableName2,
                    searchKeyValue1,
                    ['userid', 'child_id'],
                    'userid',
                    'ASC',
                    1,
                    0
                );
                if (!parentResult.length) return res.status(400).json({ errors: 'parent id not found' });
                searchKeyValue.child_ids = parentResult[0].child_id || '0';
            } else if (req.body.user_detials.region_list.length !== 7) {
                searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
            }

            if (req.query.agentId) searchKeyValue.username = req.query.agentId;
            if (req.query.agentName) searchKeyValue.full_name = req.query.agentName;
            if (req.query.agentMobile) searchKeyValue.mobile = req.query.agentMobile;
            if (req.query.agentEmail) searchKeyValue.emailid = req.query.agentEmail;

            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) {
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            }

            if (req.query.startDate) searchKeyValue.start_date = req.query.startDate;
            if (req.query.endDate) searchKeyValue.end_date = req.query.endDate;

            if (req.query.operator_uuid) {
                const operator = await commonQueryCommon.getOperatorById(req.query.operator_uuid);
                if (!operator || operator.length === 0) {
                    return res.status(400).json({ errors: [{ msg: 'operator id not found' }] });
                }
                searchKeyValue.operator_id = operator[0].operator_id;
            }

            if (req.query.status) {
                if (req.query.status == 4) {
                    searchKeyValue.rollback_status = 3;
                } else {
                    searchKeyValue.status = req.query.status;
                }
            }

            const now = new Date();
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
            const fileName = `Downline_topup_report_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const fileAgeMs = Date.now() - stats.mtimeMs;
                if (fileAgeMs < 30 * 60 * 1000) {
                    return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
                }
            }

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Downline TopUp Report');
            const perPage = 1000;
            let page = 1;
            let isFirstBatch = true;

            while (true) {
                const offset = (page - 1) * perPage;
                const chunk = await rechargeModel.agentDownlineTopUpReport(searchKeyValue, perPage, offset);
                if (!chunk.length) break;

                if (isFirstBatch) {
                    sheet.columns = Object.keys(chunk[0]).map(key => ({ header: key, key }));
                    isFirstBatch = false;
                }

                sheet.addRows(chunk);
                if (chunk.length < perPage) break;
                page++;
            }

            await workbook.xlsx.writeFile(filePath);
            fs.chmodSync(filePath, 0o644);

            setTimeout(() => {
                fs.access(filePath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        fs.unlink(filePath, err => {
                            if (err) console.error('Error deleting file:', filePath, err);
                            else console.log('Deleted file:', fileName);
                        });
                    } else {
                        console.warn('File already deleted or missing:', filePath);
                    }
                });
            }, 30 * 60 * 1000);

            const downloadUrl = `/api/v1/recharge/admin-report/files/${fileName}`;
            res.json({ success: true, downloadUrl });

        } catch (error) {
            console.error('agentDownlineTopUpReport', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };


    agentTelcoTopUpreport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/agentTelcoTopUpReport',JSON.stringify(req.body), JSON.stringify(req.query))
            // search paremeters
            var searchKeyValue = {};

            // check date for start and end 
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

           if (req.query.startDate) {
            searchKeyValue.start_date = req.query.startDate; // user-provided start date
            } else {
            // Default: 30 days ago from today
            const start = new Date();
            start.setDate(start.getDate() - 30);
            searchKeyValue.start_date = start.toISOString().split('T')[0];
            }

            if (req.query.endDate) {
            searchKeyValue.end_date = req.query.endDate; // user-provided end date
            } else {
            // Default: today
            const end = new Date();
            searchKeyValue.end_date = end.toISOString().split('T')[0];
            }

            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce1[0].operator_id
            }
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search paremeters" }] });

            let searchResult = await rechargeModel.agentTelcoTopUpreport(searchKeyValue)

            let totalSum = {
                operatorName: 'Total',
                successTopupAmount: 0,
                successToupUpCount: 0,
                failedTopupAmount: 0,
                failedToupUpCount: 0
            }

            let finalResult = searchResult.map((result) => {
                let { successTopupAmount, failedTopupAmount, successToupUpCount, failedToupUpCount, pendingTopupAmount, pendingToupUpCount, ...other } = result
                other.successTopupAmount = successTopupAmount ? successTopupAmount : 0
                other.successToupUpCount = successToupUpCount ? successToupUpCount : 0
                // other.failedTopupAmount = failedTopupAmount ? failedTopupAmount : 0
                // other.failedToupUpCount = failedToupUpCount ? failedToupUpCount : 0
                other.failedTopupAmount = 0
                other.failedToupUpCount = 0

                totalSum.successTopupAmount = totalSum.successTopupAmount + other.successTopupAmount
                totalSum.successToupUpCount = totalSum.successToupUpCount + other.successToupUpCount
                // totalSum.failedTopupAmount = totalSum.failedTopupAmount + failedTopupAmount
                // totalSum.failedToupUpCount = totalSum.failedToupUpCount + failedToupUpCount

                return other
            })
            finalResult.push(totalSum)

            // if ( !req.query.startDate || !req.query.endDate ) {
            //     return res.status(400).json({ errors: [ {msg : 'missing dare range'}] });
            // }

            // const lisResponse = await sqlQuery.searchQuery(this.tableName25,{
            //     between : {
            //         key : 'created_on',
            //         value : [req.query.startDate, req.query.endDate]
            //     }
            // },
            //     [
            //     'SUM(op_1_sum)','SUM(op_1_cou)',
            //     'SUM(op_2_sum)','SUM(op_2_cou)',
            //     'SUM(op_3_sum)','SUM(op_3_cou)',
            //     'SUM(op_4_sum)','SUM(op_4_cou)',
            //     'SUM(op_5_sum)','SUM(op_5_cou)',
            //     'SUM(op_total_sum)','SUM(op_total_cou)'
            // ],'id','desc',1,0)

            // let finalResult = [
            //     {
            //         "operatorName": "Salaam",
            //         "successTopupAmount": lisResponse?.[0]?.['SUM(op_1_sum)'] | 0,
            //         "successToupUpCount": lisResponse?.[0]?.['SUM(op_1_cou)'] | 0,
            //         "failedTopupAmount": 0,
            //         "failedToupUpCount": 0
            //     },
            //     {
            //         "operatorName": "AWCC",
            //         "successTopupAmount": lisResponse?.[0]?.['SUM(op_2_sum)'] | 0,
            //         "successToupUpCount": lisResponse?.[0]?.['SUM(op_2_cou)'] | 0,
            //         "failedTopupAmount": 0,
            //         "failedToupUpCount": 0
            //     },
            //     {
            //         "operatorName": "MTN",
            //         "successTopupAmount": lisResponse?.[0]?.['SUM(op_3_sum)'] | 0,
            //         "successToupUpCount": lisResponse?.[0]?.['SUM(op_3_cou)'] | 0,
            //         "failedTopupAmount": 0,
            //         "failedToupUpCount": 0
            //     },
            //     {
            //         "operatorName": "Etisalat",
            //         "successTopupAmount": lisResponse?.[0]?.['SUM(op_4_sum)'] | 0,
            //         "successToupUpCount": lisResponse?.[0]?.['SUM(op_4_cou)'] | 0,
            //         "failedTopupAmount": 0,
            //         "failedToupUpCount": 0
            //     },
            //     {
            //         "operatorName": "Roshan",
            //         "successTopupAmount": lisResponse?.[0]?.['SUM(op_5_sum)'] | 0,
            //         "successToupUpCount": lisResponse?.[0]?.['SUM(op_5_cou)'] | 0,
            //         "failedTopupAmount": 0,
            //         "failedToupUpCount": 0
            //     },
            //     {
            //         "operatorName": "Total",
            //         "successTopupAmount": lisResponse?.[0]?.['SUM(op_total_sum)'] | 0,
            //         "successToupUpCount": lisResponse?.[0]?.['SUM(op_total_cou)'] | 0,
            //         "failedTopupAmount": 0,
            //         "failedToupUpCount": 0
            //     }
            // ]

            res.status(200).send(finalResult)

        } catch (error) {
            console.error('agentTelcoTopUpreport', error);
            res.status(200).send([{}])
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // commission reports
    // admin commission reports
    agentCommissionReport = async (req, res) => {
        try {
            // verify req body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/agentCommissionReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            // search param limit and offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // get operator list
            const listOperator = await commonQueryCommon.getAllAgentType()
            if (listOperator.length == 0) return res.status(400).json({ errors: "Operator id not found" });

            var listOperatorId = listOperator.map((result) => {
                return result.agent_type_name
            })

            // optional search paremeters
            var searchKeyValue = {
                // region_ids : req.body.user_detials.region_list.join(','), //str
                // status : 2
                Active: 1
            }
            if (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if (req.body.user_detials.region_list.length != 7) {
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            } else {
                searchKeyValue.child_ids = req.body.user_detials.child_list.join(',');
            }
            // if (req.query.userId) searchKeyValue.username = req.query.userId;
            if (req.query.userId) {
                const userId = req.query.userId;
                searchKeyValue.username = userId.startsWith("AFP-") ? userId : `AFP-${userId}`;
            }
            if (req.query.userName) searchKeyValue.full_name = req.query.userName;
            if (req.query.agent_type_uuid) {
                const lisResponce1 = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid)
                if (lisResponce1.length == 0) return res.status(400).json({ errors: "Agent type id not found" });
                searchKeyValue.usertype_id = lisResponce1[0].agent_type_id
            }
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate //dt end date
            }
            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce1[0].operator_id
            }

            // check search paremeters
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search paremeters" }] });

            const lisTotalRecords = await rechargeModel.agentCommissionReportCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // search paremters
            const lisResponce2 = await rechargeModel.agentCommissionReport(searchKeyValue, limit, offset)
            // if(lisResponce2.length == 0) return res.status(204).send({ message:"commission list not found"})

            var finalResult = lisResponce2.map((result) => {
                var { usertype_id, ...other } = result
                other.userType = listOperatorId[usertype_id - 1]
                return other
            })

            // final result
            // res.status(200).send(finalResult)

            if (req.query.pageNumber == 0) {
                res.status(200).send(finalResult)
            } else {
                res.status(200).send({
                    reportList: finalResult,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: lisTotalRecords[0].totalAmount || 0,
                    totalDeductAmount: lisTotalRecords[0].totalDeductAmount || 0,
                    totalCommissionAmount: lisTotalRecords[0].totalCommissionAmount || 0
                })
            }

        } catch (error) {
            console.error('agentCommissionReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: 0,
                    totalDeductAmount: 0,
                    totalCommissionAmount: 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    downloadAgentCommissionReport = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if (!req.query.pageNumber) req.query.pageNumber = 0;

            const listAgentType = await commonQueryCommon.getAllAgentType();
            if (listAgentType.length === 0) return res.status(400).json({ errors: "Agent type list not found" });

            const agentTypeMap = listAgentType.map(item => item.agent_type_name);

            let searchKeyValue = { Active: 1 };

            if (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) {
                if (req.body.user_detials.region_list.length !== 7) {
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                }
            } else {
                searchKeyValue.child_ids = req.body.user_detials.child_list.join(',');
            }

            if (req.query.userId) {
                const userId = req.query.userId;
                searchKeyValue.username = userId.startsWith("AFP-") ? userId : `AFP-${userId}`;
            }

            if (req.query.userName) searchKeyValue.full_name = req.query.userName;

            if (req.query.agent_type_uuid) {
                const agentTypeRes = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid);
                if (!agentTypeRes || agentTypeRes.length === 0) return res.status(400).json({ errors: "Agent type not found" });
                searchKeyValue.usertype_id = agentTypeRes[0].agent_type_id;
            }

            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) {
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            }

            if (req.query.startDate) searchKeyValue.start_date = req.query.startDate;
            if (req.query.endDate) searchKeyValue.end_date = req.query.endDate;

            if (req.query.operator_uuid) {
                const operator = await commonQueryCommon.getOperatorById(req.query.operator_uuid);
                if (!operator || operator.length === 0) return res.status(400).json({ errors: [{ msg: "Operator not found" }] });
                searchKeyValue.operator_id = operator[0].operator_id;
            }

            if (Object.keys(searchKeyValue).length === 0) return res.status(400).json({ errors: [{ msg: "Improper search parameters" }] });

            const lisTotalRecords = await rechargeModel.agentCommissionReportCount(searchKeyValue);
            const totalRecords = Number(lisTotalRecords[0].count);
            const pageLimit = Number(process.env.PER_PAGE_COUNT);
            const totalPages = totalRecords % pageLimit === 0 ? totalRecords / pageLimit : Math.floor(totalRecords / pageLimit) + 1;

            const offset = req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * pageLimit : 0;
            const limit = req.query.pageNumber > 0 ? pageLimit : totalRecords;

            const resultData = await rechargeModel.agentCommissionReport(searchKeyValue, limit, offset);

            const finalResult = resultData.map((row) => {
                const { usertype_id, ...rest } = row;
                return {
                    ...rest,
                    userType: agentTypeMap[usertype_id - 1] || 'Unknown'
                };
            });

            // ✅ Report Download Logic
            if (req.query.pageNumber == 0) {
                const now = new Date();
                const dateStr = new Date().toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
                const fileName = `agent_commission_report_${dateStr}_${timeStr}.xlsx`;
                const filePath = path.join(REPORT_DIR, fileName);

                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    if (Date.now() - stats.mtimeMs < 30 * 60 * 1000) {
                        return res.status(200).json({ success: true, downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}` });
                    }
                }

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Agent Commission Report');

                if (finalResult.length > 0) {
                    worksheet.columns = Object.keys(finalResult[0]).map(key => ({
                        header: key,
                        key: key,
                        width: key.length < 20 ? 20 : key.length + 5
                    }));
                    worksheet.addRows(finalResult);
                }

                await workbook.xlsx.writeFile(filePath);
                fs.chmodSync(filePath, 0o644);

                setTimeout(() => {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Failed to delete report:', fileName);
                    });
                }, 30 * 60 * 1000);

                return res.status(200).json({
                    success: true,
                    downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`
                });
            }

            // ✅ Paginated JSON Response
            return res.status(200).json({
                reportList: finalResult,
                totalRepords: totalRecords,
                pageCount: totalPages,
                currentPage: Number(req.query.pageNumber),
                pageLimit: pageLimit,
                totalAmount: lisTotalRecords[0].totalAmount || 0,
                totalDeductAmount: lisTotalRecords[0].totalDeductAmount || 0,
                totalCommissionAmount: lisTotalRecords[0].totalCommissionAmount || 0
            });

        } catch (error) {
            console.error('agentCommissionReport error:', error);

            if (req.query.pageNumber == 0) {
                return res.status(200).send([{}]);
            } else {
                return res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalAmount: 0,
                    totalDeductAmount: 0,
                    totalCommissionAmount: 0
                });
            }
        }
    };




    adminCommissionReport = async (req, res) => {
        try {
            // verify req body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/adminCommissionReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            // search param limit and offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // optional search paremeters
            var searchKeyValue = {}
            if (req.query.agentId) searchKeyValue.username = req.query.agentId;
            if (req.query.agnetName) searchKeyValue.full_name = req.query.agnetName;
            // date range
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate //dt end date
            }
            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce1[0].operator_id
            }
            if (req.query.agent_type_uuid) {
                const lisResponce1 = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid)
                if (lisResponce1.length == 0) return res.status(400).json({ errors: "Agent type id not found" });
                searchKeyValue.usertype_id = lisResponce1[0].agent_type_id
            }

            // check search paremeters
            if (Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [{ msg: "Improper search paremeters" }] });

            const lisTotalRecords = await rechargeModel.adminCommissionReportCount(searchKeyValue, req.body.user_detials.userid)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // search using recharge model
            const lisresponce2 = await rechargeModel.adminCommissionReport(searchKeyValue, req.body.user_detials.userid, limit, offset)
            // if(lisresponce2.length == 0) return res.status(204).send({message : 'no commission report found'})

            // search user type list
            const lisresponce3 = await commonQueryCommon.getAllAgentType()
            if (lisresponce3.length == 0) return res.status(400).json({ errors: "agent type list not found" });
            var lisAgentType = lisresponce3.map((result) => {
                return result.agent_type_name
            })

            // // search operator list
            //     const lisResponce4 = await commonQueryCommon.getAllOperatorWithId()
            //     if(lisResponce4.length == 0) return res.status(400).json({ errors: "operator list not found" });
            //     var lisOperator = lisResponce4.map((result)=>{
            //         return result.operator_id
            //     })

            // add operator id and user type name
            var finalResult = lisresponce2.map((result) => {
                var { usertype_id, ...other } = result
                other.userType = lisAgentType[usertype_id - 1]
                return other
            })

            // send responce to frontend
            // res.status(200).send(finalResult)
            if (req.query.pageNumber == 0) {
                res.status(200).send(finalResult)
            } else {
                res.status(200).send({
                    reportList: finalResult,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalRechargeAmount: lisTotalRecords[0].totalRechargeAmount,
                    totalCommAmount: lisTotalRecords[0].totalCommAmount
                })
            }

        } catch (error) {
            console.error('adminCommissionReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalRechargeAmount: 0,
                    totalCommAmount: 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }


    adminDownloadCommissionReport = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            if (!req.query.pageNumber) req.query.pageNumber = 0;

            let searchKeyValue = { Active: 1 };
            if (req.query.agentId) searchKeyValue.username = req.query.agentId;
            if (req.query.agnetName) searchKeyValue.full_name = req.query.agnetName;

            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) {
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            }
            if (req.query.startDate) searchKeyValue.start_date = req.query.startDate;
            if (req.query.endDate) searchKeyValue.end_date = req.query.endDate;

            if (req.query.operator_uuid) {
                const operator = await commonQueryCommon.getOperatorById(req.query.operator_uuid);
                if (!operator || operator.length === 0) return res.status(400).json({ errors: [{ msg: "Operator not found" }] });
                searchKeyValue.operator_id = operator[0].operator_id;
            }

            if (req.query.agent_type_uuid) {
                const agentType = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid);
                if (!agentType || agentType.length === 0) return res.status(400).json({ errors: [{ msg: "Agent type not found" }] });
                searchKeyValue.usertype_id = agentType[0].agent_type_id;
            }

            if (Object.keys(searchKeyValue).length === 0) {
                return res.status(400).json({ errors: [{ msg: "Improper search parameters" }] });
            }

            const userId = req.body.user_detials.userid;
            const lisTotalRecords = await rechargeModel.adminCommissionReportCount(searchKeyValue, userId);
            const totalRecords = Number(lisTotalRecords[0].count);
            const pageLimit = Number(process.env.PER_PAGE_COUNT);
            const totalPages = totalRecords % pageLimit === 0 ? totalRecords / pageLimit : Math.floor(totalRecords / pageLimit) + 1;

            const offset = req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * pageLimit : 0;
            const limit = req.query.pageNumber > 0 ? pageLimit : totalRecords;

            const results = await rechargeModel.adminCommissionReport(searchKeyValue, userId, limit, offset);
            const agentTypes = await commonQueryCommon.getAllAgentType();

            const finalResult = results.map(row => {
                const { usertype_id, ...rest } = row;
                return {
                    ...rest,
                    userType: agentTypes[usertype_id - 1]?.agent_type_name || "Unknown"
                };
            });

            // ✅ Download Report Generation
            if (req.query.pageNumber == 0) {
                const now = new Date();
                const dateStr = new Date().toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
                const fileName = `admin_commission_report_${dateStr}_${timeStr}.xlsx`;
                const filePath = path.join(REPORT_DIR, fileName);

                // Use cached file if exists and not expired
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    if (Date.now() - stats.mtimeMs < 30 * 60 * 1000) {
                        return res.status(200).json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
                    }
                }

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Admin Commission Report');

                if (finalResult.length > 0) {
                    worksheet.columns = Object.keys(finalResult[0]).map(key => ({
                        header: key,
                        key: key,
                        width: key.length < 20 ? 20 : key.length + 5
                    }));
                    worksheet.addRows(finalResult);
                }

                await workbook.xlsx.writeFile(filePath);
                fs.chmodSync(filePath, 0o644);

                // Delete after 30 minutes
                setTimeout(() => {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Failed to delete report:', fileName);
                    });
                }, 30 * 60 * 1000);

                return res.status(200).json({
                    success: true,
                    downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}`
                });
            }

            // ✅ Paginated Response
            return res.status(200).json({
                reportList: finalResult,
                totalRepords: totalRecords,
                pageCount: totalPages,
                currentPage: Number(req.query.pageNumber),
                pageLimit: pageLimit,
                totalRechargeAmount: lisTotalRecords[0].totalRechargeAmount || 0,
                totalCommAmount: lisTotalRecords[0].totalCommAmount || 0
            });

        } catch (error) {
            console.error('adminCommissionReport error:', error);

            // if (req.query.pageNumber == 0) {
            //     return res.status(200).send([{}]);
            // } else {
            //     return res.status(200).json({
            //         reportList: [{}],
            //         totalRepords: 0,
            //         pageCount: 0,
            //         currentPage: Number(req.query.pageNumber),
            //         pageLimit: Number(process.env.PER_PAGE_COUNT),
            //         totalRechargeAmount: 0,
            //         totalCommAmount: 0
            //     });
            // }
        }
    };
    // agent panel commission report
    commissionReport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/commissionReport',JSON.stringify(req.body), JSON.stringify(req.query))
            // limit offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            if (!req.query.pageNumber) req.query.pageNumber = 0

            // optional search paremeters
            var searchKeyValue = {
                userid: req.body.user_detials.userid
            }
            if (req.query.topUpMobile) searchKeyValue.mobile_number = req.query.topUpMobile
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate //dt end date
            }
            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                searchKeyValue.operator_id = lisResponce1[0].operator_id
            }

            // chceck search parme
            // if(Object.keys(searchKeyValue).length == 1) return res.status(400).json({ errors: [ {msg : "Improper search paremeters"}] }); 

            let key = ['COUNT(1) AS count', 'amount AS totalTopUpAmount', "SUM(comm_amt) AS totalCommissionAmount"]
            const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, key, "id", "DESC")

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // search using recharge model
            key = ["operator_name AS operatorName", "mobile_number AS topUpMobile", "amount AS topUpAmount", "closing_balance", "comm_amt", "CAST(created_on AS CHAR(20)) AS date"]

            const lisResponce2 = await sqlQueryReplica.searchQueryTimeout(this.tableName1, searchKeyValue, key, "id", "DESC", limit, offset)
            if (lisResponce2.length == 0) return res.status(204).send({ message: "no transaction found" })

            var finalResult = lisResponce2.map((result) => {
                var { topUpAmount, closing_balance, comm_amt, ...other } = result
                other.walletBalance = Number(closing_balance) + Number(topUpAmount)
                other.topUpAmount = topUpAmount
                other.commEarned = comm_amt
                other.closingBalance = closing_balance
                return other
            })

            if (req.query.pageNumber == 0) {
                res.status(200).send(finalResult)
            } else {
                res.status(200).send({
                    reportList: finalResult,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    totalTopupAmount: lisTotalRecords[0].totalTopUpAmount || 0,
                    totalCommissionAmount: lisTotalRecords[0].totalCommissionAmount || 0,
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                })
            }

        } catch (error) {
            console.error('commissionReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    totalTopupAmount: 0,
                    totalCommissionAmount: 0,
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    // agent panel commission report
    commissionReportSum = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/commissionReportSum',JSON.stringify(req.body), JSON.stringify(req.query))
            let finalResult = {
                total: 1451,
                daily: 140,
                weekly: 1450,
                monthly: 2050,
                Yearly: 3500,
            }

            // send responce to front end
            res.status(200).send(finalResult)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [{ msg: error.message }] });
        }
    }

    // agent top ranking report 
    topRankingReport = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/topRankingReport',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            let searchKeyValue = {
                status: 2,
                isIn: {
                    key: 'operator_id',
                    value: [1, 2, 3, 4, 5]
                }
            }
            let operatorName = 'All operator'
            // get all operator ids
            if (req.query.operator_uuid) {
                const lisResponce1 = await commonQueryCommon.getOperatorById(req.query.operator_uuid)
                if (lisResponce1 == 0) return res.status(400).json({ errors: [{ msg: "operator id not found" }] });
                // operatorList = [{
                //     operator_id : lisResponce1[0].operator_id,
                //     operator_name : lisResponce1[0].operator_name
                // }]
                // if(operatorList.includes(lisResponce1[0].operator_id)){
                //     operatorList = string(lisResponce1[0].operator_id)
                // }
                operatorName = lisResponce1[0].operator_name
                searchKeyValue.isIn.value = [lisResponce1[0].operator_id]
            }
            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.startDate) {
                searchKeyValue.start_date = req.query.startDate //dt start date
            }
            if (req.query.endDate) {
                searchKeyValue.end_date = req.query.endDate //dt end date
            }

            if (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if (req.body.user_detials.region_list.length != 7) {
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            } else {
                searchKeyValue.child_ids = req.body.user_detials.child_list.join(',');
            }

            let lisTotalRecords = await rechargeModel.topRankingReportCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords.length)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            let finalResult = await rechargeModel.topRankingReport(searchKeyValue, limit, offset)

            finalResult = finalResult.map((details) => {
                details.operatorName = operatorName
                return details
            })

            if (req.query.pageNumber == 0) {
                res.status(200).send(finalResult)
            } else {
                res.status(200).send({
                    reportList: finalResult,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                })
            }


            // res.status(200).send(finalList)

        } catch (error) {
            console.error('topRankingReport', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT)
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }


    downloadTopRankingReport = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            if (!req.query.pageNumber) req.query.pageNumber = 0;

            let searchKeyValue = {
                status: 2,
                isIn: {
                    key: 'operator_id',
                    value: [1, 2, 3, 4, 5]
                }
            };

            let operatorName = 'All operator';

            if (req.query.operator_uuid) {
                const operatorInfo = await commonQueryCommon.getOperatorById(req.query.operator_uuid);
                if (!operatorInfo || operatorInfo.length === 0)
                    return res.status(400).json({ errors: [{ msg: 'Operator ID not found' }] });

                searchKeyValue.isIn.value = [operatorInfo[0].operator_id];
                operatorName = operatorInfo[0].operator_name;
            }

            if ((req.query.startDate && !req.query.endDate) || (req.query.endDate && !req.query.startDate)) {
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });
            }

            if (req.query.startDate) searchKeyValue.start_date = req.query.startDate;
            if (req.query.endDate) searchKeyValue.end_date = req.query.endDate;

            const user = req.body.user_detials;
            if (user.type === roles.Admin || user.type === roles.SubAdmin) {
                if (user.region_list.length !== 7) {
                    searchKeyValue.region_ids = user.region_list.join(',');
                }
            } else {
                searchKeyValue.child_ids = user.child_list.join(',');
            }

            const totalRecordsList = await rechargeModel.topRankingReportCount(searchKeyValue);
            const intTotlaRecords = totalRecordsList.length;
            const pageLimit = Number(process.env.PER_PAGE_COUNT);
            const intPageCount = intTotlaRecords % pageLimit === 0
                ? intTotlaRecords / pageLimit
                : Math.floor(intTotlaRecords / pageLimit) + 1;

            const offset = req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * pageLimit : 0;
            const limit = req.query.pageNumber > 0 ? pageLimit : intTotlaRecords;

            let finalResult = await rechargeModel.topRankingReport(searchKeyValue, limit, offset);
            finalResult = finalResult.map(row => ({
                ...row,
                operatorName
            }));

            // ✅ Paginated response
            if (req.query.pageNumber > 0) {
                return res.status(200).json({
                    reportList: finalResult,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit
                });
            }

            // ✅ Downloadable Excel report
            const now = new Date();
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
            const fileName = `Top_Ranking_Agent_topup_report_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (Date.now() - stats.mtimeMs < 30 * 60 * 1000) {
                    return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
                }
            }

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Top Ranking Report');

            if (finalResult.length > 0) {
                sheet.columns = Object.keys(finalResult[0]).map(key => ({
                    header: key,
                    key,
                    width: key.length < 20 ? 20 : key.length + 5
                }));
                sheet.addRows(finalResult);
            }

            await workbook.xlsx.writeFile(filePath);
            fs.chmodSync(filePath, 0o644);

            setTimeout(() => {
                fs.access(filePath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        fs.unlink(filePath, err => {
                            if (err) console.error('Error deleting file:', filePath, err);
                            else console.log('Deleted file:', fileName);
                        });
                    }
                });
            }, 30 * 60 * 1000); // 30 minutes

            return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });

        } catch (error) {
            console.error('topRankingReport error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };


    // group top up report
    groupTopUpReportByGroupId = async (req, res) => {
        try {
            // body and query validators
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('recharge/groupTopUpReportByGroupId',JSON.stringify(req.body), JSON.stringify(req.query))
            if (!req.query.pageNumber) req.query.pageNumber = 0

            // limit and offset
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // search goup id
            const groupId = await sqlQueryReplica.searchQueryTimeout(this.tableName10, { group_uuid: req.query.group_uuid, active: 1 }, ['group_id'], 'group_id', 'ASC', 1, 0)
            if (groupId.length == 0) return res.status(400).json({ errors: [{ msg: 'group not found' }] });

            // search recharge list
            var searchKeyValue = {
                group_topup_id: groupId[0].group_id
            }
            var key = ['trans_number AS txnId', 'operator_name AS operatorName', 'mobile_number AS mobileNumber', 'amount AS rechargeAmount', 'deduct_amt AS deductedAmount', 'operator_balance AS apiBalance', 'CAST(created_on AS CHAR(20)) AS txnDate', 'ap_transid AS operTxnId', 'status AS txnStatus', 'rollback_status AS rollbackStatus', 'gcm_id AS txnMode', 'api_type AS apiType']

            const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimitTimeout(this.tableName1, searchKeyValue, ['COUNT(1) AS count', 'SUM(amount) AS totalRechargeAmount', 'SUM(deduct_amt) AS totalDeductedAmount'], 'id', 'DESC')

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = (intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            const rechargeList = await sqlQueryReplica.searchQueryTimeout(this.tableName1, searchKeyValue, key, 'id', 'DESC', limit, offset)
            if (rechargeList.length == 0) return res.status(204).send({ message: 'no data to show' })

            var finalResult = rechargeList.map((recharge) => {
                var { apiBalance, txnStatus, rollbackStatus, ...other } = recharge;
                other.txnStatus = txnStatus == 1 ? "Pending" : txnStatus == 2 ? "Success" : (rollbackStatus == 3 ? "Complete" : "Failed")
                other.apiBalance = apiBalance == "NA" ? null : apiBalance
                return other
            })

            if (req.query.pageNumber == 0) {
                res.status(200).send(finalResult)
            } else {
                res.status(200).send({
                    reportList: finalResult,
                    totalRepords: intTotlaRecords,
                    pageCount: intPageCount,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalRechargeAmount: lisTotalRecords[0].totalRechargeAmount || 0,
                    totalDeductedAmount: lisTotalRecords[0].totalDeductedAmount || 0
                })
            }

            // res.status(200).send(finalResult)

        } catch (error) {
            console.error('groupTopUpReportByGroupId', error);
            if (req.query.pageNumber == 0) {
                res.status(200).send([{}])
            } else {
                res.status(200).send({
                    reportList: [{}],
                    totalRepords: 0,
                    pageCount: 0,
                    currentPage: Number(req.query.pageNumber),
                    pageLimit: Number(process.env.PER_PAGE_COUNT),
                    totalRechargeAmount: 0,
                    totalDeductedAmount: 0
                })
            }
            // return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    responceUpdateRoshan = async (req, res) => {
        try {
            // update req,res in table
            let keyValue = {
                concat: {
                    key: 'top_up_response',
                    value: " " + req.body.rechargeRequest,
                },
                concat1: {
                    key: 'top_up_response',
                    value: " " + req.body.rechargeResponce,
                },
            }

            let updateResponce = await sqlQuery.updateQuery(this.tableName19, keyValue, { recharge_id: req.body.rechargeId })

            var { affectedRows, changedRows, info } = updateResponce;
            const message = !affectedRows ? 'Update Successfull' :
                affectedRows && changedRows ? 'Update Successfull' : 'Recharge Id not found';

            res.send({ message });

        } catch (error) {

        }
    }

}

async function dataBaseId(date) {
    // console.log(date)

    let randomNumber = await redisMaster.incr('RECH_RANDUM_ID')
    if (randomNumber < 100) {
        await redisMaster.post('RECH_RANDUM_ID', 100)
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

    if (randomNumber > 900) {
        await redisMaster.post('RECH_RANDUM_ID', 100)
    }

    return id
}

function pad2(n) { return n < 10 ? '0' + n : n }

let rechargeControllerObj = new rechargeController();
module.exports = rechargeControllerObj
