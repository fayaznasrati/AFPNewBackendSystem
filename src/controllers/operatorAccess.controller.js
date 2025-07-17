const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const commonQueryCommon = require('../common/commonQuery.common')
const redisMaster = require('../common/master/radisMaster.common')
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

// const { toIsoString } = require('../common/timeFunction.common')

class operatorAccessController {
    tableName1 = 'er_access_status'
    tableName2 = 'er_operator_topup'
    tableName3 = 'er_mno_details'

    // Stock Transfer and USSD/SMS Channel controllers
        // geta all operator access
        getAllAccessRights = async (req,res) => {
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    // console.log('operatorAccess/getAllAccessRights',JSON.stringify(req.body), JSON.stringify(req.query))
                    var date = new Date();
                    date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                    var isodate = date.toISOString();

                // get data from table
                    let accessStatus = await sqlQueryReplica.searchQueryNoCon(this.tableName1,['stock_transfer','sms','ussd'],'sms','ASC',1,0)
                    if(accessStatus.length == 0){
                        // insert access right with 0
                        let param = {
                            stock_transfer : 0,
                            sms : 0,
                            ussd : 0,
                            last_updated_on : isodate
                        }

                        let insertResponce = await sqlQuery.createQuery(this.tableName1, param)
                        return res.status(200).send({ 
                            stock : 0,
                            sms : 0,
                            ussd : 0
                        })
                    }

                    res.status(200).send({ 
                        stock : accessStatus[0].stock_transfer,
                        sms : accessStatus[0].sms,
                        ussd : accessStatus[0].ussd
                    })

            }catch(error){
                console.log(error);
                return res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        updateAccessRights = async (req,res) => {
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('operatorAccess/updateAccessRights',JSON.stringify(req.body), JSON.stringify(req.query))
                    var date = new Date();
                    date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                    var isodate = date.toISOString();
                
                // update the status
                    let param = {
                        stock_transfer : req.body.stockStatus == 1 ? 1 : 0,
                        sms : req.body.smsStatus == 1 ? 1 : 0,
                        ussd : req.body.ussdStatus == 1 ? 1 : 0,
                        last_updated_on : isodate
                    }
                
                // update in redis
                redisMaster.post('SMS_STATUS',param.sms)
                redisMaster.post('USSD_STATUS',param.ussd)
                
                redisMaster.delete('STOCK_TRANSFER_STATUS')

                // update query
                    let updateReponce = await sqlQuery.updateStar(this.tableName1,param)

                // send responce to front end
                    const { affectedRows, changedRows, info } = updateReponce;
                    const message = !affectedRows ? 'Status not found' :
                        affectedRows && changedRows ? 'Status updated successfully' : 'Details Updated';
                    
                    res.send({ message, info });
                
            }catch(error){
                console.log(error);
                return res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }
    
        getAllOperatorTopupList = async(req,res,next) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('[getAllOperatorTopupList]', JSON.stringify(req.body), JSON.stringify(req.query));
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0
    
                var searchKeyValue = {
                    active : 1
                }
                var orderby = "operator_access_id"
                var ordertype = "desc"
                        let key = [ "cast( operator_access_uuid AS CHAR(16) ) AS operator_uuid", "display_name AS operatorName", "status AS topupStatus"]

                 let lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, ['COUNT(1) AS count'], orderby, ordertype)
                // const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName1,searchKeyValue, ['COUNT(1) AS count'], orderby, ordertype)
    
                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1
    
                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords
    
    
                const lisResult = await sqlQueryReplica.searchQuery(this.tableName2,searchKeyValue, key, orderby, ordertype, limit, offset)
                if(lisResult.length === 0) return res.status(204).send({ message:'Sub admin not found'});
                // console.log(lisResult)
                res.status(200).send({
                    reportList : lisResult,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
                // res.status(200).send(finalResult)
    
            }catch (error) {
                console.log(error);
                return res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        addOperatorAccess = async (req,res) => {
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('operatorAccess/addOperatorAccess',JSON.stringify(req.body), JSON.stringify(req.query))
                    var date = new Date();
                    date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                    var isodate = date.toISOString();
                    
                // get opeator id
                    let operatorId = await commonQueryCommon.getOperatorById(req.body.operator_uuid)
                    if(operatorId == 0) return res.status(400).json({ errors: [ {msg : "operator not found"}] });

                // check for MNO
                    let mnoDetails = await sqlQueryReplica.searchQuery(this.tableName3,{mno_uuid : req.body.mno_uuid, status : 1},['id'], 'id', 'ASC', 1, 0)
                    if(mnoDetails.length == 0 ) return res.status(400).json({ errors: [ {msg : 'MNO details not found'}] })

                // insert parameters 
                    let param = {
                        operator_access_uuid : "uuid()",
                        display_name : req.body.name, //str name to display
                        operator_id : operatorId[0].operator_id,
                        mno_id : mnoDetails[0].id, 
                        queue_name : req.body.queueName, // rabbitMQ queue name
                        max_amount : req.body.max_amount, // rabbitMQ queue name
                        min_amount : req.body.min_amount, // rabbitMQ queue name
                        status : 1,
                        active : 1,
                        update_on : isodate, //dt current date time
                        updated_by : req.body.user_detials.id, //str user id
                    }

                    let response = await sqlQuery.createQuery(this.tableName2, param)

                    redisMaster.delete('RECHARGE_OPERATOR_'+operatorId[0].operator_id)

                // send responce to front end
                    res.status(200).send({ 
                        response: response,
                        message : " operator access created successfully "})

            }catch(error){
                console.log(error);
                return res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        updateOperatorAccess = async(req,res) => {
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('operatorAccess/updateOperatorAccess',JSON.stringify(req.body), JSON.stringify(req.query))
                    var date = new Date();
                    date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                    var isodate = date.toISOString();

                // get old status
                    var searchKey = {
                        operator_access_uuid : req.body.operator_uuid,
                        active : 1
                    }
                    let operatorStatus = await sqlQueryReplica.searchQuery(this.tableName2, searchKey, ['status','operator_id'], 'operator_access_id','ASC', 1, 0)
                    if( operatorStatus.length == 0 ) return res.status(400).json({ errors: [ {msg : 'Operator not found'}] });

                // update the operator access level
                    var key = {
                        // status : operatorStatus[0].status == 1 ? 0 : 1
                        status : ['0','1'].includes(String(req.body.topupStatus)) ? String(req.body.topupStatus) : 0,
                        update_on : isodate, //dt current date time
                        updated_by : req.body.user_detials.id, //str user id
                    }
                    const lisResponce1 = await sqlQuery.updateQuery(this.tableName2,key,searchKey)

                    redisMaster.delete('RECHARGE_OPERATOR_'+operatorStatus[0].operator_id)

                // send responce to front end
                    const { affectedRows, changedRows, info } = lisResponce1;
                    const message = !affectedRows ? 'operator access not found' :
                        affectedRows && changedRows ? 'operator access updated successfully' : 'Update status is same';
                    
                    res.send({ message, info });
                
            }catch(error){
                console.log(error);
                return res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }
        updateOperatorAccessMAXMAIN  = async (req, res) => {
                    try{
                        // check body and query
                            const errors = validationResult(req);
                            if (!errors.isEmpty()) {
                                return res.status(400).json({ errors: errors.array() });
                            }
                            console.log('operatorAccess/updateOperatorAccess',JSON.stringify(req.body), JSON.stringify(req.query))
                             const { min_amount, max_amount, } = req.body;;

                            var date = new Date();
                            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                            var isodate = date.toISOString();

                        // get old status
                            var searchKey = {
                                operator_access_uuid : req.body.operator_uuid,
                                active : 1
                            }
                            let operatorStatus = await sqlQueryReplica.searchQuery(this.tableName2, searchKey, ['status','max_amount', 'min_amount','operator_id'], 'operator_access_id','ASC', 1, 0)
                            if( operatorStatus.length == 0 ) return res.status(400).json({ errors: [ {msg : 'Operator not found'}] });

                        // update the operator access level
                            var key = {
                                min_amount : min_amount || operatorStatus[0].min_amount,
                                max_amount : max_amount || operatorStatus[0].max_amount,
                                // status : ['0','1'].includes(String(topupStatus)) ? String(topupStatus) : 0,
                                update_on : isodate, //dt current date time
                                updated_by : req.body.user_detials.id, //str user id
                            }
                            const lisResponce1 = await sqlQuery.updateQuery(this.tableName2,key,searchKey)

                            redisMaster.delete('RECHARGE_OPERATOR_'+operatorStatus[0].operator_id)

                        // send responce to front end
                            const { affectedRows, changedRows, info } = lisResponce1;
                            const message = !affectedRows ? 'operator access not found' :
                                affectedRows && changedRows ? 'operator access updated successfully' : 'Update status Min and Max is same';
                            
                            res.send({ message, info });
                        
                    }catch(error){
                        console.log(error);
                        return res.status(400).json({ errors: [ {msg : error.message}] });
                    }
        }

        delteOperatorAccess = async (req, res) => {
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('operatorAccess/deleteOperatorAccess',JSON.stringify(req.body), JSON.stringify(req.query))
                    var date = new Date();
                    date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                    var isodate = date.toISOString();

                // update the operator access level
                    var key = {
                        status : 0,
                        active : 0,
                        update_on : isodate, //dt current date time
                        updated_by : req.body.user_detials.id, //str user id
                    }
                    var searchKey = {
                        operator_access_uuid : req.query.access_uuid,
                        active : 1
                    }
                    const lisResponce1 = await sqlQuery.updateQuery(this.tableName2,key,searchKey)

                // send responce to front end
                    const { affectedRows, changedRows, info } = lisResponce1;
                    const message = !affectedRows ? 'operator access not found' :
                        affectedRows && changedRows ? 'operator access updated successfully' : 'Details Updated';
                    
                    res.send({ message, info });

            }catch(error){
                console.log(error);
                return res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }
}

module.exports = new operatorAccessController();