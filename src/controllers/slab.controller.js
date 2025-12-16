const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const role = require('../utils/userRoles.utils')
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const checkCommomDetails = require('../common/commonQuery.common');
const commonQueryCommon = require('../common/commonQuery.common');
const httpRequestMakerCommon = require('../common/httpRequestMaker.common')

// const { toIsoString } = require('../common/timeFunction.common')

class slabController {

    // table used
    tableName1 = 'er_slab_manager'
    tableName2 = 'er_deafult_slab'
    tableName3 = 'er_login'
    tableName4 = 'er_postpaid_commission'
    tableName5 = 'er_prepaid_commission'


    // following function are for slab manager
    // create slab manager function
    createSlabManager = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //console.log('slab/createSlabManager',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // parameter for sql query
            var param = {
                slab_uuid: "uuid()",
                userid: req.body.user_detials.userid, //str userid
                user_uuid: req.body.user_detials.user_uuid, //str user uuid
                slab_name: req.body.slabName, //str slab name
                created_by_type :  ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                created_by: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, // str user id
                created_on: isodate, //dt current date time
                last_modified_by :  ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                last_modified_by: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, //str user id
                last_modified_on: isodate //dt current date time
            }

            var lisOperatorDIds = await checkCommomDetails.getAllOperatorWithId()
            // console.log(lisOperatorDIds)
            if (lisOperatorDIds === 0) return res.status(400).json({ errors: [ {msg : 'Operator list not found'}] });

            var lisslabdetail = req.body.slabdetail 
            // console.log(lisslabdetail)

