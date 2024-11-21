const sqlQuery = require('./sqlQuery.common')
const sqlQueryReplica = require('./sqlQueryReplica.common')
const commonQueryCommon = require('./commonQuery.common')
const { sendMessage, createWorker } = require('./rabbitmq.common')
const { toIsoString } = require('./timeFunction.common')

// configer env
const dotenv = require('dotenv');
dotenv.config()

class smsFunction {
    
    tableName1 = 'er_login'
    tableName2 = 'er_login_admin'
    tableName3 = 'er_agent_contact'
    tableName4 = 'er_wallet_transfer_sms_log_2'
    tableName5 = 'er_sms_success_log'

    constructor() {
        setTimeout(() => { 
            if(process.env.START_RABBIT_MQ_WORKER == 1){
                createWorker('roshanSMSUpdate',this.updateSmsStatus)
                // createWorker('salaamSMSUpdate',this.updateSmsStatus)
                // createWorker('awccSMSUpdate',this.updateSmsStatus)
                // createWorker('mtnSMSUpdate',this.updateSmsStatus)
                // createWorker('etisalatSMSUpdate',this.updateSmsStatus)
            }
        },10000)
    }

    agentSms = async (messageDetails, requestFrom = 0) =>{ 
        try{
            // console.log('[sms details]',messageDetails)

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get contact details from er_agent_contact
            let { recieverMessage, agentId } = messageDetails

            let keyValue = ['userid','username']
            let agentDetails = await sqlQuery.searchQuery(this.tableName1,{userid : agentId}, keyValue, 'userid', 'ASC', 1, 0)
            if(agentDetails.length == 0) return {error : 'user not found'}

            // get contact details
            keyValue = ['CAST(operator_uuid as CHAR(16)) as operator_uuid','mobile','recieve_notification']
            let contactList = await sqlQuery.searchQuery(this.tableName3, {userid : agentId, randomMobile : 0, status : 1}, keyValue, 'mobile_type', 'DESC', 6, 0)
            if(contactList.length == 0) return {error : 'contact number not found'}
            // console.log(contactList)
            let finalList = []
            if(requestFrom){
	          requestFrom = String(requestFrom).length == 10 ? requestFrom : '0' + String(requestFrom)
                let operatorId = this.getOperatorId(requestFrom.slice(0,4))
                if(operatorId.id){
                    finalList.push({
                        mobile : requestFrom.slice(1,requestFrom.length),
                        operatorId : operatorId.id
                    })
                }
            }
            contactList.forEach(async (contact) =>{
                let { mobile, recieve_notification } = contact
                if(recieve_notification == 1){
                    let operatorId = this.getOperatorId(mobile.slice(0,4))
                    if(operatorId.id && requestFrom != mobile){
                        finalList.push({
                            mobile : mobile.slice(1,mobile.length),
                            operatorId : operatorId.id
                        })
                    }
                }
            })
            // console.log(finalList)
            if( finalList.length == 0){ 
                console.log('[contact list error] : no number to send message to agent : ',agentDetails[0].username)
                return {error : 'operator List error'}
            } 

            // push data to sms table
            let smsDetails = {
                userid :  agentId, //str
                username : agentDetails[0].username, //str 
                mobile : finalList[0].mobile,
                operator_id : finalList[0].operatorId,
                SMS : recieverMessage, //str
                created_on: isodate,
                status : 0, // 0 not send, 1 send
                mobile1 :  finalList[1] ? finalList[1].mobile : 'NA',
                operator_id1 : finalList[1] ? finalList[1].operatorId : 'NA',
                mobile2 :  finalList[2] ? finalList[2].mobile : 'NA',
                operator_id2 : finalList[2] ? finalList[2].operatorId : 'NA',
                mobile3 :  finalList[3] ? finalList[3].mobile : 'NA',
                operator_id3 : finalList[3] ? finalList[3].operatorId : 'NA',
                mobile4 :  finalList[4] ? finalList[4].mobile : 'NA',
                operator_id4 : finalList[4] ? finalList[4].operatorId : 'NA',
                mobile5 :  finalList[5] ? finalList[5].mobile : 'NA',
                operator_id5 : finalList[5] ? finalList[5].operatorId : 'NA'
            }

            // console.log(smsDetails)

            let smsId = await sqlQuery.createQuery(this.tableName4,smsDetails)
            if( !smsId.insertId ){
                return ({error : 'message insert error'})
            }

            // let smsQueueDetails = {
            //     recieverNumber : contactList[0].mobile,
            //     operatorId : contactList[0].operatorId,
            //     recieverMessage : recieverMessage,
            //     messageId : smsId.insertId
            // }

            smsDetails.id = smsId.insertId

            let smsQueue = await this.pushMessageRabbitmq(smsDetails)

            // if(smsQueue.error){
            //     console.log(smsQueue.error)
            //     return ({error : 'rabbitMQ queue error'})
            // }

            return {message : 'sms send successfully'}

        }catch(error){
            console.log(error)
            return { error: 'sms error' }
        }
    }

