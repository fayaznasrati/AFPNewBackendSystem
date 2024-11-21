const sqlQuery = require('../common/sqlQuery.common')

// const { toIsoString } = require('../common/timeFunction.common')

exports.sendSms = async (data) => {
    try{

        var date = new Date();
        date.setHours(date.getHours() + 4, date.getMinutes() + 30);
        var isodate = date.toISOString();

        //variable for sqlQuery to create sms
            var param = {
                send_sms_uuid: 'uuid()',
                send_group_sms_uuid: data.send_group_sms_uuid || 0000000000000000, //str send_group_sms_uuid
                send_group_sms_id: data.send_group_sms_id || 0, // str send_group_sms_id
                mobile_number: data.number, //int mobile_number
                sms_message: data.message, // str send_message
                sms_status : 'Pending', // pending satus
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
            }

        //fire sql query to create the sms 
            const onjresult = await sqlQuery.createQuery('er_send_marketing_sms', param)
        
        // check message send
            if( onjresult ) return { message : 'message send successfully'}
            return { error : 'message not send'}

    }catch (error) {
        return { error : error.message }
    }
}

exports.sendAgentSms = async (data) => {
    try{

        var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

        //variable for sqlQuery to create sms
            var param = {
                send_sms_uuid: 'uuid()',
                send_group_sms_uuid: data.send_group_sms_uuid || 0000000000000000, //str send_group_sms_uuid
                send_group_sms_id: data.send_group_sms_id || 0, // str send_group_sms_id
                mobile_number: data.number, //int mobile_number
                sms_message: data.message, // str send_message
                sms_status : 'Pending', // pending satus
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
            }

        //fire sql query to create the sms 
            const onjresult = await sqlQuery.createQuery('er_send_marketing_sms', param)
        
        // check message send
            if( onjresult ) return { message : 'message send successfully'}
            return { error : 'message not send'}

    }catch (error) {
        return { error : error.message }
    }
}