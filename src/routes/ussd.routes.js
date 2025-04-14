const express = require('express');
const router = express.Router();

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const ussdController = require('../controllers/ussd.controller')

router.post('/', awaitHandlerFactory(ussdController.ussdMain))

module.exports = router;