const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const redisMaster = require('../common/master/radisMaster.common')

const moduleModel = require('../models/agentModule.model');
const agentModule = require('../models/agent.module');
const AgentsDefaultRights = require('../utils/defaultAgentsRights.utils');
const role = require('../utils/userRoles.utils')

let moduleList =[];
class moduleController {
    tableName1 = "er_agent_modules"
    tableName2 = "er_agent_modules_permission"
    tableName3 = "er_agent_sub_module"
    // tableName4 = "er_agent_sub_module_permission"
    tableName5 = "er_login"

    constructor () {
        moduleList = AgentsDefaultRights.moduleList;
    }
    // basic crud operation for module
        addModule = async (req,res) => {
            try{
                // validate req .query anb .body
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('agentModule/addModule',JSON.stringify(req.body), JSON.stringify(req.query))
                // add data in the table 
                    var param = {
                        agent_module_name : req.body.moduleName,
                        agent_module_title : req.body.moduleTitle
                    };

                // fire sql query to add new module
                    var responce1 = await sqlQuery.createQuery(this.tableName1,param)

                // send responce to front end
                    res.status(201).send('Module created')

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        getAllModuleName = async (req,res) =>{
            try{
                // validate req .query anb .body
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    // console.log('agentModule/getAllModuleName',JSON.stringify(req.body), JSON.stringify(req.query))
                // search key list 
                    var key = ["agent_module_id","agent_module_name AS moduleName","agent_module_title AS moduleTitle"]

            
                // get module name, amodule tytle and id
                    var lisResponce = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName1, key,"agent_module_id","ASC")
                    if (lisResponce.length == 0) return res.status(400).json({ errors: [ {msg : "No module list found"}] });

                // send responce to front end
                    res.status(200).send(lisResponce)

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        updateModuleName = async (req,res) =>{
            try{
                // validate req .query anb .body
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('agentModule/updateModuleName',JSON.stringify(req.body), JSON.stringify(req.query))
                // update query variabels
                    var searchKeyValue = {
                        agent_module_id : req.body.agent_module_id
                    }
                    var keyValue = {
                        agent_module_name : req.body.moduleName, // module name
                        agent_module_title : req.body.moduleTitle, // module title
                    }

                //update query
                    const lisResponce = await sqlQuery.updateQuery(this.tableName1,keyValue, searchKeyValue)

                // check if the result is there and responce accordingly
                    const { affectedRows, changedRows, info } = lisResponce;
                    const message = !affectedRows ? 'Module not found' :
                        affectedRows && changedRows ? 'Module updated successfully' : 'Details Updated';

                // send responce to fornt end
                    res.status(200).send({ message, info });

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

    // basic crud opertion for sub module
        getAllSubModuleList = async(req,res) => {
            try{
                // validate req .query anb .body
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    // console.log('agentModule/getAllSubModuleList',JSON.stringify(req.body), JSON.stringify(req.query))
                // get all sub-module list
                    var key = ["agent_sub_module_id","agent_sub_module_name AS subModuleName","agent_sub_module_title AS subModuleTitle","agent_module_name AS moduleName"]
                    var searchKeyValue = {
                        agent_module_name : req.query.moduleName
                    };
                    const responceList = await sqlQueryReplica.searchQueryNoLimit(this.tableName3,searchKeyValue,key,"agent_module_id","ASC")
                    if (responceList.length == 0) return res.status(400).json({ errors: [ {msg : "No module list found"}] });

                // send responce to front end
                    res.status(200).send(responceList)
                
            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        } 

        addSubModule = async (req,res) =>{
            try{
                // validate req .query anb .body
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('agentModule/addSubModule',JSON.stringify(req.body), JSON.stringify(req.query))
                // verify the module name
                    var searchKeyValue = {
                        agent_module_name : req.body.moduleName,
                    }

                // search module id    
                    var key = ["agent_module_id"]
                    const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1,searchKeyValue, key,"agent_module_id","ASC",1,0)
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "module not found"}] });

                // add sub module name 
                    var keyValue = {
                        agent_sub_module_name : req.body.subModuleName,
                        agent_sub_module_title : req.body.subModuleTitle,
                        agent_module_id : lisResponce1[0].agent_module_id,
                        agent_module_name : req.body.moduleName
                    }  
                
                // make sql query to add data
                    const lisResponce2 = await sqlQuery.createQuery(this.tableName3,keyValue)

                // send responce to front end    
                    res.status(200).send({message:"sub-module is added sucessfully"})

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        updateSubModuleName = async (req,res) => {
            try{
                // validate req .query anb .body
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('agentModule/updateSubModuleName',JSON.stringify(req.body), JSON.stringify(req.query))
                // verify the module name
                    var searchKeyValue = {
                        agent_module_name : req.body.moduleName,
                    }

                // search module id    
                    var key = ["agent_module_id"]
                    const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1,searchKeyValue, key,"agent_module_id","ASC",1,0)
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "module not found"}] });

