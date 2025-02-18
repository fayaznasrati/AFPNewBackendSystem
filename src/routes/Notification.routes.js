const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const notificationController = require('../controllers/notification.controller')
const {
    createNotiTypeSchema,updateNotiTypeSchema,allNotiTypeSchema,deleteNotiTypeSchema,createNotiNumberSchema,allNotiNumberSchema,
    updateNotiNumberSchema,deleteNotiNumberSchema,getNotiNumberDetails

} = require('../middleware/validators/notificationValidator.middleware')

// Notification Type APIs
router.get('/type', allNotiTypeSchema, auth(role.Admin), awaitHandlerFactory(notificationController.allNotiType));
router.post('/type', createNotiTypeSchema, auth(role.Admin), awaitHandlerFactory(notificationController.createNotiType));
router.put('/type', updateNotiTypeSchema, auth(role.Admin), awaitHandlerFactory(notificationController.updateNotiType));
router.delete('/type', deleteNotiTypeSchema, auth(role.Admin), awaitHandlerFactory(notificationController.deleteNotiType));

// Notification Number APIs
router.get('/number', allNotiNumberSchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [9,2], permission: apiMethod.view }}), awaitHandlerFactory(notificationController.allNotiNumber));
router.get('/number/id', getNotiNumberDetails, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [9,2], permission: apiMethod.view }}), awaitHandlerFactory(notificationController.getNotiNumberDetails));
router.post('/number', createNotiNumberSchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [9,2], permission: apiMethod.add }}), awaitHandlerFactory(notificationController.createNotiNumber));
router.put('/number', updateNotiNumberSchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [9,2], permission: apiMethod.edit }}), awaitHandlerFactory(notificationController.updateNotiNumber));
router.delete('/number', deleteNotiNumberSchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [9,2], permission: apiMethod.delete }}), awaitHandlerFactory(notificationController.deleteNotiNumber));


module.exports = router;