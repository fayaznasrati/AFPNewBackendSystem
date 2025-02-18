const { body, query } = require('express-validator');

exports.getAgentDetialsSchema = [
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
    .withMessage('wrong request'),
]

exports.transferStockSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    body('sender_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('sender_uuid maximum limit is 16 words'),
    body('reciever_uuid')
    .exists()
    .withMessage('reciever_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('reciever_uuid maximum limit is 16 words'),
    body('amount')
    .exists()
    .withMessage('amount is required')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('username maximum limit is 10 words')
    .isNumeric()
    .withMessage('should be number')
    .custom(value => {
        if (Number(value) && Number(value) >= 1) {
            return true
        }
        return false
    })
    .withMessage('enter proper amount'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.StockTransferReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.modifyStockRequest = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    body('transferNumber')
    .exists().withMessage('transferNumber is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.downlineStockTransferReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    // query('parentAgentUuid')
    // .exists().withMessage("parentAgentUuid is required")
    // .isString().withMessage('should be a string')
    // .isLength({ min: 16, max: 16 }).withMessage('parentAgentUuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.createStockRequest = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('amount')
    .exists().withMessage('amount is required')
    .trim().isLength({ min :1, max: 23})
    .custom(value => {
        if (Number(value) && Number(value) >= 1) {
            return true
        }
        return false
    })
    .withMessage('enter proper amount'),
    body('paymentMode')
    .exists().withMessage("paymentMode is required")
    .isIn([1,2]).withMessage('payment mode is 1 for cash and 2 for bank transfer')
    .custom((val, { req }) =>{
        // console.log("length",req.body.referenceNumber.length)
        if(val == 2){
            if((req.body.filename == undefined || req.body.filename == null )&&(req.body.referenceNumber == undefined || req.body.referenceNumber == null )) return false
            if(req.body.referenceNumber.length < 3 || req.body.referenceNumber.length > 50) return false
            if(!req.body.referenceNumber.match(/^[a-zA-Z0-9\s]+$/)) return false
        }
        return true
    }).withMessage('payment receipt or reference no is not proper,3-50 character reference number is allowed'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.rejectStockRequest =[
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    body('transferNumber')
    .exists().withMessage('transferNumber is required'),
    body('comment')
    .exists().withMessage('comment is required')
    .trim().isLength({ min: 3, max: 750 }).withMessage('comment minimum size is 3 and maximum 750'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getRequestStatus =[
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getImage = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    query('imageName')
    .exists().withMessage('imageName is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.topStockRequestReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('startDate')
    .exists()
    .withMessage('startDate is required'),
    query('endDate')
    .exists()
    .withMessage('endDate is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]