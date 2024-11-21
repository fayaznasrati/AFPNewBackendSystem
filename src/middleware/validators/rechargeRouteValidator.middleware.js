const { body, query } = require('express-validator');

exports.getRechargeRoute = [
    query('username')
    .exists()
    .withMessage('username is required')
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

exports.createRechareRoute = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .trim().isLength({ min: 16, max: 16 }).withMessage('maximum limit is 10 words'),
    body('mnoId')
    .exists().withMessage('mnoId is required')
    .trim().isLength({ min: 1, max: 10 }).withMessage('maximum limit is 10 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateRechargeRoute = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .trim().isLength({ min: 16, max: 16 }).withMessage('maximum limit is 10 words'),
    body('mnoId')
    .exists().withMessage('mnoId is required')
    .trim().isLength({ min: 1, max: 10 }).withMessage('maximum limit is 10 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getMnoDetails = [
    query('username')
    .exists()
    .withMessage('username is required')
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

exports.addMnoDetails = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('name')
    .exists().withMessage(' mno name is requored ')
    .trim().isLength({ min:3, max: 50 }).withMessage(' can be of 50 characters'),
    body('balanceUrl')
    .exists().withMessage('balanceUrl is required')
    .trim().isLength({ min:3, max: 150 }).withMessage(' can be of 150 characters'),
    body('queueName')
    .exists().withMessage('queueName is required')
    .trim().isLength({ min:3, max: 150 }).withMessage(' can be of 50 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateMnoDetails = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('mnoId')
    .exists().withMessage('mnoId is required'),
    body('name')
    .exists().withMessage(' mno name is requored ')
    .trim().isLength({ min:3, max: 50 }).withMessage(' can be of 50 characters'),
    body('balanceUrl')
    .exists().withMessage('balanceUrl is required')
    .trim().isLength({ min:3, max: 150 }).withMessage(' can be of 150 characters'),
    body('queueName')
    .exists().withMessage('queueName is required')
    .trim().isLength({ min:3, max: 150 }).withMessage(' can be of 50 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteMnoDetails = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('mnoId')
    .exists().withMessage('mnoId is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getApiBalance = [
    query('username')
    .exists()
    .withMessage('username is required')
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