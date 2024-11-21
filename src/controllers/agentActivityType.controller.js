const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const redisMaster = require('../common/master/radisMaster.common')
const agentActivityTypeList = require('../models/agentActivityType.module')

// const commonQueryCommon = require('../common/commonQuery.common')

class activityTypeController { 
    // table names
    tableName1 = 'er_activity_type';

    getAllActivityType = async (req, res) => {
        try{
            // verify the request body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('AgentActivityType/getAllActivityType',JSON.stringify(req.body), JSON.stringify(req.query))
            // check if the data is in redis database
                redisMaster.get('activityType', async(err, reply) => {

                    // check if redis reply contain the data or not
                    if (err) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (reply === null || reply === undefined) {
                        
                        //  make sql call to get all activity types
                        const listAllActivityType = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName1,['at_id','activity_name AS name'],'activity_name','ASC')
                        if(listAllActivityType.length == 0)  return res.status(204).send({ message: 'Activity Type list not found' })

                        // send data into redis
                        const strResponse = JSON.stringify(listAllActivityType)
                        redisMaster.post('activityType', strResponse)

                        // var offset = req.query.start
                        // var limit = req.query.end > listAllActivityType.length ? listAllActivityType.length : req.query.end - offset + 1

                        // send responce ti front end
                        return res.status(200).send(listAllActivityType)
                    }

                    var listActivityType = JSON.parse(reply)

                    // var offset = req.query.start
                    // var limit = req.query.end > listActivityType.length ? listActivityType.length : req.query.end - offset + 1

                    // redis have the data, convet string to json and send to the fronte nd
                    res.status(200).send(listActivityType)                   
                })

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getAdminActivityType = async(req,res) => {
        try{
            // verify the request body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('AgentActivityType/getAdminActivityType',JSON.stringify(req.body), JSON.stringify(req.query))
            // check if the data is in redis database
            redisMaster.get('adminActivityType', async(err, reply) => {

                // check if redis reply contain the data or not
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    
                    //  make sql call to get all activity types
                    const listAllActivityType = await agentActivityTypeList.getActivityType([1])
                    if(listAllActivityType.length == 0)  return res.status(204).send({ message: 'Activity Type list not found' })

                    // send data into redis
                    const strResponse = JSON.stringify(listAllActivityType)
                    redisMaster.post('adminActivityType', strResponse)

                    // var offset = req.query.start
                    // var limit = req.query.end > listAllActivityType.length ? listAllActivityType.length : req.query.end - offset + 1

                    // send responce ti front end
                    return res.status(200).send(listAllActivityType)
                }

                var listActivityType = JSON.parse(reply)

                // var offset = req.query.start
                // var limit = req.query.end > listActivityType.length ? listActivityType.length : req.query.end - offset + 1

                // redis have the data, convet string to json and send to the fronte nd
                res.status(200).send(listActivityType)                   
            })

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getSubAdminActivityType = async(req,res) => {
        try{
            // verify the request body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('AgentActivityType/getSubAdminActivityType',JSON.stringify(req.body), JSON.stringify(req.query))
            // check if the data is in redis database
            redisMaster.get('subAdminActivityType', async(err, reply) => {

                // check if redis reply contain the data or not
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    
                    //  make sql call to get all activity types
                    const listAllActivityType = await agentActivityTypeList.getActivityType([2])
                    if(listAllActivityType.length == 0)  return res.status(204).send({ message: 'Activity Type list not found' })

                    // send data into redis
                    const strResponse = JSON.stringify(listAllActivityType)
                    redisMaster.post('subAdminActivityType', strResponse)

                    // var offset = req.query.start
                    // var limit = req.query.end > listAllActivityType.length ? listAllActivityType.length : req.query.end - offset + 1

                    // send responce ti front end
                    return res.status(200).send(listAllActivityType)
                }

                var listActivityType = JSON.parse(reply)

                // var offset = req.query.start
                // var limit = req.query.end > listActivityType.length ? listActivityType.length : req.query.end - offset + 1

                // redis have the data, convet string to json and send to the fronte nd
                res.status(200).send(listActivityType)                   
            })

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getAgentActivityType = async(req,res) => {
        try{
            // verify the request body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('AgentActivityType/getAgentActivityType',JSON.stringify(req.body), JSON.stringify(req.query))
            // check if the data is in redis database
            redisMaster.get('agentActivityType', async(err, reply) => {

                // check if redis reply contain the data or not
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    
                    //  make sql call to get all activity types
                    const listAllActivityType = await agentActivityTypeList.getActivityType([3])
                    if(listAllActivityType.length == 0)  return res.status(204).send({ message: 'Activity Type list not found' })

                    // send data into redis
                    const strResponse = JSON.stringify(listAllActivityType)
                    redisMaster.post('agentActivityType', strResponse)

                    // var offset = req.query.start
                    // var limit = req.query.end > listAllActivityType.length ? listAllActivityType.length : req.query.end - offset + 1

                    // send responce ti front end
                    return res.status(200).send(listAllActivityType)
                }

                var listActivityType = JSON.parse(reply)

                // var offset = req.query.start
                // var limit = req.query.end > listActivityType.length ? listActivityType.length : req.query.end - offset + 1

                // redis have the data, convet string to json and send to the fronte nd
                res.status(200).send(listActivityType)                   
            })

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    createActivityType = async (req,res) => {
        try{
            // check the req body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('AgentActivityType/createActivityType',JSON.stringify(req.body), JSON.stringify(req.query))
            // variable to create user activity type
                var param = {
                    activity_name : req.body.name,
                    user_type : req.body.userType
                }

            // fire sql query
                const obResult = await sqlQuery.createQuery(this.tableName1,param)

            // delete the data from redis
                if(req.body.userType == 1) redisMaster.delete('adminActivityType')
                if(req.body.userType == 2) redisMaster.delete('subAdminActivityType')
                if(req.body.userType == 3) redisMaster.delete('agentActivityType')

            // send responce to front end
                res.status(201).send({message:'Activity type list created sucessfully'})
            
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateActivityType = async (req,res) => {
        try{ 
            // check the req body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('AgentActivityType/updateActivityType',JSON.stringify(req.body), JSON.stringify(req.query))
            // update the activity type name
                var param = {
                    activity_name : req.body.name,
                    user_type : req.body.userType
                }
                var searchKeyValue = {
                    at_id : req.body.at_id
                }

            // sql query to update activity type
                const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'Province not found' :
                affectedRows && changedRows ? 'Province updated successfully' : 'Details Updated';

            // delete the data from redis server
                if(req.body.userType == 1) redisMaster.delete('adminActivityType')
                if(req.body.userType == 2) redisMaster.delete('subAdminActivityType')
                if(req.body.userType == 3) redisMaster.delete('agentActivityType')
            
            // send responce to front end
                res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

}

module.exports = new activityTypeController();