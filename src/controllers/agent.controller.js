const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const redisMaster = require('../common/master/radisMaster.common')
const commonQueryCommon = require('../common/commonQuery.common')
const accessFilter = require('../common/accessFilter.common')
const role = require('../utils/userRoles.utils')
const genRandom = require('../utils/randomString.utils')
const varEncryptionString = require('../utils/encryption.utils');
const varRandomString = require('../utils/randomString.utils');
const dotenv = require('dotenv');
const path = require('path');
const smsFunction = require('../common/smsFunction.common')

// configer env
dotenv.config()

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');
const agentModule = require('../models/agent.module');

// const { toIsoString } = require('../common/timeFunction.common')

class agentController {

    tableName1 = 'er_agent_contact'
    tableName2 = 'er_login'
    tableName3 = 'er_master_operator'
    tableName4 = "er_agent_type"
    // tableName5 = 'er_agent_operator_access'
    tableName6 = 'er_agent_stock_transfer_channel'
    tableName7 = 'er_login_admin'
    tableName8 = 'er_prepaid_commission'
    tableName9 = 'er_postpaid_commission'
    tableName10 = 'er_slab_manager'
    tableName11 = 'er_wallet'

    //################---agent type---################

    // create agent query
    createType = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/createType',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();
            
            // 1) create parameter
            var param = {
                agent_type_uuid: "uuid()",
                agent_type_name: req.body.name, //str user name
                created_on: isodate, //date curren date time
                created_by: req.body.user_detials.id, //str user id 
                last_modified_by: req.body.user_detials.id, //str user id 
                last_modified_on: isodate, //date current date time
            }

            // 2) create agent sql query
            const objResult = await sqlQuery.createQuery(this.tableName4, param)

            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            // semd responce
            res.status(201).send({ message: 'Agent Type created successfully!' });

            // 3) delete the data from redisMQ
            redisMaster.delete('agentType')

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // get all agent type names 
    allType = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // console.log('Agent/allType',JSON.stringify(req.body), JSON.stringify(req.query))
            // 1) get agent from radis
            redisMaster.get('agentType', async(err, reply) => {

                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }

                // 2-A) check if radis is empty get data form the MySQL database and add to radis
                if (reply === null || reply === undefined) {

                    // 1) search parameter for MySQL data base
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    var searchKeyValue = {
                        active: 1,
                    }
                    var key = ["CAST(agent_type_uuid AS CHAR(16)) AS agent_type_uuid", "agent_type_name AS name"] // parameter to get from data base
                    var orderby = "agent_type_id"
                    var ordertype = "ASC"

                    // 2) sql query to get strAgent_type_uuid, strName
                    const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName4, searchKeyValue, key, orderby, ordertype)
                    if (!lisResults) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (lisResults.length === 0) {
                        return res.status(204).send({ message: 'No such agent type is avaliable !!' })
                    }

                    // 3) convert json data to string and add to radis
                    const strResponse = JSON.stringify(lisResults)
                    redisMaster.post('agentType', strResponse)

                    // filter agent type to get agent grater then the user
                    var finalResult = accessFilter.agnetTypeFilter(lisResults,req.body.user_detials.user_uuid,req.body.user_detials.type)

                    // 4) send response
                    return res.status(200).send(finalResult)
                }

