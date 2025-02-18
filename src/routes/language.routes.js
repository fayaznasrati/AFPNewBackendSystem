const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const languageController = require('../controllers/language.controller');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const { createLanguageSchema, allLanguageSchema, deleteLanguageSchema, updateLanguageSchema } = require('../middleware/validators/languageValidators.middleware');

// Language APIs
router.get('/', allLanguageSchema, auth(), awaitHandlerFactory(languageController.allLanguage));
router.post('/', createLanguageSchema, auth(role.Admin), awaitHandlerFactory(languageController.createLanguage));
router.put('/', updateLanguageSchema, auth(role.Admin), awaitHandlerFactory(languageController.updateLanguage));
router.delete('/', deleteLanguageSchema, auth(role.Admin), awaitHandlerFactory(languageController.deleteLanguage));

module.exports = router;