const express = require('express');
const router = express.Router();

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const auth = require('../middleware/auth.middleware');
const role = require('../utils/userRoles.utils')

const dashboardController = require('../controllers/dashboard.controller')

const { adminDashBoardStatus, adminDashBoardGraph, agentDashBoardStatus, agentDashBoardgraph} = require('../middleware/validators/dashboardValidator.middleware')

// admin dashboard 
router.get('/admin/dashboard-status', adminDashBoardStatus, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(dashboardController.adminDashBoardStatus))
router.get('/admin/top-up/amount', adminDashBoardGraph, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(dashboardController.adminOperatorWiseTopUpAmount))
router.get('/admin/top-up/count', adminDashBoardGraph, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(dashboardController.adminOperatorWiseTopUpCount))
router.get('/admin/commission/amount', adminDashBoardGraph, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(dashboardController.adminOperatorWiseCommAmount))
router.get('/admin/commission/count', adminDashBoardGraph, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(dashboardController.adminOperatorWiseCommCount))
router.get('/admin/top-agent/sale', adminDashBoardGraph, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(dashboardController.adminTopAgentSale))
router.get('/admin/top-agent/top-up', adminDashBoardGraph, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(dashboardController.adminTopAgentTopUp))

// agetn dashboard
router.get('/agent/dashboard-status', agentDashBoardStatus, auth(1,2,3,4,5,6), awaitHandlerFactory(dashboardController.agentDashBoardStatus))
router.get('/agent/child/commission/amount', agentDashBoardgraph, auth(1,2,3,4,5,6), awaitHandlerFactory(dashboardController.agentOperatorWiseCommAmount))
router.get('/agent/commission/count', agentDashBoardgraph, auth(1,2,3,4,5,6), awaitHandlerFactory(dashboardController.agentOperatorWiseCommissionCount))
router.get('/agent/top-up/amount', agentDashBoardgraph, auth(1,2,3,4,5,6), awaitHandlerFactory(dashboardController.agnetOperatorWiseTopUpAmount))
router.get('/agent/top-up/count', agentDashBoardgraph, auth(1,2,3,4,5,6), awaitHandlerFactory(dashboardController.agentOperatorWiseTopUpCount))
router.get('/agent/top-agent/sale', adminDashBoardGraph, auth(1,2,3,4,5,6), awaitHandlerFactory(dashboardController.agentTopAgentSale))
router.get('/agent/top-agent/top-up', adminDashBoardGraph, auth(1,2,3,4,5,6), awaitHandlerFactory(dashboardController.agentTopAgentTopUp))

module.exports = router;