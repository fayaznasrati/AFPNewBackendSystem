const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const redisMaster = require('../common/master/radisMaster.common')

const subAdminModule = require('../models/subAdminModule.model')

class subAdminModuleController {
    tableName1 = 'er_sub_admin_module'
    tableName2 = 'er_sub_admin_sub_module'
    tableName3 = 'er_sub_admin_module_permission'
    tableName4 = 'er_master_department'

    // basic crud operation for module
    addModuleName = async (req,res) => {
        try{
            // validate req .query anb .body
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('subAdminModule/addModuleName',JSON.stringify(req.body), JSON.stringify(req.query))
            // add data in the table 
                var param = {
                    sub_admin_module_name : req.body.moduleName,
                    sub_admin_module_title : req.body.moduleTitle
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
                // console.log('subAdminModule/getAllModuleName',JSON.stringify(req.body), JSON.stringify(req.query))
            // search key list 
                var key = ["sub_admin_module_id","sub_admin_module_name AS moduleName","sub_admin_module_title AS moduleTitle"]

        
            // get module name, amodule tytle and id
                var lisResponce = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName1, key,"sub_admin_module_id","ASC")
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
                console.log('subAdminModule/updateModuleName',JSON.stringify(req.body), JSON.stringify(req.query))
            // update query variabels
                var searchKeyValue = {
                    sub_admin_module_id : req.body.sub_admin_module_id
                }
                var keyValue = {
                    sub_admin_module_name : req.body.moduleName, // module name
                    sub_admin_module_title : req.body.moduleTitle, // module title
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

    // basic crud operation for sub module
    getAllSubModuleListName = async(req,res) => {
        try{
            // validate req .query anb .body
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('subAdminModule/getAllSubModuleListName',JSON.stringify(req.body), JSON.stringify(req.query))
            // get all sub-module list
                var key = ["sub_admin_sub_module_id","sub_admin_sub_module_name AS subModuleName","sub_admin_sub_module_title AS subModuleTitle","sub_admin_module_name AS moduleName"]
                var searchKeyValue = {
                    sub_admin_module_name : req.query.moduleName
                };
                const responceList = await sqlQueryReplica.searchQueryNoLimit(this.tableName2,searchKeyValue,key,"sub_admin_module_id","ASC")
                if (responceList.length == 0) return res.status(400).json({ errors: [ {msg : "No module list found"}] });

            // send responce to front end
                res.status(200).send(responceList)
            
        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    } 

    addSubModuleName = async (req,res) =>{
        try{
            // validate req .query anb .body
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('subAdminModule/addSubModuleName',JSON.stringify(req.body), JSON.stringify(req.query))
            // verify the module name
                var searchKeyValue = {
                    sub_admin_module_name : req.body.moduleName,
                }

            // search module id    
                var key = ["sub_admin_module_id"]
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1,searchKeyValue, key,"sub_admin_module_id","ASC",1,0)
                if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "module not found"}] });

            // add sub module name 
                var keyValue = {
                    sub_admin_sub_module_name : req.body.subModuleName,
                    sub_admin_sub_module_title : req.body.subModuleTitle,
                    sub_admin_module_id : lisResponce1[0].sub_admin_module_id,
                    sub_admin_module_name : req.body.moduleName
                }  
            
            // make sql query to add data
                const lisResponce2 = await sqlQuery.createQuery(this.tableName2,keyValue)

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
                console.log('subAdminModule/updateSubModuleName',JSON.stringify(req.body), JSON.stringify(req.query))
            // verify the module name
                var searchKeyValue = {
                    sub_admin_module_name : req.body.moduleName,
                }

            // search module id    
                var key = ["sub_admin_module_id"]
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1,searchKeyValue, key,"sub_admin_module_id","ASC",1,0)
                if(lisResponce1.length == 0) return res.status(400).json({ errors: [ {msg : "module not found"}] });

