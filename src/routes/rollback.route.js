const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const rollbackController = require('../controllers/rollback.controller')
const {
    rollbackTransaction, acceptRollbackTransaction, rejectRollbackTransaction, pendingRollback, transferAmtForRollback,
    rejectRollback, rollbackComplete, getSystemWalletBal, addMoneyInSystem, addRollBackRequest, acceptRollbackTransactionMNO,
    rejectRollbackTransactionMNO, agentRollbackReport, addRollback, etisalatPen
} = require('../middleware/validators/rollbackAccessValidator.middleware')

// rollback transaction
router.get('/transaction', rollbackTransaction, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,6], permission: apiMethod.view }}), awaitHandlerFactory(rollbackController.rollbackTransaction))

// API to accept/reject rollback transaction
router.put('/transaction/accept', acceptRollbackTransaction, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,6], permission: apiMethod.edit }}), awaitHandlerFactory(rollbackController.acceptRollbackTransaction))
router.put('/transaction/reject', rejectRollbackTransaction, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,6], permission: apiMethod.edit }}), awaitHandlerFactory(rollbackController.rejectRollbackTransaction))

// API for complete rollback
router.get('/complete', rollbackComplete, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,7], permission: apiMethod.view }}), awaitHandlerFactory(rollbackController.rollbackComplete))

// accept the request from rollback complete tab
router.put('/pending/transfer', transferAmtForRollback, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,7], permission: apiMethod.edit }}), awaitHandlerFactory(rollbackController.transferAmtForRollback))
router.put('/pending/reject', rejectRollback, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,7], permission: apiMethod.edit }}), awaitHandlerFactory(rollbackController.rejectRollback))

// API to get pending/telco accept/ telco reject rollback request 
router.get('/pending', pendingRollback, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,5], permission: apiMethod.view }}), awaitHandlerFactory(rollbackController.pendingRollback))
router.get('/eitsalat/', etisalatPen, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,4], permission: apiMethod.view }}), awaitHandlerFactory(rollbackController.etisalatPen))

// API to transfer amount to agent account
// router.put('/pending/mno/accept', acceptRollbackTransactionMNO, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,5], permission: apiMethod.edit }}), awaitHandlerFactory(rollbackController.acceptRollbackTransactionMNO))
// router.put('/pending/mno/reject', rejectRollbackTransactionMNO, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,5], permission: apiMethod.edit }}), awaitHandlerFactory(rollbackController.rejectRollbackTransactionMNO))

//Emoney report and rollback report
router.get('/emoney-details', getSystemWalletBal, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,3], permission: apiMethod.view }}), awaitHandlerFactory(rollbackController.getSystemWalletBal))
router.post('/emoney', addMoneyInSystem, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [7,3], permission: apiMethod.add }}), awaitHandlerFactory(rollbackController.addMoneyInSystem))

// add rollback request
router.post('/', addRollBackRequest, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,7], permission: apiMethod.add }}), awaitHandlerFactory(rollbackController.addRollBackRequest))
router.post('/rechange', addRollback, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [2,6], permission: apiMethod.add } ,agent : { module: [5,7], permission: apiMethod.add }}), awaitHandlerFactory(rollbackController.addRollback))

// rollack report for agent panel
router.get('/report',agentRollbackReport, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,7], permission: apiMethod.view }}), awaitHandlerFactory(rollbackController.agentRollbackReport))

module.exports = router;