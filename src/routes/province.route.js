const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const provinceController = require('../controllers/province.controller');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const accessManager = require('../middleware/acessManager.middleware')
const role = require('../utils/userRoles.utils')

const { createProvinceSchema, provinceByRegion, updateProvinceSchema, deleteProvinceSchema } = require('../middleware/validators/provinceValidator.middleware');

// Region APIs
router.get('/id', provinceByRegion, awaitHandlerFactory(provinceController.provinceByRegionUuid));
router.post('/', createProvinceSchema, auth(role.Admin), awaitHandlerFactory(provinceController.createProvince));
router.put('/', updateProvinceSchema, auth(role.Admin), awaitHandlerFactory(provinceController.updateProvince));
router.delete('/', deleteProvinceSchema, auth(role.Admin), awaitHandlerFactory(provinceController.deleteProvince));

module.exports = router;