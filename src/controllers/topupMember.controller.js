const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const commonQueryCommon = require('../common/commonQuery.common')
const memberModule = require('../models/topupMember.module')
const roles = require('../utils/userRoles.utils')
const REPORT_DIR = '/var/www/html/AFPNewBackendSystem/the_topup_reports';
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

class membersController {

    // table name
    tablename1 = "er_member_group"
    tablename2 = "er_member"
    tablename3 = "er_login"

    // ###################--Member Group--############################
    //function to create group
    createMemberGroup = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('TopUpMember/createMemberGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            // create group name
                //variables for sql query
                var param = { 
                    group_uuid : "uuid()",
                    group_name : req.body.name,
                    userid : req.body.user_detials.userid,
                    user_uuid : req.body.user_detials.user_uuid,
                    created_by_type : (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) ? 1 : 2,
                    created_by_id : (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid ,
                    active : 1
                }
                // fire sql query to create new group
                const objresult = await sqlQuery.createQuery(this.tablename1, param)

                //check result and responce accordingly
                res.status(201).send({ message: 'Group created successfully' });

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getMemberGroups = async ( req, res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('TopUpMember/getMemberGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            // search group name created by the Agent/ Admin
                var searchKeyValue = {
                    user_uuid : req.body.user_detials.user_uuid,
                    active : 1,
                }
                var key = ["CAST(group_uuid AS CHAR(16)) AS group_uuid","group_name AS groupName"]
                var orderby = "group_id"
                var ordertype = "DESC"
                const lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tablename1, searchKeyValue, key, orderby, ordertype)
            
            // check responce
                if (lisResponce1.length == 0) return res.status(204).send({message : "group list not found"})
            
              let intTotlaRecords = Number(lisResponce1.length)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords
                
                const lisResponce2 = await sqlQueryReplica.searchQuery(this.tablename1, searchKeyValue, key, orderby, ordertype, limit, offset)
            
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResponce2)
                }else{
                    res.status(200).send({
                        memberList : lisResponce2,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateMemberGroup = async ( req, res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('TopUpMember/UpdateMemberGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            // sql query
                var searchKeyValue = {
                    group_uuid : req.body.group_uuid,
                    user_uuid : req.body.user_detials.user_uuid,
                    active : 1,
                }
                var param = {
                    group_name : req.body.name,
                }
                var lisResponse = await sqlQuery.updateQuery(this.tablename1, param, searchKeyValue)

            // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = lisResponse;
                const message = !affectedRows ? 'Group not found' :
                    affectedRows && changedRows ? 'Group updated successfully' : 'Details Updated';

            // send responce to fornt end
                res.send({ message, info });

        }catch (error) {
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    deleteMessagegroup = async ( req, res) => {
        // check body and query
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('TopUpMember/deleteMemberGroup',JSON.stringify(req.body), JSON.stringify(req.query))
        // sql query
            var searchKeyValue = {
                group_uuid : req.query.group_uuid,
                user_uuid : req.body.user_detials.user_uuid,
                active : 1,
            }
            var param = {
                active : 0,
            }
            var lisResponse = await sqlQuery.updateQuery(this.tablename1, param, searchKeyValue)

        // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = lisResponse;
            const message = !affectedRows ? 'Group not found' :
                affectedRows && changedRows ? 'Group Deleted successfully' : 'Group already deleted';

        // send responce to fornt end
            res.send({ message, info });
    }

    // ########################--member function--##############################

    //function to add member to specific group
    // addMember = async (req, res) => {
    //     try{

    //         console.log(req.body)

    //         // check body and query
    //             const errors = validationResult(req);
    //             if (!errors.isEmpty()) {
    //                 return res.status(400).json({ errors: errors.array() });
    //             }
    //             console.log('TopUpMember/addMember',JSON.stringify(req.body), JSON.stringify(req.query))
    //         // check group name and uuid
    //             var searchKeyValue = {
    //                 group_uuid : req.body.group_uuid,
    //                 group_name : req.body.groupName,
    //                 user_uuid : req.body.user_detials.user_uuid,
    //                 active : 1,
    //             }
    //             var key = ["group_id"]
    //             var orderby = "group_name"
    //             var ordertype = "ASC"
    //             const lisResponce1 = await sqlQueryReplica.searchQuery(this.tablename1, searchKeyValue, key, orderby, ordertype,1,0)

    //             if(lisResponce1.length === 0) return res.status(400).json({ errors: [ {msg : "Group not found"}] });

    //         // create member name and uuid
    //             //variables for sql query

    //             var param = { 
    //                 member_uuid : "uuid()",
    //                 group_id : lisResponce1[0].group_id,
    //                 group_uuid : req.body.group_uuid,
    //                 created_by_type : (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) ? 1 : 2,
    //                 created_by_id : (req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin) ? req.body.user_detials.id : req.body.user_detials.userid ,
    //                 active : 1
    //             }

    //             if(req.body.memberName) param.name = req.body.memberName

    //             if(req.body.mobile){

    //                 if(req.body.mobile != 10 && !Number(req.body.mobile)) return res.status(400).json({ errors: [ {msg : 'Number should be of 10 digit'}] });

    //                 // check number already exist or not
    //                 let checkNum = await this.checkIfMemberEx(req.body.group_uuid,req.body.mobile)
    //                 // console.log(checkNum)
    //                 if (checkNum != 1) return res.status(400).json({ errors: [ {msg : 'Number already exist'}] });

    //                 param.mobile = req.body.mobile
    //                 param.amount = req.body.amount ? req.body.amount : 0
    //                 // fire sql query to create new group
    //                 const objresult = await sqlQuery.createQuery(this.tablename2, param)
                    
    //                 //check result and responce accordingly
    //                 res.status(201).send({ message: 'Member added successfully' });

    //             }else{
    //                 if(req.body.multipleMobile){
    //                     let mobileNumbers = req.body.multipleMobile.split("\r\n,")

    //                     let multipleInsert = []

    //                     for(var i = 0; i < mobileNumbers.length; i++){
    //                         // console.log()
    //                         param.mobile = mobileNumbers[i]
    //                         if(mobileNumbers[i].length != 10) continue 

    //                         // check number already exist or not
    //                         let checkNum = await this.checkIfMemberEx(req.body.group_uuid,mobileNumbers[i])
    //                         if (checkNum != 1) continue

    //                         // multipleInsert.push(param)
    //                         const objresult = await sqlQuery.createQuery(this.tablename2, param)
    //                     }

    //                     // const objresult = await sqlQuery.multiInsert(this.tablename2, multipleInsert)
                        
    //                     //check result and responce accordingly
    //                     res.status(201).send({ message: 'Member list added successfully' });
    //                 }else{
    //                     res.status(400).json({ errors: [ {msg : 'no number found'}] });
    //                 }
    //             }

    //     }catch(error){
    //         console.log(error);
    //         res.status(400).json({ errors: [ {msg : error.message}] });
    //     }
    // }


addMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const membersArray = req.body; // Array of members
    const user = req.body.user_detials; // Make sure this is passed properly (likely from auth middleware)

    let insertedCount = 0;
    let skipped = [];

    for (const memberData of membersArray) {
      const { group_uuid, groupName, memberName, mobile, amount } = memberData;

      // Check group exists
      const groupRes = await sqlQueryReplica.searchQuery(
        this.tablename1,
        { group_uuid, group_name: groupName, user_uuid: user.user_uuid, active: 1 },
        ['group_id'], 'group_name', 'ASC', 1, 0
      );

      if (groupRes.length === 0) {
        skipped.push({ member: memberData, reason: 'Group not found' });
        continue;
      }

      if (!mobile || mobile.length !== 10 || isNaN(mobile)) {
        skipped.push({ member: memberData, reason: 'Invalid mobile' });
        continue;
      }

      const exists = await this.checkIfMemberEx(group_uuid, mobile);
      if (exists !== 1) {
        skipped.push({ member: memberData, reason: 'Mobile already exists' });
        continue;
      }

      const param = {
        member_uuid: 'uuid()',
        group_id: groupRes[0].group_id,
        group_uuid,
        name: memberName || '',
        mobile,
        amount: amount || 0,
        created_by_type: [roles.Admin, roles.SubAdmin].includes(user.type) ? 1 : 2,
        created_by_id: [roles.Admin, roles.SubAdmin].includes(user.type) ? user.id : user.userid,
        active: 1
      };

      await sqlQuery.createQuery(this.tablename2, param);
      insertedCount++;
    }

    return res.status(201).json({
      message: 'Members processed',
      inserted: insertedCount,
      skipped,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: [{ msg: error.message }] });
  }
};


    
    checkIfMemberEx = async (group_uuid,number) => {
        try{

            let searchKeyValue ={
                group_uuid : group_uuid,
                active : 1,
                mobile : number
            }
            let searchResponce = await sqlQueryReplica.searchQuery(this.tablename2, searchKeyValue, ['member_uuid'], 'member_id', 'ASC', 1, 0)
            // console.log(searchResponce)
            if (searchResponce.length == 0) return 1
            return searchResponce[0]['member_uuid'] 

        }catch(error){
            throw error
        }
    }


    // get member list
    getMemberList = async ( req, res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('TopUpMember/getMemberList',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // check group name and uuid
                var searchKeyValue = {
                    group_uuid : req.query.group_uuid,
                    group_name : req.query.groupName,
                    user_uuid : req.body.user_detials.user_uuid,
                    active : 1,
                }
                let key = ["group_id"]
                var orderby = "group_name"
                var ordertype = "ASC"
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tablename1, searchKeyValue, key, orderby, ordertype,1,0)

                if(lisResponce1.length === 0) return res.status(400).json({ errors: [ {msg : "Group not found"}] });   

                // var offset = req.query.start
                // var limit = req.query.end - offset

            // search member name created by the Agent/ Admin in that region
                var searchKeyValue = {
                    group_id : lisResponce1[0].group_id,
                    group_uuid : req.query.group_uuid,
                    active : 1,
                }
                var orderby = "member_id"
                var ordertype = "DESC"

                key = ['count(1) AS count']

                let lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tablename2, searchKeyValue, key, orderby, ordertype)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                key = ["CAST(member_uuid AS CHAR(16)) AS member_uuid","name AS memberName","mobile", "amount"]

                const lisResponce2 = await sqlQueryReplica.searchQuery(this.tablename2, searchKeyValue, key, orderby, ordertype, limit, offset)
            
            // check responce
                // if (lisResponce2.length == 0) return res.status(204).send({message : "No user found"})
            
            // send response
                // res.status(200).send(lisResponce2)

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResponce2)
                }else{
                    res.status(200).send({
                        memberList : lisResponce2,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // // update member
    updateMemberDetails = async (req, res) => {
        try{
            // check body and query
            // console.log(req.body)
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('TopUpMember/updateMemberDetails',JSON.stringify(req.body), JSON.stringify(req.query))
                 const { group_uuid, groupName, user_detials, member_uuid, mobile, amount, memberName } = req.body;
            // check group name and uuid
                var searchKeyValue = {
                    group_uuid : group_uuid,
                    group_name : groupName,
                    user_uuid : user_detials.user_uuid,
                    active : 1,
                }
                var key = ["group_id"]
                var orderby = "group_name"
                var ordertype = "ASC"
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tablename1, searchKeyValue, key, orderby, ordertype,1,0)

                if(lisResponce1.length === 0) return res.status(400).json({ errors: [ {msg : "Group not found"}] });  

            // sql query
                // var searchKeyValue = {
                //     member_uuid : req.body.member_uuid,
                //     active : 1,
                // }
                 // 2. Fetch current member data
                // const existingMemberList = await sqlQueryReplica.searchQuery(
                //     // searchQuery = async(tableName, searchKeyValue, key, orderby, ordertype, limit, offset) => {
                //     this.tablename2,
                //     {searchKeyValue },
                //     ["member_uuid","mobile","amount"],
                //     "name",
                //     "ASC",
                //     1,
                //     0
                // );
               var searchKeyValue = {
                    member_uuid : req.body.member_uuid,
                    active : 1,
                }
                var orderby = "member_id"
                var ordertype = "DESC"

                key = ["member_uuid","mobile","amount","name"]

                let existingMemberList = await sqlQueryReplica.searchQueryNoLimit(this.tablename2, searchKeyValue, key, orderby, ordertype)

                if (existingMemberList.length === 0) {
                    return res.status(404).json({ errors: [{ msg: "Member not found" }] });
                }

                const existing = existingMemberList[0];

                // 3. Determine which fields have changed
                const updatedFields = {};
                if (mobile && mobile !== existing.mobile) {
                    // Check if new mobile exists in the same group
                    // const exists = await this.checkIfMemberEx(group_uuid, mobile);
                    // if (exists && exists !== member_uuid) {
                    //     return res.status(400).json({ errors: [{ msg: "Mobile number already exists in this group" }] });
                    // }
                let searchKeyValue ={
                    group_uuid : group_uuid,
                    active : 1,
                    mobile : mobile
                }
                let searchResponce = await sqlQueryReplica.searchQuery(this.tablename2, searchKeyValue, ['member_uuid','group_uuid','mobile'], 'member_id', 'ASC', 1, 0)
                 console.log(searchResponce)
                    if (searchResponce && searchResponce.length > 0){
                        return res.status(400).json({ errors: [{ msg: "Mobile number already exists in this group" }] });
                    }
                    updatedFields.mobile = mobile;
                }

                if (amount && amount !== existing.amount) {
                    updatedFields.amount = amount;
                }

                if (memberName && memberName !== existing.name) {
                    updatedFields.name = memberName;
                }

                // If no changes, respond early
                if (Object.keys(updatedFields).length === 0) {
                    return res.status(200).json({ message: "No changes detected" });
                }

                // 4. Proceed with update
                updatedFields.group_id = lisResponce1[0].group_id;
                updatedFields.group_uuid = group_uuid;

                const updateRes = await sqlQuery.updateQuery(this.tablename2, updatedFields, {
                    member_uuid,
                    active: 1,
                });

                const { affectedRows, changedRows, info } = updateRes;
                const message = affectedRows && changedRows
                    ? "Member updated successfully"
                    : "Member data submitted but no changes were made";

                res.status(200).json({ message, info });
            //     var param = {
            //         group_id : lisResponce1[0].group_id,
            //         group_uuid : req.body.group_uuid,
            //         mobile : req.body.mobile,
            //         amount : req.body.amount
            //     }
            //     if(req.body.memberName) param.name = req.body.memberName
            //     // console.log(param);

            //     // check number already exist or not
            //     let checkNum = await this.checkIfMemberEx(req.body.group_uuid,req.body.mobile)
            //     // console.log(checkNum)
            //     if (checkNum != 1 && checkNum != req.body.member_uuid ) return res.status(400).json({ errors: [ {msg : 'Number already exist'}] });

            //     var lisResponse = await sqlQuery.updateQuery(this.tablename2, param, searchKeyValue)

            // // check if the result is there and responce accordingly
            //     const { affectedRows, changedRows, info } = lisResponse;
            //     const message = !affectedRows ? 'Member not found' :
            //         affectedRows && changedRows ? 'Member updated successfully' : 'Details Updated';

            // // send responce to fornt end
            //     res.send({ message, info });
            //     // console.log(message)

        }catch (error) {
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
   // updateMemberDetails = async (req, res) => {
//     try {
//         // Validate request
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         console.log('TopUpMember/updateMemberDetails', JSON.stringify(req.body), JSON.stringify(req.query));

//         const { group_uuid, groupName, user_detials, member_uuid, mobile, amount, memberName } = req.body;

//         // 1. Validate group exists
//         const groupSearchParams = {
//             group_uuid,
//             group_name: groupName,
//             user_uuid: user_detials.user_uuid,
//             active: 1,
//         };
//         const groupKey = ["group_id"];
//         const groupList = await sqlQueryReplica.searchQuery(this.tablename1, groupSearchParams, groupKey, "group_name", "ASC", 1, 0);
//         if (groupList.length === 0) {
//             return res.status(400).json({ errors: [{ msg: "Group not found" }] });
//         }

//         const group_id = groupList[0].group_id;

//         // 2. Fetch current member data
//         const existingMemberList = await sqlQueryReplica.searchQuery(
//             this.tablename2,
//             { member_uuid, active: 1 },
//             ["member_uuid","mobile","amount"],
//             "name",
//             "ASC",
//             1,
//             0
//         );

//         if (existingMemberList.length === 0) {
//             return res.status(404).json({ errors: [{ msg: "Member not found" }] });
//         }

//         const existing = existingMemberList[0];

//         // 3. Determine which fields have changed
//         const updatedFields = {};
//         if (mobile && mobile !== existing.mobile) {
//             // Check if new mobile exists in the same group
//             const exists = await this.checkIfMemberEx(group_uuid, mobile);
//             if (exists && exists !== member_uuid) {
//                 return res.status(400).json({ errors: [{ msg: "Mobile number already exists in this group" }] });
//             }
//             updatedFields.mobile = mobile;
//         }

//         if (amount && amount !== existing.amount) {
//             updatedFields.amount = amount;
//         }

//         if (memberName && memberName !== existing.name) {
//             updatedFields.name = memberName;
//         }

//         // If no changes, respond early
//         if (Object.keys(updatedFields).length === 0) {
//             return res.status(200).json({ message: "No changes detected" });
//         }

//         // 4. Proceed with update
//         updatedFields.group_id = group_id;
//         updatedFields.group_uuid = group_uuid;

//         const updateRes = await sqlQuery.updateQuery(this.tablename2, updatedFields, {
//             member_uuid,
//             active: 1,
//         });

//         const { affectedRows, changedRows, info } = updateRes;
//         const message = affectedRows && changedRows
//             ? "Member updated successfully"
//             : "Member data submitted but no changes were made";

//         res.status(200).json({ message, info });

//     } catch (error) {
//         console.error("Update Member Error:", error);
//         res.status(500).json({ errors: [{ msg: error.message }] });
//     }
// };

    // delete member 
    deleteMember = async( req, res)=>{
        try{ 
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }  
                console.log('TopUpMember/deleteMember',JSON.stringify(req.body), JSON.stringify(req.query))
            // sql query
                var searchKeyValue = {
                    member_uuid : req.query.member_uuid,
                    active : 1,
                }
                var param = {
                    active : 0,
                }
                var lisResponse = await sqlQuery.updateQuery(this.tablename2, param, searchKeyValue)

            // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = lisResponse;
                const message = !affectedRows ? 'Member not found' :
                    affectedRows && changedRows ? 'Member Deleted successfully' : 'Member already deleted';

            // send responce to fornt end
                res.send({ message, info }); 

        }catch (error) {
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }   
    }

    //  get all user list and group name by sql join operation
    getUserGroupList = async (req,res) =>{
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                } 

                if ( ! req.query.pageNumber ) req.query.pageNumber = 0
                // console.log('TopUpMember/getUserGroupList',JSON.stringify(req.body), JSON.stringify(req.query))
            // limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset
            
            // sql search param
                var param = {
                    // parent_id : req.body.user_detials.userid,
                    region_ids : req.body.user_detials.region_list
                }
                // optional search param
                // if(req.query.userid) param.username = req.query.userid
                 if (req.query.userid) {
                const userid = req.query.userid;
                param.username = userid.startsWith("AFP-") ? userid : `AFP-${userid}`;
              }
                if(req.query.name) param.full_name = req.query.name
                if(req.query.agent_type_uuid){
                    const lisAgentTypeId = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid)
                    if(lisAgentTypeId.length == 0) return res.status(400).json({ errors: [ {msg : "Agent type not found"}] });
                    param.agent_type_id = lisAgentTypeId[0].agent_type_id
                }

                // if parameters are not proper
                if(Object.keys(param).length == 0) return res.status(400).json({ errors: [ {msg : "Improper search parameter"}] });

                const lisTotalRecords = await memberModule.getUserGroupListCount(param);

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // make module request to get data
                const lisResponce1 = await memberModule.getUserGroupList(param, limit, offset);
                // if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "Group list not found"}] });


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
                // res.status(200).send(lisResponce1)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

downloadUserGroupList = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const param = {
      region_ids: req.body.user_detials.region_list
    };

    if (req.query.userid) {
      const userid = req.query.userid;
      param.username = userid.startsWith('AFP-') ? userid : `AFP-${userid}`;
    }

    if (req.query.name) param.full_name = req.query.name;

    if (req.query.agent_type_uuid) {
      const lisAgentTypeId = await commonQueryCommon.getAgentTypeId(req.query.agent_type_uuid);
      if (lisAgentTypeId.length === 0) return res.status(400).json({ errors: [{ msg: 'Agent type not found' }] });
      param.agent_type_id = lisAgentTypeId[0].agent_type_id;
    }

    if (Object.keys(param).length === 0) {
      return res.status(400).json({ errors: [{ msg: 'Improper search parameter' }] });
    }

    const totalRecordsResult = await memberModule.getUserGroupListCount(param);
    const totalRecords = Number(totalRecordsResult[0]?.count || 0);
    const pageLimit = Number(process.env.PER_PAGE_COUNT);
    const pageCount = totalRecords % pageLimit === 0 ? totalRecords / pageLimit : Math.floor(totalRecords / pageLimit) + 1;

    const offset = req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * pageLimit : 0;
    const limit = req.query.pageNumber > 0 ? pageLimit : totalRecords;

    const data = await memberModule.getUserGroupList(param, limit, offset);

    // if pageNumber > 0, send paginated result
    if (req.query.pageNumber > 0) {
      return res.status(200).json({
        reportList: data,
        totalRepords: totalRecords,
        pageCount,
        currentPage: Number(req.query.pageNumber),
        pageLimit,
      });
    }

   const now = new Date();
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
    const fileName = `User_Group_List_${dateStr}_${timeStr}.xlsx`;
    const filePath = path.join(REPORT_DIR, fileName);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (Date.now() - stats.mtimeMs < 30 * 60 * 1000) {
        return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
      }
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('User Group List');

    if (data.length > 0) {
      sheet.columns = Object.keys(data[0]).map(key => ({
        header: key,
        key,
        width: key.length < 20 ? 20 : key.length + 5
      }));
      sheet.addRows(data);
    }

    await workbook.xlsx.writeFile(filePath);
    fs.chmodSync(filePath, 0o644);

    // Delete after 30 minutes
    setTimeout(() => {
      fs.access(filePath, fs.constants.F_OK, err => {
        if (!err) {
          fs.unlink(filePath, err => {
            if (err) console.error('Failed to delete:', filePath, err);
            else console.log('Deleted file:', fileName);
          });
        }
      });
    }, 30 * 60 * 1000);

    return res.json({
      success: true,
      downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}`,
    });

  } catch (error) {
    console.error('downloadUserGroupList error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

    // admin create agent group 
    addAgentGroup = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('TopUpMember/addAgentGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            // get agent user id
                var lisResponce1 = await sqlQueryReplica.searchQuery(this.tablename3,{user_uuid:req.body.user_uuid,Active : 1},["userid"],"userid","ASC",1,0)
                if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "Agent not found"}] });

            // variables
                var param = {
                    group_uuid : "uuid()",
                    userid : lisResponce1[0].userid,
                    user_uuid : req.body.user_uuid,
                    group_name : req.body.groupName,
                    created_by_type : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? 1 : 2,
                    created_by_id : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? req.body.user_detials.id : req.body.user_detials.userid,
                    active : 1
                };

            // sql query to create data
                const lisResponce2 = await sqlQuery.createQuery(this.tablename1,param)

            // send responce to front end
                res.status(201).send({ message :'Group created successfully'})

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //get agent group list
    getAgentGroupList = async(req, res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('TopUpMember/getAgentGroupList',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // check agent region and admin/sub admin region mates
                const agentCheck = await sqlQueryReplica.searchQuery(this.tablename3,{region_ids : req.body.user_detials.region_list,user_uuid : req.query.user_uuid,},['COUNT(1)'],'userid', 'ASC', 1, 0)
                if(agentCheck[0]["COUNT(1)"] == 0) return res.status(400).json({ errors: [ {msg : "agent not found"}] });

            // search param
                var searchKeyValue = {
                    user_uuid : req.query.user_uuid,
                    active : 1
                };
                var key = ["CAST(group_uuid AS CHAR(16)) AS group_uuid", "group_name"]

                const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tablename1, searchKeyValue, ['COUNT(1) AS count'],"group_id","DESC");

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            
            // make search query
                const lisReponce1 = await sqlQueryReplica.searchQuery(this.tablename1, searchKeyValue, key,"group_id","DESC", limit, offset);
                // if(lisReponce1.length == 0) return res.status(204).json({ errors: [ {msg : "agent group list not found"}] });

            // send response to frontend
            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisReponce1)
            }else{
                res.status(200).send({
                    reportList : lisReponce1,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
            }
                // res.status(200).send(lisReponce1);

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // search agent group member list
    getAgentMemberList = async(req,res)=>{
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('TopUpMember/getAgentMemberList',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset
            
            // search variables
                var searchKeyValue = {
                    group_uuid : req.query.group_uuid,
                    active : 1
                };
                var key = ["CAST(member_uuid AS CHAR(16)) AS member_uuid","name AS memberName","mobile"]

                const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tablename2, searchKeyValue, ['COUNT(1) AS count'], "member_id", "DESC");

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // search query gentrator
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tablename2, searchKeyValue, key, "member_id", "DESC", limit, offset);
                // if(lisResponce1.length == 0) return res.status(204).json({ errors: [ {msg : "member list not found"}] });

            // sned responce to front end
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
                // res.status(200).send(lisResponce1)

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // add agent group member 
    addAgentGroupMember = async (req, res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('TopUpMember/addAgentGroupMember',JSON.stringify(req.body), JSON.stringify(req.query))
            // search group id
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tablename1,{group_uuid : req.body.group_uuid},["group_id"],"group_id","ASc",1,0)
                if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "group name not found"}] });
            
            // sql create parameter
                var param = {
                    member_uuid : "uuid()",
                    group_id : lisResponce1[0].group_id,
                    group_uuid : req.body.group_uuid,
                    mobile : req.body.mobile,
                    created_by_type : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? 1 : 2,
                    created_by_id : ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? req.body.user_detials.id : req.body.user_detials.userid,
                    active : 1
                }
                if(req.body.memberName) param.name = req.body.memberName

            // create query 
                const lisResponce2 = await sqlQuery.createQuery(this.tablename2, param)
            
            // send responce to front end
                res.status(201).send({ message : "member added successfully"})

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // update member detials
    updateAgentMember = async (req, res) => {
        try{ 
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('TopUpMember/updateAgentMember',JSON.stringify(req.body), JSON.stringify(req.query))
            // search group id
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tablename1,{group_uuid : req.body.group_uuid},["group_id"],"group_id","ASc",1,0)
                if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "group name not found"}] }); 
            
            // update member details
                var param = {
                    group_id : lisResponce1[0].group_id,
                    group_uuid : req.body.group_uuid,
                    mobile : req.body.mobile,
                }  
                if(req.body.memberName) param.name = req.body.memberName

            const lisResponce2 = await sqlQuery.updateQuery(this.tablename2,param,{member_uuid : req.body.member_uuid,active : 1})

            // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = lisResponce2;
                const message = !affectedRows ? 'Member not found' :
                    affectedRows && changedRows ? 'Member updated successfully' : 'Details Updated';

            // send responce to fornt end
                res.send({ message, info });

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    deleteAgentMember = async (req,res) => {
        try{
            // check body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('TopUpMember/deleteAgentMember',JSON.stringify(req.body), JSON.stringify(req.query))
            // update member details
            var param = {
                active : 0
            }   

            const lisResponce2 = await sqlQuery.updateQuery(this.tablename2,param,{member_uuid : req.query.member_uuid, active : 1})

            // check if the result is there and responce accordingly
                const { affectedRows, changedRows, info } = lisResponce2;
                const message = !affectedRows ? 'Member not found' :
                    affectedRows && changedRows ? 'Member deleted successfully' : 'delete faild';

            // send responce to fornt end
                res.send({ message, info });
            
        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
}

module.exports = new membersController();