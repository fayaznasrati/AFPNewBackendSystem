const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const notificationModule = require('../models/notification.module')
const redisMaster = require('../common/master/radisMaster.common');

// const { toIsoString } = require('../common/timeFunction.common')

class notificationController {

    tableName1 = "er_admin_notification_types"
    tableName2 = "er_admin_notification_numbers"
    tableName3 = "er_master_operator"

    // Notification Type
    //function to create notification type
    createNotiType = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('notification/createNotificationType',JSON.stringify(req.body), JSON.stringify(req.query))
            //variables to sqlquery
            var param = {
                nt_name: req.body.name // str name
            }

            // fire sql query to create notification type 
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            //send responce to front end
            res.status(201).send({ message: 'Notification Type created successfully !' });

            // deleter notification variable from the redis server
            redisMaster.delete("notificationType")

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get all the notifiacation types
    allNotiType = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('notification/allNotificationType',JSON.stringify(req.body), JSON.stringify(req.query))
            //call redis and get notification type
            redisMaster.get("notificationType", async(err, reply) => {
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {

                    //no data in redis, fire sql query and add date to redis server
                    // variables for sql query to get notification type
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    var key = ["nt_id", "nt_name AS name"]
                    var orderby = "nt_name"
                    var ordertype = "ASC"

                    // fire sql query to get int nt_id, str nt_name
                    const lisResult = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName1, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (!lisResult) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (lisResult.length === 0) {
                        return res.status(204).send({ message: 'Notification Type not found' })
                    }

                    //convert json to sting to save data in the redis server
                    const strResponse = JSON.stringify(lisResult)
                    redisMaster.post("notificationType", strResponse)

                    // send responce to front end
                    return res.status(200).send(lisResult)
                }
                //get the data from redis, convert it to json nad send it to front end
                res.status(200).send(JSON.parse(reply))
            })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update notification type
    updateNotiType = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('notification/updateNotificationType',JSON.stringify(req.body), JSON.stringify(req.query))
            //variable for sqlQuery
            var param = {
                nt_name: req.body.name, //str name
            }
            var searchKeyValue = {
                nt_id: req.body.nt_id //str nt_id
            }

            //fire sql query to change nt_name
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Notification Type not found' :
                affectedRows && changedRows ? 'Notification Type updated successfully' : 'Details Updated';

            //send responce to front end
            res.send({ message, info });

            // deleter notification variable from the redis server
            redisMaster.delete("notificationType")

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to delete notification type
    deleteNotiType = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('notification/deleteNotiType',JSON.stringify(req.body), JSON.stringify(req.query))
            //variables for sql query
            var searchKeyValue = {
                nt_id: req.query.nt_id // str nt_id
            }