            // cehck user commission type
            if(!(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                const listCommissionType = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid : req.body.user_detials.user_uuid},["comm_type"],'userid','ASC',1,0)
                if(listCommissionType.length === 0) return res.status(400).json({ errors: [ {msg :'user not found'}]})
                if(listCommissionType[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set, action not allowed'}]})
                if(listCommissionType[0].comm_type != 2) {
                    let type = listCommissionType[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                    return res.status(400).json({ errors: [ {msg : 'User have '+type+ " commission so not allowed to create slab"}] });
                }
            }

            //get user slab details
            var searchKeyValue = {
                user_uuid : req.body.user_detials.user_uuid,
            }
            var key = ['op1_comm','op2_comm','op3_comm','op4_comm','op5_comm'] 
            var orderby = "userid"
            var ordertype = "ASC"

            const lisUserCommission = await sqlQueryReplica.searchQuery(this.tableName4, searchKeyValue, key, orderby, ordertype,1,0)
            
            if(!lisUserCommission.length) return res.status(400).json({ errors: [ {msg : "User list not found"}] });

            for (var i = 0; i < lisOperatorDIds.length;i++){
                // console.log(lisOperatorDIds[i].operatorUuid,lisslabdetail[i].operatorUuid)
                if(lisslabdetail[i] === undefined || lisOperatorDIds[i].operatorUuid !== lisslabdetail[i].operator_uuid) return res.status(400).json({ errors: [ {msg : "commission list parameter error"}] });
                if(lisUserCommission[0]["op"+lisOperatorDIds[i].operator_id+"_comm"] < lisslabdetail[i].commisionPercentage ) return res.status(400).json({ errors: [ {msg : "commission is more that User commission"}] });
                param["wallet"+lisOperatorDIds[i].operator_id+"_comm"] = lisslabdetail[i].commisionPercentage
                param["wallet"+lisOperatorDIds[i].operator_id+"_target_status"] = lisslabdetail[i].targetStatus
                param["wallet"+lisOperatorDIds[i].operator_id+"_target"] = lisslabdetail[i].target
                param["wallet"+lisOperatorDIds[i].operator_id+"_reward"] = lisslabdetail[i].reward
            }
            
            //fire sql query
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            // check sql responce
            // send responce to front end
            res.status(201).send({ message: 'commission slab successfully created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to get all slab Manager name with slab uuid
    allSlabManagerName = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('slab/allSlabManagerName',JSON.stringify(req.body), JSON.stringify(req.query))
            if(!(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                const listCommissionType = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid : req.body.user_detials.user_uuid},["comm_type"],'userid','ASC',1,0)
                if(listCommissionType.length === 0) return res.status(400).json({ errors: [ {msg :'user not found'}]})
                if(listCommissionType[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set, action not allowed'}]})
                if(listCommissionType[0].comm_type != 2) {
                    let type = listCommissionType[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                    return res.status(400).json({ errors: [ {msg : 'User have '+type+ " commission so it dont have any slabs"}] });
                }
            }

            // sql search paramaters
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                userid: req.body.user_detials.userid
            }
            var key = ["CAST(slab_uuid AS CHAR(16)) AS slab_uuid", "slab_name AS name"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to get str slab_uuid, str slab_name
            const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

            // check sql response
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'Slab manager not found' })
            }

            // send responce to front end
            return res.status(200).send(lisResult)
        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to get parent slab
    getParentSlab = async ( req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('slab/getParentSlab',JSON.stringify(req.body), JSON.stringify(req.query))
            // search parent id
            let searchKeyValue = {
                user_uuid: req.query.user_uuid
            }
            if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                if(req.body.user_detials.region_list.length != 7){
                    searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                }
            }else{
                searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            }
            const intParentid = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue,["parent_id"],'userid','ASC',1,0)
            if(intParentid.length === 0) return res.status(400).json({ errors: [ {msg : 'user not found'}]})
            if(intParentid[0].parent_id != 1){
                // check parent commission type
                const intParentCommissionType = await sqlQueryReplica.searchQuery(this.tableName3,{userid: intParentid[0].parent_id},["comm_type"],'userid','ASC',1,0)
                if(intParentCommissionType.length === 0) return res.status(400).json({ errors: [ {msg : 'parent not found'}]})
                // console.log(intParentCommissionType[0].comm_type)
                if(intParentCommissionType[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set, action not allowed'}]})
                if(intParentCommissionType[0].comm_type != 2) {
                    let type = intParentCommissionType[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                    return res.status(400).json({ errors: [ {msg : 'Parent have '+type+ " commission so it dont have slab"}] });
                }
            }
            
            // sql search paramaters
            // var offset = req.query.start
            // var limit = req.query.end - offset
            searchKeyValue = {
                userid: intParentid[0].parent_id // get slab list for the agent parent
            }
            var key = ["CAST(slab_uuid AS CHAR(16)) AS slab_uuid", "slab_name AS name"]
            var orderby = "slab_id"
            var ordertype = "ASC"

            // fire sql query to get str slab_uuid, str slab_name
            const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

            // check sql response
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'Slab manager not found' })
            }

            // send responce to front end
            return res.status(200).send(lisResult)
        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // get agent slab by agent id
    agentSlabById = async ( req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // console.log('slab/agentSlabById',JSON.stringify(req.body), JSON.stringify(req.query))
            // sql search paramaters
            var offset = req.query.start
            var limit = req.query.end - offset
            var searchKeyValue = {
                user_uuid : req.query.user_uuid 
            }
            // if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
            //     searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
            // }else{
            //     searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
            // }
            var key = ["CAST(slab_uuid AS CHAR(16)) AS slab_uuid", "slab_name AS name"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to get str slab_uuid, str slab_name
            const lisResult = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, limit, offset)

            // check sql response
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'Slab manager not found' })
            }

