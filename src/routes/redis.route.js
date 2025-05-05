const express = require('express');
const router = express.Router();
const role = require('../utils/userRoles.utils');
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const { getValue, setValue, expireValue, deleteValue } = require('../middleware/validators/redisValidator.middleware')

const redisController = require('../controllers/redis.controller')

router.get('/', getValue, auth(role.Admin), awaitHandlerFactory(redisController.getvalue))
router.post('/', setValue, auth(role.Admin), awaitHandlerFactory(redisController.createVar))
router.put('/', expireValue, auth(role.Admin), awaitHandlerFactory(redisController.expireVar))
router.delete('/', deleteValue, auth(role.Admin), awaitHandlerFactory(redisController.deletevar))

module.exports = router;