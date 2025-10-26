const { body, query,params, header} = require('express-validator');

exports.createSubCompanyMiddleware =  [
    body('sub_company_name')
    .exists().withMessage('sub_company_name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('sub_company_name maximum limit is 50 words'),
     body('ers_account_username')
    .exists().withMessage('ers_account_username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 10 }).withMessage('ers_account_username maximum limit is 10 words'),
    body('ers_account_user_password')
    .exists().withMessage('ers_account_user_password is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 10 }).withMessage('ers_account_user_password maximum limit is 10 words'),
]
exports.updateSubCompanyMiddleware =  [
    body('sub_company_name')
    .exists().withMessage('sub_company_name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('sub_company_name maximum limit is 50 words'),

]


exports.genAPIKeySubCompanyMiddleware = [
     body('sub_company_name')
    .exists().withMessage('sub_company_name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('sub_company_name maximum limit is 50 words'),
   
]
exports.singlerecharge = [
     body('transaction_id')
    .exists()
    .withMessage('transaction_id is required')
    .isLength({ min: 15, max: 50 })
    .withMessage('trans_number_min limit is 15 max limit is 50 number'),
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
]

exports.rechargeStatus = [
     body('transaction_id')
    .exists()
    .withMessage('transaction_id is required')
    .isLength({ min: 15, max: 50 })
    .withMessage('trans_number_min limit is 15 max limit is 50 number'),
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
]

exports.checkBalance = [
    header('X-Api-Key')
    .exists()
    .withMessage('Api-Key is required')
    .isString()
    .withMessage('should be a string'),
]
exports.getAgentsName = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('region_uuid')
    .optional({nullable: true})
    .trim().isLength({ min: 16, max:16}).optional({nullable: true}).withMessage('region_uuid have 16 character'),

    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')

]