            // update sub module name 
                var keyValue = {
                    sub_admin_sub_module_name : req.body.subModuleName,
                    sub_admin_sub_module_title : req.body.subModuleTitle,
                    sub_admin_module_id : lisResponce1[0].sub_admin_module_id,
                    sub_admin_module_name : req.body.moduleName
                }
                var searchKeyValue = {
                    sub_admin_sub_module_id : req.body.sub_admin_sub_module_id
                } 

            // make update query
                const lisResponce2 = await sqlQuery.updateQuery(this.tableName2,keyValue,searchKeyValue)

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

    // module and sub module list to hundle user permission and sidebar access
    getAllModuleList = async(req,res) => {
        try{
            // verify the req body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('subAdminModule/getAllModuleList',JSON.stringify(req.body), JSON.stringify(req.query))
            // limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // get the module list
                // var lisResponce1 = await subAdminModule.getAllModuleList();
                var lisResponce1 = await subAdminModule.getAllModuleWithSubModules();
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
        
                console.log("Modules and SubModules:", result)
            // send responce 
                res.status(200).send(result)    

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    olddepartmentAssignRights = async(req,res) =>{
        try{
            // verify the req body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('subAdminModule/departmentAssignRights',JSON.stringify(req.body), JSON.stringify(req.query))
            // check if user name allrady in the data base
                const lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName3,{department_uuid : req.body.department_uuid},["sub_admin_module_name","sub_admin_sub_module_perm","perm_view",'sub_admin_module_id','department_id'],'sub_admin_per_id',"ASC")
                // console.log(boolCheck)
                if(lisResponce1.length > 0) {
                    // go in the listResponce1 one by one and update one by one module
                    var oldModuleList = req.body.moduleList
                    let i,k, subModuleList,updateResponce, j = 0, update = 0 , view = 0

                    for( i=0 ; i<lisResponce1.length; i++ ){
                        if(lisResponce1[i].sub_admin_module_name != oldModuleList[j].moduleName){
                            j+=1
                            if(lisResponce1[i].sub_admin_module_name != oldModuleList[j].moduleName) return res.status(400).json({ errors: [ {msg : "module list is not proper"}] });
                        }
                        subModuleList = JSON.parse(lisResponce1[i].sub_admin_sub_module_perm).sub_module_perm_list
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
                            if(subModuleList[k].permView == 1 || view == 1 ){
                                view = 1
                            }else{
                                view = 0
                            }
                        }
                        lisResponce1[i].sub_admin_sub_module_perm = JSON.stringify({sub_module_perm_list : subModuleList})
                        // if(update == 1){
                            // console.log(lisResponce1[i].sub_module_perm)
                            lisResponce1[i].perm_view = view
                            updateResponce = await sqlQuery.updateQuery(this.tableName3,lisResponce1[i],{department_uuid : req.body.department_uuid,sub_admin_module_name : lisResponce1[i].sub_admin_module_name })
                        // }
                        update = 0
                        view = 0
                        redisMaster.delete(`SUB_ADMIN_MODULE_PERMISSION_${lisResponce1[i].sub_admin_module_id}_${lisResponce1[i].department_id}`)
                    }

                    return res.status(200).send({ message: "data updated successfully"})
                }

            // get agent user id
                const intDepartmentId = await sqlQueryReplica.searchQuery(this.tableName4,{department_uuid : req.body.department_uuid},['department_id'],'department_id','ASC',1,0)
                if (intDepartmentId.length == 0) return res.status(400).json({ errors: [ {msg : "Department not found"}] });

            // get sub module list
                const lisresponce2 = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName2,["sub_admin_sub_module_id","sub_admin_sub_module_name","sub_admin_module_id","sub_admin_module_name"],"sub_admin_sub_module_id",'ASC')
                if (lisresponce2.length == 0) return res.status(400).json({ errors: [ {msg : "Sub-Module List not found to verify data"}] });
            
            // get data from frontend
                var oldModuleList = req.body.moduleList
                let i = 0, j = -1
                let newModuleList = [], newSubModuleList = []

                for (i = 0; i < oldModuleList.length; i++){
                    // console.log("sub Module ",lisresponce2[i].sub_admin_sub_module_name,oldModuleList[i].subModuleName )
                    // console.log('module ',lisresponce2[i].sub_admin_module_name,oldModuleList[i].moduleName )
                    if(lisresponce2[i].sub_admin_sub_module_name != oldModuleList[i].subModuleName ) return res.status(400).json({ errors: [ {msg : "sub module list error"}] });
                    if(lisresponce2[i].sub_admin_module_name != oldModuleList[i].moduleName ) return res.status(400).json({ errors: [ {msg : "module list error"}] });
                    
                    if( j == -1 || newModuleList[j].sub_admin_module_name != oldModuleList[i].moduleName ){
                        newModuleList.push({ 
                            department_id : intDepartmentId[0].department_id,
                            department_uuid : req.body.department_uuid,
                            sub_admin_module_id : lisresponce2[i].sub_admin_module_id,
                            sub_admin_module_name : lisresponce2[i].sub_admin_module_name,
                            perm_view : 0, 
                            sub_admin_sub_module_perm : {
                                sub_module_perm_list:[]
                            }
                        })
                        j += 1
                    }
                    newModuleList[j].sub_admin_sub_module_perm.sub_module_perm_list.push({
                        sub_admin_sub_module_id : lisresponce2[i].sub_admin_sub_module_id,
                        subModuleName : lisresponce2[i].sub_admin_sub_module_name,
                        permView : oldModuleList[i].viewPerm,
                        permAdd : ( oldModuleList[i].addPerm == 1 && oldModuleList[i].viewPerm == 1) ? 1 : 0 ,
                        permEdit : ( oldModuleList[i].eidtPerm == 1 && oldModuleList[i].viewPerm == 1) ? 1 : 0 ,
                        permDelete : ( oldModuleList[i].deletePerm == 1 && oldModuleList[i].viewPerm == 1) ? 1 : 0 
                    })

                    if(oldModuleList[i].viewPerm) newModuleList[j].perm_view = 1
                    // console.log(i)
                }

                // make a join operation between er_agent_module, er_agent_sub_module, model list

                // console.log("newModuleList ",newModuleList)

            // add data in module permission
                let response = await sqlQuery.multiInsert(this.tableName3,newModuleList)

                res.status(201).send({ message: "data added successfully"})
            
        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
    
    // departmentAssignRights = async (req, res) => {
    // try {
    //     // verify the request body and query
    //     const errors = validationResult(req);
    //     if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    //     }

    //     console.log("subAdminModule/departmentAssignRights", JSON.stringify(req.body), JSON.stringify(req.query));

    //     // check if permissions already exist
    //     const existingPermissions = await sqlQueryReplica.searchQueryNoLimit(
    //     this.tableName3,
    //     { department_uuid: req.body.department_uuid },
    //     [
    //         "sub_admin_module_name",
    //         "sub_admin_sub_module_perm",
    //         "perm_view",
    //         "sub_admin_module_id",
    //         "department_id",
    //     ],
    //     "sub_admin_per_id",
    //     "ASC"
    //     );

    //     // ==================== 🧩 CASE 1: if permissions already exist, remove old records completely ====================

        
    //     if (existingPermissions.length > 0) {
    //     await sqlQuery.deleteQuery(this.tableName3, { department_uuid: req.body.department_uuid });
    //      console.log(`Old permissions removed for department ${req.body.department_uuid}`);
    //      redisMaster.delete(`SUB_ADMIN_MODULE_PERMISSION_${lisResponce1[i].sub_admin_module_id}_${lisResponce1[i].department_id}`)
    //     olddepartmentAssignRights()
    //     }
        

    //     // ==================== 🧩 CASE 2: INSERT NEW PERMISSIONS ====================

    //     // get department ID
    //     const departmentData = await sqlQueryReplica.searchQuery(
    //     this.tableName4,
    //     { department_uuid: req.body.department_uuid },
    //     ["department_id"],
    //     "department_id",
    //     "ASC",
    //     1,
    //     0
    //     );

    //     if (departmentData.length === 0)
    //     return res.status(400).json({ errors: [{ msg: "Department not found" }] });

    //     const departmentId = departmentData[0].department_id;

    //     // get modules that have submodules
    //     const moduleWithSubmodules = await sqlQueryReplica.customQuery()


    //     if (moduleWithSubmodules.length === 0) {
    //     return res.status(400).json({ errors: [{ msg: "No modules with submodules found" }] });
    //     }

    //     const oldModuleList = req.body.moduleList;
    //     const newModuleList = [];
    //     let currentModule = null;

    //     for (const item of moduleWithSubmodules) {
    //     const found = oldModuleList.find(
    //         (m) =>
    //         m.moduleName === item.sub_admin_module_name &&
    //         m.subModuleName === item.sub_admin_sub_module_name
    //     );
    //     if (!found) continue;

    //     // check if new module started
    //     if (!currentModule || currentModule.sub_admin_module_name !== item.sub_admin_module_name) {
    //         // parent permission object
    //         const parentPerm = oldModuleList.find(
    //         (m) => m.moduleName === item.sub_admin_module_name && !m.subModuleName
    //         );

    //         currentModule = {
    //         department_id: departmentId,
    //         department_uuid: req.body.department_uuid,
    //         sub_admin_module_id: item.sub_admin_module_id,
    //         sub_admin_module_name: item.sub_admin_module_name,
    //         perm_view: parentPerm?.viewPerm ? 1 : 0,
    //         //   perm_add: parentPerm?.viewPerm ? parentPerm.addPerm : 0,
    //         //   perm_edit: parentPerm?.viewPerm ? parentPerm.eidtPerm : 0,
    //         //   perm_delete: parentPerm?.viewPerm ? parentPerm.deletePerm : 0,
    //         sub_admin_sub_module_perm: { sub_module_perm_list: [] },
    //         };

    //         newModuleList.push(currentModule);
    //     }

    //     // push submodule permissions
    //     currentModule.sub_admin_sub_module_perm.sub_module_perm_list.push({
    //         sub_admin_sub_module_id: item.sub_admin_sub_module_id,
    //         subModuleName: item.sub_admin_sub_module_name,
    //         permView: found.viewPerm,
    //         permAdd: found.viewPerm ? found.addPerm : 0,
    //         permEdit: found.viewPerm ? found.editPerm  : 0,
    //         permDelete: found.viewPerm ? found.deletePerm : 0,
    //     });

    //     // if any submodule has view = 1, parent view = 1
    //     if (found.viewPerm === 1) currentModule.perm_view = 1;
    //     }

    //     if (newModuleList.length === 0)
    //     return res.status(400).json({ errors: [{ msg: "No valid module/submodule to assign" }] });

    //     // insert data
    //     await sqlQuery.multiInsert(this.tableName3, newModuleList);

    //     res.status(201).send({ message: "Data added successfully" });
    // } catch (error) {
    //     console.log(error);
    //     res.status(400).json({ errors: [{ msg: error.message }] });
    // }
    // };

    departmentAssignRights = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }

