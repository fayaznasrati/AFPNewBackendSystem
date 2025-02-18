const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common');
const sqlQueryReplica = require('../common/sqlQueryReplica.common');

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');
const commonQueryCommon = require('../common/commonQuery.common');

const smsFunction = require('../common/smsFunction.common');

const role = require('../utils/userRoles.utils')

const redisMaster = require('../common/master/radisMaster.common')

const varRandomString = require('../utils/randomString.utils');
const varEncryptionString = require('../utils/encryption.utils');

// const { toIsoString } = require('../common/timeFunction.common')

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

class agetnAdminFunction {
    tableName1 = 'er_login_admin' // admin table
    tableName2 = 'er_login' // agent table
    tableName3 = 'er_agent_modules_permission' // er_agent_modules_permission
    tableName4 = 'er_master_login_reason'

    // function to get otp for Admin login 
    requestLoginOtp = async ( req, res) =>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('agentAdminFunction/requestLoginOtp',JSON.stringify(req.body), JSON.stringify(req.query))
            // check for mobile number in the data base
                var searchKeyValue = {
                    admin_userid: req.body.user_detials.id,
                    mobile: req.body.mobile,
                    active : 1
                }
                var key = ["COUNT(1)"]
                var orderby = "mobile"
                var ordertype = "ASC"

                // fire sql query to get str country_uuid, str country_name
                const lisResponce = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                if(!lisResponce[0]["COUNT(1)"]) return res.status(400).json({ errors: [ {msg : 'user details not match'}]})

            // update table in er_login_admin as sms send with the time
                var intOTP = varRandomString.generateRandomNumber(6)

                // otp validation time
                var dtCurrentDateTime = new Date()
                var dtOtpExpirationDateTime = new Date(dtCurrentDateTime.getTime() + process.env.OTP_EXPIRATION_IN_MIN * 60000).toISOString().slice(0, 19).replace('T', ' ')

