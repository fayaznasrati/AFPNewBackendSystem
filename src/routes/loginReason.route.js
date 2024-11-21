const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const role = require('../utils/userRoles.utils');

const {createLoginReason, getLoginReason, updateLoginReason, deleteLoginReason} = require('../middleware/validators/loginReasonValidaor.middleware')

const loginResaonController = require('../controllers/loginReason.controller')

router.get('/', getLoginReason, awaitHandlerFactory(loginResaonController.getLoginReason));
router.post('/', createLoginReason, auth(role.Admin), awaitHandlerFactory(loginResaonController.createLoginReason));
router.put('/', updateLoginReason, auth(role.Admin), awaitHandlerFactory(loginResaonController.updateLoginReason));
router.delete('/', deleteLoginReason, auth(role.Admin), awaitHandlerFactory(loginResaonController.deleteLoginReason));

module.exports = router;