const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const membersController = require('../controllers/topupMember.controller')
const { 
    createMemberGroup,getMemberGroups,updateMemberGroup,deleteMessagegroup,getMemberList,addMember,updateMemberDetails,
    deleteMember,getUserGroupList,addAgentGroup,getAgentGroupList,getAgentMemberList,addAgentGroupMember,updateAgentMember,
    deleteAgentMember,addMemberBulk
} = require('../middleware/validators/topupMemberValidators.middleware')

const walletMemberGroupController = require('../controllers/walletMember.controll')
const { 
    createWalletMemberGroup,getWalletMemberGroup,updateWalletMembergroup,deleteWalletMemberGroup,addWalletMemberGroupAgent,
    getWalletMemberGroupAgent,getWalletMemberGroupAgentById,updateWalletMemberGroupAgent,deleteWalletMemberGroupAgent
} = require('../middleware/validators/walletMemberValidator.middleware')

// group related apis
router.get('/group', getMemberGroups, auth(1,2,3,4,5,6), accessManager({agent: { module: [3,3], permission: apiMethod.view }}), awaitHandlerFactory(membersController.getMemberGroups));
router.post('/group', createMemberGroup, auth(1,2,3,4,5,6), accessManager({agent: { module: [3,3], permission: apiMethod.add }}), awaitHandlerFactory(membersController.createMemberGroup));
router.put('/group', updateMemberGroup, auth(1,2,3,4,5,6),  accessManager({agent: { module: [3,3], permission: apiMethod.edit }}), awaitHandlerFactory(membersController.updateMemberGroup));
router.delete('/group', deleteMessagegroup, auth(1,2,3,4,5,6), accessManager({agent: { module: [3,3], permission: apiMethod.delete }}), awaitHandlerFactory(membersController.deleteMessagegroup));

// group member related apis
router.get('/', getMemberList, auth(1,2,3,4,5,6), accessManager({agent: { module: [3,2], permission: apiMethod.view }}), awaitHandlerFactory(membersController.getMemberList));
router.post('/', addMemberBulk, auth(1,2,3,4,5,6), accessManager({agent: { module: [3,2], permission: apiMethod.add }}), awaitHandlerFactory(membersController.addMember));
router.put('/', updateMemberDetails, auth(1,2,3,4,5,6),  accessManager({agent: { module: [3,2], permission: apiMethod.add }}), awaitHandlerFactory(membersController.updateMemberDetails));
router.delete('/', deleteMember, auth(1,2,3,4,5,6), accessManager({agent: { module: [3,2], permission: apiMethod.delete }}), awaitHandlerFactory(membersController.deleteMember));

// route for admin to get all group list
router.get('/agent-group', getUserGroupList, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,13], permission: apiMethod.view }}), awaitHandlerFactory(membersController.getUserGroupList))
router.get('/download-agent-group', getUserGroupList, auth(role.Admin,role.SubAdmin),accessManager({subAdmin : { module: [2,13], permission: apiMethod.view }}), awaitHandlerFactory(membersController.downloadUserGroupList))

// group related function by admin
router.post('/admin/group',addAgentGroup, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,13], permission: apiMethod.add }}), awaitHandlerFactory(membersController.addAgentGroup))
router.get('/admin/group',getAgentGroupList, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,13], permission: apiMethod.view }}), awaitHandlerFactory(membersController.getAgentGroupList))
router.get('/admin/member',getAgentMemberList, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,13], permission: apiMethod.view }}), awaitHandlerFactory(membersController.getAgentMemberList))
router.post('/admin/member',addAgentGroupMember, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,13], permission: apiMethod.add }}), awaitHandlerFactory(membersController.addAgentGroupMember))
router.put('/admin/member',updateAgentMember, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,13], permission: apiMethod.edit }}), awaitHandlerFactory(membersController.updateAgentMember))
router.delete('/admin/member',deleteAgentMember, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [2,13], permission: apiMethod.delete }}), awaitHandlerFactory(membersController.deleteAgentMember))


// wallet members related apis #######################################################
// group related apis
router.get('/wallet/group',getWalletMemberGroup, auth(),awaitHandlerFactory(walletMemberGroupController.getWalletMemberGroup))
router.post('/wallet/group',createWalletMemberGroup, auth(),awaitHandlerFactory(walletMemberGroupController.createWalletMemberGroup))
router.put('/wallet/group',updateWalletMembergroup, auth(),awaitHandlerFactory(walletMemberGroupController.updateWalletMembergroup))
router.delete('/wallet/group',deleteWalletMemberGroup, auth(),awaitHandlerFactory(walletMemberGroupController.deleteWalletMemberGroup))

//group member list
router.get('/wallet/member',getWalletMemberGroupAgent, auth(), awaitHandlerFactory(walletMemberGroupController.getWalletMemberGroupAgent))
router.post('/wallet/member',addWalletMemberGroupAgent,auth(),awaitHandlerFactory(walletMemberGroupController.addWalletMemberGroupAgent))
router.get('/wallet/member/id',getWalletMemberGroupAgentById, auth(), awaitHandlerFactory(walletMemberGroupController.getWalletMemberGroupAgentById))
router.put('/wallet/member',updateWalletMemberGroupAgent,auth(),awaitHandlerFactory(walletMemberGroupController.updateWalletMemberGroupAgent))
router.delete('/wallet/member',deleteWalletMemberGroupAgent,auth(),awaitHandlerFactory(walletMemberGroupController.deleteWalletMemberGroupAgent))

module.exports = router;