            //fire sql query to delete notification type
            const objResult = await sqlQuery.deleteQuery(this.tableName1, searchKeyValue)

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, info, warningStatus } = objResult;
            const message = !affectedRows ? 'Notification Type not found' :
                affectedRows && !warningStatus ? 'Notification Type delete successfully' : 'delete faild';

            //send responce to front end
            res.send({ message, info });

            // deleter notification variable from the redis server
            redisMaster.delete("notificationType")

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // Notification Number
    //function to create notification number
    createNotiNumber = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('notification/createNotiNumber',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let operator_uuid = '', operatorName = ''

            switch(req.body.number.slice(0,3)){
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

            if(operator_uuid == '' || operatorName == '') return res.status(400).json({ errors: [ {msg : 'Invalid mobile number'}] });

            //get operator name
            var searchKeyValue = {
                operator_uuid: operator_uuid, //str operator uuid
                operator_name: operatorName,
                active: 1,
                SMPP : 1
            }
            var key = ["COUNT(1)"]
            var orderby = "operator_name"
            var ordertype = "ASC"

            // fire sql query to get operator name
            const lisResponse2 = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse2) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse2[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg :"Operator Service not added"}] });
            }

            //variabels for sql query to create notification numner
            var param = {
                nn_uuid: "uuid()",
                nn_number: req.body.number, //int number
                created_by: req.body.user_detials.id, //str user id
                created_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
                last_modified_on: isodate //dt current date time
            }

            // check the notification type
            //variable for sqlQuery to check notification type
            var searchKeyValue = {
                nt_id: req.body.type, //int nt_id
            }
            var key = ["COUNT(1)"]
            var orderby = "nt_name"
            var ordertype = "ASC"

            // fire sql query to get nt_name
            const lisResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponce[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg : 'Notification Type not found'}] });
            }
            //set the param varaiable to add the data
            param.nn_type = req.body.type

            //fire sql query to create notification number
            const objResult = await sqlQuery.createQuery(this.tableName2, param)

            // check if the result is there and responce accordingly
            if (!objResult) throw new HttpException(500, 'Something went wrong');

            //send resnponce to frontend
            res.status(201).send({ message: 'Notification Number created successfully!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get all active notification number
    allNotiNumber = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('notification/deleteNotiNumber',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // variable for sqlQuery
            // var offset = req.query.start
            // var limit = req.query.end - offset

            const lisTotalRecords = await notificationModule.allNotiNumberCount(req.body.user_detials.id)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            const objResult = await notificationModule.allNotiNumber(req.body.user_detials.id, limit, offset)

            // check if the result is there and responce accordingly
            // if (!objResult) {
            //     throw new HttpException(500, 'Something went wrong');
            // }
            // if (objResult.length === 0) {
            //     return res.status(204).send([])
            // }

            //send response to the frontend
            // res.status(200).send(objResult)
            if( req.query.pageNumber == 0 ) {
                res.status(200).send(objResult)
            }else{
                res.status(200).send({
                    reportList : objResult,
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

    getNotiNumberDetails = async (req, res) => {
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('notification/getNotiNumberDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            const objResult = await notificationModule.getNotiNumberDetails(req.query.nn_uuid)

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (objResult.length === 0) {
                return res.status(204).send({ message: 'Notification number not found' });
            }

            //send response to the frontend
            res.status(200).send(objResult[0])

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to update the notification number
    updateNotiNumber = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('notification/updateNotificationNumber',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let operator_uuid = '', operatorName = ''

            switch(req.body.number.slice(0,3)){
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

            if(operator_uuid == '' || operatorName == '') return res.status(400).json({ errors: [ {msg : 'Invalid mobile number'}] });

            //get operator name
            var searchKeyValue = {
                operator_uuid: operator_uuid, //str operator uuid
                operator_name: operatorName,
                active: 1,
                SMPP : 1
            }
            var key = ["COUNT(1)"]
            var orderby = "operator_name"
            var ordertype = "ASC"

            // fire sql query to get operator name
            const lisResponse2 = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse2) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse2[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg :"Operator Service not added"}] });
            }

            //variable for sqlQuery to update the notifiacation number
            var param = {
                    last_modified_by: req.body.user_detials.id, //str userid
                    last_modified_on: isodate //dt current date time
                }
                //option parameter to be updated
            if (req.body.number) {
                param.nn_number = req.body.number //int number
            }

            if (req.body.nt_id) {
                //check the notification type if provided
                //variabels for sqlQuery to checl of provided correct notification id
                var searchKeyValue = {
                    nt_id: req.body.nt_id //int nt_id
                }
                var key = ["COUNT(1)"]
                var orderby = "nt_name"
                var ordertype = "ASC"

                //first sql query to check nt_id
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

                // check if the result is there and responce accordingly
                if (!lisResponce) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (!lisResponce[0]["COUNT(1)"]) {
                    return res.status(400).json({ errors: [ {msg : 'Notification type not found'}] });
                }
                // adding notification type to the update list
                param.nn_type = req.body.nt_id
            }
            var searchKeyValue = {
                nn_uuid: req.body.nn_uuid, //str nn_uuid
                active: 1
            }

            //check if param have proper data count grater then 2
            if (Object.keys(param).length === 2) return res.status(400).send({ message: 'invalid update request' })

            // fire sql query to update notification number
            const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'agent Notification Number not found' :
                affectedRows && changedRows ? 'agent Notification Number successfully' : 'Details Updated';

            //send responce to frontend
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to deactivate notification number
    deleteNotiNumber = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('notification/deleteNotiNumber',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to deactivate the notification number
            const param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
                active: 0
            }
            var searchKeyValue = {
                nn_uuid: req.query.nn_uuid, //str nn_uuid
                active: 1
            }

            //fire sql query to deactivate notification number
            const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'agent Notification Number not found' :
                affectedRows && changedRows ? 'agent Notification Number delete successfully' : 'delete faild, allready deleted';

            //send response to the front end
            res.send({ message, info });

        } catch (error) {
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

module.exports = new notificationController