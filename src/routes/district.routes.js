const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const districtController = require('../controllers/district.controller');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const { createDistrictSchema, districtByProvienceUuidSchema, updateDistrictSchema, deleteDistrictSchema } = require('../middleware/validators/districtValidator.middleware');

// Region APIs
router.get('/id', districtByProvienceUuidSchema, awaitHandlerFactory(districtController.districtByProvienceUuid));
router.post('/', createDistrictSchema, auth(role.Admin), awaitHandlerFactory(districtController.createDistrict));
router.put('/', updateDistrictSchema, auth(role.Admin), awaitHandlerFactory(districtController.updateDistrict));
router.delete('/', deleteDistrictSchema, auth(role.Admin), awaitHandlerFactory(districtController.deleteDistrict));

module.exports = router;