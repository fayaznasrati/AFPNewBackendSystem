const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const adminController = require('../controllers/admin.controller');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const { createUserSchema, validateLogin, changePasswordScheme, updateUserDetials,requestForOtp,getOtp,verifyAndUpdateNumber,
    getSecurityPin,updateSecurityPin,verifySecurityPin,updateAgentPassword,addSubAdmin,getSubAdminList,
    updateSubadminDetails,getPerSubAdminDetails,verifyAccess,loginAccess,forgetSendPassword, getUserByuserName,
    getSubAdminPassword, updateSubAdminPassword, updateSubAdminPin
} = require('../middleware/validators/adminValidator.middleware');

const agentAdminfunction = require('../controllers/agentAdminfunction.controller')
const {requestLoginOtp,getLoginOtp,verifyOtpGetLoginAccess,verifyAgentId,agentLogin } = require('../middleware/validators/agentAdminfunction.validator.middleware')

//router.post('/', createUserSchema, awaitHandlerFactory(adminController.createUser));

router.post('/', createUserSchema,  auth(role.Admin) , awaitHandlerFactory(adminController.createUser));

router.post('/login', validateLogin, awaitHandlerFactory(adminController.userLogin));
router.post('/logout',  auth(),  adminController.userLogout);
router.get('/username/:username', getUserByuserName, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.getUserByuserName));

router.put('/password', changePasswordScheme, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.changePassword))

router.put('/', updateUserDetials, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.updateUserDetials))
router.put('/update-user', updateUserDetials, auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.updateUser))

//API to change mobile number
router.post('/get-otp/',requestForOtp,auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.requestForOtp))
router.get('/get-otp/',getOtp,auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.getOtp))
router.post('/update-numnber',verifyAndUpdateNumber,auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.verifyAndUpdateNumber))

//APIs for T-pin
router.get('/t-pin',getSecurityPin,auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.getSecurityPin))
router.post('/t-pin',updateSecurityPin,auth(role.Admin,role.SubAdmin), awaitHandlerFactory(adminController.updateSecurityPin))
router.post('/verify/t-pin',verifySecurityPin, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(adminController.verifySecurityPin))
router.post('/update-password',updateAgentPassword, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [1,1], permission: apiMethod.edit }}), awaitHandlerFactory(adminController.updateAgentPassword))

// Admin login as Agetn APis
// router.post('/admin-agent-otp/',requestLoginOtp,auth(), awaitHandlerFactory(agentAdminfunction.requestLoginOtp))
// router.get('/admin-agent-otp',getLoginOtp, auth(), awaitHandlerFactory(agentAdminfunction.getLoginOtp))
// router.post('/admin-agent-otp/verify',verifyOtpGetLoginAccess,auth(), awaitHandlerFactory(agentAdminfunction.verifyOtpGetLoginAccess))
router.post('/agent-login',agentLogin,auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(agentAdminfunction.agentLogin)) // child condition applyed

// Force logout agent 
router.post('/force-logout',verifyAgentId,auth(role.Admin,role.SubAdmin,1,2,3,4,5), accessManager({subAdmin : { module: [1,1], permission: apiMethod.view } , agent: { module: [1,1], permission: apiMethod.view }}), awaitHandlerFactory(agentAdminfunction.forceLogout)) // child condition applyed

//api related to sub admin
router.post('/sub-admin/',addSubAdmin,auth(role.Admin), awaitHandlerFactory(adminController.addSubAdmin)) // create sub admin
router.get('/sub-admin',getSubAdminList,auth(role.Admin), awaitHandlerFactory(adminController.getSubAdminList)) //get allsub admin
router.get('/sub-admin/download',getSubAdminList,auth(role.Admin), awaitHandlerFactory(adminController.downloadSubAdminList)) //get allsub admin
router.put('/sub-admin',updateSubadminDetails, auth(role.Admin), awaitHandlerFactory(adminController.updateSubadminDetails)) // update sub admin details
router.get('/sub-admin/id',getPerSubAdminDetails,auth(role.Admin), awaitHandlerFactory(adminController.getPerSubAdminDetails)) // get singel adimn details


router.post('/sub-admin/state',verifyAccess,auth(role.Admin), awaitHandlerFactory(adminController.changeActiveState)) //change status
router.post('/sub-admin/delete',verifyAccess,auth(role.Admin), awaitHandlerFactory(adminController.deleteSubAdmin)) // change active state
router.post('/sub-admin/login-access',loginAccess,auth(role.Admin),awaitHandlerFactory(adminController.loginAccess))

// API for forget password
router.post('/forgot-password',forgetSendPassword,awaitHandlerFactory(adminController.forgetSendPassword))

// cahnge password and security pin for sub admin
router.post('/sub-admin//verify/password',getSubAdminPassword,auth(role.Admin),awaitHandlerFactory(adminController.getSubAdminPassword))
router.post('/sub-admin/update/password',updateSubAdminPassword,auth(role.Admin),awaitHandlerFactory(adminController.updateSubAdminPassword))
router.post('/sub-admin/verify/security-pin',getSubAdminPassword,auth(role.Admin),awaitHandlerFactory(adminController.getSubAdminPin))
router.post('/sub-admin/update/security-pin',updateSubAdminPin,auth(role.Admin),awaitHandlerFactory(adminController.updateSubAdminPin))

module.exports = router;