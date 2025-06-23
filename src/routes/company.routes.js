const express = require('express');
const router = express.Router();

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const auth = require('../middleware/auth.middleware');
const role = require('../utils/userRoles.utils')
const { createCompanyMiddleware,genAPIKeyCompanyMiddleware,singlerecharge,checkBalance,getAgentsName} = require('../middleware/validators/companyValidator.middleware');
const companyController = require('../controllers/company.controller');
const accessManager = require('../middleware/acessManager.middleware');
const apiMethodUtils = require('../utils/apiMethod.utils');
const validateCompanyAuth = require('../middleware/validateCompanyAuth.middleware.js');
const validateCompanyAuthCheckBalance = require('../middleware/validateCompanyAuthCheckBalance.middleware.js');


//  routes to be used by Admin
router.post('/', createCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.createCompany))
router.get('/agents', getAgentsName, auth(role.Admin), awaitHandlerFactory(companyController.getAgentsName))
router.get('/:id', auth(role.Admin), awaitHandlerFactory(companyController.getCompanyById))
router.get('/',  auth(role.Admin), awaitHandlerFactory(companyController.getCompanies))
router.post('/gen-api-key/:id', genAPIKeyCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.generateCompanyKeys));
router.patch('/:id', createCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.editCompany))

//  routes to be used by company
router.post('/recharge',singlerecharge,validateCompanyAuth,awaitHandlerFactory(companyController.CompanySinglerecharge));
router.get('/check-balance',checkBalance,validateCompanyAuthCheckBalance, awaitHandlerFactory(companyController.CompanyActivityStatus));
module.exports = router;