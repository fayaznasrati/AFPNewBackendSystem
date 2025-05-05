const { body, query } = require('express-validator');

exports.createLanguageSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('name')
    .exists()
    .withMessage('name is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('name maximum limit is 50 words'),
    body('symbol')
    .exists()
    .withMessage('symbol is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('symbol maximum limit is 10 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.allLanguageSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    // query('start')
    // .exists()
    // .withMessage('start is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('start should be number'),
    // query('end')
    // .exists()
    // .withMessage('end is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateLanguageSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('lang_uuid')
    .exists()
    .withMessage('lang_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('lang_uuid maximum limit is 16 words'),
    body('name')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('name maximum limit is 50 words'),
    body('symbol')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .trim().isLength({ max: 10 })
    .withMessage('symbol maximum limit is 10 words'),
    body()
    .custom(value => { return !!Object.keys(value).length; })
    .withMessage('Please provide required field to update')
    .custom(value => {
        const updates = Object.keys(value);
        const allowUpdates = ["username", "lang_uuid", "name", "symbol"];
        return updates.every(update => allowUpdates.includes(update));
    })
    .withMessage('Invalid updates!'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteLanguageSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('lang_uuid')
    .exists()
    .isString()
    .withMessage('should be a string')
    .withMessage('lang_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('lang_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]