const { body, query } = require('express-validator');

exports.createDistrictSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('usernamemaximum limit is 50 words'),
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
    }).withMessage('Enter proper district name')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('name maximum limit is 100 words'),
    body('province_uuid')
    .exists()
    .withMessage('province_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('province_uuid maximum limit is 16 words'),
    body('provinceName')
    .exists()
    .withMessage('provinceName is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter proper province name')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('provinceName contain proper character A-Z a-z -')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('provinceName maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.districtByProvienceUuidSchema = [
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
    query('province_uuid')
    .exists()
    .withMessage('province_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('province_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateDistrictSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('district_uuid')
    .exists()
    .withMessage('district_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('district_uuid maximum limit is 16 words'),
    body('name')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter proper district name')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('name maximum limit is 100 words'),
    body('province_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('province_uuid maximum limit is 16 words'),
    body()
    .custom(value => { return !!Object.keys(value).length; })
    .withMessage('Please provide required field to update')
    .custom(value => {
        const updates = Object.keys(value);
        const allowUpdates = ["username", "district_uuid", "province_uuid", "name"];
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

exports.deleteDistrictSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('district_uuid')
    .exists()
    .withMessage('district_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ max: 16 })
    .withMessage('district_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]