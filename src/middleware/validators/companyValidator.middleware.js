const { body, query,params } = require('express-validator');

exports.createCompanyMiddleware =  [
    body('company_name')
    .exists().withMessage('company_name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('company_name maximum limit is 50 words'),
]   
exports.genAPIKeyCompanyMiddleware = [
     body('company_name')
    .exists().withMessage('company_name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('company_name maximum limit is 50 words'),
    // params('id').exists().withMessage('company_id is required')
]
exports.singlerecharge = [
    body('username')
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
    body('company_name')
    .exists().withMessage('company_name is required'),
    body('channelType')
    .custom(value => {
        if (value == 'Company') {
            return true
        }
        return false
    })
    .withMessage('wrong request channelType'),
]

exports.checkBalance = [
    body('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .isLength({ min: 9, max: 9 })
    .withMessage('username limit worng'),
    body('company_name')
    .exists().withMessage('company_name is required'),
    body('channelType')
    .custom(value => {
        if (value == 'Company') {
            return true
        }
        return false
    })
    .withMessage('wrong request channelType'),
]

// exports.adminDashBoardStatus =[
//     query('username')
//     .exists().withMessage('username is required')
//     .isString().withMessage('should be a string')
//     .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
//     body('user_detials')
//     .custom(value => {
//         if (value === undefined) {
//             return true
//         }
//         return false
//     }).withMessage('wrong request')
// ]

// exports.adminDashBoardGraph = [
//     query('username')
//     .exists().withMessage('username is required')
//     .isString().withMessage('should be a string')
//     .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
//     query('startDate')
//     .exists().withMessage('startDate is required'),
//     query('endDate')
//     .exists().withMessage('end date is required'),
//     body('user_detials')
//     .custom(value => {
//         if (value === undefined) {
//             return true
//         }
//         return false
//     }).withMessage('wrong request')
// ]

// exports.agentDashBoardStatus = [
//     query('username')
//     .exists().withMessage('username is required')
//     .isString().withMessage('should be a string')
//     .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
//     body('user_detials')
//     .custom(value => {
//         if (value === undefined) {
//             return true
//         }
//         return false
//     }).withMessage('wrong request')
// ]

// exports.agentDashBoardgraph = [
//     query('username')
//     .exists().withMessage('username is required')
//     .isString().withMessage('should be a string')
//     .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
//     query('startDate')
//     .exists().withMessage('startDate is required'),
//     query('endDate')
//     .exists().withMessage('end date is required'),
//     body('user_detials')
//     .custom(value => {
//         if (value === undefined) {
//             return true
//         }
//         return false
//     }).withMessage('wrong request')
// ]