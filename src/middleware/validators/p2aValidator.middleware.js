const { body, query } = require('express-validator');

exports.p2aMainFun = [
    body('MSISDN')
    .exists().withMessage('MSISDN is required'),
    body('input')
    .exists().withMessage('input is required')
]