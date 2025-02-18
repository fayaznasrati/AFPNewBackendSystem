const express = require('express');
const router = express.Router();

const role = require('../utils/userRoles.utils')

const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const { getRechargeRoute, createRechareRoute, updateRechargeRoute, getMnoDetails, addMnoDetails,
        updateMnoDetails, deleteMnoDetails, getApiBalance
    } = require('../middleware/validators/rechargeRouteValidator.middleware')

const rechargeRouteController = require('../controllers/rechargeRoute.controller')


// routes details
router.get('/', getRechargeRoute, auth(role.Admin), awaitHandlerFactory(rechargeRouteController.getRechargeRoute));
router.post('/', createRechareRoute, auth(role.Admin), awaitHandlerFactory(rechargeRouteController.createRechareRoute))
router.put('/', updateRechargeRoute, auth(role.Admin), awaitHandlerFactory(rechargeRouteController.updateRechargeRoute))

// mno details
router.get('/mno/', getMnoDetails, auth(role.Admin), awaitHandlerFactory(rechargeRouteController.getMnoDetails));
router.get('/mno/balance/', getApiBalance, auth(role.Admin), awaitHandlerFactory(rechargeRouteController.getApiBalance));
router.post('/mno/', addMnoDetails, auth(role.Admin), awaitHandlerFactory(rechargeRouteController.addMnoDetails))
router.put('/mno/', updateMnoDetails, auth(role.Admin), awaitHandlerFactory(rechargeRouteController.updateMnoDetails))
router.delete('/mno/', deleteMnoDetails, auth(role.Admin), awaitHandlerFactory(rechargeRouteController.deleteMnoDetails))

module.exports = router;