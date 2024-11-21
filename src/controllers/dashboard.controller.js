const { validationResult } = require('express-validator');
const role = require('../utils/userRoles.utils')

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const commonQueryCommon = require('../common/commonQuery.common');

const dashboardModel = require('../models/dashboard.model')

const summerReportModule = require('../models/summery.module')

class dshboardController {
    _tableName1 = 'er_login'
    _tableName2 = 'er_wallet'
    _tableName3 = 'er_wallet_transaction'
    _tableName4 = 'er_recharge'
    _tableName5 = 'er_commission_amount'
    _tableName6 = 'er_mno_details'
    _tableName7 = 'er_daily_user_summery'
    _tableName8 = 'er_daily_topup_summery'

    adminDashBoardStatus = async (req,res) => {
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/adminDashboardStatus',JSON.stringify(req.body), JSON.stringify(req.query))
                let adminCurrentBalance, agentCurrentBalance, totalIncome, totalRegAgent, todayRegAgent, monthlyRegAgent

            // admin current balance
                const listAdminCurrentBalance = await sqlQueryReplica.searchQuery(this._tableName2,{user_uuid : req.body.user_detials.user_uuid},['ex_wallet','comm_wallet'],'userid','ASC',1,0)
                if(listAdminCurrentBalance.length == 0) {
                    adminCurrentBalance = 0, 
                    totalCount = 0
                }
                else {
                    adminCurrentBalance = listAdminCurrentBalance[0].ex_wallet ? listAdminCurrentBalance[0].ex_wallet : 0
                    totalIncome = listAdminCurrentBalance[0].comm_wallet ? listAdminCurrentBalance[0].comm_wallet : 0
                }
            
            // get e money balance
                const eMoneyBalance = await sqlQueryReplica.searchQueryNoLimit(this._tableName6,{status : 1},['SUM(current_balance) as adminCurrentBalance'],'id','ASC')
                if(eMoneyBalance.length == 0) adminCurrentBalance = 0
                else adminCurrentBalance = eMoneyBalance[0].adminCurrentBalance
                
            // all agent Balance
                const listAgentBalance = await dashboardModel.allAgentBalance(req.body.user_detials.userid)
                if(listAgentBalance.length == 0) agentCurrentBalance = 0
                else agentCurrentBalance = listAgentBalance[0].totalBalance ? listAgentBalance[0].totalBalance : 0

            // total income 
                // const listTotalIncome = await dashboardModel.totalIncome(req.body.user_detials.userid)
                // // console.log(listTotalIncome)
                // if(listTotalIncome.length == 0) totalIncome = 0
                // else totalIncome = listTotalIncome[0].totalIncome ? listTotalIncome[0].totalIncome : 0

            // total registered Agent
                const listTotalRegisteredAgent = await sqlQueryReplica.searchQuery(this._tableName1, {Active : 1, region_ids : req.body.user_detials.region_list}, ['COUNT(userid)'], 'userid', 'ASC', 1,0)
                if(listTotalRegisteredAgent.length == 0) totalRegAgent = 0
                else totalRegAgent = Number(listTotalRegisteredAgent[0]['COUNT(userid)']) > 1 ? Number(listTotalRegisteredAgent[0]['COUNT(userid)']) : 0
            
            // count today registered Agent
                let date = currentDateToString()
                const listTotalTodayRegisteredAgent = await sqlQueryReplica.searchQuery(this._tableName1, {Active : 1, created_on : date, region_ids : req.body.user_detials.region_list}, ['COUNT(userid)'], 'userid', 'ASC', 1,0)
                if(listTotalTodayRegisteredAgent.length == 0) todayRegAgent = 0
                else todayRegAgent = listTotalTodayRegisteredAgent[0]["COUNT(userid)"] ? listTotalTodayRegisteredAgent[0]["COUNT(userid)"] : 0

            // count regiwstered agent this month
                let dateRange = Daterange()
                // console.log(dateRange)
                const listTotalMonthlyRegisteredAgent = await sqlQueryReplica.searchQuery(this._tableName1, {Active : 1, start_date : dateRange[0], end_date : dateRange[1], region_ids : req.body.user_detials.region_list}, ['COUNT(userid)'], 'userid', 'ASC', 1,0)
                if(listTotalMonthlyRegisteredAgent.length == 0) monthlyRegAgent = 0
                else monthlyRegAgent = listTotalMonthlyRegisteredAgent[0]["COUNT(userid)"] ? listTotalMonthlyRegisteredAgent[0]["COUNT(userid)"] : 0

            res.status(200).send({totalIncome, adminCurrentBalance, agentCurrentBalance, totalRegAgent, todayRegAgent, monthlyRegAgent})

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    adminOperatorWiseTopUpAmount = async (req,res) => {
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/adminOperatorWIseTopUpAmount',JSON.stringify(req.body), JSON.stringify(req.query))
                let startDate, endDate;
                startDate = req.query.startDate
                endDate = req.query.endDate

                let operatorWiseTopUpAmount

            // calling moduel 
                // const listOperatorWiseAmount = await dashboardModel.adminOperatorWiseTopUpAmount(startDate, endDate)
                // if(listOperatorWiseAmount.length == 0) operatorWiseTopUpAmount = []
                // else operatorWiseTopUpAmount = listOperatorWiseAmount.map((slae)=>{
                //                             let {totalAmount,...other} = slae
                //                             other.totalAmount = totalAmount ? totalAmount : 0
                //                             return other
                //                         })

                const lisResponse = await sqlQuery.searchQuery(this._tableName8,{
                    between : {
                        key : 'created_on',
                        value : [startDate, endDate]
                    }
                },
                    ['SUM(op_1_sum)','SUM(op_2_sum)','SUM(op_3_sum)','SUM(op_4_sum)','SUM(op_5_sum)'],'id','desc',1,0)
                
                operatorWiseTopUpAmount = [
                    {
                        "operator_name": "Salaam",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_1_sum)'] | 0
                    },
                    {
                        "operator_name": "AWCC",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_2_sum)'] | 0
                    },
                    {
                        "operator_name": "MTN",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_3_sum)'] | 0
                    },
                    {
                        "operator_name": "Etisalat",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_4_sum)'] | 0
                    },
                    {
                        "operator_name": "Roshan",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_5_sum)'] | 0
                    }
                ]

            // send responce 
                res.status(200).send(operatorWiseTopUpAmount)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    adminOperatorWiseTopUpCount = async (req,res) => {
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/adminOperatorWiseTopUpCount',JSON.stringify(req.body), JSON.stringify(req.query))
                let startDate, endDate;
                startDate = req.query.startDate
                endDate = req.query.endDate

                let operatorWiseTopUpCount

            // calling moduel 
                // const listOperatorWiseCount = await dashboardModel.adminOperatorWiseTopUpCount(startDate, endDate)
                // if(listOperatorWiseCount.length == 0) operatorWiseTopUpCount = []
                // else operatorWiseTopUpCount = listOperatorWiseCount.map((slae)=>{
                //                             let {totalCount,...other} = slae
                //                             other.totalCount = totalCount ? totalCount : 0
                //                             return other
                //                         })

                const lisResponse = await sqlQuery.searchQuery(this._tableName8,{
                    between : {
                        key : 'created_on',
                        value : [startDate, endDate]
                    }
                },
                    ['SUM(op_1_cou)','SUM(op_2_cou)','SUM(op_3_cou)','SUM(op_4_cou)','SUM(op_5_cou)'],'id','desc',1,0)
                
                    operatorWiseTopUpCount = [
                    {
                        "operator_name": "Salaam",
                        "totalCount": lisResponse?.[0]?.['SUM(op_1_cou)'] | 0
                    },
                    {
                        "operator_name": "AWCC",
                        "totalCount": lisResponse?.[0]?.['SUM(op_2_cou)'] | 0
                    },
                    {
                        "operator_name": "MTN",
                        "totalCount": lisResponse?.[0]?.['SUM(op_3_cou)'] | 0
                    },
                    {
                        "operator_name": "Etisalat",
                        "totalCount": lisResponse?.[0]?.['SUM(op_4_cou)'] | 0
                    },
                    {
                        "operator_name": "Roshan",
                        "totalCount": lisResponse?.[0]?.['SUM(op_5_cou)'] | 0
                    }
                ]

            // send responce 
                res.status(200).send(operatorWiseTopUpCount)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    adminOperatorWiseCommAmount = async (req,res) => {
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/adminOperatorWiseCommAmount',JSON.stringify(req.body), JSON.stringify(req.query))
            // date range 
                let startDate, endDate;
                startDate = req.query.startDate
                endDate = req.query.endDate

                let operatorWiseCommissionAmount

            // operator wise commission earned
                // const listOperatorWiseCommissionAmount = await dashboardModel.operatorWiseCommissionAmount(startDate, endDate, req.body.user_detials.userid)
                // if(listOperatorWiseCommissionAmount.length == 0) operatorWiseCommissionAmount = []
                // else operatorWiseCommissionAmount = listOperatorWiseCommissionAmount.map((slae)=>{
                //                                     let {totalAmount,...other} = slae
                //                                     other.totalAmount = totalAmount ? totalAmount : 0
                //                                     return other
                //                                 })

                const lisResponse = await sqlQuery.searchQuery(this._tableName7,{
                    userid : req.body.user_detials.userid,
                    between : {
                        key : 'created_on',
                        value : [startDate, endDate]
                    }
                },
                    ['SUM(op_1_comm)','SUM(op_2_comm)','SUM(op_3_comm)','SUM(op_4_comm)','SUM(op_5_comm)'],'id','desc',1,0)
                
                    operatorWiseCommissionAmount = [
                    {
                        "operator_name": "Salaam",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_1_comm)'] | 0
                    },
                    {
                        "operator_name": "AWCC",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_2_comm)'] | 0
                    },
                    {
                        "operator_name": "MTN",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_3_comm)'] | 0
                    },
                    {
                        "operator_name": "Etisalat",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_4_comm)'] | 0
                    },
                    {
                        "operator_name": "Roshan",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_5_comm)'] | 0
                    }
                ]

                res.status(200).send(operatorWiseCommissionAmount)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    adminOperatorWiseCommCount = async (req,res) => {
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/AdminOperatorWiseCommissionCount',JSON.stringify(req.body), JSON.stringify(req.query))
            // date range 
                let startDate, endDate;
                startDate = req.query.startDate
                endDate = req.query.endDate

                let operatorWiseCommissionCount

            // operator wise commission earned
                // const listOperatorWiseCommissionCount = await dashboardModel.operatorWiseCommissionCount(startDate, endDate, req.body.user_detials.userid)
                // if(listOperatorWiseCommissionCount.length == 0) operatorWiseCommissionCount = []
                // else operatorWiseCommissionCount = listOperatorWiseCommissionCount.map((slae)=>{
                //                                     let {totalAmount,...other} = slae
                //                                     other.totalAmount = totalAmount ? totalAmount : 0
                //                                     return other
                //                                 })

                const lisResponse = await sqlQuery.searchQuery(this._tableName7,{
                    userid : req.body.user_detials.userid,
                    between : {
                        key : 'created_on',
                        value : [startDate, endDate]
                    }
                },
                    ['SUM(op_1_com_cou)','SUM(op_2_com_cou)','SUM(op_3_com_cou)','SUM(op_4_com_cou)','SUM(op_5_com_cou)'],'id','desc',1,0)
                
                    operatorWiseCommissionCount = [
                    {
                        "operator_name": "Salaam",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_1_com_cou)'] | 0
                    },
                    {
                        "operator_name": "AWCC",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_2_com_cou)'] | 0
                    },
                    {
                        "operator_name": "MTN",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_3_com_cou)'] | 0
                    },
                    {
                        "operator_name": "Etisalat",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_4_com_cou)'] | 0
                    },
                    {
                        "operator_name": "Roshan",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_5_com_cou)'] | 0
                    }
                ]

                res.status(200).send(operatorWiseCommissionCount)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    adminTopAgentSale = async (req, res) =>{
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/adminTopAgentSale',JSON.stringify(req.body), JSON.stringify(req.query))
            // date range 
                let startDate, endDate, topAgentSale;
                startDate = req.query.startDate
                endDate = req.query.endDate
                let regionId = req.body.user_detials.region_list

            // top 10 agent total sale
                const listTopAgentSale = await dashboardModel.topAgentSale(startDate, endDate, regionId)
                if(listTopAgentSale.length == 0) topAgentSale = []
                topAgentSale = listTopAgentSale.map((sale)=>{
                    let{totalAmount,...other} = sale
                    other.totalAmount = totalAmount ? totalAmount : 0
                    return other
                }) 
                
            // send responce
                res.status(200).send(topAgentSale)
            
        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    adminTopAgentTopUp = async (req, res) =>{
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/AdminTopAgentTopUp',JSON.stringify(req.body), JSON.stringify(req.query))
            // date range 
                let startDate, endDate, topAgentTopUp;
                startDate = req.query.startDate
                endDate = req.query.endDate
                let regionId = req.body.user_detials.region_list

            // top 10 agent total sale
                const listTopAgentTopUp = await dashboardModel.topAgentTopUp(startDate, endDate, regionId)
                if(listTopAgentTopUp.length == 0) topAgentTopUp = []
                topAgentTopUp = listTopAgentTopUp.map((sale)=>{
                    let{totalAmount,...other} = sale
                    other.totalAmount = totalAmount ? totalAmount : 0
                    return other
                }) 
                
            // send responce
                res.status(200).send(topAgentTopUp)
            
        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    agentDashBoardStatus = async (req,res) => {
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/agentDashboardStatus',JSON.stringify(req.body), JSON.stringify(req.query))
                let avaliableBalance, totalTransactions, totalCommission, downlineMember, todayTopup, todayCommission

            // available balance
                const listAvaliableBalance = await sqlQueryReplica.searchQuery(this._tableName2, {userid : req.body.user_detials.userid}, ['ex_wallet','comm_wallet'], 'userid', 'ASC', 1, 0)
                if (listAvaliableBalance.length == 0) {
                    avaliableBalance = 0
                    totalCommission = 0
                }
                else {
                    avaliableBalance = listAvaliableBalance[0].ex_wallet ? listAvaliableBalance[0].ex_wallet : 0
                    totalCommission = listAvaliableBalance[0].comm_wallet ? listAvaliableBalance[0].comm_wallet : 0
                }

            // total transactions
                const listTotalTransaction = await sqlQueryReplica.searchQuery(this._tableName4, {userid : req.body.user_detials.userid}, ['COUNT(userid)'], 'userid', 'ASC', 1, 0)
                if(listTotalTransaction.length == 0) totalTransactions = 0
                else totalTransactions = listTotalTransaction[0]["COUNT(userid)"] ? listTotalTransaction[0]["COUNT(userid)"] : 0

            // downline member count
                const lsitTotalMember = await sqlQueryReplica.searchQueryNoLimit(this._tableName1, { child_ids : req.body.user_detials.child_list ,Active : 1}, ['userid'], 'userid', 'ASC')
                if(lsitTotalMember.length == 0) downlineMember = 0
                else {
                    // let total = await this._countChild(lsitTotalMember,0)
                    // downlineMember = total + lsitTotalMember.length
                    downlineMember = lsitTotalMember.length
                }

                let child_list = req.body.user_detials.child_list
                child_list.push(req.body.user_detials.userid)

            // today top up
                let todayDate = currentDateToString()
                const listTodayTopup = await sqlQueryReplica.searchQuery(this._tableName4,{ child_ids : child_list, status : 2, created_on : todayDate }, ['SUM(amount) AS totalAmount'], 'userid', 'ASC', 1, 0)
                if(listTodayTopup.length == 0) todayTopup = 0
                else todayTopup = listTodayTopup[0]["totalAmount"] ? listTodayTopup[0]["totalAmount"] : 0

            // today commission
                const listTodayCommission = await sqlQueryReplica.searchQuery(this._tableName5, { userid : req.body.user_detials.userid, created_on : todayDate}, ['SUM(commission_amount) AS totalCommission'], 'userid', 'ASC', 1,0)
                // console.log(listTodayCommission)
                if(listTodayCommission.length == 0) todayCommission = 0
                else todayCommission = listTodayCommission[0].totalCommission ? listTodayCommission[0].totalCommission : 0

            res.status(200).send({avaliableBalance, totalTransactions, totalCommission, downlineMember, todayTopup, todayCommission})

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    agentOperatorWiseCommAmount = async (req,res) => {
        try{
            // console.log('agentOperatorWiseCommAmount')

            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/agentOperatorWiseCommAmount',JSON.stringify(req.body), JSON.stringify(req.query))
            // date range 
                let startDate, endDate;
                startDate = req.query.startDate
                endDate = req.query.endDate

                let operatorWiseCommissionAmount

        //     // make agent list 
        //         // let agentList = []
        //         // agentList = await this._getChildList(req.body.user_detials.userid,agentList)
        //         // agentList = agentList.join(' , ')
        //         // console.log(agentList)

        //         // let agentList = req.body.user_detials.child_list
        //         // agentList.push(req.body.user_detials.userid)

        //     // // operator wise commission earned
        //     //     const listOperatorWiseCommissionAmount = await dashboardModel.agentOperatorWiseCommissionAmount(startDate, endDate, agentList)
        //     //     if(listOperatorWiseCommissionAmount.length == 0) operatorWiseCommissionAmount = []
        //     //     else operatorWiseCommissionAmount = listOperatorWiseCommissionAmount.map((slae)=>{
        //     //                                         let {totalAmount,oper1,oper2,oper3,oper4,oper5,...other} = slae
        //     //                                         other.salamAmt = oper1 ? oper1 : 0
        //     //                                         other.awccAmt = oper2 ? oper2 : 0
        //     //                                         other.mtnAmt = oper3 ? oper3 : 0
        //     //                                         other.etisalatAmt = oper4 ? oper4 : 0
        //     //                                         other.roshanAmt = oper5 ? oper5 : 0
        //     //                                         other.totalAmount = totalAmount ? totalAmount : 0
        //     //                                         return other
        //     //                                     })

        //     let listOperatorWiseCommissionAmount = await dashboardModel.agentOperatorWiseCommissionAmount(startDate, endDate, req.body.user_detials.userid)

        // //     let finalResult = [   {
        // //         totalAmount : 0,// salaam
        // //     },
        // //     {
        // //         totalAmount : 0,// Roshan
        // //     },
        // //     {
        // //         totalAmount : 0,// AWCC
        // //     },
        // //     {
        // //         totalAmount : 0,// MTN
        // //     },
        // //     {
        // //         totalAmount : 0,// Etisalat
        // //     },
        // // ]

        // //     listOperatorWiseCommissionAmount.forEach((details)=>{
        // //         let {operator_id, commissionAmount} = details
        // //         if(operator_id == 1) finalResult[0].totalAmount = commissionAmount
        // //         if(operator_id == 2) finalResult[2].totalAmount = commissionAmount
        // //         if(operator_id == 3) finalResult[3].totalAmount = commissionAmount
        // //         if(operator_id == 4) finalResult[4].totalAmount = commissionAmount
        // //         if(operator_id == 5) finalResult[1].totalAmount = commissionAmount
        // //     })

        //     if(listOperatorWiseCommissionAmount.length == 0) listOperatorWiseCommissionAmount = []
        //     else listOperatorWiseCommissionAmount = listOperatorWiseCommissionAmount.map((slae)=>{
        //         let {totalAmount,...other} = slae
        //         other.totalAmount = totalAmount ? totalAmount : 0
        //         return other
        //     })

            const lisResponse = await sqlQuery.searchQuery(this._tableName7,{
                userid : req.body.user_detials.userid,
                between : {
                    key : 'created_on',
                    value : [startDate, endDate]
                }
            },
                ['SUM(op_1_comm)','SUM(op_2_comm)','SUM(op_3_comm)','SUM(op_4_comm)','SUM(op_5_comm)'],'id','desc',1,0)
            
            let listOperatorWiseCommissionAmount = [
                {
                    "operatorName": "Salaam",
                    "totalAmount": lisResponse?.[0]?.['SUM(op_1_comm)'] | 0,
                },
                {
                    "operatorName": "AWCC",
                    "totalAmount": lisResponse?.[0]?.['SUM(op_2_comm)'] | 0
                },
                {
                    "operatorName": "MTN",
                    "totalAmount": lisResponse?.[0]?.['SUM(op_3_comm)'] | 0
                },
                {
                    "operatorName": "Etisalat",
                    "totalAmount": lisResponse?.[0]?.['SUM(op_4_comm)'] | 0
                },
                {
                    "operatorName": "Roshan",
                    "totalAmount": lisResponse?.[0]?.['SUM(op_5_comm)'] | 0
                }
            ]

            res.status(200).send(listOperatorWiseCommissionAmount)

                /*
            [   {
                    totalAmount : , salaam
                },
                {
                    totalAmount : , Roshan
                },
                {
                    totalAmount : , AWCC
                },
                {
                    totalAmount : , MTN
                },
                {
                    totalAmount : , Etisalat
                },
            ]
                */

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    agentOperatorWiseCommissionCount = async (req,res) => {
        try{
            // console.log('agentOperatorWiseTopUpCount')
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/agentOperatorWiseTopUpCount',JSON.stringify(req.body), JSON.stringify(req.query))
                let startDate, endDate;
                startDate = req.query.startDate
                endDate = req.query.endDate

                let operatorWiseTopUpCount

                // let agentList = req.body.user_detials.child_list
                // agentList.push(req.body.user_detials.userid)

            // calling moduel 
                // const listOperatorWiseCount = await dashboardModel.agentOperatorWiseTopUpCount(startDate, endDate, req.body.user_detials.userid)
                // if(listOperatorWiseCount.length == 0) operatorWiseTopUpCount = []
                // else operatorWiseTopUpCount = listOperatorWiseCount.map((slae)=>{
                //                             let {totalCount,...other} = slae
                //                             other.totalAmount = totalCount ? totalCount : 0
                //                             return other
                //                         })

                const lisResponse = await sqlQuery.searchQuery(this._tableName7,{
                    userid : req.body.user_detials.userid,
                    between : {
                        key : 'created_on',
                        value : [startDate, endDate]
                    }
                },
                    ['SUM(op_1_com_cou)','SUM(op_2_com_cou)','SUM(op_3_com_cou)','SUM(op_4_com_cou)','SUM(op_5_com_cou)'],'id','desc',1,0)
                
                    operatorWiseTopUpCount = [
                    {
                        "operatorName": "Salaam",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_1_com_cou)'] | 0
                    },
                    {
                        "operatorName": "AWCC",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_2_com_cou)'] | 0
                    },
                    {
                        "operatorName": "MTN",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_3_com_cou)'] | 0
                    },
                    {
                        "operatorName": "Etisalat",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_4_com_cou)'] | 0
                    },
                    {
                        "operatorName": "Roshan",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_5_com_cou)'] | 0
                    }
                ]

            // send responce 
                res.status(200).send(operatorWiseTopUpCount)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    agentOperatorWiseTopUpCount = async (req,res) => {
        try{
            // console.log('agentOperatorWiseTopUpCount')
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/agentOperatorWiseTopUpCount',JSON.stringify(req.body), JSON.stringify(req.query))
                let startDate, endDate;
                startDate = req.query.startDate
                endDate = req.query.endDate

                let operatorWiseTopUpCount

                let agentList = req.body.user_detials.child_list
                agentList.push(req.body.user_detials.userid)

            // calling moduel 
                // const listOperatorWiseCount = await dashboardModel.agentOperatorWiseTopUpCount(startDate, endDate, req.body.user_detials.userid)
                // if(listOperatorWiseCount.length == 0) operatorWiseTopUpCount = []
                // else operatorWiseTopUpCount = listOperatorWiseCount.map((slae)=>{
                //                             let {totalCount,...other} = slae
                //                             other.totalAmount = totalCount ? totalCount : 0
                //                             return other
                //                         })

                const lisResponse = await sqlQuery.searchQuery(this._tableName7,{
                    IsIn : {
                        key : 'userid',
                        value : agentList},
                    between : {
                        key : 'created_on',
                        value : [startDate, endDate]
                    }
                },
                    ['SUM(op_1_count)','SUM(op_2_count)','SUM(op_3_count)','SUM(op_4_count)','SUM(op_5_count)'],'id','desc',1,0)
                
                    operatorWiseTopUpCount = [
                    {
                        "operatorName": "Salaam",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_1_count)'] | 0
                    },
                    {
                        "operatorName": "AWCC",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_2_count)'] | 0
                    },
                    {
                        "operatorName": "MTN",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_3_count)'] | 0
                    },
                    {
                        "operatorName": "Etisalat",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_4_count)'] | 0
                    },
                    {
                        "operatorName": "Roshan",
                        "totalAmount": lisResponse?.[0]?.['SUM(op_5_count)'] | 0
                    }
                ]

            // send responce 
                res.status(200).send(operatorWiseTopUpCount)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    agnetOperatorWiseTopUpAmount = async (req,res) => {
        try{
            // console.log('agnetOperatorWiseTopUpAmount')
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/agentOperatorWiseTopUpAmount',JSON.stringify(req.body), JSON.stringify(req.query))
                let startDate, endDate;
                startDate = req.query.startDate
                endDate = req.query.endDate

                let operatorWiseTopUpAmount

                let agentList = req.body.user_detials.child_list
                agentList.push(req.body.user_detials.userid)

            // calling moduel 
                // const listOperatorWiseAmount = await dashboardModel.agentOperatorWiseTopUpAmount(startDate, endDate, agentList)
                // if(listOperatorWiseAmount.length == 0) operatorWiseTopUpAmount = []
                // else operatorWiseTopUpAmount = listOperatorWiseAmount.map((slae)=>{
                //                             let {totalAmount,...other} = slae
                //                             other.totalCount = totalAmount ? totalAmount : 0
                //                             return other
                //                         })

                const lisResponse = await sqlQuery.searchQuery(this._tableName7,{
                    IsIn : {
                        key : 'userid',
                        value : agentList},
                    between : {
                        key : 'created_on',
                        value : [startDate, endDate]
                    }
                },
                    ['SUM(op_1_sum)','SUM(op_2_sum)','SUM(op_3_sum)','SUM(op_4_sum)','SUM(op_5_sum)'],'id','desc',1,0)
                
                    operatorWiseTopUpAmount = [
                    {
                        "operatorName": "Salaam",
                        "totalCount": lisResponse?.[0]?.['SUM(op_1_sum)'] | 0
                    },
                    {
                        "operatorName": "AWCC",
                        "totalCount": lisResponse?.[0]?.['SUM(op_2_sum)'] | 0
                    },
                    {
                        "operatorName": "MTN",
                        "totalCount": lisResponse?.[0]?.['SUM(op_3_sum)'] | 0
                    },
                    {
                        "operatorName": "Etisalat",
                        "totalCount": lisResponse?.[0]?.['SUM(op_4_sum)'] | 0
                    },
                    {
                        "operatorName": "Roshan",
                        "totalCount": lisResponse?.[0]?.['SUM(op_5_sum)'] | 0
                    }
                ]

            // send responce
            // console.log(
            //     operatorWiseTopUpAmount
            // ) 
                res.status(200).send(operatorWiseTopUpAmount)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // agentOperatorWiseTopUpCount = async (req,res) => {
    //     try{
    //         // validate body and query 
    //             const errors = validationResult(req);
    //             if (!errors.isEmpty()) {
    //                 return res.status(400).json({ errors: errors.array() });
    //             }

    //             let startDate, endDate;
    //             startDate = req.query.startDate
    //             endDate = req.query.endDate

    //             let operatorWiseTopUpCount

    //         // calling moduel 
    //             const listOperatorWiseCount = await dashboardModel.agentOperatorWiseTopUpCount(startDate, endDate, req.body.user_detials.userid)
    //             if(listOperatorWiseCount.length == 0) operatorWiseTopUpCount = []
    //             else operatorWiseTopUpCount = listOperatorWiseCount.map((slae)=>{
    //                                         let {totalCount,...other} = slae
    //                                         other.totalCount = totalCount ? totalCount : 0
    //                                         return other
    //                                     })

    //         // send responce 
    //             res.status(200).send(operatorWiseTopUpCount)

    //     }catch(error){
    //         console.log(error);
    //         res.status(400).json({ errors: [ {msg : error.message}] });
    //     }
    // }

    agentTopAgentSale = async (req,res) => {
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/agentTopAgentSale',JSON.stringify(req.body), JSON.stringify(req.query))
            // date range 
                let startDate, endDate, topAgentSale;
                startDate = req.query.startDate
                endDate = req.query.endDate

            // make agent list 
                // let agentList = []
                // agentList = await this._getChildList(req.body.user_detials.userid,agentList)
                // agentList = agentList.join(' , ')
                let agentList = req.body.user_detials.child_list
                agentList.push(req.body.user_detials.userid)
                // console.log(agentList)
            
            // top 10 agent total sale
                const listTopAgentSale = await dashboardModel.topAgentSaleParentid(startDate, endDate, agentList)
                if(listTopAgentSale.length == 0) topAgentSale = []
                topAgentSale = listTopAgentSale.map((sale)=>{
                    let{totalAmount,...other} = sale
                    other.totalAmount = totalAmount ? totalAmount : 0
                    return other
                }) 
                
            // send responce
                res.status(200).send(topAgentSale)
            

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    agentTopAgentTopUp = async (req, res) =>{
        try{
            // validate body and query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('dashboard/agentTopAgentTopup',JSON.stringify(req.body), JSON.stringify(req.query))
            // date range 
                let startDate, endDate, topAgentTopUp;
                startDate = req.query.startDate
                endDate = req.query.endDate

            // make agent list 
                // let agentList = []
                // agentList = await this._getChildList(req.body.user_detials.userid,agentList)
                // agentList = agentList.join(' , ')
                let agentList = req.body.user_detials.child_list
                agentList.push(req.body.user_detials.userid)
                // console.log(agentList)

            // top 10 agent total sale
                const listTopAgentTopUp = await dashboardModel.topAgentTopUpParentid(startDate, endDate, agentList)
                if(listTopAgentTopUp.length == 0) topAgentTopUp = []
                topAgentTopUp = listTopAgentTopUp.map((sale)=>{
                    let{totalAmount,...other} = sale
                    other.totalAmount = totalAmount ? totalAmount : 0
                    return other
                }) 
                
            // send responce
                res.status(200).send(topAgentTopUp)
            
        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    _countChild = async (lsitTotalMember,total) => {
        let i = 0, totalCount = 0
        for (i = 0; i < lsitTotalMember.length; i++){
            let listTotalMemberChild = await sqlQueryReplica.searchQueryNoLimit(this._tableName1, {parent_id : lsitTotalMember[i].userid,Active : 1}, ['userid'], 'userid', 'ASC')
            if (listTotalMemberChild.length == 0){
                totalCount = totalCount + 0
            }
            else{
                let childToltal = await this._countChild(listTotalMemberChild,total)
                totalCount =  totalCount + childToltal + total + listTotalMemberChild.length
            }
        }
        return totalCount
    }

    _getChildList = async (userid,childList) => {
        childList.push(userid)
        let listChild, childId, i = 0
        listChild = await sqlQueryReplica.searchQueryNoLimit(this._tableName1, {parent_id : userid,Active : 1}, ['userid'], 'userid', 'ASC')
        if(listChild.length == 0) return childList
        for(i = 0; i<listChild.length; i++){
            childId = listChild[i].userid
            childList = await this._getChildList(childId,childList)
        }
        return childList
    }   
}



function currentDateToString() {
    var varDate = new Date();
    varDate.setHours(varDate.getHours() + 4, varDate.getMinutes() + 30);
    // var isodate = varDate.toISOString();

    let date = varDate
    var mm = date.getMonth() + 1; // getMonth() is zero-based
    var dd = date.getDate();
  
    return [date.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
           ].join('-');
};

function Daterange() {
    var varDate = new Date();
    varDate.setHours(varDate.getHours() + 4, varDate.getMinutes() + 30);    

    let date = varDate
    var mm = date.getMonth() + 1; // getMonth() is zero-based
    var dd = date.getDate() ; // getMonth() is zero-based
  
    return [[date.getFullYear(),(mm>9 ? '' : '0') + mm,'01'].join('-'),
            [date.getFullYear(),(mm>9 ? '' : '0') + mm, dd].join('-')]
};

module.exports = new dshboardController();