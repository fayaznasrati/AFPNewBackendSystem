const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils')
const role = require('../utils/userRoles.utils');

const loginController = require('../controllers/login.controller');
const agentController = require('../controllers/agent.controller');
const adminController = require('../controllers/admin.controller');

const accessManager = require('../middleware/acessManager.middleware')

// const { verifySecurityPin,updateAgentPassword } = require('../middleware/validators/adminValidator.middleware');

const {
    createLoginSchema,addMpinSchema,getDetialsSchema,updateAgentDetialsSchema,getCommisionType,
    getAllAgent,changeAgentActiveState,advanceSearch,getParentName,
    PostPaidCommision,addPrePaidCommission,verifyAgentUserUuid,getAgentByAgentType,
    agentForceLogout,addPrePaidas1stTran,getSlabList,addAutoGenNumber,updatePrePaidCommission,getForceLogoutStatus, getUplineAgentList,
    deleteAlternateNumber
} = require('../middleware/validators/loginValidator.middleware')

const {
    addNumberSchema,getContactDetailsSchema,updateContactDetailsSchema,
    createOperatorAccessSchema,getOperatorByIdSchema,updateOperatorStatusSchema,
    createStockTransferSchema,getStockTransferByIdSchema,updateStransferChannelSchema,
    verifySecurityPin,updateAgentPassword,getParentAgentDetail,prePaidParentChange,checkNumber,
    changePostPaidParent,getAgentTypeForSwitchAcc, getParentListForSwitchAcc, updateMpin
} = require('../middleware/validators/agentValidator.middleware');
const agentModule = require('../models/agent.module');


//user login APIs
router.get('/', getDetialsSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5),accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(loginController.getAgentDetails))  // child condition applyed
router.get('/all', getAllAgent, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(loginController.getAllAgent))
router.get('/download-all-agent', getAllAgent, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(loginController.downloadAllAgent))
router.get('/download-downline-all', getAllAgent, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(loginController.downloadDwonlineAgent))
router.get('/ad-search', advanceSearch, auth(role.Admin,role.SubAdmin,1,2,3,4,5),accessManager({subAdmin : { module: [1,2], permission: apiMethod.view } , agent: { module: [1,2], permission: apiMethod.view }}), awaitHandlerFactory(loginController.advanceSearch))  // child condition applyed
router.get('/upline-list',getUplineAgentList, auth(role.Admin,role.SubAdmin,1,2,3,4,5),accessManager({subAdmin : { module: [1,2], permission: apiMethod.view } , agent: { module: [1,2], permission: apiMethod.view }}), awaitHandlerFactory(loginController.getUplineAgentList))
router.get('/parent', getParentName, auth(), awaitHandlerFactory(loginController.getParentName))
router.get('/equal-parent', getParentName, auth(), awaitHandlerFactory(loginController.getEqualParentName))
router.put('/active', changeAgentActiveState, auth(), awaitHandlerFactory(loginController.changeAgentActiveState))  // child condition applyed
router.post('/', createLoginSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5),accessManager({subAdmin : { module: [1,1], permission: apiMethod.add } , agent: { module: [1,1], permission: apiMethod.add }}), awaitHandlerFactory(loginController.createLoginUser));
router.put('/', updateAgentDetialsSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit } , agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(loginController.updateAgentDetials)) // child condition applyed

//common type
router.post('/commission/post-paid/',PostPaidCommision, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.add } , agent: { module: [1,1], permission: apiMethod.add }}), awaitHandlerFactory(loginController.addPostPaidCommision))  // child condition applyed
router.put('/commission/post-paid/', PostPaidCommision,auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit } , agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(loginController.updatePostPaidCommission))  // child condition applyed
router.post('/commission/pre-paid/',addPrePaidCommission, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.add } , agent: { module: [1,1], permission: apiMethod.add }}), awaitHandlerFactory(loginController.addPrePaidCommission))  // child condition applyed
router.put('/commission/pre-paid/',updatePrePaidCommission, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit } , agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(loginController.updatePrePaidCommission)) // child condition applyed
router.get('/commissionType/', getCommisionType, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(loginController.getCommisionType))  // child condition applyed
router.post('/commission/pre-paid-1st',addPrePaidas1stTran,auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.add } , agent: { module: [1,1], permission: apiMethod.add }}), awaitHandlerFactory(loginController.addPrePaidas1stTran)) // child condition applyed

