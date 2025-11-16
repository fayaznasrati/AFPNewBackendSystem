const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const walletController = require('../controllers/wallet.controller')

const { 
    getWalletBalanceSchema, createWalletSchema, getTransationDetialsByUserIdSchema, adwnaceSearchSchema, 
    walletBalance,getAgentBalanceReport,transactionReport,getAgentAcountBalanceForRollback,transferRollbackAmount,
    getTransferRollbackDetails,getTransactionSummeryReport,getStockTransferSummeryReports,getSystemWalletBal
} = require('../middleware/validators/walletValidator.middleware')

//Apis for wallet 
router.get('/', getWalletBalanceSchema, auth(role.Admin), awaitHandlerFactory(walletController.getWalletBalance))
router.post('/', createWalletSchema, auth(role.Admin), awaitHandlerFactory(walletController.createWallet))

//apis for wallet transaction
router.get('/transaction', getTransationDetialsByUserIdSchema, auth(role.Admin), awaitHandlerFactory(walletController.getTransationDetialsByUserId))
router.get('/transaction-report', adwnaceSearchSchema, auth(1,2,3,4,5,6), accessManager({ agent: { module: [5,4], permission: apiMethod.view }}), awaitHandlerFactory(walletController.adwnaceSearch))

// wallet related api 
router.get('/details',walletBalance, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6),accessManager({subAdmin : { module: [5,3], permission: apiMethod.view } , agent: { module: [4,1], permission: apiMethod.view }}), awaitHandlerFactory(walletController.walletBalance)) 

// agent wallet report api
router.get('/agent/report',getAgentBalanceReport,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,11], permission: apiMethod.view }}), awaitHandlerFactory(walletController.getAgentBalanceReport))
router.get('/agent/download-report',getAgentBalanceReport,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,11], permission: apiMethod.view }}), awaitHandlerFactory(walletController.downloadAgentBalanceReport))

//transaction report
router.get('/transaction/report',transactionReport,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [2,15], permission: apiMethod.view } , agent: { module: [5,4], permission: apiMethod.view }}), awaitHandlerFactory(walletController.transactionReport))
router.get('/download-transaction/report',transactionReport,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [2,15], permission: apiMethod.view } , agent: { module: [5,4], permission: apiMethod.view }}), awaitHandlerFactory(walletController.downloadTransactionReport))
router.get('/download-transaction/report-pdf',transactionReport,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [2,15], permission: apiMethod.view } , agent: { module: [5,4], permission: apiMethod.view }}), awaitHandlerFactory(walletController.downloadTransactionReportpdf))
router.get('/transaction-summery/report',getTransactionSummeryReport,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,16], permission: apiMethod.view }}), awaitHandlerFactory(walletController.getTransactionSummeryReport))
router.get('/download-transaction-summery/report',getTransactionSummeryReport,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,16], permission: apiMethod.view }}), awaitHandlerFactory(walletController.downloadTransactionSummeryReport))

//stock transaction report
router.get('/stock-transaction/report',getStockTransferSummeryReports,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,17], permission: apiMethod.view }}), awaitHandlerFactory(walletController.getStockTransferSummeryReports))
router.get('/download-stock-transaction/report',getStockTransferSummeryReports,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,17], permission: apiMethod.view }}), awaitHandlerFactory(walletController.downloadStockTransferSummeryReports))

// system and api current balance 
router.get('/api-system/balance',getSystemWalletBal,auth(role.Admin,role.SubAdmin), accessManager({subAdmin:{ module:[5,3], permission: apiMethod.view}}), awaitHandlerFactory(walletController.getSystemWalletBal))

// api related to rollback
router.get('/acount/rollback',getAgentAcountBalanceForRollback,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [7,1], permission: apiMethod.view }}), awaitHandlerFactory(walletController.getAgentAcountBalanceForRollback))
router.get('/download-acount/rollback',getAgentAcountBalanceForRollback,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [7,1], permission: apiMethod.view }}), awaitHandlerFactory(walletController.downloadAgentAcountBalanceForRollback))
router.post('/acount/rollback',transferRollbackAmount,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [7,1], permission: apiMethod.add }}), awaitHandlerFactory(walletController.transferRollbackAmount))
router.get('/acount/rollback/report',getTransferRollbackDetails,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [7,2], permission: apiMethod.view }}), awaitHandlerFactory(walletController.getTransferRollbackDetails))
router.get('/download-acount/rollback/report',getTransferRollbackDetails,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [7,2], permission: apiMethod.view }}), awaitHandlerFactory(walletController.downloadTransferRollbackDetails))
router.get('/acount/rollback/agent/report', auth(1,2,3,4,5,6), accessManager({ agent: { module: [6,5], permission: apiMethod.view }}), awaitHandlerFactory(walletController.getAgentRollbackReport))

module.exports = router;