const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common');
const sqlQueryReplica = require('../common/sqlQueryReplica.common');
const commonQueryCommon = require('../common/commonQuery.common');

const roles = require('../utils/userRoles.utils')

const logModule = require('../models/log.module');
const req = require('express/lib/request');
const { type } = require('express/lib/response');

// const { toIsoString } = require('../common/timeFunction.common')

class logController  {

    // table name
    tableName1 = 'er_logs_admin_update_password'
    tableName2 = 'er_logs_admin_update_mobile_number'
    tableName3 = 'er_activity_logs'
    tableName4 = 'er_login_log'
    tableName5 = 'er_activity_type'
    tableName6 = 'er_switch_acc_log'
    tableName7 = 'er_roshan_ussd_request_log'
    tableName8 = 'er_roshan_p2a_log'

    //function to add log in the table password
    logAdminUpdatePassword = async(req, res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();
            
            // param to add in the table
                var param = {
                    admin_userid : req.body.userid, // int user id
                    username : req.body.username, //str user names 
                    usertype : req.body.usertype, //str user type
                    old_password : req.body.old_password, //str old password
                    old_encryption_key : req.body.old_encryption_key, //str old encryptionKey
                    new_password : req.body.new_password, //str new_password
                    new_encryption_key : req.body.new_encryption_key, //str new encryptionkey
                    created_by : req.body.created_by, //str user id
                    created_on : isodate, //dt current date time
                }

            const objResult = await sqlQuery.createQuery(this.tableName1, param)
            
            res.status(201).send({message: "log added successfully"})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to get admin update password
    getAdminUpdatePasswordLog = async(req, res)=>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

            // // limit and offset 
            //     var offset = req.query.start
            //     var limit = req.query.end - offset

            //search log report
                var searchKeyValue = {
                    admin_userid : req.body.user_detials.id
                }

            // check date for start and end 
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
        
                if (req.query.start_date) {
                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [req.query.start_date, req.query.start_date]
                    } //dt start date
                }
                if (req.query.end_date) {
                    searchKeyValue.between.value[1] = req.query.end_date //dt end date
                }

                var key = ["username",'usertype',"CAST(created_on AS CHAR(20)) as date"]
                var orderby = 'id'
                var ordertype = "DESC"

