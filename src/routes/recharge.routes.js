const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const rechargeController = require('../controllers/recharge.controller');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');
const multer = require('multer') ;
const upload = multer({ dest: 'bulk_topup_files/' }); // temp folder

const {
    singlerecharge,groupRecharge,acceptRecharge,rejectRecharge,getPendingRechargeList,topUpreports,downlineTopUpReport,
    groupTopUpReport,telcoWiseTopUpReport,agentTopupReport,topUpSummeryReport,agentDownlineTopUpReport,agentTelcoTopUpreport,
    agentCommissionReport,commissionReport,adminCommissionReport,topRankingReport,groupTopUpReportByGroupId,pendingRechange,
    responceUpdateRoshan, commissionReportSum, successToFailedRecharge, resendConformationSms,failePendingRecharge
} = require('../middleware/validators/rechargeValidator.middleware');

// recharge oprions
router.post('/single',singlerecharge,auth(1,2,3,4,5,6), accessManager({agent : { module: [2,1], permission: apiMethod.add }}), awaitHandlerFactory(rechargeController.singlerecharge));
router.post('/group',groupRecharge,auth(1,2,3,4,5,6), accessManager({agent : { module: [3,1], permission: apiMethod.add }}), awaitHandlerFactory(rechargeController.groupRecharge));


router.post('/bulk-topup', upload.single('excelFile'),auth(1,2,3,4,5,6), accessManager({agent : { module: [3,1], permission: apiMethod.add }}), awaitHandlerFactory(rechargeController.bulkTopupRecharge));



// api for recharge 
router.get('/pending',getPendingRechargeList,awaitHandlerFactory(rechargeController.getPendingRechargeList));
router.post('/accept',acceptRecharge,awaitHandlerFactory(rechargeController.acceptRecharge));
router.post('/resend-conformation-sms', resendConformationSms, awaitHandlerFactory(rechargeController.resendConformationSms))
router.post('/accept/accept-no-response',acceptRecharge,awaitHandlerFactory(rechargeController.acceptRechargeNoResponse));
router.post('/reject',rejectRecharge,awaitHandlerFactory(rechargeController.rejectRecharge));
router.post('/pending',pendingRechange,awaitHandlerFactory(rechargeController.pendingRechange));

router.post('/fail-pending-recharge',failePendingRecharge,auth(role.Admin,role.SubAdmin),awaitHandlerFactory(rechargeController.rejectRecharge));

router.post('/mno-response',successToFailedRecharge,awaitHandlerFactory(rechargeController.getMnoResponse));
router.post('/success-to-failed',successToFailedRecharge,awaitHandlerFactory(rechargeController.successToFailedRecharge));

// reports
router.get('/report/top-up',topUpreports, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,1], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.topUpreports))
router.get('/download-report/top-up',topUpreports, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,1], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.downloadtopUpreports))
router.get('/report/downline/top-up',downlineTopUpReport, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,2], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.downlineTopUpReport))
router.get('/download-report/downline/top-up',downlineTopUpReport, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,2], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.downlineDownlineTopUpReport))
router.get('/report/group/top-up',groupTopUpReport, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,3], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.groupTopUpReport))
router.get('/report/telco/top-up',telcoWiseTopUpReport, auth(1,2,3,4,5,6), accessManager({agent : { module: [5,6], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.telcoWiseTopUpReport))

// admin panel report
router.get('/admin-report/download-Agent-Topup-Report',agentTopupReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,6], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.downloadAgentTopupReport))
router.get('/admin-report/top-up',agentTopupReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,6], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.agentTopupReport))
router.get('/admin-report/download-top-up',agentTopupReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,6], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.downloadAgentTopupReport))
router.get('/admin-report/download-top-up-pdf',agentTopupReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,6], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.downloadAgentTopupReportpdf))
router.get('/admin-report/summery/top-up',topUpSummeryReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,7], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.topUpSummeryReport))
router.get('/admin-report/summery/download-top-up',topUpSummeryReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,7], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.downloadTopUpSummeryReport))
router.get('/admin-report/downline/top-up',agentDownlineTopUpReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,8], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.agentDownlineTopUpReport))
router.get('/admin-report/downline/download-top-up',agentDownlineTopUpReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,8], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.agentDownloadDownlineTopUpReport))
router.get('/admin-report/telco/top-up',agentTelcoTopUpreport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,9], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.agentTelcoTopUpreport))

// admin commission reports
router.get('/admin/agent-commission/report',agentCommissionReport, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6),accessManager({subAdmin : { module: [6,1], permission: apiMethod.view }, agent : { module: [8,3], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.agentCommissionReport))
router.get('/admin/download-agent-commission/report',agentCommissionReport, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6),accessManager({subAdmin : { module: [6,1], permission: apiMethod.view }, agent : { module: [8,3], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.downloadAgentCommissionReport))
router.get('/admin/commission/report',adminCommissionReport, auth(role.Admin), awaitHandlerFactory(rechargeController.adminCommissionReport))
router.get('/admin/download-commission/report',adminCommissionReport, auth(role.Admin), awaitHandlerFactory(rechargeController.adminDownloadCommissionReport))

// agent commission reports
router.get('/agent/my-commission/report',commissionReport,auth(1,2,3,4,5,6), accessManager({agent : { module: [8,2], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.commissionReport))
router.get('/agent/commission/report/weekly',commissionReportSum,auth(1,2,3,4,5,6), accessManager({agent : { module: [8,2], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.commissionReportSum))

// top agent report
router.get('/top-agent/report',topRankingReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,14], permission: apiMethod.add }}),awaitHandlerFactory(rechargeController.topRankingReport))
router.get('/download-top-agent/report',topRankingReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,14], permission: apiMethod.add }}),awaitHandlerFactory(rechargeController.downloadTopRankingReport))

// goup top up report for admin panel
router.get('/group-top-up/report',groupTopUpReportByGroupId, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,13], permission: apiMethod.add }}),awaitHandlerFactory(rechargeController.groupTopUpReportByGroupId))

// APIs update responce in log table
router.post('/log/roshan', responceUpdateRoshan, awaitHandlerFactory(rechargeController.responceUpdateRoshan))

module.exports = router;