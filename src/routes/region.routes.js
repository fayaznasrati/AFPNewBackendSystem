const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const regionController = require('../controllers/region.controller');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const { createRegionSchema, allRegionSchema, deleteRegionSchema, updateRegionSchema,getRegionDetails,
    allRegionbyParentId } = require('../middleware/validators/regionValidators.middleware');

// Region APIs
router.get('/', allRegionSchema,auth(), awaitHandlerFactory(regionController.allRegion));
router.get('/id', getRegionDetails, awaitHandlerFactory(regionController.getRegionDetails))
router.post('/', createRegionSchema, auth(role.Admin), awaitHandlerFactory(regionController.createRegion));
router.put('/', updateRegionSchema, auth(role.Admin), awaitHandlerFactory(regionController.updateRegion));
router.delete('/', deleteRegionSchema, auth(role.Admin), awaitHandlerFactory(regionController.deleteRegion));

//get region list accoringd to 
router.get('/user-id',allRegionbyParentId,awaitHandlerFactory(regionController.allRegionbyParentId))

module.exports = router;