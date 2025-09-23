const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common');
const sqlQueryReplica = require('../common/sqlQueryReplica.common');

const commonQueryCommon = require('../common/commonQuery.common');
const redisMaster = require('../common/master/radisMaster.common')

const role = require('../utils/userRoles.utils')

const varRandomString = require('../utils/randomString.utils');
const varEncryptionString = require('../utils/encryption.utils');

const httpRequestMakerCommon = require('../common/httpRequestMaker.common')

// const { sendSms } = require('./function.controller')
const smsFunction = require('../common/smsFunction.common')

// const { toIsoString } = require('../common/timeFunction.common')

const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)

const awsCommon = require('../common/awsS3.common')

class agentLoginFunction {
    tableName1 = 'er_login' // login table
    tableName2 = 'er_agent_contact' // agent contact
    tableName3 = 'er_master_language'
    tableName4 = 'er_agent_modules_permission'
    tableName5 = 'er_send_marketing_sms' //table to send message
    tableName6 = 'er_master_operator'

    // function to login user and send validation code with user id
    agentLogin = async(req,res,next) => {
        try{
            // verify the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('agentLoginFun/agentLogin',JSON.stringify(req.body), JSON.stringify(req.query))
            // get login credintial username and password
                const strUserName = req.body.username
                const strPassword = req.body.password

            // serch username in sel database get encription key and password
                var searchKeyValue = {
                    username : strUserName,
                    Active : 1
                }
                var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid","usertype_id", "userid","username","full_name", "mobile", "password","encryption_key","usertype_id","comm_type","last_login_ip","last_login_datetime","Active","fource_logout",'user_status','region_id']
                var orderby = "username"
                var ordertype = "ASC"

                // fire sql query to get str encription key and password
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                if(!lisResponce.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})

                // check active state
                if(lisResponce[0].user_status != 1) return res.status(400).json({ errors: [ {msg : 'Account is In-Active'}]})

                //update force logout status if it is 1
                if(lisResponce[0].fource_logout == 1 ){
                    const updateResponce = await sqlQuery.updateQuery(this.tableName1,{fource_logout : 0},{username : strUserName,Active : 1})
                }

                var strEncryptionKey = lisResponce[0].encryption_key
                var strEncriptedPassword = lisResponce[0].password

            // decript the save password and match it with the given password 
                var strDecriptPassword = varEncryptionString.decryptString(strEncryptionKey,strEncriptedPassword)
                console.log("agentPassword", strDecriptPassword)

            // send respective responce to the front end
                if(strDecriptPassword != strPassword){
                    let attempt = await redisMaster.incr(`AGENT_LOGIN_ATTEMPT_${lisResponce[0].user_uuid}`)
                    attempt = Number(attempt)

                    let allowedAttempt = Number(process.env.WRONG_PASSWORD_ATTEMPTS)

                    if( allowedAttempt-attempt <= 0 ){
                        // update agent as in-active
                        console.log('agentLoginFun/agentLogin/failed',strUserName)
                        const updateResponce = await sqlQuery.updateQuery(this.tableName1,{user_status : 2},{username : strUserName,Active : 1})
                    }

                    return res.status(400).json({ errors: [ {msg : `Wrong password, ${allowedAttempt-attempt > 0 ? allowedAttempt-attempt : 0} left.`}] });
                }

                const secretKey = process.env.SECRET_JWT || "";
                const token = jwt.sign({ user_id: lisResponce[0].userid, userType: role.Agnet }, secretKey, {
                    expiresIn: process.env.SESSION_TIME
                });

                redisMaster.post(`agent_login_session_${req.body.username}`,token)
                redisMaster.delete(`AGENT_LOGIN_ATTEMPT_${lisResponce[0].user_uuid}`)
                redisMaster.delete(`AGENT_USSD/SMS_ATTEMPT_${lisResponce[0].user_uuid}`)

            // get all agent type name
                var listAgentType = await commonQueryCommon.getAllAgentType()
                // console.log(listAgentType)
                // console.log(lisResponce[0])
                var type = 'agent'
                for (var i=0; i<listAgentType.length; i++){
                    if(listAgentType[i].agent_type_id == lisResponce[0].usertype_id) 
                    {
                        type = listAgentType[i].agent_type_name
                    }
                }
            
            // addlogin log using api call
                // api call variable
                var data = { 
                    userid : lisResponce[0].userid,
                    username : lisResponce[0].username,
                    full_name : lisResponce[0].full_name,
                    mobile : lisResponce[0].mobile,
                    user_uuid : lisResponce[0].user_uuid,
                    intCreatedByType : lisResponce[0].userid, 
                    intUserType : lisResponce[0].usertype_id,
                    userIpAddress : req.body.userIpAddress ? req.body.userIpAddress : 0, 
                    userMacAddress : req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                    userOsDetails : req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                    userImeiNumber : req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                    userGcmId : req.body.userGcmId ? req.body.userGcmId : 0, //str
                    userAppVersion : req.body.userAppVersion ? req.body.userAppVersion : null, //str
                    userApplicationType : req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                    description : type + ' Login',
                    userActivityType : 9,
                    oldValue : lisResponce[0].last_login_ip ? lisResponce[0].last_login_ip : 0,
                    newValue : req.body.userIpAddress ? req.body.userIpAddress : 0,
                    regionId : lisResponce[0].region_id
                }

                // make api call
                const intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
                var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                    // console.log('Server Log : '+strLog)

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // update the table with last login date and ip address
                var param1 = {
                    last_login_datetime : isodate, 
                    last_login_ip : req.body.userIpAddress ? req.body.userIpAddress : 0,
                }
                var searchKeyValue = {
                    username : strUserName,
                    Active : 1
                }

                var updateResponce = await sqlQuery.updateQuery(this.tableName1, param1, searchKeyValue)
            
            // commission type
                var strCommType = lisResponce[0].comm_type == 1 ? "Pre-Paid" : lisResponce[0].comm_type == 2 ? "Post-Paid" : "Pre-Paid as 1st transaction"
            
            // get module permission list  
                var oldlistModulePermission = await sqlQueryReplica.searchQuery(this.tableName4,{user_uuid : lisResponce[0].user_uuid},["agent_module_name AS moduleName","perm_view AS permView"],"agent_module_per_id","ASC",9,0)
                // console.log(listModulePermission)
                if (oldlistModulePermission.length != 9 ) listModulePermission = "permission list is improper"
                var listModulePermission = oldlistModulePermission.map((result) =>{
                    var {permView,...other} = result
                    other.permView = permView == 1 ? 1 : 0
                    return other
                })

            // get app version from redis 
                redisMaster.get('AppVersion',(err, reply) => {
                    // send responce to front end 
                    res.status(201).send({
                        userid : lisResponce[0].username, 
                        token, fullName: lisResponce[0].full_name, 
                        userType: type,
                        commisionTypeList : [strCommType] , 
                        listModulePermission, 
                        appVersion : reply && Number(reply) ? Number(reply) : 1
                    });
                })
            
        }catch(error){
            console.log(error)
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
        
    }  