                const listResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)
            
            // send response    
                if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})    
                res.status(200).send(listResult)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to add log for update mobile number 
    logAdminUpdateMobile = async (req, res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();
            
            // param to add in the table
                var param = {
                    admin_userid : req.body.userid, // int user id
                    username : req.body.username, //str user names 
                    usertype : req.body.usertype, //str user type
                    old_mobile_number : req.body.old_mobile_number, //str old mobile numbwe
                    old_mobile_operator : req.body.old_mobile_operator, //str old operator uuid
                    new_mobile_number : req.body.new_mobile_number, //str nuw mobile number
                    new_mobile_operator : req.body.new_mobile_operator, //str new operator
                    created_on : isodate, //dt current date time
                }

            const objResult = await sqlQuery.createQuery(this.tableName2, param)
            
            res.status(201).send({message: "log added successfully"})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to get admin mobile update log 
    getAdminUpdateMobileLog = async (req, res)=>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

            // // limit and offset 
            //     var offset = req.query.start
            //     var limit = req.query.end - offset

            //search log report
                var searchKeyValue = {
                    admin_userid : req.body.user_detials.id
                }

            // check date for start and end 
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
            
                if (req.query.start_date) {
                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [req.query.start_date, req.query.start_date]
                    } //dt start date
                }
                if (req.query.end_date) {
                    searchKeyValue.between.value[1] = req.query.end_date //dt end date
                }

                var key = ["username",'old_mobile_number AS oldNumber',"old_mobile_operator as oldOperator_uuid","new_mobile_number as newNumber","new_mobile_operator as newOperator", "CAST(created_on AS CHAR(20)) AS date"]
                var orderby = 'id'
                var ordertype = "DESC"
                let listResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)
            
            // send response    
                if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})
                listResult.map((data) =>{
                    let {date,...other} = data
                    other.date = date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                })    
                res.status(200).send(listResult)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to add log in er_activity_logs table
    addActivityLog = async (req,res) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();
            
            //log data
            var param = { 
                userid : req.body.userid,
                username : req.body.username,
                user_uuid : req.body.user_uuid,
                full_name : req.body.full_name,
                mobile : req.body.mobile ? req.body.mobile : 0,
                created_on : isodate,
                created_by_type : req.body.intCreatedByType, // 1- Admin ,2- Member
                user_type : req.body.intUserType, // role
                ip_address : req.body.userIpAddress,
                mac_address : req.body.userMacAddress,
                os_details : req.body.userOsDetails,
                imei_no : req.body.userImeiNumber,
                gcm_id : req.body.userGcmId,  // to send notification
                app_version : req.body.userAppVersion ? req.body.userAppVersion : 0,  // our app version
                source : req.body.userApplicationType,  // 1: web, 2 : app
                description : req.body.description, 
                activity_type : req.body.userActivityType, // 1-Login;2-Change Password;3-Change Profile
                old_value : req.body.oldValue,
                modified_value : req.body.newValue,
                region_id : req.body.regionId || 0
            }

            const objResult = await sqlQuery.createQuery(this.tableName3, param)
            
            res.status(201).send({message: "log added successfully"})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // add multiple activity log
    addMultipleActivityLog = async (req, res) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

            // list of input 
                let objResponce = await sqlQuery.multiInsert(this.tableName3, req.body.mulActivityLog)

                res.status(201).send({message: "log added successfully"})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // login log
    addLoginLog = async ( req, res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // search lsat log
                var searchKeyValue = {
                    userid : req.body.userid
                }
                var key = ['id','created_on','login_ip']
                var orderby = "id"
                var ordertype = "DESC"
                const lisLastLog = await sqlQueryReplica.searchQuery(this.tableName4, searchKeyValue, key, orderby, ordertype,1,0)
                // console.log(lisLastLog,lisLastLog.length)

            //log data
                var param = { 
                    userid : req.body.userid,
                    user_uuid : req.body.user_uuid,
                    full_name : req.body.full_name,
                    username : req.body.username, //str user names
                    emailid : req.body.email,
                    mobile : req.body.mobile, // int mobile numbers
                    usertype : req.body.usertype,
                    login_ip : req.body.login_ip, // current login ip
                    created_on : isodate,
                    last_login_ip :  0 ,
                    last_login_datetime : 0 , 
                    last_log_id : 0 ,
                    Created_by_username : req.body.Created_by_username,
                }
                
                if(lisLastLog.length != 0){
                    param.last_login_ip = lisLastLog[0].login_ip 
                    param.last_login_datetime = lisLastLog[0].created_on
                    param.last_log_id = lisLastLog[0].id
                }

                const objResult = await sqlQuery.createQuery(this.tableName4, param)
                
                res.status(201).send({message: "login added successfully"})   

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // get log for admin 
    getAdminActivityLog = async(req, res)=>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get activity type list 
                var activityTypeList = await sqlQueryReplica.searchQueryNoLimit(this.tableName5,{"user_type":1},["at_id"],"at_id","ASC")
                if(activityTypeList.length == 0) return res.status(404).json({ errors: [ {msg : 'Activity Type List not found'}] });
                let intActivityTypeList = activityTypeList.map((result)=>{
                    let{at_id} = result
                    return at_id
                })
                // console.log(intActivityTypeList)

            //search log report
                var searchKeyValue = {}

            // check date for start and end 
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
            
                if (req.query.start_date) {
                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [req.query.start_date, req.query.start_date]
                    } //dt start date
                }
                if (req.query.end_date) {
                    searchKeyValue.between.value[1] = req.query.end_date //dt end date
                } 

                if(!req.query.start_date || !req.query.end_date){
                    let enDate = new Date()
                    let stDate = new Date()
                    stDate.setDate(stDate.getDate() - 1)

                    enDate = enDate.toISOString().slice(0,10);
                    stDate = (stDate.toISOString().slice(0,10));

                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [stDate, enDate]
                    }
                } 

                if(req.query.activityType && req.query.activityType != 0) {
                    // console.log(intActivityTypeList.includes(Number(req.query.activityType)))
                    if(intActivityTypeList.includes(Number(req.query.activityType))) searchKeyValue.intActivityTypeList = [req.query.activityType]
                    else return res.status(404).json({ errors: [ {msg : 'Selected activity is Improper'}] });
                }

                // if(Object.keys(searchKeyValue).length == 0 ) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });
                if(!(req.query.activityType && req.query.activityType != 0)) searchKeyValue.intActivityTypeList = intActivityTypeList
                // console.log(searchKeyValue)

                let totalTopUpAmount = await logModule.getActivityLogCount(searchKeyValue)

                let intTotlaRecords = Number(totalTopUpAmount[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                let listResult = await logModule.getActivityLog(searchKeyValue, limit, offset)

                // console.log(listResult)

            // send response    
                // if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})  
                // res.status(200).send(listResult)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(listResult)
                }else{
                    res.status(200).send({
                        reportList : listResult,
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

    // get log for Agent
    getAgentActivityLog = async (req, res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get activity type list 
                var activityTypeList = await sqlQueryReplica.searchQueryNoLimit(this.tableName5,{"user_type":3},["at_id"],"at_id","ASC")
                if(activityTypeList.length == 0) return res.status(404).json({ errors: [ {msg : 'Activity Type List not found'}] });
                let intActivityTypeList = activityTypeList.map((result)=>{
                    let{at_id} = result
                    return at_id
                })
                // console.log(intActivityTypeList)

            //search log report
                var searchKeyValue = {
                    region_ids : req.body.user_detials.region_list.join(',')
                }

                if(req.query.userid) searchKeyValue.username = req.query.userid
                if(req.query.name) searchKeyValue.full_name = req.query.name
                if(req.query.mobile) searchKeyValue.mobile = req.query.mobile

               // check date for start and end 
               if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
            
               if (req.query.start_date) {
                   searchKeyValue.between = {
                       key : 'created_on',
                       value : [req.query.start_date, req.query.start_date]
                   } //dt start date
               }
               if (req.query.end_date) {
                   searchKeyValue.between.value[1] = req.query.end_date //dt end date
               } 

               if(!req.query.start_date || !req.query.end_date){
                    let enDate = new Date()
                    let stDate = new Date()
                    stDate.setDate(stDate.getDate() - 1)

                    enDate = enDate.toISOString().slice(0,10);
                    stDate = (stDate.toISOString().slice(0,10));

                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [stDate, enDate]
                    }
                } 

                if(req.query.activityType && req.query.activityType != 0) {
                    // console.log(intActivityTypeList.includes(Number(req.query.activityType)))
                    if(intActivityTypeList.includes(Number(req.query.activityType))) searchKeyValue.intActivityTypeList = [req.query.activityType]
                    else return res.status(404).json({ errors: [ {msg : 'Selected activity is Improper'}] });
                }

                if(Object.keys(searchKeyValue).length == 0) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });
                if(!(req.query.activityType && req.query.activityType != 0)) searchKeyValue.intActivityTypeList = intActivityTypeList
                // console.log(searchKeyValue)

                const lisTotalRecords = await logModule.getActivityLogCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                const listResult = await logModule.getActivityLog(searchKeyValue, limit, offset)
            
            // send response    
                // if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})    
                // res.status(200).send(listResult)

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(listResult)
                }else{
                    res.status(200).send({
                        reportList : listResult,
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

    // get log for Sub-Admin
    getSubAdminActivityLog = async (req, res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get activity type list 
                var activityTypeList = await sqlQueryReplica.searchQueryNoLimit(this.tableName5,{"user_type":2},["at_id"],"at_id","ASC")
                if(activityTypeList.length == 0) return res.status(404).json({ errors: [ {msg : 'Activity Type List not found'}] });
                let intActivityTypeList = activityTypeList.map((result)=>{
                    let{at_id} = result
                    return at_id
                })
                // console.log(intActivityTypeList)

            //search log report
                var searchKeyValue = {
                    // created_by_type : 1,
                    // user_type : 2
                }
                // if sub admin checks the log report then show only its reports not other sub admin report
                if(req.body.user_detials.type != roles.Admin) searchKeyValue.userid = req.body.user_detials.id

                if(req.query.userid) searchKeyValue.username = req.query.userid
                if(req.query.name) searchKeyValue.full_name = req.query.name
                if(req.query.mobile) searchKeyValue.mobile = req.query.mobile

                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
        
                if (req.query.start_date) {
                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [req.query.start_date, req.query.start_date]
                    } //dt start date
                }
                if (req.query.end_date) {
                    searchKeyValue.between.value[1] = req.query.end_date //dt end date
                }

                if(!req.query.start_date || !req.query.end_date){
                    let enDate = new Date()
                    let stDate = new Date()
                    stDate.setDate(stDate.getDate() - 1)

                    enDate = enDate.toISOString().slice(0,10);
                    stDate = (stDate.toISOString().slice(0,10));

                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [stDate, enDate]
                    }
                }  

                if(req.query.activityType && req.query.activityType != 0) {
                    // console.log(intActivityTypeList.includes(Number(req.query.activityType)))
                    if(intActivityTypeList.includes(Number(req.query.activityType))) searchKeyValue.intActivityTypeList = [req.query.activityType]
                    else return res.status(404).json({ errors: [ {msg : 'Selected activity is Improper'}] });
                }
                if(!(req.query.activityType && req.query.activityType != 0)) searchKeyValue.intActivityTypeList = intActivityTypeList
                if(Object.keys(searchKeyValue).length == 0) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });
                // console.log(searchKeyValue)

                const lisTotalRecords = await logModule.getActivityLogCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                const listResult = await logModule.getActivityLog(searchKeyValue, limit, offset)
            
            // send response    
                // if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})    
                // res.status(200).send(listResult)

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(listResult)
                }else{
                    res.status(200).send({
                        reportList : listResult,
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

    getAgentWithNoActivity = async(req,res) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset
        
            // sql search variables 
                var param = {
                    created_by_type : 2,
                    // region_ids : req.body.user_detials.region_list.join(',')
                }
                if(req.body.user_detials.region_list.length != 7){
                    param.region_ids = req.body.user_detials.region_list.join(',')
                }
                if(req.query.userid) param.username = req.query.userid
                if(req.query.name) param.full_name = req.query.name
                if(req.query.mobile) param.mobile = req.query.mobile
                if(req.query.dayCount) param.dayCount = req.query.dayCount
                
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
        
                if (req.query.start_date) {
                    param.between = {
                        key : 'created_on',
                        value : [req.query.start_date, req.query.start_date]
                    } //dt start date
                }
                if (req.query.end_date) {
                    param.between.value[1] = req.query.end_date //dt end date
                }

                if(!req.query.start_date || !req.query.end_date){
                    let enDate = new Date()
                    let stDate = new Date()
                    stDate.setDate(stDate.getDate() - 1)

                    enDate = enDate.toISOString().slice(0,10);
                    stDate = (stDate.toISOString().slice(0,10));

                    param.between = {
                        key : 'created_on',
                        value : [stDate, enDate]
                    }
                }

                // console.log(param);

                if(Object.keys(param).length == 0) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });

                const lisTotalRecords = await logModule.getAgentWithNoActivityCount(param);

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                const lisResponce1 = await logModule.getAgentWithNoActivity(param, limit, offset);
                // console.log(lisResponce1);
                // if(lisResponce1.length == 0) return res.status(204).send({message : 'no log found'})

            // get all user activity type 
                // const listAllUserActivityType = await sqlQuery.searchQueryNoConNolimit(this.tableName5,["at_id","activity_name"],"at_id","ASC")
                // console.log(listAllUserActivityType)
            // get all agent type
                const listAllAgentType = await commonQueryCommon.getAllAgentType()
                // console.log(listAllAgentType)
                var results = lisResponce1.map((result)=>{
                    var { user_type, ...other} = result
                    // console.log(user_type)
                    // other.activityType = listAllUserActivityType[activity_type-1].activity_name
                    other.agentType = listAllAgentType[user_type-1] ? listAllAgentType[user_type-1].agent_type_name : listAllAgentType[3].agent_type_name

                    return other
                })

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(results)
                }else{
                    res.status(200).send({
                        reportList : results,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

                // res.status(200).send(results);

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getAgentSelfActivityLog = async (req,res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get activity type list 
                var activityTypeList = await sqlQueryReplica.searchQueryNoLimit(this.tableName5,{"user_type":3},["at_id"],"at_id","ASC")
                if(activityTypeList.length == 0) return res.status(404).json({ errors: [ {msg : 'Activity Type List not found'}] });
                let intActivityTypeList = activityTypeList.map((result)=>{
                    let{at_id} = result
                    return at_id
                })
                // console.log(intActivityTypeList)
                
                // console.log(req.body.user_details)
            //search log report
                var searchKeyValue = {
                    userid : req.body.user_detials.userid,
                }
                
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
        
                if (req.query.start_date) {
                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [req.query.start_date, req.query.start_date]
                    } //dt start date
                }
                if (req.query.end_date) {
                    searchKeyValue.between.value[1] = req.query.end_date //dt end date
                }

                if(!req.query.start_date || !req.query.end_date){
                    let enDate = new Date()
                    let stDate = new Date()
                    stDate.setDate(stDate.getDate() - 1)

                    enDate = enDate.toISOString().slice(0,10);
                    stDate = (stDate.toISOString().slice(0,10));

                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [stDate, enDate]
                    }
                }

                if(req.query.activityType && req.query.activityType != 0) {
                    // console.log(intActivityTypeList.includes(Number(req.query.activityType)))
                    if(intActivityTypeList.includes(Number(req.query.activityType))) searchKeyValue.intActivityTypeList = [req.query.activityType]
                    else return res.status(404).json({ errors: [ {msg : 'Selected activity is Improper'}] });
                }

                if(Object.keys(searchKeyValue).length == 0 ) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });
                if(!(req.query.activityType && req.query.activityType != 0)) searchKeyValue.intActivityTypeList = intActivityTypeList
                // console.log(searchKeyValue)

                let lisTotalRecords = await logModule.getAgentSelfActivityLogCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                const listResult = await logModule.getAgentSelfActivityLog(searchKeyValue, limit, offset)
            
            // send response    
                // if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(listResult)
                }else{
                    res.status(200).send({
                        reportList : listResult,
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

    getNotificationCount = async (req,res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 1

                let userIdType = req.body.user_detials.type == roles.Admin ? 1 : ( req.body.user_detials.type == roles.SubAdmin ? 2 : 3 )

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get activity type list 
                var activityTypeList = await sqlQueryReplica.searchQueryNoLimit(this.tableName5,{"user_type":userIdType},["at_id"],"at_id","ASC")
                if(activityTypeList.length == 0) return res.status(404).json({ errors: [ {msg : 'Activity Type List not found'}] });
                let intActivityTypeList = activityTypeList.map((result)=>{
                    let{at_id} = result
                    return at_id
                })
                // console.log(intActivityTypeList)
                
                // console.log(req.body.user_details)
            //search log report
                var searchKeyValue = {
                    userid : (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid,
                    view_status : 0,
                    intActivityTypeList
                }

                if(!req.query.start_date || !req.query.end_date){
                    let enDate = new Date()
                    let stDate = new Date()
                    stDate.setDate(stDate.getDate() - 1)

                    enDate = enDate.toISOString().slice(0,10);
                    stDate = (stDate.toISOString().slice(0,10));

                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [stDate, enDate]
                    }
                }

                if(Object.keys(searchKeyValue).length == 0 ) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });
                // if(!(req.query.activityType && req.query.activityType != 0)) searchKeyValue.intActivityTypeList = intActivityTypeList
                // console.log(searchKeyValue)

                let lisTotalRecords = await logModule.getAgentSelfActivityLogCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords
            
            // send response    
                // if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})
                res.status(200).send({
                    totalNotification : intTotlaRecords,
                    // pageCount : intPageCount,
                    // currentPage : Number(req.query.pageNumber),
                    // pageLimit : Number(process.env.PER_PAGE_COUNT)
                })    

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    get10AgentNotification = async (req,res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 1

                let userIdType = req.body.user_detials.type == roles.Admin ? 1 : ( req.body.user_detials.type == roles.SubAdmin ? 2 : 3 )

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get activity type list 
                var activityTypeList = await sqlQueryReplica.searchQueryNoLimit(this.tableName5,{"user_type":userIdType},["at_id"],"at_id","ASC")
                if(activityTypeList.length == 0) return res.status(404).json({ errors: [ {msg : 'Activity Type List not found'}] });
                let intActivityTypeList = activityTypeList.map((result)=>{
                    let{at_id} = result
                    return at_id
                })
                // console.log(intActivityTypeList)
                
                // console.log(req.body.user_details)
            //search log report
                var searchKeyValue = {
                    userid : (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid,
                    // view_status : 0,
                    intActivityTypeList
                } 

                if(!req.query.start_date || !req.query.end_date){
                    let enDate = new Date()
                    let stDate = new Date()
                    stDate.setDate(stDate.getDate() - 1)

                    enDate = enDate.toISOString().slice(0,10);
                    stDate = (stDate.toISOString().slice(0,10));

                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [stDate, enDate]
                    }
                }

                if(Object.keys(searchKeyValue).length == 0 ) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });
                // if(!(req.query.activityType && req.query.activityType != 0)) searchKeyValue.intActivityTypeList = intActivityTypeList
                // console.log(searchKeyValue)

                let lisTotalRecords = await logModule.getAgentSelfActivityLogCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                const listResult = await logModule.getAgentSelfActivityLog(searchKeyValue, limit, offset)
            
            // send response    
                // if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})
                res.status(200).send({
                    reportList : listResult,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })    

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getAgentNotification = async (req,res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 1

                let userIdType = req.body.user_detials.type == roles.Admin ? 1 : ( req.body.user_detials.type == roles.SubAdmin ? 2 : 3 )

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get activity type list 
                var activityTypeList = await sqlQueryReplica.searchQueryNoLimit(this.tableName5,{"user_type":userIdType},["at_id"],"at_id","ASC")
                if(activityTypeList.length == 0) return res.status(404).json({ errors: [ {msg : 'Activity Type List not found'}] });
                let intActivityTypeList = activityTypeList.map((result)=>{
                    let{at_id} = result
                    return at_id
                })
                // console.log(intActivityTypeList)
                
                // console.log(req.body.user_details)
            //search log report
                var searchKeyValue = {
                    userid : (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid,
                    // view_status : 0,
                    intActivityTypeList
                }

                if(!req.query.start_date || !req.query.end_date){
                    let enDate = new Date()
                    let stDate = new Date()
                    stDate.setDate(stDate.getDate() - 1)

                    enDate = enDate.toISOString().slice(0,10);
                    stDate = (stDate.toISOString().slice(0,10));

                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [stDate, enDate]
                    }
                }
                
                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
        
                if (req.query.start_date) {
                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [req.query.start_date, req.query.start_date]
                    } //dt start date
                }
                if (req.query.end_date) {
                    searchKeyValue.between.value[1] = req.query.end_date //dt end date
                }
                if (req.query.logId) searchKeyValue.id = req.query.logId
   

                // if(req.query.activityType && req.query.activityType != 0) {
                //     // console.log(intActivityTypeList.includes(Number(req.query.activityType)))
                //     if(intActivityTypeList.includes(Number(req.query.activityType))) searchKeyValue.intActivityTypeList = [req.query.activityType]
                //     else return res.status(404).json({ errors: [ {msg : 'Selected activity is Improper'}] });
                // }

                if(Object.keys(searchKeyValue).length == 0 ) return res.status(404).json({ errors: [ {msg : 'Improper search parameter'}] });
                // if(!(req.query.activityType && req.query.activityType != 0)) searchKeyValue.intActivityTypeList = intActivityTypeList
                // console.log(searchKeyValue)

                let lisTotalRecords = await logModule.getAgentSelfActivityLogCount(searchKeyValue)



                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                const listResult = await logModule.getAgentSelfActivityLog(searchKeyValue, limit, offset)

                let activityIds = []
                let finalResult = []

                listResult.forEach((activityLog) => {
                    let {logId, ...other} = activityLog
                    activityIds.push(logId)
                    finalResult.push(other)
                })

                if(activityIds.length > 0){
                    let searchKeyValue = {
                        IsIn : {
                            key : 'id',
                            value : activityIds.join(' , ')
                        }
                    }
                    let param = {
                        view_status : 1
                    }
                    const updateResponse = await sqlQuery.updateQuery(this.tableName3,param, searchKeyValue)
                }
            
            // send response    
                // if(listResult.length == 0) return res.status(204).send({ message: 'no log report found'})
                res.status(200).send({
                    reportList : listResult,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })    

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // agetn switch account logs
    addSwitchAccLog = async(req,res) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                if(typeof(req.body) == 'list'){
                    
                }

            // reassigning param
                var param = {
                    userid : req.body.userid, 
                    username : req.body.agentUsername,
                    full_name : req.body.agentName,
                    usertype_id : req.body.agentType,
                    old_parent_username : req.body.oldParentUsername,
                    old_parent_full_name : req.body.oldParentName,
                    new_parent_username : req.body.newParentUsername,
                    new_parent_full_name : req.body.newParentName,
                    user_name : req.body.userName,
                    user_full_name : req.body.fullName,
                    created_on : isodate, //dt current date time
                    region_id : req.body.regionId || 0,
                };

            // insert the data in the table
                var responce = await sqlQuery.createQuery(this.tableName6, param)

            // send responce 
                res.status(201).send({message: "log added successfully"});

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getSwithAccountLog = async(req,res) =>{
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset 
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // search paremeters
                var searchKeyValue = {
                    region_ids : req.body.user_detials.region_list.join(',')
                }
                if(req.query.name) searchKeyValue.full_name = req.query.name;
                if(req.query.userId) searchKeyValue.username = req.query.userId;
                if(req.query.agenttype_uuid) {
                    // search user id 
                    let agentId = await commonQueryCommon.getAgentTypeId(req.query.agenttype_uuid)
                    if(agentId == 0) return res.status(400).json({ errors: [ {msg : "Agent id not found"}] });
                    searchKeyValue.usertype_id = agentId[0].agent_type_id
                }

                if(Object.keys(searchKeyValue).length == 0) return res.status(400).send({ message : 'Improper search paremeters'})

                var key = ['full_name AS agetnName','username AS agentUserId','usertype_id','old_parent_username AS oldParentUserId','old_parent_full_name AS oldParetnName','new_parent_username AS newParentUserId','new_parent_full_name AS newParentName','CAST(created_on AS CHAR(20)) AS date','user_name as updatedByUserid', 'user_full_name AS updatebyName']
                
                const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName6,searchKeyValue, ['COUNT(1) AS count'], 'id','DESC')

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords
                
                const searchLog = await sqlQueryReplica.searchQuery(this.tableName6,searchKeyValue, key, 'id','DESC', limit, offset)
                // if(searchLog.length == 0) return res.status(204).send({ message : 'no log found'})
                
                // console.log(searchLog.length)
                // get agetn type list
                let agentTypeList = await commonQueryCommon.getAllAgentType()
                if(agentTypeList == 0) return res.status(400).send({ message : 'agent type list not found'})

                let finalList = searchLog.map((result)=>{
                    let {usertype_id,...other} = result
                    other.agentType = agentTypeList[usertype_id-1].agent_type_name
                    return other
                })

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(finalList)
                }else{
                    res.status(200).send({
                        reportList : finalList,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

                // res.status(200).send(finalList)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //add ussd log
    addUssdLog = async(req,res) =>{
        try{

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let { MSISDN, IMSI, input, datetime, isnewrequest, operatorId, freeFlow, responceMesssage } = req.body

            let objInsertDetails = {
                MSISDN : MSISDN || 'NA',
                Mobile : MSISDN.length > 10 ? 0+MSISDN.slice(2,String(MSISDN).length) : 0,
                IMSI : IMSI || 'NA',
                input : input || 'NA',
                date_time : datetime || 'NA', 
                is_new_request : isnewrequest || 0, 
                operator_id : operatorId || 0, 
                free_flow : freeFlow || 'NA', 
                responce_messsage : responceMesssage || 'NA',
                created_on : isodate,
            }

            let objInsertResponce = await sqlQuery.createQuery(this.tableName7, objInsertDetails)

            // console.log('ussd Log added successfully')

            res.status(201).send({message: 'log added successfully'})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getUssdLogs = async(req,res) =>{
        try{

            // verify the body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let objSearchKeyValue = {};

            if(req.query.mobile) objSearchKeyValue.Mobile = req.query.mobile;
            if(req.query.operatorId) objSearchKeyValue.operator_id = req.query.operatorId;
            if(req.query.ussdCode) objSearchKeyValue.input = req.query.ussdCode;
            if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
        
                if (req.query.start_date) {
                    searchKeyValue.between = {
                        key : 'created_on',
                        value : [req.query.start_date, req.query.end_date]
                    } //dt start date
                }

            if(Object.keys(objSearchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : 'Improper search parameters'}] });

            let listkeyValue = ['MSISDN AS ussdMsisdn', 'mobile as ussdMobile', 'input as ussdCode','free_flow as ussdFreeFlow', 'responce_messsage as ussdMessage', 'CAST(created_on AS CHAR(20)) as dateTime']

            let lisSqlSearachResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName7,objSearchKeyValue,listkeyValue,'id','DESC')
                
            res.send(lisSqlSearachResponce)
        
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //add p2a log
    addP2aLog = async(req,res) =>{
        try{

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let { MSISDN, input, lastInput, smsResponce } = req.body

            let objInsertDetails = {
                MSISDN : MSISDN || 'NA',
                mobile : MSISDN.length > 10 ? 0+MSISDN.slice(2,String(MSISDN).length) : 0,
                input : input || 'NA',
                last_input : lastInput || 'NA',
                responce_message : smsResponce || 'NA',
                created_on : isodate,
            }

            let objInsertResponce = await sqlQuery.createQuery(this.tableName8, objInsertDetails)

            // console.log('ussd Log added successfully')

            res.status(201).send({message: 'log added successfully'})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getP2aLog = async(req,res) => {
        // verify the body and query
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let objSearchKeyValue = {};

        if(req.query.mobile) objSearchKeyValue.mobile = req.query.mobile;
        if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });
    
            if (req.query.start_date) {
                searchKeyValue.between = {
                    key : 'created_on',
                    value : [req.query.start_date, req.query.end_date]
                } //dt start date
            }

        if(Object.keys(objSearchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : 'Improper search parameters'}] });

        let listkeyValue = ['MSISDN AS p2aMsisdn', 'mobile as p2aMobile', 'input as p2aInput','last_input as p2aLastInput', 'responce_message as p2aMessage', 'CAST(created_on AS CHAR(20)) as dateTime']

        let lisSqlSearachResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName8,objSearchKeyValue,listkeyValue,'id','DESC')
            
        res.send(lisSqlSearachResponce)
    }
}

module.exports = new logController();