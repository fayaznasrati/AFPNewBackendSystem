const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const { apiCall } = require('../common/makeApiCall.common')

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const redisMaster = require('../common/master/radisMaster.common')

const commonQuery = require('../common/commonQuery.common')

// const { toIsoString } = require('../common/timeFunction.common')

class rechargeRouteController {

    tableName1 = 'er_recharge_routing'
    tableName2 = 'er_master_operator'
    tableName3 = 'er_mno_details'

    getRechargeRoute = (req, res) =>{
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('rechargeRoute/getRechargeRoute',JSON.stringify(req.body), JSON.stringify(req.query))
            redisMaster.get('rechargeRoute', async(err, reply) => {
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    let lisResponce = await sqlQuery.searchQueryNoConNolimit(this.tableName1,['operator_id','operator_name','rabbitMQ_route','balance_url'],'operator_id','ASC')
                    
                    if(lisResponce.length == 0) return res.status(204).send({ message: 'Recharge route not found' })
                    
                    const strResponce = JSON.stringify(lisResponce)
                    redisMaster.post('rechargeRoute', strResponce )

                    return res.status(200).send(lisResponce)

                }else{
                    var lisRegion = JSON.parse(reply)
                    return res.status(200).send(lisRegion)
                }
            })

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    createRechareRoute = async (req,res) => {
        try{

            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                 //  console.log('rechargeRoute/crateRecahrgeRoute',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // by operator uuid and get operator name and id

                let operatorDetails = await commonQuery.getOperatorById(req.body.operator_uuid)
                if ( operatorDetails == 0) return res.status(400).json({ errors: [ {msg : 'operator not found'}] });

            // get MNO details

                let mnoDetails = await sqlQueryReplica.searchQuery(this.tableName3, {id : req.body.mnoId, status : 1 }, [ 'route_name', 'balance_url' ], 'id', 'ASC', 1, 0)
                if( mnoDetails.length == 0 ) return res.status(400).json({ errors: [ {msg : 'MNO details not found'}] });

                let param = {
                    operator_id : operatorDetails[0].operator_id,
                    operator_name : operatorDetails[0].operator_name,
                    rabbitMQ_route : mnoDetails[0].route_name,
                    balance_url : mnoDetails[0].balance_url,
                    updated_by : req.body.user_detials.id,
                    update_on : isodate
                }

                let responce = await sqlQuery.createQuery(this.tableName1, param)

                redisMaster.delete('rechargeRoute')

                res.status(200).send({message : 'route created'})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateRechargeRoute = async (req, res) =>{
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('rechargeRoute/updateRechargeRoute',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // by operator uuid and get operator name and id

                let operatorDetails = await commonQuery.getOperatorById(req.body.operator_uuid)
                if ( operatorDetails == 0) return res.status(400).json({ errors: [ {msg : 'operator not found'}] });

            // get MNO details

                let mnoDetails = await sqlQueryReplica.searchQuery(this.tableName3, {id : req.body.mnoId, status : 1 }, [ 'route_name', 'balance_url' ], id, 'ASC', 1, 0)
                if( mnoDetails.length == 0 ) return res.status(400).json({ errors: [ {msg : 'MNO details not found'}] });

                let param = {
                    rabbitMQ_route : mnoDetails[0].route_name,
                    balance_url : mnoDetails[0].balance_url,
                    updated_by : req.body.user_detials.id,
                    updated_on : isodate
                }

            let searchKeyValue = {
                operator_id : operatorDetails[0].operator_id
            }

            let responce = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue)

            redisMaster.delete('rechargeRoute')

            const { affectedRows, changedRows, info } = responce;
            const message = !affectedRows ? 'Recharge route not found' :
                affectedRows && changedRows ? 'Recharge route updated successfully' : 'Details Updated';

            res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getMnoDetails = (req, res) =>{
        try{

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('rechargeRoute/getMNODetails',JSON.stringify(req.body), JSON.stringify(req.query))
            redisMaster.get('mnoDetasils', async(err, reply) => {
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    let lisResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName3,{ status : 1 },['cast( mno_uuid AS CHAR(16) ) as mno_uuid','id AS mnoId','mno_name AS name','balance_url as url'],'id','desc')
                    
                    if(lisResponce.length == 0) return res.status(204).send({ message: 'MNO not found' })
                    
                    const strResponce = JSON.stringify(lisResponce)
                    redisMaster.post('mnoDetails', strResponce )

                    return res.status(200).send(lisResponce)

                }else{
                    var lisRegion = JSON.parse(reply)
                    return res.status(200).send(lisRegion)
                }
            })

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    addMnoDetails = async (req,res) => {
        try{

            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                 //  console.log('rechargeRoute/addMnoDetails',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

                let param = {
                    mno_uuid : "uuid()",
                    mno_name : req.body.name,
                    balance_url : req.body.balanceUrl,
                    // route_name : req.body.queueName,
                    status : 1,
                    updated_by : req.body.user_detials.id,
                    updated_on : isodate
                }

                let responce = await sqlQuery.createQuery(this.tableName3, param)

                redisMaster.delete('mnoDetails')

                res.status(200).send({message : 'MNO details added'})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateMnoDetails = async (req,res) =>{
        try{

            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                 //  console.log('rechargeRoute/updateMnoDetails',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

                let searchKeyValue = {
                    id : req.body.mnoId,
                    status : 1
                };

                let param = {
                    mno_name : req.body.name,
                    balance_url : req.body.balanceUrl,
                    updated_by : req.body.user_detials.id,
                    updated_on : isodate
                }

                let responce = await sqlQuery.updateQuery(this.tableName3, param, searchKeyValue)

                redisMaster.delete('mnoDetails')

                const { affectedRows, changedRows, info } = responce;
                const message = !affectedRows ? 'mno details not found' :
                    affectedRows && changedRows ? 'mno detials updated successfully' : 'Details Updated';

                res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    deleteMnoDetails = async(req, res) => {
        try{

            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                 //  console.log('rechargeRoute/deleteMnoDetails',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

                let searchKeyValue = {
                    id : req.query.mnoId
                };

                let param = {
                    status : 0,
                    updated_by : req.body.user_detials.id,
                    updated_on : isodate
                }

                let responce = await sqlQuery.updateQuery(this.tableName3, param, searchKeyValue)

                redisMaster.delete('mnoDetails')

                const { affectedRows, changedRows, info } = responce;
                const message = !affectedRows ? 'mno details not found' :
                    affectedRows && changedRows ? 'mno detials deleted successfully' : 'delete faild';

                res.send({ message, info });

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }


    getApiBalance = async ( req, res, next ) => {
        try{
            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                //  //  console.log('rechargeRoute/getApiBalance',JSON.stringify(req.body), JSON.stringify(req.query))
            // get api details 
                let mnoDetails = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName3,['mno_name','balance_url'],'id','DESC')
                if(mnoDetails.length == 0) return res.status(400).json({ errors: [ {msg : 'mon details not found'}] });

            // make api request
                let apiResponce ,balanceDetails = [], i = 0
                for(i = 0; i < mnoDetails.length; i++){
                    // make api call
                    apiResponce = await apiCall(mnoDetails[i].balance_url)
                    // console.log(apiResponce)

                    if( apiResponce.balance ){
                        balanceDetails.push({ 
                            mnoName : mnoDetails[i].mno_name,
                            amount : apiResponce.balance
                        })
                    }else{
                        balanceDetails.push({ 
                            mnoName : mnoDetails[i].mno_name,
                            amount : 0
                        })
                    }
                }

            // send responce
                res.status(200).send(balanceDetails)
                
            
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
}



module.exports = new rechargeRouteController