const { body, query } = require('express-validator');
const Role = require('../../utils/userRoles.utils');

exports.getCommision = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
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
];

exports.updateCommision = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid maximum limit is 16 words'),
    body('com_percentage')
    .exists().withMessage('com_percentage is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .'),
    // .isNumeric()
    // .withMessage('start should be number')
    // .isLength({ min: 1, max: 2 })
    // .withMessage('com_percentage maximum limit is 2 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
];

exports.directAgentPrePaidCommissionReport = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.directAgentPostPaidCommissionReport = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.inDirectAgentPrePaidCommissionReport = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    // query("parent_uuid")
    // .exists().withMessage('parent uuid is required')
    // .isLength({min:16, max:16}).withMessage('can be of 16 character max'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.inDirectAgentPostPaidCommissionReport = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    // query("parent_uuid")
    // .exists().withMessage('parent uuid is required')
    // .isLength({min:16, max:16}).withMessage('can be of 16 character max'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]