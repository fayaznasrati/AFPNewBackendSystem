const { body, query } = require('express-validator');

exports.createTypeSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('name')
    .exists()
    .withMessage('name is required'),
    // .isIn(["Master Distributor", "Distributor", "Master Sub-Distributor", "Sub-Distributor", "Master Retailer", "Retailer"])
    // .withMessage('should be Master Distributor, Distributor, Master Sub-Distributor, Sub-Distributor, Master Retailer, Retailer'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.allTypeSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
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

exports.getLowerAgentType = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('user_uuid maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]
exports.getGreaterAgentType = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('user_uuid maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]
exports.getGreaterAndEqualAgentType = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('user_uuid maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateTypeSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('agent_type_uuid')
    .exists()
    .withMessage('agent_type_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent_type_uuid maximum limit is 16 words'),
    body('name')
    .exists()
    .withMessage('name is required')
    .isIn(["Master Distributor", "Distributor", "Master Sub - Distributor", "Sub - Distributor", "Master Retailer", "Retailer"])
    .withMessage('should be Master Distributor, Distributor, Master Sub-Distributor, Sub-Distributor, Master Retailer, Retailer'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteTypeSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('agent_type_uuid')
    .exists()
    .withMessage('agent_type_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent_type_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

//validators for adding user numbers
exports.addNumberSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists()
    .withMessage('Select a user whose details you want to update')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('Select a user to add contact number'),
    body('mobile')
    .exists()
    .withMessage('mobile is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('mobile number should contain digits 0-9')
    .isNumeric()
    .withMessage('Please enter a proper mobile number')
    .trim().isLength({ min: 10, max: 10})
    .withMessage('Mobile number should be of 10 digits only'),
    body('mobileType')
    .exists()
    .withMessage('mobileType is required')
    .isIn([1, 0])
    .withMessage('mobileType is invalid'),
    body('operator_uuid')
    .exists()
    .withMessage('Please select a operator')
    .isString()
    .withMessage('Please select a operator')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('Please select a operator'),
    body('operatorName')
    .exists()
    .withMessage('Please select a operator')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('Please select a operator')
    .isString().withMessage('Please select a proper operator')
    .trim().isLength({ min: 1, max: 50 }).withMessage('maximum length should be 50'),
    body('recieveNotification')
    .exists()
    .withMessage('Please select Receive Notification as yes or no')
    .isIn([1, 0])
    .withMessage('Please select Receive Notification as yes or no'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.checkNumber = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('mobile')
    .exists()
    .withMessage('mobile is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('mobile number should contain digits 0-9')
    .isNumeric()
    .withMessage('Please enter a proper mobile number')
    .trim().isLength({ min: 10, max: 10})
    .withMessage('Mobile number should be of 10 digits only'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getContactDetailsSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists().withMessage('user_uuid is required')
    .isString()
    .withMessage('should be string')
    .withMessage('select a user to get its operator details')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateContactDetailsSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists().withMessage('Select an user to update its contact detils')
    .isString()
    .withMessage('Select an user to update its contact detils')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid maximum limit is 16 words'),
    body('operator_uuid')
    .exists().withMessage('Select an operator')
    .isString()
    .withMessage('Select an operator')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('Select an operator')
    .custom((val, { req }) => {
        if (req.body.operatorName === undefined) return false;
        return true;
    }),
    body('operatorName')
    .exists().withMessage('Select an operator')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('Select proper operator')
    .isString().withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('maximum length should be 50'),
    body('agent_contact_uuid')
    .exists()
    .withMessage('Select contact details which you want to update')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('Select contact details which you want to update'),
    body('mobile')
    .exists().withMessage('mobile number is required')
    .trim().isLength({ min: 10, max: 10 })
    .withMessage('Enter proper mobile number of 10 digits')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('should be a number'),
    body('mobileType')
    .exists().withMessage('Select mobile number type as Primary or Alternate')
    .isIn([1, 0])
    .withMessage('Select mobile number type as Primary or Alternate'),
    body('recieveNotification')
    .exists().withMessage('Please select Receive Notification as yes or no')
    .isIn([1, 0])
    .withMessage('Please select Receive Notification as yes or no'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

//validators for operator channel
exports.createOperatorAccessSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 5, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid maximum limit is 16 words'),
    body('operator_uuid')
    .exists()
    .withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid maximum limit is 16 words'),
    body('operatorName')
    .exists()
    .withMessage('operator name is required')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .isString().withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('maximum length should be 50'),
    body('status')
    .exists()
    .withMessage('status is required')
    .isIn([1, 0])
    .withMessage('status is invalid'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getOperatorByIdSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateOperatorStatusSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('user_uuid is required'),
    body('agent_oa_uuid')
    .exists()
    .withMessage('agent_oa_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent_oa_uuid maximum limit is 16 words'),
    body('status')
    .exists()
    .withMessage('status is required')
    .isIn([1, 0])
    .withMessage('status is invalid'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

//validators for stock transfer channel
exports.createStockTransferSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid maximum limit is 16 words'),
    body('webStatus')
    .exists()
    .withMessage('webStatus is required')
    .isIn([1, 0])
    .withMessage('webStatus is invalid'),
    body('webThreshold')
    .exists()
    .withMessage('webThreshold is required')
    .trim().isLength({ min: 1, max: 23 })
    .withMessage('webThreshold  maximum limit is 23 words')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('should be a number'),
    body('mobileStatus')
    .exists()
    .withMessage('mobileStatus is required')
    .isIn([1, 0])
    .withMessage('mobileStatus is invalid'),
    body('MobileThreshold')
    .exists()
    .withMessage('MobileThreshold is required')
    .trim().isLength({ min: 1, max: 23 })
    .withMessage('MobileThreshold  maximum limit is 23 words')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('should be a number'),
    body('ussdStatus')
    .exists()
    .withMessage('ussdStatus is required')
    .isIn([1, 0])
    .withMessage('ussdStatus is invalid'),
    body('ussdThreshold')
    .exists()
    .withMessage('ussdThreshold is required')
    .trim().isLength({ min: 1, max: 23 })
    .withMessage('ussdThreshold  maximum limit is 23 words')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('should be a number'),
    body('smsStatus')
    .exists()
    .withMessage('smsStatus is required')
    .isIn([1, 0])
    .withMessage('smsStatus is invalid'),
    body('smsThreshold')
    .exists()
    .withMessage('smsThreshold is required')
    .trim().isLength({ min: 1, max: 23 })
    .withMessage('smsThreshold  maximum limit is 23 words')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('should be a number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getStockTransferByIdSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateStransferChannelSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('user_uuid is of 16 character'),
    body('agent_ostc_uuid')
    .exists().withMessage('agent_ostc_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 23 })
    .withMessage('agent_ostc_uuid1  maximum limit is 16 words'),
    body('status')
    .exists().withMessage('status is required')
    .isIn([1, 0])
    .withMessage('webStatus is invalid'),
    body('threshold')
    .exists().withMessage('threshold is required')
    .trim().isLength({ min: 1, max: 23 })
    .withMessage('webThreshold  maximum limit is 23 words')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getAgentByAgentType = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('agent_type_uuid')
    .exists().withMessage("agent_type_uuid is required")
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent_type_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.verifySecurityPin = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum lengh is 50 words'),
    body('pin')
    .exists()
    .withMessage('pin is required')
    .notEmpty()
    .withMessage('pin must be filled')
    .matches(/^[0-9\s]+$/).withMessage('Pin must contain only number 0-9')
    .trim().isLength({ min: 4, max: 6 })
    .withMessage('Pin should be of 6 words'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 }).withMessage('user_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateAgentPassword = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum length is 50 words'),
    body('pin')
    .exists()
    .withMessage('pin is required')
    .notEmpty()
    .withMessage('Please enter security pin')
    .matches(/^[0-9\s]+$/).withMessage('Pin must contain only number 0-9')
    .trim().isLength({ min: 4, max: 4 })
    .withMessage('Pin should be of 4 digit'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 }).withMessage('user_uuid maximum limit is 16 words'),
    body('password')
    .exists()
    .withMessage('Password is required')
    .notEmpty()
    .trim().isLength({ min: 8 })
    .withMessage('Password must contain at least 8 characters')
    .matches(/^(?=.*[A-Z])[0-9a-zA-Z\d@$.!%*#?&]{8,}$/, "i").withMessage('password must contain once upper character, no space')
    .trim().isLength({ max: 16 })
    .withMessage('Password can contain max 16 characters'),
    body('confirm_password')
    .exists()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('confirm_password field must have the same value as the password field'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateMpin = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }).withMessage('Username maximum length is 50 words'),
    body('pin')
    .exists()
    .withMessage('pin is required')
    .notEmpty()
    .withMessage('pin must be filled')
    .matches(/^[0-9\s]+$/).withMessage('Pin must contain only number 0-9')
    .trim().isLength({ min: 4, max: 6 })
    .withMessage('Pin should be of 6 words'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 }).withMessage('user_uuid maximum limit is 16 words'),
    body('newPin')
    .exists().withMessage('newPin is required')
    .notEmpty().withMessage('pin cant be empty')
    .trim().isLength({ min: 4, max: 4 }).withMessage('newPin must contain at least 4 characters')
    .isNumeric().withMessage('newPin must be numeric'),
    body('confirm_pin')
    .exists()
    .custom((value, { req }) => value === req.body.newPin)
    .withMessage('confirm_pin field must have the same value as the newPin field'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getParentAgentDetail = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    query('user_uuid')
    .exists().withMessage('user uuid is required')
    .trim().isLength({min:16,max: 16}).withMessage('it is og 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.prePaidParentChange = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('agentUser_uuid')
    .exists().withMessage('agent user uuid is required')
    .trim().isLength({min:16,max: 16}).withMessage('it is of 16 character'),
    body('parentUser_uuid')
    .exists().withMessage('agent user uuid is required')
    .trim().isLength({min:16,max: 16}).withMessage('it is of 16 character'),
    body('commissionValue')
    .exists().withMessage('commission percentage is required')
    .isNumeric().withMessage('only number are allowed'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request'),
]

exports.changePostPaidParent = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('agentUser_uuid')
    .exists().withMessage('agent user uuid is required')
    .trim().isLength({min:16,max: 16}).withMessage('it is of 16 character'),
    body('parentUser_uuid')
    .exists().withMessage('agent user uuid is required')
    .trim().isLength({min:16,max: 16}).withMessage('it is of 16 character'),
    body('slab_uuid')
    .exists().withMessage('slab_uuid is required')
    .trim().isLength({min:16,max: 16}).withMessage('it is of 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request'),
]

exports.getAgentTypeForSwitchAcc = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    // query('start')
    // .exists()
    // .withMessage('start is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('should be a number'),
    // query('end')
    // .exists()
    // .withMessage('end is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('should be a number'),
    query('user_uuid')
    .exists().withMessage('agent user uuid is required')
    .trim().isLength({min:16,max: 16}).withMessage('it is of 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getParentListForSwitchAcc = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    // query('start')
    // .exists()
    // .withMessage('start is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('should be a number'),
    // query('end')
    // .exists()
    // .withMessage('end is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('should be a number'),
    // query('rgion_uuid')
    // .exists().withMessage('rgion_uuid uuid is required')
    // .isLength({ min: 16, max:16}).withMessage('rgion_uuid have 16 character'),
    query('commissionType')
    .exists().withMessage('commissionType is required')
    .isIn(['pre_paid','post_paid']).withMessage('can be post_paid, pre_paid'),
    query('agent_type_uuid')
    .exists().withMessage('agent_type_uuid uuid is required')
    .trim().isLength({ min: 16, max:16}).withMessage('agent_type_uuid have 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')

]