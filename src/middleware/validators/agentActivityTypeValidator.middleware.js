const { body, query } = require('express-validator');
const Role = require('../../utils/userRoles.utils');

exports.getAllActivityType = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
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

exports.createActivityType = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body('name')
    .exists().withMessage('activity name is required')
    .trim().isLength({min: 3, max: 100}).withMessage('Activity name must be less than 100 characters'),
    body('userType')
    .exists().withMessage('userType is required')
    .isNumeric().withMessage('should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateActivityType = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body('name')
    .exists().withMessage('activity name is required')
    .trim().isLength({min: 3, max: 100}).withMessage('Activity name must be less than 100 characters'),
    body('userType')
    .exists().withMessage('userType is required')
    .isNumeric().withMessage('should be number'),
    body("at_id")
    .exists().withMessage('at_id is required')
    .isNumeric().withMessage('should be numeric only'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]