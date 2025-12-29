const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const userList = require('../utils/userRoles.utils')

const varRandomString = require('../utils/randomString.utils');
const varEncryptionString = require('../utils/encryption.utils');

const agentModule = require('../models/agent.module')

const checkCommomDetails = require('../common/commonQuery.common')
const sqlQuery = require('../common/sqlQuery.common');
const sqlQueryReplica = require('../common/sqlQueryReplica.common');
const commonQueryCommon = require('../common/commonQuery.common');

const dotenv = require('dotenv');
const path = require('path');

const { toIsoString } = require('../common/timeFunction.common')

// const { sendSms } = require('./function.controller')
const smsFunction = require('../common/smsFunction.common')

// configer env
dotenv.config()

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');

const agentPerModule = require('../models/agentModule.model');

const redisMaster = require('../common/master/radisMaster.common');

// const userLists = require('../utils/userRoles.utils')
const fs = require('fs');
const ExcelJS = require('exceljs');
const REPORT_DIR = '/var/www/html/AFPNewBackendSystem/the_topup_reports';
const AgentsDefaultRights = require('../utils/defaultAgentsRights.utils');

let moduleList =[];

class loginController {
    // table name
    tableName1 = 'er_login' // login table
    tableName2 = 'er_master_region' // region table
    tableName3 = 'er_agent_type' // agent type
    tableName4 = 'er_master_country' // country table
    tableName5 = 'er_master_province' // province table
    tableName6 = 'er_master_district' // district table
    tableName7 = 'er_master_language' // language table
    tableName8 = 'er_postpaid_commission' // postpaid commission
    tableName9 = 'er_slab_manager' // slug manager table
    tableName10 = 'er_prepaid_commission' // prepaid commission table
    tableName11 = 'er_send_marketing_sms' //table to send message
    tableName12 = 'er_deafult_slab' // default slab 
    tableName13 = 'er_login_admin' // admin table
    tableName14 = 'er_wallet' // wallet table
    tableName15 = 'er_agent_modules_permission' // agent module permission table
    tableName16 = 'er_agent_sub_module'
    tableName17 = 'er_agent_stock_transfer_channel'

    constructor () {
        moduleList = AgentsDefaultRights.moduleList;
    }

    // registrationFix = async() => { 

    //     var date = new Date();
    //     date.setHours(date.getHours() + 4, date.getMinutes() + 30);
    //     var isodate = date.toISOString();


    //     let objResult = {
    //         insertId : 4587
    //     }

    //     //9)-search user by id and send uuid
    //     var searchKeyValue = {
    //         userid: objResult.insertId,
    //         Active : 1
    //     }
    //     var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid","parent_id",'usertype_id']
    //     var orderby = "user_uuid"
    //     var ordertype = "ASC"

    //     // fire sql query to get user id
    //     var lisResponse = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

    //     // check if the result is there and responce accordingly
    //     if (lisResponse.length === 0) {
    //         // rollback 
    //         let rollback = await sqlQuery.specialCMD('rollback')
    //         return res.status(400).json({ errors: [ {msg : 'User not found'}] });
    //     }

    //     let param = {
    //         parent_id : lisResponse[0].parent_id
    //     }

    //     // giv permission to new user

    //     // get sub module list
    //         const lisresponce2 = await sqlQuery.searchQueryNoConNolimit(this.tableName16,["agent_sub_module_id","agent_sub_module_name","agent_module_id","agent_module_name"],"agent_sub_module_id",'ASC')
    //         if (lisresponce2.length == 0) {
    //             // rollback 
    //             let rollback = await sqlQuery.specialCMD('rollback')
    //             return res.status(400).json({ errors: [ {msg : "Sub-Module List not found to verify data"}] })
    //         };

    //     // get defaukt perimission
    //     if( param.parent_id == 1 ){
    //         const oldModuleList = moduleList
    //         let i = 0, j = -1
    //         let newModuleList = [], newSubModuleList = []

    //         for (i = 0; i < oldModuleList.length; i++){

    //             if(lisresponce2[i].agent_sub_module_name != oldModuleList[i].subModuleName ){
    //                 // rollback 
    //                 let rollback = await sqlQuery.specialCMD('rollback')
    //                 return res.status(400).json({ errors: [ {msg : "sub module list error"}] });
    //             }

    //             if(lisresponce2[i].agent_module_name != oldModuleList[i].ModuleName ) {
    //                 // rollback 
    //                 let rollback = await sqlQuery.specialCMD('rollback')
    //                 return res.status(400).json({ errors: [ {msg : "module list error"}] });
    //             }
                
    //             if( j == -1 || newModuleList[j].agent_module_name != oldModuleList[i].ModuleName ){
    //                 newModuleList.push({ 
    //                     userid : objResult.insertId,
    //                     user_uuid : lisResponse[0].user_uuid,
    //                     agent_module_id : lisresponce2[i].agent_module_id,
    //                     agent_module_name : lisresponce2[i].agent_module_name,
    //                     perm_view : 0, 
    //                     sub_module_perm : {
    //                         sub_module_perm_list:[]
    //                     }
    //                 })
    //                 j += 1
    //             }
    //             newModuleList[j].sub_module_perm.sub_module_perm_list.push({
    //                 agent_sub_module_id : lisresponce2[i].agent_sub_module_id,
    //                 subModuleName : lisresponce2[i].agent_sub_module_name,
    //                 permView : oldModuleList[i].viewPerm,
    //                 permAdd : oldModuleList[i].addPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
    //                 permEdit : oldModuleList[i].eidtPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
    //                 permDelete : oldModuleList[i].deletePerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0
    //             })

    //             if( oldModuleList[i].viewPerm == 1 ) newModuleList[j].perm_view = 1
            
    //         }

    //         // make a join operation between er_agent_module, er_agent_sub_module, model list

    //         // console.log("newModuleList ",newModuleList)

    //     // add data in module permission
    //         let response = await sqlQuery.multiInsert(this.tableName15,newModuleList)
    //     }else{
    //         // get parent permission mode and user same permission mode from child
    //         let permissionMode = await sqlQuery.searchQueryNoLimit(this.tableName15,{userid : param.parent_id}, ['agent_module_id','agent_module_name','perm_view','sub_module_perm'],'agent_module_id','ASC')
    //         permissionMode = permissionMode.map((permission)=>{
    //             permission.userid = objResult.insertId
    //             permission.user_uuid  = lisResponse[0].user_uuid
    //             return permission
    //         })
    //         let response = await sqlQuery.multiInsert(this.tableName15,permissionMode)
    //     }
    

    //     // create new user wallet
    //     let walletDetails = {
    //         wallet_uuid : 'uuid()',
    //         userid : objResult.insertId,
    //         user_uuid : lisResponse[0].user_uuid, //str
    //         ex_wallet : 0,
    //         min_wallet : 100,
    //         comm_wallet : 0,
    //         canTransfer : 1
    //     }

    //     let createWallet = await sqlQuery.createQuery(this.tableName14, walletDetails)

    //     var commisionTypeList = []

    //     if (lisResponse[0].parent_id == 1){
    //         commisionTypeList = ["Pre-Paid","Post-Paid","Pre-Paid as 1st transaction"]
    //     }else{
    //         // get parent commission type
    //         var lisParentCommissionType1 = await sqlQuery.searchQuery(this.tableName1, {userid : lisResponse[0].parent_id,Active : 1}, ["comm_type"], 'userid','ASC', 1, 0)
    //         var strCommType = lisParentCommissionType1[0].comm_type == 1 ? "Pre-Paid" : lisParentCommissionType1[0].comm_type == 2 ? "Post-Paid" : "Pre-Paid as 1st transaction"
    //         if(lisParentCommissionType1[0].comm_type == 1){

    //             const lisOperatorIds = await commonQueryCommon.getAllOperatorWithId()

    //             // create commission policy with 0 commission
    //             let commissionDetails = {
    //                 commission_value: 0,
    //                 last_updated_by_type: 1 ,
    //                 last_updated_by : 1, //str user id
    //                 last_updated_on : isodate
    //             }

    //             for(let i = 0;i< lisOperatorIds.length;i++){
            
    //                 // console.log(lisCommisionDetails[i].operator_uuid , lisOperatorIds[i].operatorUuid)
    //                 commissionDetails["op"+lisOperatorIds[i].operator_id+"_uuid"] = lisOperatorIds[i].operatorUuid
    //                 commissionDetails["op"+lisOperatorIds[i].operator_id+"_name"] = lisOperatorIds[i].operator_name
    //                 commissionDetails["op"+lisOperatorIds[i].operator_id+"_wallet_active"] = 0
    //                 commissionDetails["op"+lisOperatorIds[i].operator_id+"_wallet_limit"] = 0
    //             }

    //             commissionDetails.userid = objResult.insertId, 
    //             commissionDetails.user_uuid = lisResponse[0].user_uuid //str user uuid
    //             commissionDetails.usertype_id = lisResponse[0].usertype_id, // int usertype_id
    //             commissionDetails.parent_id = lisResponse[0].parent_id,
    //             commissionDetails.created_by_type = 1 
    //             commissionDetails.created_by=1 , //str user id
    //             commissionDetails.created_on = isodate

    //             // fire sql query to create new country
    //             const objresult = await sqlQuery.createQuery(this.tableName10, commissionDetails)

    //         }
    //         commisionTypeList = [strCommType]
    //     }

    //     // add stock transfer channel 
    //         let lisStockTransferChannel = ['Mobile','SMS','USSD','Web']

    //     // check if the result is there and responce accordingly
    //         for (let i =0; i < lisStockTransferChannel.length;i++){

    //             //create channel as not found
    //             var channelParam = {
    //                 agent_ostc_uuid: "uuid()",
    //                 userid: objResult.insertId, //str userid 
    //                 user_uuid: lisResponse[0].user_uuid, //str user uuid
    //                 channel: lisStockTransferChannel[i], //str channel
    //                 status: 1, //bool status
    //                 threshold: 0 //double threshold
    //             }
    //             // fire sql query to create channel
    //             const stockChannelRes = await sqlQuery.createQuery(this.tableName17, channelParam)
    //         }

    //     // update parent list
    //     let updatePrarentList = await this.addChildInParentList(param.parent_id, objResult.insertId)

    //     // rollback 
    //     let commit = await sqlQuery.specialCMD('commit')
    // }

    //function to edit login table 
    //create login user id
    
