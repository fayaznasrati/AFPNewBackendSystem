const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const operatorAccessController = require('../controllers/operatorAccess.controller')

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const {
    getAllAccessRights,updateAccessRights,getAllOperatorTopupList,updateOperatorAccess,updateOperatorAccessMinMax,addOperatorAccess,delteOperatorAccess
} = require("../middleware/validators/operatorAccessValidator.middleware")

router.get('/access', getAllAccessRights, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [4,1], permission: apiMethod.view }}), awaitHandlerFactory(operatorAccessController.getAllAccessRights))
router.put('/access', updateAccessRights, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [4,1], permission: apiMethod.edit }}), awaitHandlerFactory(operatorAccessController.updateAccessRights))

router.get('/access/topup', getAllOperatorTopupList, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [4,1], permission: apiMethod.view }}), awaitHandlerFactory(operatorAccessController.getAllOperatorTopupList))
router.post('/access/topup', addOperatorAccess, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [4,1], permission: apiMethod.add }}), awaitHandlerFactory(operatorAccessController.addOperatorAccess))
router.put('/access/topup', updateOperatorAccess, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [4,1], permission: apiMethod.edit }}), awaitHandlerFactory(operatorAccessController.updateOperatorAccess))
router.patch('/access/topup', updateOperatorAccessMinMax, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [4,1], permission: apiMethod.edit }}), awaitHandlerFactory(operatorAccessController.updateOperatorAccessMAXMAIN))
router.delete('/access/topup', delteOperatorAccess, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [4,1], permission: apiMethod.delete }}), awaitHandlerFactory(operatorAccessController.delteOperatorAccess))

module.exports = router;