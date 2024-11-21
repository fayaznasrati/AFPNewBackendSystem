const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const role = require('../utils/userRoles.utils')

const checkCommomDetails = require('../common/commonQuery.common');
const commonQueryCommon = require('../common/commonQuery.common');

const commissionModel = require('../models/commission.model')

const slabController = require('./slab.controller')

const httpRequestMakerCommon = require('../common/httpRequestMaker.common');


class commisionController {

    tableName1 = 'er_postpaid_commission'
    tableName2 = 'er_login'
    tableName3 = 'er_prepaid_commission'
    tableName4 = 'er_slab_manager'

    getCommision = async (req, res) =>{
        try{
            
            const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('commission/getCommission',JSON.stringify(req.body), JSON.stringify(req.query))
            // chek the user commission type for agent only
                if(!(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                    const listCommissionType = await sqlQueryReplica.searchQuery(this.tableName2,{user_uuid : req.body.user_detials.user_uuid,Active : 1},["comm_type"],'userid','ASC',1,0)
                    if(listCommissionType.length === 0) return res.status(400).json({ errors: [ {msg :'user not found'}]})
                    if (listCommissionType[0].comm_type == 1){
                        const listPrePaidCommissions = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid : req.body.user_detials.user_uuid},["commission_value"],'userid','ASC',1,0)
                        if(listPrePaidCommissions.length === 0 ) return res.status(400).json({ errors:[{msg:'commission not ssigned'}]})
                        return res.status(200).send({prepaidCommission : listPrePaidCommissions[0].commission_value})
                    }
                }

            //  1) get all operator
                const lisOpeator = await checkCommomDetails.getAllOperatorWithId()
                if(!lisOpeator) return res.status(400).json({ errors: [ {msg : "operator list not found"}] });


            // 2) sql query to get strAgent_type_uuid, strName

                var searchKeyValue = {
                    userid : req.body.user_detials.userid,
                }
                var key = ['op1_comm','op2_comm','op3_comm','op4_comm','op5_comm'] 
                var orderby = "userid"
                var ordertype = "ASC"

                const lisResults = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype,1,0)
                
                if(!lisResults.length) return res.status(400).json({ errors: [ {msg : "Commission list not found"}] });

                var lisCommision = []

                for (var i = 0; i < lisOpeator.length;i++){
                    var id = lisOpeator[i].operator_id
                    var objData = {
                        comm_percentage : lisResults[0]["op"+id+"_comm"],
                        operator_uuid : lisOpeator[i].operatorUuid,
                        operatorName : lisOpeator[i].operator_name,
                    }
                    lisCommision.push(objData)
                }

