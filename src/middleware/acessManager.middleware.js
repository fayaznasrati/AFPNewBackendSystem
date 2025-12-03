const UserModel = require('../models/admin.model');
const agentModule = require('../models/agent.module')

const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const userRoles = require('../utils/userRoles.utils');
const apiMethod = require('../utils/apiMethod.utils')

const redisMaster = require('../common/master/radisMaster.common')

const accessManager = (userType) => {

    tableName1 = "er_agent_modules_permission"
    tableName2 = "er_sub_admin_module_permission"

    // accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }})
    // how to apply permission for sub admin and agent 
    // if want to check the permissions of any one user then define that one user only

    return async function(req, res, next) {
        try{
            if(userType) {
                // console.log("moduleId ",moduleId,"permissions ",permissions)

                // admin specific 
                if(req.body.user_detials.type == userRoles.Admin){
                    // console.log('Checking admin permissions')
                    return next()
                }

                // subadmin specific roles
                if(req.body.user_detials.type == userRoles.SubAdmin){
                    // check if the subAdmin permissions is given
                        if(!userType.subAdmin) return res.status(400).json({ errors: [ {msg : "module permissions not applied"}] }); 
                    
                    //sub admin specific role
                        // console.log('Checking sub-admin permissions')

                        let permissions = userType.subAdmin.permission , moduleId = userType.subAdmin.module
                        // console.log("permissions ",permissions, "moduleId ",moduleId);

                    //get permission list according to department id and module id
                        let listPermission, permissionList, strModulePermission

                        strModulePermission = await redisMaster.asyncGet(`SUB_ADMIN_MODULE_PERMISSION_${moduleId[0]}_${req.body.user_detials.department}`)
                        if(strModulePermission == null) {
                            listPermission = await sqlQuery.searchQuery(this.tableName2,{"sub_admin_module_id" : moduleId[0], "department_id" : req.body.user_detials.department},["sub_admin_sub_module_perm"],"sub_admin_module_id","ASC",1,0)
                            if(listPermission.length == 0) return res.status(400).json({ errors: [ {msg : "Permission List not found"}] });
                            permissionList = JSON.parse(listPermission[0].sub_admin_sub_module_perm).sub_module_perm_list

                            redisMaster.post(`SUB_ADMIN_MODULE_PERMISSION_${moduleId[0]}_${req.body.user_detials.department}`,JSON.stringify(JSON.parse(listPermission[0].sub_admin_sub_module_perm).sub_module_perm_list))
                        }else{
                            permissionList = JSON.parse(strModulePermission)
                        }

                    // checking permission list
                        if(permissions == apiMethod.view){
                            if(permissionList[moduleId[1]-1].permView == 1) return next()
                            else 
                              return res.status(400).json({ errors: [ {msg : "view permission denied"}] });
                        }
                        if(permissions == apiMethod.add){
                            if(permissionList[moduleId[1]-1].permAdd == 1) return next()
                            else return res.status(400).json({ errors: [ {msg : "Add permission denied"}] });
                        }
                        if(permissions == apiMethod.edit){
                            if(permissionList[moduleId[1]-1].permEdit == 1) return next()
                            else return res.status(400).json({ errors: [ {msg : "Edit permission denied"}] });
                        }
                        if(permissions == apiMethod.delete){
                            if(permissionList[moduleId[1]-1].permDelete == 1) return next()
                            else return res.status(400).json({ errors: [ {msg : "Delete permission denied"}] });
                        }

                    // no permissions found then deny access
                        return res.status(400).json({ errors: [ {msg : "permission denied"}] });
                }

                if(req.body.user_detials.type != userRoles.SubAdmin && req.body.user_detials.type != userRoles.Admin){
                    // check if the agent permissions is given
                        if(!userType.agent) return res.status(400).json({ errors: [ {msg : "module permissions not applied"}] });
                    
                    // agent specific roles
                        // console.log('Checking agent permissions')

                        let permissions = userType.agent.permission , moduleId = userType.agent.module
                        let listPermission, permissionList, strModulePermission

                        strModulePermission = await redisMaster.asyncGet(`AGENT_MODULE_PERMISSION_${moduleId[0]}_${req.body.user_detials.user_uuid}`)
                        if(strModulePermission == null) {
                            // get module permision list according to user id and module id
                            listPermission = await sqlQueryReplica.searchQuery(this.tableName1,{"agent_module_id" : moduleId[0], "userid" : req.body.user_detials.userid},["sub_module_perm"],'agent_module_per_id','ASC',1,0)
                            if(listPermission.length == 0) return res.status(400).json({ errors: [ {msg : "Permission List not found"}] });
                            permissionList = JSON.parse(listPermission[0].sub_module_perm).sub_module_perm_list

                            redisMaster.post(`AGENT_MODULE_PERMISSION_${moduleId[0]}_${req.body.user_detials.user_uuid}`,JSON.stringify(JSON.parse(listPermission[0].sub_module_perm).sub_module_perm_list))
                        }else{
                            permissionList = JSON.parse(strModulePermission)
                        }

                    // checking permissions for different methods
                        // console.log("permissionList ",permissionList);
                        if(permissions == apiMethod.view){
                            if(permissionList[moduleId[1]-1].permView == 1) return next()
                            else return res.status(400).json({ errors: [ {msg : "view permission denied"}] });
                        }
                        if(permissions == apiMethod.add){
                            if(permissionList[moduleId[1]-1].permAdd == 1) return next()
                            else return res.status(400).json({ errors: [ {msg : "Add permission denied"}] });
                        }
                        if(permissions == apiMethod.edit){
                            if(permissionList[moduleId[1]-1].permEdit == 1) return next()
                            else return res.status(400).json({ errors: [ {msg : "Edit permission denied"}] });
                        }
                        if(permissions == apiMethod.delete){
                            if(permissionList[moduleId[1]-1].permDelete == 1) return next()
                            else return res.status(400).json({ errors: [ {msg : "Delete permission denied"}] });
                        }

                    // no permissions found then deny access
                        return res.status(400).json({ errors: [ {msg : "permission denied"}] });
                }
            }

            console.log('Controller Not working')
            return next()
            
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }       
    }
}

module.exports = accessManager;