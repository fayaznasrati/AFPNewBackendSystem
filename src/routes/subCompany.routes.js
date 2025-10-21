const express = require('express');
const router = express.Router();

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware.js');
const auth = require('../middleware/auth.middleware.js');
const role = require('../utils/userRoles.utils.js')
const { createSubCompanyMiddleware,updateSubCompanyMiddleware,genAPIKeySubCompanyMiddleware,singlerecharge,checkBalance,getAgentsName,rechargeStatus} = require('../middleware/validators/subCompanyValidator.middleware.js');
const subCompanyController = require('../controllers/subCompany.controller.js');
const validateSubCompanyAuth = require('../middleware/validateSubCompanyAuth.middleware.js');
// const validateSubCompanyAuthCheckBalance = require('../middleware/validateCompanyAuthCheckBalance.middleware.js');



//  routes to be used by company
router.post('/recharge',singlerecharge,validateSubCompanyAuth,awaitHandlerFactory(subCompanyController.CompanySinglerecharge));
// router.get('/recharge-report',validateSubCompanyAuthCheckBalance,awaitHandlerFactory(subCompanyController.getCompanyRechargeReport));
// router.get('/check-balance',checkBalance,validateSubCompanyAuthCheckBalance, awaitHandlerFactory(subCompanyController.CompanyActivityStatus));
// router.post('/recharge-status',rechargeStatus,validateSubCompanyAuthCheckBalance, awaitHandlerFactory(subCompanyController.getCompanyRechargeStatus));

//  routes to be used by Admin
// router.get('/download',  auth(role.Admin,role.SubAdmin), awaitHandlerFactory(subCompanyController.downloadCompanies))
router.post('/', createSubCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(subCompanyController.createCompany))
// router.get('/agents', getAgentsName, auth(role.Admin), awaitHandlerFactory(subCompanyController.getAgentsName))
router.get('/:id', auth(role.Admin,role.SubAdmin), awaitHandlerFactory(subCompanyController.getCompanyById))
router.get('/',  auth(role.Admin,role.SubAdmin), awaitHandlerFactory(subCompanyController.getCompanies))
router.post('/gen-api-key/:id', auth(role.Admin), genAPIKeySubCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(subCompanyController.generateCompanyKeys));
router.patch('/:id', updateSubCompanyMiddleware, auth(role.Admin), awaitHandlerFactory(subCompanyController.editCompany))



module.exports = router;


