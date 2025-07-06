const express = require('express');
// const xmlparser = require('express-xml-bodyparser');
const router = express.Router();

const etisalatUssdController = require('../controllers/etisalatUSSD.controller');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware')

router.post('/', awaitHandlerFactory(etisalatUssdController.ussdMainFun));
router.post('/testing', awaitHandlerFactory(etisalatUssdController.ussdMainFunTesting));



module.exports = router;