    createLoginUser = async(req, res, next) => {
        try {

            // check if use is admin and if parent id is not given then set it to default id
            if (!req.body.parent_uuid ) req.body.parent_uuid = req.body.user_detials.user_uuid
            if (req.body.parent_uuid === undefined) return res.status(400).json({ errors: [ {msg : 'Parent user id not found'}] });
             //  console.log('login/createLoginuser',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // password will be random as id is created by Admin
            req.body.password = this.randomPassword(6)
            if (req.body.password === undefined) return res.status(400).json({ errors: [ {msg : 'Password not found'}] });

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // const strUserName = this.setUserName()
            var strUserName = await this.setUserName();
            if(strUserName.error){
                return res.status(400).json({ errors: [ {msg : "Unique Id not generated"}] });
            }else{
                strUserName = strUserName.username
            }
            
            // creating parameter for sql query to add user
            var param = {
                user_uuid: "uuid()",
                username: strUserName,
                full_name: req.body.name, //str full_name
                address: req.body.address, //str address
                shop_name: req.body.shopName, // str shop name
                created_by: (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                created_by_type: (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ? 1 : 2, //str user type
                created_on: isodate //dt current date time
            }

            if(req.body.email) param.emailid = req.body.email //str email
            if(req.body.gender !== null && req.body.gender !== undefined) param.gender = req.body.gender // gender

            //password hashing
            const strEncryptionKey = this.setEncryptionKey()
            const pin = varRandomString.generateRandomNumber(4)
            const m_pin = this.setHashPassword(strEncryptionKey, pin);
            const strHashPassword = this.setHashPassword(strEncryptionKey, req.body.password);
            param.password = strHashPassword
            param.encryption_key = strEncryptionKey
            param.m_pin = m_pin
            
            // console.log(req.body.password,param.encryption_key,param.password)
            //1)-now check country id
            var lisResponse = await checkCommomDetails.checkCountry(req.body.country_uuid, req.body.countryName)
            if (!lisResponse) return res.status(400).json({ errors: [ {msg : 'Country not found'}] });

            // adding country to the param list
            param.country_name = req.body.countryName
            param.country_uuid = req.body.country_uuid

            //2)-now check if region valid and get region name
            var lisResponse = await checkCommomDetails.getRegionId(req.body.country_uuid,req.body.region_uuid, req.body.regionName)
            if (lisResponse == 0) return res.status(400).json({ errors: [ {msg : 'Region not found'}] });

            // adding region to the param list
            param.region_uuid = req.body.region_uuid
            param.region_name = req.body.regionName
            param.region_id = lisResponse

            //3)-now check provience id and check if the country id is same or not
            lisResponse = await checkCommomDetails.checkProvince(req.body.region_uuid, req.body.province_uuid, req.body.provienceName)
            if (!lisResponse) return res.status(400).json({ errors: [ {msg : 'Province not found'}] });

            // adding provience to the param list
            param.province_Name = req.body.provienceName
            param.province_uuid = req.body.province_uuid

            //4)-now check district id and check provience as per district data
            lisResponse = await checkCommomDetails.checkDistrict(req.body.province_uuid, req.body.district_uuid, req.body.districtName)
            if (!lisResponse) return res.status(400).json({ errors: [ {msg : 'District not found'}] });

            // adding district to the param list
            param.district_name = req.body.districtName
            param.district_uuid = req.body.district_uuid

            //5)-now check agent type and get id
            var lisResponse = await this.checkAgentType(req.body.agent_type_uuid)
            if (lisResponse.length === 0) return res.status(400).json({ errors: [ {msg : 'Agent type not found'}] });

            // adding region to the param list
            param.usertype_id = lisResponse[0].agent_type_id

            //6)-now verifyLanguage
            var lisResponse = await this.checkLanguageId(req.body.lang_uuid)
            if (lisResponse.length === 0) return res.status(400).json({ errors: [ {msg : 'Language not found'}] });

            // adding language to the param list
            param.prefer_lang = lisResponse[0].lang_id

            //7)-check parent 
            // var lisResponse = await this.checkParentId(req.body.parent_uuid,param.usertype_id,req.body.region_uuid)
            var lisResponse = await this.checkGraterAndEqualParentId(req.body.parent_uuid,param.usertype_id,req.body.region_uuid)
            if (lisResponse.length === 0) return res.status(400).json({ errors: [ {msg : 'Parent userid not found'}] });
            if (lisResponse[0].comm_type == 0) return res.status(400).json({ errors: [ {msg : 'Parent Commission not set'}] });
            
            // adding parent to the param list
            param.parent_id = lisResponse[0].userid
            if( param.parent_id != 1 && lisResponse[0].comm_type == 1) param.comm_type = lisResponse[0].comm_type

            param.oper1_status = lisResponse[0]?.oper1_status || 0
            param.oper2_status = lisResponse[0]?.oper2_status || 0
            param.oper3_status = lisResponse[0]?.oper3_status || 0
            param.oper4_status = lisResponse[0]?.oper4_status || 0
            param.oper5_status = lisResponse[0]?.oper5_status || 0

            // start transaction 
            let transaction = await sqlQuery.specialCMD('transaction')

            //8)-sql query to add agent
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            //9)-search user by id and send uuid
            var searchKeyValue = {
                userid: objResult.insertId,
                Active : 1
            }
            var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid","parent_id",'usertype_id', "username"]
            var orderby = "user_uuid"
            var ordertype = "ASC"

            // fire sql query to get user id
            var lisResponse = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (lisResponse.length === 0) {
                // rollback 
                let rollback = await sqlQuery.specialCMD('rollback')
                return res.status(400).json({ errors: [ {msg : 'User not found'}] });
            }

            // giv permission to new user

            // get sub module list
                const lisresponce2 = await sqlQuery.searchQueryNoConNolimit(this.tableName16,["agent_sub_module_id","agent_sub_module_name","agent_module_id","agent_module_name"],"agent_sub_module_id",'ASC')
                if (lisresponce2.length == 0) {
                    // rollback 
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Sub-Module List not found to verify data"}] })
                };

            // get defaukt perimission
            if( param.parent_id == 1 ){
                const oldModuleList = moduleList
                let i = 0, j = -1
                let newModuleList = [], newSubModuleList = []

                for (i = 0; i < oldModuleList.length; i++){

                    if(lisresponce2[i].agent_sub_module_name != oldModuleList[i].subModuleName ){
                        // rollback 
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : "sub module list error"}] });
                    }

                    if(lisresponce2[i].agent_module_name != oldModuleList[i].ModuleName ) {
                        // rollback 
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : "module list error"}] });
                    }
                    
                    if( j == -1 || newModuleList[j].agent_module_name != oldModuleList[i].ModuleName ){
                        newModuleList.push({ 
                            userid : objResult.insertId,
                            user_uuid : lisResponse[0].user_uuid,
                            agent_module_id : lisresponce2[i].agent_module_id,
                            agent_module_name : lisresponce2[i].agent_module_name,
                            perm_view : 0, 
                            sub_module_perm : {
                                sub_module_perm_list:[]
                            }
                        })
                        j += 1
                    }
                    newModuleList[j].sub_module_perm.sub_module_perm_list.push({
                        agent_sub_module_id : lisresponce2[i].agent_sub_module_id,
                        subModuleName : lisresponce2[i].agent_sub_module_name,
                        permView : oldModuleList[i].viewPerm,
                        permAdd : oldModuleList[i].addPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
                        permEdit : oldModuleList[i].eidtPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
                        permDelete : oldModuleList[i].deletePerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0
                    })

                    if( oldModuleList[i].viewPerm == 1 ) newModuleList[j].perm_view = 1
                
                }

                // make a join operation between er_agent_module, er_agent_sub_module, model list

                // console.log("newModuleList ",newModuleList)

            // add data in module permission
                let response = await sqlQuery.multiInsert(this.tableName15,newModuleList)
            }else{
                // get parent permission mode and user same permission mode from child
                // let permissionMode = await sqlQuery.searchQueryNoLimit(this.tableName15,{userid : param.parent_id}, ['agent_module_id','agent_module_name','perm_view','sub_module_perm'],'agent_module_id','ASC')
                // permissionMode = permissionMode.map((permission)=>{
                //     permission.userid = objResult.insertId
                //     permission.user_uuid  = lisResponse[0].user_uuid
                //     return permission
                // })

                const oldModuleList = moduleList
                let i = 0, j = -1
                let newModuleList = [], newSubModuleList = []

                for (i = 0; i < oldModuleList.length; i++){

                    if(lisresponce2[i].agent_sub_module_name != oldModuleList[i].subModuleName ){
                        // rollback 
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : "sub module list error"}] });
                    }

                    if(lisresponce2[i].agent_module_name != oldModuleList[i].ModuleName ) {
                        // rollback 
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : "module list error"}] });
                    }
                    
                    if( j == -1 || newModuleList[j].agent_module_name != oldModuleList[i].ModuleName ){
                        newModuleList.push({ 
                            userid : objResult.insertId,
                            user_uuid : lisResponse[0].user_uuid,
                            agent_module_id : lisresponce2[i].agent_module_id,
                            agent_module_name : lisresponce2[i].agent_module_name,
                            perm_view : 0, 
                            sub_module_perm : {
                                sub_module_perm_list:[]
                            }
                        })
                        j += 1
                    }
                    newModuleList[j].sub_module_perm.sub_module_perm_list.push({
                        agent_sub_module_id : lisresponce2[i].agent_sub_module_id,
                        subModuleName : lisresponce2[i].agent_sub_module_name,
                        permView : oldModuleList[i].viewPerm,
                        permAdd : oldModuleList[i].addPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
                        permEdit : oldModuleList[i].eidtPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
                        permDelete : oldModuleList[i].deletePerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0
                    })

                    if( oldModuleList[i].viewPerm == 1 ) newModuleList[j].perm_view = 1
                
                }

                // make a join operation between er_agent_module, er_agent_sub_module, model list

                // console.log("newModuleList ",newModuleList)

            // add data in module permission
                let response = await sqlQuery.multiInsert(this.tableName15,newModuleList)
            }
        

            // create new user wallet
            let walletDetails = {
                wallet_uuid : 'uuid()',
                userid : objResult.insertId,
                user_uuid : lisResponse[0].user_uuid, //str
                ex_wallet : 0,
                min_wallet : 100,
                comm_wallet : 0,
                canTransfer : 1
            }

            let createWallet = await sqlQuery.createQuery(this.tableName14, walletDetails)

            var commisionTypeList = []

            if (lisResponse[0].parent_id == 1){
                commisionTypeList = ["Pre-Paid","Post-Paid","Pre-Paid as 1st transaction"]
            }else{
                // get parent commission type
                var lisParentCommissionType1 = await sqlQuery.searchQuery(this.tableName1, {userid : lisResponse[0].parent_id,Active : 1}, ["comm_type"], 'userid','ASC', 1, 0)
                var strCommType = lisParentCommissionType1[0].comm_type == 1 ? "Pre-Paid" : lisParentCommissionType1[0].comm_type == 2 ? "Post-Paid" : "Pre-Paid as 1st transaction"
                if(lisParentCommissionType1[0].comm_type == 1){

                    const lisOperatorIds = await commonQueryCommon.getAllOperatorWithId()

                    // create commission policy with 0 commission
                    let commissionDetails = {
                        commission_value: 0,
                        last_updated_by_type: (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? 1 : 2 ,
                        last_updated_by : (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                        last_updated_on : isodate
                    }

                    for(let i = 0;i< lisOperatorIds.length;i++){
                
                        // console.log(lisCommisionDetails[i].operator_uuid , lisOperatorIds[i].operatorUuid)
                        commissionDetails["op"+lisOperatorIds[i].operator_id+"_uuid"] = lisOperatorIds[i].operatorUuid
                        commissionDetails["op"+lisOperatorIds[i].operator_id+"_name"] = lisOperatorIds[i].operator_name
                        commissionDetails["op"+lisOperatorIds[i].operator_id+"_wallet_active"] = 0
                        commissionDetails["op"+lisOperatorIds[i].operator_id+"_wallet_limit"] = 0
                    }

                    commissionDetails.userid = objResult.insertId, 
                    commissionDetails.user_uuid = lisResponse[0].user_uuid //str user uuid
                    commissionDetails.usertype_id = lisResponse[0].usertype_id, // int usertype_id
                    commissionDetails.parent_id = lisResponse[0].parent_id,
                    commissionDetails.created_by_type = (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? 1 : 2 
                    commissionDetails.created_by=(req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                    commissionDetails.created_on = isodate

                    // fire sql query to create new country
                    const objresult = await sqlQuery.createQuery(this.tableName10, commissionDetails)

                }
                commisionTypeList = [strCommType]
            }

            // add stock transfer channel 
                let lisStockTransferChannel = ['Mobile','SMS','USSD','Web']

            // check if the result is there and responce accordingly
                for (let i =0; i < lisStockTransferChannel.length;i++){

                    //create channel as not found
                    var channelParam = {
                        agent_ostc_uuid: "uuid()",
                        userid: objResult.insertId, //str userid 
                        user_uuid: lisResponse[0].user_uuid, //str user uuid
                        channel: lisStockTransferChannel[i], //str channel
                        status: 1, //bool status
                        threshold: 0 //double threshold
                    }
                    // fire sql query to create channel
                    const stockChannelRes = await sqlQuery.createQuery(this.tableName17, channelParam)
                }

            // update parent list
            let updatePrarentList = await this.addChildInParentList(param.parent_id, objResult.insertId)

            // rollback 
            let commit = await sqlQuery.specialCMD('commit')

            res.status(201).send({
                message: 'user created successfully !',
                user_uuid: lisResponse[0].user_uuid, //str
                username: lisResponse[0].username,
                commisionTypeList : commisionTypeList
            });

        } catch (error) {
            console.log(error);
            // rollback 
            let rollback = await sqlQuery.specialCMD('rollback')
            var errMessage = error.message
            errMessage = errMessage.split("'")
            if (errMessage[0] == "Duplicate entry ") return res.status(400).json({ errors: [ {msg :errMessage[1]+" allready used" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

   getParentName = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

     //  console.log('login/getParentName', JSON.stringify(req.body), JSON.stringify(req.query));

    // Build query parameters
    const param = { Active: 1 };
    const userType = req.body.user_detials.type;
    const userDetails = req.body.user_detials;

    if (userType === userList.Admin || userType === userList.SubAdmin) {
      if (userDetails.region_list.length !== 7) {
        param.region_ids = userDetails.region_list.join(',');
      }
    } else {
      param.child_ids = userDetails.child_list.join(',');
    }

    if (req.query.rgion_uuid) {
      param.region_uuid = req.query.rgion_uuid;
    }

    // Get according to agent_type_uuid if provided
    if (req.query.agent_type_uuid) {
      const searchKeyValue = {
        agent_type_uuid: req.query.agent_type_uuid,
        active: 1,
      };
      const key = ['agent_type_id'];
      const lisResponse = await sqlQueryReplica.searchQuery(
        this.tableName3,
        searchKeyValue,
        key,
        'agent_type_id',
        'ASC',
        1,
        0
      );

      if (lisResponse.length === 0) {
        return res.status(400).json({ errors: [{ msg: 'Agent type not found' }] });
      }

      param.get_upper_parent_ids = parseInt(lisResponse[0].agent_type_id);
    }

    // Add commission type filter if any
    if (req.query.commissionType) {
      param.comm_type =
        req.query.commissionType === 'pre_paid'
          ? 1
          : req.query.commissionType === 'post_paid'
          ? 2
          : 0;
    }

    // Try to get from Redis cache
    const redisData = await new Promise((resolve, reject) => {
      redisMaster.get('AdminUser', (err, reply) => {
        if (err) return reject(err);
        return resolve(reply);
      });
    });

    let adminUsers;

    // If not in Redis, fetch from DB and store
    if (!redisData) {
       //  console.log('AdminUser cache empty — fetching from DB...');
      const key = [
        'CAST(user_uuid AS CHAR(16)) AS user_uuid',
        'username AS id',
        'full_name as name',
        'CAST(region_uuid AS CHAR(16)) AS region_uuid',
        'region_name as regionName',
      ];

      const adminUserFromDb = await sqlQueryReplica.searchQueryNoLimit(
        this.tableName1,
        { usertype_id: 0, Active: 1 },
        key,
        'usertype_id',
        'ASC'
      );

      // Store result in Redis for next calls (with expiration e.g. 10 mins)
      redisMaster.post('AdminUser', JSON.stringify(adminUserFromDb));
      // or redisMaster.setex('AdminUser', 600, JSON.stringify(adminUserFromDb));

      adminUsers = adminUserFromDb;
    } else {
      adminUsers = JSON.parse(redisData);
    }

    // Now fetch agent list according to params
    const key = [
      'CAST(user_uuid AS CHAR(16)) AS user_uuid',
      'username AS id',
      'full_name as name',
      'CAST(region_uuid AS CHAR(16)) AS region_uuid',
      'region_name as regionName',
    ];

    const lisResults = await sqlQueryReplica.searchQueryNoLimit(
      this.tableName1,
      param,
      key,
      'usertype_id',
      'ASC'
    );

    if (lisResults.length === 0) {
      return res.status(204).json({ message: 'no user found' });
    }
//   //  console.log('AdminUser fetched successfully with', [...adminUsers,...lisResults], 'records.');
    return res.status(200).json({
      reportList: lisResults
     
    });
  } catch (error) {
    console.error('Error in getParentName:', error);
    return res.status(400).json({ errors: [{ msg: error.message }] });
  }
    };

    getEqualParentName = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }

        //  //  console.log('login/getParentName', JSON.stringify(req.body), JSON.stringify(req.query));

        // Build query parameters
        const param = { Active: 1 };
        const userType = req.body.user_detials.type;
        const userDetails = req.body.user_detials;

        if (userType === userList.Admin || userType === userList.SubAdmin) {
        if (userDetails.region_list.length !== 7) {
            param.region_ids = userDetails.region_list.join(',');
        }
        } else {
        param.child_ids = userDetails.child_list.join(',');
        }

        if (req.query.rgion_uuid) {
        param.region_uuid = req.query.rgion_uuid;
        }

        // Get according to agent_type_uuid if provided
        if (req.query.agent_type_uuid) {
        const searchKeyValue = {
            agent_type_uuid: req.query.agent_type_uuid,
            active: 1,
        };
        const key = ['agent_type_id'];
        const lisResponse = await sqlQueryReplica.searchQuery(
            this.tableName3,
            searchKeyValue,
            key,
            'agent_type_id',
            'ASC',
            1,
            0
        );

        if (lisResponse.length === 0) {
            return res.status(400).json({ errors: [{ msg: 'Agent type not found' }] });
        }

        param.get_equal_parent_ids = parseInt(lisResponse[0].agent_type_id);
        }

        // Add commission type filter if any
        if (req.query.commissionType) {
        param.comm_type =
            req.query.commissionType === 'pre_paid'
            ? 1
            : req.query.commissionType === 'post_paid'
            ? 2
            : 0;
        }

        // Try to get from Redis cache
        const redisData = await new Promise((resolve, reject) => {
        redisMaster.get('AdminUser', (err, reply) => {
            if (err) return reject(err);
            return resolve(reply);
        });
        });

        let adminUsers;

        // If not in Redis, fetch from DB and store
        if (!redisData) {
         //  console.log('AdminUser cache empty — fetching from DB...');
        const key = [
            'CAST(user_uuid AS CHAR(16)) AS user_uuid',
            'username AS id',
            'full_name as name',
            'CAST(region_uuid AS CHAR(16)) AS region_uuid',
            'region_name as regionName',
        ];

        const adminUserFromDb = await sqlQueryReplica.searchQueryNoLimit(
            this.tableName1,
            { usertype_id: 0, Active: 1 },
            key,
            'usertype_id',
            'ASC'
        );

        // Store result in Redis for next calls (with expiration e.g. 10 mins)
        redisMaster.post('AdminUser', JSON.stringify(adminUserFromDb));
        // or redisMaster.setex('AdminUser', 600, JSON.stringify(adminUserFromDb));

        adminUsers = adminUserFromDb;
        } else {
        adminUsers = JSON.parse(redisData);
        }

        // Now fetch agent list according to params
        const key = [
        'CAST(user_uuid AS CHAR(16)) AS user_uuid',
        'username AS id',
        'full_name as name',
        'CAST(region_uuid AS CHAR(16)) AS region_uuid',
        'region_name as regionName',
        ];

        const lisResults = await sqlQueryReplica.searchQueryNoLimit(
        this.tableName1,
        param,
        key,
        'usertype_id',
        'ASC'
        );

        if (lisResults.length === 0) {
        return res.status(204).json({ message: 'no user found' });
        }
    //  //  console.log('AdminUser fetched successfully with', [...adminUsers,...lisResults], 'records.');
        return res.status(200).json({
        reportList: [...adminUsers,...lisResults]
        
        });
    } catch (error) {
        console.error('Error in getParentName:', error);
        return res.status(400).json({ errors: [{ msg: error.message }] });
    }
    };

    getEqualAndGraterParentName = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
            }

             //  console.log('login/getParentName', JSON.stringify(req.body), JSON.stringify(req.query));

            // Build query parameters
            const param = { Active: 1 };
            const userType = req.body.user_detials.type;
            const userDetails = req.body.user_detials;

            if (userType === userList.Admin || userType === userList.SubAdmin) {
            if (userDetails.region_list.length !== 7) {
                param.region_ids = userDetails.region_list.join(',');
            }
            } else {
            param.child_ids = userDetails.child_list.join(',');
            }

            if (req.query.rgion_uuid) {
            param.region_uuid = req.query.rgion_uuid;
            }

            // Get according to agent_type_uuid if provided
            if (req.query.agent_type_uuid) {
            const searchKeyValue = {
                agent_type_uuid: req.query.agent_type_uuid,
                active: 1,
            };
            const key = ['agent_type_id'];
            const lisResponse = await sqlQueryReplica.searchQuery(
                this.tableName3,
                searchKeyValue,
                key,
                'agent_type_id',
                'ASC',
                1,
                0
            );

            if (lisResponse.length === 0) {
                return res.status(400).json({ errors: [{ msg: 'Agent type not found' }] });
            }

            param.get_equal_and_grate_parent_ids = parseInt(lisResponse[0].agent_type_id);
            }

            // Add commission type filter if any
            if (req.query.commissionType) {
            param.comm_type =
                req.query.commissionType === 'pre_paid'
                ? 1
                : req.query.commissionType === 'post_paid'
                ? 2
                : 0;
            }

            // Try to get from Redis cache
            const redisData = await new Promise((resolve, reject) => {
            redisMaster.get('AdminUser', (err, reply) => {
                if (err) return reject(err);
                return resolve(reply);
            });
            });

            let adminUsers;

            // If not in Redis, fetch from DB and store
            if (!redisData) {
             //  console.log('AdminUser cache empty — fetching from DB...');
            const key = [
                'CAST(user_uuid AS CHAR(16)) AS user_uuid',
                'username AS id',
                'full_name as name',
                'CAST(region_uuid AS CHAR(16)) AS region_uuid',
                'region_name as regionName',
            ];

            const adminUserFromDb = await sqlQueryReplica.searchQueryNoLimit(
                this.tableName1,
                { usertype_id: 0, Active: 1 },
                key,
                'usertype_id',
                'ASC'
            );

            // Store result in Redis for next calls (with expiration e.g. 10 mins)
            redisMaster.post('AdminUser', JSON.stringify(adminUserFromDb));
            // or redisMaster.setex('AdminUser', 600, JSON.stringify(adminUserFromDb));

            adminUsers = adminUserFromDb;
            } else {
            adminUsers = JSON.parse(redisData);
            }

            // Now fetch agent list according to params
            const key = [
            'CAST(user_uuid AS CHAR(16)) AS user_uuid',
            'username AS id',
            'full_name as name',
            'CAST(region_uuid AS CHAR(16)) AS region_uuid',
            'region_name as regionName',
            ];

            const lisResults = await sqlQueryReplica.searchQueryNoLimit(
            this.tableName1,
            param,
            key,
            'usertype_id',
            'ASC'
            );

            if (lisResults.length === 0) {
            return res.status(204).json({ message: 'no user found' });
            }
        //  //  console.log('AdminUser fetched successfully with', [...adminUsers,...lisResults], 'records.');
            return res.status(200).json({
            reportList: lisResults
            
            });
        } catch (error) {
            console.error('Error in getParentName:', error);
            return res.status(400).json({ errors: [{ msg: error.message }] });
        }
    };

   
    getAgentDetails = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('login/getAgentDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            // sql query parameter
            var searchKeyValue = {
                user_uuid: req.query.user_uuid,
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
            var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid", "username AS userId", "full_name As name", "emailid AS email", "gender", "mobile", "Address", "shop_name AS shopName", "parent_id AS parentId", "region_name AS regionName", "CAST(region_uuid AS CHAR(16)) AS region_uuid" ,"usertype_id AS agentType_uuid", "country_name AS countryName", "CAST(country_uuid AS CHAR(16)) AS country_uuid" ,"province_Name AS provienceName","CAST(province_uuid AS CHAR(16)) AS province_uuid", "district_name AS districtName","CAST(district_uuid AS CHAR(16)) AS district_uuid","prefer_lang AS language","comm_type AS commissionType"]
            var orderby = "emailid"
            var ordertype = "ASC"

            // fire sql query to get str user_uuid, str full_name, str email, str gender, int mobile, str address,str shop_name, str parent_id,str region_name,int usertype_id, str country name, str province name, str district name
            var lisResults = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (!lisResults) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResults.length === 0) {
                return res.status(204).send({ message: 'User not found' })
            }

            // get agent type list
            var agentTypeList = await commonQueryCommon.getAllAgentType()
            if(agentTypeList.length == 0) return res.status(400).json({ errors: [ {msg :'agent tye list not found'}]})
            lisResults[0].agentTypeName = agentTypeList[lisResults[0].agentType_uuid-1].agent_type_name
            lisResults[0].agentType_uuid = agentTypeList[lisResults[0].agentType_uuid-1].agent_type_uuid

 
            var searchKeyValue = {
                lang_id : lisResults[0].language
            }
            var key = ["CAST(lang_uuid AS CHAR(16)) AS lang_uuid", "lang_symbol", "lang_name"]
            var orderby = "lang_uuid"
            var ordertype = "ASC"

            var langResult = await sqlQueryReplica.searchQuery(this.tableName7, searchKeyValue, key, orderby, ordertype, 1, 0)

            lisResults[0].language = langResult.length > 0 ? langResult[0].lang_name : 'not found'
            lisResults[0].lang_uuid = langResult.length > 0 ? langResult[0].lang_uuid : 'not found'
            lisResults[0].symbol = langResult.length > 0 ? langResult[0].lang_symbol : 'not found'
            lisResults[0].commissionType = lisResults[0].commissionType == 0 ? "Not Assigned" : lisResults[0].commissionType == 1 ? "Pre-Paid" : "Post-Paid"

            // searching parent name
            var searchKeyValue = {
                userid : lisResults[0].parentId,
                Active : 1
            }
            var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid","username","full_name"]
            var orderby = "user_uuid"
            var ordertype = "ASC"

            var listParentDetails = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            lisResults[0].parentId = listParentDetails[0].username
            lisResults[0].parentName = listParentDetails[0].full_name
            lisResults[0].parent_uuid = listParentDetails[0].user_uuid

            //send responce to front end
            return res.status(200).send(lisResults)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get all all user wuth basic details
    getAllAgent = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/getAllAgent',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0
            console.log("req.Query", req.query);

            // variable for sql query
            // var offset = req.query.start
            // var limit = req.query.end - offset
            
            var searchKeyValue = {
                parent_id: req.body.user_detials.userid,
                Active : 1
            }

            // if admin or sub admin then search by region if agent search by agent ids
            if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }
            //different serach option
            // if (req.query.userId) searchKeyValue.username = req.query.userId //str username
              if (req.query.userId || req.query.userIdLike ) {
                const userId = req.query.userId || req.query.userIdLike;
                searchKeyValue.username = userId.startsWith("AFP-") ? userId : `AFP-${userId}`;
              }
            if (req.query.name) searchKeyValue.full_name = req.query.name //str full name
            if (req.query.mobileNumber) searchKeyValue.mobile = req.query.mobileNumber //int mobile number              
            if (req.query.userType_uuid) {
                const lisResponce = await this.checkAgentType(req.query.userType_uuid)
                if (lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'User type not found'}] });
                searchKeyValue.usertype_id = lisResponce[0].agent_type_id //int user typeId
            }
            if (req.query.region_uuid) searchKeyValue.region_uuid = req.query.region_uuid // str region_uuid
            if (req.query.province_uuid) searchKeyValue.province_uuid = req.query.province_uuid // str region_uuid
            if (req.query.status) searchKeyValue.user_status = Number(req.query.status) // tinyint 1,2

            if (Object.keys(searchKeyValue).length == 2) {
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
                if (req.query.start_date) searchKeyValue.start_date = req.query.start_date //dt start date
                if (req.query.end_date) searchKeyValue.end_date = req.query.end_date // dt end date
            } //return res.status(400).json({ errors: [ {msg : 'Improper values of search parameter'}] });

            const lisTotalRecords = await agentModule.searchAgentCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords.length)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // console.log("searchKeyValue",searchKeyValue)
            const lisResults = await agentModule.searchAgent(searchKeyValue, limit, offset)
            // console.log("lisResults",lisResults)
            // check sql rsponce
            // if (!lisResults) {
            //     throw new HttpException(500, 'Something went wrong');
            // }
            // if (lisResults.length === 0) {
            //     return res.status(404).send({ message: 'User not found' })
            // }

            // //send responce to front end
            // return res.status(200).send(lisResults)

            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisResults)
            console.log("lisResults pageNumber == 0 ",lisResults)

            }else{
                res.status(200).send({
                    reportList : lisResults,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
            }

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

        //function to get all all user wuth basic details
    downloadAllAgent = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/getAllAgent',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0
            console.log("req.Query", req.query);

            // variable for sql query
            // var offset = req.query.start
            // var limit = req.query.end - offset
            
            var searchKeyValue = {
                parent_id: req.body.user_detials.userid,
                Active : 1
            }

            // if admin or sub admin then search by region if agent search by agent ids
            if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }
            //different serach option
            // if (req.query.userId) searchKeyValue.username = req.query.userId //str username
            if (req.query.userId) {
                const userId = req.query.userId;
                searchKeyValue.username = userId.startsWith("AFP-") ? userId : `AFP-${userId}`;
              }
            if (req.query.name) searchKeyValue.full_name = req.query.name //str full name
            if (req.query.mobileNumber) searchKeyValue.mobile = req.query.mobileNumber //int mobile number              
            if (req.query.userType_uuid) {
                const lisResponce = await this.checkAgentType(req.query.userType_uuid)
                if (lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'User type not found'}] });
                searchKeyValue.usertype_id = lisResponce[0].agent_type_id //int user typeId
            }
            if (req.query.region_uuid) searchKeyValue.region_uuid = req.query.region_uuid // str region_uuid
            if (req.query.province_uuid) searchKeyValue.province_uuid = req.query.province_uuid // str region_uuid
            if (req.query.status) searchKeyValue.user_status = Number(req.query.status) // tinyint 1,2

            if (Object.keys(searchKeyValue).length == 2) {
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
                if (req.query.start_date) searchKeyValue.start_date = req.query.start_date //dt start date
                if (req.query.end_date) searchKeyValue.end_date = req.query.end_date // dt end date
            } //return res.status(400).json({ errors: [ {msg : 'Improper values of search parameter'}] });

            const lisTotalRecords = await agentModule.searchAgentCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords.length)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // console.log("searchKeyValue",searchKeyValue)
            const lisResults = await agentModule.downloadAgentListQuery(searchKeyValue, limit, offset)



             // Handle Download
        if (req.query.pageNumber == 0) {
               const now = new Date();
                const dateStr = new Date().toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
                const fileName = `agent_list_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (Date.now() - stats.mtimeMs < 30 * 60 * 1000) {
                    return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
                }
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Agents');

            if (lisResults.length > 0) {
                worksheet.columns = Object.keys(lisResults[0]).map((key) => ({
                    header: key,
                    key: key,
                    width: key.length < 20 ? 20 : key.length + 5
                }));
                worksheet.addRows(lisResults);
            }

            await workbook.xlsx.writeFile(filePath);
            fs.chmodSync(filePath, 0o644);

            // Delete file after 30 minutes
            setTimeout(() => {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', fileName);
                    else {}  //  console.log('Deleted agent report file:', fileName);
                });
            }, 30 * 60 * 1000); // 30 min

            return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
        
            }else{
                res.status(200).send({
                    reportList : lisResults,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
            }

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }


    downloadDwonlineAgent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        if (!req.query.pageNumber) req.query.pageNumber = 0;

        let searchKeyValue = {
            'NOT parent_id': req.body.user_detials.userid,
            Active: 1
        };

        const userType = req.body.user_detials.type;
        const isAdmin = userType == userList.Admin || userType == userList.SubAdmin;

           if (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) {
                if (req.body.user_detials.region_list.length !== 7) {
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                }
            } else {
                searchKeyValue.child_ids = req.body.user_detials.child_list.join(',');
            }

        // if (req.query.parentAgentUuid) {
        //     let searchKeyValue1 = {
        //         // user_uuid: req.query.parentAgentUuid,
        //         username: req.query.parentAgentUuid,
        //         Active: 1
        //     };

        //        if (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) {
        //         if (req.body.user_detials.region_list.length !== 7) {
        //             searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
        //         }
        //     } else {
        //         searchKeyValue.child_ids = req.body.user_detials.child_list.join(',');
        //     }

        //     const lisResponce = await sqlQueryReplica.searchQuery(
        //         this.tableName1,
        //         searchKeyValue1,
        //         ["child_id", "userid"],
        //         "userid",
        //         "ASC",
        //         1,
        //         0
        //     );

        //     if (lisResponce.length === 0) {
        //         return res.status(400).json({ errors: [{ msg: 'Selected Parent not found' }] });
        //     }

        //     searchKeyValue.parent_id = lisResponce[0].userid;
        // }

             // all optional search parameter
            if (req.query.parentAgentUuid) {
            let userid = req.query.parentAgentUuid;
             userid =     userid.startsWith("AFP-")? userid : `AFP-${userid}`;
                // check if selected child is in your downline
                var searchKeyValue1 = {
                    username: userid,
                    Active : 1
                }

                // if admin or sub admin then search by region if agent search by agent ids
                if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                    // searchKeyValue1.region_ids = req.body.user_detials.region_list.join(',')
                    if(req.body.user_detials.region_list.length != 7){
                        searchKeyValue1.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    searchKeyValue1.child_ids = req.body.user_detials.child_list.join(',')
                }

                var key = ["child_id","userid"]
                var orderby = "userid"
                var ordertype = "ASC" 

                // fire sql query to get str user_uuid, str full_name, str email, str gender, int mobile, str address,str shop_name, str parent_id,str region_name,int usertype_id, str country name, str province name, str district name
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue1, key, orderby, ordertype, 1, 0)

                // check sql rsponce
                if (lisResponce.length === 0) {
                    return res.status(400).json({ errors: [ {msg : 'selected Parent not found'}] });
                }

                // searchKeyValue.child_ids = lisResponce[0].child_id || '0' //str child slit coma sepreated
                searchKeyValue.parent_id = lisResponce[0].userid
            }

        if (req.query.userType_uuid) {
            const resUserType = await this.checkAgentType(req.query.userType_uuid);
            if (resUserType.length === 0) return res.status(400).json({ errors: [{ msg: 'User type UUID not found' }] });
            searchKeyValue.usertype_id = resUserType[0].agent_type_id;
        }

        // if (req.query.id) searchKeyValue.username = req.query.id;
            if (req.query.id) {
                const userid = req.query.id;
                searchKeyValue.username = userid.startsWith("AFP-")
                ? userid
                : `AFP-${userid}`;
            }
        if (req.query.name) {
            if (Number(req.query.name)) searchKeyValue.mobile = req.query.name;
            else searchKeyValue.full_name = req.query.name;
        }
        if (req.query.province_uuid) searchKeyValue.province_uuid = req.query.province_uuid;
        if (req.query.region_uuid) searchKeyValue.region_uuid = req.query.region_uuid;
        if (req.query.status) searchKeyValue.Active = req.query.status;
        if (req.query.mobileNumber) searchKeyValue.mobile = req.query.mobileNumber;

        if (Object.keys(searchKeyValue).length === 2) {
            if ((req.query.start_date && !req.query.end_date) || (req.query.end_date && !req.query.start_date))
                return res.status(400).json({ errors: [{ msg: 'Date range is not proper' }] });

            if (req.query.start_date) searchKeyValue.start_date = req.query.start_date;
            if (req.query.end_date) searchKeyValue.end_date = req.query.end_date;
        }

        const lisTotalRecords = await agentModule.searchAgentCount(searchKeyValue);
        let totalRecords = lisTotalRecords.length;

        const pageLimit = Number(process.env.PER_PAGE_COUNT);
        const pageCount = totalRecords % pageLimit === 0 ? totalRecords / pageLimit : Math.floor(totalRecords / pageLimit) + 1;

        const offset = req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * pageLimit : 0;
        const limit = req.query.pageNumber > 0 ? pageLimit : totalRecords;

        const lisResults = await agentModule.downloadAgentListQuery(searchKeyValue, limit, offset);

        // Handle Download
        if (req.query.pageNumber == 0) {
               const now = new Date();
                const dateStr = new Date().toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
                const fileName = `downline_agent_list_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (Date.now() - stats.mtimeMs < 30 * 60 * 1000) {
                    return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
                }
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Agents');

            if (lisResults.length > 0) {
                worksheet.columns = Object.keys(lisResults[0]).map((key) => ({
                    header: key,
                    key: key,
                    width: key.length < 20 ? 20 : key.length + 5
                }));
                worksheet.addRows(lisResults);
            }

            await workbook.xlsx.writeFile(filePath);
            fs.chmodSync(filePath, 0o644);

            // Delete file after 30 minutes
            setTimeout(() => {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', fileName);
                    else {}  //  console.log('Deleted agent report file:', fileName);
                });
            }, 30 * 60 * 1000); // 30 min

            return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
        }

        return res.status(200).json({
            reportList: lisResults,
            totalRepords: totalRecords,
            pageCount: pageCount,
            currentPage: Number(req.query.pageNumber),
            pageLimit: pageLimit
        });

    } catch (error) {
        console.error(error);
        return res.status(400).json({ errors: [{ msg: error.message }] });
    }
    };

    updateAgentDetials = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/updateAgentDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            // get agent details which is gona update
                // sql query parameter
                var searchKeyValue = {
                    user_uuid: req.body.user_uuid,
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
                var key = ["userid","username AS userId", "full_name As name", "emailid AS email", "gender", "Address", "shop_name AS shopName","region_name AS regionName", "CAST(region_uuid AS CHAR(16)) AS region_uuid" ,"usertype_id AS agentType", "country_name AS countryName", "CAST(country_uuid AS CHAR(16)) AS country_uuid" ,"province_Name AS provienceName","CAST(province_uuid AS CHAR(16)) AS province_uuid", "district_name AS districtName","CAST(district_uuid AS CHAR(16)) AS district_uuid","prefer_lang AS language","comm_type AS commissionType"]
                var orderby = "emailid"
                var ordertype = "ASC"

                // fire sql query to get str user_uuid, str full_name, str email, str gender, int mobile, str address,str shop_name, str parent_id,str region_name,int usertype_id, str country name, str province name, str district name
                let oldUserDetails = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                if (oldUserDetails.length == 0) return res.status(400).json({ errors: [ {msg : 'Agent not found'}] });
            
            // creating parameter for sql query to add user
            var param = {
                full_name : req.body.name, //st
                address : req.body.address, //str
                shop_name : req.body.shopName
            }

            //optional parameter that can be updated
            // if(req.body.email) param.emailid = req.body.email
            param.emailid = req.body.email ? req.body.email : "NULL"
            if(req.body.gender !== null && req.body.gender !== undefined) param.gender = req.body.gender == 1 ? 1 : (req.body.gender == 2 ? 2 : 0)
            // if (req.body.mobile) param.mobile = req.body.mobile
            // if (req.body.agent_type_uuid) {
            //     //2)-now check agent type and get id
            //     var lisResponse = await this.checkAgentType(req.body.agent_type_uuid)
            //     if (lisResponse.length === 0) return res.status(400).json({ errors: [ {msg : 'Agent type not found'}] });

            //     // param.usertype_id = lisResponse[0].agent_type_id
            //     if(lisResponse[0].agent_type_id < oldUserDetails[0].agentType) return res.status(400).json({ errors: [ {msg : 'Not allowed to upgread agent type'}] });
            //     if(lisResponse[0].agent_type_id > oldUserDetails[0].agentType){
            //         // check if any child is in between that range
            //         var searchKeyValue ={
            //             parent_id : oldUserDetails[0].userid, //search fro childs
            //             get_upper_parent_ids : lisResponse[0].agent_type_id
            //         }
            //         var key = ['COUNT(1)']
            //         var childList = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, 'userid', 'ASC', 1, 0)
            //         if(childList[0]['COUNT(1)']) return res.status(400).json({ errors: [ {msg : 'Not allowed to downgread agent to selected agent type'}] });
            //         param.usertype_id = lisResponse[0].agent_type_id
            //     }
            // }

            //address change require to check of country,provience,district 
            // //1)-now check country id
            // var lisResponse = await checkCommomDetails.checkCountry(req.body.country_uuid, req.body.countryName)
            // if (!lisResponse) return res.status(400).json({ errors: [ {msg : 'Country not found'}] });

            // // adding country to the param list
            // param.country_name = req.body.countryName
            // param.country_uuid = req.body.country_uuid

            // //2)-now check if region valid and get region name
            // var lisResponse = await checkCommomDetails.checkRegion(req.body.country_uuid,req.body.region_uuid, req.body.regionName)
            // if (!lisResponse) return res.status(400).json({ errors: [ {msg : 'Region not found'}] });

            // // adding region to the param list
            // param.region_uuid = req.body.region_uuid
            // param.region_name = req.body.regionName

            //3)-now check provience id and check if the country id is same or not
            let newProvince_uuid = oldUserDetails[0].province_uuid == req.body.province_uuid ? oldUserDetails[0].province_uuid : req.body.province_uuid
            if(req.body.province_uuid != oldUserDetails[0].province_uuid){
                lisResponse = await checkCommomDetails.checkProvince(oldUserDetails[0].region_uuid, req.body.province_uuid, req.body.provienceName)
                if (!lisResponse) return res.status(400).json({ errors: [ {msg : 'Province not found'}] });

                // adding provience to the param list
                param.province_Name = req.body.provienceName
                param.province_uuid = req.body.province_uuid
            }

            //4)-now check district id and check provience as per district data
            if(req.body.province_uuid != oldUserDetails[0].province_uuid || req.body.district_uuid != oldUserDetails[0].district_uuid){
                lisResponse = await checkCommomDetails.checkDistrict(newProvince_uuid, req.body.district_uuid, req.body.districtName)
                if (!lisResponse) return res.status(400).json({ errors: [ {msg : 'District not found'}] });

                // adding district to the param list
                param.district_name = req.body.districtName
                param.district_uuid = req.body.district_uuid
            }

            // //5)-now check agent type and get id
            // var lisResponse = await this.checkAgentType(req.body.agent_type_uuid)
            // if (lisResponse.length === 0) return res.status(400).json({ errors: [ {msg : 'Agent type not found'}] });

            // adding region to the param list
            // param.usertype_id = lisResponse[0].agent_type_id

            //6)-now verifyLanguage
            if(req.body.lang_uuid){
                var lisResponse = await this.checkLanguageId(req.body.lang_uuid)
                if (lisResponse.length === 0) return res.status(400).json({ errors: [ {msg : 'Language not found'}] });

                // adding language to the param list
                param.prefer_lang = lisResponse[0].lang_id
            }
            
            //check if param have update parameter or not
            if (Object.keys(param).length === 0) return res.status(400).json({ errors: [ {msg : 'Search requerst is not proper'}] });

            //sql varible for search
            var searchKeyValue = {
                user_uuid: req.body.user_uuid,
                Active : 1
            }

            //8)-sql query to update
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

            const { affectedRows, changedRows, info } = objResult;
            // generating proper message
            const message = !affectedRows ? 'user not found' :
                affectedRows && changedRows ? 'user detials updated successfully' : 'Details Updated';
            //sending message to front end
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

// ##################--commission--##############
    //function to get commision type
    getCommisionType = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('login/getCommissionType',JSON.stringify(req.body), JSON.stringify(req.query))
            // sql query parameter
            var searchKeyValue = {
                user_uuid: req.query.user_uuid
            }
            if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }
            var key = ["comm_type"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get  str user_uuid, bool mpin_status
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (lisResponce1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'Uer not found'}] });
            }

            // console.log(lisResponce1)
            let commisionType = lisResponce1[0].comm_type

            if(commisionType == 0) return res.status(204).json({msg : 'commission not set'})

            if(commisionType == 1){
                var searchKeyValue = {
                    user_uuid: req.query.user_uuid
                }
                const opertatorList = await commonQueryCommon.getAllOperatorWithId()

                // console.log(opertatorList)
                if(opertatorList.length == 0) return res.status(400).json({ errors: [ {msg : 'Operator list not found'}] });

                var key = ["commission_Value AS commissionValue","op1_uuid","op1_name","op1_wallet_active","op1_wallet_limit"
                                            ,"op2_uuid","op2_name","op2_wallet_active","op2_wallet_limit"
                                            ,"op3_uuid","op3_name","op3_wallet_active","op3_wallet_limit"
                                            ,"op4_uuid","op4_name","op4_wallet_active","op4_wallet_limit"
                                            ,"op5_uuid","op5_name","op5_wallet_active","op5_wallet_limit"]
                var orderby = "userid"
                var ordertype = "ASC"

                // fire sql query to get  str user_uuid, bool mpin_status
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName10, searchKeyValue, key, orderby, ordertype, 1, 0)

                // check sql rsponce
                if (lisResponce1.length === 0) {
                    return res.status(204).send({msg : 'Slab not found'})
                }

                var objFinalResponse = {
                    commissionType : "Prepaid",
                    commissionValue : lisResponce1[0].commissionValue
                }

                var commissionList = []

                for (var i = 0; i < opertatorList.length;i++){
                    var objData = {
                        operator_uuid : opertatorList[i].operatorUuid,
                        operatorName : opertatorList[i].operator_name,
                        activeState : lisResponce1[0]["op"+opertatorList[i].operator_id+"_wallet_active"],
                        walletLimit : lisResponce1[0]["op"+opertatorList[i].operator_id+"_wallet_limit"]
                    }
                    commissionList.push(objData)
                }

                objFinalResponse.commissionList = commissionList

                return res.status(200).send(objFinalResponse)
            }
            if(commisionType == 2){
                // 2) get the slab details from the slab table using slab uuid
                var searchKeyValue = {
                    user_uuid: req.query.user_uuid
                }
                var key = ["CAST(slab_uuid AS CHAR(16)) AS slab_uuid","slab_name"]
                var orderby = "slab_name"
                var ordertype = "ASC"

                // fire sql query to get  str user_uuid, bool mpin_status
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName8, searchKeyValue, key, orderby, ordertype, 1, 0)

                // check sql rsponce
                if (lisResponce1.length === 0) {
                    return res.status(204).send({msg : 'Commission details not found'})
                }

                var responce  = lisResponce1[0]

                var objFinalResponse = {
                    commissionType : "Postpaid",
                    ...responce
                }
                // console.log(objFinalResponse,lisResponce1[0])

                return res.status(200).send(objFinalResponse)

            } 
            if(commisionType == 3){
                return res.status(200).send({commissionType : "Post Paid as 1st transaction",})
            }

            return res.status(400).json({ errors: [ {msg : 'commission type not found'}] });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    addPostPaidCommision = async(req, res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/addPostPaidCommission',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //get login user id
            // sql query parameter
            var searchKeyValue = {
                user_uuid: req.body.user_uuid,
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
            var key = ["userid","user_uuid",'usertype_id','parent_id',"comm_type"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get  str user_uuid, bool mpin_status
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (lisResponce1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }

            //check parent commission type
            // if parent is admin then ok, else parent commission type will be the child commission type
                if(lisResponce1[0].parent_id != 1){
                    var intParentCommissionType = await sqlQueryReplica.searchQuery(this.tableName1,{userid : lisResponce1[0].parent_id,Active : 1},["comm_type"],'userid','ASC',1,0)
                    if(intParentCommissionType.length === 0) return res.status(400).json({ errors: [ {msg : 'Parent id not found'}] });
                    if(intParentCommissionType[0].comm_type != 2) {
                        let strParentCommissionType = intParentCommissionType[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                        return res.status(400).json({ errors: [ {msg : 'Parent have ' + strParentCommissionType + " commission type so child should have same commission type"}] });
                    }
                }

            if(lisResponce1[0].comm_type == 1 || lisResponce1[0].comm_type == 3){
                let type = lisResponce1[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                return res.status(400).json({ errors: [ {msg : 'Commission type is '+type+ " and not allowed to update."}] });
            }

            // 1) get the slab details from the slab table using slab uuid
            var searchKeyValue = {
                slab_uuid: req.body.slab_uuid,
                slab_name: req.body.slabName,
                userid : lisResponce1[0].parent_id // parent id from the user whose commission is being set
            }
            var key = ["wallet1_comm",'wallet2_comm',"wallet3_comm","wallet4_comm","wallet5_comm"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to get  str user_uuid, bool mpin_status
            const lisResponce2 = await sqlQueryReplica.searchQuery(this.tableName9, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (lisResponce2.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'Slab not found'}] });
            }

            // 2) add commision type 2 in login  
            var param = {
                comm_type: 2 //bool status
            }
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str user uuid
                Active : 1
            }

            // fire sql query to add M-pin status
            var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            var { affectedRows, changedRows, info } = objResponce;
            if(!affectedRows) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
        
            // update commission if existes for that user
                var param = {
                    slab_uuid : req.body.slab_uuid, // str slab slab_uuid
                    slab_name : req.body.slabName, //slab name
                    op1_comm:lisResponce2[0].wallet1_comm,
                    op2_comm:lisResponce2[0].wallet2_comm,
                    op3_comm:lisResponce2[0].wallet3_comm,
                    op4_comm:lisResponce2[0].wallet4_comm,
                    op5_comm:lisResponce2[0].wallet5_comm,
                    last_updated_by: (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                    last_updated_by_type: (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ? 1 : 2, //str user type
                    last_updated_on : isodate
                }

                var searchKeyValue = {
                    user_uuid: req.body.user_uuid
                }

                // fire sql query to update country name
                const objResult = await sqlQuery.updateQuery(this.tableName8, param, searchKeyValue);

                // check if the result is there and responce accordingly
                var { affectedRows, changedRows, info } = objResult;
                var message = !affectedRows ? 'Commission not found' :
                    affectedRows && changedRows ? 'Commission updated successfully' : 'Details Updated';

                if(affectedRows) return res.send({ message, info });

            // create commission if not existes 
                param.userid = lisResponce1[0].userid
                param.user_uuid = lisResponce1[0].user_uuid //str user uuid
                param.usertype_id = lisResponce1[0].usertype_id // int usertype_id
                param.parent_id = lisResponce1[0].parent_id
                param.created_by_type = (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? 1 : 2
                param.created_by= (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                param.created_on = isodate

                // fire sql query to create new country
                const objresult = await sqlQuery.createQuery(this.tableName8, param)

                //check result and responce accordingly
                return res.status(201).send({ message: 'commission created successfully' });

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updatePostPaidCommission = async (req, res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/updatePostPaidCommission',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get agent details to check commission type
                var searchKeyValue = {
                    user_uuid : req.body.user_uuid,
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
                var key = ['userid','username AS agentUserid','full_name','parent_id','comm_type','usertype_id',"CAST(region_uuid AS CHAR(16)) AS region_uuid",'region_id']
                const agentDetails = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key,'userid','ASC',1,0)
                if(agentDetails.length == 0) return res.status(400).json({ errors: [ {msg : "Agent not found"}] });
                if(agentDetails[0].comm_type == 0){
                    return this.addPostPaidCommision(req,res)
                }
                if(agentDetails[0].comm_type == 1) return res.status(400).json({ errors: [ {msg : "Agent commission type is pre paid cant update to post paid"}] });
                const agentid = agentDetails[0].userid
        
            // get slab details
                const assignedSlab = await sqlQueryReplica.searchQuery(this.tableName9,{slab_uuid : req.body.slab_uuid, userid : agentDetails[0].parent_id},['slab_name','wallet1_comm','wallet2_comm','wallet3_comm',"wallet4_comm","wallet5_comm"],'slab_id','ASC',1,0)
                if(assignedSlab.length == 0) return res.status(400).json({ errors: [ {msg : "Paretn lab not found"}] });
            
            // start transaction 
                let transaction = await sqlQuery.specialCMD('transaction')

            // agentcurrent slab details 
                const currentSlab = await sqlQuery.searchQueryTran(this.tableName8,{user_uuid:req.body.user_uuid},["slab_name","CAST(slab_uuid AS CHAR(16)) AS slab_uuid",'op1_comm','op2_comm','op3_comm','op4_comm','op5_comm'],'userid','ASC',1,0)
                if(currentSlab.length == 0) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "agent current slab not found"}] });
                }

                let logData = [];
                logData.push({ 
                    userid : agentDetails[0].userid,
                    username : agentDetails[0].agentUserid,
                    user_uuid : req.body.user_uuid,
                    full_name : agentDetails[0].full_name,
                    mobile : agentDetails[0].mobile ? agentDetails[0].mobile : 0,
                    created_on : isodate,
                    created_by_type : (req.body.user_detials.type == userList.SubAdmin || req.body.user_detials.type == userList.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, // 1- Admin ,2- Member
                    user_type : agentDetails[0].usertype_id, // userList
                    ip_address :req.body.userIpAddress ?  req.body.userIpAddress : 0,
                    mac_address : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                    os_details : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                    imei_no : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                    gcm_id : req.body.userGcmId ?  req.body.userGcmId : 0,  // to send notification
                    app_version : req.body.userAppVersion ?  req.body.userAppVersion : 0,  // our app version
                    source : req.body.userApplicationType ?  req.body.userApplicationType : 0,  // 1: web, 2 : app
                    description : "Assign new slab", 
                    activity_type : 18, // 1-Login;2-Change Password;3-Change Profile
                    old_value : currentSlab[0].slab_uuid+' , '+currentSlab[0].slab_name,
                    modified_value : req.body.slab_uuid+' , '+assignedSlab[0].slab_name,
                    region_id : agentDetails[0].region_id
                });

                var param = {
                    slab_uuid : req.body.slab_uuid,
                    slab_name : assignedSlab[0].slab_name,
                    op1_comm : assignedSlab[0].wallet1_comm,
                    op2_comm : assignedSlab[0].wallet2_comm,
                    op3_comm : assignedSlab[0].wallet3_comm,
                    op4_comm : assignedSlab[0].wallet4_comm,
                    op5_comm : assignedSlab[0].wallet5_comm,
                    last_updated_by_type :  (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? 1 : 2,
                    last_updated_by : (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid,
                    last_updated_on : isodate
                }
                var ObjResult = await sqlQuery.updateQuery(this.tableName8, param, {user_uuid: req.body.user_uuid})
                const { affectedRows, changedRows, info } = ObjResult;
                const message = !affectedRows ? 'user not found' :
                            affectedRows && changedRows ? 'Commission updated successfully' : 'Details Updated';
                if(affectedRows && changedRows){
                    if(currentSlab[0].op1_comm > assignedSlab[0].wallet1_comm || currentSlab[0].op2_comm > assignedSlab[0].wallet2_comm || currentSlab[0].op3_comm > assignedSlab[0].wallet3_comm || currentSlab[0].op4_comm > assignedSlab[0].wallet4_comm || currentSlab[0].op5_comm > assignedSlab[0].wallet5_comm){
                        let perD1,perD2,perD3,perD4,perD5

                        let usertype = req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ? 1 : 2
                        let userid = (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid
                        let accessDetails = {
                            userIpAddress : req.body.userIpAddress ?  req.body.userIpAddress : 0,
                            userMacAddress : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                            userOsDetails : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                            userImeiNumber : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                            userGcmId : req.body.userGcmId ?  req.body.userGcmId : 0,
                            userAppVersion : req.body.userAppVersion ?  req.body.userAppVersion : 0,
                            userApplicationType : req.body.userApplicationType ?  req.body.userApplicationType : 0,
                        }

                        perD1 = currentSlab[0].op1_comm > assignedSlab[0].wallet1_comm ? (Number(currentSlab[0].op1_comm - Number(assignedSlab[0].wallet1_comm)))/Number(currentSlab[0].op1_comm) : 0
                        perD2 = currentSlab[0].op2_comm > assignedSlab[0].wallet2_comm ? (Number(currentSlab[0].op2_comm - Number(assignedSlab[0].wallet2_comm)))/Number(currentSlab[0].op2_comm) : 0
                        perD3 = currentSlab[0].op3_comm > assignedSlab[0].wallet3_comm ? (Number(currentSlab[0].op3_comm - Number(assignedSlab[0].wallet3_comm)))/Number(currentSlab[0].op3_comm) : 0
                        perD4 = currentSlab[0].op4_comm > assignedSlab[0].wallet4_comm ? (Number(currentSlab[0].op4_comm - Number(assignedSlab[0].wallet4_comm)))/Number(currentSlab[0].op4_comm) : 0
                        perD5 = currentSlab[0].op5_comm > assignedSlab[0].wallet5_comm ? (Number(currentSlab[0].op5_comm - Number(assignedSlab[0].wallet5_comm)))/Number(currentSlab[0].op5_comm) : 0
                        
                        const last_updated_by_type =  (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? 1 : 2
                        const last_updated_by = (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid
                        const last_updated_on = isodate
                        
                        let commissionChange = await this.updatePostPaid(agentDetails[0].userid,perD1,perD2,perD3,perD4,perD5,last_updated_by_type,last_updated_by,last_updated_on,logData,accessDetails,usertype,userid)
                        if(commissionChange == -1){
                            let rollback = await sqlQuery.specialCMD('rollback')
                            return res.status(400).json({ errors: [ {msg : 'commission update failed'}] });
                        }

                        const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:commissionChange})
                            var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                                //  //  console.log('Server Log : '+strLog)
                            if(intResult != 1){
                                // rollback
                                let rollback = await sqlQuery.specialCMD('rollback')
                                return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                            }

                        let commit = await sqlQuery.specialCMD('commit')
                        return res.status(200).send({message:'commission update successfully'})

                    }else{
                        
                        const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:logData})
                        var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                            //  //  console.log('Server Log : '+strLog)
                        
                        if(intResult != 1){
                            // rollback
                            let rollback = await sqlQuery.specialCMD('rollback')
                            return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                        }
    
                        // send responce to fornt end
                            let commit = await sqlQuery.specialCMD('commit')
                            return res.send({ message, info });
                    }

                }else{
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : 'parent update failed'}] });
                }

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    async updatePostPaid (userid,perD1,perD2,perD3,perD4,perD5,last_updated_by_type,last_updated_by,last_updated_on,logData,accessDetails,usertype,Useruserid) { 
        // get slab list
        // console.log("commission percentage ",perD1,perD2,perD3,perD4,perD5)

        var date = new Date();
        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
        var isodate = date.toISOString();

        var slabList = await sqlQueryReplica.searchQueryNoLimitTran(this.tableName9,{userid:userid},['CAST(slab_uuid AS CHAR(16)) AS slab_uuid','wallet1_comm','wallet2_comm','wallet3_comm','wallet4_comm','wallet5_comm'],'userid','ASC')
        if (slabList.length == 0) return logData
        else{
            let slab,i=0
            for(i = 0; i < slabList.length ; i++){
                slab = slabList[i]
                let slabComm1,slabComm2,slabComm3,slabComm4,slabComm5
                slabComm1 = perD1 > 0 ? Number(slab.wallet1_comm) - (Number(slab.wallet1_comm)*perD1) : slab.wallet1_comm
                slabComm2 = perD2 > 0 ? Number(slab.wallet2_comm) - (Number(slab.wallet2_comm)*perD2) : slab.wallet2_comm
                slabComm3 = perD3 > 0 ? Number(slab.wallet3_comm) - (Number(slab.wallet3_comm)*perD3) : slab.wallet3_comm
                slabComm4 = perD4 > 0 ? Number(slab.wallet4_comm) - (Number(slab.wallet4_comm)*perD4) : slab.wallet4_comm
                slabComm5 = perD5 > 0 ? Number(slab.wallet5_comm) - (Number(slab.wallet5_comm)*perD5) : slab.wallet5_comm
                var param = {
                    wallet1_comm : slabComm1,
                    wallet2_comm : slabComm2,
                    wallet3_comm : slabComm3,
                    wallet4_comm : slabComm4,
                    wallet5_comm : slabComm5,
                    last_modified_by:last_updated_by,
                    last_modified_on:last_updated_on,
                    modified_by_type:last_updated_by_type
                }
                var slabUpdRes = await sqlQuery.updateQuery(this.tableName9,param,{slab_uuid : slab.slab_uuid})
                if(!slabUpdRes.affectedRows) return -1

                // update agent with same commission slab uuid
                var param1 = {
                    op1_comm :slabComm1,
                    op2_comm :slabComm2,
                    op3_comm :slabComm3,
                    op4_comm :slabComm4,
                    op5_comm :slabComm5,
                    last_updated_by_type : last_updated_by_type,
                    last_updated_by : last_updated_by,
                    last_updated_on : last_updated_on
                }

                let childList = await sqlQueryReplica.searchQueryNoLimitTran(this.tableName8,{slab_uuid : slab.slab_uuid},['userid'],'userid','ASC')
                if(childList.length == 0) continue

                var chiUpdateRes = await sqlQuery.updateQuery(this.tableName8, param1,{slab_uuid : slab.slab_uuid})
                if(!chiUpdateRes.affectedRows) return -1

                let childDetails,j = 0
                for(j = 0; j<childList.length; j++){
                    let child = childList[j]

                    // get child detail
                    childDetails = await sqlQueryReplica.searchQuery(this.tableName1,{userid:child.userid,Active : 1},['CAST(user_uuid AS CHAR(16)) AS user_uuid', 'full_name', 'mobile', 'username','region_id','usertype_id'],'userid','ASC', 1, 0)
                    if(childDetails.length == 0) return -1

                    //push details in the logData
                    logData.push({ 
                        userid : child.userid,
                        username : childDetails[0].username,
                        user_uuid : childDetails[0].user_uuid,
                        full_name : childDetails[0].full_name,
                        mobile : childDetails[0].mobile ? childDetails[0].mobile : 0,
                        created_on : isodate,
                        created_by_type : Useruserid, // 1- Admin ,2- Member
                        user_type : childDetails[0].usertype_id, // role
                        ip_address : accessDetails.userIpAddress,
                        mac_address : accessDetails.userMacAddress,
                        os_details : accessDetails.userOsDetails,
                        imei_no : accessDetails.userImeiNumber,
                        gcm_id : accessDetails.userGcmId,  // to send notification
                        app_version : accessDetails.userAppVersion,  // our app version
                        source : accessDetails.userApplicationType,  // 1: web, 2 : app
                        description : "Parent slab change", 
                        activity_type : 18, // 1-Login;2-Change Password;3-Change Profile
                        old_value : slab.wallet1_comm.toFixed(2).toString() + "," + slab.wallet2_comm.toFixed(2).toString() + "," + slab.wallet3_comm.toFixed(2).toString() + "," + slab.wallet4_comm.toFixed(2).toString() + "," + slab.wallet5_comm.toFixed(2).toString(),
                        modified_value : slabComm1.toFixed(2).toString() + "," + slabComm2.toFixed(2).toString() + "," + slabComm3.toFixed(2).toString() + "," + slabComm4.toFixed(2).toString() + "," + slabComm5.toFixed(2).toString(),
                        region_id : childDetails[0].region_id
                    })

                    let childUpdateRes = await this.updatePostPaid(child.userid,perD1,perD2,perD3,perD4,perD5,last_updated_by_type,last_updated_by,last_updated_on,logData,accessDetails,usertype,Useruserid)
                    if(childUpdateRes == -1 ) return -1
                    logData = childUpdateRes
                }
            }
            return logData
        }
    }

    //function to add commission afor pre paid user
    addPrePaidCommission = async (req, res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/addPrePaidCommission',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            if(Number(req.body.commissionValue) >= 100) return res.status(400).json({ errors: [ {msg : 'Commission percent should be less than 100'}] });

            //get login user id
            // sql query parameter
            var searchKeyValue = {
                user_uuid: req.body.user_uuid,
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
            var key = ["userid","user_uuid",'usertype_id','parent_id','comm_type']
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get  userid, user_uuid, usertype_id, parent_id
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (lisResponce1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }

            //check parent commission type
            // if parent is admin then ok, else parent commission type will be the child commission type
            if(lisResponce1[0].parent_id != 1){
                var intParentCommissionType = await sqlQueryReplica.searchQuery(this.tableName1,{userid : lisResponce1[0].parent_id,Active : 1},["comm_type"],'userid','ASC',1,0)
                if(intParentCommissionType.length === 0) return res.status(400).json({ errors: [ {msg : 'Parent id not found'}] });
                if(intParentCommissionType[0].comm_type != 1) {
                    let strParentCommissionType = intParentCommissionType[0].comm_type == 2 ? "Post-Paid" : "Pre-Paid as 1st transaction"
                    return res.status(400).json({ errors: [ {msg : 'Parent have ' + strParentCommissionType + " commission type so child should have same commission type"}] });
                }
                // get commission value of parent and compare the value with child commission
                var intParentCommissionValue = await sqlQueryReplica.searchQuery(this.tableName10,{userid : lisResponce1[0].parent_id},['commission_value'],'userid','ASC',1,0)
                if(intParentCommissionValue.length === 0) return res.status(400).json({ errors: [ {msg : 'Parent commission is not found'}]})
                if( req.body.commissionValue != '0' && Number(intParentCommissionValue[0].commission_value) <= Number(req.body.commissionValue) ) return res.status(400).json({ errors: [ {msg : "Child Commission % should exceed from Parent"}]})
            }

            if(lisResponce1[0].comm_type == 2 || lisResponce1[0].comm_type == 3){
                let type = lisResponce1[0].comm_type == 2 ? "Post-Paid" : "Pre-Paid as 1st transaction"
                return res.status(400).json({ errors: [ {msg : 'Commission type is '+type+ " and not allowed to update."}] });
            }

            // 1) add commision type 1 in login  
            var param = {
                comm_type: 1 //bool status
            }
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str user uuid
                Active : 1
            }

            // fire sql query to add M-pin status
            var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            var { affectedRows, changedRows, info } = objResponce;
            if(!affectedRows) return res.status(400).json({ errors: [ {msg : 'user not found'}]})

            //param genrrator
            const lisOperatorIds = await commonQueryCommon.getAllOperatorWithId()
            
            const lisCommisionDetails = req.body.commisionList

            // console.log(lisCommisionDetails)
            param = {
                commission_value: Number(req.body.commissionValue),
                last_updated_by_type: (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? 1 : 2 ,
                last_updated_by : (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                last_updated_on : isodate
            }

            // console.log(lisOperatorIds)

            for(var i = 0;i< lisOperatorIds.length;i++){
                
                // console.log(lisCommisionDetails[i].operator_uuid , lisOperatorIds[i].operatorUuid)
                if(lisCommisionDetails[i] === undefined || lisCommisionDetails[i].operator_uuid != lisOperatorIds[i].operatorUuid) return res.status(400).json({ errors: [ {msg : 'error in request'}]})
                param["op"+lisOperatorIds[i].operator_id+"_uuid"] = lisCommisionDetails[i].operator_uuid
                param["op"+lisOperatorIds[i].operator_id+"_name"] = lisOperatorIds[i].operator_name
                param["op"+lisOperatorIds[i].operator_id+"_wallet_active"] = lisCommisionDetails[i].active
                param["op"+lisOperatorIds[i].operator_id+"_wallet_limit"] = lisCommisionDetails[i].limit
            }  

            // console.log(param)

            var searchKeyValue = {
                user_uuid: req.body.user_uuid, 
            }

            // fire sql query to update country name
            const objResult = await sqlQuery.searchQuery(this.tableName10, searchKeyValue,['COUNT(1)'],"user_uuid",'ASC',1,0);

            if(objResult.length > 0 && objResult[0]["COUNT(1)"] > 0){
                // if commission found then send responce  
                return this.updatePrePaidCommission(req, res)
            }

            param.userid = lisResponce1[0].userid, 
            param.user_uuid = lisResponce1[0].user_uuid, //str user uuid
            param.usertype_id = lisResponce1[0].usertype_id, // int usertype_id
            param.parent_id = lisResponce1[0].parent_id,
            param.created_by_type = (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? 1 : 2 
            param.created_by=(req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
            param.created_on = isodate   

            // fire sql query to create new country
            const objresult = await sqlQuery.createQuery(this.tableName10, param)

            //check result and responce accordingly
            return res.status(201).send({ message: 'commission created successfully' });

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updatePrePaidCommission = async (req, res) => {
        try{
            // console.log(req.body)
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/updatePrePaidCommission',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get agent details to check commission type
                var searchKeyValue = {
                    user_uuid : req.body.user_uuid,
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
                var key = ['userid','username AS agentUserid','full_name','parent_id','comm_type','usertype_id',"CAST(region_uuid AS CHAR(16)) AS region_uuid",'region_id']
                const agentDetails = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key,'userid','ASC',1,0)
                if(agentDetails.length == 0) return res.status(400).json({ errors: [ {msg : "Agent not found"}] });
                if(agentDetails[0].comm_type == 0){
                    // assign a new commission
                    return this.addPrePaidCommission(req, res)
                }
                if(agentDetails[0].comm_type == 2) return res.status(400).json({ errors: [ {msg : "Agent commission is post paid cant change to prepaid"}] });
                const agentid = agentDetails[0].userid

            // get parent details
                var searchKeyValue = {
                    userid : agentDetails[0].parent_id,
                    Active : 1
                }
                var key = ['userid','username AS agentUserid','full_name']
                const oldParentDetails = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key,'userid','ASC',1,0)
                if(oldParentDetails.length == 0) return res.status(400).json({ errors: [ {msg : "Parent not found"}] });

            // get parent commmission value
                let parentCommission
                parentCommission = [{commission_value : 100}]
                if(agentDetails[0].parent_id != 1){
                    var searchKeyValue = {
                        userid : agentDetails[0].parent_id
                    }
                    var key = ['commission_value']
                    parentCommission = await sqlQueryReplica.searchQuery(this.tableName10,searchKeyValue,key,'userid','ASC',1,0)
                    if(parentCommission.length == 0) return res.status(400).json({ errors: [ {msg : "Parent commission not found"}] });
                }

            // start transaction 
                let transaction = await sqlQuery.specialCMD('transaction')
                
            // get agen current commission value
                var searchKeyValue = {
                    user_uuid : req.body.user_uuid
                }
                var key = ['commission_value']
                const agentCommission = await sqlQueryReplica.searchQueryTran(this.tableName10,searchKeyValue,key,'userid','ASC',1,0)
                if(agentCommission.length == 0) {
                    // rollback
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Agent commission not found"}] });
                }

            // compare the commission 
                // console.log(req.body.commissionValue,parentCommission[0].commission_value,)
                if (req.body.commissionValue != 0 && Number(req.body.commissionValue) >= Number(parentCommission[0].commission_value)){
                    // rollback
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Given commission is more then parent commission"}] });
                }

                let logData = [];
                logData.push({ 
                    userid : agentDetails[0].userid,
                    username : agentDetails[0].agentUserid,
                    user_uuid : req.body.user_uuid,
                    full_name : agentDetails[0].full_name,
                    mobile : agentDetails[0].mobile ? agentDetails[0].mobile : 0,
                    created_on : isodate,
                    created_by_type : (req.body.user_detials.type == userList.SubAdmin || req.body.user_detials.type == userList.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, // 1- Admin ,2- Member
                    user_type : agentDetails[0].usertype_id, // userList
                    ip_address :req.body.userIpAddress ?  req.body.userIpAddress : 0,
                    mac_address : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                    os_details : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                    imei_no : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                    gcm_id : req.body.userGcmId ?  req.body.userGcmId : 0,  // to send notification
                    app_version : req.body.userAppVersion ?  req.body.userAppVersion : 0,  // our app version
                    source : req.body.userApplicationType ?  req.body.userApplicationType : 0,  // 1: web, 2 : app
                    description : "Commission update", 
                    activity_type : 21, // 1-Login;2-Change Password;3-Change Profile
                    old_value : agentCommission[0].commission_value,
                    modified_value : req.body.commissionValue,
                    region_id : agentDetails[0].region_id
                });

                const lisOperatorIds = await commonQueryCommon.getAllOperatorWithId()
            
                const lisCommisionDetails = req.body.commisionList
                
                var param = { 
                    commission_value : Number(req.body.commissionValue),
                    last_updated_by_type: (req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin) ? 1 : 2 ,
                    last_updated_by : (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                    last_updated_on : isodate
                }

                for(var i = 0;i< lisOperatorIds.length;i++){
                
                    // console.log(lisCommisionDetails[i].operator_uuid , lisOperatorIds[i].operatorUuid)
                    if(lisCommisionDetails[i] === undefined || lisCommisionDetails[i].operator_uuid != lisOperatorIds[i].operatorUuid) return res.status(400).json({ errors: [ {msg : 'error in request'}]})
                    param["op"+lisOperatorIds[i].operator_id+"_uuid"] = lisCommisionDetails[i].operator_uuid
                    param["op"+lisOperatorIds[i].operator_id+"_name"] = lisOperatorIds[i].operator_name
                    param["op"+lisOperatorIds[i].operator_id+"_wallet_active"] = lisCommisionDetails[i].active
                    param["op"+lisOperatorIds[i].operator_id+"_wallet_limit"] = lisCommisionDetails[i].limit
                }

                var searchKeyValue = {
                    user_uuid : req.body.user_uuid
                }
                
                const ObjResult = await sqlQuery.updateQuery(this.tableName10, param, searchKeyValue)

                if (Number(req.body.commissionValue) >= Number(agentCommission[0].commission_value)){
                    // update commission no need to change agent child commission
                    const { affectedRows, changedRows, info } = ObjResult;
                    const message = !affectedRows ? 'user not found' :
                        affectedRows && changedRows ? 'Commission updated successfully' : 'Details Updated';

                    const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:logData})
                    var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                        //  //  console.log('Server Log : '+strLog)
                    if(intResult != 1){
                        // rollback
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                    }

                    // send responce to fornt end
                    let commit = await sqlQuery.specialCMD('commit')
                    return res.send({ message, info });
                }else{

                    // case when given commission value is less then current commission

                    const { affectedRows, changedRows, info } = ObjResult;

                    if(affectedRows){ 
                        let usertype = req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ? 1 : 2
                        let userid = (req.body.user_detials.type === userList.Admin || req.body.user_detials.type === userList.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid
                        let accessDetails = {
                            userIpAddress : req.body.userIpAddress ?  req.body.userIpAddress : 0,
                            userMacAddress : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                            userOsDetails : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                            userImeiNumber : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                            userGcmId : req.body.userGcmId ?  req.body.userGcmId : 0,
                            userAppVersion : req.body.userAppVersion ?  req.body.userAppVersion : 0,
                            userApplicationType : req.body.userApplicationType ?  req.body.userApplicationType : 0,
                        }

                        let commPerDec = (Number(agentCommission[0].commission_value)-Number(req.body.commissionValue))/Number(agentCommission[0].commission_value)
                        
                        let commissionChange = await this.updateAgentPrePaidCommission(agentid,commPerDec,Number(req.body.commissionValue),logData,accessDetails,usertype,userid)
                        if(commissionChange == -1){
                            let rollback = await sqlQuery.specialCMD('rollback')
                            return res.status(400).json({ errors: [ {msg : 'parent update failed'}] });
                        }
                        
                        const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:commissionChange})
                        var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                            //  //  console.log('Server Log : '+strLog)
                        if(intResult != 1){
                            // rollback
                            let rollback = await sqlQuery.specialCMD('rollback')
                            return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                        }
                        
                        let commit = await sqlQuery.specialCMD('commit')
                        
                        return res.status(200).send({message:'Commission updated successfully'})

                    }else{ 
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : 'parent update failed'}] });
                    }

                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    async updateAgentPrePaidCommission (agentid,comPerDec,commission,logData,accessDetails,usertype,userid) { 
        
        var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();
        
        // get the child list 
        var searchKeyValue = {
            parent_id : agentid,
        }
        var key = ['userid','commission_value']
        const listChild = await sqlQueryReplica.searchQueryNoLimitTran(this.tableName10, searchKeyValue, key,'userid','ASC')
        // console.log(listChild)
        if(listChild.length == 0) return logData

        let child,childDetails,decreasedCommission,updateCommission,changeChildComm, i = 0

        for(i=0;i<listChild.length;i++){
            child = listChild[i]

            decreasedCommission = Number(child.commission_value) - (Number(child.commission_value)*comPerDec)

            if (commission > Number(child.commission_value)) return logData

            // get child detail
            childDetails = await sqlQueryReplica.searchQuery(this.tableName1,{userid:child.userid,Active : 1},['CAST(user_uuid AS CHAR(16)) AS user_uuid', 'full_name', 'mobile', 'username','region_id','usertype_id'],'userid','ASC', 1, 0)
            if(childDetails.length == 0) return -1

            //push details in the logData
            logData.push({ 
                userid : child.userid,
                username : childDetails[0].username,
                user_uuid : childDetails[0].user_uuid,
                full_name : childDetails[0].full_name,
                mobile : childDetails[0].mobile ? childDetails[0].mobile : 0,
                created_on : isodate,
                created_by_type : userid, // 1- Admin ,2- Member
                user_type : childDetails[0].usertype_id, // userList
                ip_address : accessDetails.userIpAddress,
                mac_address : accessDetails.userMacAddress,
                os_details : accessDetails.userOsDetails,
                imei_no : accessDetails.userImeiNumber,
                gcm_id : accessDetails.userGcmId,  // to send notification
                app_version : accessDetails.userAppVersion,  // our app version
                source : accessDetails.userApplicationType,  // 1: web, 2 : app
                description : "Switch Account Commission update", 
                activity_type : 21, // 1-Login;2-Change Password;3-Change Profile
                old_value : child.commission_value,
                modified_value : decreasedCommission,
                region_id : childDetails[0].region_id
            })

            updateCommission = await sqlQuery.updateQuery(this.tableName10,{
                commission_value:decreasedCommission,
                last_updated_by_type: usertype,
                last_updated_by : userid, //str user id
                last_updated_on : isodate
            },{userid:child.userid})
            // console.log(updateCommission)
            if (!updateCommission.affectedRows) return -1
            
            logData = await this.updateAgentPrePaidCommission(child.userid,comPerDec,decreasedCommission,logData,accessDetails,usertype,userid)

            if(changeChildComm == -1) return -1
        }
        return logData
    }

    addPrePaidas1stTran = async(req,res, next)=>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/addPrePaidas1stTran',JSON.stringify(req.body), JSON.stringify(req.query))
            //get login user id
            // sql query parameter
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str
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
            var key = ["userid","user_uuid",'usertype_id','parent_id','comm_type']
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get  userid, user_uuid, usertype_id, parent_id
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (lisResponce1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }

            //check parent commission type
            // if parent is admin then ok, else parent commission type will be the child commission type
            if(lisResponce1[0].parent_id != 1){
                var intParentCommissionType = await sqlQueryReplica.searchQuery(this.tableName1,{userid : lisResponce1[0].parent_id},["comm_type"],'userid','ASC',1,0)
                if(intParentCommissionType.length === 0) return res.status(400).json({ errors: [ {msg : 'Parent id not found'}] });
                if(intParentCommissionType[0].comm_type != 1) {
                    let strParentCommissionType = intParentCommissionType[0].comm_type == 2 ? "Post-Paid" : "Pre-Paid as 1st transaction"
                    return res.status(400).json({ errors: [ {msg : 'Parent have ' + strParentCommissionType + " commission type so child should have same commission type"}] });
                }
            }

            // 1) add commision type 1 in login  
            var param = {
                comm_type: 3 //bool status
            }
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str user uuid
                comm_type : 0,
                Active : 1
            }

            // fire sql query to add M-pin status
            var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            var { affectedRows, changedRows, info } = objResponce;
            var message = !affectedRows ? 'Commission change not allowed' :
                affectedRows && changedRows ? 'Commission updated successfully' : 'Details Updated';

            res.send({ message, info });

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

//#############-- M-Pin -----#############

    //function to add m-pin
    addMpin = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/addMpin',JSON.stringify(req.body), JSON.stringify(req.query))
            //1)-get agent m_pin
                // sql query parameter
                var searchKeyValue = {
                    user_uuid: req.body.user_uuid,
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
                var key = ["mpin_status AS mpinStatus"]
                var orderby = "emailid"
                var ordertype = "ASC"

                // fire sql query to get  str user_uuid, bool mpin_status
                const lisResults = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                if(lisResults.length == 0) return res.status(400).json({ errors: [ {msg : 'user not found'}] });

            //2)-add M-pin status in login table
                //variable for sql query for prepaid
                var param = {
                    mpin_status: !lisResults[0].mpinStatus //bool status
                }
                var searchKeyValue = {
                    user_uuid: req.body.user_uuid, //str user uuid
                    Active : 1
                }

                // fire sql query to add M-pin status
                const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

                // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'user login not found' :
                    affectedRows && changedRows ? 'M-pin Added successfully' : 'faild to add m-pin';
                // send responce to front end
                res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get m-pin status
    getMpin = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('login/getMpin',JSON.stringify(req.body), JSON.stringify(req.query))
            // sql query parameter
            var searchKeyValue = {
                user_uuid: req.query.user_uuid, //str
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
            var key = ["mpin_status AS mpinStatus"]
            var orderby = "emailid"
            var ordertype = "ASC"

            // fire sql query to get  str user_uuid, bool mpin_status
            const lisResults = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (lisResults.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }
            //send responce to front end
            return res.status(200).send(lisResults[0])

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

//###################################################

    changeAgentActiveState = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/changeAgentActiveState',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();
            //get uer id
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str user uuid
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
            var key = ["user_status"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'User id not found'}] });
            }

            //1)-add M-pin status in login table
            //variable for sql query for prepaid
            var param = {
                last_active_date : date,
                user_status: lisResponse1[0].user_status === 1 ? 2 : 1 //tinyint status,
            }
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str user uuid
                Active : 1
            }
            // console.log(param);
            // fire sql query to add M-pin status
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            await redisMaster.delete(`AGENT_LOGIN_ATTEMPT_${req.body.user_uuid}`)
            await redisMaster.delete(`AGENT_USSD/SMS_ATTEMPT_${req.body.user_uuid}`)

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'user login not found' :
                affectedRows && changedRows ? 'status updated sucessfully' : 'failed to update status';
            // send responce to front end
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    advanceSearch = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('login/advanceSearch',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // // variable for sql query
            //     var offset = req.query.start
            //     var limit = req.query.end - offset

            var searchKeyValue = {
                'NOT parent_id' : req.body.user_detials.userid,
                Active : 1
            }

            // if admin or sub admin then search by region if agent search by agent ids
            if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids = req.body.user_detials.child_list.join(',')
            }

            // all optional search parameter
            if (req.query.parentAgentUuid) {
            let userid = req.query.parentAgentUuid;
             userid =     userid.startsWith("AFP-")? userid : `AFP-${userid}`;
                // check if selected child is in your downline
                var searchKeyValue1 = {
                    username: userid,
                    Active : 1
                }

                // if admin or sub admin then search by region if agent search by agent ids
                if(req.body.user_detials.type == userList.Admin || req.body.user_detials.type == userList.SubAdmin ) {
                    // searchKeyValue1.region_ids = req.body.user_detials.region_list.join(',')
                    if(req.body.user_detials.region_list.length != 7){
                        searchKeyValue1.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    searchKeyValue1.child_ids = req.body.user_detials.child_list.join(',')
                }

                var key = ["child_id","userid"]
                var orderby = "userid"
                var ordertype = "ASC" 

                // fire sql query to get str user_uuid, str full_name, str email, str gender, int mobile, str address,str shop_name, str parent_id,str region_name,int usertype_id, str country name, str province name, str district name
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue1, key, orderby, ordertype, 1, 0)

                // check sql rsponce
                if (lisResponce.length === 0) {
                    return res.status(400).json({ errors: [ {msg : 'selected Parent not found'}] });
                }

                // searchKeyValue.child_ids = lisResponce[0].child_id || '0' //str child slit coma sepreated
                searchKeyValue.parent_id = lisResponce[0].userid
            }
            
            if (req.query.userType_uuid) {
                const lisResponce = await this.checkAgentType(req.query.userType_uuid)
                if (lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'user type uuid not found'}] });
                searchKeyValue.usertype_id = lisResponce[0].agent_type_id //int user typeId
            }

               if (req.query.id) {
                    const userid = req.query.id;
                    searchKeyValue.username = userid.startsWith("AFP-")
                    ? userid
                    : `AFP-${userid}`;
                }
            if (req.query.name) {
                if(Number(req.query.name)) searchKeyValue.mobile = req.query.name
                else searchKeyValue.full_name = req.query.name
            } //str full name
            if (req.query.province_uuid) searchKeyValue.province_uuid = req.query.province_uuid //str uuid
            if (req.query.region_uuid) searchKeyValue.region_uuid = req.query.region_uuid // str region_uuid
            if (req.query.status) searchKeyValue.Active = req.query.status // tinyint 1,2
            if (req.query.mobile) searchKeyValue.mobile = req.query.mobile

            //check if the search parameter are correct or not
            if (Object.keys(searchKeyValue).length == 2) {
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
                if (req.query.start_date) searchKeyValue.start_date = req.query.start_date //dt start date
                if (req.query.end_date) searchKeyValue.end_date = req.query.end_date // dt end date
            }
            //  return res.status(400).json({ errors: [ {msg : 'Invalid values in search parameters'}] });

            const lisTotalRecords = await agentModule.searchAgentCount(searchKeyValue)

            let intTotlaRecords = Number(lisTotalRecords.length)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            const lisResults = await agentModule.searchAgent(searchKeyValue, limit, offset)
            
            // check sql rsponce
            // if (lisResults.length === 0) {
            //     return res.status(204).send({message : "user not found"});
            // }

            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisResults)
            }else{
                res.status(200).send({
                    reportList : lisResults,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
            }

            // //send responce to front end
            // return res.status(200).send(lisResults)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

// function to get upline agent list
    getUplineAgentList = async (req, res) =>{
        try{
            // verify query and param
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('login/getUplineAgentList',JSON.stringify(req.body), JSON.stringify(req.query))
            let sqarchKeyValue = {
                user_uuid : req.query.agentUuid,
                Active : 1, 
            }

            let keys = ['username AS userId','full_name As userName',`CASE usertype_id WHEN 0 THEN 'Admin' WHEN 1 THEN 'Master Distributor' WHEN 2 THEN 'Distributor' WHEN 3 THEN 'Reseller' WHEN 4 THEN 'Retailer' END AS agentType`,'parent_id']

            let agentDetails = await sqlQueryReplica.searchQuery(this.tableName1, sqarchKeyValue, keys, 'userid', 'ASC', 1, 0)
            if(agentDetails.length == 0) return res.status(204).json({message : 'Agent not found'})

            // not get upline agent list
            let parentAgentList = [{
                userId : agentDetails[0].userId,
                userName : agentDetails[0].userName,
                agentType : agentDetails[0].agentType
            }]

            sqarchKeyValue = {
                userid : agentDetails[0].parent_id
            }

            while(true){
                let parentList = await sqlQueryReplica.searchQuery(this.tableName1, sqarchKeyValue, keys, 'userid', 'ASC', 1, 0)
                if(parentList.length == 0) return res.status(400).json({ errors: [ {msg : 'Upline agent list error'}] });
                sqarchKeyValue = {
                    userid : parentList[0].parent_id
                }
                let {parent_id, ...other} = parentList[0]
                parentAgentList = [other].concat(parentAgentList)
                if(parent_id == 0 || parent_id == null) break
            }

            return res.status(200).send(parentAgentList)
    
        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }    

//########-- send registration message --##################

    sendRegistrationMessage = async (req,res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/sendRegistrationMessage',JSON.stringify(req.body), JSON.stringify(req.query))
            // get user phone number
                var searchKeyValue = {
                    user_uuid : req.body.user_uuid, //str
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
                var key = ['userid',"password,username,mobile,encryption_key",'full_name',"m_pin","mpin_status"]
                var orderby = "mobile"
                var ordertype = "ASC"

                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1,searchKeyValue,key, orderby, ordertype, 1, 0)
                if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
                if(!lisResponce[0].mobile) return res.status(400).json({ errors: [ {msg : 'user dont have primary number registered'}]})
                // console.log(lisResponce)

            //decript the password and get plain password
                const strDecriptedPassword = this.getHashPassword(lisResponce[0].encryption_key,lisResponce[0].password)
                const strDecriptedMpin = this.getHashPassword(lisResponce[0].encryption_key,lisResponce[0].m_pin)
                
            // send message phone number
                // const strMessage = "Your account has been successfully created. Please use username: "+ lisResponce[0].username +" and password: "+ strDecriptedPassword +" to login - (URL)"
                // console.log(strMessage)

                // var param = {
                //     send_sms_uuid : "uuid()",
                //     mobile_number : lisResponce[0].mobile,
                //     sms_message : strMessage ,
                //     sms_status : 'Pending' ,
                //     created_on : isodate, //dt current date time
                //     last_modified_on : isodate //dt current date time
                // }

                // const objResult = await sqlQuery.createQuery(this.tableName11, param)

            // send message phone number
                // sms template : Dear ${lisResponce[0].full_name }, Welcome to AfghanPay top-up service, your User ID ${lisResponce[0].username }, Password ${strDecriptedPassword}, M-Pin: ${strDecriptedMpin}, thank you for being AfghanPay Agent!
                // for dari : محترم <agent name> به خدمات متیو افعان‌پی خوش آمدید! نمبر کاربری <agent id> و پسورد شما <Password> است، تشکر از اینکه نماینده افغان پی هستید!

                let smsDetails = {
                    agentId : lisResponce[0].userid,
                    recieverMessage : lisResponce[0].mpin_status == 1 ? `Dear ${lisResponce[0].full_name }, Welcome to AfghanPay top-up service, your User ID ${lisResponce[0].username }, Password ${strDecriptedPassword}, M-Pin: ${strDecriptedMpin}, thank you for being AfghanPay Agent!` : `Dear ${lisResponce[0].full_name }, Welcome to AfghanPay top-up service, your User ID ${lisResponce[0].username }, Password ${strDecriptedPassword}, thank you for being AfghanPay Agent!`
                }
                let smsFunResponce = await smsFunction.agentSms(smsDetails)
                if(smsFunResponce.error){
                    console.log(smsFunResponce.error)
                }
                
            // check if the result is there and responce accordingly
                // if ( onjresult.error ) {
                //     return res.status(400).json({ errors: [ {msg : onjresult.error }] });
                // }

                res.status(200).send({message : 'SMS send'})

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

//########-- update agent active state --#############

    // changeAgentActiveState = async(req,res) => {
    //     try{
    //         const errors = validationResult(req);
    //         if (!errors.isEmpty()) {
    //             return res.status(400).json({ errors: errors.array() });
    //         }

    //         // get agent status
    //             var searchKeyValue = {
    //                 user_uuid : req.body.user_uuid, //str
    //                 Active : 1
    //             }
    //             var key = ["Active"]
    //             var orderby = "userid"
    //             var ordertype = "ASC"

    //             const lisResponce = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
    //             if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}]})

    //         // update agent status
    //             var param = {
    //                 Active : !lisResponce[0].Active
    //             }

    //             const jsonResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

    //             const { affectedRows, changedRows, info } = jsonResult;
    //             const message = !affectedRows ? 'user login not found' :
    //                 affectedRows && changedRows ? 'Status Added successfully' : 'faild to update status';

    //             // send responce to front end
    //             res.send({ message, info });

    //     }catch (error) {
    //         console.log(error);
    //         return res.status(400).json({ errors: [ {msg : error.message}] });
    //     }
    // }

//######### --default slab and slab list-- #############
    getSlabList = async(req, res) =>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('login/getSlbList',JSON.stringify(req.body), JSON.stringify(req.query))
            // get agent details  
                let objAgentDetails = await sqlQueryReplica.searchQuery(this.tableName1, {user_uuid : req.query.user_uuid}, ['parent_id','usertype_id'], 'userid','ASC',1,0)
                if(objAgentDetails.length == 0) return res.status(400).json({ errors: [ {msg : 'Agent not found'}] });

            // // get agent type id 
            //     const lisResponce1 = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid)
            //     if(!lisResponce1 ) return res.status(400).json({ errors: [ {msg : "agent type id not found"}] });
                const intAgentId = objAgentDetails[0].usertype_id

            //get default slab list
                // sql search paramaters
                var searchKeyValue = {
                    userid: objAgentDetails[0].parent_id// userid
                }
                var key = ["CAST(slab_"+intAgentId+" AS CHAR(16)) AS slab_uuid","slab_name_"+intAgentId+" AS slab_name"]
                var orderby = "default_slab_uuid"
                var ordertype = "ASC"

                // fire sql query to get str default slab uuid, str masterSlab, str distributorSlab, str masterdistributorSlab, str subdistributorSlab, str masterRelationSlab, str retailserSlab
                const lisResponse1 = await sqlQueryReplica.searchQuery(this.tableName12, searchKeyValue, key, orderby, ordertype, 1, 0)
                    
                let strDefaultSlabuuid = lisResponse1[0] ? lisResponse1[0].slab_uuid : 0
                let strDefaultSlabname = lisResponse1[0] ? lisResponse1[0].slab_name : 0

                // console.log(strDefaultSlabuuid,strDefaultSlabname,lisResponse1)

                // get slab list
                    var searchKeyValue = {
                        userid: objAgentDetails[0].parent_id// userid
                    }
                    var key = ["CAST(slab_uuid AS CHAR(16)) AS slab_uuid", "slab_name AS name"]
                    var orderby = "created_on"
                    var ordertype = "DESC"
        
                    // fire sql query to get str slab_uuid, str slab_name
                    const lisResponse2 = await sqlQueryReplica.searchQueryNoLimit(this.tableName9, searchKeyValue, key, orderby, ordertype)
                    
                    if(lisResponse2.length === 0) return res.status(204).send({message : "no slab created"})

                if(!strDefaultSlabuuid){
                    // default slab is not set send all agent type in order
                    res.status(200).send(lisResponse2)
                }else {
                    // set default slab in top and move down all by 1
                    let du1,du2,point = 0
                    let finalResult = lisResponse2.map((lisResponse)=>{
                        const {slab_uuid,name} = lisResponse
                        if(point == 0){
                            du1 = strDefaultSlabuuid
                            du2 = strDefaultSlabname
                            strDefaultSlabuuid = slab_uuid
                            strDefaultSlabname = name
                            point = 1
                            return {slab_uuid : du1,name: du2}
                        }
                        if(slab_uuid == lisResponse1[0].slab_uuid ) return {slab_uuid : strDefaultSlabuuid,name: strDefaultSlabname}
                        
                        return lisResponse
                    })
                    res.status(200).send(finalResult)
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
 
// ###############-- Agent Focrce log out -- ##################
    agentForceLogout = async (req,res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('login/agentForceLogout',JSON.stringify(req.body), JSON.stringify(req.query))
            // update the force logout to 1
                var searchKeyValue = {
                    user_uuid : req.body.agent_uuid,
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
                var param = {
                    fource_logout : 1
                }

                const jsonResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

                const { affectedRows, changedRows, info } = jsonResult;
                const message = !affectedRows ? 'user details not found' :
                    affectedRows && changedRows ? 'The Agent has been logged out successfully' : 'The Agent is already force logout';

                // send responce to front end
                res.send({ message, info });

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //##################
    getForceLogoutStatus = async (req,res) => {
        try{
            // check the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                //  //  console.log('login/getForceLogoutStatus',JSON.stringify(req.body), JSON.stringify(req.query))
            // get status from er login 
                const statusResponce = await sqlQuery.searchQuery(this.tableName1,{username : req.query.username,Active : 1},["fource_logout"],'userid','ASC',1,0)
                if(statusResponce.length == 0) return res.status(400).json({ errors: [ {msg : "iuser not found"}] });

            // send responce to frontend
                res.status(200).send({status:statusResponce[0].fource_logout == 1 ? "Not Allow" : "Allow", message : statusResponce[0].fource_logout == 1 ? "User need to login again" : "user can perform further operation"})

            // // update if status is 1
            //     if(statusResponce[0].fource_logout == 1 ){
            //         const updateResponce = await sqlQuery.updateQuery(this.tableName1,{fource_logout : 0},{user_uuid : req.body.user_detials.user_uuid})
            //     }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    async checkRegion(region_uuid, regionName) {
        var searchKeyValue = {
            region_uuid: region_uuid,
            region_name: regionName,
            active: 1,
        }
        var key = ["COUNT(1)"]
        var orderby = "region_name"
        var ordertype = "ASC"

        // fire sql query to get the region name
        var lisResponse = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

        // check if the result is there and responce accordingly
        if (!lisResponse) {
            throw new HttpException(500, 'Something went wrong');
        }
        return lisResponse
    }

    async checkAgentType(agent_type_uuid) {
        var searchKeyValue = {
            agent_type_uuid: agent_type_uuid,
            active: 1,
        }
        var key = ["agent_type_id"]
        var orderby = "agent_type_id"
        var ordertype = "ASC"

        // fire sql query to get agent name
        var lisResponse = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 1, 0)

        // check if the result is there and responce accordingly
        if (!lisResponse) {
            throw new HttpException(500, 'Something went wrong');
        }
        return lisResponse
    }

    async checkParentId(parent_uuid,agent_type_id,region_uuid) {
        var searchKeyValue = {
            user_uuid: parent_uuid,
            get_upper_parent_ids : agent_type_id,
            Active : 1
        }
        if(process.env.USER_UUID != parent_uuid) searchKeyValue.region_uuid = region_uuid 
        var key = ["userid","comm_type","oper1_status","oper2_status","oper3_status","oper4_status","oper5_status"]
        var orderby = "userid"
        var ordertype = "ASC"

        // fire sql query to get user id
        var lisResponse = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

        // check if the result is there and responce accordingly
        if (!lisResponse) {
            throw new HttpException(500, 'Something went wrong');
        }
        return lisResponse
    }

      async checkGraterAndEqualParentId(parent_uuid,agent_type_id,region_uuid) {
        var searchKeyValue = {
            user_uuid: parent_uuid,
            get_equal_and_grate_parent_ids : agent_type_id,
            Active : 1
        }
        if(process.env.USER_UUID != parent_uuid) searchKeyValue.region_uuid = region_uuid 
        var key = ["userid","comm_type","oper1_status","oper2_status","oper3_status","oper4_status","oper5_status"]
        var orderby = "userid"
        var ordertype = "ASC"

        // fire sql query to get user id
        var lisResponse = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

        // check if the result is there and responce accordingly
        if (!lisResponse) {
            throw new HttpException(500, 'Something went wrong');
        }
        return lisResponse
    }

    async checkCountyId(country_uuid, countryName) {
        var searchKeyValue = {
            country_uuid: country_uuid,
            country_name: countryName,
            active: 1,
        }
        var key = ["COUNT(1)"]
        var orderby = "country_name"
        var ordertype = "ASC"

        // fire sql query to get country
        var lisResponse = await sqlQueryReplica.searchQuery(this.tableName4, searchKeyValue, key, orderby, ordertype, 1, 0)

        // check if the result is there and responce accordingly
        if (!lisResponse) {
            throw new HttpException(500, 'Something went wrong');
        }
        return lisResponse
    }

    async checkProvienceId(country_uuid, province_uuid) {
        var searchKeyValue = {
            province_uuid: province_uuid,
            country_uuid: country_uuid,
            active: 1,
        }
        var key = ["COUNT(1)"]
        var orderby = "province_name"
        var ordertype = "ASC"

        // fire sql query to get province
        var lisResponse = await sqlQueryReplica.searchQuery(this.tableName5, searchKeyValue, key, orderby, ordertype, 1, 0)

        // check if the result is there and responce accordingly
        if (!lisResponse) {
            throw new HttpException(500, 'Something went wrong');
        }
        return lisResponse
    }

    async checkDistrictId(province_uuid, district_uuid, districtName) {
        var searchKeyValue = {
            district_uuid: district_uuid,
            province_uuid: province_uuid,
            district_name: districtName,
            Active: 1,
        }
        var key = ["COUNT(1)"]
        var orderby = "district_name"
        var ordertype = "ASC"

        // fire sql query to get district
        var lisResponse = await sqlQueryReplica.searchQuery(this.tableName6, searchKeyValue, key, orderby, ordertype, 1, 0)

        // check if the result is there and responce accordingly
        if (!lisResponse) {
            throw new HttpException(500, 'Something went wrong');
        }
        return lisResponse
    }

    async checkLanguageId(lang_uuid) {
        var searchKeyValue = {
            lang_uuid: lang_uuid,
        }
        var key = ['lang_id']
        var orderby = "lang_id"
        var ordertype = "ASC"

        // fire sql query to get language id
        var lisResponse = await sqlQueryReplica.searchQuery(this.tableName7, searchKeyValue, key, orderby, ordertype, 1, 0)

        // check if the result is there and responce accordingly
        if (!lisResponse) {
            throw new HttpException(500, 'Something went wrong');
        }
        return lisResponse
    }

    async addChildInParentList (parent_id, child_id) {
        try{
            // get parent child list
            let listChild = await commonQueryCommon.getParentChildList(parent_id)
            listChild.push(child_id)

            // update child list
            let updateResponce = await commonQueryCommon.updateParentChildList(parent_id, listChild)

            if(parent_id != 1){

                let getSupperParetnId = await sqlQueryReplica.searchQuery(this.tableName1, {userid : parent_id}, ["parent_id"], "userid", "ASC", 1, 0)
                if (getSupperParetnId.length == 0) throw new Error("supper parent not found")

                let update_responce = await this.addChildInParentList(getSupperParetnId[0].parent_id,child_id)
            }

            return 1
        }catch(error){
            throw new Error (error.message)
        }
    }

    setEncryptionKey() {
        var strRandomString = varRandomString.generateRandomString(15);
        var strRandomHash = varRandomString.generateRandomHash(strRandomString);
        return strRandomHash;
    }

    setHashPassword(strKey, strText) {
        return varEncryptionString.encryptString(strKey, strText);
    }

    getHashPassword(strKey1, strText1) {
        return varEncryptionString.decryptString(strKey1, strText1);
    }

    async setUserName() {
        let userName = "AFP-77454";
        let i = 0;

        while( i < 10 ){
            userName = "AFP-" + varRandomString.generateRandomNumber(5);

            let userCount = await sqlQuery.searchQuery(this.tableName1, {username : userName}, ["COUNT(1)"], 'userid','ASC', 1, 0)
            if(userCount[0]["COUNT(1)"] == 0 ) break

            i = i + 1
        }
        if(i == 10){
            return {error : userName}
        }else{
            return {username : userName}
        }
    }

    //function to make random password with given length
    randomPassword(length) {
        var chars = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890";
        var pass = "";
        for (var x = 0; x < length; x++) {
            var i = Math.floor(Math.random() * chars.length);
            pass += chars.charAt(i);
        }
        return pass;
    }

    checkValidation = (req) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors)
            throw new HttpException(400, 'Validation faild', errors);
        }
    }
}


// default user query 
// INSERT INTO`er_login`(`userid`, `username`, `user_uuid`, `emailid`, `gender`, `mobile`, `password`, `full_name`, `usertype_id`, `user_status`, `parent_id`, `reseller_id`, `distributor_id`, `sub_distributor_id`, `tpin`, `last_login_datetime`, `last_login_ip`, `created_by`, `created_by_type`, `created_on`, `Active`, `province_uuid`, `province_Name`, `city_name`, `Address`, `pass_key`, `encryption_key`, `last_log_id`, `auth_status`, `M_Pin`, `pass`, `status_authority`, `add_user_rights`, `commission_rights`, `bulk_transfer`, `group_topup`, `slab_status`, `fource_logout`, `update_mobile_status`, `etisalat_status`, `salaam_status`, `roshan_status`, `mtn_status`, `awcc_status`, `reg_sms_status`, `ussd_top_status`, `child_id`, `region_uuid`, `region_name`, `country_uuid`, `country_name`, `district_uuid`, `district_name`, `shop_name`, `prefer_lang`, `comm_type`) VALUES
//     (1, 'AFP-99506', 0x35616435393536352d636437632d3131, 'default@gmail.com', 1, '123456789', 'A1tZ7qGcV4IHhb6ELlGICXAVnzsBKw==', 'default', 1, 1, NULL, NULL, 0, 0, '1111', '1900-01-01 01:00:00', 'NA', NULL, NULL, '1900-01-01 01:00:00', 1, 0x37663864313462662d636437392d3131, 'aaaaa', NULL, 'santi nager', NULL, '18e46b8a5e7c17d75c5b3be16ddbfbb8d6d99206e56554ae95', 0, 0, 'NA', ' ', 2, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, '', 0x64376535626162302d633734642d3131, 'afghan', 0x35353834376435362d633466652d3131, 'Aanas', 0x39306663666533392d636437392d3131, 'aaaaaa', 'apni dukan', 6, 0);

module.exports = new loginController
