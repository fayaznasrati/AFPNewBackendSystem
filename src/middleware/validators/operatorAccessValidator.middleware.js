const { body, query } = require('express-validator');
const Role = require('../../utils/userRoles.utils');

exports.getAllAccessRights = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateAccessRights = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('stockStatus')
    .exists().withMessage('Stock status is required')
    .isIn([1, 0]).withMessage('can be 1 or 0'),
    body('smsStatus')
    .exists().withMessage('sms status is required')
    .isIn([1, 0]).withMessage('can be 1 or 0'),
    body('ussdStatus')
    .exists().withMessage('ussd status is required')
    .isIn([1, 0]).withMessage('can be 1 or 0'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getAllOperatorTopupList = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addOperatorAccess = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .trim().isLength({ min: 16, max: 16}).withMessage('is of 16 characters'),
    body('name')
    .exists().withMessage('name is required')
    .trim().isLength({ min:3 ,max:50}). withMessage('Should be of more then 3 characters'),
    body('mno_uuid')
    .exists().withMessage('mno_uuid is required')
    .trim().isLength({ min: 16, max: 16 }).withMessage('shoulbe be of 16 characters'),
    body('queueName')
    .exists().withMessage('queue name is required')
    .trim().isLength({ min:3, max: 50}).withMessage('should be of more then 3 caracter'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateOperatorAccess = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .trim().isLength({max:16,min:16}).withMessage('access_uuid is of 16 characters'),
    body('topupStatus')
    .exists().withMessage('topupStatus is required')
    .isIn([1, 0,'1','0']).withMessage('can be 1 or 0'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.delteOperatorAccess = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    query('access_uuid')
    .exists().withMessage('access_uuid is required')
    .trim().isLength({max:16,min:16}).withMessage('access_uuid is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]