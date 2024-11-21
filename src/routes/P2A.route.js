const express = require('express');
const router = express.Router();

const { p2aMainFun } = require('../middleware/validators/p2aValidator.middleware')
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const p2aController = require('../controllers/P2A.controller')

router.post('/', p2aMainFun, awaitHandlerFactory(p2aController.mainController));

module.exports = router;