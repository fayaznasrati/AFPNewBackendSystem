const { body, query } = require('express-validator');

exports.addEmoneySchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('operatorName')
    .exists()
    .withMessage('operatorName is required')
    .isString()
    .withMessage('operatorName should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('operatorName maximum limit is 50 words'),
    body('operator_uuid')
    .exists()
    .withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid maximum limit is 16 words'),
    body('amountAdded')
    .exists()
    .withMessage('amountAdded is required')
    .isNumeric()
    .withMessage('amountAdded should be number')
    .custom(value => {
        if (Number(value) && Number(value) >= 0) {
            return true
        }
        if(value == 0) return true
        return false
    }).withMessage('Enter proper amount')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('amountAdded maximum limit is 10 words'),
    body('commAmount')
    .exists()
    .withMessage('commAmount is required')
    .custom(value => {
        if (Number(value) && Number(value) >= 0) {
            return true
        }
        if(value == 0) return true
        return false
    }).withMessage('Enter proper commission amount')
    .isNumeric()
    .withMessage('commAmount should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('commAmount maximum limit is 10 words'),
    body('narration')
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
    .trim().isLength({ min: 1, max: 500 })
    .withMessage('narration maximum limit is 500 words'),
    body('trans_for')
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
    .trim().isLength({ min: 1, max: 100 })
    .withMessage('trans_for maximum limit is 100 words')
    .isIn(["TopUp", "TopUp Failed", "Wallet Recieved", "Wallet Transfer", "Commission Credited", "Wallet Reverted"])
    .withMessage("allowed words are TopUp, TopUp Failed, Wallet Recieved, Wallet Transfer, Commission Credited, Wallet Reverted"),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getEmoneyDetailByDateSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
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

exports.getEmoneyReportSchema = [
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

exports.getOperatorBalance = [
    query('username')
    .exists()
    .withMessage('username is required')
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

exports.addMno = [
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('name')
    .exists().withMessage('name is required')
    .trim().isLength({ min: 3, max: 50}).withMessage('name should be more then 3 character'),
    body('url')
    .exists().withMessage('url is required')
    .trim().isLength({ min:3, max: 50}).withMessage('can be of 50 character max'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getMnoList =[
    query('username')
    .exists()
    .withMessage('username is required')
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

exports.updateMnoDetails = [
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('mno_uuid')
    .exists().withMessage('mno_uuid is required')
    .trim().isLength({ min: 16, max: 16}).withMessage('is of 16 characters'),
    body('name')
    .exists().withMessage('name is required')
    .trim().isLength({ min: 3, max: 50}).withMessage('name should be more then 3 character'),
    body('url')
    .exists().withMessage('url is required')
    .trim().isLength({ min:3, max: 50}).withMessage('can be of 50 character max'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteMno =[
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('mno_uuid')
    .exists().withMessage('mno_uuid is required')
    .trim().isLength({ min: 16, max: 16}).withMessage('is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]