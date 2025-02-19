const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const bundlebundlebundleRechargeController = require('../controllers/bundleRecharge.controller');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const {
    bundlesinglerecharge,singlerecharge,acceptRecharge,rejectRecharge,getPendingRechargeList,topUpreports,downlineTopUpReport,
    groupTopUpReport,telcoWiseTopUpReport,agentTopupReport,topUpSummeryReport,agentDownlineTopUpReport,agentTelcoTopUpreport,
    agentCommissionReport,commissionReport,adminCommissionReport,topRankingReport,groupTopUpReportByGroupId,pendingRechange,
    responceUpdateRoshan, commissionReportSum, successToFailedRecharge, resendConformationSms
} = require('../middleware/validators/bundlerechargeValidator.middleware');

// recharge oprions
router.post('/activation',bundlesinglerecharge,auth(1,2,3,4,5,6), accessManager({agent : { module: [2,1], permission: apiMethod.add }}), awaitHandlerFactory(bundlebundlebundleRechargeController.bundlesinglerecharge));

// // api for recharge 
// router.get('/pending',getPendingRechargeList,awaitHandlerFactory(bundlebundleRechargeController.getPendingRechargeList));
// router.post('/accept',acceptRecharge,awaitHandlerFactory(bundlebundleRechargeController.acceptRecharge));
// router.post('/resend-conformation-sms', resendConformationSms, awaitHandlerFactory(bundlebundleRechargeController.resendConformationSms))
// router.post('/accept/accept-no-response',acceptRecharge,awaitHandlerFactory(bundlebundleRechargeController.acceptRechargeNoResponse));
// router.post('/reject',rejectRecharge,awaitHandlerFactory(bundlebundleRechargeController.rejectRecharge));
// router.post('/pending',pendingRechange,awaitHandlerFactory(bundlebundleRechargeController.pendingRechange));

// router.post('/mno-response',successToFailedRecharge,awaitHandlerFactory(bundlebundleRechargeController.getMnoResponse));
// router.post('/success-to-failed',successToFailedRecharge,awaitHandlerFactory(bundlebundleRechargeController.successToFailedRecharge));

// // reports
// router.get('/report/top-up',topUpreports, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,1], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.topUpreports))
// router.get('/report/downline/top-up',downlineTopUpReport, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,2], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.downlineTopUpReport))
// router.get('/report/group/top-up',groupTopUpReport, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,3], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.groupTopUpReport))
// router.get('/report/telco/top-up',telcoWiseTopUpReport, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,6], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.telcoWiseTopUpReport))

// // admin panel report
// router.get('/admin-report/top-up',agentTopupReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,6], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.agentTopupReport))
// router.get('/admin-report/summery/top-up',topUpSummeryReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,7], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.topUpSummeryReport))
// router.get('/admin-report/downline/top-up',agentDownlineTopUpReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,8], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.agentDownlineTopUpReport))
// router.get('/admin-report/telco/top-up',agentTelcoTopUpreport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,9], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.agentTelcoTopUpreport))

// // admin commission reports
// router.get('/admin/agent-commission/report',agentCommissionReport, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6),accessManager({subAdmin : { module: [6,1], permission: apiMethod.view }, agent : { module: [8,3], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.agentCommissionReport))
// router.get('/admin/commission/report',adminCommissionReport, auth(role.Admin), awaitHandlerFactory(bundlebundleRechargeController.adminCommissionReport))

// // agent commission reports
// router.get('/agent/my-commission/report',commissionReport,auth(1,2,3,4,5,6), accessManager({agent : { module: [8,2], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.commissionReport))
// router.get('/agent/commission/report/weekly',commissionReportSum,auth(1,2,3,4,5,6), accessManager({agent : { module: [8,2], permission: apiMethod.view }}), awaitHandlerFactory(bundlebundleRechargeController.commissionReportSum))

// // top agent report
// router.get('/top-agent/report',topRankingReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,14], permission: apiMethod.add }}),awaitHandlerFactory(bundlebundleRechargeController.topRankingReport))

// // goup top up report for admin panel
// router.get('/group-top-up/report',groupTopUpReportByGroupId, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,13], permission: apiMethod.add }}),awaitHandlerFactory(bundlebundleRechargeController.groupTopUpReportByGroupId))

// // APIs update responce in log table
// router.post('/log/roshan', responceUpdateRoshan, awaitHandlerFactory(bundlebundleRechargeController.responceUpdateRoshan))

module.exports = router;