                res.status(200).send(lisCommision)


        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateCommision = async(req, res, next) =>{
        try{

            const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
            console.log('commission/updateCommission',JSON.stringify(req.body), JSON.stringify(req.query))
            const intId = await commonQueryCommon.getOperatorById(req.body.operator_uuid)
            if(intId.length === 0 ) return res.status(400).json({ errors: [ {msg : "operator not found"}] });

            var param = {}
            param["op"+intId[0].operator_id+"_comm"] = req.body.com_percentage

            var searchKeyValue = {
                user_uuid: req.body.user_detials.user_uuid, //str slab_uuid
            }

            let oldSlabDetails = await sqlQueryReplica.searchQuery(this.tableName1,searchKeyValue,["op"+intId[0].operator_id+"_comm AS oldCommission"],'postpaid_comm_id','ASC',1,0)
            if(oldSlabDetails.length == 0) return res.status(400).json({ errors: [ {msg : 'Slab not found'}] });

            // fire sql query to update
            const lisResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // const { affectedRows, changedRows, info } = lisResult;

            // // generating proper message
            // const message = !affectedRows ? 'slab commission not found' :
            //     affectedRows && changedRows ? 'slab commission updated successfully' : 'Details Updated';

            // get admin slab list
            // console.log(Number(req.body.com_percentage), Number(oldSlabDetails[0].oldCommission))
            if(Number(req.body.com_percentage) < Number(oldSlabDetails[0].oldCommission) ){
                let accessDetails = {
                    userIpAddress : req.body.userIpAddress ?  req.body.userIpAddress : 0,
                    userMacAddress : req.body.userMacAddress ?  req.body.userMacAddress : 0,
                    userOsDetails : req.body.userOsDetails ?  req.body.userOsDetails : 0,
                    userImeiNumber : req.body.userImeiNumber ?  req.body.userImeiNumber : 0,
                    userGcmId : req.body.userGcmId ?  req.body.userGcmId : 0,
                    userAppVersion : req.body.userAppVersion ?  req.body.userAppVersion : 0,
                    userApplicationType : req.body.userApplicationType ?  req.body.userApplicationType : 0,
                }
    
                let slabList = await sqlQueryReplica.searchQueryNoLimit(this.tableName4,searchKeyValue,['slab_uuid',"wallet"+intId[0].operator_id+"_comm AS oldComm"],'slab_id','asc')
                let updateDetails = []
                let slab, commissionDecreasePercent, key = {} 
    
                commissionDecreasePercent = (Number(oldSlabDetails[0].oldCommission)-Number(req.body.com_percentage))/Number(oldSlabDetails[0].oldCommission)
    
                for (let i = 0; i < slabList.length; i++){
                    slab = slabList[i]
                    // console.log(Number(slab.oldComm), Number(req.body.com_percentage))
                    if(Number(slab.oldComm) >= Number(req.body.com_percentage) ){
                        let newCommission = Number(slab.oldComm) - (Number(slab.oldComm) * commissionDecreasePercent)

                        key["wallet"+intId[0].operator_id+"_comm"] = newCommission >= 0 ? newCommission : 0
    
                        // update slab commission
                        let updateResponce = await sqlQuery.updateQuery(this.tableName4, key, {slab_uuid : slab.slab_uuid })
                        
                        // update agent commission
                        updateDetails = await slabController.updateAgentCommFun(slab.slab_uuid,intId[0].operator_id,intId[0].operator_name,newCommission,updateDetails,1,req.body.user_detials.userid,accessDetails,commissionDecreasePercent)
                        // console.log(newList)
                    }
                }
                if(updateDetails.length > 0) {
                    const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:updateDetails})
                    var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                        // console.log('Server Log : '+strLog)
                    if(intResult != 1){
                        // rollback
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                    }
                }
            }
            res.send({message: 'Commission update successfully'})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // direct agent pre paid commission slab report filter
    directAgentPrePaidCommissionReport = async (req,res) => {
        try{
            // verify req body and query
                const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

                // console.log('commission/directAgentPrePaidCommissionReport',JSON.stringify(req.body), JSON.stringify(req.query))
            // search param limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // search agent paremeters
                var param = {
                    parent_id : req.body.user_detials.userid
                }
                if(req.query.userid) param.userid = req.query.userid
                if(req.query.name) param.userName = req.query.name
                if(req.query.userType_uuid){
                    var intUserTypeId = await commonQueryCommon.getAgentTypeId(req.query.userType_uuid)
                    // console.log(intUserTypeId);
                    param.userType = intUserTypeId[0].agent_type_id
                }
                if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                    // param.region_ids = req.body.user_detials.region_list.join(',');
                    if(req.body.user_detials.region_list.length != 7){
                        param.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    param.child_ids =  req.body.user_detials.child_list.join(',');
                }
    
                if(Object.keys(param).length == 0) return res.status(400).json({ errors: [ {msg : "search parameter are not proper"}] });

                const lisTotalRecords = await commissionModel.directAgentPrePaidCommissionReportCount(param)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // sql query by model
                const lisResponce1 = await commissionModel.directAgentPrePaidCommissionReport(param,limit,offset)
                // if(lisResponce1.length == 0) return res.status(204).json({ errors: [ {msg : "Agetn Commission not found"}] });

            // get agent type list
                // var agentTypeList = await commonQueryCommon.getAllAgentType()
                // if(agentTypeList.length == 0) return res.status(400).json({ errors: [ {msg : "Agetn type list not found"}] });
                
                // var results = lisResponce1.map((result)=>{
                //     var {usertype_id,...other} = result
                //     other.userType = agentTypeList[usertype_id-1].agent_type_name
                //     return other
                // })

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResponce1)
                }else{
                    res.status(200).send({
                        reportList : lisResponce1,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

                // console.log(lisResponce1);
                // res.status(200).send(results)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    directAgentPostPaidCommissionReport = async (req,res) =>{
        try{
            // verify req body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0
                // console.log('commission/directAgentPostPaidCommissionReport',JSON.stringify(req.body), JSON.stringify(req.query))
            // search param limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // search agent paremeters
                var param = {
                    parent_id : req.body.user_detials.userid
                }
                if(req.query.userid) param.userid = req.query.userid
                if(req.query.name) param.userName = req.query.name
                if(req.query.userType_uuid){
                    var intUserTypeId = await commonQueryCommon.getAgentTypeId(req.query.userType_uuid)
                    // console.log(intUserTypeId);
                    param.userType = intUserTypeId[0].agent_type_id
                }
                if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                    // param.region_ids = req.body.user_detials.region_list.join(',');
                    if(req.body.user_detials.region_list.length != 7){
                        param.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    param.child_ids =  req.body.user_detials.child_list.join(',');
                }

                if(Object.keys(param).length == 0) return res.status(400).json({ errors: [ {msg : "search parameter are not proper"}] });

                const lisTotalRecords = await commissionModel.directAgentPostPaidCommissionReportCount(param)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // sql query by model
                const lisResponce1 = await commissionModel.directAgentPostPaidCommissionReport(param, limit, offset)
                // if(lisResponce1.length == 0) return res.status(204).json({ errors: [ {msg : "Agetn Commission not found"}] });

            // get agent type list
                // var agentTypeList = await commonQueryCommon.getAllAgentType()
                // if(agentTypeList.length == 0) return res.status(400).json({ errors: [ {msg : "Agetn type list not found"}] });
                
                // var results = lisResponce1.map((result)=>{
                //     var {usertype_id,...other} = result
                //     other.userType = agentTypeList[usertype_id-1].agent_type_name
                //     return other
                // })

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResponce1)
                }else{
                    res.status(200).send({
                        reportList : lisResponce1,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

                // console.log(lisResponce1);
                // res.status(200).send(results)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    inDirectAgentPrePaidCommissionReport = async(req,res) => {
        try{
            // verify req body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0
                // console.log('commission/indirectAgentPrePaidCommissionReport',JSON.stringify(req.body), JSON.stringify(req.query))
            // search param limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // search agent paremeters
                var param = {
                    'NOT parent_id' : req.body.user_detials.userid
                }
                if(req.query.parent_uuid){
                    // get parent id from parent uuid
                    var searhK = {
                        user_uuid : req.query.parent_uuid,
                        parent_id : req.body.user_detials.userid,
                        Active : 1
                    }
                    if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                        // searhK.region_ids = req.body.user_detials.region_list.join(',');
                        if(req.body.user_detials.region_list.length != 7){
                            searhK.region_ids = req.body.user_detials.region_list.join(',')
                        }
                    }else{
                        searhK.child_ids =  req.body.user_detials.child_list.join(',');
                    }
                    var parentUserId = await sqlQueryReplica.searchQuery(this.tableName2,searhK,['userid','child_id'],"userid",'asc',1,0)
                    if(parentUserId.length == 0) return res.status(400).json({ errors: [ {msg : "Parent id not found"}] });
                    // console.log(parentUserId)
                    param.child_ids = parentUserId[0].child_id

                }else{

                    if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                        // param.region_ids = req.body.user_detials.region_list.join(',');
                        if(req.body.user_detials.region_list.length != 7){
                            param.region_ids = req.body.user_detials.region_list.join(',')
                        }
                    }else{
                        param.child_ids =  req.body.user_detials.child_list.join(',');
                    }
                }

                if(req.query.userid) param.userid = req.query.userid
                if(req.query.name) param.userName = req.query.name
                if(req.query.userType_uuid){
                    var intUserTypeId = await commonQueryCommon.getAgentTypeId(req.query.userType_uuid)
                    // console.log(intUserTypeId);
                    param.userType = intUserTypeId[0].agent_type_id
                }

                // if(Object.keys(param).length == 1) return res.status(400).json({ errors: [ {msg : "search parameter are not proper"}] });

                const lisTotalRecords = await commissionModel.inDirectAgentPrePaidCommissionReportCount(param)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // sql query by model
                const lisResponce1 = await commissionModel.inDirectAgentPrePaidCommissionReport(param, limit, offset)
                // if(lisResponce1.length == 0) return res.status(204).json({ errors: [ {msg : "Agetn Commission not found"}] });

            // get agent type list
                // var agentTypeList = await commonQueryCommon.getAllAgentType()
                // if(agentTypeList.length == 0) return res.status(400).json({ errors: [ {msg : "Agetn type list not found"}] });
                
                // var results = lisResponce1.map((result)=>{
                //     var {usertype_id,...other} = result
                //     other.userType = agentTypeList[usertype_id-1].agent_type_name
                //     return other
                // })

                // console.log(lisResponce1);
                // res.status(200).send(results)

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResponce1)
                }else{
                    res.status(200).send({
                        reportList : lisResponce1,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    inDirectAgentPostPaidCommissionReport = async(req,res) => {
        try{
            // verify req body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('commission/inDirectAgnetPostPaidCommissionReport',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // search param limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

                var param = {
                    'NOT parent_id' : req.body.user_detials.userid
                }
                
                if(req.query.parent_uuid){
                    // get parent id from parent uuid
                    var searhK = {
                        user_uuid : req.query.parent_uuid,
                        parent_id : req.body.user_detials.userid,
                        Active : 1
                    }
                    if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                        // searhK.region_ids = req.body.user_detials.region_list.join(',');
                        if(req.body.user_detials.region_list.length != 7){
                            searhK.region_ids = req.body.user_detials.region_list.join(',')
                        }
                    }else{
                        searhK.child_ids =  req.body.user_detials.child_list.join(',');
                    }
                    var parentUserId = await sqlQueryReplica.searchQuery(this.tableName2,searhK,['userid','child_id'],"userid",'asc',1,0)
                    if(parentUserId.length == 0) return res.status(400).json({ errors: [ {msg : "Parent id not found"}] });
                    // console.log(parentUserId)
                    param.child_ids = parentUserId[0].child_id

                }else{

                    if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                        // param.region_ids = req.body.user_detials.region_list.join(',');
                        if(req.body.user_detials.region_list.length != 7){
                            param.region_ids = req.body.user_detials.region_list.join(',')
                        }
                    }else{
                        param.child_ids =  req.body.user_detials.child_list.join(',');
                    }
                }

                if(req.query.userid) param.userid = req.query.userid
                if(req.query.name) param.userName = req.query.name
                if(req.query.userType_uuid){
                    var intUserTypeId = await commonQueryCommon.getAgentTypeId(req.query.userType_uuid)
                    // console.log(intUserTypeId);
                    param.userType = intUserTypeId[0].agent_type_id
                }

                // if(Object.keys(param).length == 1) return res.status(400).json({ errors: [ {msg : "search parameter are not proper"}] });

                const lisTotalRecords = await commissionModel.inDirectAgentPostPaidCommissionReportCount(param)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // sql query by model
                const lisResponce1 = await commissionModel.inDirectAgentPostPaidCommissionReport(param, limit, offset)
                // if(lisResponce1.length == 0) return res.status(204).json({ errors: [ {msg : "Agetn Commission not found"}] });

            // get agent type list
                // var agentTypeList = await commonQueryCommon.getAllAgentType()
                // if(agentTypeList.length == 0) return res.status(400).json({ errors: [ {msg : "Agetn type list not found"}] });
                
                // var results = lisResponce1.map((result)=>{
                //     var {usertype_id,...other} = result
                //     other.userType = agentTypeList[usertype_id-1].agent_type_name
                //     return other
                // })

                // console.log(lisResponce1);
                // res.status(200).send(results)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResponce1)
                }else{
                    res.status(200).send({
                        reportList : lisResponce1,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
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

module.exports = new commisionController();