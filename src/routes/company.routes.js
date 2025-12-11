const express = require('express');
const router = express.Router();

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const auth = require('../middleware/auth.middleware');
const role = require('../utils/userRoles.utils')
const { createCompanyMiddleware,genAPIKeyCompanyMiddleware,singlerecharge,checkBalance,getAgentsName,rechargeStatus} = require('../middleware/validators/companyValidator.middleware');
const companyController = require('../controllers/company.controller');
const validateCompanyAuth = require('../middleware/validateCompanyAuth.middleware.js');
const validateCompanyAuthCheckBalance = require('../middleware/validateCompanyAuthCheckBalance.middleware.js');



//  routes to be used by company
router.post('/recharge',singlerecharge,validateCompanyAuth,awaitHandlerFactory(companyController.CompanySinglerecharge));
router.get('/recharge-report',validateCompanyAuthCheckBalance,awaitHandlerFactory(companyController.getCompanyRechargeReport));
router.get('/check-balance',checkBalance,validateCompanyAuthCheckBalance, awaitHandlerFactory(companyController.CompanyActivityStatus));
router.post('/recharge-status',rechargeStatus,validateCompanyAuthCheckBalance, awaitHandlerFactory(companyController.getCompanyRechargeStatus));

//  routes to be used by Admin
router.get('/download',  auth(role.Admin,role.SubAdmin), awaitHandlerFactory(companyController.downloadCompanies))
router.post('/', createCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.createCompany))
router.get('/agents', getAgentsName, auth(role.Admin), awaitHandlerFactory(companyController.getAgentsName))
router.get('/:id', auth(role.Admin,role.SubAdmin), awaitHandlerFactory(companyController.getCompanyById))
router.get('/',  auth(role.Admin,role.SubAdmin), awaitHandlerFactory(companyController.getCompanies))
router.post('/gen-api-key/:id', auth(role.Admin), genAPIKeyCompanyMiddleware, awaitHandlerFactory(companyController.generateCompanyKeys));
router.patch('/:id', createCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.editCompany))



module.exports = router;


