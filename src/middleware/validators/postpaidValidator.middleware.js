const { body, query } = require('express-validator');

exports.createPostpaidCommissionSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid maximum limit is 11 words'),
    body('commission1')
    .exists()
    .withMessage('commission1 is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('commission1 maximum limit is 2 words'),
    body('commission2')
    .exists()
    .withMessage('commission2 is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('commission2 maximum limit is 2 words'),
    body('commission3')
    .exists()
    .withMessage('commission3 is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('commission3 maximum limit is 2 words'),
    body('commission4')
    .exists()
    .withMessage('commission4 is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('commission4 maximum limit is 2 words'),
    body('commission5')
    .exists()
    .withMessage('commission5 is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('commission5 maximum limit is 2 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.searchPostpaidCommisionSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
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
    query('user_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid maximum limit is 11 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updatePostpaidCommissionSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('pc_uuid')
    .exists()
    .withMessage('pc_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('pc_uuid maximum limit is 16 words'),
    body('salaamCommission')
    .optional()
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('salaamCommission maximum limit is 2 words'),
    body('awccCommission')
    .optional()
    .trim().isLength({ max: 2 })
    .withMessage('awccCommission maximum limit is 2 words'),
    body('etisalatCommission')
    .optional()
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('etisalatCommission maximum limit is 2 words'),
    body('roshanCommission')
    .optional()
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('roshanCommission maximum limit is 2 words'),
    body('mtnCommission')
    .optional()
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 2 })
    .withMessage('mtnCommission maximum limit is 2 words'),
    body()
    .custom(value => { return !!Object.keys(value).length; })
    .withMessage('Please provide required field to update')
    .custom(value => {
        const updates = Object.keys(value);
        const allowUpdates = ["username", "pc_uuid", "salaamCommission", "etisalatCommission", "roshanCommission", "mtnCommission", "awccCommission"];
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