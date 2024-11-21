const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const commonQueryCommon = require('../common/commonQuery.common')
const memberModule = require('../models/topupMember.module')
const roles = require('../utils/userRoles.utils')

const walletMemberModule = require('../models/walletMember.module')

class walletMemberController {

    // table name
        tableName1 = "er_wallet_transfer_group"
        tableName2 = "er_wallet_transfer_group_members"
        tableName3 = "er_login"
    
    // wallet member controller #############################################
    // wallet transfer group related APIs
        createWalletMemberGroup = async (req,res) => { 
            try{ 
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('walletMember/createWalletMemberGroup',JSON.stringify(req.body), JSON.stringify(req.query))
                // crerate wallet group
                    // sql param
                    var param = {
                        group_uuid : "uuid()",
                        userid: ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? req.body.user_detials.id : req.body.user_detials.userid,
                        user_uuid : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? "0000000000000000" : req.body.user_detials.user_uuid,
                        group_name : req.body.groupName,
                        created_by_type : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? 1 : 2,
                        created_by_id : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? req.body.user_detials.id : req.body.user_detials.userid,
                        active : 1
                    };

                    // sql query to add data
                    const lisResponce1 = await sqlQuery.createQuery(this.tableName1, param)

                // send responce to front end
                    return res.status(201).send({message: "Group created successfully"})
                
            }catch(error){ 
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        getWalletMemberGroup = async (req,res) =>{
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }

                // limit and offset
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    // console.log('walletMember/getWalletMemberGroup',JSON.stringify(req.body), JSON.stringify(req.query))
                // console.log(req.body.user_detials)

                // get all user list
                    var searchKeyValue = {
                        created_by_type : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? 1 : 2,
                        created_by_id : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? req.body.user_detials.id : req.body.user_detials.userid,
                        active : 1
                    }
                    var key = ["group_name AS groupName","CAST(group_uuid AS CHAR(16)) AS group_uuid"]
 
                    const lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName1,searchKeyValue,key,"group_name","ASC")
                    if(lisResponce1.length == 0) return res.status(204).send({ message: 'Group list not found' });

                // sende responce to front end
                    res.status(200).send(lisResponce1)

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        updateWalletMembergroup = async(req,res) =>{
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('walletMember/updateWalletMemberGroup',JSON.stringify(req.body), JSON.stringify(req.query))
                // search param
                    var searchKeyValue = {
                        group_uuid : req.body.group_uuid,
                        active : 1
                    }
                    var param = {
                        group_name : req.body.groupName
                    }

                // update query
                    const lisResponce1 = await sqlQuery.updateQuery(this.tableName1,param,searchKeyValue)

                // check if the result is there and responce accordingly
                    const { affectedRows, changedRows, info } = lisResponce1;
                    const message = !affectedRows ? 'Group not found' :
                        affectedRows && changedRows ? 'Group name updated successfully' : 'Details Updated';

                // send responce to fornt end
                    res.send({ message, info });

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        deleteWalletMemberGroup = async(req,res) =>{
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('walletMember/deleteWalletMemberGroup',JSON.stringify(req.body), JSON.stringify(req.query))
                // search the group_uuid in er_wallet_transfer_group_members before delete
                    const lisResult = await sqlQueryReplica.searchQuery(this.tableName2,{group_uuid : req.body.group_uuid,},["COUNT(1)"],'userid','ASC',1,0)
                    if(lisResult[0]['COUNT(1)'] != 0) return res.status(400).json({ errors: [ {msg : 'group is not allowed to delete'}] });

                // search param
                    var searchKeyValue = {
                        group_uuid : req.body.group_uuid,
                        active : 1
                    }
                    var param = {
                        active : 0
                    }

                // update query
                    const lisResponce1 = await sqlQuery.updateQuery(this.tableName1,param,searchKeyValue)

                // check if the result is there and responce accordingly
                    const { affectedRows, changedRows, info } = lisResponce1;
                    const message = !affectedRows ? 'Group not found' :
                        affectedRows && changedRows ? 'Group deleted successfully' : 'group allready deleted';

                // send responce to fornt end
                    res.send({ message, info });

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }
    
    // wallet transfer group member realted APIs
        addWalletMemberGroupAgent = async (req,res) =>{
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('walletMember/addWalletMemberGroupAgent',JSON.stringify(req.body), JSON.stringify(req.query))
                // check the member group details
                    const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1,{"group_uuid" : req.body.group_uuid },["group_id","group_uuid"],"group_name","ASC",1,0)
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : 'Group not found'}] });

                // check agent details 
                    const lisResponce2 = await sqlQueryReplica.searchQuery(this.tableName3,{username : req.body.username,Active : 1},["userid","user_uuid"],"userid","ASC",1,0)
                    if(lisResponce2.length == 0) return res.status(400).json({ errors: [ {msg : 'User not found'}] });

                // variable to add data in table
                    var param = {
                        member_uuid : "uuid()",
                        group_id : lisResponce1[0].group_id,
                        group_uuid : lisResponce1[0].group_uuid,
                        userid : lisResponce2[0].userid,
                        user_uuid : lisResponce2[0].user_uuid,
                        created_by_type : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? 1 : 2,
                        created_by_id : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? req.body.user_detials.id : req.body.user_detials.userid,
                        active : 1
                    }

                // add data in the table
                    const lisResponce3 = await sqlQuery.createQuery(this.tableName2,param)

                // send responce to front end
                    return res.status(200).send({message:"user added successfully"})

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        getWalletMemberGroupAgent = async (req,res) =>{
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    // console.log('walletMember/getWalletMemberGroupAgent',JSON.stringify(req.body), JSON.stringify(req.query))
                // limit and offset
                    // var offset = req.query.start
                    // var limit = req.query.end - offset

                // using member group uuid to search all the user
                    const lisResponce1 = await walletMemberModule.getWalletMemberGroup(req.query.group_uuid);
                    if(lisResponce1.length == 0) return res.status(204).send({message:"no member found"})

                // send responce to front end 
                    res.status(200).send(lisResponce1)

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        getWalletMemberGroupAgentById = async (req,res) => {
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    // console.log('walletMember/getWalletMemberGroupAgentById',JSON.stringify(req.body), JSON.stringify(req.query))
                // using member group uuid to search all the user
                    const lisResponce1 = await walletMemberModule.getWalletMemberGroupAgentById(req.query.member_uuid);
                    if(lisResponce1.length == 0) return res.status(204).send({message:"no member found"})

                // send responce to front end 
                    res.status(200).send(lisResponce1)
                

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        updateWalletMemberGroupAgent = async (req,res) => {
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('walletMember/updateWalletMemberGroupAgent',JSON.stringify(req.body), JSON.stringify(req.query))
                // check the member group details
                    const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1,{"group_uuid" : req.body.group_uuid },["group_id","group_uuid"],"group_name","ASC",1,0)
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : 'Group not found'}] });

                // check agent details 
                    const lisResponce2 = await sqlQueryReplica.searchQuery(this.tableName3,{username : req.body.username,Active : 1},["userid","user_uuid"],"userid","ASC",1,0)
                    if(lisResponce2.length == 0) return res.status(400).json({ errors: [ {msg : 'User not found'}] });

                // use member uuid and update user name and group uuid
                    var searchKeyValue = {
                        member_uuid : req.body.member_uuid,
                        active : 1
                    }
                    var param = {
                        group_id : lisResponce1[0].group_id,
                        group_uuid : lisResponce1[0].group_uuid,
                        userid : lisResponce2[0].userid,
                        user_uuid : lisResponce2[0].user_uuid,
                    }

                // update the details
                    const lisResponce3 = await sqlQuery.updateQuery(this.tableName2,param,searchKeyValue)

                // check if the result is there and responce accordingly
                    const { affectedRows, changedRows, info } = lisResponce3;
                    const message = !affectedRows ? 'member not found' :
                        affectedRows && changedRows ? 'member updated successfully' : 'member not updated, details are same';

            // send responce to fornt end
                res.send({ message, info });

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        deleteWalletMemberGroupAgent = async (req, res) => {
            try{
                // check body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('walletMember/deleteWalletMemberGroupAgent',JSON.stringify(req.body), JSON.stringify(req.query))
                // use member uuid and update user name and group uuid
                    var searchKeyValue = {
                        member_uuid : req.query.member_uuid,
                        created_by_type : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? 1 : 2,
                        created_by_id : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? req.body.user_detials.id : req.body.user_detials.userid,
                        active : 1
                    }
                    var param = {
                        active : 0
                    }

                // update the details
                    const lisResponce1 = await sqlQuery.updateQuery(this.tableName2,param,searchKeyValue)

                // check if the result is there and responce accordingly
                    const { affectedRows, changedRows, info } = lisResponce1;
                    const message = !affectedRows ? 'member not found' :
                        affectedRows && changedRows ? 'member deleted successfully' : 'member not found';

                // send responce to fornt end
                    res.send({ message, info });
                
            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }
}

module.exports = new walletMemberController();