        console.log("subAdminModule/departmentAssignRights", JSON.stringify(req.body), JSON.stringify(req.query));

        // ==================== 🧩 FETCH EXISTING PERMISSIONS ====================
        const existingPermissions = await sqlQueryReplica.searchQueryNoLimit(
        this.tableName3,
        { department_uuid: req.body.department_uuid },
        [
            "sub_admin_module_id",
            "department_id",
            "sub_admin_module_name",
            "sub_admin_sub_module_perm",
            "perm_view",
        ],
        "sub_admin_per_id",
        "ASC"
        );

        // ==================== 🧩 CASE 1: DELETE OLD PERMISSIONS + REDIS CACHE ====================
        if (existingPermissions.length > 0) {
        // delete old DB records
        await sqlQuery.deleteQuery(this.tableName3, { department_uuid: req.body.department_uuid });
        console.log(`Old permissions removed for department ${req.body.department_uuid}`);

        // delete old Redis caches related to those permissions
        for (const perm of existingPermissions) {
            const cacheKey = `SUB_ADMIN_MODULE_PERMISSION_${perm.sub_admin_module_id}_${perm.department_id}`;
            await redisMaster.delete(cacheKey);
            console.log(`Redis cache cleared: ${cacheKey}`);
        }
        }

        // ==================== 🧩 CASE 2: INSERT NEW PERMISSIONS ====================
        const departmentData = await sqlQueryReplica.searchQuery(
        this.tableName4,
        { department_uuid: req.body.department_uuid },
        ["department_id"],
        "department_id",
        "ASC",
        1,
        0
        );