                // 2-B) got the data from radis, convert to json data and send it to frontend
                var finalResult = await accessFilter.agnetTypeFilter(JSON.parse(reply),req.body.user_detials.user_uuid,req.body.user_detials.type)
                // console.log(finalResult)
                res.status(200).send(finalResult)

            })
        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getLowerAgentType = async (req, res) => {
        try{
            
            // verify body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('Agent/getLowerAgentType',JSON.stringify(req.body), JSON.stringify(req.query))
            // limit offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get agent tyep id
                const agentTypeid = await sqlQueryReplica.searchQuery(this.tableName2,{user_uuid : req.query.user_uuid,Active:1, user_status: 1},['usertype_id'],'userid','ASC',1,0)
                if(agentTypeid.length == 0) return res.status(400).json({ errors: [ {msg : 'user not found'}] });

            // search agent type list 
                const listAgentType = await sqlQueryReplica.searchQueryNoLimit(this.tableName4,{lower_agent_type_id : agentTypeid[0].usertype_id,active:1},['CAST(agent_type_uuid AS CHAR(16)) AS agenttype_uuid', 'agent_type_name AS name'], 'agent_type_id','ASC')
                if(listAgentType.length == 0) return res.status(204).send({ message : 'no user type found'})

                res.status(200).send(listAgentType)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //update function for agent type
    updateType = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/updateType',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // create parameter for MySQL query
            var param = {
                agent_type_name: req.body.name, //str agent type name
                last_modified_by: req.body.user_detials.id, //str user uuid
                last_modified_on: isodate //date current datetime
            }
            var searchKeyValue = {
                agent_type_uuid: req.body.agent_type_uuid, //str agent type uuid
                active: 1
            }

            // fire sql query to update agent type name
            const objResult = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            const { affectedRows, changedRows, info } = objResult;

            // send appropriate message to front end
            const message = !affectedRows ? 'agent type not found' :
                affectedRows && changedRows ? 'agent type updated successfully' : 'Details Updated';
            res.send({ message, info });

            // delete data from redis 
            redisMaster.delete('agentType')

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // delete function for agent type  to change the active date to 0
    deleteType = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/deleteType',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // create sql query paramerter
            const param = {
                last_modified_on: isodate, //date current date time
                last_modified_by: req.body.user_detials.id, //str user id
                active: 0
            }
            var searchKeyValue = {
                agent_type_uuid: req.query.agent_type_uuid, //str agent type uuid
                active: 1
            }

            //fire sql query
            const objResult = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            const { affectedRows, changedRows, info } = objResult;

            // generate appropriate result and send to frontend
            const message = !affectedRows ? 'agent type category not found' :
                affectedRows && changedRows ? 'agent type category delete successfully' : 'delete faild';
            res.send({ message, info });

            // delete data from redis
            redisMaster.delete('agentType')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //###############--Agent Number --#########################
    //function to Add Number to agent data
    addNumber = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let operator_uuid = '', operatorName = ''
            console.log('Agent/addNumber',JSON.stringify(req.body), JSON.stringify(req.query))
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
            let boolCheckMobileNumber = await sqlQuery.searchQuery(this.tableName1, { mobile: req.body.mobile, status : 1}, ['COUNT(1)'],'agent_contact_id','ASC',1,0)
            if(boolCheckMobileNumber[0]["COUNT(1)"] != 0) return res.status(400).json({ errors: [ {msg :'Mobile Number is already registered'}]})

            //get uer id
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str user uuid
                Active : 1,
            }

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }


            var key = ["userid","region_id"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }

            //get operator name
            var searchKeyValue = {
                operator_uuid: req.body.operator_uuid, //str operator uuid
                operator_name: req.body.operatorName,
                active: 1,
                SMPP : 1
            }
            var key = ["COUNT(1)"]
            var orderby = "operator_name"
            var ordertype = "ASC"

            // fire sql query to get operator name x
            const lisResponse2 = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse2) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse2[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg :"Operator Service not added"}] });
            }

            // checkl for primary number and 5 numbner are only allowed
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, // str user uuid
                status: 1
            }
            var key = ["mobile_type"]
            var orderby = "mobile"
            var ordertype = "ASC"
    
            // fire sql query to get str agent_contact_uuid, int mobile, str operatorName, str recieveNotification, bool status by user id
            const lisResponse0 = await sqlQuery.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)
            if(lisResponse0.length === 6) return res.status(400).json({ errors: [ {msg : 'Six mobile number allreday added'}] });
            let primaryNumberCheck = 0
            lisResponse0.forEach((numbers) => {
                if(numbers.mobile_type == 1) primaryNumberCheck = 1
            })
            if(primaryNumberCheck == 0) req.body.mobileType = 1
            if(lisResponse0.length > 0 && req.body.mobileType == 1){
                var responce = lisResponse0.map((lis) =>{
                    // console.log(lis)
                    if(lis.mobile_type == 1) return true
                    return false
                })
    
                if(responce.includes(true)) return res.status(400).json({ errors: [ {msg : 'Primary no allready added'}]})
                else{
                    // add primary number to login table of user
                    var searchKeyValue = {
                        user_uuid: req.body.user_uuid, // str user uuid
                        Active : 1,
                    }
                    var param = {
                        mobile : req.body.mobile,
                    }
                    var objResponce = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue)
                }
            }
            // console.log(lisResponse0)
            if(req.body.mobileType == 1 || lisResponse0.length == 0){
                var searchKeyValue = {
                    user_uuid: req.body.user_uuid, // str user uuid
                    Active : 1,
                }
                var param = {
                    mobile : req.body.mobile,
                }
                var objResponce = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue)
            }

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query
            var param = {
                agent_contact_uuid: "uuid()",
                userid: lisResponse1[0].userid, //str user id
                user_uuid: req.body.user_uuid, //str user uuid
                mobile: req.body.mobile, //int mobile number
                operator_uuid: req.body.operator_uuid, //str operator uuid
                operator_name: req.body.operatorName, //str operator name
                mobile_type: req.body.mobileType, //str operator type
                recieve_notification: req.body.recieveNotification, //bool recieve notification
                udpated_by_type : ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                updated_by : ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
                updated_on : isodate, //dt current date time
                region_id : lisResponse1[0].region_id,
            }

            // fire sql query to create the name of the category
            const objResult = await sqlQuery.createQuery(this.tableName1, param);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            var searchKeyValue = {
                user_uuid: req.body.user_uuid, // str user uuid
                mobile: req.body.mobile
            }
            var key = ["CAST(agent_contact_uuid AS CHAR(16)) AS agent_contact_uuid","CAST(operator_uuid AS CHAR(16)) AS operator_uuid", "mobile", "operator_name AS operatorName", "mobile_type AS mobileType", "recieve_notification AS recieveNotification"]
            var orderby = "mobile"
            var ordertype = "ASC"

            // fire sql query to get str agent_contact_uuid, int mobile, str operatorName, str recieveNotification, bool status by user id
            const lisResult = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 6, 0)

            // check if the result is there and responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'No contact found' })
            }
            res.status(200).send(lisResult[0])

            // res.status(201).send({ message: 'number added successfully' });

            if(req.body.mobileType == 1){ // send redistration sms
                var key = ['userid',"password,username,mobile,encryption_key",'full_name',"m_pin","mpin_status"]
                var orderby = "mobile"
                var ordertype = "ASC"

                const lisResponce = await sqlQuery.searchQuery(this.tableName2,{user_uuid: req.body.user_uuid},key, orderby, ordertype, 1, 0)

                const strDecriptedPassword = varEncryptionString.decryptString(lisResponce[0].encryption_key,lisResponce[0].password)
                const strDecriptedMpin = varEncryptionString.decryptString(lisResponce[0].encryption_key,lisResponce[0].m_pin)

                let smsDetails = {
                    agentId : lisResponce[0].userid,
                    recieverMessage : lisResponce[0].mpin_status == 1 ? `Dear ${lisResponce[0].full_name }, Welcome to AfghanPay top-up service, your User ID ${lisResponce[0].username }, Password ${strDecriptedPassword}, M-Pin: ${strDecriptedMpin}, thank you for being AfghanPay Agent!` : `Dear ${lisResponce[0].full_name }, Welcome to AfghanPay top-up service, your User ID ${lisResponce[0].username }, Password ${strDecriptedPassword}, thank you for being AfghanPay Agent!`
                }
                let smsFunResponce = await smsFunction.agentSms(smsDetails)
                if(smsFunResponce.error){
                    console.log(smsFunResponce.error)
                }
            }

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] }); 
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

        //function to Add Number to agent data
    checkContactNumber = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let operator_uuid = '', operatorName = ''
            console.log('Agent/addNumber',JSON.stringify(req.body), JSON.stringify(req.query))
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
            let boolCheckMobileNumber = await sqlQuery.searchQuery(this.tableName1, { mobile: req.body.mobile, status : 1}, ['COUNT(1)'],'agent_contact_id','ASC',1,0)
            if(boolCheckMobileNumber[0]["COUNT(1)"] != 0){

                return res.status(400).json({ errors: [ {msg :'Mobile Number is already registered'}]})
            }
            else{
                return res.status(200).send({ message: 'Mobile number is available' });
            }            
        
        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] }); 
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //add auto generated number
    addAutoGenNumber = async(req, res)=>{
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/addAutoGenNumber',JSON.stringify(req.body), JSON.stringify(req.query))
            //get uer id
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str user uuid
                Active : 1, 
            }

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            var key = ["userid","region_id"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }

            // checkl for primary number and 5 numbner are only allowed
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, // str user uuid
            }
            var key = ["mobile_type"]
            var orderby = "mobile"
            var ordertype = "ASC"
    
            // fire sql query to get str agent_contact_uuid, int mobile, str operatorName, str recieveNotification, bool status by user id
            const lisResponse0 = await sqlQuery.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)
            
            // console.log(lisResponse0)
            // if(lisResponse0.length == 0) return res.status(200).send({message:'add one primary number first'});
            if(lisResponse0.length >= 6) return res.status(400).json({ errors: [ {msg : 'Six mobile number allreday added'}] });
            
            const intRandomNumber = await this.makeRandomNumber(11,this.tableName1)

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query
            var param = {
                agent_contact_uuid: "uuid()",
                userid: lisResponse1[0].userid, //str user id
                user_uuid: req.body.user_uuid, //str user uuid
                mobile: intRandomNumber, //int mobile number
                operator_uuid: '0', //str operator uuid
                operator_name: '0', //str operator name
                mobile_type: 0, //str operator type
                recieve_notification: 0, //bool recieve notification
                status : 1,
                randomMobile : 1,
                udpated_by_type : ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                updated_by : ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
                updated_on : isodate, //dt current date time
                region_id : lisResponse1[0].region_id,
            }

            // fire sql query to create the name of the category
            const objResult = await sqlQuery.createQuery(this.tableName1, param);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            var searchKeyValue = {
                user_uuid: req.body.user_uuid, // str user uuid
                mobile: intRandomNumber
            }
            var key = ["CAST(agent_contact_uuid AS CHAR(16)) AS agent_contact_uuid","CAST(operator_uuid AS CHAR(16)) AS operator_uuid", "mobile", "operator_name AS operatorName", "mobile_type AS mobileType", "recieve_notification AS recieveNotification"]
            var orderby = "mobile"
            var ordertype = "ASC"

            // fire sql query to get str agent_contact_uuid, int mobile, str operatorName, str recieveNotification, bool status by user id
            let lisResult = await sqlQuery.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 6, 0)

            // check if the result is there and responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'No contact found' })
            }
            lisResult[0].operatorName = lisResult[0].operatorName == 0 ? 'Random Number' : lisResult[0].operatorName
            res.status(200).send(lisResult[0])

            // res.status(201).send({ message: 'number added successfully' });

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] }); 
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get the contact details
    getContactDetails = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('Agent/agentContactDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            //variable for sql query to get contact details
            // var offset = req.query.start
            // var limit = req.query.end - offset

            var searchKeyValue = {
                user_uuid: req.query.user_uuid, // str user uuid
                status : 1
            }

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }


            var key = ["CAST(agent_contact_uuid AS CHAR(16)) AS agent_contact_uuid","CAST(operator_uuid AS CHAR(16)) AS operator_uuid", "mobile", "operator_name AS operatorName", "mobile_type AS mobileType", "recieve_notification AS recieveNotification"]
            var orderby = "mobile"
            var ordertype = "ASC"

            // fire sql query to get str agent_contact_uuid, int mobile, str operatorName, str recieveNotification, bool status by user id
            const lisResult = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 7, 0)

            // check if the result is there and responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'No contact found' })
            }
            res.status(200).send(lisResult)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateContactDetails = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/updateContactDetails',JSON.stringify(req.body), JSON.stringify(req.query))
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

            if(operator_uuid != req.body.operator_uuid && operatorName != req.body.operatorName){
                return res.status(400).json({ errors: [ {msg : "Mobile number does not match with selected operator"}] });
            }

            // check if mobile number exists and
            // check if mobile number already registered with some user
            let boolCheckMobileNumber = await sqlQuery.searchQuery(this.tableName1, { mobile: req.body.mobile, status : 1}, ['CAST(agent_contact_uuid AS CHAR(16)) AS agent_contact_uuid','CAST(user_uuid AS CHAR(16)) AS user_uuid'],'agent_contact_id','ASC',1,0)
            if( boolCheckMobileNumber.length != 0 && ( boolCheckMobileNumber[0].agent_contact_uuid != req.body.agent_contact_uuid || boolCheckMobileNumber[0].user_uuid != req.body.user_uuid)){
                return res.status(400).json({ errors: [ {msg :'Mobile Number is already registered'}]}) 
            } 


            //variables for sql query to update contact
            var param = {
                randomMobile : 0,
            }

            //optional variable to be added in param
            if (req.body.mobile !== undefined) {
                param.mobile = req.body.mobile // int mobile number
            }
            if (req.body.operator_uuid) {
                //verifiy operator
                var searchKeyValue = {
                    operator_uuid: req.body.operator_uuid, // str operator uuid
                    operator_name: req.body.operatorName,
                    active: 1,
                    SMPP : 1
                }
                var key = ["COUNT(1)"]
                var orderby = "operator_name"
                var ordertype = "ASC"

                // fire sql query to get str operator name 
                const lisResponse2 = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 1, 0)

                // check if the result is there and responce accordingly
                if (!lisResponse2) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (!lisResponse2[0]["COUNT(1)"]) {
                    return res.status(400).json({ errors: [ {msg : "Operator Service not added" }] });
                }
                param.operator_name = req.body.operatorName //str operator name
                param.operator_uuid = req.body.operator_uuid //str operator uuid
            }
            if (req.body.mobileType !== undefined) {
                param.mobile_type = req.body.mobileType //bool operator type
            }
            if (req.body.recieveNotification !== undefined) {
                param.recieve_notification = req.body.recieveNotification //bool receive notification
            }

            var searchKeyValue1 = {
                user_uuid : req.body.user_uuid,
                mobile_type : 1,
                status : 1,
            }

            if(req.body.mobileType == 1) {
                //get agent primary number and make them alternate
                    
                    var param1 = {
                        mobile_type : 0
                    }
                    const listAgentPrimaryNumber = await sqlQuery.updateQuery(this.tableName1, param1, searchKeyValue1)             
            }else{
                // check if primary number added or not
                let boolCheckPrimaryNumber = await sqlQuery.searchQuery(this.tableName1, searchKeyValue1, ['agent_contact_uuid'],'agent_contact_id','ASC',1,0)
                if(boolCheckPrimaryNumber.length == 0) return res.status(400).json({ errors: [ {msg : 'Add primary number first' }] });
                if(boolCheckPrimaryNumber[0].agent_contact_uuid == req.body.agent_contact_uuid) return res.status(400).json({ errors: [ {msg : 'Not allowed to update primary number as alternate, add primary number first' }] });
            }

            //check if param is empty 
            if (Object.keys(param).length == 1) {
                return res.status(400).json({ errors: [ {msg : 'Noting to be updated' }] });
            }

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            param.udpated_by_type = ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
            param.updated_by = ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
            param.updated_on = isodate

            //variable for sqlQuery to updating the contact
            var searchKeyValue = {
                agent_contact_uuid: req.body.agent_contact_uuid, //str operator uuid
                user_uuid : req.body.user_uuid,
                status : 1,
            }

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }


            // fire sql query to update contact
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'contact not found' :
                affectedRows && changedRows ? 'Contact updated successfully' : 'Details Updated';

            if(affectedRows && changedRows && req.body.mobileType == 1){
                // add primary number to login table of user
                var searchKeyValue = {
                    user_uuid: req.body.user_uuid, // str user uuid
                    Active : 1
                }
                var param1 = {
                    mobile : req.body.mobile,
                }
                var objResponce = await sqlQuery.updateQuery(this.tableName2, param1, searchKeyValue)
            }

            // send responce to front end
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // delete alternate number
    deleteAlternateNumber = async(req,res)=>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/deleteAlternateNumber',JSON.stringify(req.body), JSON.stringify(req.query))

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let searchKeyValue = {
                agent_contact_uuid: req.query.agent_contact_uuid, //str operator uuid
                user_uuid : req.query.user_uuid,
                status : 1,
            }

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            let searchResult = await sqlQuery.searchQuery(this.tableName1,searchKeyValue,['userid','user_uuid','mobile_type','region_id'],'agent_contact_id','ASC',1,0)
            if(searchResult.length == 0) return res.status(400).json({ errors: [ {msg : 'contact number not found'}] });
            if(searchResult[0]['mobile_type'] == 1) {
                let {alternate,random} = await agentModule.getAllContacts(req.query.user_uuid)
                let newNumber = ''

                if(alternate.length > 0){
                    newNumber = alternate[0].mobile

                    // update alternate to primary
                    let param = { 
                        mobile_type : 1,
                    }
                    param.udpated_by_type = ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                    param.updated_by = ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
                    param.updated_on = isodate
                    let updateResponce = await sqlQuery.updateQuery(this.tableName1,param,{
                        agent_contact_id: alternate[0].agent_contact_id, //str operator uuid
                        user_uuid : req.query.user_uuid,
                        status : 1
                    })
                }else{
                    newNumber = ''
                    if(random.length > 0){
                        // pass
                    }else{
                        let zeroNumber = {
                            agent_contact_uuid: "uuid()",
                            userid: searchResult[0].userid, //str user id
                            user_uuid: searchResult[0].user_uuid, //str user uuid
                            mobile: '0000000000', //int mobile number
                            operator_uuid: '0', //str operator uuid
                            operator_name: '0', //str operator name
                            mobile_type: 0, //str operator type
                            recieve_notification: 0, //bool recieve notification
                            status : 1,
                            randomMobile : 1,
                            udpated_by_type : ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                            updated_by : ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
                            updated_on : isodate, //dt current date time
                            region_id : searchResult[0].region_id,
                        }
                        const objResult = await sqlQuery.createQuery(this.tableName1, zeroNumber);
                    }
                }

                var searchKeyValueParam = {
                    user_uuid: req.query.user_uuid, // str user uuid
                    Active : 1,
                }
                var updateParam = {
                    mobile : newNumber,
                }
                var objResponce = await sqlQuery.updateQuery(this.tableName2, updateParam, searchKeyValueParam)
            } // return res.status(400).json({ errors: [ {msg : `Can't delete primary number`}] });

            let param = { 
                status : 0,
            }
            param.udpated_by_type = ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
            param.updated_by = ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
            param.updated_on = isodate

            let updateResponce = await sqlQuery.updateQuery(this.tableName1,param,searchKeyValue)

            const { affectedRows, changedRows, info } = updateResponce;
            const message = !affectedRows ? 'contact not found' :
                affectedRows && changedRows ? 'Contact deleted successfully' : 'contact allready deleted';

            // send responce to front end
            res.send({ message, info });

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //########################### agent--operator-channel ##########################

    //function to create operator channel
    createOperatorAccess = async(req, res, next) => {
        try {
            // const errors = validationResult(req);
            // if (!errors.isEmpty()) {
            //     return res.status(400).json({ errors: errors.array() });
            // }

            // // check if use is admin
            // if (req.body.user_detials.type === 'Admin' && req.body.user_uuid === undefined) {
            //     req.body.user_uuid = "5ad59565-cd7c-11"
            // }

            // //check if user uuid is defined or not
            // if (req.body.user_uuid === undefined) {
            //     res.status(400).send({ message: 'invaild search Key ' })
            // }

            // //check user id
            // //variable for sql query to check the user id
            // var searchKeyValue = {
            //     user_uuid: req.body.user_uuid, //str user uuid
            //     Active : 1
            // }
            // var key = ["userid"]
            // var orderby = "userid"
            // var ordertype = "ASC"

            // // fire sql query to get/check str user id
            // const lisResponse1 = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // // check if the result is there and responce accordingly
            // if (!lisResponse1) {
            //     throw new HttpException(500, 'Something went wrong');
            // }
            // if (lisResponse1.length === 0) {
            //     return res.status(400).send({ message: 'No such user found' })
            // }

            // //check if operator is allready created or not  
            // var searchKeyValue = {
            //     user_uuid: req.body.user_uuid,
            //     operator_uuid: req.body.operator_uuid
            // }
            // var key = ["COUNT(1)"]
            // var orderby = "operator_name"
            // var ordertype = "ASC"

            // // fire search query to get all operator details str agent_oa_uuid, str name, bool status
            // const lisResult = await sqlQuery.searchQuery(this.tableName5, searchKeyValue, key, orderby, ordertype, 100, 0)

            // // check if the result is there and responce accordingly
            // if (!lisResult) {
            //     throw new HttpException(500, 'Something went wrong');
            // }
            // if (lisResult[0]["COUNT(1)"]) {
            //     //variables for sql query to update operator
            //     var param = {
            //         status: req.body.status //bool status
            //     }
            //     var searchKeyValue = {
            //         user_uuid: req.body.user_uuid,
            //         operator_uuid: req.body.operator_uuid //str agent oa uuid
            //     }

            //     // fire sql query to update operator status
            //     const objResult = await sqlQuery.updateQuery(this.tableName5, param, searchKeyValue);

            //     // check if the result is there and responce accordingly
            //     if (!objResult) {
            //         throw new HttpException(500, 'Something went wrong');
            //     }
            //     const { affectedRows, changedRows, info } = objResult;
            //     const message = !affectedRows ? 'Operator access not found' :
            //         affectedRows && changedRows ? 'Operator access updated successfully' : 'Details Updated';

            //     // send responce to front end
            //     return res.send({ message, info });
            // }

            // //create operator channel
            // // varibles for sql query
            // var param = {
            //     agent_oa_uuid: "uuid()",
            //     userid: lisResponse1[0].userid, //str userid
            //     user_uuid: req.body.user_uuid, //str user uuid
            //     operator_uuid: req.body.operator_uuid, //str operator uuid
            //     operator_name: req.body.operatorName, //str operator name
            //     status: req.body.status //bool status
            // }

            // // fire sql query to create operator access
            // const objResult = await sqlQuery.createQuery(this.tableName5, param)

            // // check if the result is there and responce accordingly
            // if (!objResult) {
            //     throw new HttpException(500, 'Something went wrong');
            // }

            // // send responce to the frontends
            // res.status(201).send({ message: 'operated access created successfully !!' });

            res.status(400).json({ errors: [ {msg : "Function in in active" }] });

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get all operator by user id
    getOperatorById = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('Agent/getOperatorById',JSON.stringify(req.body), JSON.stringify(req.query))
            // get user id
            var searchKeyValue = {
                user_uuid: req.query.user_uuid,
                Active : 1
            }
            var key = ["userid","oper1_status","oper2_status","oper3_status","oper4_status","oper5_status"]
            var orderby = "userid"
            var ordertype = "ASC"

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            // fire sql query to get  str user_uuid, bool mpin_status
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (lisResponce1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }

            // 1) get all operators
            const lisOperatorIds = await commonQueryCommon.getAllOperatorWithId()
            if(lisOperatorIds.length === 0) return res.status(400).json({ errors: [ {msg : 'Operator ids not found'}]})

            // 2) eterate over all operator and map status with operator
            let lisResult = lisOperatorIds.map((operator)=>{
                return {
                    "agent_oa_uuid" : operator.operatorUuid,
                    "operator_uuid" : operator.operatorUuid,
                    "name" : operator.operator_name,
                    "status" : lisResponce1[0]['oper'+operator.operator_id+"_status"]
                }
            })

            res.status(200).send(lisResult)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update operator id satatus
    updateOperatorStatus = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/updateOperatorStatus',JSON.stringify(req.body), JSON.stringify(req.query))
            // get operator id by operator uuid
            let operatorId = await commonQueryCommon.getOperatorById(req.body.agent_oa_uuid)
            if(operatorId == 0) return res.status(400).json({ errors: [ {msg : "operator Id incorrect" }] });

            //variables for sql query to update operator
            var param = {}
            param['oper'+operatorId[0].operator_id+"_status"] = req.body.status //bool status

            var searchKeyValue = {
                user_uuid : req.body.user_uuid, //str
            }

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            // fire sql query to update operator status
            const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Operator access not found' :
                affectedRows && changedRows ? 'Operator access updated successfully' : 'Updated status is same as previous status';

            const status = !affectedRows ? 400 :
                affectedRows && changedRows ? 200 : 200;

            redisMaster.delete(`AGENT_OPERATOR_${req.body.user_uuid}`)

            // send responce to front end
            res.status(status).send({ message, info });

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //############################--stock-transfer-channel--################################
    //function to create stock transfer channel
    createStockTransfer = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/createStockTransfer',JSON.stringify(req.body), JSON.stringify(req.query))
            // check if use is admin
            if (req.body.user_detials.type === 'Admin' && req.query.user_uuid === undefined) {
                req.query.user_uuid = "5ad59565-cd7c-11"
            }

            //check if user uuid is defined or not
            if (req.query.user_uuid === undefined) {
                res.status(400).send({ message: 'invaild search Key ' })
            }

            //check user id
            //variable for sql query to check the user id
            var searchKeyValue = {
                user_uuid: req.body.user_uuid, //str user uuid
                Active : 1,
            }
            
            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            var key = ["userid"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get/check user id
            const lisResponse1 = await sqlQuery.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length === 0) {
                return res.status(400).send({ message: 'No such user found' })
            }

            //function to create multiple channel (Web, Mobile, USSD, SMS)
            async function createStock(userid, user_uuid, channel, status, threshold, tablename) {
                //serach stock transfer channel
                //variable for sql query to get stock transfer by user id
                var searchKeyValue = {
                    user_uuid: user_uuid,
                    channel: channel,
                }
                var key = ["COUNT(1)"]
                var orderby = "channel"
                var ordertype = "ASC"

                // fire sql query to get str agent_ostc_uuid, str channel, bool status, double threshold by user id
                const lisResult = await sqlQuery.searchQueryNoLimit(tablename, searchKeyValue, key, orderby, ordertype)

                // check if the result is there and responce accordingly
                if (!lisResult) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (lisResult[0]["COUNT(1)"]) { // stock found update it
                    var param = {
                        status: status,
                        threshold: threshold
                    }

                    var searchKeyValue = {
                        user_uuid: user_uuid,
                        channel: channel,
                    }

                    // fire sql query to update channel
                    const objResult = await sqlQuery.updateQuery(tablename, param, searchKeyValue)

                    // check if the result is there and responce accordingly
                    if (!objResult) {
                        await sqlQuery.specialCMD("rollback")
                        throw new HttpException(500, 'Something went wrong');
                    }
                    return "updated successfully"
                }
                // varibles for sql query to create channel
                var param = {
                    agent_ostc_uuid: "uuid()",
                    userid: userid, //str userid 
                    user_uuid: user_uuid, //str user uuid
                    channel: channel, //str channel
                    status: status, //bool status
                    threshold: threshold //double threshold
                }

                // fire sql query to create channel
                const objResult = await sqlQuery.createQuery(tablename, param)

                // check if the result is there and responce accordingly
                if (!objResult) {
                    await sqlQuery.specialCMD("rollback")
                    throw new HttpException(500, 'Something went wrong');
                }
                return "created successfully"
            }

            // create a transaction 
            const objResponse = await sqlQuery.specialCMD("transaction")
            if (!objResponse) {
                await sqlQuery.specialCMD("rollback")
                throw new HttpException(500, 'Something went wrong');
            }

            // add the data using the Channels function created
            var strRe1 = await createStock(lisResponse1[0].userid, req.body.user_uuid, "Web", req.body.webStatus, req.body.webThreshold, this.tableName6)
            var strRe2 = await createStock(lisResponse1[0].userid, req.body.user_uuid, "Mobile", req.body.mobileStatus, req.body.MobileThreshold, this.tableName6)
            var strRe3 = await createStock(lisResponse1[0].userid, req.body.user_uuid, "USSD", req.body.ussdStatus, req.body.ussdThreshold, this.tableName6)
            var strRe4 = await createStock(lisResponse1[0].userid, req.body.user_uuid, "sms", req.body.smsStatus, req.body.smsThreshold, this.tableName6)
            var strRe4 = await createStock(lisResponse1[0].userid, req.body.user_uuid, "Company", req.body.CompanyStatus, req.body.CompanyThreshold, this.tableName6)

            //commit the transaction
            const objResponse2 = await sqlQuery.specialCMD("commit")
            if (!objResponse2) {
                await sqlQuery.specialCMD("rollback")
                throw new HttpException(500, 'Something went wrong');
            }

            // send responce to the frontend
            res.status(201).send({ message1: strRe1, message2: strRe2, message3: strRe3, message4: strRe4 });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get stock transfer by user id
    getStockTransferById = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('Agent/getStockTransferById',JSON.stringify(req.body), JSON.stringify(req.query))
            //get user id
            var searchKeyValue = {
                user_uuid: req.query.user_uuid,
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

            var key = ["userid"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get  str user_uuid, bool mpin_status
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check sql rsponce
            if (lisResponce1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'user not found'}] });
            }

            let lisStockTransferChannel = ['Mobile','SMS','USSD','Web', "Company"]

            //variable for sql query to get stock transfer by user id
            var searchKeyValue = {
                user_uuid: req.query.user_uuid,
            }
            var key = ["CAST(agent_ostc_uuid AS CHAR(16)) AS agent_ostc_uuid", "channel", "status", "threshold"]
            var orderby = "channel"
            var ordertype = "ASC"

            // fire sql query to get str agent_ostc_uuid, str channel, bool status, double threshold by user id
            const lisResult = await sqlQuery.searchQueryNoLimit(this.tableName6, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            // check if channel are created or not
            if (lisResult.length != lisStockTransferChannel.length) {
                let intPoint = 0
                for (let i =0; i < lisStockTransferChannel.length;i++){
                    //channel found
                    if(lisResult[intPoint] != undefined && lisResult[intPoint].channel == lisStockTransferChannel[i]){
                        intPoint += 1
                        continue
                    }
                    //create channel as not found
                    var param = {
                        agent_ostc_uuid: "uuid()",
                        userid: lisResponce1[0].userid, //str userid 
                        user_uuid: req.query.user_uuid, //str user uuid
                        channel: lisStockTransferChannel[i], //str channel
                        status: 1, //bool status
                        threshold: 0 //double threshold
                    }
    
                    // fire sql query to create channel
                    const objResult = await sqlQuery.createQuery(this.tableName6, param)
                }

                var searchKeyValue = {
                    user_uuid: req.query.user_uuid,
                }
                var key = ["CAST(agent_ostc_uuid AS CHAR(16)) AS agent_ostc_uuid", "channel", "status", "threshold"]
                var orderby = "channel"
                var ordertype = "ASC"
    
                // fire sql query to get str agent_ostc_uuid, str channel, bool status, double threshold by user id
                const lisResult1 = await sqlQuery.searchQueryNoLimit(this.tableName6, searchKeyValue, key, orderby, ordertype)
                
                return res.status(200).send(lisResult1)
            }
            res.status(200).send(lisResult)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //fucntion to update the stock transfer channel
    updateStransferChannel = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/updateStockTransferChannel',JSON.stringify(req.body), JSON.stringify(req.query))
            var searchKeyValue = {
                user_uuid : req.body.user_uuid
            }

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            let countUserId = await sqlQueryReplica.searchQuery(this.tableName2,searchKeyValue,['COUNT(1)'],'userid','ASC',1,0)
            if(countUserId[0]["COUNT(1)"] == 0) return res.status(400).json({ errors: [ {msg : "Incorrct user uuid" }]});

            //variables for sql query to update operator
            var param = {
                status: req.body.status, //bool status
                threshold: req.body.threshold
            }
            var searchKeyValue = {
                agent_ostc_uuid: req.body.agent_ostc_uuid, //str agent oa uuid
                user_uuid : req.body.user_uuid
            }

            // fire sql query to update operator status
            const objResult = await sqlQuery.updateQuery(this.tableName6, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Stock transfer not found' :
                affectedRows && changedRows ? 'Stock transfer updated successfully' : 'Details Updated';

                redisMaster.delete(`AGENT_CHANNEL_${req.body.user_uuid}`)

            // send responce to front end
            res.send({ message, info });            

        } catch (error) {
            console.log(error);
            let message = error.message
            let key = message.split("'")
            if(message.includes('Duplicate entry ')) return res.status(400).json({ errors: [ {msg : key [1]+ " allready registered" }] });
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getAgentByAgentType = async(req, res) =>{
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('Agent/getAgentByAgentType',JSON.stringify(req.body), JSON.stringify(req.query))
            const lisResponce = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid)
                if (!lisResponce) return res.status(400).json({ errors: [ {msg : 'User type not found'}] });

            // variable for sql query
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                usertype_id : lisResponce[0].agent_type_id,
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


            var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid","username","full_name"]
            var orderby = "full_name"
            var ordertype = "ASC"

            const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName2,searchKeyValue, key, orderby, ordertype)

            // check sql rsponce
            if (!lisResults) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResults.length === 0) {
                return res.status(204).send({ message: 'User not found' })
            }

            //send responce to front end
            return res.status(200).send(lisResults)

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    verifySecurityPin = async ( req,res ) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/verifySecurityPin',JSON.stringify(req.body), JSON.stringify(req.query))
            if(req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin){
                // for admin and sub admin user
                var searchKeyValue = {
                    username : req.body.user_detials.username
                };
    
                var key =["tpin","encryption_key"]
                var orderby = "username"
                var ordertype = "ASC"
    
                const lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName7,searchKeyValue,key, orderby, ordertype)
                if(!lisResponce1.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
                if(!lisResponce1[0].tpin) return res.status(200).send({ message: 'Pin not set'})
    
                const strTpin =  lisResponce1[0].tpin
                const strEncryptionKey = lisResponce1[0].encryption_key
    
                var strDecriptPin = varEncryptionString.decryptString(strEncryptionKey, strTpin);
                console.log("SecurityPin",strDecriptPin)
    
                if(req.body.pin != strDecriptPin) return res.status(400).json({ errors: [ {msg : 'Entered pin is incorrest'}]})
            
            }else{
                // for agent
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    Active : 1
                }
                var key = ["m_pin",'encryption_key']
                var orderby = "userid"
                var ordertype = "ASC"
                const lisresponce2 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)
                if(lisresponce2.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
                
                var decriptedPin = varEncryptionString.decryptString(lisresponce2[0].encryption_key, lisresponce2[0].m_pin)
                
                if(req.body.pin != decriptedPin) return res.status(400).json({ errors: [ {msg : 'Entered pin is incorrest'}]})
            }
            
            var searchKeyValue = {
                user_uuid : req.body.user_uuid,
                Active : 1
            };

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            var key =["password","encryption_key"]
            var orderby = "username"
            var ordertype = "ASC"

            const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName2,searchKeyValue,key, orderby, ordertype)
            if(!lisResult.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})

            var strDecriptPassword = varEncryptionString.decryptString(lisResult[0].encryption_key, lisResult[0].password);
            
            // console.log(lisResult[0].encryption_key, lisResult[0].password)
            res.status(200).send({ password : strDecriptPassword})

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateAgentPassword = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('Agent/updateAgentPassword',JSON.stringify(req.body), JSON.stringify(req.query))
            if(req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin){
                // verify tpin of admin 
                var searchKeyValue = {
                    username : req.body.user_detials.username
                };

                var key =["tpin","encryption_key"]
                var orderby = "username"
                var ordertype = "ASC"

                const lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName7,searchKeyValue,key, orderby, ordertype)
                if(!lisResponce1.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
                if(!lisResponce1[0].tpin) return res.status(200).send({ message: 'Pin not set'})

                const strTpin =  lisResponce1[0].tpin
                const strEncryptionKey = lisResponce1[0].encryption_key

                var strDecriptPin = varEncryptionString.decryptString(strEncryptionKey, strTpin);
                console.log("the PIN ",strDecriptPin)
                //tpin dint match
                if(req.body.pin != strDecriptPin) return res.status(400).json({ errors: [ {msg : 'Entered pin is incorrest'}]})
            }else{
                // for agent
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    Active : 1
                }
                var key = ["m_pin",'encryption_key']
                var orderby = "userid"
                var ordertype = "ASC"
                const lisresponce2 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)
                if(lisresponce2.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
                
                var decriptedPin = varEncryptionString.decryptString(lisresponce2[0].encryption_key, lisresponce2[0].m_pin)
                
                if(req.body.pin != decriptedPin) return res.status(400).json({ errors: [ {msg : 'Entered pin is incorrest'}]})
            }

            //get encryptionKey of user
            var searchKeyValue = {
                user_uuid : req.body.user_uuid,
                Active : 1
            };

            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }

            var key =["encryption_key","password","m_pin","full_name","mobile","usertype_id",'username','userid','region_id']
            var orderby = "username"
            var ordertype = "ASC"

            const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName2,searchKeyValue,key, orderby, ordertype)
            if(!lisResult.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})

            // decript the password and pin
            var strDecriptedPassword = varEncryptionString.decryptString(lisResult[0].encryption_key,lisResult[0].password)
            var strDecriptedPin = varEncryptionString.decryptString(lisResult[0].encryption_key,lisResult[0].m_pin)

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
                const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

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
                    if(listAgentType[i].agent_type_id == lisResult[0].usertype_id) 
                    {
                        type = listAgentType[i].agent_type_name
                    }
                }

                // addlogin log using api call
                // api call variable
                var data = { 
                    userid : lisResult[0].userid,
                    username : lisResult[0].username,
                    full_name : lisResult[0].full_name,
                    mobile : lisResult[0].mobile,
                    user_uuid : req.body.user_uuid,
                    intCreatedByType : (req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, 
                    intUserType : lisResult[0].usertype_id,
                    userIpAddress : req.body.userIpAddress ? req.body.userIpAddress : 0, 
                    userMacAddress : req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                    userOsDetails : req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                    userImeiNumber : req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                    userGcmId : req.body.userGcmId ? req.body.userGcmId : 0, //str
                    userAppVersion : req.body.userAppVersion ? req.body.userAppVersion : null, //str
                    userApplicationType : req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                    description : type + ' change password',
                    userActivityType : 10,
                    oldValue : lisResult[0].password +","+ lisResult[0].encryption_key,
                    newValue : strNewIncriptedPassword+","+newEncryptionKey,
                    regionId : lisResult[0].region_id
                }

                // make api call
                const intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
                var strLog = intResult == 1 ? 'Agent change password log added successfully' : intResult == 2 ? 'Agent change password log error' : 'end point not found'
                    // console.log('Server Log : '+strLog)
            }   
            // send responce to fornt end
                res.send({ message, info });

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    verifyPinGetMpin = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('Agent/verifyPinGetMpin',JSON.stringify(req.body), JSON.stringify(req.query))
            // verify admin or subadmin pin
                var searchKeyValue = {
                    username : req.body.user_detials.username
                };
    
                var key =["tpin","encryption_key"]
                var orderby = "username"
                var ordertype = "ASC"
    
                const lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName7,searchKeyValue,key, orderby, ordertype)
                if(!lisResponce1.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
                if(!lisResponce1[0].tpin) return res.status(200).send({ message: 'Pin not set'})
    
                const strTpin =  lisResponce1[0].tpin
                const strEncryptionKey = lisResponce1[0].encryption_key
    
                var strDecriptPin = varEncryptionString.decryptString(strEncryptionKey, strTpin);
            
            // compair t-pin
                if(req.body.pin != strDecriptPin) return res.status(400).json({ errors: [ {msg : 'Entered pin is incorrest'}]})
            
            // search agent details
                var searchKeyValue = {
                    user_uuid : req.body.user_uuid,
                    // region_ids : req.body.user_detials.region_list.join(','),
                    Active : 1
                };

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                var key =["m_pin","encryption_key"]
                var orderby = "username"
                var ordertype = "ASC"

                const lisResult = await sqlQueryReplica.searchQuery(this.tableName2,searchKeyValue,key, orderby, ordertype, 1, 0)
                if(!lisResult.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
            // decript the m-pin of the agen
                var strDecriptPin = varEncryptionString.decryptString(lisResult[0].encryption_key, lisResult[0].m_pin);
                
                // console.log(lisResult[0].encryption_key, lisResult[0].password)
                res.status(200).send({ m_pin : strDecriptPin})

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateMpin = async (req, res) =>{
        try {
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('Agent/updateMpin',JSON.stringify(req.body), JSON.stringify(req.query))
            // verify tpin of admin 
                var searchKeyValue = {
                    username : req.body.user_detials.username
                };

                var key =["tpin","encryption_key"]
                var orderby = "username"
                var ordertype = "ASC"

                const lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName7,searchKeyValue,key, orderby, ordertype)
                if(!lisResponce1.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
                if(!lisResponce1[0].tpin) return res.status(200).send({ message: 'Pin not set'})

                const strTpin =  lisResponce1[0].tpin
                const strEncryptionKey = lisResponce1[0].encryption_key

                var strDecriptPin = varEncryptionString.decryptString(strEncryptionKey, strTpin);
            
            //tpin dint match
                if(req.body.pin != strDecriptPin) return res.status(400).json({ errors: [ {msg : 'Entered pin is incorrest'}]})

            //get encryptionKey of user
                var searchKeyValue = {
                    user_uuid : req.body.user_uuid,
                    // region_ids : req.body.user_detials.region_list.join(','),
                    Active : 1
                };

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                var key =["encryption_key","m_pin","full_name","mobile","usertype_id",'username','userid','region_id']
                var orderby = "username"
                var ordertype = "ASC"

                const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName2,searchKeyValue,key, orderby, ordertype)
                if(!lisResult.length) return res.status(400).json({ errors: [ {msg : 'user not found'}]})

            // decript pin
                var strDecriptedPin = varEncryptionString.decryptString(lisResult[0].encryption_key,lisResult[0].m_pin)
            
            // check new pin 
                if(strDecriptedPin == req.body.newPin) return res.status(400).json({ errors: [ {msg : 'Old pin and new pin are same'}]})
            
            // incript new pin
                var strNewIncriptedPin = varEncryptionString.encryptString(lisResult[0].encryption_key,req.body.newPin)

            // update the details in the data base
            var param = {
                m_pin : strNewIncriptedPin
            }

            // fire sql query to update agent details
                const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'user not found' :
                    affectedRows && changedRows ? 'User M-pin updated successfully' : 'Mpin change faild, values are same';

            // add login when the data updated successfully 
            if(affectedRows && changedRows) {
                // get all agent type name
                var listAgentType = await commonQueryCommon.getAllAgentType()
                // console.log(listAgentType)
                // console.log(lisResponce[0])
                var type = 'agent'
                for (var i=0; i<listAgentType.length; i++){
                    if(listAgentType[i].agent_type_id == lisResult[0].usertype_id) 
                    {
                        type = listAgentType[i].agent_type_name
                    }
                }

                // addlogin log using api call
                // api call variable
                var data = { 
                    userid : lisResult[0].userid,
                    username : lisResult[0].username,
                    full_name : lisResult[0].full_name,
                    mobile : lisResult[0].mobile,
                    user_uuid : req.body.user_uuid,
                    intCreatedByType : (req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, 
                    intUserType : lisResult[0].usertype_id,
                    userIpAddress : req.body.userIpAddress ? req.body.userIpAddress : 0, 
                    userMacAddress : req.body.userMacAddress ? req.body.userMacAddress : 0, //str
                    userOsDetails : req.body.userOsDetails ? req.body.userOsDetails : 0, //str
                    userImeiNumber : req.body.userImeiNumber ? req.body.userImeiNumber : 0, //str
                    userGcmId : req.body.userGcmId ? req.body.userGcmId : 0, //str
                    userAppVersion : req.body.userAppVersion ? req.body.userAppVersion : null, //str
                    userApplicationType : req.body.userApplicationType == "Web" ? 1 : req.body.userApplicationType == 'Mobile' ? 2 : 0,
                    description : type + ' Update Mpin',
                    userActivityType : 22,
                    oldValue : lisResult[0].m_pin +","+ lisResult[0].encryption_key,
                    newValue : strNewIncriptedPin+","+lisResult[0].encryption_key,
                    regionId : lisResult[0].region_id
                }

                // make api call
                const intResult = await httpRequestMakerCommon.httpPost("activity-log",data)
                var strLog = intResult == 1 ? 'Agent Update M-Pin log added successfully' : intResult == 2 ? 'Agent Update M-Pin log error' : 'end point not found'
                    // console.log('Server Log : '+strLog)
            }   
            // send responce to fornt end
                res.send({ message, info });

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // switch account function ##########################################
    // parent agent commission details
    getParentAgentDetail = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('Agent/getParentAgentDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            // search query paremeters
                var searchKeyValue = {
                    user_uuid : req.query.user_uuid,
                    // region_ids : req.body.user_detials.region_list.join(','),
                    Active : 1
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                var key = ['CAST(user_uuid AS CHAR(16)) AS agentUser_uuid','username AS agentUserid','mobile AS agentMobile','parent_id','full_name AS agentName','comm_type as agentCommission','usertype_id','CAST(region_uuid AS CHAR(16)) AS region_uuid','region_name']
                const userDetails = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(userDetails.length == 0) return res.status(400).json({ errors: [ {msg : "user not found"}] });

            // search parent details
                let parentId,parentName,parentMobile
                if(userDetails[0].parent_id == 1){
                    parentId = req.body.user_detials.username
                    parentName = req.body.user_detials.name
                    parentMobile = req.body.user_detials.mobile
                }else{ 
                    var searchKeyValue = {
                        userid : userDetails[0].parent_id,
                        Active : 1
                    }
                    var key = ['CAST(user_uuid AS CHAR(16)) AS parentUser_uuid','username AS parentUserid','mobile AS parentMobile','full_name AS parentName','comm_type as parentCommission']
                    const parentDetails = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                    if(parentDetails.length == 0) return res.status(400).json({ errors: [ {msg : "parent not found"}] });
                    parentId = parentDetails[0].parentUserid
                    parentName = parentDetails[0].parentName
                    parentMobile = parentDetails[0].parentMobile
                }

            // get aegnt type list
                const agetnTypeList = await commonQueryCommon.getAllAgentType()
                if(agetnTypeList == 0) return res.status(400).json({ errors: [ {msg : "agent type list not found"}] });

                var initialResponce = {
                    agentUser_uuid : userDetails[0].agentUser_uuid,
                    agentUserid : userDetails[0].agentUserid,
                    agentMobile : userDetails[0].agentMobile,
                    agentName : userDetails[0].agentName,
                    agentTypeName : agetnTypeList[Number(userDetails[0].usertype_id) - 1].agent_type_name,
                    agentType_uui : agetnTypeList[Number(userDetails[0].usertype_id) - 1].dagent_type_uuid,
                    agentRegion : userDetails[0].region_name,
                    agentRegion_uuid : userDetails[0].region_uuid,
                    parentUserid : parentId,
                    parentName : parentName,
                    parentMobile : parentMobile,
                }

            // check commission type and get details from respocetive tables
                if(userDetails[0].agentCommission == 1){ // 8 prepaid
                    var searchKeyValue = {
                        user_uuid : req.query.user_uuid
                    }
                    var key = ['commission_value']
                    const agentPrePaidPercent = await sqlQueryReplica.searchQuery(this.tableName8,searchKeyValue, key,'userid','ASC',1,0)
                    if(agentPrePaidPercent.length == 0) return res.status(400).json({ errors: [ {msg : "agent pre paid commission not found"}] });
                    initialResponce.agentCommissionType = 'Pre-Paid'
                    initialResponce.agentcommissionPercent = agentPrePaidPercent[0].commission_value
                    return res.status(200).send(initialResponce)
                }
                if(userDetails[0].agentCommission == 2){ //9 postpaid
                    var searchKeyValue = {
                        user_uuid : req.query.user_uuid
                    }
                    var key = ['CAST(slab_uuid AS CHAR(16)) AS slab_uuid','slab_name']
                    const agentPostPaidslab = await sqlQueryReplica.searchQuery(this.tableName9,searchKeyValue, key, 'userid','ASC',1,0)
                    if(agentPostPaidslab.length == 0) return res.status(400).json({ errors: [ {msg : "agent post paid commission not found"}] });
                    initialResponce.agentCommissionType = 'Post-Paid'
                    initialResponce.agentSlab_uuid = agentPostPaidslab[0].slab_uuid
                    initialResponce.agentslabName = agentPostPaidslab[0].slab_name
                    return res.status(200).send(initialResponce)
                }
                else return res.status(400).json({ errors: [ {msg : 'agent commission is neither prepaid or post paid'}] });
            
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // change parent name of 
    changeAgentPrePaidParent = async (req,res) =>{
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('Agent/changeAgentPrePaidParent',JSON.stringify(req.body), JSON.stringify(req.query))
            // start transaction 
                let transaction = await sqlQuery.specialCMD('transaction')

            // get agent details to check commission type
                var searchKeyValue = {
                    user_uuid : req.body.agentUser_uuid,
                    // region_ids : req.body.user_detials.region_list.join(','),
                    comm_type : 1,
                    Active : 1
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                var key = ['userid','username AS agentUserid','full_name','parent_id','comm_type','usertype_id',"CAST(region_uuid AS CHAR(16)) AS region_uuid",'region_id','child_id']
                const agentDetails = await sqlQuery.searchQueryTran(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(agentDetails.length == 0) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Agent not found"}] });
                }
                const agentid = agentDetails[0].userid
            
            // get parent details
                var searchKeyValue = {
                    user_uuid : req.body.parentUser_uuid,
                    // region_ids : req.body.user_detials.region_list.join(','),
                    comm_type : 1,
                    Active : 1
                }

                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }

                var key = ['userid','username AS agentUserid','full_name','comm_type','usertype_id',"CAST(region_uuid AS CHAR(16)) AS region_uuid",'mobile','child_id','parent_id']
                const parentDetails = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(parentDetails.length == 0) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Parent not found"}] });
                }

            // if admin then ok else compare commission type (need to be same to procede further)
                if (parentDetails[0].usertype_id > agentDetails[0].usertype_id){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Selected parent is low rank then agent"}] });
                } 
                // console.log(agentDetails[0].region_uuid,parentDetails[0].region_uuid);
                // if (agentDetails[0].region_uuid != parentDetails[0].region_uuid) { 
                //     let rollback = await sqlQuery.specialCMD('rollback')
                //     return res.status(400).json({ errors: [ {msg : "Selected parent is from different region and agent is from different region"}] });
                // }

                if(agentDetails[0].parent_id == parentDetails[0].userid){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Assigning same parent"}] }); 
                }
                
                if(agentDetails[0].userid == parentDetails[0].userid){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Selected parent id is incorrect"}] }); 
                }
            
            // get old parent details
                var searchKeyValue = {
                    userid : agentDetails[0].parent_id
                }
                var key = ['userid','username AS agentUserid','full_name','child_id','parent_id']
                const oldParentDetails = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(oldParentDetails.length == 0){
                    let rollback = await sqlQuery.specialCMD('rollback')
                     return res.status(400).json({ errors: [ {msg : "Parent not found"}] });
                }

            // get parent commmission value
                let parentCommission
                parentCommission = [{commission_value : 100}]
                if(req.body.parentUser_uuid != req.body.user_detials.user_uuid && (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                    var searchKeyValue = {
                        user_uuid : req.body.parentUser_uuid
                    }
                    var key = ['commission_value']
                    parentCommission = await sqlQuery.searchQuery(this.tableName8,searchKeyValue,key,'userid','ASC',1,0)
                    if(parentCommission.length == 0){
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : "Parent commission not found"}] });
                    } 
                }

            // get agen current commission value
                var searchKeyValue = {
                    user_uuid : req.body.agentUser_uuid
                }
                var key = ['commission_value']
                const agentCommission = await sqlQuery.searchQueryTran(this.tableName8,searchKeyValue,key,'userid','ASC',1,0)
                if(agentCommission.length == 0){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Agent commission not found"}] });
                } 
            
            // compare the commission 
            // console.log(req.body.commissionValue,parentCommission[0].commission_value)
                if ( Number(req.body.commissionValue) != '0' && Number(req.body.commissionValue) >= Number(parentCommission[0].commission_value))
                {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Given commission is more then parent commission"}] });
                }

            // update child list
                let agentChildList = agentDetails[0].child_id != '' ? agentDetails[0].child_id.split(',') : []
                let oldParentChildList = oldParentDetails[0].child_id != '' ? oldParentDetails[0].child_id.split(',') : []
                let newParentChildList = parentDetails[0].child_id != '' ? parentDetails[0].child_id.split(',') : []

                agentChildList.push(agentid)

                let responce = await this.removeChildfromList(agentChildList, oldParentChildList, oldParentDetails[0].userid ,oldParentDetails[0].parent_id)
                if( responce.error ) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Child list update error"}] });
                }

                responce = await this.addChildtoList(agentChildList, newParentChildList, parentDetails[0].userid, parentDetails[0].parent_id)
                if( responce.error ) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Child list update error"}] });
                }                

            // update parent id in er login table
                var searchKeyValue = {
                    user_uuid : req.body.agentUser_uuid,
                    Active : 1
                }
                var param = {
                    parent_id : parentDetails[0].userid
                }
                const ObjResult1 = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue)
                // console(ObjResult1)
                if(!ObjResult1.affectedRows){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "User not found to update details"}] });
                }
                
            // add data in the log table by api call
                var data = { 
                    "userid" : agentDetails[0].userid,
                    "agentUsername" : agentDetails[0].agentUserid,
                    "agentName" : agentDetails[0].full_name,
                    "agentType" : agentDetails[0].usertype_id,
                    "oldParentUsername" : oldParentDetails[0].agentUserid ,
                    "oldParentName" : oldParentDetails[0].full_name ,
                    "newParentUsername" : parentDetails[0].agentUserid,
                    "newParentName" : parentDetails[0].full_name,
                    "fullName" : req.body.user_detials.username,
                    "userName" : req.body.user_detials.name,
                    "regionId" : agentDetails[0].region_id,
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                let logData = [];
                logData.push({ 
                    userid : agentDetails[0].userid,
                    username : agentDetails[0].agentUserid,
                    user_uuid : req.body.agentUser_uuid,
                    full_name : agentDetails[0].full_name,
                    mobile : agentDetails[0].mobile ? agentDetails[0].mobile : 0,
                    created_on : isodate,
                    created_by_type : (req.body.user_detials.type === role.Admin || req.body.user_detials.type === role.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, // 1- Admin ,2- Member
                    user_type : agentDetails[0].usertype_id, // role
                    ip_address :req.body.userIpAddress ?  req.body.userIpAddress : 0,
                    mac_address : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                    os_details : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                    imei_no : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                    gcm_id : req.body.userGcmId ?  req.body.userGcmId : 0,  // to send notification
                    app_version : req.body.userAppVersion ?  req.body.userAppVersion : 0,  // our app version
                    source : req.body.userApplicationType ?  req.body.userApplicationType : 0,  // 1: web, 2 : app
                    description : "Switch Account Commission update", 
                    activity_type : 21, // 1-Login;2-Change Password;3-Change Profile
                    old_value : agentCommission[0].commission_value,
                    modified_value : req.body.commissionValue,
                    region_id : agentDetails[0].region_id
                });

                const apiResult = await httpRequestMakerCommon.httpPost("agent/switch-acc",data)
                var strLog = apiResult == 1 ? 'Activity log added successfully' : apiResult == 2 ? 'Activity login log error' : 'end point not found'
                            // console.log('Server Log : '+strLog)
                if(apiResult != 1){
                    // rollback
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                if (Number(req.body.commissionValue) >= Number(agentCommission[0].commission_value)) { 
                    
                    // update commission no need to change agent child commission
                    var searchKeyValue = {
                        user_uuid : req.body.agentUser_uuid
                    }
                    var param = { 
                        commission_value : Number(req.body.commissionValue),
                        parent_id : parentDetails[0].userid,
                        last_updated_by_type: (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? 1 : 2 ,
                        last_updated_by : (req.body.user_detials.type === role.Admin || req.body.user_detials.type === role.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                        last_updated_on : isodate
                    }
                    const ObjResult = await sqlQuery.updateQuery(this.tableName8, param, searchKeyValue)

                    const { affectedRows, changedRows, info } = ObjResult;
                    const message = !affectedRows ? 'user not found' :
                        affectedRows && changedRows ? 'Switch account successfully' : 'Switch account successfully';

                    const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:logData})
                    var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                        // console.log('Server Log : '+strLog)
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
                    var searchKeyValue = {
                        user_uuid : req.body.agentUser_uuid
                    }
                    var param = { 
                        commission_value : req.body.commissionValue,
                        parent_id : parentDetails[0].userid,
                        last_updated_by_type: (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? 1 : 2 ,
                        last_updated_by : (req.body.user_detials.type === role.Admin || req.body.user_detials.type === role.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid, //str user id
                        last_updated_on : isodate
                    }
                    const ObjResult = await sqlQuery.updateQuery(this.tableName8, param, searchKeyValue)

                    const { affectedRows, changedRows, info } = ObjResult;
                    const message = !affectedRows ? 'user not found' :
                        affectedRows && changedRows ? 'Switch account successfully' : 'Switch account successfully';

                    if(affectedRows){ 
                        let usertype = req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ? 1 : 2
                        let userid = (req.body.user_detials.type === role.Admin || req.body.user_detials.type === role.SubAdmin) ?  req.body.user_detials.id : req.body.user_detials.userid
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
                            // console.log('Server Log : '+strLog)
                        if(intResult != 1){
                            // rollback
                            let rollback = await sqlQuery.specialCMD('rollback')
                            return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                        }
                        let commit = await sqlQuery.specialCMD('commit')
                        return res.send({ message, info });
                        // return res.status(200).send({message:'parent update successfully'})
                    }else{ 
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : 'parent update failed'}] });
                    }

                }

        }catch(error){
            // rollback transaction for error
            let rollback = await sqlQuery.specialCMD('rollback')
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    changePostPaidParent = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('Agent/changePostPaidParent',JSON.stringify(req.body), JSON.stringify(req.query))
            // start transaction 
                let transaction = await sqlQuery.specialCMD('transaction')

            // get agent details to check commission type
                var searchKeyValue = {
                    user_uuid : req.body.agentUser_uuid,
                    comm_type : 2,
                    Active : 1
                }
                var key = ['userid','username AS agentUserid','full_name','parent_id','comm_type','usertype_id',"CAST(region_uuid AS CHAR(16)) AS region_uuid",'region_id','child_id']
                const agentDetails = await sqlQuery.searchQueryTran(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(agentDetails.length == 0){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Agent not found"}] });
                } 
                const agentid = agentDetails[0].userid
            
            // get agent balance details if 0 then ok
                let agentBalance = await sqlQuery.searchQuery(this.tableName11,{user_uuid : req.body.agentUser_uuid},['ex_wallet'],'wallet_id','ASC',1,0)
                if(agentBalance.length > 0 && agentBalance[0].ex_wallet != 0){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Agent balance is not 0, cant perform switch account"}] });
                } 

            // get parent details
                var searchKeyValue = {
                    user_uuid : req.body.parentUser_uuid,
                    comm_type : 2,
                    Active : 1
                }
                var key = ['userid','username AS agentUserid','full_name','comm_type','usertype_id',"CAST(region_uuid AS CHAR(16)) AS region_uuid","mobile",'child_id','parent_id']
                const parentDetails = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(parentDetails.length == 0){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Parent not found"}] });
                } 

            // if admin then ok else compare commission type (need to be same to procede further)
                if (parentDetails[0].usertype_id > agentDetails[0].usertype_id){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Selected parent is low rank then agent"}] });
                } 
                // console.log(agentDetails[0].region_uuid,parentDetails[0].region_uuid);
                // if (agentDetails[0].region_uuid != parentDetails[0].region_uuid) {
                //     let rollback = await sqlQuery.specialCMD('rollback')
                //     return res.status(400).json({ errors: [ {msg : "Selected parent is from different region and agent is from different region"}] });
                // }
                if(agentDetails[0].parent_id == parentDetails[0].userid){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Assigning same parent"}] });
                } 
            
            // get old parent details
                var searchKeyValue = {
                    userid : agentDetails[0].parent_id,
                    Active : 1
                }
                var key = ['userid','username AS agentUserid','full_name','child_id','parent_id']
                const oldParentDetails = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(oldParentDetails.length == 0) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Parent not found"}] });
                }

            // get slab details
                const assignedSlab = await sqlQuery.searchQuery(this.tableName10,{slab_uuid : req.body.slab_uuid,user_uuid:req.body.parentUser_uuid},['slab_name','wallet1_comm','wallet2_comm','wallet3_comm',"wallet4_comm","wallet5_comm"],'slab_id','ASC',1,0)
                if(assignedSlab.length == 0){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Parent lab not found"}] });
                } 

            // agentcurrent slab details 
                const currentSlab = await sqlQuery.searchQuery(this.tableName9,{user_uuid:req.body.agentUser_uuid},["slab_name","CAST(slab AS CHAR(16)) AS slab_uuid",'op1_comm','op2_comm','op3_comm','op4_comm','op5_comm'],'userid','ASC',1,0)
                if(currentSlab.length == 0) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "agent current slab not found"}] });
                }

                // update child list
                let agentChildList = agentDetails[0].child_id != '' ? agentDetails[0].child_id.split(',') : []
                let oldParentChildList =  oldParentDetails[0].child_id != '' ? oldParentDetails[0].child_id.split(',') : []
                let newParentChildList = parentDetails[0].child_id != '' ? parentDetails[0].child_id.split(',') : []

                agentChildList.push(agentid)

                let responce = await this.removeChildfromList(agentChildList, oldParentChildList, oldParentDetails[0].userid, oldParentDetails[0].parent_id)
                if( responce.error ) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Child list update error"}] });
                }
                
                responce = await this.addChildtoList(agentChildList, newParentChildList, parentDetails[0].userid, parentDetails[0].parent_id)
                if( responce.error ) {
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "Child list update error"}] });
                }

            // update parent id in er login table
                var searchKeyValue = {
                    user_uuid : req.body.agentUser_uuid,
                    Active : 1
                }
                var param = {
                    parent_id : parentDetails[0].userid
                }
                const ObjResult1 = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue)
                // console(ObjResult1)
                if(!ObjResult1.affectedRows){
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : "User not found to update details"}] });
                }
                
            // add data in the log table by api call
                var data = { 
                    "userid" : agentDetails[0].userid,
                    "agentUsername" : agentDetails[0].agentUserid,
                    "agentName" : agentDetails[0].full_name,
                    "agentType" : agentDetails[0].usertype_id,
                    "oldParentUsername" : oldParentDetails[0].agentUserid ,
                    "oldParentName" : oldParentDetails[0].full_name ,
                    "newParentUsername" : parentDetails[0].agentUserid,
                    "newParentName" : parentDetails[0].full_name,
                    "fullName" : req.body.user_detials.username,
                    "userName" : req.body.user_detials.name,
                    "regionId" : agentDetails[0].region_id
                }

                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                let logData = [];
                logData.push({ 
                    userid : agentDetails[0].userid,
                    username : agentDetails[0].agentUserid,
                    user_uuid : req.body.agentUser_uuid,
                    full_name : agentDetails[0].full_name,
                    mobile : agentDetails[0].mobile ? agentDetails[0].mobile : 0,
                    created_on : isodate,
                    created_by_type : (req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, // 1- Admin ,2- Member
                    user_type : agentDetails[0].usertype_id, // role
                    ip_address :req.body.userIpAddress ?  req.body.userIpAddress : 0,
                    mac_address : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                    os_details : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                    imei_no : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                    gcm_id : req.body.userGcmId ?  req.body.userGcmId : 0,  // to send notification
                    app_version : req.body.userAppVersion ?  req.body.userAppVersion : 0,  // our app version
                    source : req.body.userApplicationType ?  req.body.userApplicationType : 0,  // 1: web, 2 : app
                    description : "Switch Account slab update", 
                    activity_type : 18, // 1-Login;2-Change Password;3-Change Profile
                    old_value : currentSlab[0].slab_uuid+' , '+currentSlab[0].slab_name,
                    modified_value : req.body.slab_uuid+' , '+assignedSlab[0].slab_name,
                    region_id : agentDetails[0].region_id
                });

                const apiResult = await httpRequestMakerCommon.httpPost("agent/switch-acc",data)
                var strLog = apiResult == 1 ? 'Activity log added successfully' : apiResult == 2 ? 'Activity login log error' : 'end point not found'
                            // console.log('Server Log : '+strLog)
                if(apiResult != 1){
                    // rollback
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                }

            // compare slab 
            if(currentSlab[0].op1_comm > assignedSlab[0].wallet1_comm || currentSlab[0].op2_comm > assignedSlab[0].wallet2_comm || currentSlab[0].op3_comm > assignedSlab[0].wallet3_comm || currentSlab[0].op4_comm > assignedSlab[0].wallet4_comm || currentSlab[0].op5_comm > assignedSlab[0].wallet5_comm){
                // change commission slab value-> use slab uuid to find agent -> compare therit slab -> 

                var param = {
                    parent_id : parentDetails[0].userid,
                    slab_uuid : req.body.slab_uuid,
                    slab_name : assignedSlab[0].slab_name,
                    op1_comm : assignedSlab[0].wallet1_comm,
                    op2_comm : assignedSlab[0].wallet2_comm,
                    op3_comm : assignedSlab[0].wallet3_comm,
                    op4_comm : assignedSlab[0].wallet4_comm,
                    op5_comm : assignedSlab[0].wallet5_comm,
                    last_updated_by_type :  (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? 1 : 2,
                    last_updated_by : (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid,
                    last_updated_on : isodate
                }
                var ObjResult = await sqlQuery.updateQuery(this.tableName9, param, {user_uuid: req.body.agentUser_uuid})

                if(ObjResult.affectedRows){
                    let perD1,perD2,perD3,perD4,perD5

                    let usertype = req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ? 1 : 2
                        let userid = req.body.user_detials.userid
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
                    const last_updated_by_type =  (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? 1 : 2
                    const last_updated_by = (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid
                    const last_updated_on = isodate
                    let commissionChange = await this.updatePostPaid(agentDetails[0].userid,perD1,perD2,perD3,perD4,perD5,last_updated_by_type,last_updated_by,last_updated_on,logData,accessDetails,usertype,userid)
                    if(commissionChange == -1){
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : 'parent update failed'}] });
                    }

                    const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:commissionChange})
                        var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                            // console.log('Server Log : '+strLog)
                        if(intResult != 1){
                            // rollback
                            let rollback = await sqlQuery.specialCMD('rollback')
                            return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                        }

                    let commit = await sqlQuery.specialCMD('commit')
                    return res.status(200).send({message:'Switch account successfully'})
                    
                }else{ 
                    let rollback = await sqlQuery.specialCMD('rollback')
                    return res.status(400).json({ errors: [ {msg : 'parent update failed'}] });
                }

            }else{
                // change details in er post paid commission table
                    var param = {
                        parent_id : parentDetails[0].userid,
                        slab_uuid : req.body.slab_uuid,
                        slab_name : assignedSlab[0].slab_name,
                        op1_comm : assignedSlab[0].wallet1_comm,
                        op2_comm : assignedSlab[0].wallet2_comm,
                        op3_comm : assignedSlab[0].wallet3_comm,
                        op4_comm : assignedSlab[0].wallet4_comm,
                        op5_comm : assignedSlab[0].wallet5_comm,
                        last_updated_by_type :  (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? 1 : 2,
                        last_updated_by : (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid,
                        last_updated_on : isodate
                    }
                    var ObjResult = await sqlQuery.updateQuery(this.tableName9, param, {user_uuid: req.body.agentUser_uuid})
                    const { affectedRows, changedRows, info } = ObjResult;
                        const message = !affectedRows ? 'user not found' :
                            affectedRows && changedRows ? 'Switch account successfully' : 'Switch account successfully';
                    
                    const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:logData})
                    var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                        // console.log('Server Log : '+strLog)
                    if(intResult != 1){
                        // rollback
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                    }

                // send responce to fornt end
                    let commit = await sqlQuery.specialCMD('commit')
                    return res.send({ message, info });
            }

        }catch(error){
            let rollback = await sqlQuery.specialCMD('rollback')
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // agent type list, wich are in higher rank
    getAgentTypeForSwitchAcc = async(req,res) => { 
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('Agent/getAgentTypeForSwitchAcc',JSON.stringify(req.body), JSON.stringify(req.query))
            // limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset
            
            // get agent type details
                const agetnDetails = await sqlQueryReplica.searchQuery(this.tableName2,{user_uuid : req.query.user_uuid,Active : 1},['usertype_id'],'userid','ASC',1,0)
                if(agetnDetails.length == 0) return res.status(400).json({ errors: [ {msg : 'Agent not found'}] }); 

            // slice agent type list param
                let get_lower_parent_ids = (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? 0 : req.body.user_detials.type
                let get_upper_parent_ids = agetnDetails[0].usertype_id
            
            // get agent type list
                const agentList = await commonQueryCommon.getAllAgentType()
                if(agentList.length == 0) return res.status(400).json({ errors: [ {msg : 'agent type list not found'}] });  
            
            // slice list
                let i = 0, finalAgentList = []
                for(i=0;i< agentList.length ;i++){
                    if( get_lower_parent_ids < agentList[i].agent_type_id && agentList[i].agent_type_id <= get_upper_parent_ids){
                        finalAgentList.push({ 
                            agent_type_uuid : agentList[i].agent_type_uuid,
                            agentTypeName : agentList[i].agent_type_name
                        })
                    }
                    else continue;
                }

                if(finalAgentList.length == 0) return res.status(204).send({message:'No parent found'})
                res.status(200).send(finalAgentList)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    getParentListForSwitchAcc = async(req, res, next) => {
        try {
            // verify body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('Agent/getParentListFromSwitchAcc',JSON.stringify(req.body), JSON.stringify(req.query))
            // limif and off set
                // var offset = req.query.start
                // var limit = req.query.end - offset

            //send agent lis with agnet type -1
            // sql query parameter
                var param = {
                    // region_uuid : req.query.rgion_uuid,
                    comm_type : req.query.commissionType == "pre_paid" ? 1 : (req.query.commissionType == "post_paid" ? 2 : 0),
                    Active : 1
                }

            //get according to user type id if provided
                var searchKeyValue = {
                    agent_type_uuid: req.query.agent_type_uuid,
                    active: 1,
                }
                var key = ["agent_type_id"] // parameter to get from data base
                var orderby = "agent_type_id"
                var ordertype = "ASC"

                // 2) sql query to get strAgent_type_uuid, strName
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName4, searchKeyValue, key, orderby, ordertype, 1, 0)
                if (lisResponce.length === 0) {
                    return res.status(400).json({ errors: [ {msg : 'Agent type not found'}] });
                }
                param.usertype_id = parseInt(lisResponce[0].agent_type_id) 

                var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid", "username AS id", "full_name as name"]
                var orderby = "full_name"
                var ordertype = "ASC"

            // fire sql query to get str user_uuid, str full_name
                const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, param, key, orderby, ordertype)

            // check sql rsponce
                if (lisResults.length === 0) return res.status(204).send({message : 'no user found'})

            //send responce to front end
                res.status(200).send(lisResults)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    async updateAgentPrePaidCommission (agentid,comPerDec,commission,logData,accessDetails,usertype,userid) { 
        // get the child list 
        var searchKeyValue = {
            parent_id : agentid,
        }
        var key = ['userid','commission_value']
        const listChild = await sqlQuery.searchQueryNoLimitTran(this.tableName8, searchKeyValue, key,'userid','ASC')
        // console.log(listChild)
        if(listChild.length == 0) return logData

        let child,childDetails,decreasedCommission,updateCommission,changeChildComm, i = 0

        var date = new Date();
        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
        var isodate = date.toISOString();

        for(i=0;i<listChild.length;i++){
            child = listChild[i]

            decreasedCommission = Number(child.commission_value) - (Number(child.commission_value)*comPerDec)

            if (commission > Number(child.commission_value)) return logData

            // get child detail
            childDetails = await sqlQuery.searchQuery(this.tableName2,{userid:child.userid,Active : 1},['CAST(user_uuid AS CHAR(16)) AS user_uuid', 'full_name', 'mobile', 'username','region_id','usertype_id'],'userid','ASC', 1, 0)
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
                user_type : childDetails[0].usertype_id, // role
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

            updateCommission = await sqlQuery.updateQuery(this.tableName8,{
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

    async updatePostPaid (userid,perD1,perD2,perD3,perD4,perD5,last_updated_by_type,last_updated_by,last_updated_on,logData,accessDetails,usertype,Useruserid) { 
        // get slab list
        // console.log("commission percentage ",perD1,perD2,perD3,perD4,perD5)
        var slabList = await sqlQuery.searchQueryNoLimitTran(this.tableName10,{userid:userid},['CAST(slab_uuid AS CHAR(16)) AS slab_uuid','wallet1_comm','wallet2_comm','wallet3_comm','wallet4_comm','wallet5_comm'],'userid','ASC')
        
        var date = new Date();
        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
        var isodate = date.toISOString();
        
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
                var slabUpdRes = await sqlQuery.updateQuery(this.tableName10,param,{slab_uuid : slab.slab_uuid})
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
    
                let childList = await sqlQuery.searchQueryNoLimit(this.tableName9,{slab_uuid : slab.slab_uuid},['userid'],'userid','ASC')
                if(childList.length == 0) continue

                var chiUpdateRes = await sqlQuery.updateQuery(this.tableName9, param1,{slab_uuid : slab.slab_uuid})
                if(!chiUpdateRes.affectedRows) return -1

                let childDetails,j = 0
                for(j = 0; j<childList.length; j++){
                    let child = childList[j]

                    // get child detail
                    childDetails = await sqlQuery.searchQuery(this.tableName2,{userid:child.userid,Active : 1},['CAST(user_uuid AS CHAR(16)) AS user_uuid', 'full_name', 'mobile', 'region_id' ,'username','usertype_id'],'userid','ASC', 1, 0)
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
                        description : "Switch Account Commission update", 
                        activity_type : 18, // 1-Login;2-Change Password;3-Change Profile
                        old_value : slab.wallet1_comm.toString() + "," + slab.wallet2_comm.toString() + "," + slab.wallet3_comm.toString() + "," + slab.wallet4_comm.toString() + "," + slab.wallet5_comm.toString(),
                        modified_value : slabComm1.toString() + "," + slabComm2.toString() + "," + slabComm3.toString() + "," + slabComm4.toString() + "," + slabComm5.toString(), 
                        region_id : childDetails[0].region_id
                    })

                    let childUpdateRes = await this.updatePostPaid(child.userid,perD1,perD2,perD3,perD4,perD5,last_updated_by_type,last_updated_by,last_updated_on,logData,accessDetails,usertype,Useruserid)
                    if(childUpdateRes == -1 ) return -1
                    logData = childUpdateRes
                }
            }
        }
        return logData
    }

    async addChildtoList  (agentChildList, newParentChildList, userid,parent_id){
        try{
        
            // iterate over child agent list append child id in new parent
            let id, changes = 0
            for(let i = 0; i < agentChildList.length; i++){
                id = agentChildList[i]
                if( !(newParentChildList.includes(String(id)) || newParentChildList.includes(Number(id))) && id != '' ){
                    newParentChildList.push(id)
                    changes = 1
                }   
            }
            // if(changes == 0) return 1
            // console.log('add',agentChildList,newParentChildList,userid)
            newParentChildList = newParentChildList.join(',')
            
            // update the child lists
            let updateChildList = await sqlQuery.updateQuery(this.tableName2,{'child_id':newParentChildList},{userid : userid})

            if(userid != 1){
                // get parent parent id and update it also untill you reach id 1
                var searchKeyValue = {
                    userid : parent_id,
                }
                var key = ['parent_id','child_id']
                const parentDetails = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(parentDetails.length == 0) {
                    return ({ error : "parent not found" })
                } 
                
                let child_list = parentDetails[0].child_id.split(',')
                let responce = await this.addChildtoList(agentChildList,child_list,parent_id,parentDetails[0].parent_id)
                if(responce.error) return ({ error : error }) 
                else return 1

            }else{
                return 1
            }

        }catch (error) {
            return ({
                error : error
            })
        }
    } 

    async removeChildfromList (agentChildList, oldParentChildList, userid,parent_id){
        try{
            // iterate over child agent list pop the child from old parent
            let id, changes = 0
            for(let i = 0; i < agentChildList.length; i++){
                id = agentChildList[i]
                if(id != ''){
                    if(oldParentChildList.includes(String(id))){
                        oldParentChildList.splice(oldParentChildList.indexOf(String(id)),1)
                        changes = 1
                    }
                    if(oldParentChildList.includes(Number(id))){
                        oldParentChildList.splice(oldParentChildList.indexOf(Number(id)),1)
                        changes = 1
                    }
                // }
                // if((oldParentChildList.includes(String(id)) || oldParentChildList.includes(Number(id))) && id != '' ){
                //     oldParentChildList.splice(oldParentChildList.indexOf(id),1)
                //     // console.log(id,oldParentChildList)
                //     changes = 1
                // }
                }
            }

            // if(changes == 0) return 1
            // console.log('remove', agentChildList , oldParentChildList,userid)
            oldParentChildList = oldParentChildList.join(',')
            
            // update the child lists
            let updateChildList = await sqlQuery.updateQuery(this.tableName2,{'child_id':oldParentChildList},{userid : userid})
            
            if(userid != 1){
                // get parent parent id and update it also untill you reach id 1
                var searchKeyValue = {
                    userid : parent_id,
                }
                var key = ['child_id','parent_id']
                const parentDetails = await sqlQuery.searchQuery(this.tableName2, searchKeyValue, key,'userid','ASC',1,0)
                if(parentDetails.length == 0) {
                    return ({ error : "parent not found" })
                } 
                // console.log(parentDetails)
                let child_list = parentDetails[0].child_id.split(',')
                let responce = await this.removeChildfromList(agentChildList,child_list,parent_id,parentDetails[0].parent_id)
                if(responce.error) return ({ error : error }) 
                else return 1
                
            }else{
                return 1
            }

        }catch (error) {
            return ({
                error : error
            })
        }
    }

    async makeRandomNumber (intLenght,tableName) {
        let intRandomNumber = genRandom.generateRandomNumber(intLenght)

        // check if it is in comtact list
        var objResult = await sqlQuery.searchQuery(tableName,{mobile:intRandomNumber},["COUNT(1)"],"userid","ASC",1,0)
        if(objResult[0]["COUNT(1)"]) makeRandomNumber(intLenght,tableName)

        return intRandomNumber
    }

    setEncryptionKey() {
        var strRandomString = varRandomString.generateRandomString(15);
        var strRandomHash = varRandomString.generateRandomHash(strRandomString);
        return strRandomHash;
    }

    checkValidation = (req) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors)
            throw new HttpException(400, 'Validation faild', errors);
        }
    }
}

module.exports = new agentController