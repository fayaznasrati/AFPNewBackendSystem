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