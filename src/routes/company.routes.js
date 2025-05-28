const express = require('express');
const router = express.Router();

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const auth = require('../middleware/auth.middleware');
const role = require('../utils/userRoles.utils')

const { createCompanyMiddleware,genAPIKeyCompanyMiddleware} = require('../middleware/validators/companyValidator.middleware');
const companyController = require('../controllers/company.controller');

// admin dashboard 
router.post('/', createCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.createCompany))
router.get('/',  auth(role.Admin), awaitHandlerFactory(companyController.getCompanies))
router.post('/gen-api-key/:id', genAPIKeyCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.generateCompanyKeys));
router.patch('/:id', createCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.editCompany))


module.exports = router;