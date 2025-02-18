const { body, query } = require('express-validator');

exports.createProvinceSchema = [
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
    // .matches(/^[a-zA-Z0-9-\s]+$/)
    // .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('name maximum limit is 100 words'),
    body('region_uuid')
    .exists()
    .withMessage('region_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('country_uuid maximum limit is 16 words'),
    body('region_uuid')
    .exists()
    .withMessage('region_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('region_uuid maximum limit is 16 words'),
    body('regionName')
    .exists()
    .withMessage('regionName is required')
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
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('regionName maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.provinceByRegion = [
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
    query('region_uuid')
    .exists()
    .withMessage('region_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('region_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')

]

exports.updateProvinceSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('province_uuid')
    .exists()
    .withMessage('province_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('province_uuid maximum limit is 16 words'),
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
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('name maximum limit is 100 words'),
    body('country_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('country_uuid maximum limit is 16 words'),
    // body()
    // .custom(value => { return !Object.keys(value).length; })
    // .withMessage('Please provide required field to update')
    // .custom(value => {
    //     const updates = Object.keys(value);
    //     const allowUpdates = ["username", "country_uuid", "province_uuid", "name"];
    //     return updates.every(update => allowUpdates.includes(update));
    // })
    // .withMessage('Invalid updates!'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteProvinceSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('province_uuid')
    .exists()
    .withMessage('province_uuid is required')
    .isString()
    .withMessage('should be a string')
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