                var param = {
                    agent_login_otp : intOTP,
                    agent_login_otp_expire_on : dtOtpExpirationDateTime
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                var searchKeyValue = {
                    admin_userid: req.body.user_detials.id, //str country uuid
                    agent_login_otp_expire_in : isodate,
                    active : 1
                }

                // fire sql query to update country name
                const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

                // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'OTP allready send, request again after '+ process.env.OTP_EXPIRATION_IN_MIN + " min" :
                    affectedRows && changedRows ? 'OTP send successfully' : 'OTP allready sended';

            // for adding in log table 
                // if(affectedRows && changedRows){
                //     var param = {
                //         admin_userid : req.body.user_detials.id, //str
                //         username : req.body.user_detials.username, //str
                //         uertype : req.body.user_detials.type, //str
                //         old_mobile_number : lisResponce[0].mobile,
                //         old_mobile_operator : lisResponce[0].operator_uuid,
                //         new_mobile_number: req.body.mobileNumber,
                //         new_mobile_operator: req.body.operator_uuid,
                //         created_on: isodate
                //     }
        
                //     // fire sql query to create new country
                //     const objresult1 = await sqlQuery.createQuery(this.tableName3, param)
                // }

            res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to get login otp
    getLoginOtp = async (req, res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('agentAdminFunction/getLoginOtp',JSON.stringify(req.body), JSON.stringify(req.query))
            // search for admin ang get login otp 
                var searchKeyValue = {
                    admin_userid: req.body.user_detials.id,
                    active : 1
                }
                var key = ["agent_login_otp AS OTP"]
                var orderby = "mobile"
                var ordertype = "ASC"

                // fire sql query to get str country_uuid, str country_name
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                
                if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
                res.status(200).send(lisResponce[0])

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    } 

    //function for admin to login as Agent
    verifyOtpGetLoginAccess = async (req,res,next) =>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('agentAdminFunction/verifyOtpGetLoiginAccess',JSON.stringify(req.body), JSON.stringify(req.query))
            // verify otp
                var param = {
                    agent_login_otp_expire_on : "0000-00-00 00:00:00"
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                var searchKeyValue = {
                    agent_login_otp : req.body.otp,
                    admin_userid: req.body.user_detials.id, //str country uuid
                    agent_login_otp_expire_out : isodate,
                    active : 1
                }

                // fire sql query to update country name
                const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

                // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = objResult;

            //search agent
                var searchKeyValue = {
                    user_uuid: req.body.agent_uuid,
                    Active : 1
                }
                var key = ["username","userid","usertype_id"]
                var orderby = "mobile"
                var ordertype = "ASC"

                // fire sql query to get str country_uuid, str country_name
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)
                // console.log(lisResponce)
                if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}]})

            //send responce to front end

                if(!affectedRows) return res.status(400).json({ errors: [ {msg : 'Wrong OTP'}]})

                if(affectedRows && changedRows) {
                    const secretKey = process.env.SECRET_JWT || "";
                    const token = jwt.sign({ user_id: req.query.username, agent_id:lisResponce[0].userid, agent_name:lisResponce[0].username,agent_uuid : lisResponce[0].user_uuid, userType: "Admin-Agent" }, secretKey, {
                        expiresIn: process.env.SESSION_TIME
                    });
                    return res.status(200).send({ userid : req.query.username,agentid:lisResponce[0].username , token });
                }

                res.status(200).send({message:'OTP session login time out'})

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    agentLogin = async(req, res) =>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
        // function to add details in log table
            // req.body.message
            console.log('agentAdminFunction/agentLogin',JSON.stringify(req.body), JSON.stringify(req.query))
        // check reason
            const resonCheck = await sqlQueryReplica.searchQuery(this.tableName4,{
                reason_uuid : req.body.reason_uuid, 
                reason : req.body.reason, //str reason        
            },['COUNT(1)'],'id','ASC',1,0)

            if(resonCheck[0]["COUNT(1)"] == 0) return res.status(400).json({ errors: [ {msg : 'login reason not found'}]})

        //search agent
            var searchKeyValue = {
                user_uuid: req.body.agent_uuid,
                Active : 1
            }

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }


            var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid","username","userid","usertype_id","full_name","comm_type","mobile","last_login_ip","fource_logout",'region_id','user_status']
            var orderby = "mobile"
            var ordertype = "ASC"

            // fire sql query to get str country_uuid, str country_name
            const lisResponce = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)
            // console.log(lisResponce)
            if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}]})

            if(lisResponce[0].fource_logout == 1 ){
                const updateResponce = await sqlQuery.updateQuery(this.tableName2,{fource_logout : 0},{user_uuid: req.body.agent_uuid,Active : 1})
            }

            if(lisResponce[0].user_status != 1 ){
                const updateResponce = await sqlQuery.updateQuery(this.tableName2,{user_status : 1},{user_uuid: req.body.agent_uuid,Active : 1})
            }

        //send responce to front end

            const secretKey = process.env.SECRET_JWT || "";
            const token = jwt.sign({ user_id:lisResponce[0].userid , userType: role.Agnet }, secretKey, {
                expiresIn: process.env.SESSION_TIME
            });

            redisMaster.post(`agent_login_session_${lisResponce[0].username}`,token)
            
        // get all agent type name
            var listAgentType = await commonQueryCommon.getAllAgentType()
            var type = 'agent'
            for (var i=0; i<listAgentType.length; i++){
                if(listAgentType[i].agent_type_id == lisResponce[0].usertype_id) 
                {
                    type = listAgentType[i].agent_type_name
                }
            }

        // send sms if primary number added

        if( lisResponce[0].mobile && lisResponce[0].mobile.length == 10 ) {
            let smsMessage = `${req.query.username} login to your account, Thank you for being Afghan Pay Agent!`

            if(req.body.user_detials.type == role.Admin ) smsMessage = `Admin ${req.query.username} login to your account, Thank you for being Afghan Pay Agent!`
            else{
                if(req.body.user_detials.type == role.SubAdmin ) smsMessage = `Sub-Admin ${req.query.username} login to your account, Thank you for being Afghan Pay Agent!`
                else smsMessage = `Agent ${req.query.username} login to your account, Thank you for being Afghan Pay Agent!`
            }

            // send sms to agent
            let smsDetails = {
                agentId : lisResponce[0].userid,
                recieverMessage : smsMessage
            }
            let smsFunResponce = await smsFunction.agentSms(smsDetails)
            if(smsFunResponce.error){
                console.log(smsFunResponce.error)
            }
        }

        // once login is allowed add the data in log table
            // api call variable
            var data = { 
                userid : lisResponce[0].userid,
                username : lisResponce[0].username,
                full_name : lisResponce[0].full_name,
                mobile : lisResponce[0].mobile,
                user_uuid : req.body.agent_uuid,
                intCreatedByType : (req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, 
                intUserType : lisResponce[0].usertype_id ,
                userIpAddress : req.body.userIpAddress ? req.body.userIpAddress : 0, 
                userMacAddress : req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                userOsDetails : req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                userImeiNumber : req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                userGcmId : req.body.userGcmId ? req.body.userGcmId : 0, //str
                userAppVersion : req.body.userAppVersion ? req.body.userAppVersion : null, //str
                userApplicationType : req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                description : req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ? req.body.user_detials.type + ' Login as agnet ' + req.body.reason : 'Agent logedin as child agnet '+ req.body.reason ,
                userActivityType : (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? (req.body.user_detials.type == role.Admin ? 14 : 15) : 16,
                oldValue : req.query.username ,
                newValue : lisResponce[0].username, 
                regionId : lisResponce[0].region_id
            }
            
            // make api call
            const intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
            var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
            // console.log('Server Log : '+strLog)

        // get parent commission type
            var strCommType = lisResponce[0].comm_type == 1 ? "Pre-Paid" : lisResponce[0].comm_type == 2 ? "Post-Paid" : "Pre-Paid as 1st transaction"

        // get module permission list  
            var oldlistModulePermission = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid: req.body.agent_uuid},["agent_module_name AS moduleName","perm_view AS permView"],"agent_module_per_id","ASC",9,0)
            // console.log(listModulePermission)
            if (oldlistModulePermission.length != 9 ) listModulePermission = "permission list is improper"
            var listModulePermission = oldlistModulePermission.map((result) =>{
                var {permView,...other} = result
                other.permView = permView == 1 ? 1 : 0
                return other
            })

            return res.status(200).send({ userid : lisResponce[0].username , token , fullName: lisResponce[0].full_name, userType : type, commisionTypeList : [strCommType],listModulePermission});
            // res.status(201).send({ userid : lisResponce[0].username, token, fullName: lisResponce[0].full_name, userType: type });
        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // ###############-- Agent Focrce log out -- ##################
    forceLogout = async (req,res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('agentAdminFunction/forceLogout',JSON.stringify(req.body), JSON.stringify(req.query))
            // update the force logout to 1
                var searchKeyValue = {
                    user_uuid : req.body.agent_uuid,
                    Active : 1
                }
                
                if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
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

                const jsonResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue)

                const { affectedRows, changedRows, info } = jsonResult;
                const message = !affectedRows ? 'user details not found' :
                    affectedRows && changedRows ? 'Force Login successfully' : 'Allready force logout';

                // send responce to front end
                res.send({ message, info });

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

}

module.exports = new agetnAdminFunction();