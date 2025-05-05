const { body, query } = require('express-validator');

exports.createNews = [
    query('username')
    .exists().withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('news')
    .exists().withMessage('news is required')
    .trim().isLength({ min: 3, max: 400 }).withMessage('news maximum limit is 400 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getAllNews = [
    query('username')
    .exists().withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getDailyNews = [
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateNews = [
    query('username')
    .exists().withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('id')
    .exists().withMessage('id is required')
    .isNumeric().withMessage('should be a number'),
    body('news')
    .exists().withMessage('news is required')
    .trim().isLength({ min: 3, max: 400 }).withMessage('news maximum limit is 400 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteNews = [
    query('username')
    .exists().withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('id')
    .exists().withMessage('id is required')
    .isNumeric().withMessage('should be a number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]