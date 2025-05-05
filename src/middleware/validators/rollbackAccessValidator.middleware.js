const { body, query } = require('express-validator');
const Role = require('../../utils/userRoles.utils');

exports.rollbackTransaction = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.acceptRollbackTransaction = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('txnNumber')
    .exists().withMessage('txnNumber is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.rejectRollbackTransaction = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('txnNumber')
    .exists().withMessage('txnNumber is required'),
    body('comment')
    .exists().withMessage('comment is required')
    .trim().isLength({min:3, max: 50}).withMessage('Comment should be of proper 3-50 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.pendingRollback = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
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
    }).withMessage('wrong request')
]

exports.etisalatPen =  [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.acceptRollbackTransactionMNO = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('txnNumber')
    .exists().withMessage('txnNumber is required'),
    body('amount')
    .exists().withMessage('amount is required')
    .custom(value => {
        if (Number(value) && Number(value) >= 1) {
            return true
        }
        return false
    }).withMessage('enter proper amount'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.rejectRollbackTransactionMNO = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('txnNumber')
    .exists().withMessage('txnNumber is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.transferAmtForRollback = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('txnNumber')
    .exists().withMessage('txnNumber is required'),
    body('amount')
    .exists().withMessage('amount is required')
    .custom(value => {
        if (Number(value) && Number(value) >= 1) {
            return true
        }
        return false
    }).withMessage('Enter proper amount'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.rejectRollback = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('txnNumber')
    .exists().withMessage('txnNumber is required'),
    body('comment')
    .exists().withMessage('comment is required')
    .trim().isLength({min:3, max: 50}).withMessage('Comment should be of proper 3-50 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.rollbackComplete = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
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
    }).withMessage('wrong request')
]

exports.getSystemWalletBal = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addMoneyInSystem = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isLength({ min: 16, max: 16 }).withMessage('Select an operator'),
    body('operatorName')
    .exists().withMessage('operatorName is required')
    .isLength({ min: 3, max: 16 }).withMessage('Select an operator'),
    body('amountAdded')
    .exists().withMessage('amountAdded is required')
    .custom(value => {
        if (Number(value) && Number(value) >= 1) {
            return true
        }
        return false
    }).withMessage('Enter proper amount')
    .isNumeric().withMessage('amountAdded should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addRollBackRequest = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('transactionId')
    .exists().withMessage('transactionId name is required'),
    // body('comment')
    // .exists().withMessage('comment name is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.agentRollbackReport = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addRollback = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('transactionId')
    .exists().withMessage('transactionId name is required'),
    // body('comment')
    // .exists().withMessage('comment name is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]