const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const agentActivityTypeController = require('../controllers/agentActivityType.controller');

const {getAllActivityType, createActivityType,updateActivityType } = require('../middleware/validators/agentActivityTypeValidator.middleware');

// api calls
router.get('/',getAllActivityType,auth(role.Admin),awaitHandlerFactory(agentActivityTypeController.getAllActivityType));
router.post('/',createActivityType,auth(role.Admin),awaitHandlerFactory(agentActivityTypeController.createActivityType));
router.put('/',updateActivityType,auth(role.Admin),awaitHandlerFactory(agentActivityTypeController.updateActivityType));

// api call for different user types
router.get('/admin',getAllActivityType,auth(role.Admin),awaitHandlerFactory(agentActivityTypeController.getAdminActivityType));
router.get('/sub-admin',getAllActivityType,auth(role.Admin,role.SubAdmin),awaitHandlerFactory(agentActivityTypeController.getSubAdminActivityType));
router.get('/agent',getAllActivityType,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6),awaitHandlerFactory(agentActivityTypeController.getAgentActivityType));

module.exports = router;