//M-Pin APIs
router.post('/m-pin', addMpinSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), awaitHandlerFactory(loginController.addMpin))  // child condition applyed
router.get('/m-pin', getDetialsSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(loginController.getMpin))  // child condition applyed

//Apis related to Agent contact
router.post('/contact/', addNumberSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.add } , agent: { module: [1,1], permission: apiMethod.add }}), awaitHandlerFactory(agentController.addNumber)) // child condition applyed
router.post('/check-contact/', checkNumber, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.add } , agent: { module: [1,1], permission: apiMethod.add }}), awaitHandlerFactory(agentController.checkContactNumber)) // child condition applyed
router.get('/contact', getContactDetailsSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(agentController.getContactDetails)) // child condition applyed
router.put('/contact/', updateContactDetailsSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit } , agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentController.updateContactDetails)) // child condition applyed
router.post('/contact/random', addAutoGenNumber, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.add } , agent: { module: [1,1], permission: apiMethod.add }}), awaitHandlerFactory(agentController.addAutoGenNumber))  // child condition applyed
router.delete('/contact/alternate',deleteAlternateNumber, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.delete } , agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentController.deleteAlternateNumber)) // delete alternate number

//Apis to create agent operator access
router.post('/operator-access', createOperatorAccessSchema, auth(role.Admin), awaitHandlerFactory(agentController.createOperatorAccess))  // child condition applyed
router.get('/operator-access', getOperatorByIdSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(agentController.getOperatorById))  // child condition applyed
router.put('/operator-access', updateOperatorStatusSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), awaitHandlerFactory(agentController.updateOperatorStatus))  // child condition applyed

//Apis to manage agent stock transfer channel
router.post('/stock-transfer/',  auth(role.Admin), awaitHandlerFactory(agentController.createStockTransfer))
router.get('/stock-transfer/', getStockTransferByIdSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(agentController.getStockTransferById))  // child condition applyed
router.put('/stock-transfer/', updateStransferChannelSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5), awaitHandlerFactory(agentController.updateStransferChannel))  // child condition applyed

// change password by admin
router.post('/verify/t-pin',verifySecurityPin,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit },agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentController.verifySecurityPin))  // child condition applyed
router.post('/update-password',updateAgentPassword,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit },agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentController.updateAgentPassword))  // child condition applyed

// chnage/ update mpin number
router.post('/verify/t-pin/m-pin',verifySecurityPin,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit },agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentController.verifyPinGetMpin))  // child condition applyed
router.post('/m-pin/number',updateMpin,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit },agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentController.updateMpin))  // child condition applyed

//API to send registration message
router.post('/registration-sms',verifyAgentUserUuid, auth(role.Admin,role.SubAdmin,1,2,3,4,5), awaitHandlerFactory(loginController.sendRegistrationMessage))  // child condition applyed

//API to change agent active state
router.post('/state',verifyAgentUserUuid, auth(role.Admin,role.SubAdmin,1,2,3,4,5),  accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit } , agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(loginController.changeAgentActiveState))  // child condition applyed

//agent force logout
router.get('/force-logout',getForceLogoutStatus, awaitHandlerFactory(loginController.getForceLogoutStatus))
router.post('/force-logout',agentForceLogout, auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit },agent: { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(loginController.agentForceLogout))  // child condition applyed

//get slab list
router.get('/slab',getSlabList, auth(), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(loginController.getSlabList))

//switch account api
router.get('/switch-account/agent-type-list',getAgentTypeForSwitchAcc,auth(role.Admin,role.SubAdmin),awaitHandlerFactory(agentController.getAgentTypeForSwitchAcc))
router.get('/switch-account/parent-list',getParentListForSwitchAcc,auth(role.Admin,role.SubAdmin),awaitHandlerFactory(agentController.getParentListForSwitchAcc)) // search parent check
router.get('/switch-account',getParentAgentDetail,auth(role.Admin,role.SubAdmin),awaitHandlerFactory(agentController.getParentAgentDetail))   // child condition applyed
router.post('/switch-account/pre-paid',prePaidParentChange,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentController.changeAgentPrePaidParent))
router.post('/switch-account/post-paid',changePostPaidParent,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(agentController.changePostPaidParent))
// router.get('/switch-account/parent-list', getParentListForSwitchAcc,auth(role.Admin,role.SubAdmin),(req, res)=>{
//     return  res.send("parent-list");
// }) // search parent check

module.exports = router;