        if (departmentData.length === 0) {
        return res.status(400).json({ errors: [{ msg: "Department not found" }] });
        }

        const departmentId = departmentData[0].department_id;

        // get module + submodule structure
        const moduleWithSubmodules = await sqlQueryReplica.customQuery(`
        SELECT 
            sub_admin_module_id,
            sub_admin_module_name,
            sub_admin_sub_module_id,
            sub_admin_sub_module_name
        FROM sub_admin_sub_module_master
        ORDER BY sub_admin_module_id ASC, sub_admin_sub_module_id ASC
        `);

        if (moduleWithSubmodules.length === 0) {
        return res.status(400).json({ errors: [{ msg: "No modules with submodules found" }] });
        }

        const oldModuleList = req.body.moduleList;
        const newModuleList = [];
        let currentModule = null;

        for (const item of moduleWithSubmodules) {
        const found = oldModuleList.find(
            (m) =>
            m.moduleName === item.sub_admin_module_name &&
            m.subModuleName === item.sub_admin_sub_module_name
        );
        if (!found) continue;

        // start new module grouping
        if (!currentModule || currentModule.sub_admin_module_name !== item.sub_admin_module_name) {
            const parentPerm = oldModuleList.find(
            (m) => m.moduleName === item.sub_admin_module_name && !m.subModuleName
            );

            currentModule = {
            department_id: departmentId,
            department_uuid: req.body.department_uuid,
            sub_admin_module_id: item.sub_admin_module_id,
            sub_admin_module_name: item.sub_admin_module_name,
            perm_view: parentPerm?.viewPerm ? 1 : 0,
            sub_admin_sub_module_perm: { sub_module_perm_list: [] },
            };

            newModuleList.push(currentModule);
        }

        // add submodule permission
        currentModule.sub_admin_sub_module_perm.sub_module_perm_list.push({
            sub_admin_sub_module_id: item.sub_admin_sub_module_id,
            subModuleName: item.sub_admin_sub_module_name,
            permView: found.viewPerm,
            permAdd: found.viewPerm ? found.addPerm : 0,
            permEdit: found.viewPerm ? found.editPerm : 0,
            permDelete: found.viewPerm ? found.deletePerm : 0,
        });

        // if any submodule is viewable, mark module as viewable
        if (found.viewPerm === 1) currentModule.perm_view = 1;
        }

