const { body, query } = require('express-validator');

exports.getDetails = [
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

exports.agentLogin =[
    body('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body('password')
    .exists()
    .withMessage('Password is required')
    .notEmpty()
    .withMessage('Password must be filled'),
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
    .exists().withMessage('device type is required')
    .isIn(["Mobile","Web"]).withMessage(' can be Web or Mobile'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateAgentDetails = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body("name")
    .exists().withMessage('name is required')
    .trim().isLength({ min : 3, max : 100 }).withMessage('Enter proper name more then 3 - 100 characters long')
    .notEmpty().withMessage('name cant be blank or null')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name should be alphabetical only'),
    body("email")
    .optional({nullable: true})
    .isEmail().optional({nullable: true}).withMessage('Email should be proper')
    .trim().isLength({ min : 5, max : 50}).optional({nullable: true}).withMessage("Enter an proper email address, 5 - 50 characters are allowed")
    .notEmpty().optional({nullable: true}).withMessage('email cant be blank'),
    body("city")
    .exists().withMessage('city is required')
    .trim().isLength({ min : 3, max : 50}).withMessage('Enter proper city name, 3 - 50 characters are allowed')
    .notEmpty().withMessage('empty city name is not allowed'),
    body("address")
    .exists().withMessage('address is required')
    .trim().isLength({ min : 3, max: 100}).withMessage("Enter proper address, 3-100 characters are allowed")
    .notEmpty().withMessage('empty string is not allowed'),
    body("gender")
    .optional({nullable: true})
    .isIn([1,0,2]).optional({nullable: true}).withMessage('1 for male, 2 for female, 0 for other'),
    body('shopName')
    .exists().withMessage('shop name is required')
    .trim().isLength({min : 2, max :100}).withMessage('Can be of range 2-100 character')
    .notEmpty().withMessage('cant be blank'),
    // body('lang_uuid')
    // .exists().withMessage('lang_uuid is required')
    // .isLength({ min:16, max: 16}).withMessage('lang_uuid is of 16 characters'),
    // body('langName')
    // .exists().withMessage('language name is required')
    // .isLength({min : 2, max :50}).withMessage('Can be of range 2-50 character')
    // .notEmpty().withMessage('cant be blank'),
    body('userIpAddress')
    .optional({nullable: true})
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
    .optional({nullable: true}),
    // .isIn(["Mobile","Web"]).optional({nullable: true}).withMessage(' can be Web or Mobile'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.changePassword = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled'),
    body('oldPassword')
    .exists().withMessage('old password is required')
    .notEmpty().withMessage('old password must be filled')
    .custom((value, { req }) => value != req.body.password).withMessage('confirm_password field must have the same value as the password field'),
    body('password')
    .exists().withMessage('Password is required')
    .notEmpty().withMessage('password cant be blank')
    .trim().isLength({ min: 8 })
    .withMessage('Password must contain at least 8 characters')
    .matches(/^(?=.*[A-Z])[0-9a-zA-Z\d@$.!%*#?&]{8,}$/, "i").withMessage('password must contain once upper character, no space')
    .trim().isLength({ max: 16 })
    .withMessage('Password can contain max 16 characters'),
    body('confirm_password')
    .exists().withMessage('confirm password is required')
    .custom((value, { req }) => value === req.body.password).withMessage('confirm_password field must have the same value as the password field'),
    body('userIpAddress')
    .optional({nullable: true})
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
    .optional({nullable: true}),
    // .isIn(["Mobile","Web"]).optional({nullable: true}).withMessage(' can be Web or Mobile'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.addContactNumber = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled'),
    // body("operator_uuid")
    // .exists().withMessage('Select an Operator')
    // .trim().isLength({ min : 16, max : 16}).withMessage("Select an Operator"),
    // body('operatorName')
    // .exists().withMessage('Select an Operator')
    // .trim().isLength({ min : 3, max : 50}).withMessage('Select an Operator')
    // .isString().withMessage('Select an Operator'),
    body('mobileType')
    .exists().withMessage('Select mobile number type as Primary or Alternate')
    .isIn([1,0]).withMessage('Select mobile number type as Primary or Alternate'),
    body('mobile')
    .exists().withMessage('mobile is required')
    .trim().isLength({ min :10 , max : 10}).withMessage('Enter proper mobile number of 10 digits'),
    body('recieveNotification')
    .exists().withMessage('Select Receive Notification as yes or no')
    .isIn([1,0,]).withMessage('Select Receive Notification as yes or no'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateContactNumber = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled'),
    body("agent_contact_uuid")
    .exists().withMessage('agent_contact_uuid is required')
    .trim().isLength({ min : 16, max : 16}).withMessage("agent_contact_uuid is of 16 characters"),
    // body("operator_uuid")
    // .exists().withMessage('Select an Operator')
    // .trim().isLength({ min : 16, max : 16}).withMessage("Select an Operator"),
    // body('operatorName')
    // .exists().withMessage('Select an Operator')
    // .trim().isLength({ min : 3, max : 50}).withMessage('Select an Operator')
    // .isString().withMessage('should be a string'),
    body('mobileType')
    .exists().withMessage('mobileType is required')
    .isIn([1,0]).withMessage('use 1 for primary and 0 for alternative'),
    body('mobile')
    .exists().withMessage('mobile is required')
    .trim().isLength({ min :10 , max : 10}).withMessage('Enter proper mobile number of 10 digits'),
    body('status')
    .exists().withMessage('status is required')
    .isIn([1,0,]).withMessage('Select status as Active or In-Active'),
    body('recieveNotification')
    .exists().withMessage('Please select Receive Notification as yes or no')
    .isIn([1,0,]).withMessage('Please select Receive Notification as yes or no'),
    body('userIpAddress')
    .optional({nullable: true})
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
    .optional({nullable: true}),
    // .isIn(["Mobile","Web"]).optional({nullable: true}).withMessage(' can be Web or Mobile'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updatPin = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled'),
    body('pin')
    .exists().withMessage('pin is required')
    .trim().isLength({min: 6, max:6}).withMessage('pin must be of 6 number')
    .isNumeric().withMessage('only numbers are allowed'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.forgetSendPassword = [
    body('userid')
    .exists()
    .withMessage('userid is required')
    .notEmpty()
    .withMessage('userid must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateImage = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]