const { body, query } = require('express-validator');

exports.getValue = [
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 5, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    query('name')
    .exists()
    .withMessage('name is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.setValue = [
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 5, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    body('name')
    .exists()
    .withMessage('name is required'),
    body('value')
    .exists()
    .withMessage('value is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.expireValue = [
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 5, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    body('name')
    .exists()
    .withMessage('name is required'),
    body('time')
    .exists()
    .withMessage('value is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteValue = [
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 5, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    query('name')
    .exists()
    .withMessage('name is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]