                // update sub module name 
                    var keyValue = {
                        agent_sub_module_name : req.body.subModuleName,
                        agent_sub_module_title : req.body.subModuleTitle,
                        agent_module_id : lisResponce1[0].agent_module_id,
                        agent_module_name : req.body.moduleName
                    }
                    var searchKeyValue = {
                        agent_sub_module_id : req.body.agent_sub_module_id
                    } 

                // make update query
                    const lisResponce2 = await sqlQuery.updateQuery(this.tableName3,keyValue,searchKeyValue)

                // check if the result is there and responce accordingly
                    const { affectedRows, changedRows, info } = lisResponce2;
                    const message = !affectedRows ? 'Sub-Module not found' :
                        affectedRows && changedRows ? 'Sub-Module updated successfully' : 'Details Updated';

                // send responce to fornt end
                    res.status(200).send({ message, info });
                
            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

    // api as required
        getSubModuleListByUserId = async(req, res) => {
            try{
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('agentModule/getSubModuleByUserId',JSON.stringify(req.body), JSON.stringify(req.query))
                var searchKeyValue = {
                    agent_module_name : req.query.moduleName,
                    user_uuid : req.body.user_detials.user_uuid
                };
                var key = ['sub_module_perm']
                var orderby = 'agent_module_name'
                var ordertype = 'ASC'

                var lisresponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)
                if(lisresponce1.length == 0) return res.status(204).json({ message : 'sub-module permission list not found'});
                // console.log(typeof(lisresponce1[0].sub_module_perm))
                res.status(200).send(JSON.parse(lisresponce1[0].sub_module_perm).sub_module_perm_list)

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        getSubModulePermissions = async(req, res) => {
            try{
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('agentModule/getSubModulePermission',JSON.stringify(req.body), JSON.stringify(req.query))
                var searchKeyValue = {
                    agent_module_name : req.query.moduleName,
                    user_uuid : req.body.user_detials.user_uuid
                };
                var key = ['sub_module_perm']
                var orderby = 'agent_module_name'
                var ordertype = 'ASC'

                var lisresponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)
                if(lisresponce1.length == 0) return res.status(400).json({ errors: [ {msg : 'sub-module permission list not found'}] });
                // console.log(typeof(lisresponce1[0].sub_module_perm))
                let permissionList = JSON.parse(lisresponce1[0].sub_module_perm).sub_module_perm_list
                let permission 
                for(let i = 0; i < permissionList.length; i++){
                    let {subModuleName, permDelete, permEdit, permAdd, permView} = permissionList[i]
                    if (subModuleName == req.query.subModuleName){
                        permission = {
                            permView,
                            permAdd,
                            permEdit,
                            permDelete
                        }
                        break 
                    }
                }
                if(!permission) return res.status(400).json({ errors: [ {msg : 'sub-module permission not found'}] });
                res.status(200).send(permission)

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        getAllModuleList = async (req,res) => {
            try{
                // verify the req body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }   
                    // console.log('agentModule/getAllModuleList',JSON.stringify(req.body), JSON.stringify(req.query))
                // limit and offset
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                
                // get the module list
                    // var key = ["agent_sub_module_name AS subModuleName","agent_sub_module_title AS subModuleTitle","agent_module_name AS ModuleName"]
                    // var lisResponce1 = await sqlQuery.searchQueryNoCon(this.tableName3,key,"agent_sub_module_id","ASC",limit,offset)
                    var lisResponce1 = await moduleModel.getAllModuleList();
                    if(lisResponce1.length == 0) return res.status(204).send({ message:"Module and sub module list not found"})
                
                // modify the responce
                    let i, result = [], module = []

                    for(i = 0; i<lisResponce1.length; i++) {
                        // console.log("result : ", result, "modiule ",module, "result[j] ",result[j])
                        if(module.includes(lisResponce1[i].ModuleName)){
                            result[module.indexOf(lisResponce1[i].ModuleName)].subModuleList.push({ 
                                subModuleName : lisResponce1[i].subModuleName,
                                subModuleTitle : lisResponce1[i].subModuleTitle
                            })
                        }else{
                            module.push(lisResponce1[i].ModuleName)
                            result.push({
                                moduleName : lisResponce1[i].ModuleName,
                                moduleTitle : lisResponce1[i].ModuleTitle,
                                subModuleList : [{
                                    subModuleName : lisResponce1[i].subModuleName,
                                    subModuleTitle : lisResponce1[i].subModuleTitle
                                }]
                            })
                        }
                    }
                
                // send responce 
                    res.status(200).send(result)

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        agentAssignRights = async (req,res) => {
            try{

                // verify the req body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('agentModule/agentAssignRights',JSON.stringify(req.body), JSON.stringify(req.query))
                // check if user name allrady in the data base
                    var boolCheck = await sqlQueryReplica.searchQuery(this.tableName2,{user_uuid : req.body.user_uuid},["COUNT(1)"],'userid',"ASC",1,0)
                    // console.log(boolCheck)
                    if(boolCheck[0]["COUNT(1)"] > 0) return res.status(400).json({ errors: [ {msg : "Permission data allready exist"}] });
                
                // get agent user id
                    let searchK = {
                        user_uuid : req.body.user_uuid,
                        Active : 1
                    }
                    if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                        // searchK.region_ids = req.body.user_detials.region_list.join(',');
                        if(req.body.user_detials.region_list.length != 7){
                            searchK.region_ids = req.body.user_detials.region_list.join(',')
                        }
                    }else{
                        searchK.child_ids =  req.body.user_detials.child_list.join(',');
                    }
        
                    const intAgentid = await sqlQueryReplica.searchQuery(this.tableName5,searchK,['userid','region_id'],'userid','ASC',1,0)
                    if (intAgentid.length == 0) return res.status(400).json({ errors: [ {msg : "user not found"}] });

                // get model list 
                    // const lisResponce1 = await sqlQuery.searchQueryNoConNolimit(this.tableName1,['agent_module_id','agent_module_name'],'agent_module_id','ASC')
                    // if (lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "Module List not found to verify data"}] });

                // get sub module list
                    const lisresponce2 = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName3,["agent_sub_module_id","agent_sub_module_name","agent_module_id","agent_module_name"],"agent_sub_module_id",'ASC')
                    if (lisresponce2.length == 0) return res.status(400).json({ errors: [ {msg : "Sub-Module List not found to verify data"}] });

                // get data from frontend
                    const oldModuleList = req.body.moduleList
                    let i = 0, j = -1
                    let newModuleList = [], newSubModuleList = []

                    for (i = 0; i < oldModuleList.length; i++){
                        if(lisresponce2[i].agent_sub_module_name != oldModuleList[i].subModuleName ) return res.status(400).json({ errors: [ {msg : "sub module list error"}] });
                        if(lisresponce2[i].agent_module_name != oldModuleList[i].ModuleName ) return res.status(400).json({ errors: [ {msg : "module list error"}] });
                        
                        if( j == -1 || newModuleList[j].agent_module_name != oldModuleList[i].ModuleName ){
                            newModuleList.push({ 
                                userid : intAgentid[0].userid,
                                user_uuid : req.body.user_uuid,
                                region_id : intAgentid[0].region_id,
                                agent_module_id : lisresponce2[i].agent_module_id,
                                agent_module_name : lisresponce2[i].agent_module_name,
                                perm_view : 0, 
                                sub_module_perm : {
                                    sub_module_perm_list:[]
                                }
                            })
                            j += 1
                        }
                        newModuleList[j].sub_module_perm.sub_module_perm_list.push({
                            agent_sub_module_id : lisresponce2[i].agent_sub_module_id,
                            subModuleName : lisresponce2[i].agent_sub_module_name,
                            permView : oldModuleList[i].viewPerm,
                            permAdd : oldModuleList[i].addPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
                            permEdit : oldModuleList[i].eidtPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
                            permDelete : oldModuleList[i].deletePerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0
                        })

                        if([oldModuleList[i].viewPerm,oldModuleList[i].addPerm,oldModuleList[i].eidtPerm,oldModuleList[i].deletePerm].includes(1) && oldModuleList[i].viewPerm == 1 ) newModuleList[j].perm_view = 1
                    
                    }

                    // make a join operation between er_agent_module, er_agent_sub_module, model list

                    // console.log("newModuleList ",newModuleList)

                // add data in module permission
                    let response = await sqlQuery.multiInsert(this.tableName2,newModuleList)

                    res.status(201).send({ message: "data added successfully"})

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        getAssignedModule = async(req, res) =>{
            try{
                // verify the req body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    // console.log('agentModule/getAssignModule',JSON.stringify(req.body), JSON.stringify(req.query))
                // limit and offset
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                
                // get the module list from module permission
                    // const lisResponse1 = await sqlQuery.searchQueryNoLimit(this.tableName2,{user_uuid : req.query.user_uuid },["agent_module_id","agent_module_name","perm_view","sub_module_perm"],"agent_module_id","ASC")
                        const lisResponce1 = await moduleModel.agentAssignRights(req.query.user_uuid)
                    // console.log(lisResponce1)
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "Permission list not found"}] });

                    let i, subModuleList, result = [], module = [], j =0

                    for(i = 0; i<lisResponce1.length; i++) {
                        // console.log(i)
                        // console.log("result : ", result, "modiule ",module, "result[j] ",result[j])
                        if(module.includes(lisResponce1[i].ModuleName)){
                            subModuleList = JSON.parse(lisResponce1[i].sub_module_perm).sub_module_perm_list
                            if(lisResponce1[i].subModuleName != subModuleList[j].subModuleName) return res.status(400).json({ errors: [ {msg : "Internal Query error"}] });
                            result[module.indexOf(lisResponce1[i].ModuleName)].subModuleList.push({ 
                                subModuleName : lisResponce1[i].subModuleName,
                                subModuleTitle : lisResponce1[i].subModuleTitle,
                                permView : subModuleList[j].permView,
                                permAdd : subModuleList[j].permAdd,
                                permEdit : subModuleList[j].permEdit,
                                permDelete : subModuleList[j].permDelete,
                            })
                            j += 1
                        }else{
                            j = 0
                            subModuleList = JSON.parse(lisResponce1[i].sub_module_perm).sub_module_perm_list
                            module.push(lisResponce1[i].ModuleName)
                            if(lisResponce1[i].subModuleName != subModuleList[j].subModuleName) return res.status(400).json({ errors: [ {msg : "Internal Query error"}] });
                            result.push({
                                moduleName : lisResponce1[i].ModuleName,
                                moduleTitle : lisResponce1[i].ModuleTitle,
                                subModuleList : [{
                                    subModuleName : lisResponce1[i].subModuleName,
                                    subModuleTitle : lisResponce1[i].subModuleTitle,
                                    permView : subModuleList[j].permView,
                                    permAdd : subModuleList[j].permAdd,
                                    permEdit : subModuleList[j].permEdit,
                                    permDelete : subModuleList[j].permDelete,
                                }]
                            })
                            j += 1
                        }
                    }

                    res.status(200).send(result)

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }


       updateAssignRights = async (req,res) => {
            try{
                // verify the req body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('agentModule/updateAssignRights',JSON.stringify(req.body), JSON.stringify(req.query))
                // sql quwery variables
                    var searchKeyValue = {
                        user_uuid : req.body.user_uuid
                    };

                    // force logout agent temperary fix
                    await sqlQuery.updateQuery(this.tableName5,{fource_logout : 1},{user_uuid: req.body.user_uuid,Active : 1})

                    if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                        // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                    }else{
                        searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
                    }

                    var key = ["agent_module_name","sub_module_perm","perm_view","sub_module_perm","agent_module_id"]

                // get agent permission list
                    var lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName2,searchKeyValue, key,"agent_module_id","ASC")
                    if(lisResponce1.length == 0){

                                // Get user
                        var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid","parent_id",'usertype_id', "username","userid"]
                        var orderby = "user_uuid"
                        var ordertype = "ASC"
                            const searchKeyValue = { user_uuid: req.body.user_uuid };
                            // fire sql query to get user id
                        var theAgent = await sqlQueryReplica.searchQuery(this.tableName5, searchKeyValue, key, orderby, ordertype, 1, 0)
                        if (theAgent.length == 0) {
                            return res.status(400).json({ errors: [ {msg : "User not found"}] });
                        }
                                
                        // get sub module list
                    
                        const lisresponce2 = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName3,["agent_sub_module_id","agent_sub_module_name","agent_module_id","agent_module_name"],"agent_sub_module_id",'ASC')
                        if (lisresponce2.length == 0) {
                            // rollback 
                            await sqlQuery.specialCMD('rollback')
                            return res.status(400).json({ errors: [ {msg : "Sub-Module List not found to verify data"}] })
                        };
                           const oldModuleList = req.body.moduleList
                        //  const oldModuleList = moduleList
                        let i = 0, j = -1
                        let newModuleList = [], newSubModuleList = []

                        for (i = 0; i < oldModuleList.length; i++){

                            if(lisresponce2[i].agent_sub_module_name != oldModuleList[i].subModuleName ){
                                // rollback 
                                let rollback = await sqlQuery.specialCMD('rollback')
                                return res.status(400).json({ errors: [ {msg : "sub module list error"}] });
                            }

                            if(lisresponce2[i].agent_module_name != oldModuleList[i].ModuleName ) {
                                // rollback 
                                let rollback = await sqlQuery.specialCMD('rollback')
                                return res.status(400).json({ errors: [ {msg : "module list error"}] });
                            }
                            
                            if( j == -1 || newModuleList[j].agent_module_name != oldModuleList[i].ModuleName ){
                                newModuleList.push({ 
                                    userid : theAgent[0].userid,
                                    user_uuid : req.body.user_uuid,
                                    agent_module_id : lisresponce2[i].agent_module_id,
                                    agent_module_name : lisresponce2[i].agent_module_name,
                                    perm_view : 0, 
                                    sub_module_perm : {
                                        sub_module_perm_list:[]
                                    }
                                })
                                j += 1
                            }
                            newModuleList[j].sub_module_perm.sub_module_perm_list.push({
                                agent_sub_module_id : lisresponce2[i].agent_sub_module_id,
                                subModuleName : lisresponce2[i].agent_sub_module_name,
                                permView : oldModuleList[i].viewPerm,
                                permAdd : oldModuleList[i].addPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
                                permEdit : oldModuleList[i].eidtPerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0,
                                permDelete : oldModuleList[i].deletePerm == 1 && oldModuleList[i].viewPerm == 1 ? 1 : 0
                            })

                            if( oldModuleList[i].viewPerm == 1 ) newModuleList[j].perm_view = 1
                        
                        }
                       // add data in module permission
                       let response = await sqlQuery.multiInsert(this.tableName2,newModuleList)
                        res.status(200).send({ 
                            response,
                            message: "data updated successfully"})
                        return console.log('New Module permissions created successfully');
                    }