    adminSms = async (messageDetails) =>{
        try{
            // console.log('[sms details]',messageDetails)

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get contact details from er_agent_contact
            let { recieverMessage, adminId, adminUsername } = messageDetails

            let searchKeyValue = {}
            if(adminUsername) searchKeyValue.username = adminUsername
            if(adminId) searchKeyValue.admin_userid = adminId

            let keyValue = ['admin_userid','username','mobile','operator_uuid']
            let adminDetails = await sqlQuery.searchQuery(this.tableName2,searchKeyValue, keyValue, 'admin_userid', 'ASC', 1, 0)

            if(adminDetails.length == 0) return {error : 'user not found'}
            if(adminDetails[0].mobile == 0) return {error : 'user mobile error'}
            // console.log(adminDetails[0].mobile)
            // operator id
            let operatorIdDetails = this.getOperatorId(adminDetails[0].mobile)

            if(operatorIdDetails.error){
                console.log('[contact list error] : admin mobile operator id not fund :',adminUsername||adminId)
                return {error : operatorIdDetails.error}
            }

            // push data to sms table
            let smsDetails = {
                userid :  adminDetails[0].admin_userid, //str
                username : adminDetails[0].username, //str 
                mobile : adminDetails[0].mobile.slice(1,adminDetails[0].mobile.length),
                operator_id : operatorIdDetails.id,
                SMS : recieverMessage, //str
                created_on: isodate,
                status : 0, // 0 not send, 1 send
                mobile1 : 'NA',
                operator_id1 : 'NA',
                mobile2 : 'NA',
                operator_id2 : 'NA',
                mobile3 : 'NA',
                operator_id3 : 'NA',
                mobile4 :  'NA',
                operator_id4 : 'NA',
                mobile5 :  'NA',
                operator_id5 : 'NA'
            }

            let smsId = await sqlQuery.createQuery(this.tableName4,smsDetails)
            if( !smsId.insertId ){
                return ({error : 'message inserterror'})
            }

            // let smsQueueDetails = {
            //     recieverNumber : adminDetails[0].mobile,
            //     operatorId : operatorIdDetails[0].operator_id,
            //     recieverMessage : recieverMessage,
            //     messageId : smsId.insertId
            // }

            // let smsQueue = await this.pushMessageRabbitmq(smsQueueDetails)

            // if(smsQueue.error){
            //     console.log(smsQueue.error)
            //     return ({error : 'rabbitMQ queue error'})
            // }

            smsDetails.id = smsId.insertId

            let smsQueue = await this.pushMessageRabbitmq(smsDetails)

            return {message : 'sms send successfully'}

            
        }catch(error){
            console.log(error)
            return { error: 'sms error' }
        }
    }

    directSMS = async (messageDetails, sendMessage = 1) => {
        try{
            // console.log('[sms details]',messageDetails)

            let {userId,username,mobile,recieverMessage} = messageDetails

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // operator id
            let operatorIdDetails = this.getOperatorId(mobile)

            if(operatorIdDetails.error){
                console.log('[contact list error] : direct sms operator not found for :',mobile)
                return {error : operatorIdDetails.error}
            }

            // push data to sms table
            let smsDetails = {
                userid :  userId, //str
                username : username, //str 
                mobile : mobile.slice(1,mobile.length),
                operator_id : operatorIdDetails.id,
                SMS : recieverMessage, //str
                created_on: isodate,
                status : 0, // 0 not send, 1 send
                mobile1 :   'NA',
                operator_id1 :  'NA',
                mobile2 :   'NA',
                operator_id2 :  'NA',
                mobile3 :   'NA',
                operator_id3 :  'NA',
                mobile4 :   'NA',
                operator_id4 :  'NA',
                mobile5 :   'NA',
                operator_id5 :  'NA'
            }

            let smsId = await sqlQuery.createQuery(this.tableName4,smsDetails)
            if( !smsId.insertId ){
                return ({error : 'message inserterror'})
            }

            // let smsQueueDetails = {
            //     recieverNumber : mobile,
            //     operatorId : operatorIdDetails[0].operatorId,
            //     recieverMessage : recieverMessage,
            //     messageId : smsId.insertId
            // }

            smsDetails.id = smsId.insertId

            if(sendMessage){
                let smsQueue = await this.pushMessageRabbitmq(smsDetails)
            }

            // if(smsQueue.error){
            //     console.log(smsQueue.error)
            //     return ({error : 'rabbitMQ queue error'})
            // }

            return {message : 'sms send successfully'}

        }catch(error){
            console.log(error)
            return { error: 'sms error' }
        }
    }

