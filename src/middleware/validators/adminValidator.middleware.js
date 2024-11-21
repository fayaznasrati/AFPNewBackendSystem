const { body, query } = require('express-validator');
const Role = require('../../utils/userRoles.utils');

exports.createUserSchema = [
    body('full_name')
    .exists()
    .withMessage('Your full name is required')
    .isAlpha()
    .withMessage('Must be only alphabetical chars')
    .trim().isLength({ min: 3 , max: 100})
    .withMessage('Must be at least 3 chars long'),
    body('email')
    .exists()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
    body('operatorName')
    .exists().withMessage('operatorName is required'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required'),
    body('mobile')
    .exists()
    .withMessage('Mobile is required')
    .isNumeric()
    .trim().isLength({ min: 10, max:15 })
    .withMessage('Must be a valid Mobile'),
    body('gender')
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage('Invalid Gender type'),
    body('password')
    .exists()
    .withMessage('Password is required')
    .notEmpty()
    .trim().isLength({ min: 6 })
    .withMessage('Password must contain at least 6 characters')
    .trim().isLength({ max: 25 })
    .withMessage('Password can contain max 25 characters'),
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
    })
    .withMessage('wrong request')
];

exports.validateLogin = [
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
];

exports.getUserByuserName = [
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

exports.changePasswordScheme = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    body('oldPassword')
    .exists()
    .withMessage('old password is required')
    .notEmpty()
    .withMessage('old password must be filled')
    .custom((value, { req }) => value != req.body.password)
    .withMessage('confirm password must have the same value as the password field'),
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

exports.updateUserDetials = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body("name")
    .exists()
    .withMessage('Name is required')
    .trim().isLength({ min: 3, max: 150 })
    .withMessage('user name can be of 3 or more characters ')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('special charactera are not allowed')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter proper user name')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('only A-Z a-z are allowed')
    .isString()
    .withMessage('should be a string'),
    body('email')
    .exists()
    .withMessage('email is required')
    .isEmail()
    .withMessage('email should be proper')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('email maximum lengh is 100 words')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter roper email address')
    .isString()
    .withMessage('should be a string'),
    body('gender')
    .optional()
    .isIn([1,2, 0,null]).withMessage('value should be 1 for Male, 2 for Female, 3 for Other or Null'),
    body('city')
    .exists().withMessage('city is required')
    .trim().isLength({ min: 3, max: 150 }).withMessage('City name should be 3 or more then 3 character long')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter proper email address')
    .matches(/^[a-zA-Z0-9-\s]+$/).withMessage('only this A-Z a-z 0-9 - characters are allowed')
    .isString().withMessage('should be a string'),
    body('address')
    .exists().withMessage('name is required')
    .trim().isLength({ min: 5, max: 500 }).withMessage('Address must be 5 or more then 5 characters long')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter proper Address')
    .matches(/^[a-zA-Z0-9-.\s]+$/).withMessage('only this A-Z a-z - . characters are allowed')
    .isString().withMessage('should be a string'),
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
    }).withMessage('wrong request')
]

exports.requestForOtp = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('mobileNumber')
    .exists().withMessage('Mobile Number is required')
    .isNumeric().withMessage('should be a number')
    .matches(/^[0-9\s]+$/).withMessage('Mobile Number must contain only number 0-9')
    .trim().isLength({ min: 10, max: 15 }).withMessage('MobileNumber maximum length is 15'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 }).withMessage('operator_uuid maximum limit is 16 words'),
    body('operatorName')
    .exists().withMessage('operatorName is required')
    .isString().withMessage('operatorName be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('operatorName maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getOtp = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.verifyAndUpdateNumber = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('mobileNumber')
    .exists().withMessage('Mobile Number is required')
    .isNumeric().withMessage('should be a number')
    .matches(/^[0-9\s]+$/).withMessage('Mobile Number must contain only number 0-9')
    .trim().isLength({ min: 10, max: 15 }).withMessage('MobileNumber maximum length is 15'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 }).withMessage('operator_uuid maximum limit is 16 words'),
    body('operatorName')
    .exists().withMessage('operatorName is required')
    .isString().withMessage('operatorName be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('operatorName maximum limit is 50 words'),
    body('otp')
    .exists().withMessage('OTP Number is required')
    .isNumeric().withMessage('should be a number')
    .matches(/^[0-9\s]+$/).withMessage('OTP must contain only number 0-9')
    .trim().isLength({ min: 6, max: 6 }).withMessage('OPT is of 6 character'),
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
    }).withMessage('wrong request')
]

