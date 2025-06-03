const express = require('express');
const router = express.Router();

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const auth = require('../middleware/auth.middleware');
const role = require('../utils/userRoles.utils')
const { createCompanyMiddleware,genAPIKeyCompanyMiddleware,singlerecharge,checkBalance} = require('../middleware/validators/companyValidator.middleware');
const companyController = require('../controllers/company.controller');
const accessManager = require('../middleware/acessManager.middleware');
const apiMethodUtils = require('../utils/apiMethod.utils');
const validateCompanyAuth = require('../middleware/validateCompanyAuth.middleware.js');
// admin dashboard 
router.post('/', createCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.createCompany))
router.get('/',  auth(role.Admin), awaitHandlerFactory(companyController.getCompanies))
router.post('/gen-api-key/:id', genAPIKeyCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.generateCompanyKeys));
router.patch('/:id', createCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(companyController.editCompany))
// recharge oprions
// router.post('/recharge',singlerecharge,auth(1,2,3,4,5,6), accessManager({agent : { module: [2,1], permission: apiMethodUtils.add }}), awaitHandlerFactory(companyController.CompanySinglerecharge));
router.post(
  '/recharge',singlerecharge,validateCompanyAuth, // ← your HMAC+key auth middleware
  awaitHandlerFactory(companyController.CompanySinglerecharge)
);


router.post(
  '/check-balance',checkBalance,validateCompanyAuth, // ← your HMAC+key auth middleware
  awaitHandlerFactory(companyController.CompanyActivityStatus)
);



module.exports = router;