    getOperatorId = (mobile) =>{
        mobile = String(mobile)
        switch(mobile.slice(0,3)){
            case "078":
            case "073":
                // Etisalat
                return ({id:4})
                break;
            case "079":
            case "072":
                // Roshan
                return ({id:5})
                break;
            case "077":
            case "076":
                // MTN
                return ({id:3})
                break;
            case "074" :
                // Salaam
                return ({id:1})
                break;
            case "070":
            case "071":
                // AWCC
                return ({id:2})
                break;
            default:
                return ({ error : "Operator error for reciever number"})
        }
    }

    pushMessageRabbitmq = async (messageDetails) =>{
        try{
            // let {recieverNumber, recieverMessage, messageId, operatorId} = messageDetails
            let queueName = ''

            // check queue name
            switch(String(messageDetails.operator_id)){
                case '1' : 
                    queueName  = 'salaamSMS'
                    break;
                case '2' : 
                    queueName  = 'awccSMS'
                    break;
                case '3' : 
                    queueName  = 'mtnSMS'
                    break;
                case '4' : 
                    queueName  = 'etisalatSMS'
                    break;
                case '5' : 
                    queueName  = 'roshanSMS'
                    break;
            }

            if (queueName == ''){
                return({error : 'rabbit mq queue not found'})
            }

            // let messageQueue = { 
            //     recieverNumber : recieverNumber,
            //     message : recieverMessage,
            //     messageId : messageId,
            // }

            let messageQueue = JSON.stringify(messageDetails)
            
            return new Promise((resolve, reject) => {
                // puch data in rabbitMQ
                // console.log('pushing to rabbit mq',queueName,messageQueue)
                sendMessage(queueName,messageQueue,(error,messageResponce) => {
                    if(error){
                        resolve({error})
                    }else{
                        resolve({messageResponce})
                    }
                })
            })    

        }catch(error){
            console.log(error)
            return { error: 'sms error' }
        }
    }

    updateSmsStatus = async (messageStr) =>{ 
        try{

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // sms details
            let messageObj  = JSON.parse(messageStr)
            let updateResponce

            if (messageObj.status == 1){ // success
                let updateDetails = { 
                    status : 1, //send
                    delaverydatetime : isodate, //dt current date time
                    res_message_id : messageObj.res_message_id || 0,
                    final_status : messageObj.final_status,
                    res_phonenumber : messageObj.res_phonenumber,
                    smpp_respose : messageObj.smpp_respose
                }
                updateResponce = await sqlQuery.updateQuery(this.tableName4,updateDetails,{id : messageObj.id, status : 0})
                // console.log('[SMS status update]',messageObj.status,messageObj.id,'success')

            }else{ //failed
                let updateDetails = { 
                    status : 2, //send
                    delaverydatetime : isodate, //dt current date time
                    smpp_respose : messageObj.smpp_respose
                }
                updateResponce = await sqlQuery.updateQuery(this.tableName4,updateDetails,{id : messageObj.id, status : 0})
                // console.log('[SMS status update]',messageObj.status,messageObj.id, 'failed')
            }
            
            // insert details into table 5 success log table
            let insertResponce = await sqlQuery.createQuery(this.tableName5, messageObj)

            let { affectedRows, changedRows, info } = updateResponce

            if(affectedRows, changedRows) return ({message : 'message status update'})
            else return ({error : 'message not found'})

        }catch(error){
            console.log(error)
            return { error: 'sms error' }
        }
    }

}

module.exports = new smsFunction()