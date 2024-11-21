const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const accessManager = require('../middleware/acessManager.middleware')
const role = require('../utils/userRoles.utils')

const agentModuleController = require('../controllers/agentModule.controller')
const subAdminModuleController = require('../controllers/subAdminModule.controller')

const { 
    subAdminAddModuleName,subAdminGetAllModuleName,subAdminUpdateModuleName,subAdminGetAllSubModuleListName,
    subAdminAddSubModuleName,subAdminUpdateSubModuleName,subAdminGetAllModuleList,departmentAssignRights,
    getSubMododuleByDepartmentId,subAdminGetAssignedModule
} = require('../middleware/validators/subAdminModuleValidator.middleware')
const {
    getSubModuleListByUserId, getAllModuleList,agentAssignRights,updateAssignRights,getAssignedModule,
    getAllModuleName,addModule,updateModuleName,getAllSubModuleList,addSubModule,updateSubModuleName,
    getParentModuleList,parentAgentAssignRights,getParentAgentAssignRights,updateParentAgentAssignRights,
    getSubModulePermissions
} = require('../middleware/validators/agentModuleValidator.middleware')

//############# agent module ##########################
//basic api for agent Moudle
router.get('/module',getAllModuleName, auth(role.Admin), awaitHandlerFactory(agentModuleController.getAllModuleName));
router.post('/module',addModule, auth(role.Admin), awaitHandlerFactory(agentModuleController.addModule));
router.put('/module',updateModuleName, auth(role.Admin), awaitHandlerFactory(agentModuleController.updateModuleName))

// basic api for agent sub module
router.get('/sub-module',getAllSubModuleList, auth(role.Admin), awaitHandlerFactory(agentModuleController.getAllSubModuleList));
router.post('/sub-module',addSubModule, auth(role.Admin), awaitHandlerFactory(agentModuleController.addSubModule));
router.put('/sub-module',updateSubModuleName, auth(role.Admin), awaitHandlerFactory(agentModuleController.updateSubModuleName))

//sub module controller
router.get('/sub-module-permissions',getSubModuleListByUserId,auth(1,2,3,4,5,6),awaitHandlerFactory(agentModuleController.getSubModuleListByUserId))
router.get('/sub-module/permissions',getSubModulePermissions,auth(1,2,3,4,5,6),awaitHandlerFactory(agentModuleController.getSubModulePermissions))

// get all submodule list
router.get('/sub-module/all',getAllModuleList,auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [1,1], permission: apiMethod.view }}),awaitHandlerFactory(agentModuleController.getAllModuleList))

// assign rights
router.post('/assign-rights',agentAssignRights, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.add }}),  awaitHandlerFactory(agentModuleController.agentAssignRights))
router.get('/assign-rights',getAssignedModule,auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [1,1], permission: apiMethod.view }}),awaitHandlerFactory(agentModuleController.getAssignedModule))
router.put('/assign-rights',updateAssignRights, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentModuleController.updateAssignRights))

// parent module permission 
router.get('/parent/assign-rights',getParentModuleList, auth(),awaitHandlerFactory(agentModuleController.getParentModuleList))
router.get('/agnet/assign-rights',getParentAgentAssignRights, auth(),awaitHandlerFactory(agentModuleController.getParentAgentAssignRights))
router.post('/agnet/assign-rights',parentAgentAssignRights, auth(),awaitHandlerFactory(agentModuleController.parentAgentAssignRights))
router.put('/agnet/assign-rights',updateParentAgentAssignRights, auth(),awaitHandlerFactory(agentModuleController.updateParentAgentAssignRights))

//######################## sub admin module ###########################
// sub admin module name 
router.post('/subAdmin/module',subAdminAddModuleName, auth(role.Admin),awaitHandlerFactory(subAdminModuleController.addModuleName))
router.get('/subAdmin/module',subAdminGetAllModuleName, auth(role.Admin),awaitHandlerFactory(subAdminModuleController.getAllModuleName))
router.put('/subAdmin/module',subAdminUpdateModuleName, auth(role.Admin),awaitHandlerFactory(subAdminModuleController.updateModuleName))

// basic api for subadmin sub module
router.get('/subAdmin/sub-module',subAdminGetAllSubModuleListName, auth(role.Admin), awaitHandlerFactory(subAdminModuleController.getAllSubModuleListName));
router.post('/subAdmin/sub-module',subAdminAddSubModuleName, auth(role.Admin), awaitHandlerFactory(subAdminModuleController.addSubModuleName));
router.put('/subAdmin/sub-module',subAdminUpdateSubModuleName, auth(role.Admin), awaitHandlerFactory(subAdminModuleController.updateSubModuleName))

// get all submodule list
router.get('/subAdmin/sub-module/all',subAdminGetAllModuleList,auth(role.Admin),awaitHandlerFactory(subAdminModuleController.getAllModuleList))

// assign department rights
router.post('/department/assign-rights',departmentAssignRights, auth(role.Admin), awaitHandlerFactory(subAdminModuleController.departmentAssignRights))
router.get('/department/assign-rights',getSubMododuleByDepartmentId, auth(role.SubAdmin), awaitHandlerFactory(subAdminModuleController.getSubMododuleByDepartmentId))
router.get('/department/module',subAdminGetAssignedModule, auth(role.Admin), awaitHandlerFactory(subAdminModuleController.getAssignedModule))

module.exports = router;