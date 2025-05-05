const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const rabbitmqController = require('../controllers/rabbitmq.controller');

router.post('/send', rabbitmqController.sendMessage)
router.post('/work', rabbitmqController.createWorker)
router.put('/', rabbitmqController.endWorker)

module.exports = router;