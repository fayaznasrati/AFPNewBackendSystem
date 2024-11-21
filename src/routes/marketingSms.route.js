const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const smsController = require('../controllers/marketingSms.controller');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const {
    allSmsTemplateCategorySchema,createSmsTemplateCategorySchema,updateSmsTemplateCategorySchema,deleteSmsTemplateCategorySchema,
    createSmsTemplateSchemaa,allSmsTemplateSchema,findMessageSmsTemplateschema,updateSmsTemplateSchemaa,deleteSmsTemplateSchemaa,
    allSmsGroupSchema,findMessageSmsgroupSchema,createcreateSmsGroup,createcreateSmsGroupWithTemplate,updateSmsGroupSchema,
    deleteSmsGroupSchema,allSmsGroupDateRangeschema,allSmsSchema,updateSmsSchema,createSmsSchema,getTemplateDetails,getPendingSms,
    updatePendingStatus
} = require('../middleware/validators/marketingSmsValidators.middleware');

// sms-templete-category APIs
router.get('/sms-templete-category', allSmsTemplateCategorySchema, awaitHandlerFactory(smsController.allSmsTemplateCategory));
router.post('/sms-templete-category', createSmsTemplateCategorySchema, auth(role.Admin), awaitHandlerFactory(smsController.createSmsTemplateCategory));
router.put('/sms-templete-category', updateSmsTemplateCategorySchema, auth(role.Admin), awaitHandlerFactory(smsController.updateSmsTemplateCategory));
router.delete('/sms-templete-category', deleteSmsTemplateCategorySchema, auth(role.Admin), awaitHandlerFactory(smsController.deleteSmsTemplateCategory));

// sms-templete APIs getTemplateDetails
router.get('/sms-templete', allSmsTemplateSchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,2], permission: apiMethod.view }}), awaitHandlerFactory(smsController.allSmsTemplate))
router.get('/sms-templete/details', getTemplateDetails, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,2], permission: apiMethod.edit }}), awaitHandlerFactory(smsController.getTemplateDetails))
router.get('/sms-templete/id', findMessageSmsTemplateschema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,2], permission: apiMethod.view }}), awaitHandlerFactory(smsController.findMessageSmsTemplate))
router.post('/sms-templete', createSmsTemplateSchemaa, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,2], permission: apiMethod.add }}), awaitHandlerFactory(smsController.createSmsTemplate))
router.put('/sms-templete', updateSmsTemplateSchemaa, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,2], permission: apiMethod.edit }}), awaitHandlerFactory(smsController.updateSmsTemplate))
router.delete('/sms-templete', deleteSmsTemplateSchemaa, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.delete }}), awaitHandlerFactory(smsController.deleteSmsTemplate))

//group-sms
router.get('/sms-group', allSmsGroupSchema, auth(role.Admin), awaitHandlerFactory(smsController.allSmsGroup))
router.get('/sms-group/date', allSmsGroupDateRangeschema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,3], permission: apiMethod.view }}), awaitHandlerFactory(smsController.allSmsGroupDateRange))
router.get('/sms-group/id', findMessageSmsgroupSchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,3], permission: apiMethod.view }}), awaitHandlerFactory(smsController.findMessageSmsgroup))
router.post('/sms-group-template', createcreateSmsGroupWithTemplate, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,1], permission: apiMethod.add }}), awaitHandlerFactory(smsController.createSmsGroupWithTemplate))
router.post('/sms-group', createcreateSmsGroup, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [10,1], permission: apiMethod.add }}), awaitHandlerFactory(smsController.createSmsGroup))
router.put('/sms-group', updateSmsGroupSchema, auth(role.Admin), awaitHandlerFactory(smsController.updateSmsGroup))
router.delete('/sms-group', deleteSmsGroupSchema, auth(role.Admin), awaitHandlerFactory(smsController.deleteSmsGroup))

// sms
router.get('/sms', allSmsSchema, auth(role.Admin), awaitHandlerFactory(smsController.allSmsId))
router.post('/sms', createSmsSchema, auth(role.Admin), awaitHandlerFactory(smsController.createSms))
router.put('/sms', updateSmsSchema, auth(role.Admin), awaitHandlerFactory(smsController.updateSms))

// pending sms function
router.post('/roshan/pending/sms',getPendingSms,awaitHandlerFactory(smsController.getRoshanPendingSms))
router.post('/pending/update-status',updatePendingStatus,awaitHandlerFactory(smsController.updatePendingStatus))

module.exports = router;