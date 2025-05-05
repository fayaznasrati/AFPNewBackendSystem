const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const slabController = require('../controllers/slab.controller')

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const {
    createSlabManagerSchema,updateSlabManagerSchema,allSlabManagerName,getSlabManagerDetialsbyidSchema,
    createDefaultSlabSchema,updateDefaultSlabSchema,getDefaultSlabSchema,getParentSlab,agentSlabById
} = require('../middleware/validators/slabValidator.middleware')

// APIs for slab manager
router.get('/manager/', allSlabManagerName, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [6,2], permission: apiMethod.view } , agent: { module: [8,5], permission: apiMethod.view }}), awaitHandlerFactory(slabController.allSlabManagerName))
router.get('/manager/id', getSlabManagerDetialsbyidSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [6,2], permission: apiMethod.view } , agent: { module: [8,5], permission: apiMethod.view }}), awaitHandlerFactory(slabController.getSlabManagerDetialsbyid))
router.post('/manager/',createSlabManagerSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [6,2], permission: apiMethod.add } , agent: { module: [8,4], permission: apiMethod.add }}), awaitHandlerFactory(slabController.createSlabManager))
router.put('/manager/',updateSlabManagerSchema , auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [6,2], permission: apiMethod.edit } , agent: { module: [8,5], permission: apiMethod.edit }}), awaitHandlerFactory(slabController.updateSlabManager))

// get parent slab
router.get('/parent',getParentSlab, auth(), awaitHandlerFactory(slabController.getParentSlab))  // child condition applyed

// APIs for default slab
router.get('/default', getDefaultSlabSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [6,3], permission: apiMethod.view } , agent: { module: [8,6], permission: apiMethod.view }}), awaitHandlerFactory(slabController.getDefaultSlabId))
router.post('/default', createDefaultSlabSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), awaitHandlerFactory(slabController.createDefaultSlab))
router.put('/default', updateDefaultSlabSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6),accessManager({subAdmin : { module: [6,3], permission: apiMethod.edit } , agent: { module: [8,6], permission: apiMethod.edit }}), awaitHandlerFactory(slabController.updateDefaultSlabId))

// get slab by agent id 
router.get('/agetn/slab',agentSlabById, auth(), awaitHandlerFactory(slabController.agentSlabById))  // child condition applyed

module.exports = router;