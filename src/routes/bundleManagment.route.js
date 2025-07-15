const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const EbundleController = require('../controllers/ebundle.controller')

const role = require('../utils/userRoles.utils');


const { createEbundle } = require('../middleware/validators/bundlerechargeValidator.middleware');


const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');


router.post('/create',  createEbundle, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.createEbundle))
router.get('/all',  auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.getEbundle))
router.get('/get',   auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.getEbundleById))
router.put('/edit',  createEbundle, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.updateBundle))
router.delete('/delete', auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.deleteBundle))

// admin panel report
router.get('/ebundl-report',   auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.getEbundleReports))
router.get('/download-ebundl-report',   auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.downloadEbundleReports))

// router.get('/summery-report',topUpSummeryReport, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.getEbundleSummeryReport))
router.get('/summery-report', auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.getEbundleSummeryReport))
router.get('/download-summery-report', auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.downloadEbundleSummeryReport))
router.get('/downline-report', auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.getAgentEbundleDownlineReport))
router.get('/download-downline-report', auth(role.Admin,role.SubAdmin), awaitHandlerFactory(EbundleController.downloadAgentEbundleDownlineReport))
// router.get('/admin-report/downline/top-up',agentDownlineTopUpReport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,8], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.agentDownlineTopUpReport))
// router.get('/admin-report/telco/top-up',agentTelcoTopUpreport, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,9], permission: apiMethod.view }}), awaitHandlerFactory(rechargeController.agentTelcoTopUpreport))


module.exports = router;

