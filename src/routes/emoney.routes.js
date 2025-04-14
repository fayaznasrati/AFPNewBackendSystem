const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const emoneyController = require('../controllers/emoney.controller')

const { 
    addEmoneySchema, getEmoneyDetailByDateSchema, getEmoneyReportSchema,getOperatorBalance, addMno, getMnoList,
    updateMnoDetails, deleteMno
} = require('../middleware/validators/emoneyValidator.middleware')

//emoney APis
router.post('/', addEmoneySchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [5,1], permission: apiMethod.add }}), awaitHandlerFactory(emoneyController.addEmoney))
router.get('/', getEmoneyDetailByDateSchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [5,1], permission: apiMethod.view }}), awaitHandlerFactory(emoneyController.getEmoneyDetailByDate))
router.get('/report', getEmoneyReportSchema, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [5,2], permission: apiMethod.view }}), awaitHandlerFactory(emoneyController.getEmoneyReport))

//get balance info
router.get('/balance',getOperatorBalance, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [5,1], permission: apiMethod.view }}), awaitHandlerFactory(emoneyController.getOperatorBalance))

// mno details api
router.get('/mno/', getMnoList, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [5,1], permission: apiMethod.view }}), awaitHandlerFactory(emoneyController.getMnoList))
router.post('/mno/', addMno, auth(role.Admin), awaitHandlerFactory(emoneyController.addMno))
router.put('/mno/', updateMnoDetails, auth(role.Admin), awaitHandlerFactory(emoneyController.updateMnoDetails))
router.delete('/mno/', deleteMno, auth(role.Admin), awaitHandlerFactory(emoneyController.deleteMno))

module.exports = router;