            // send responce to front end
            return res.status(200).send(lisResult)
        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to get details by slab Manager uuid
    getSlabManagerDetialsbyid = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('slab/getSlabManagerDetailsById',JSON.stringify(req.body), JSON.stringify(req.query))
            if(!(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                const listCommissionType = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid : req.body.user_detials.user_uuid,Active : 1},["comm_type"],'userid','ASC',1,0)
                if(listCommissionType.length === 0) return res.status(400).json({ errors: [ {msg :'user not found'}]})
                if(listCommissionType[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set, action not allowed'}]})
                if(listCommissionType[0].comm_type != 2) {
                    let type = listCommissionType[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                    return res.status(400).json({ errors: [ {msg : 'User have '+type+ " commission so it dont have any slabs"}] });
                }
            }

            // sql query parameter
            var searchKeyValue = {
                slab_uuid: req.query.slab_uuid //str slab_uuid
            }
            var key = ["CAST(slab_uuid AS CHAR(16)) AS slab_uuid","wallet1_comm", "wallet1_target_status", "wallet1_target", "wallet1_reward",
                       "wallet2_comm", "wallet2_target_status", "wallet2_target", "wallet2_reward",
                       "wallet3_comm", "wallet3_target_status", "wallet3_target", "wallet3_reward",
                       "wallet4_comm", "wallet4_target_status", "wallet4_target", "wallet4_reward",
                       "wallet5_comm", "wallet5_target_status", "wallet5_target", "wallet5_reward",
            ]
            var orderby = "slab_id"
            var ordertype = "DESC"

            // fire sql query to get slab details
            const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

            // check sql rsponce
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'Slab manager not found'}] });
            }

            //get all operators
            var lisOperatorDIds = await checkCommomDetails.getAllOperatorWithId()
            // console.log(lisOperatorDIds)

            if (lisOperatorDIds === 0) return res.status(400).json({ errors: [ {msg : 'Operator not found'}] });

            //get user slab details
            var searchKeyValue = {
                user_uuid : req.body.user_detials.user_uuid,
            }
            var key = ['op1_comm','op2_comm','op3_comm','op4_comm','op5_comm'] 
            var orderby = "userid"
            var ordertype = "ASC"

            const lisUserCommission = await sqlQueryReplica.searchQuery(this.tableName4, searchKeyValue, key, orderby, ordertype,1,0)

            // console.log(lisUserCommission)
            if(!lisUserCommission.length) return res.status(400).json({ errors: [ {msg : "User commission list not found"}] });

            var lisRresponce = []

            for(var i = 0;i< lisOperatorDIds.length;i++ ){
                var intId = lisOperatorDIds[i].operator_id
                var objData = {
                    operatorName : lisOperatorDIds[i].operator_name,
                    operator_uuid: lisOperatorDIds[i].operatorUuid,
                    admin_commision :lisUserCommission[0]["op"+intId+"_comm"] ,
                    slab_uuid:lisResult[0].slab_uuid,
                    commisionPercentage : lisResult[0]["wallet"+intId+"_comm"],
                    targetStatus : lisResult[0]["wallet"+intId+"_target_status"] == 1 ? 0 : 2 , // it should be 1 and 0, resolved front end issue from backend
                    target : lisResult[0]["wallet"+intId+"_target"],
                    reward : lisResult[0]["wallet"+intId+"_reward"]
                }
                lisRresponce.push(objData)
            }

            //send responce to front end
            return res.status(200).send(lisRresponce)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to slab manager
    updateSlabManager = async(req, res, next) => {
        try {
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
              //  console.log('slab/updateSlabManager',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // search operator id
                var lisOperatorDIds = await checkCommomDetails.getOperatorById(req.body.operator_uuid)
                // console.log(lisOperatorDIds)
                if (lisOperatorDIds === 0) return res.status(400).json({ errors: [ {msg : 'Operator not found'}] });
                let operatorId = lisOperatorDIds[0].operator_id

            // chek the user commission type for agent only
                if(!(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                    const listCommissionType = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid : req.body.user_detials.user_uuid,Active : 1},["comm_type"],'userid','ASC',1,0)
                    if(listCommissionType.length === 0) return res.status(400).json({ errors: [ {msg :'user not found'}]})
                    if(listCommissionType[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set, action not allowed'}]})
                    if(listCommissionType[0].comm_type != 2) {
                    let type = listCommissionType[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                    return res.status(400).json({ errors: [ {msg : 'User have '+type+ " commission so it dont have any slabs"}] });
                    }
                }

            // get user slab details
                let searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid
                }
                var key = ['op'+operatorId+'_comm AS opCommission']
                const lisUserCommission = await sqlQueryReplica.searchQuery(this.tableName4, searchKeyValue, key, 'userid', 'ASC', 1, 0)
                if(lisUserCommission.length == 0) return res.status(400).json({ errors: [ {msg : "User commission list not found"}] });

            // check if slab commission is more then user commission
                if(lisUserCommission[0].opCommission < req.body.commisionPercentage ) return res.status(400).json({ errors: [ {msg : "commission is more that User commission"}] });

            // update param    
                let param = {
                    last_modified_by :  ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                    last_modified_by: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid, //str user id
                    last_modified_on: isodate //dt current date time
                }

                param["wallet"+operatorId+"_comm"] = req.body.commisionPercentage
                param["wallet"+operatorId+"_target_status"] = req.body.targetStatus == 1 ?  1 : 0 // it should be 1 and 0, resolved front end issue from backend
                param["wallet"+operatorId+"_target"] = req.body.target
                param["wallet"+operatorId+"_reward"] = req.body.reward

            // search param
                searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    slab_uuid: req.body.slab_uuid, //str slab_uuid
                }

            // get old slab details
                const oldSlabDetails = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, ["wallet"+operatorId+"_comm AS oldCommissionPercent"], 'slab_id', 'ASC', 1, 0)
                if(oldSlabDetails.length == 0) return res.status(400).json({ errors: [ {msg : 'Slab not found'}]})

            // transaction start
            let startTransaction = await sqlQuery.specialCMD('transaction')

            // fire sql query to update
                const lisResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // checking sql responce
                if (!lisResult) {
                    throw new HttpException(500, 'Something went wrong');
                }

            // generating proper message
                const { affectedRows, changedRows, info } = lisResult;
                const message = !affectedRows ? 'slab manager not found' :
                    affectedRows && changedRows ? 'slab manager updated successfully' : 'Details Updated';

            // update commission and slab of downline agent
                if (affectedRows && changedRows){
                    // oldCommissionPercent = oldSlabDetails[0].oldCommissionPercent
                    // newCommissionPercent = req.body.commisionPercentage
                    // 1- find all agent who have same slab whose commission is more then given commission
                    //      1- read one agent detial and update its slab
                    //      2- add details in the update list
                    //      3- get the agent slab list whose commission is more then given commission
                    //          1-  take that slab and call same function
                    let commissionDecreasePercent = (Number(oldSlabDetails[0].oldCommissionPercent) -  Number(req.body.commisionPercentage)) / Number(oldSlabDetails[0].oldCommissionPercent)
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

                    let updateResponce = await this.updateAgentCommFun(req.body.slab_uuid,operatorId,lisOperatorDIds[0].operator_name,req.body.commisionPercentage,[],usertype,userid,accessDetails,commissionDecreasePercent)
                    // console.log(updateResponce)
                    if( updateResponce === 0) {
                        // rollback
                        let rollback = await sqlQuery.specialCMD('rollback')
                        return res.status(400).json({ errors: [ {msg : 'downline agent slab update error'}]})
                    }

                // make api call to update log
                    if(updateResponce.length > 0) {
                        const intResult = await httpRequestMakerCommon.httpPost("activity-log/multiple",{mulActivityLog:updateResponce})
                        var strLog = intResult == 1 ? 'Agent login log added successfully' : intResult == 2 ? 'Agent login log error' : 'end point not found'
                            // console.log('Server Log : '+strLog)
                        if(intResult != 1){
                            // rollback
                            let rollback = await sqlQuery.specialCMD('rollback')
                            return res.status(400).json({ errors: [ {msg : 'log was not added successfully'}]})
                        }
                    }

                    let commit = await sqlQuery.specialCMD('commit')
                    return res.status(200).send({message : 'Slab and downline commission update successfully'})
                }

            //sending message to front end
                let commit = await sqlQuery.specialCMD('commit')
                res.send({ message, info });
                
        } catch (error) {
            console.log(error);
            // rollback
            let rollback = await sqlQuery.specialCMD('rollback')
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateAgentCommFun = async (slab_uuid, operatorId, operatorName, newCommPer, updateList, usertype, userid, accessDetails, commissionDecreasePercent) =>{ 
        try{

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // 1- find all agent who have same slab whose commission is more then given commission
                let searchKeyValue = {
                    slab_uuid : slab_uuid
                }
                var key = ['userid','CAST(user_uuid AS CHAR(16)) AS user_uuid','op'+operatorId+'_comm AS oldCommPer']
                const lisUserCommission = await sqlQueryReplica.searchQueryNoLimit(this.tableName4, searchKeyValue, key, 'userid', 'ASC')
                // console.log("lisUserCommission ",lisUserCommission)
                if(lisUserCommission.length == 0) return updateList
                
                let i, userCommission, userDetails

                for (i =0; i < lisUserCommission.length; i++){
                    userCommission = lisUserCommission[i]
                    // 1- read one agent detial and update its slab
                        userDetails = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid : userCommission.user_uuid,Active : 1}, ['username','full_name','mobile','region_id','usertype_id'], 'userid', 'ASC', 1, 0)
                        // console.log('i ',i," userDetails ",userDetails)
                        if(userDetails.length == 0) continue

                    // 2- add details in the update list
                        if( newCommPer != userCommission.oldCommPer){
                            updateList.push({ 
                                userid : userCommission.userid,
                                username : userDetails[0].username,
                                user_uuid : userCommission.user_uuid,
                                full_name : userDetails[0].full_name,
                                mobile : userDetails[0].mobile ? userDetails[0].mobile : 0,
                                created_on : isodate,
                                created_by_type : userid, // 1- Admin ,2- Member
                                user_type : userDetails[0].usertype_id, // role
                                ip_address : accessDetails.userIpAddress,
                                mac_address : accessDetails.userMacAddress,
                                os_details : accessDetails.userOsDetails,
                                imei_no : accessDetails.userImeiNumber,
                                gcm_id : accessDetails.userGcmId,  // to send notification
                                app_version : accessDetails.userAppVersion,  // our app version
                                source : accessDetails.userApplicationType,  // 1: web, 2 : app
                                description : "comm Per change for "+operatorName, 
                                activity_type : 18, // 1-Login;2-Change Password;3-Change Profile
                                old_value : userCommission.oldCommPer,
                                modified_value : newCommPer,
                                region_id : userDetails[0].region_id
                            })
                        }
                    // 3- get the agent slab list whose commission is more then given commission
                        let slabSearchParem = { user_uuid : userCommission.user_uuid }
                        slabSearchParem['wall'+operatorId+'_comm_gat'] = newCommPer
                        let agentSlabList = await sqlQueryReplica.searchQueryNoLimit(this.tableName1,slabSearchParem,['slab_uuid','wallet'+operatorId+'_comm as slabComm'],'userid','ASC')
                        if(agentSlabList.length == 0) continue
                    //    1-  take that slab and call same function
                        let updateSlab, childagentSlabList, decreasedCommission, childUpdate,j = 0
                        // decreasedCommission = Number(userCommission.oldCommPer) - (Number(userCommission.oldCommPer) * commissionDecreasePercent)
                        decreasedCommission = Number(agentSlabList[0].slabComm) - (Number(agentSlabList[0].slabComm) * Number(commissionDecreasePercent)) 
                        decreasedCommission = decreasedCommission < 0 ? 0 : decreasedCommission
                        for(j = 0; j < agentSlabList.length; j++){
                            // console.log('j ', j)
                            childagentSlabList = agentSlabList[j]
                            let updateValue = {}
                            updateValue['wallet'+operatorId+'_comm'] = decreasedCommission
                            updateSlab = await sqlQuery.updateQuery(this.tableName1, updateValue, {slab_uuid : childagentSlabList.slab_uuid})
                            childUpdate = await this.updateAgentCommFun(childagentSlabList.slab_uuid,operatorId,operatorName,decreasedCommission,updateList,usertype,userid,accessDetails,commissionDecreasePercent)
                            if(childUpdate == 0) return 0
                            updateList = childUpdate
                        }
                }
                // console.log('update ',updateList)
                // update all child commission percent
                let param = {}
                param['op'+operatorId+'_comm'] =  newCommPer
                let updateResponce = await sqlQuery.updateQuery(this.tableName4,param,searchKeyValue)
                // console.log(updateResponce)
                return updateList

        }catch (error) {
            console.log(error);
            return 0
        }
    }

    //now following function are for default flabs
    // create default slab 
    createDefaultSlab = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
         //   console.log('slab/createDefaultSlab',JSON.stringify(req.body), JSON.stringify(req.query))
            //check if user is real
            var searchKeyValue = {
                user_uuid: req.body.user_detials.user_uuid, //str user_uuid
                Active : 1
            }
            var key = ["userid","comm_type"]
            var orderby = "userid"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponce0 = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 100, 0)

            // chek the user commission type for agent only
            if(!(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                // const listCommissionType = await sqlQuery.searchQuery(this.tableName3,{user_uuid : req.body.user_detials.user_uuid},["comm_type"],'userid','ASC',1,0)
                if(lisResponce0[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set, action not allowed'}]})
                if(lisResponce0[0].comm_type != 2) {
                let type = lisResponce0[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                return res.status(400).json({ errors: [ {msg : 'User have '+type+ " commission so it dont have any slabs"}] });
                }
            }

            // check sql response
            if (!lisResponce0) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponce0.length === 0) {
                return res.status(400).send({ message: 'user not found' });
            }

            //check if slab manager is created or not for masterSlab
            var searchKeyValue = {
                slab_uuid: req.body.masterSlab //str slab_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to check slab
            var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // send responce to the frontend accordingly
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!objResponce[0]['COUNT(1)']) {
                return res.status(400).send({ message: 'no masterSlab slab id found !!' })
            }

            //check if slab manager is created or not for distributorSlab
            var searchKeyValue = {
                slab_uuid: req.body.distributorSlab // str slab_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to check slab uuid
            var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // send responce to the frontend accordingly
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!objResponce[0]["COUNT(1)"]) {
                return res.status(400).send({ message: 'no distributorSlab slab id found !!' })
            }

            //check if slab manager is created or not for masSubDistributorSlab
            var searchKeyValue = {
                slab_uuid: req.body.masSubDistributorSlab // str slab_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to check slab uuid
            var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // send responce to the frontend accordingly
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!objResponce[0]["COUNT(1)"]) {
                return res.status(400).send({ message: 'no masSubDistributorSlab slab id found !!' })
            }

            //check if slab manager is created or not for SubDistributorSlab
            var searchKeyValue = {
                slab_uuid: req.body.SubDistributorSlab //str slab_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to check slab_uuid
            var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // send responce to the frontend accordingly
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!objResponce[0]["COUNT(1)"]) {
                return res.status(400).send({ message: 'no SubDistributorSlab slab id found !!' })
            }

            //check if slab manager is created or not
            var searchKeyValue = {
                slab_uuid: req.body.masRetailerSlab, // str slab_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to check slab_uuid
            var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // send responce to the frontend accordingly
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!objResponce[0]["COUNT(1)"]) {
                return res.status(400).send({ message: 'no masRetailerSlab slab id found !!' })
            }

            //check if slab manager is created or not
            var searchKeyValue = {
                slab_uuid: req.body.retailerSlab //str slab_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to check slab_uuid
            var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)
                // send responce to the frontend accordingly
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!objResponce[0]["COUNT(1)"]) {
                return res.status(400).send({ message: 'no retailerSlab slab id found !!' })
            }

            //create the default slab for user
            // parameter for sql query
            var param = {
                default_slab_uuid: "uuid()",
                userid: lisResponce0[0].userid, // str userid
                user_uuid: req.body.user_uuid, //str user uuid
                m_dis: req.body.masterSlab, // str slab_uuid
                dis: req.body.distributorSlab, // str slab_uuid
                m_sub_dis: req.body.masSubDistributorSlab, // str slab_uuid
                sub_dis: req.body.SubDistributorSlab, // str slab_uuid
                m_retailer: req.body.masRetailerSlab, // str slab_uuid
                retailer: req.body.retailerSlab // str slab_uuid
            }

            //fire sql query add data in db
            const objResult = await sqlQuery.createQuery(this.tableName2, param)
                // check sql responce
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            // send responce to front end
            res.status(201).send({ message: 'default slab successfully created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //get default slab id 
    getDefaultSlabId = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('slab/getDefaultSlabId',JSON.stringify(req.body), JSON.stringify(req.query))
            // chek the user commission type for agent only
            if(!(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                const listCommissionType = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid : req.body.user_detials.user_uuid,Active : 1},["comm_type"],'userid','ASC',1,0)
                if(listCommissionType.length === 0) return res.status(400).json({ errors: [ {msg :'user not found'}]})
                if(listCommissionType[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set, action not allowed'}]})
                if(listCommissionType[0].comm_type != 2) {
                let type = listCommissionType[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                return res.status(400).json({ errors: [ {msg : 'User have '+type+ " commission so it dont have any slabs"}] });
                }
            }
            
            // sql search paramaters
            var searchKeyValue = {
                user_uuid: req.body.user_detials.user_uuid // user user_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "default_slab_uuid"
            var ordertype = "ASC"

            // fire sql query to get str default slab uuid, str masterSlab, str distributorSlab, str masterdistributorSlab, str subdistributorSlab, str masterRelationSlab, str retailserSlab
            const lisResponse = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

            // check sql response
            if (!lisResponse) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse[0]["COUNT(1)"]) {
                //create the default slab for user
                // parameter for sql query
                var param = {
                    default_slab_uuid: "uuid()",
                    userid: req.body.user_detials.userid, // str userid
                    user_uuid: req.body.user_detials.user_uuid, //str user uuid
                }

                //fire sql query add data in db
                const objResult = await sqlQuery.createQuery(this.tableName2, param)
                    // check sql responce
                if (!objResult) {
                    throw new HttpException(500, 'Something went wrong');
                }
            }

            // sql search paramaters
            var searchKeyValue = {
                user_uuid: req.body.user_detials.user_uuid // user user_uuid
            }
            var key = ["CAST(default_slab_uuid AS CHAR(16)) AS default_slab_uuid", "CAST(slab_1 AS CHAR(16)) AS slab_1","slab_name_1", "CAST(slab_2 AS CHAR(16)) AS slab_2","slab_name_2", "CAST(slab_3 AS CHAR(16)) AS slab_3", "slab_name_3","CAST(slab_4 AS CHAR(16)) AS slab_4", "slab_name_4","CAST(slab_5 AS CHAR(16)) AS slab_5", "slab_name_5","CAST(slab_6 AS CHAR(16)) AS slab_6","slab_name_6"]
            var orderby = "default_slab_id"
            var ordertype = "ASC"

            // fire sql query to get str default slab uuid, str masterSlab, str distributorSlab, str masterdistributorSlab, str subdistributorSlab, str masterRelationSlab, str retailserSlab
            const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)
        
            // check sql response
            if (!lisResults) {
                throw new HttpException(500, 'Something went wrong');
            }

            const listUsers = await commonQueryCommon.getAllAgentType()
            if (!listUsers) return res.status(400).send({ message:'agent list not found'}) 
            
            var lisDefaultSlabList = []

            // console.log(req.body.user_detials.type)

            let intUserTypeFilter = (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin) ? 0 : req.body.user_detials.type

            for (var i = intUserTypeFilter; i < listUsers.length;i++){
                var objData = {
                    default_slab_uuid:lisResults[0].default_slab_uuid,
                    userType : listUsers[i].agent_type_name,
                    agent_type_uuid : listUsers[i].agent_type_uuid,
                    assignSlab : lisResults[0]['slab_'+listUsers[i].agent_type_id],
                    assignSlabName : lisResults[0]['slab_name_'+listUsers[i].agent_type_id] 
                }
                lisDefaultSlabList.push(objData)
            }

            // send responce to front end
            return res.status(200).send(lisDefaultSlabList)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //update default slabb id
    updateDefaultSlabId = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
           // console.log('slab/updateDefaultSlabId',JSON.stringify(req.body), JSON.stringify(req.query))
            // chek the user commission type for agent only
            if(!(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin)){
                const listCommissionType = await sqlQueryReplica.searchQuery(this.tableName3,{user_uuid : req.body.user_detials.user_uuid,Active : 1},["comm_type"],'userid','ASC',1,0)
                if(listCommissionType.length === 0) return res.status(400).json({ errors: [ {msg :'user not found'}]})
                if(listCommissionType[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set, action not allowed'}]})
                if(listCommissionType[0].comm_type != 2) {
                let type = listCommissionType[0].comm_type == 1 ? "Pre-Paid" : "Pre-Paid as 1st transaction"
                return res.status(400).json({ errors: [ {msg : 'User have '+type+ " commission so it dont have any slabs"}] });
                }
            }

            // search slab uuid to check if id is correct or not
            var searchKeyValue = {
                slab_name : req.body.slab_name, //str
                slab_uuid : req.body.slab_uuid
            }
            var key = ["COUNT(1)"]
            var orderby = "slab_name"
            var ordertype = "ASC"

            // fire sql query to get str slab_uuid, str slab_name
            const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

            // check sql response
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'Slab manager not found'}] });
            }

            const lisresponce = await commonQueryCommon.getAgentTypeId(req.body.agent_type_uuid)
            if(lisresponce === 0) return res.status(400).json({ errors: [ {msg : 'wrong update request'}] });
            const intAgentId = lisresponce[0].agent_type_id

            // sql query parameter
            var param = {}

            param['slab_'+intAgentId] = req.body.slab_uuid
            param['slab_name_'+intAgentId] = req.body.slab_name

            //update default slab table
            // sql query parameter
            var searchKeyValue = {
                default_slab_uuid: req.body.default_slab_uuid,
            }

            // fire sql query to update default slab
            const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // checking sql responce
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            const { affectedRows, changedRows, info } = objResult;

            // generating proper message
            const message = !affectedRows ? 'Default slab not found' :
                affectedRows && changedRows ? 'Default slab updated successfully' : 'Please select a slab';
            const status = !affectedRows ? 400 :
            affectedRows && changedRows ? 200 : 400;
            //sending message to front end
            if(status == 200) res.status(status).send({ message, info });
            else return res.status(400).json({ errors: [ {msg : message}] });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //get commission details
    getCommissionDetails = async (req,res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('slab/GetCommissionDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            //search agent and get commission type
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    userid : req.body.user_detials.userid, // str
                    Active : 1
                }
                var key = ["comm_type"]
                var orderby = "userid"
                var ordertype = "ASC"

                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype,1, 0)
                if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : "User not found"}] });

                if(lisResponce[0].comm_type == 0) return res.status(400).json({ errors: [ {msg :'Commission not set'}]})
            
            // if commission type is 1 Pre-Paid
                if(lisResponce[0].comm_type == 1){
                    var searchKeyValue = {
                        user_uuid : req.body.user_detials.user_uuid,
                        userid : req.body.user_detials.userid
                    }
                    var key = ["op1_uuid","op1_name","op1_wallet_active","op1_wallet_limit"]
                    var orderby = "userid"
                    var ordertype = "ASC"
    
                    const lisResponce = await sqlQueryReplica.searchQuery(this.tableName5, searchKeyValue, key, orderby, ordertype,1, 0)
                    if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : "User not found"}] });
                }
            
            // if commission type is 2 Post-Paid
                if(lisResponce[0].comm_type == 2){
                    var searchKeyValue = {
                        user_uuid : req.body.user_detials.user_uuid,
                        userid : req.body.user_detials.userid, // str
                        Active : 1
                    }
                    var key = ["comm_type"]
                    var orderby = "userid"
                    var ordertype = "ASC"
    
                    const lisResponce = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype,1, 0)
                    if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : "User not found"}] });
                }

            // if commission type is 0
                res.status(200).send({message:"Commission not set"})

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

module.exports = new slabController