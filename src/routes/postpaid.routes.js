const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const postpaidController = require('../controllers/postpaid.controller')

const { createPostpaidCommissionSchema, updatePostpaidCommissionSchema, searchPostpaidCommisionSchema } = require('../middleware/validators/postpaidValidator.middleware')

// router.get('/id/', searchPostpaidCommisionSchema, auth(), awaitHandlerFactory(postpaidController.getPostPaidData))
// router.post('/', createPostpaidCommissionSchema, auth(), awaitHandlerFactory(postpaidController.createPostpaidCommission))
// router.put('/', updatePostpaidCommissionSchema, auth(), awaitHandlerFactory(postpaidController.updatepostpaidCommission))

module.exports = router;