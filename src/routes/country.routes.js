const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');

const countryController = require('../controllers/country.controller');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const { createCountrySchema, allCountrySchema, deleteCountrySchema, updateCountrySchema } = require('../middleware/validators/countryValidators.middleware');

// Country APIs
router.get('/', allCountrySchema, awaitHandlerFactory(countryController.allCountry));
router.post('/', createCountrySchema, auth(role.Admin), awaitHandlerFactory(countryController.createCountry));
router.put('/', updateCountrySchema, auth(role.Admin), awaitHandlerFactory(countryController.updateCountry));
router.delete('/', deleteCountrySchema, auth(role.Admin), awaitHandlerFactory(countryController.deleteCountry));

module.exports = router;