    logout = async(req,res) =>{ 
        try{
            // chceck the body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('agentLoginFun/logout',JSON.stringify(req.body), JSON.stringify(req.query))
            const authHeader = req.headers.authorization;
            const bearer = 'Bearer ';
            const token = authHeader.replace(bearer, '');

            await redisMaster.delete(String(token))

            res.status(200).json({message : 'user logout successfully'})

        }catch(error){
            console.log(error)
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
    
    //function to get details
    getDetails = async (req,res) =>{
        try{
            // chceck the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('agentLoginFun/getDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            // get the details from sql 
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    Active : 1
                }
                var key = ["full_name AS name","gender","username AS userId",'usertype_id AS userType_uuid',"emailid","mobile","CAST(country_uuid AS CHAR(16)) AS country_uuid","country_name AS countryName","CAST(region_uuid AS CHAR(16)) AS region_uuid","region_name AS regionName","CAST(province_uuid AS CHAR(16)) AS province_uuid","province_name AS provinceName","CAST(district_uuid AS CHAR(16)) AS district_uuid","district_name AS districtName","city_name AS cityName","Address AS address","shop_name AS shopName","prefer_lang AS language",'image_id AS imageId']
                var orderby = "username"
                var ordertype = "ASC"

                var lisResult = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                if(lisResult.length === 0) return res.status(204).send({message:"user details not found"})

                lisResult[0].gender = lisResult[0].gender == 1 ? "Male" : lisResult[0].gender == 2 ? "Female" : lisResult[0].gender == 0 ? "other" : "not set"

            // get user type list
                var userTypeList = await commonQueryCommon.getAllAgentType()
                if(userTypeList.length == 0) return res.status(400).json({ errors: [ {msg : 'user type list not found'}] });
                
                // console.log(lisResult[0].userType_uuid)
                lisResult[0].userTypeName = userTypeList[lisResult[0].userType_uuid-1].agent_type_name
                lisResult[0].userType_uuid = userTypeList[lisResult[0].userType_uuid-1].agent_type_uuid

            // get language name
                var lisLanguage = await sqlQueryReplica.searchQuery(this.tableName3,{lang_id :lisResult[0].language},["CAST(lang_uuid AS CHAR(16)) AS lang_uuid","lang_name"],'lang_uuid','ASC',1, 0)
                
                lisResult[0].lang_uuid = lisLanguage.length > 0 ? lisLanguage[0].lang_uuid : 'Not Found'
                lisResult[0].language = lisLanguage.length > 0 ? lisLanguage[0].lang_name : 'Not Found'

                res.status(200).send(lisResult[0])
        }catch(error){
            console.log(error)
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update agent details
    updateAgentDetails = async (req, res) =>{
        try{
            // chceck the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('agentLoginFun/updateAgentDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            // // check language uuid
            //     var searchKeyValue = {
            //         lang_uuid : req.body.lang_uuid, //str language uuid
            //         lang_name : req.body.langName , //str language name
            //     }
            //     var key = ['lang_id']
            //     var orderby = 'lang_id'
            //     var ordertype = 'ASC'
            //     var lisLanguage = await sqlQuery.searchQuery(this.tableName3,searchKeyValue,key,orderby,ordertype,1, 0)
            //     if(lisLanguage.length === 0) return res.status(400).json({ errors:[{msg:'Language not found'}]})
            
            // get agent details 
                var lisAgentDetials = await sqlQueryReplica.searchQuery(this.tableName1,{user_uuid : req.body.user_detials.user_uuid,Active : 1},["full_name","emailid","city_name","Address","shop_name","gender","mobile","usertype_id","region_id"],'userid','ASC',1,0)
                if(lisAgentDetials.length === 0) return res.status(400).json({ errors:[{msg:"user not found"}]})

                var oldValue = []
                var  newValue = []
                if(lisAgentDetials[0].full_name != req.body.name) {
                    oldValue.push(lisAgentDetials[0].full_name)
                    newValue.push(req.body.name)
                }
                if(req.body.email && lisAgentDetials[0].emailid != req.body.email) {
                    oldValue.push(lisAgentDetials[0].emailid)
                    newValue.push(req.body.email)
                }
                if(lisAgentDetials[0].city_name != req.body.city) {
                    oldValue.push(lisAgentDetials[0].city_name)
                    newValue.push(req.body.city)
                }
                if(lisAgentDetials[0].Address != req.body.address) {
                    oldValue.push(lisAgentDetials[0].Address)
                    newValue.push(req.body.address)
                }
                if(lisAgentDetials[0].shop_name != req.body.shopName) {
                    oldValue.push(lisAgentDetials[0].shop_name)
                    newValue.push(req.body.shopName)
                }
                if(lisAgentDetials[0].gender != req.body.gender) {
                    oldValue.push(lisAgentDetials[0].gender)
                    newValue.push(req.body.gender)
                }

                if(newValue.length === 0) return res.status(200).json({msg : "User details are same as earlier"})
                oldValue = oldValue.join(',')
                newValue = newValue.join(",")

            // update the user details except mobile number
                //variables for sql query
                var param = {
                    full_name : req.body.name,
                    city_name : req.body.city,
                    Address : req.body.address,
                    shop_name : req.body.shopName,
                    // prefer_lang : lisLanguage[0].lang_id,
                }
                
                // if (req.body.email) param.emailid = req.body.email
                param.emailid = req.body.email ? req.body.email : "NULL"
                if (req.body.gender) param.gender = req.body.gender; // optinal gender

                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    Active : 1
                }

                // fire sql query to update agent details
                const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

                // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'user not found' :
                    affectedRows && changedRows ? 'User details updated successfully' : 'Details Updated';
            
            // add login when the data updated successfully 
                if(affectedRows && changedRows) {
                    // get all agent type name
                    var listAgentType = await commonQueryCommon.getAllAgentType()
                    // console.log(listAgentType)
                    // console.log(lisResponce[0])
                    var type = 'agent'
                    for (var i=0; i<listAgentType.length; i++){
                        if(listAgentType[i].agent_type_id == lisAgentDetials[0].usertype_id) 
                        {
                            type = listAgentType[i].agent_type_name
                        }
                    }

                    // addlogin log using api call
                    // api call variable
                    var data = { 
                        userid : req.body.user_detials.userid,
                        username : req.query.username,
                        full_name : req.body.name,
                        mobile : lisAgentDetials[0].mobile,
                        user_uuid : req.body.user_detials.user_uuid,
                        intCreatedByType : (req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, 
                        intUserType : lisAgentDetials[0].usertype_id,
                        userIpAddress : req.body.userIpAddress ? req.body.userIpAddress : 0, 
                        userMacAddress : req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                        userOsDetails : req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                        userImeiNumber : req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                        userGcmId : req.body.userGcmId ? req.body.userGcmId : 0, //str
                        userAppVersion : req.body.userAppVersion ? req.body.userAppVersion : null, //str
                        userApplicationType : req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                        description : type + ' update details',
                        userActivityType : 11,
                        oldValue : oldValue,
                        newValue : newValue,
                        regionTd : lisAgentDetials[0].region_id
                    }

                    // make api call
                    const intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
                    var strLog = intResult == 1 ? 'Agent details update log added successfully' : intResult == 2 ? 'Agent details update log error' : 'end point not found'
                        // console.log('Server Log : '+strLog)
                }

                // send responce to fornt end
                res.send({ message, info });

        }catch(error){
            console.log(error)
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    // function to change password
    changePassword = async (req,res) => {
        try{
            // chceck the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('agentLoginFun/changePassword',JSON.stringify(req.body), JSON.stringify(req.query))
            // get password, encription key and pin
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    Active : 1
                }
                var key = ["encryption_key","password","m_pin","full_name","mobile","usertype_id","region_id"]
                var orderby = "userid"
                var ordertype = "ASC"
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                // console.log(lisResponce1)

            // decript the password and pin
                var strDecriptedPassword = varEncryptionString.decryptString(lisResponce1[0].encryption_key,lisResponce1[0].password)
                var strDecriptedPin = varEncryptionString.decryptString(lisResponce1[0].encryption_key,lisResponce1[0].m_pin)
                // console.log(strDecriptedPassword,strDecriptedPin)

            // chek the password and if match change the password
                if(req.body.oldPassword != strDecriptedPassword) return res.status(400).json({ errors: [ {msg : "old password is wrong"}] });

            // incript the password and pin
                var newEncryptionKey = this.setEncryptionKey()
                var strNewIncriptedPassword = varEncryptionString.encryptString (newEncryptionKey,req.body.password)
                var strNewIncriptedPin = varEncryptionString.encryptString(newEncryptionKey,strDecriptedPin)
            
            // update the details in the data base
                var param = {
                    encryption_key : newEncryptionKey,
                    password : strNewIncriptedPassword,
                    m_pin : strNewIncriptedPin
                }

            // fire sql query to update agent details
                const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'user not found' :
                    affectedRows && changedRows ? 'User password changes successfully' : 'password change faild, values are same';
            
            // add login when the data updated successfully 
                if(affectedRows && changedRows) {
                    // get all agent type name
                    var listAgentType = await commonQueryCommon.getAllAgentType()
                    // console.log(listAgentType)
                    // console.log(lisResponce[0])
                    var type = 'agent'
                    for (var i=0; i<listAgentType.length; i++){
                        if(listAgentType[i].agent_type_id == lisResponce1[0].usertype_id) 
                        {
                            type = listAgentType[i].agent_type_name
                        }
                    }

                    // addlogin log using api call
                    // api call variable
                    var data = { 
                        userid : req.body.user_detials.userid,
                        username : req.query.username,
                        full_name : lisResponce1[0].full_name,
                        mobile : lisResponce1[0].mobile,
                        user_uuid : req.body.user_detials.user_uuid,
                        intCreatedByType : (req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, 
                        intUserType : lisResponce1[0].usertype_id,
                        userIpAddress : req.body.userIpAddress ? req.body.userIpAddress : 0, 
                        userMacAddress : req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                        userOsDetails : req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                        userImeiNumber : req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                        userGcmId : req.body.userGcmId ? req.body.userGcmId : 0, //str
                        userAppVersion : req.body.userAppVersion ? req.body.userAppVersion : null, //str
                        userApplicationType : req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                        description : type + ' change password',
                        userActivityType : 10,
                        oldValue : lisResponce1[0].password +","+ lisResponce1[0].encryption_key,
                        newValue : strNewIncriptedPassword+","+newEncryptionKey,
                        regionId : lisResponce1[0].region_id
                    }

                    // make api call
                    const intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
                    var strLog = intResult == 1 ? 'Agent change password log added successfully' : intResult == 2 ? 'Agent change password log error' : 'end point not found'
                        // console.log('Server Log : '+strLog)
                }   
            // send responce to fornt end
                res.send({ message, info });

        }catch(error){
            console.log(error)
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }

    }

    //add agent contact 
    addContactNumber = async(req,res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let operator_uuid = '', operatorName = ''
            console.log('agentLoginFun/addContactNumber',JSON.stringify(req.body), JSON.stringify(req.query))
            switch(req.body.mobile.slice(0,3)){
                case "078":
                case "073":
                    // Etisalat
                    operator_uuid = "70b9906d-c2ba-11"
                    operatorName ="Etisalat"
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
                case "074" :
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

            if(operator_uuid != req.body.operator_uuid && operatorName != req.body.operatorName){
                return res.status(400).json({ errors: [ {msg : "Mobile number does not match with selected operator"}] });
            }

            // check if mobile number already registered with some user
            let boolCheckMobileNumber = await sqlQuery.searchQuery(this.tableName2, { mobile: req.body.mobile, status : 1}, ['CAST(agent_contact_uuid AS CHAR(16)) AS agent_contact_uuid','CAST(user_uuid AS CHAR(16)) AS user_uuid'],'agent_contact_id','ASC',1,0)
            if( boolCheckMobileNumber.length != 0 ){
                return res.status(400).json({ errors: [ {msg :'Mobile Number is already registered'}]}) 
            }

            //verify operator name and operator uuid
                // var boolCheckOperator = await commonQueryCommon.checkOperator(req.body.operator_uuid,req.body.operatorName)
                // if (!boolCheckOperator) return res.status(400).json({ errors: [ {msg :"operator not found"}] });
                var searchKeyValue = {
                    operator_uuid: req.body.operator_uuid, //str operator uuid
                    operator_name: req.body.operatorName,
                    active: 1,
                    SMPP : 1
                }
            // fire sql query to get str operator name 
            const lisResponse2 = await sqlQueryReplica.searchQuery(this.tableName6, searchKeyValue, ["COUNT(1)"], 'operator_id', 'asc', 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse2) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse2[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg : "Operator Service not added" }] });
            }    

            // checkl for primary number and 6 numbner are only allowed
                var searchKeyValue = {
                    user_uuid: req.body.user_detials.user_uuid, // str user uuid
                    status : 1
                }
                var key = ["mobile_type"]
                var orderby = "mobile"
                var ordertype = "ASC"
        
                // fire sql query to get str agent_contact_uuid, int mobile, str operatorName, str recieveNotification, bool status by user id
                const lisResponse0 = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype,7,0)
                
                // console.log(lisResponse0)
                // error if 6 number are allready added
                if(lisResponse0.length >= 6) return res.status(400).json({ errors: [ {msg : 'Six mobile number allreday added'}] });
                if(lisResponse0.length == 0) req.body.mobileType = 1
                // check for primary number
                    if(lisResponse0.length > 0 && req.body.mobileType == 1){
                        var responce = lisResponse0.map((lis) =>{
                            // console.log(lis)
                            if(lis.mobile_type == 1) return true
                            return false
                        })

                        // error if primary number is allready added
                        if(responce.includes(true)) return res.status(400).json({ errors: [ {msg : 'Primary no allready added'}]})
                    }
            
            // if operator type is 1 add the number to login table
                if(req.body.mobileType == 1){
                    var searchKeyValue = {
                        user_uuid: req.body.user_detials.user_uuid, // str user uuid,
                        Active : 1
                    }
                    var param = {
                        mobile : req.body.mobile,
                    }
                    var objResponce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();    
            
            //add contact number to list
                //variables for sql query
                var param = {
                    agent_contact_uuid: "uuid()",
                    userid: req.body.user_detials.userid, //str user id
                    user_uuid: req.body.user_detials.user_uuid, //str user uuid
                    mobile: req.body.mobile, //int mobile number
                    operator_uuid: req.body.operator_uuid, //str operator uuid
                    operator_name: req.body.operatorName, //str operator name
                    mobile_type: req.body.mobileType, //str operator type
                    recieve_notification: req.body.recieveNotification, //bool recieve notification
                    udpated_by_type : ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                    updated_by : req.body.user_detials.userid,
                    updated_on : isodate
                }

                // fire sql query to create the name of the category
                const objResult = await sqlQuery.createQuery(this.tableName2, param);

                // check if the result is there and responce accordingly
                res.status(201).send({ message: 'number added successfully' });

        }catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] }); 
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get contact ddetails
    getContactDetails = async (req, res) =>{
        try{
            // chceck the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('agentLoginFun/getContactDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            // get contact details from sql query
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    // status : 1 
                }
                var key = ["CAST(agent_contact_uuid AS CHAR(16)) AS agent_contact_uuid","mobile","CAST(operator_uuid AS CHAR(16)) AS operator_uuid","operator_name AS operatorName","mobile_type AS type","recieve_notification AS revieveNoti","status"]
                var orderby = "mobile_type"
                var ordertype = "DESC"
                
                var lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 10, 0)
                if(lisResponce1.length === 0) return res.status(204).send({ message : "no contact details found"})
                // console.log(lisResponce1)

            // Remap the details
                var finalResuilt = lisResponce1.map((result)=>{
                    var { type,revieveNoti,status,...others} = result
                    others.type = type == 1 ? "Primary" : "Alternate"
                    others.revieveNoti = revieveNoti == 1 ? "Yes" : "No"
                    others.status = "Active"
                    return others
                })
            
            //responce to front end
                res.status(200).send(finalResuilt)

        }catch(error){
            console.log(error)
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //update contact number 
    updateContactNumber = async (req, res) => {
        try{
            // chceck the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('agentLoginFun/updateContactNumber',JSON.stringify(req.body), JSON.stringify(req.query))
                let operator_uuid = '', operatorName = ''

                switch(req.body.mobile.slice(0,3)){
                    case "078":
                    case "073":
                        // Etisalat
                        operator_uuid = "70b9906d-c2ba-11"
                        operatorName ="Etisalat"
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
                    case "074" :
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
    
                // if(operator_uuid != req.body.operator_uuid && operatorName != req.body.operatorName){
                //     return res.status(400).json({ errors: [ {msg : "Mobile number does not match with selected operator"}] });
                // }

            // check operator uuid and name
                var boolCheckOperator = await commonQueryCommon.checkOperator(operator_uuid,operatorName)
                if (!boolCheckOperator) return res.status(400).json({ errors: [ {msg :"operator not found"}] });

                var searchKeyValue = {
                    operator_uuid: operator_uuid || req.body.operator_uuid, //str operator uuid
                    operator_name: operatorName || req.body.operatorName,
                    active: 1,
                    SMPP : 1
                }
                const lisResponse2 = await sqlQueryReplica.searchQuery(this.tableName6, searchKeyValue, ["COUNT(1)"], 'operator_id', 'asc', 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse2) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse2[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg : "Operator Service not added" }] });
            }   

            // get agent details
                const lisAgentDetails = await sqlQuery.searchQuery(this.tableName1,{user_uuid : req.body.user_detials.user_uuid,Active : 1},['full_name',"mobile",'usertype_id','region_id'],'userid','ASC',1,0)

            // get last mobile number and operator uuid
                const liscontactDetails = await sqlQuery.searchQuery(this.tableName2,{agent_contact_uuid: req.body.agent_contact_uuid,user_uuid: req.body.user_detials.user_uuid} , ['mobile','mobile_type',"operator_uuid","recieve_notification","status"], 'userid', "ASC", 1, 0)    
            
                if(liscontactDetails.length == 0) return res.status(400).json({ errors: [ {msg : "Contact details not found" }] });

            let boolCheckMobileNumber = await sqlQuery.searchQuery(this.tableName2, { mobile: req.body.mobile, status : 1}, ['CAST(agent_contact_uuid AS CHAR(16)) AS agent_contact_uuid','CAST(user_uuid AS CHAR(16)) AS user_uuid'],'agent_contact_id','ASC',1,0)
            if( boolCheckMobileNumber.length != 0 && boolCheckMobileNumber[0].agent_contact_uuid != req.body.agent_contact_uuid ){
                return res.status(400).json({ errors: [ {msg :'Mobile Number is already registered'}]}) 
            }

                if(req.body.status != 1 && liscontactDetails[0].mobile_type == 1) return res.status(400).json({ errors: [ {msg : "Not allowed to update primary number as In-active" }] });
            // check values
                var newValue = []
                var oldValue = []

                if(req.body.mobile != liscontactDetails[0].mobile) {
                    oldValue.push(liscontactDetails[0].mobile)
                    newValue.push(req.body.mobile)
                }
                if(req.body.mobileType != liscontactDetails[0].mobile_type) {
                    oldValue.push("type "+ liscontactDetails[0].mobile_type)
                    newValue.push("type "+ req.body.mobileType)
                }
                if((req.body.operator_uuid || operator_uuid) != liscontactDetails[0].operator_uuid) {
                    oldValue.push(liscontactDetails[0].operator_uuid)
                    newValue.push(req.body.operator_uuid || operator_uuid)
                }
                if(req.body.recieveNotification != liscontactDetails[0].recieve_notification) {
                    oldValue.push("noti "+ liscontactDetails[0].recieve_notification)
                    newValue.push("noti "+ req.body.recieveNotification)
                }
                if(req.body.status != liscontactDetails[0].status) {
                    oldValue.push("type "+ liscontactDetails[0].status)
                    newValue.push("type "+ req.body.status)
                }

                if(liscontactDetails[0].mobile_type == 1 && req.body.status == 0) return res.status(400).json({ errors: [ {msg :"Not allowed to change primary number status to In-Active"}] });
                if(req.body.status == 1 && req.body.status == 0) return res.status(400).json({ errors: [ {msg :"Not allowed to update primary status as In-Active"}] });

                oldValue = oldValue.join(",")
                newValue = newValue.join(",")
                if(newValue.length == 0) return res.send({ message : 'Details already Updated' });
            
            // if mobile type is 1 then check for primary number and update in contact table and in login table
                if(req.body.mobileType == 1) {
                    //get agent primary number and make them alternate
                    var searchKeyValue1 = {
                        user_uuid : req.body.user_detials.user_uuid,
                        mobile_type : 1
                    }
                    var param1 = {
                        mobile_type : 0
                    }
                    const listAgentPrimaryNumber = await sqlQuery.updateQuery(this.tableName2, param1, searchKeyValue1)

                    // add primary number to login table of user
                    var searchKeyValue = {
                        user_uuid: req.body.user_detials.user_uuid, // str user uuid,
                        Active : 1
                    }
                    var param1 = {
                        mobile : req.body.mobile,
                    }
                    var objResponce = await sqlQuery.updateQuery(this.tableName1, param1, searchKeyValue)
                }
                // else{
                //     return res.status(400).json({ errors: [ {msg :"Change other number to primary number"}] });
                // }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // update mobile number
                var param = {
                    mobile: req.body.mobile, //int mobile number
                    operator_uuid: req.body.operator_uuid || operator_uuid, //str operator uuid
                    operator_name: req.body.operatorName || operatorName, //str operator name
                    mobile_type: req.body.mobileType, //str operator type
                    recieve_notification: req.body.recieveNotification, //bool recieve notification
                    udpated_by_type : ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                    updated_by : req.body.user_detials.userid,
                    status : req.body.status,
                    updated_on : isodate
                }
                var searchKeyValue = {
                    agent_contact_uuid: req.body.agent_contact_uuid, //str operator uuid
                    user_uuid: req.body.user_detials.user_uuid
                }

                const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
                if (!objResult) {
                    throw new HttpException(500, 'Something went wrong');
                }
                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'contact not found' :
                    affectedRows && changedRows ? 'Contact updated successfully' : 'Details Updated';

            // add login when the data updated successfully 
                if(affectedRows && changedRows) {
                    // get all agent type name
                    var listAgentType = await commonQueryCommon.getAllAgentType()
                    // console.log(listAgentType)
                    // console.log(lisResponce[0])
                    var type = 'agent'
                    for (var i=0; i<listAgentType.length; i++){
                        if(listAgentType[i].agent_type_id == lisAgentDetails[0].usertype_id) 
                        {
                            type = listAgentType[i].agent_type_name
                        }
                    }

                    // addlogin log using api call
                    // api call variable
                    var data = { 
                        userid : req.body.user_detials.userid,
                        username : req.query.username,
                        full_name : lisAgentDetails[0].full_name,
                        mobile : req.body.mobileType ? req.body.mobile : lisAgentDetails[0].mobile,
                        user_uuid : req.body.user_detials.user_uuid,
                        intCreatedByType : (req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, 
                        intUserType : lisAgentDetails[0].usertype_id,
                        userIpAddress : req.body.userIpAddress ? req.body.userIpAddress : 0, 
                        userMacAddress : req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                        userOsDetails : req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                        userImeiNumber : req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                        userGcmId : req.body.userGcmId ? req.body.userGcmId : 0, //str
                        userAppVersion : req.body.userAppVersion ? req.body.userAppVersion : null, //str
                        userApplicationType : req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                        description : req.body.mobileType ? type + ' update primary mobile number' : type + ' update alternate mobile number' ,
                        userActivityType : 12,
                        oldValue : oldValue,
                        newValue : newValue,
                        regionId : lisAgentDetails[0].region_id
                    }

                    // make api call
                    const intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
                    var strLog = intResult == 1 ? 'Agent change password log added successfully' : intResult == 2 ? 'Agent change password log error' : 'end point not found'
                        // console.log('Server Log : '+strLog)
                }

                // send responce to front end
                res.send({ message, info });

        }catch(error){
            console.log(error)
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    //get pin
    getpin = async(req,res) => {
        try{
            // chceck the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('agentLoginFun/getPin',JSON.stringify(req.body), JSON.stringify(req.query))
            // get m pin, encryption key, mpin status
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    Active : 1
                }
                var key = ['m_pin','mpin_status','encryption_key']
                var orderby = "userid"
                var ordertype = "ASC"

                var lisResult = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

                if(lisResult.length === 0) return res.status(404).json({ errors: [ {msg : "user not found"}] }); 
            // decript the m-pin
                let decriptedPin = varEncryptionString.decryptString(lisResult[0].encryption_key,lisResult[0].m_pin)
            // send responce 
                res.status(200).send({ 
                    pin : decriptedPin,
                    status : lisResult[0].mpin_status ? 'Active' : 'In-Active'
                })

        }catch(error){
            console.log(error)
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    updatPin = async(req,res) => {
        try{    
            // chceck the body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('agentLoginFun/updatePin',JSON.stringify(req.body), JSON.stringify(req.query))
            // get encryption keys
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    Active : 1
                }
                var key = ['encryption_key']
                var orderby = "userid"
                var ordertype = "ASC"

                var lisResult = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

                if(lisResult.length === 0) return res.status(404).json({ errors: [ {msg : "user not found"}] }); 

                var encryptionKey = lisResult[0].encryption_key
            
            // encript the new pin 
                var newPin = req.body.pin
                var encryptedPin = varEncryptionString.encryptString(encryptionKey,newPin.toString())
            
            // update the pin in the data base
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    Active : 1
                }
                var param = {
                    m_pin : encryptedPin
                }
                
                const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);
            
            //generate proper message
                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'user not found' :
                    affectedRows && changedRows ? 'pin update successfully' : 'Details Updated';

            // send responce to front end
                res.send({ message, info });

        }catch(error){
            console.log(error)
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to send password to registered mobile number
    forgetSendPassword = async(req, res, next) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('agentLoginFun/forgetSendPassword',JSON.stringify(req.body), JSON.stringify(req.query))
            // search admin mobile number, password, encryption key using username
                var searchKeyValue = {
                    username : req.body.userid,
                    Active : 1
                }
                var key = ['userid','password','mobile','encryption_key','user_status']
                var orderby = "username"
                var ordertype = "ASC"
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
            
            // send response for username not found and for wrong mobile number
                if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}] });
                if(lisResponce[0].user_status != 1) return res.status(400).json({ errors: [{msg : 'User account is In-active'}]});
                if( !lisResponce[0].mobile || lisResponce[0].mobile.length != 10 ) return res.status(400).json({ errors: [{msg : 'No primary register number to send password'}]});
                
            // decript the password using encription key 
                var strDecriptedPassword = varEncryptionString.decryptString(lisResponce[0].encryption_key,lisResponce[0].password)

            // send password to registered mobile number
                // var message = 'This is you password : ' + strDecriptedPassword

            // send sms
            let smsDetails = {
                agentId : lisResponce[0].userid,
                recieverMessage : `This is you password : ${strDecriptedPassword}, Thank you for being Afghan Pay Agent!`
            }
            let smsFunResponce = smsFunction.agentSms(smsDetails)
            // if(smsFunResponce.error){
            //     console.log(smsFunResponce.error)
            //     return res.status(400).json({ errors: [ {msg : smsFunResponce.error}] });
            // }
            
            // check if the result is there and responce accordingly
                // if ( onjresult.error ) {
                //     return res.status(400).json({ errors: [ {msg : onjresult.error }] });
                // }
            
            // send responce to fornt end
                res.status(200).send({ message : 'Password will be send in your registered mobile number' });

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to update profile image
    updateImage = async (req, res) =>{
        try {
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('agentLoginFun/updateImage',JSON.stringify(req.body), JSON.stringify(req.query))
                if(!req.file) return res.status(400).json({ errors: [ {msg : "Image upload faild"}] });

                let uploadDetails = await awsCommon.upload(req.file)

                if( !uploadDetails ){
                    return res.status(400).json({ errors: [ {msg :'image uplaod upload faild'}]})
                }
                
            // upload image
                let param = {
                    image_id : uploadDetails.Location
                }
                let searchKeyValue = {
                    userid : req.body.user_detials.userid
                }

                let updateRes = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

            //generate proper message
                const { affectedRows, changedRows, info } = updateRes;
                const message = !affectedRows ? 'user id not found' :
                    affectedRows && changedRows ? 'Image updated successfully' : 'Image uploaded';

            // send responce to front end
                res.send({ message, info });

        } catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getImage = async (req,res) =>{
        try{

            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('agentLoginFun/getImage',JSON.stringify(req.body), JSON.stringify(req.query))
            // upload image
                let searchKeyValue = {
                    userid : req.body.user_detials.userid
                }
                let key = ['image_id']

                let imageId = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, 'userid', 'ASC', 1, 0)
                if (imageId.length == 0) return res.status(204).send({ message: 'user id not found'})

                res.status(200).send({imageId : imageId[0].image_id})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    setEncryptionKey() {
        var strRandomString = varRandomString.generateRandomString(15);
        var strRandomHash = varRandomString.generateRandomHash(strRandomString);
        return strRandomHash;
    }
}

module.exports = new agentLoginFunction();
