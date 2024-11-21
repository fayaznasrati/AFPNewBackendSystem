const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const commissionController = require('../controllers/commission.controller')

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const {
    getCommision,updateCommision,directAgentPrePaidCommissionReport,directAgentPostPaidCommissionReport,
    inDirectAgentPrePaidCommissionReport,inDirectAgentPostPaidCommissionReport
} = require ('../middleware/validators/commissionValidator.middleware')

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

router.get('/',getCommision,auth(role.Admin,1,2,3,4,5,6), accessManager({agent: { module: [8,1], permission: apiMethod.view }}), awaitHandlerFactory(commissionController.getCommision))
router.put('/',updateCommision,auth(role.Admin), awaitHandlerFactory(commissionController.updateCommision))

router.get('/direct-agent/pre-paid', directAgentPrePaidCommissionReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,18], permission: apiMethod.view }}), awaitHandlerFactory(commissionController.directAgentPrePaidCommissionReport))
router.get('/direct-agent/post-paid', directAgentPostPaidCommissionReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,19], permission: apiMethod.view }}), awaitHandlerFactory(commissionController.directAgentPostPaidCommissionReport))
router.get('/indirect-agent/pre-paid', inDirectAgentPrePaidCommissionReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,20], permission: apiMethod.view }}), awaitHandlerFactory(commissionController.inDirectAgentPrePaidCommissionReport))
router.get('/indirect-agent/post-paid', inDirectAgentPostPaidCommissionReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,21], permission: apiMethod.view }}), awaitHandlerFactory(commissionController.inDirectAgentPostPaidCommissionReport))

module.exports = router;