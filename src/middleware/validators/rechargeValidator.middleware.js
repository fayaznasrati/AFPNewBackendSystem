const { body, query } = require('express-validator');

exports.singlerecharge = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('usernamemaximum limit is 50 words'),
    body('mobile')
    .exists().withMessage("mobile number is required")
    .isLength({ min: 10, max: 10 }).withMessage('Please Enter Complete 10 Numbers!')
    .isNumeric().withMessage('should be numeric'),
    body('amount')
    .isLength({ min: 1, max: 20 }).withMessage('Please Enter Amount')
    .isNumeric().withMessage('should be numeric')
    .custom(value => {
        if (Number(value) && Number(value) >= 1) {
            return true
        }
        return false
    })
    .withMessage('Enter proper amount grater then 1'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isLength({ min: 16, max: 16 }).withMessage('Please select operator'),
    body("operatorName")
    .exists().withMessage('operator name is required')
    .isLength({ min: 3,max: 50}).withMessage('can bo of 50 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.groupRecharge = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('usernamemaximum limit is 50 words'),
    body('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({ min: 16, max: 16 }).withMessage('Please select group'),
    body('amount')
    .isLength({ min: 1, max: 20 }).withMessage('Please Enter Amount')
    .custom(value => {
        if (Number(value) && Number(value) >= 1) {
            return true
        }
        return false
    }).withMessage('enter proper amount')
    .isNumeric().withMessage('should be numeric'),
    // body('operator_uuid')
    // .exists().withMessage('operator_uuid is required')
    // .isLength({ min: 16, max: 16 }).withMessage('Please select operator'),
    // body("operatorName")
    // .exists().withMessage('operator name is required')
    // .isLength({ min: 3,max: 50}).withMessage('can bo of 50 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.acceptRecharge = [
    body('transNumber')
    .exists().withMessage('transNumber is required')
    .isLength({min:1,max:20}).withMessage('it is of 14 character long'),
    body('op_txn_id')
    .exists().withMessage('opeator txn id is required'),
    body('ap_txn_id')
    .exists().withMessage('api transaction id is required'),
    body('rechargeResponce')
    .exists().withMessage('responce form api is required'),
    body('rechargeRequest')
    .exists().withMessage('API request is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.resendConformationSms = [
    body('transNumber')
    .exists().withMessage('transNumber is required')
    .isLength({min:1,max:20}).withMessage('it is of 14 character long'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.rejectRecharge = [
    body('transNumber')
    .exists().withMessage('transNumber is required')
    .isLength({min:1,max:20}).withMessage('it is of 14 character long'),
    body('rechargeResponce')
    .exists().withMessage('responce form api is required'),
    body('rechargeRequest')
    .exists().withMessage('API request is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]


exports.failePendingRecharge = [
    body('transNumber')
    .exists().withMessage('transNumber is required')
    .isLength({min:1,max:20}).withMessage('it is of 14 character long'),
    body('rechargeResponce')
    .exists().withMessage('responce form api is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.pendingRechange = [
    body('transNumber')
    .exists().withMessage('transNumber is required')
    .isLength({min:1,max:20}).withMessage('it is of 14 character long'),
    body('rechargeResponce')
    .exists().withMessage('responce form api is required'),
    body('rechargeRequest')
    .exists().withMessage('API request is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.successToFailedRecharge = [
    body('transNumber')
    .exists().withMessage('transNumber is required')
    .isLength({min:1,max:20}).withMessage('it is of 14 character long'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getPendingRechargeList = [
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

exports.topUpreports = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.downlineTopUpReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.groupTopUpReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.telcoWiseTopUpReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.agentTopupReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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
    // query('pageNumber')
    // .exists().withMessage('Page number is required')
    // .matches(/^[0-9\s]+$/).withMessage('Page number should be number only'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.topUpSummeryReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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
    // query('startDate')
    // .exists()
    // .withMessage('startDate is required'),
    // query('endDate')
    // .exists()
    // .withMessage('endDate is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.agentDownlineTopUpReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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
    // query('parent_uuid')
    // .exists().withMessage('parent_uuid is required')
    // .isLength({ min: 16, max: 16}).withMessage('parent uuid is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.agentTelcoTopUpreport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.agentCommissionReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.commissionReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.commissionReportSum=[
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.agentPanelCommissionReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('start')
    .exists()
    .withMessage('start is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number'),
    query('end')
    .exists()
    .withMessage('end is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.adminCommissionReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.topRankingReport = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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

exports.groupTopUpReportByGroupId = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 1, max: 50 })
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
    query('group_uuid')
    .exists().withMessage('group_uuid is required')
    .isLength({min:16,max:16}).withMessage('it is of 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.responceUpdateRoshan = [
    body('rechargeId')
    .exists().withMessage('recharge id is required'),
    body('rechargeRequest')
    .exists().withMessage('recharge request is required'),
    body('rechargeResponce')
    .exists().withMessage('recharge responce is required')
]