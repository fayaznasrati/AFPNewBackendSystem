// const express = require('express');
// const router = express.Router();

// const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

// const ussdController = require('../controllers/ussd.controller');
// const { checkBalance } = require('../middleware/validators/companyValidator.middleware');
// const validateCompanyAuthCheckBalance = require('../middleware/validateCompanyAuthCheckBalance.middleware');
// const companyController = require('../controllers/company.controller');

// // router.post('/', awaitHandlerFactory(ussdController.ussdMain))
// router.get('/x-balance',(req,res)=>{
//      res.json({ message: "test one." });
// });
//  router.get('/check-balance',checkBalance,validateCompanyAuthCheckBalance, awaitHandlerFactory(companyController.CompanyActivityStatus));
// module.exports = router;