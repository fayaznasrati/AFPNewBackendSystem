const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const redisMaster = require('../common/master/radisMaster.common')
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const { toIsoString } = require('../common/timeFunction.common');
const { status } = require('express/lib/response');

class operatorController {
    //table name
    tableName1 = "er_master_operator"
    tableName2 = "er_mno_details"
        //function to create operator 
    createoperator = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('operator/createOperator',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //varable for sql query to create operator
            var param = {
                operator_uuid: "uuid()",
                operator_name: req.body.name, //str operator_name
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, // str user id
                last_modified_by: req.body.user_detials.id, // str user id
            }

            //fire sql query to create operator
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'Operator successfully created!' });

            // delete data from redis
            redisMaster.delete('operator')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get all operators
    allMasterOperator = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('operator/allOperator',JSON.stringify(req.body), JSON.stringify(req.query))
            // call redis to get operator list
            redisMaster.get('operator', async(err, reply) => {

                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    // operator not in redis get from sql and into redis server
                    // variables for sql query to serarch operator
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    var searchKeyValue = {
                        active: 1,
                    }
                    var key = ["CAST(operator_uuid AS CHAR(16)) AS operator_uuid", "operator_name AS name"]
                    var orderby = "operator_name"
                    var ordertype = "ASC"

                    // fire sql query to get str operator_uuid, str name
                    const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (!lisResult) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (lisResult.length === 0) {
                        return res.status(204).send({ message: 'Operator not found' })
                    }

                    //conver the json to string to send to redis server
                    const strResponse = JSON.stringify(lisResult)
                    redisMaster.post('operator', strResponse)

                    // send responce to frontend
                    return res.status(200).send(lisResult)

                }
                // redis have the data, convert it back to json and send to front end
                res.status(200).send(JSON.parse(reply))
            })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    allOperator = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('operator/allOperator',JSON.stringify(req.body), JSON.stringify(req.query))
            // call redis to get operator list
            // redisMaster.get('operator', async(err, reply) => {

                // if (err) {
                //     throw new HttpException(500, 'Something went wrong');
                // }
                // if (reply === null || reply === undefined) {
                    // operator not in redis get from sql and into redis server
                    // variables for sql query to serarch operator
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    var searchKeyValue = {
                        status: 1,
                    }
                    var key = ["CAST(mno_uuid AS CHAR(16)) AS operator_uuid", "mno_name AS name"]
                    var orderby = "mno_name"
                    var ordertype = "ASC"

                    // fire sql query to get str operator_uuid, str name
                    const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (!lisResult) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (lisResult.length === 0) {
                        return res.status(204).send({ message: 'Operator not found' })
                    }

                    //conver the json to string to send to redis server
                    // const strResponse = JSON.stringify(lisResult)
                    // redisMaster.post('operator', strResponse)

                    // send responce to frontend
                    return res.status(200).send(lisResult)

                // }
                // redis have the data, convert it back to json and send to front end
                // res.status(200).send(JSON.parse(reply))
            // })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update the operator name
    updateOperator = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('operator/updateOperator',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to update operator
            var param = {
                operator_name: req.body.name, //str operator name
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str userid
            }
            var searchKeyValue = {
                operator_uuid: req.body.operator_uuid, //str operator uuid
                active: 1
            }

            // fire sql query to update the operator
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'operator not found' :
                affectedRows && changedRows ? 'Operator updated successfully' : 'Details Updated';
            res.send({ message, info });

            // delete data from redis
            redisMaster.delete('operator')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //delete -> change the active state of the operator to 0
    deleteOperator = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('operator/deleteOperator',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to update the status
            const param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
                active: 0
            }
            var searchKeyValue = {
                operator_uuid: req.query.operator_uuid, //str operator uuid
                active: 1
            }

            // fire sql query to update the active status
            const strResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!strResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = strResult;
            const message = !affectedRows ? 'Operator not found' :
                affectedRows && changedRows ? 'Operator delete successfully' : 'delete faild, allready deleted';
            res.send({ message, info });

            // delete from redis server
            redisMaster.delete('operator')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    checkOperator = async(req, res) => {
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('operator/checkOperator',JSON.stringify(req.body), JSON.stringify(req.query))
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

            let correctOperatorMatch = operator_uuid == req.body.operator_uuid ? 1 : 0

            var searchKeyValue = {
                operator_uuid: req.body.operator_uuid, // str operator uuid
                operator_name: req.body.operatorName,
                active: 1,
            }
            var key = ["SMPP"]
            var orderby = "operator_name"
            var ordertype = "ASC"

            // fire sql query to get str operator name 
            const lisResponse2 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
            if(!lisResponse2) return res.status(400).json({ errors: [ {msg : 'Operator list error'}] });

            res.status(200).send({ 
                correctOperatorMatch : correctOperatorMatch,
                registerMobile : lisResponse2[0].SMPP
            })


        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    findOperator = async(req, res) => {
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('operator/findOperator',JSON.stringify(req.body), JSON.stringify(req.query))
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

            if(!operator_uuid && !operatorName) return res.status(400).json({ errors: [ {msg : "The entered mobile number did not match any operator."}] });

            res.status(200).send({ 
                operator_uuid,
                operatorName
            })


        }catch (error){
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

module.exports = new operatorController();