const express = require('express');
const router = express.Router();
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const auth = require('../middleware/auth.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const logController = require('../controllers/log.controller')

const {
    logAdminUpdatePassword, getAdminUpdatePasswordLog, logAdminUpdateMobile, getAdminUpdateMobileLog,
    addActivityLog, addLoginLog, getAdminActivityLog, getAgentActivityLog, getSubAdminActivityLog,
    getAgentWithNoActivity,getAgentSelfActivityLog,addSwitchAccLog,getSwithAccountLog,addMultipleActivityLog,
    addUssdLog, addP2aLog
} = require('../middleware/validators/logValidator.middleware')

// API related to update admin password
router.post('/admin/password',logAdminUpdatePassword,awaitHandlerFactory(logController.logAdminUpdatePassword))
router.get('/admin/password', getAdminUpdatePasswordLog, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(logController.getAdminUpdatePasswordLog))

// APS related to update admin mobile number
router.post('/admin/mobile',logAdminUpdateMobile,awaitHandlerFactory(logController.logAdminUpdateMobile))
router.get('/admin/mobile', getAdminUpdateMobileLog, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(logController.getAdminUpdateMobileLog))

// Aps to add activity log
router.post('/activity-log',addActivityLog,awaitHandlerFactory(logController.addActivityLog))

// API to add multiple activity log
router.post('/activity-log/multiple',addMultipleActivityLog, awaitHandlerFactory(logController.addMultipleActivityLog))

// APi related to login log
router.post('/login',addLoginLog, awaitHandlerFactory(logController.addLoginLog))

// Api to get activity log
router.get('/activity-log/admin',getAdminActivityLog, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,1], permission: apiMethod.view }}), awaitHandlerFactory(logController.getAdminActivityLog))
router.get('/activity-log/agent',getAgentActivityLog, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,2], permission: apiMethod.view }}), awaitHandlerFactory(logController.getAgentActivityLog))
router.get('/activity-log/sub-admin',getSubAdminActivityLog, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,3], permission: apiMethod.view }}), awaitHandlerFactory(logController.getSubAdminActivityLog))

// API to get agent with no activity log
router.get('/agent/no-activity',getAgentWithNoActivity,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,12], permission: apiMethod.view }}), awaitHandlerFactory(logController.getAgentWithNoActivity))

// agent panel report api
router.get('/agent/self',getAgentSelfActivityLog, auth(1,2,3,4,5,6),  accessManager({ agent: { module: [5,5], permission: apiMethod.view }}), awaitHandlerFactory(logController.getAgentSelfActivityLog))
router.get('/agent/notification',getAgentSelfActivityLog, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), awaitHandlerFactory(logController.getAgentNotification))
router.get('/agent/notification/ids',getAgentSelfActivityLog, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), awaitHandlerFactory(logController.get10AgentNotification))
router.get('/agent/notification/count',getAgentSelfActivityLog, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), awaitHandlerFactory(logController.getNotificationCount))

router.post('/agent/switch-acc',addSwitchAccLog, awaitHandlerFactory(logController.addSwitchAccLog))

router.get('/agent/switch-acc',getSwithAccountLog,auth(role.Admin,role.SubAdmin),  accessManager({subAdmin : { module: [2,3], permission: apiMethod.view }}), awaitHandlerFactory(logController.getSwithAccountLog))

// ussd log
router.post('/ussd',addUssdLog,awaitHandlerFactory(logController.addUssdLog))
router.get('/ussd',awaitHandlerFactory(logController.getUssdLogs))

// p2a Log
router.post('/p2a', addP2aLog,awaitHandlerFactory(logController.addP2aLog))
router.get('/p2a',awaitHandlerFactory(logController.getP2aLog))

module.exports = router;