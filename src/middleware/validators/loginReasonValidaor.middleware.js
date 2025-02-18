const { body, query } = require('express-validator');
const { exp } = require('../../common/master/radisMaster.common');

exports.createLoginReason=[
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('reason')
    .exists().withMessage('reason is required')
    .trim().isLength({ min: 3, max: 150 }).withMessage('reason is of 3 to 150 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
] 

exports.getLoginReason=[
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateLoginReason=[
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('reason')
    .exists().withMessage('reason is required')
    .trim().isLength({ min: 3, max: 150 }).withMessage('reason is of 3 to 150 character'),
    body('reason_uuid')
    .exists().withMessage('reason_uuid is required')
    .trim().isLength({min : 16, max: 16}).withMessage('is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteLoginReason=[
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('reason_uuid')
    .exists().withMessage('reason_uuid is required')
    .trim().isLength({min : 16, max: 16}).withMessage('is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]