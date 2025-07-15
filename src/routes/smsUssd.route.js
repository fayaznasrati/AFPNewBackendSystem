const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils')
const role = require('../utils/userRoles.utils');

const smsUssdController = require('../controllers/smsUssd.controller')

const { createActivity, getActivityList, updateActivity, getUssdActivityReport } = require('../middleware/validators/smsUssdValidator.middleware')

// ussd/sms type related apis
router.post('/activity', createActivity, auth(), awaitHandlerFactory(smsUssdController.createActivity))
router.get('/activity', getActivityList, auth(), awaitHandlerFactory(smsUssdController.getActivityList))
router.put('/activity', updateActivity, auth(), awaitHandlerFactory(smsUssdController.updateActivity))

// ussd related report
router.get('/ussd/activity-report', getUssdActivityReport, auth(), awaitHandlerFactory(smsUssdController.getUssdActivityReport))
router.get('/ussd/download-activity-report', getUssdActivityReport, auth(), awaitHandlerFactory(smsUssdController.downloadUssdActivityReport))

module.exports = router;