        if (newModuleList.length === 0) {
        return res.status(400).json({ errors: [{ msg: "No valid module/submodule to assign" }] });
        }

        // ==================== 🧩 INSERT NEW RECORDS ====================
        await sqlQuery.multiInsert(this.tableName3, newModuleList);

        // ==================== 🧩 OPTIONAL: CLEAR CACHES AGAIN (safety) ====================
        for (const mod of newModuleList) {
        const cacheKey = `SUB_ADMIN_MODULE_PERMISSION_${mod.sub_admin_module_id}_${mod.department_id}`;
        await redisMaster.delete(cacheKey);
        console.log(`Redis cache cleared (post-insert): ${cacheKey}`);
        }

        res.status(201).send({ message: "Data added successfully" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ errors: [{ msg: error.message }] });
    }
    };

    getSubMododuleByDepartmentId = async(req,res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('subAdminModule/getSubModuleByDepartmanetId',JSON.stringify(req.body), JSON.stringify(req.query))
            var searchKeyValue = {
                sub_admin_module_name : req.query.moduleName,
                department_id : req.body.user_detials.department || 0
            };
            var key = ['sub_admin_sub_module_perm','sub_admin_module_id']
            var orderby = 'sub_admin_module_name'
            var ordertype = 'ASC'

            
            let lisresponce1, strModulePermission

            let moduleId = await redisMaster.asyncGet('MODULE_ID'+req.query.moduleName)
            if(moduleId){
                strModulePermission = await redisMaster.asyncGet(`SUB_ADMIN_MODULE_PERMISSION_${moduleId}_${req.body.user_detials.department}`)
            }
            if(strModulePermission == null){
                lisresponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName3, searchKeyValue, key, orderby, ordertype)
                if(lisresponce1.length == 0) return res.status(204).json({ message : 'sub-module permission list not found'});

                redisMaster.post('MODULE_ID'+req.query.moduleName,lisresponce1[0].sub_admin_module_id)
                redisMaster.post(`SUB_ADMIN_MODULE_PERMISSION_${moduleId}_${req.body.user_detials.department}`,JSON.stringify(JSON.parse(lisresponce1[0].sub_admin_sub_module_perm).sub_module_perm_list))
                
                // console.log(typeof(lisresponce1[0].sub_module_perm))
                return res.status(200).send(JSON.parse(lisresponce1[0].sub_admin_sub_module_perm).sub_module_perm_list)
            }else{
                return res.status(200).send(JSON.parse(strModulePermission))
            }

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getAssignedModule = async (req,res) => {
        try{
            // verify the req body and query
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('subAdminModule/getAssignedModule',JSON.stringify(req.body), JSON.stringify(req.query))
            // get the module list from module permission
                // const lisResponse1 = await sqlQuery.searchQueryNoLimit(this.tableName2,{user_uuid : req.query.user_uuid },["agent_module_id","agent_module_name","perm_view","sub_module_perm"],"agent_module_id","ASC")
                    const lisResponce1 = await subAdminModule.subAdminAssignRights(req.query.department_uuid)
                console.log(lisResponce1)
                if(lisResponce1.length == 0) {
                    // get the module list
                        // var lisResponce2 = await subAdminModule.getAllModuleList();
                        var lisResponce2 = await subAdminModule.getAllModuleWithSubModules();
                        if(lisResponce2.length == 0) return res.status(204).send({ message:"Module and sub module list not found"})

                    // modify the responce
                        let i, result = [], module = []

                        for(i = 0; i<lisResponce2.length; i++) {
                            // console.log("result : ", result, "modiule ",module, "result[j] ",result[j])
                            if(module.includes(lisResponce2[i].ModuleName)){
                                result[module.indexOf(lisResponce2[i].ModuleName)].subModuleList.push({ 
                                    subModuleName : lisResponce2[i].subModuleName,
                                    subModuleTitle : lisResponce2[i].subModuleTitle,
                                    permView : 0,
                                    permAdd : 0,
                                    permEdit : 0,
                                    permDelete : 0,
                                })
                            }else{
                                module.push(lisResponce2[i].ModuleName)
                                result.push({
                                    moduleName : lisResponce2[i].ModuleName,
                                    moduleTitle : lisResponce2[i].ModuleTitle,
                                    subModuleList : [{
                                        subModuleName : lisResponce2[i].subModuleName,
                                        subModuleTitle : lisResponce2[i].subModuleTitle,
                                        permView : 0,
                                        permAdd : 0,
                                        permEdit : 0,
                                        permDelete : 0,
                                    }]
                                })
                            }
                        }
                
                    // send responce 
                        return res.status(200).send(result)
                }

                let i, subModuleList, result = [], module = [], j =0

                for(i = 0; i<lisResponce1.length; i++) {
                    console.log(i)
                    console.log("result : ", result, "modiule ",module, "result[j] ",result[j])
                    if(module.includes(lisResponce1[i].ModuleName)){
                        subModuleList = JSON.parse(lisResponce1[i].sub_admin_sub_module_perm).sub_module_perm_list
                        if(lisResponce1[i].subModuleName != subModuleList[j].subModuleName) 
                            return res.status(400).json({ errors: [ {msg : "Internal Query error"}] });
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
                        subModuleList = JSON.parse(lisResponce1[i].sub_admin_sub_module_perm).sub_module_perm_list
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
}

module.exports = new subAdminModuleController();