exports.getSecurityPin = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('Username maximum lengh is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateSecurityPin = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('oldPin')
    .exists()
    .withMessage('Old Pin is required')
    .trim().isLength({ min: 4, max: 4 })
    .withMessage('Pin is of 4 numbers'),
    body('newPin')
    .exists()
    .withMessage('New Pin is required')
    .matches(/^[0-9\s]+$/).withMessage('Pin must contain only number 0-9')
    .trim().isLength({ min: 4, max: 4 })
    .withMessage('New pin should be of 4 digits only'),
    body('confirmNewPin')
    .exists().withMessage('Enter new pin again')
    .custom((value, { req }) => value === req.body.newPin).withMessage('New pin and confirm Pin should be the same'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.verifySecurityPin = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 }),
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
    .trim().isLength({ min: 3, max: 50 }),
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
    body('password')
    .exists()
    .withMessage('Password is required')
    .notEmpty()
    .trim().isLength({ min: 6, max: 6})
    .withMessage('Password must be of 6 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/, "i")
    .withMessage("Password must include one lowercase character, one uppercase character, a number"),
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

exports.addSubAdmin =[
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 }),
    body('name')
    .exists().withMessage('name is required')
    .trim().isLength({ min:3,max:100}).withMessage('allowed name range is min 3 and max 100')
    .matches(/^[a-zA-Z0-9\s]+$/).withMessage('special charactera are not allowed'),
    body('email')
    .exists()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
    body('mobile')
    .exists()
    .withMessage('Mobile is required')
    .isNumeric()
    .trim().isLength({ min: 10, max:15 })
    .withMessage('Must be a valid Mobile'),
    body('cityName')
    .exists().withMessage('cityName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('city name should be of 3 to 100 characters')
    .matches(/^[a-zA-Z0-9-\s]+$/).withMessage('allowed character are a-z A-Z 0-9 -'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('operator_uuid is of 16 character'),
    body('operatorName')
    .exists().withMessage('operatorName is required')
    .trim().isLength({ min: 3, max: 50}).withMessage('operator Name is of range 3 to 50 characters')
    .isAlpha().withMessage('can only be alphabetical'),
    body('department_uuid')
    .exists().withMessage('department is required')
    .trim().isLength({ min:16, max: 16}).withMessage('department uuid is of 16 characters'),
    body('listRegion')
    .exists().withMessage('listRegion is required'),
    body("listRegion[0].region_uuid")
    .exists().withMessage('select one region'),
    body("listRegion[0].regionName")
    .exists().withMessage('select one region'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getSubAdminList=[
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateSubadminDetails = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('subAdminUserid')
    .exists()
    .withMessage('subAdminUserid is required')
    .notEmpty()
    .withMessage('subAdminUserid must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('name')
    .exists().withMessage('name is required')
    .trim().isLength({ min:3,max:100}).withMessage('allowed name range is min 3 and max 100')
    .matches(/^[a-zA-Z0-9\s]+$/).withMessage('special charactera are not allowed'),
    body('email')
    .exists()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
    body('mobile')
    .exists()
    .withMessage('Mobile is required')
    .isNumeric()
    .trim().isLength({ min: 10, max:15 })
    .withMessage('Must be a valid Mobile'),
    body('cityName')
    .exists().withMessage('cityName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('city name should be of 3 to 100 characters')
    .matches(/^[a-zA-Z0-9-\s]+$/).withMessage('allowed character are a-z A-Z 0-9 -'),
    body('operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('operator_uuid is of 16 character'),
    body('operatorName')
    .exists().withMessage('operatorName is required')
    .trim().isLength({ min: 3, max: 50}).withMessage('operator Name is of range 3 to 50 characters')
    .isAlpha().withMessage('can only be alphabetical'),
    body('department_uuid')
    .exists().withMessage('department is required')
    .trim().isLength({ min:16, max: 16}).withMessage('department uuid is of 16 characters'),
    body('listRegion')
    .exists().withMessage('listRegion is required'),
    body("listRegion[0].region_uuid")
    .exists().withMessage('select one region'),
    body("listRegion[0].regionName")
    .exists().withMessage('select one region'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getPerSubAdminDetails =[
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 }),
    query('subAdminUserid')
    .exists()
    .withMessage('subAdminUserid is required')
    .notEmpty()
    .withMessage('subAdminUserid must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.verifyAccess =[
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 }),
    body('subAdminUserid')
    .exists()
    .withMessage('subAdminUserid is required')
    .notEmpty()
    .withMessage('subAdminUserid must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.loginAccess = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled')
    .trim().isLength({ min: 3, max: 50 }),
    body('reason_uuid')
    .exists().withMessage('reason_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('it should have 16 character'),
    body('reason')
    .exists().withMessage('reason is required'),
    body('subAdminUserid')
    .exists()
    .withMessage('subAdminUserid is required')
    .notEmpty()
    .withMessage('subAdminUserid must be filled')
    .trim().isLength({ min: 1, max: 50 }),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.forgetSendPassword = [
    body('userid')
    .exists()
    .withMessage('userid is required')
    .notEmpty()
    .withMessage('userid must be filled')
    .trim().isLength({ min: 3, max: 50 }),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getSubAdminPassword = [
    query('username')
    .exists()
    .withMessage('username is required')
    .notEmpty()
    .withMessage('username must be filled')
    .trim().isLength({ min: 3, max: 50 }),
    body('securityPin')
    .exists().withMessage('Enter you securityPin')
    .trim().isLength({ min: 4, max: 4}).withMessage('Enter proper security pin of 4 digits')
    .matches(/^[0-9\s]+$/).withMessage('Pin can contain 0-9 digit only'),
    body('subAdminUserid')
    .exists().withMessage('Enter sub-Admin id')
    .trim().isLength({ min:3, max: 50}).withMessage('Enter proper Sub-Admin id'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateSubAdminPassword = [
    query('username')
    .exists()
    .withMessage('username is required')
    .notEmpty()
    .withMessage('username must be filled')
    .trim().isLength({ min: 3, max: 50 }),
    body('securityPin')
    .exists().withMessage('Enter you securityPin')
    .trim().isLength({ min: 4, max: 4}).withMessage('Enter proper security pin of 4 digits')
    .matches(/^[0-9\s]+$/).withMessage('Pin can contain 0-9 digit only'),
    body('subAdminUserid')
    .exists().withMessage('Enter sub-Admin id')
    .trim().isLength({ min:3, max: 50}).withMessage('Enter proper Sub-Admin id'),
    body('newPassword')
    .exists().withMessage('Enter new securityPin for sub admin')
    .trim().isLength({ min: 8, max: 16}).withMessage('Enter proper password, 8-16 character are allowed')
    .matches(/^(?=.*[A-Z])[0-9a-zA-Z\d@$.!%*#?&]{8,}$/, "i").withMessage('password must contain once upper character, no space'),
    body('confirmNewSecurityPin')
    .exists().withMessage('Enter new securityPin again for sub admin')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('New security pin and confirmation pin should be same'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateSubAdminPin = [
    query('username')
    .exists()
    .withMessage('username is required')
    .notEmpty()
    .withMessage('username must be filled')
    .trim().isLength({ min: 3, max: 50 }),
    body('securityPin')
    .exists().withMessage('Enter you securityPin')
    .trim().isLength({ min: 4, max: 4}).withMessage('Enter proper security pin of 4 digits')
    .matches(/^[0-9\s]+$/).withMessage('Pin can contain 0-9 digit only'),
    body('subAdminUserid')
    .exists().withMessage('Enter sub-Admin id')
    .trim().isLength({ min:3, max: 50}).withMessage('Enter proper Sub-Admin id'),
    body('newSecurityPin')
    .exists().withMessage('Enter new securityPin for sub admin')
    .trim().isLength({ min: 4, max: 4}).withMessage('Enter proper security pin of 4 digits')
    .matches(/^[0-9\s]+$/).withMessage('Pin can contain 0-9 digit only'),
    body('confirmNewSecurityPin')
    .exists().withMessage('Enter new securityPin again for sub admin')
    .custom((value, { req }) => value === req.body.newSecurityPin)
    .withMessage('New security pin and confirmation pin should be same'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]