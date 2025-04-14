const express = require('express');
const router = express.Router();
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const auth = require('../middleware/auth.middleware');

const role = require('../utils/userRoles.utils')

const newsController = require('../controllers/news.controller')

const {
    createNews, getAllNews, updateNews, deleteNews, getDailyNews
} = require('../middleware/validators/newsValidator.middleware')

router.post('/', createNews, auth(role.Admin), awaitHandlerFactory(newsController.createNews))
router.get('/', getAllNews, auth(role.Admin), awaitHandlerFactory(newsController.getAllNews))
router.get('/daily/', getDailyNews, awaitHandlerFactory(newsController.getTodayNews))
router.put('/', updateNews, auth(role.Admin), awaitHandlerFactory(newsController.updateNews))
router.delete('/', deleteNews, auth(role.Admin), awaitHandlerFactory(newsController.deleteNews))

module.exports = router;