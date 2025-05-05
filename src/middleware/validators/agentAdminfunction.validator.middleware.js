const { body, query } = require('express-validator');
const Role = require('../../utils/userRoles.utils');

exports.requestLoginOtp = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body('mobile')
    .exists().withMessage('Mobile is required')
    .isNumeric()
    .trim().isLength({ min: 10, max:15 }).withMessage('Must be a valid Mobile')
    .matches(/^[0-9\s]+$/).withMessage('Only numbers are allowed from 0-9'),
    body('message')
    .exists().withMessage('message is required')
    .trim().isLength({ min:1, max: 50}).withMessage('message maxmimum length is 50 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getLoginOtp = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.verifyOtpGetLoginAccess = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body('otp')
    .exists().withMessage('otp is required')
    .trim().isLength({ min: 3, max: 6}).withMessage('have a length of 6 characters'),
    body('agent_uuid')
    .exists().withMessage('agent_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('it should have 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.agentLogin = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body('reason_uuid')
    .exists().withMessage('reason_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('it should have 16 character'),
    body('reason')
    .exists().withMessage('reason is required'),
    body('agent_uuid')
    .exists().withMessage('agent_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('it should have 16 character'),
    body('userIpAddress')
    .exists().withMessage('Ip address is required')
    .trim().isLength({min:1, max: 50}).optional({nullable: true}).withMessage("maximum 50 character are allowed"),
    body('userMacAddress')
    .optional({nullable: true})
    .trim().isLength({min:1,max: 50}).optional({nullable: true}).withMessage("maximum 50 character are allowed"),
    body('userOsDetails')
    .optional({nullable: true})
    .trim().isLength({min: 1, max: 1000}).optional({nullable: true}).withMessage("maximum 1000 character are allowed"),
    body('userImeiNumber')
    .optional({nullable: true})
    .trim().isLength({min: 1, max: 50}).optional({nullable: true}).withMessage("maximum 50 character are allowed"),
    body('userGcmId')
    .optional({nullable: true})
    .trim().isLength({ min:1, max: 200}).optional({nullable: true}).withMessage("maximum 200 character are allowed"),
    body('userAppVersion')
    .optional({nullable: true})
    .trim().isLength({ min:1,max:50}).optional({nullable: true}).withMessage('maximum 100 character are allowed'),
    body('userApplicationType')
    .exists().withMessage('Application type is required')
    .isIn(["Mobile","Web"]).optional({nullable: true}).withMessage(' can be Web or Mobile'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.verifyAgentId = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('agent_uuid')
    .exists()
    .withMessage('agent_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]