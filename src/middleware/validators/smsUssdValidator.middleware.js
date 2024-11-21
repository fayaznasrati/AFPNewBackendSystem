const { body, query } = require('express-validator');

exports.createActivity = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('activityName')
    .exists().withMessage('activity name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('activity name should be less then 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getActivityList = [
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
    .withMessage('wrong request')
]

exports.updateActivity = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('ussd_uuid')
    .exists().withMessage('ussd_uuid is required')
    .trim().isLength({ min: 16, max: 16 }).withMessage('ussd_uuid is of 16 character'),
    body('activityName')
    .exists().withMessage('activity name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('activity name should be less then 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getUssdActivityReport = [
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
    .withMessage('wrong request')
]