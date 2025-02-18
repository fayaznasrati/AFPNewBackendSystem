const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const operatorController = require('../controllers/operator.controller')

const apiMethod = require('../utils/apiMethod.utils');
const accessManager = require('../middleware/acessManager.middleware')
const role = require('../utils/userRoles.utils')

const { createOperatorSchema, allOperatorsSchema, updateOperatorSchema, deleteOperatorSchema,
        checkOperator, findOperator } = require('../middleware/validators/operatorValidator.middleware')

// Region APIs
router.get('/', allOperatorsSchema, awaitHandlerFactory(operatorController.allOperator));
router.post('/', createOperatorSchema, auth(role.Admin), awaitHandlerFactory(operatorController.createoperator));
router.put('/', updateOperatorSchema, auth(role.Admin), awaitHandlerFactory(operatorController.updateOperator));
router.delete('/', deleteOperatorSchema, auth(role.Admin), awaitHandlerFactory(operatorController.deleteOperator));

router.post('/check/', checkOperator, awaitHandlerFactory(operatorController.checkOperator))

router.post('/find', findOperator, awaitHandlerFactory(operatorController.findOperator))

module.exports = router;