                // go in the listResponce1 one by one and update one by one module
                    var oldModuleList = req.body.moduleList
                    let i,k, subModuleList,updateResponce, j = 0, update = 0 , view = 0

                    for( i=0 ; i<lisResponce1.length; i++ ){
                        if(lisResponce1[i].agent_module_name != oldModuleList[j].ModuleName){
                            j+=1
                            if(lisResponce1[i].agent_module_name != oldModuleList[j].ModuleName) return res.status(400).json({ errors: [ {msg : "module list is not proper"}] });
                        }
                        subModuleList = JSON.parse(lisResponce1[i].sub_module_perm).sub_module_perm_list
                        for (k = 0; k < subModuleList.length; k++) {
                            if(subModuleList[k].subModuleName != oldModuleList[j].subModuleName){
                                console.log("sub module name : ",subModuleList[k].subModuleName, oldModuleList[j].subModuleName)
                                j+=1
                                if(subModuleList[k].subModuleName != oldModuleList[j].subModuleName){
                                    console.log("sub module name after j update: ",subModuleList[k].subModuleName, oldModuleList[j].subModuleName)
                                    return res.status(400).json({ errors: [ {msg : "sub-module list is not proper"}] });
                                }
                            }
                            // check the status value
                            if(subModuleList[k].permView != oldModuleList[j].viewPerm || oldModuleList[j].viewPerm == 0){
                                console.log(subModuleList[k].subModuleName,"view perm update: ",subModuleList[k].permView, "view perm update: ",oldModuleList[j].subModuleName, oldModuleList[j].viewPerm)
                                subModuleList[k].permView = oldModuleList[j].viewPerm == 1 ? 1 : 0
                                update = 1
                            }
                            if(subModuleList[k].permAdd != oldModuleList[j].addPerm || oldModuleList[j].viewPerm == 0){
                                console.log(subModuleList[k].subModuleName,"add perm update: ",subModuleList[k].permAdd, "add perm update: ",oldModuleList[j].subModuleName,oldModuleList[j].addPerm)
                                subModuleList[k].permAdd = oldModuleList[j].addPerm == 1 && oldModuleList[j].viewPerm == 1 ? 1 : 0
                                update = 1
                            }
                            if(subModuleList[k].permEdit != oldModuleList[j].editPerm || oldModuleList[j].viewPerm == 0){
                                console.log(subModuleList[k].subModuleName,"edit perm update: ",subModuleList[k].permEdit, "edit perm update: ",oldModuleList[j].subModuleName,oldModuleList[j].editPerm)
                                subModuleList[k].permEdit = oldModuleList[j].editPerm == 1 && oldModuleList[j].viewPerm == 1 ? 1 : 0
                                update = 1
                            }
                            if(subModuleList[k].permDelete!= oldModuleList[j].deletePerm || oldModuleList[j].viewPerm == 0){
                                console.log(subModuleList[k].subModuleName,"delete perm update: ",subModuleList[k].permDelete, "delete perm update: ",oldModuleList[j].subModuleName, oldModuleList[j].deletePerm)
                                subModuleList[k].permDelete = oldModuleList[j].deletePerm == 1 && oldModuleList[j].viewPerm == 1 ? 1 : 0
                                update = 1
                            }
                            if(update == 1){
                                // update the value
                                console.log("update: ",subModuleList[k])
                                if( subModuleList[k].permView == 1) view = 1
                            }
                        }
                        lisResponce1[i].sub_module_perm = JSON.stringify({sub_module_perm_list : subModuleList})
                        if(update == 1){
                            console.log(lisResponce1[i].sub_module_perm)
                            lisResponce1[i].perm_view = view
                            updateResponce = await sqlQuery.updateQuery(this.tableName2,lisResponce1[i],{user_uuid : req.body.user_uuid,agent_module_name : lisResponce1[i].agent_module_name })
                            update = 0
                            view = 0

                            // console.log(`agent permission: AGENT_MODULE_PERMISSION_${lisResponce1[i].agent_module_id}_${req.body.user_uuid}` )
                            // redisMaster.delete(`AGENT_MODULE_PERMISSION_${lisResponce1[i].agent_module_id}_${req.body.user_uuid}`)
                       
                        }
                        console.log(`agent permission: AGENT_MODULE_PERMISSION_${lisResponce1[i].agent_module_id}_${req.body.user_uuid}` )
                        redisMaster.delete(`AGENT_MODULE_PERMISSION_${lisResponce1[i].agent_module_id}_${req.body.user_uuid}`)
                        // strModulePermission = await redisMaster.asyncGet(`AGENT_MODULE_PERMISSION_${moduleId[0]}_${req.body.user_detials.user_uuid}`)
                    }

                    res.status(200).send({ message: "agent permission updated successfully"})

            }catch (error) {
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }
        // //this function is use to remove the old permissions and create new permissions
        DeleteOldAssignRights = async (req,res) => {
          let transaction;
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                console.log('agentModule/updateAssignRights', JSON.stringify(req.body), JSON.stringify(req.query));
    
                // Start transaction
                transaction = await sqlQuery.specialCMD('transaction');

                // Force logout agent
                await sqlQuery.updateQuery(this.tableName5, { fource_logout: 1 }, { user_uuid: req.body.user_uuid, Active: 1 });

                // Get user
            var key = ["CAST(user_uuid AS CHAR(16)) AS user_uuid","parent_id",'usertype_id', "username","userid"]
            var orderby = "user_uuid"
            var ordertype = "ASC"
                const searchKeyValue = { user_uuid: req.body.user_uuid };
                // fire sql query to get user id
            var theAgent = await sqlQuery.searchQuery(this.tableName5, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (theAgent.length === 0) {
                // rollback 
               await sqlQuery.specialCMD('rollback')
                return res.status(400).json({ errors: [ {msg : 'User not found'}] });
            }
                if (req.body.user_detials.type !== role.Admin && req.body.user_detials.type !== role.SubAdmin) {
                    searchKeyValue.child_ids = req.body.user_detials.child_list.join(',');
                }

                const currentPermissions = await sqlQueryReplica.searchQueryNoLimit(
                    this.tableName2, searchKeyValue, 
                    ["agent_module_name", "sub_module_perm", "perm_view", "agent_module_id"], 
                    "agent_module_id", "ASC"
                );

                // Delete old permissions and clear cache
                await sqlQuery.deleteQuery(this.tableName2, { userid : theAgent[0].userid  });

                if(currentPermissions.length >0){
                for (const perm of currentPermissions) {
                    const cacheKey = `AGENT_MODULE_PERMISSION_${perm.agent_module_id}_${req.body.user_uuid}`;
                    await redisMaster.delete(cacheKey);
                }
            }
                 res.status(200).send({ message: " OLD Permissions successfully Deleted"})

                }catch (error) {
                    console.log(error);
                    res.status(400).json({ errors: [ {msg : error.message}] });
                }
        }

    
    
    

    
    
    
   
   
        getParentModuleList = async (req,res) =>{ 
            try{
                // verify the req body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    // console.log('agentModule/getParentModuleList',JSON.stringify(req.body), JSON.stringify(req.query))
                // get parent id

                    var searchKeyValue = {
                        user_uuid : req.query.user_uuid,
                        Active : 1
                    };

                    if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                        // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                        if(req.body.user_detials.region_list.length != 7){
                            searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                        }
                    }else{
                        searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
                    }
                    
                    const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName5,searchKeyValue,['parent_id'],'userid','ASC',1,0)
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: "parent id not found" });

                // get parent uuid
                    const lisResponce3 = await sqlQueryReplica.searchQuery(this.tableName2,{userid: lisResponce1[0].parent_id},['user_uuid'],'userid','ASC',1,0)
                    if(lisResponce3.length == 0) return res.status(400).json({ errors: "parent uuid not found" });

                // get parent paermission module
                    const lisResponce2 = await moduleModel.agentAssignRights(lisResponce3[0].user_uuid)
                    if(lisResponce2.length == 0) return res.status(400).json({ errors: "parent module permission not found" });
                    // console.log(lisResponce2)

                // filter the module 
                    let i, subModuleList, result = [], module = [], j =0
                    for(i = 0; i<lisResponce2.length; i++) {
                        // console.log(i)
                        // console.log("result : ", result, "modiule ",module, "result[j] ",result[j])
                        if(module.includes(lisResponce2[i].ModuleName)){
                            subModuleList = JSON.parse(lisResponce2[i].sub_module_perm).sub_module_perm_list
                            if(lisResponce2[i].subModuleName != subModuleList[j].subModuleName) return res.status(400).json({ errors: [ {msg : "Internal Query error"}] });
                            result[module.indexOf(lisResponce2[i].ModuleName)].subModuleList.push({ 
                                subModuleName : lisResponce2[i].subModuleName,
                                subModuleTitle : lisResponce2[i].subModuleTitle,
                                permView : subModuleList[j].permView,
                                permAdd : subModuleList[j].permAdd,
                                permEdit : subModuleList[j].permEdit,
                                permDelete : subModuleList[j].permDelete,
                            })
                            j += 1
                        }else{
                            if(lisResponce2[i].perm_view == 0) continue;
                            j = 0
                            subModuleList = JSON.parse(lisResponce2[i].sub_module_perm).sub_module_perm_list
                            module.push(lisResponce2[i].ModuleName)
                            if(lisResponce2[i].subModuleName != subModuleList[j].subModuleName) return res.status(400).json({ errors: [ {msg : "Internal Query error"}] });
                            result.push({
                                moduleName : lisResponce2[i].ModuleName,
                                moduleTitle : lisResponce2[i].ModuleTitle,
                                subModuleList : [{
                                    subModuleName : lisResponce2[i].subModuleName,
                                    subModuleTitle : lisResponce2[i].subModuleTitle,
                                    permView : subModuleList[j].permView,
                                    permAdd : subModuleList[j].permAdd,
                                    permEdit : subModuleList[j].permEdit,
                                    permDelete : subModuleList[j].permDelete,
                                }]
                            })
                            j += 1
                        }
                    }
                
                // send responce to front end
                    res.status(200).send(result)

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        parentAgentAssignRights = async (req,res) => {
            try{
                // verify the req body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('agentModule/parentAgentAssignRights',JSON.stringify(req.body), JSON.stringify(req.query))
                // chcek if module permissions are added allready
                    var boolCheck = await sqlQueryReplica.searchQuery(this.tableName2,{user_uuid : req.body.user_uuid},["COUNT(1)"],'userid',"ASC",1,0)
                    // console.log(boolCheck)
                    if(boolCheck[0]["COUNT(1)"] > 0) return res.status(400).json({ errors: [ {msg : "Permission data allready exist"}] });

                // get parent id
                    const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName5,{user_uuid : req.body.user_uuid,Active : 1},['userid','parent_id'],'userid','ASC',1,0)
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: "parent id not found" });

                // get parent uuid
                    const lisResponce3 = await sqlQueryReplica.searchQuery(this.tableName2,{userid: lisResponce1[0].parent_id},['user_uuid'],'userid','ASC',1,0)
                    if(lisResponce3.length == 0) return res.status(400).json({ errors: "parent uuid not found" });

                // get parent paermission module
                    const lisResponce2 = await moduleModel.agentAssignRights(lisResponce3[0].user_uuid)
                    if(lisResponce2.length == 0) return res.status(400).json({ errors: "parent module permission not found" });
                    // console.log(lisResponce2)  

                // for loop
                    const listModulePermission = req.body.moduleList
                    let i = 0, j = 0, k=0, param = [], moduleName = [], oldSubModuleLis = [], data = {}, subModuleLis = [], view = 0
                    
                    for (i=0; i<lisResponce2.length; i++){
                        // console.log(param)
                        if(moduleName.includes(lisResponce2[i].ModuleName)) continue;
                        if(lisResponce2[i] && listModulePermission[j] && lisResponce2[i].ModuleName == listModulePermission[j].ModuleName){
                            subModuleLis = []
                            oldSubModuleLis = JSON.parse(lisResponce2[i].sub_module_perm).sub_module_perm_list
                            view = 0
                            while(lisResponce2[i] && listModulePermission[j] && lisResponce2[i].ModuleName == listModulePermission[j].ModuleName){
                                data = {
                                    agent_sub_module_id : oldSubModuleLis[k].agent_sub_module_id,
                                    subModuleName : oldSubModuleLis[k].subModuleName,
                                    permView : listModulePermission[j].viewPerm == 1 ? listModulePermission[j].viewPerm : 0 ,
                                    permAdd : listModulePermission[j].addPerm == 1 && listModulePermission[j].viewPerm == 1 ? 1 : 0,
                                    permEdit : listModulePermission[j].eidtPerm == 1 && listModulePermission[j].viewPerm == 1 ? 1 : 0,
                                    permDelete : listModulePermission[j].deletePerm == 1 && listModulePermission[j].viewPerm == 1 ? 1 : 0,
                                }
                                if (data.permView == 1 || data.permAdd == 1 || data.permEdit == 1 || data.permDelete == 1) view = 1
                                j += 1
                                k += 1
                                subModuleLis.push(data)
                            }
                            k = 0
                            param.push({
                                userid : lisResponce1[0].userid,
                                user_uuid : req.body.user_uuid,
                                agent_module_id : lisResponce2[i].agent_module_id,
                                agent_module_name : lisResponce2[i].ModuleName,
                                perm_view : view,
                                sub_module_perm : {
                                    sub_module_perm_list : subModuleLis
                                }
                            })
                            // console.log(subModuleLis)
                            // console.log(param)
                        }else{
                            data = {
                                userid : lisResponce1[0].userid,
                                user_uuid : req.body.user_uuid,
                                agent_module_id : lisResponce2[i].agent_module_id,
                                agent_module_name : lisResponce2[i].ModuleName,
                                perm_view : 2,
                                sub_module_perm : lisResponce2[i].sub_module_perm
                            }
                            // console.log(lisResponce2[i].sub_module_perm)
                            // console.log(param)
                            param.push(data)
                        }
                        moduleName.push(lisResponce2[i].ModuleName)
                    }
                
                // add data in module permission
                    let response = await sqlQuery.multiInsert(this.tableName2,param)

                    res.status(200).send({message : "module permission added succfully"})

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        getParentAgentAssignRights = async (req,res) => {
            try{
                // verify the req body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    // console.log('agentModule/getParentAgentAssignRights',JSON.stringify(req.body), JSON.stringify(req.query))
                // limit and offset
                    var offset = req.query.start
                    var limit = req.query.end - offset
                
                // get the module list from module permission
                    // const lisResponse1 = await sqlQuery.searchQueryNoLimit(this.tableName2,{user_uuid : req.query.user_uuid },["agent_module_id","agent_module_name","perm_view","sub_module_perm"],"agent_module_id","ASC")
                        const lisResponce1 = await moduleModel.agentAssignRights(req.query.user_uuid)
                    // console.log(lisResponce1)
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "Permission list not found"}] });

                    let i, subModuleList, result = [], module = [], j =0

                    for(i = 0; i<lisResponce1.length; i++) {
                        if(lisResponce1[i].perm_view == 2) continue;
                        // console.log(i)
                        // console.log("result : ", result, "modiule ",module, "result[j] ",result[j])
                        if(module.includes(lisResponce1[i].ModuleName)){
                            subModuleList = JSON.parse(lisResponce1[i].sub_module_perm).sub_module_perm_list
                            if(lisResponce1[i].subModuleName != subModuleList[j].subModuleName) return res.status(400).json({ errors: [ {msg : "Internal Query error"}] });
                            result[module.indexOf(lisResponce1[i].ModuleName)].subModuleList.push({ 
                                subModuleName : lisResponce1[i].subModuleName,
                                subModuleTitle : lisResponce1[i].subModuleTitle,
                                permView : subModuleList[j].permView,
                                permAdd : subModuleList[j].permAdd,
                                permEdit : subModuleList[j].permEdit,
                                permDelete : subModuleList[j].permDelete,
                            })
                            j += 1
                        }else{
                            j = 0
                            subModuleList = JSON.parse(lisResponce1[i].sub_module_perm).sub_module_perm_list
                            module.push(lisResponce1[i].ModuleName)
                            if(lisResponce1[i].subModuleName != subModuleList[j].subModuleName) return res.status(400).json({ errors: [ {msg : "Internal Query error"}] });
                            result.push({
                                moduleName : lisResponce1[i].ModuleName,
                                moduleTitle : lisResponce1[i].ModuleTitle,
                                subModuleList : [{
                                    subModuleName : lisResponce1[i].subModuleName,
                                    subModuleTitle : lisResponce1[i].subModuleTitle,
                                    permView : subModuleList[j].permView,
                                    permAdd : subModuleList[j].permAdd,
                                    permEdit : subModuleList[j].permEdit,
                                    permDelete : subModuleList[j].permDelete,
                                }]
                            })
                            j += 1
                        }
                    }

                    res.status(200).send(result) 
                    

            }catch(error){
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
        }

        updateParentAgentAssignRights = async (req, res, next) => {
            try{
                // verify the req body and query
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ errors: errors.array() });
                    }
                    console.log('agentModule/updateParentAssignRights',JSON.stringify(req.body), JSON.stringify(req.query))
                // sql quwery variables
                    var searchKeyValue = {
                        user_uuid : req.body.user_uuid
                    };
                    var key = ["agent_module_name","sub_module_perm","perm_view","sub_module_perm"]

                // get agent permission list
                    var lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName2,searchKeyValue, key,"agent_module_id","ASC")
                    if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "Agent dont have any permission, create insted"}] });

                // go in the listResponce1 one by one and update one by one module
                    var oldModuleList = req.body.moduleList
                    let i,k, subModuleList,updateResponce, j = 0, update = 0 , view = 0

                    for( i=0 ; i<lisResponce1.length; i++ ){
                        if(lisResponce1[i].perm_view == 2) continue;
                        if(lisResponce1[i].agent_module_name != oldModuleList[j].ModuleName){
                            j+=1
                            if(lisResponce1[i].agent_module_name != oldModuleList[j].ModuleName) return res.status(400).json({ errors: [ {msg : "module list is not proper"}] });
                        }
                        subModuleList = JSON.parse(lisResponce1[i].sub_module_perm).sub_module_perm_list
                        for (k = 0; k < subModuleList.length; k++) {
                            if(subModuleList[k].subModuleName != oldModuleList[j].subModuleName){
                                j+=1
                                if(subModuleList[k].subModuleName != oldModuleList[j].subModuleName) return res.status(400).json({ errors: [ {msg : "sub-module list is not proper"}] });
                            }
                            // check the status value
                            if(subModuleList[k].permView != oldModuleList[j].viewPerm){
                                subModuleList[k].permView = oldModuleList[j].viewPerm == 1 ? 1 : 0
                                update = 1
                            }
                            if(subModuleList[k].permAdd != oldModuleList[j].addPerm || subModuleList[k].permView == 0){
                                subModuleList[k].permAdd = oldModuleList[j].addPerm == 1 && subModuleList[k].permView == 1 ? 1 : 0
                                update = 1
                            }
                            if(subModuleList[k].permEdit != oldModuleList[j].eidtPerm || subModuleList[k].permView == 0){
                                subModuleList[k].permEdit = oldModuleList[j].eidtPerm == 1 && subModuleList[k].permView == 1 ? 1 : 0
                                update = 1
                            }
                            if(subModuleList[k].permDelete!= oldModuleList[j].deletePerm || subModuleList[k].permView == 0){
                                subModuleList[k].permDelete = oldModuleList[j].deletePerm == 1 && subModuleList[k].permView == 1 ? 1 : 0
                                update = 1
                            }
                            if(subModuleList[k].permView == 1 || view == 1){
                                view = 1
                            }else{
                                view = 0
                            }
                        }
                        lisResponce1[i].sub_module_perm = JSON.stringify({sub_module_perm_list : subModuleList})
                        // if(update == 1){
                            // console.log(lisResponce1[i].sub_module_perm)
                            lisResponce1[i].perm_view = view
                            updateResponce = await sqlQuery.updateQuery(this.tableName2,lisResponce1[i],{user_uuid : req.body.user_uuid,agent_module_name : lisResponce1[i].agent_module_name })
                        // }
                        update = 0
                        view = 0
                    }

                    res.status(200).send({ message: "data updated successfully"})

            }catch (error) {
                console.log(error);
                res.status(400).json({ errors: [ {msg : error.message}] });
            }
         }
}

module.exports = new moduleController();