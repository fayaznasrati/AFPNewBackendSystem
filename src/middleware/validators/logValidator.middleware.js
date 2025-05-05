const { body, query } = require('express-validator');

exports.logAdminUpdatePassword = [
    // body('userid')
    // .exists().withMessage('userid is required')
    // .trim().isLength({min: 1, max:11}).withMessage("maximum 11 character are allowed"),
    // body('username')
    // .exists().withMessage('username is required')
    // .trim().isLength({min: 1, max:15}).withMessage("maximum 15 character are allowed"),
    // body('usertype')
    // .exists().withMessage('usertype is required')
    // .trim().isLength({min: 1, max:15}).withMessage("maximum 15 character are allowed"),
    // body('old_password')
    // .exists().withMessage('old_password is required')
    // .trim().isLength({min: 1, max:100}).withMessage("maximum 100 character are allowed"),
    // body('old_encryption_key')
    // .exists().withMessage('old_encryption_key is required')
    // .trim().isLength({min: 1, max:100}).withMessage("maximum 100 character are allowed"),
    // body('new_password')
    // .exists().withMessage('new_password is required')
    // .trim().isLength({min: 1, max:100}).withMessage("maximum 100 character are allowed"),
    // body('new_encryption_key')
    // .exists().withMessage('new_encryption_key is required')
    // .trim().isLength({min: 1, max:100}).withMessage("maximum 100 character are allowed"),
    // body('created_by')
    // .exists().withMessage('created_by is required')
    // .trim().isLength({min: 1, max:11}).withMessage("maximum 11 character are allowed")
]

exports.getAdminUpdatePasswordLog = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    // query('start_date')
    // .exists().withMessage('start date is required')
    // .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('format is YYYY-MM-DD'),
    // query('end_date')
    // .exists().withMessage('end date is required')
    // .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('format is YYYY-MM-DD'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addMultipleActivityLog = [
    body('mulActivityLog')
    .exists().withMessage('mulActivityLog is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.logAdminUpdateMobile = [
    // body('userid')
    // .exists().withMessage('userid is required')
    // .trim().isLength({min: 1, max:11}).withMessage("maximum 11 character are allowed"),
    // body('username')
    // .exists().withMessage('username is required')
    // .trim().isLength({min: 1, max:15}).withMessage("maximum 15 character are allowed"),
    // body('usertype')
    // .exists().withMessage('usertype is required')
    // .trim().isLength({min: 1, max:15}).withMessage("maximum 15 character are allowed"),
    // body('old_mobile_number')
    // .exists().withMessage('old_mobile_number is required')
    // .trim().isLength({min: 10, max:10}).withMessage("10 character are allowed"),
    // body('old_mobile_operator')
    // .exists().withMessage('old_mobile_operator is required')
    // .trim().isLength({min: 16, max:16}).withMessage("maximum 16 character are allowed"),
    // body('new_mobile_number')
    // .exists().withMessage('new_mobile_number is required')
    // .trim().isLength({min: 10, max:10}).withMessage("maximum 10 character are allowed"),
    // body('new_mobile_operator')
    // .exists().withMessage('new_mobile_operator is required')
    // .trim().isLength({min: 16, max:16}).withMessage("16 character are allowed"),
]

exports.getAdminUpdateMobileLog =[
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    // query('start_date')
    // .exists().withMessage('start date is required')
    // .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('format is YYYY-MM-DD'),
    // query('end_date')
    // .exists().withMessage('end date is required')
    // .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('format is YYYY-MM-DD'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addActivityLog = [
    // body('userid')
    // .exists().withMessage('Username is required')
    // .notEmpty().withMessage('Username must be filled'),
    // body('user_uuid')
    // .exists().withMessage('user uuid is required')
    // .trim().isLength({min:16, max: 16}).withMessage('is of 16 digit')
    // .notEmpty().withMessage('cant be empty'),
    // body('full_name')
    // .exists().withMessage('Username is required')
    // .trim().isLength({min: 1, max: 150}).withMessage("maximum 150 character are allowed"),
    // body('username')
    // .exists().withMessage('username is required')
    // .trim().isLength({ min:1, max: 50}).withMessage("maximum 50 character are allowed"),
    // body('mobile')
    // .optional({nullable: true})
    // .trim().isLength({min:0,max:15}).optional({nullable: true}).withMessage(' maximum 15 character are allowed'),
    // body('intCreatedByType')
    // .exists().withMessage('intCreatedByType is required'),
    // body('intUserType')
    // .exists().withMessage('intusertye is required')
    // .trim().isLength({ min:1, max: 4}).withMessage("maximum 4 character are allowed"),
    // body('userIpAddress')
    // .exists().withMessage('userIpAddress is required')
    // .trim().isLength({min:1, max: 50}).withMessage("maximum 50 character are allowed"),
    // body('userMacAddress')
    // .exists().withMessage('userMacAddress is required')
    // .trim().isLength({min:1,max: 50}).withMessage("maximum 50 character are allowed"),
    // body('userOsDetails')
    // .exists().withMessage('userOsDetails is required')
    // .trim().isLength({min: 1, max: 1000}).withMessage("maximum 1000 character are allowed"),
    // body('userImeiNumber')
    // .exists().withMessage('userImeiNumber is required')
    // .trim().isLength({min: 1, max: 50}).withMessage("maximum 50 character are allowed"),
    // body('userGcmId')
    // .exists().withMessage('userGcmId is required')
    // .trim().isLength({ min:1, max: 200}).withMessage("maximum 200 character are allowed"),
    // body('userAppVersion')
    // .optional({nullable: true})
    // .trim().isLength({ min:1,max:50}).optional({nullable: true}).withMessage('maximum 100 character are allowed'),
    // body('userApplicationType')
    // .exists().withMessage('userApplicationType is required')
    // .isIn([1,2,0,3,4]).withMessage(' can be 1 or 2'),
    // body('description')
    // .exists().withMessage('description is required')
    // .trim().isLength({ min:1, max: 500}).withMessage("maximum 500 character are allowed"),
    // body('userActivityType')
    // .exists().withMessage('userActivityType is required')
    // .trim().isLength({min: 1, max: 11}).withMessage("maximum 11 character are allowed")
    // .isNumeric().withMessage('numerical values are only allowed'),
    // body('oldValue')
    // .exists().withMessage('oldValue is required')
    // .trim().isLength({min: 1, max: 500}).withMessage("maximum 500 character are allowed"),
    // body('newValue')
    // .exists().withMessage('newValue is required')
    // .trim().isLength({min: 1, max: 500}).withMessage("maximum 500 character are allowed"),
    // body('user_detials')
    // .custom(value => {
    //     if (value === undefined) {
    //         return true
    //     }
    //     return false
    // }).withMessage('wrong request')
]

exports.addLoginLog =[
    // body('userid')
    // .exists().withMessage('userid is required')
    // .trim().isLength({min: 1, max : 11}).withMessage("maximum 11 character are allowed"),
    // body('user_uuid')
    // .exists().withMessage('user_uuid is required')
    // .trim().isLength({ min: 16, max: 16}).withMessage(" is of 16 character"),
    // body('full_name')
    // .exists().withMessage('Username is required')
    // .trim().isLength({min: 1, max: 150}).withMessage("maximum 150 character are allowed"),
    // body('username')
    // .exists().withMessage('username is required')
    // .trim().isLength({ min:1, max: 50}).withMessage("maximum 50 character are allowed"),
    // body('email')
    // .exists().withMessage('email is required')
    // .trim().isLength({min:1, max: 100}).withMessage("maximum 100 character are allowed"),
    // body('mobile')
    // .exists().withMessage('mobile is required')
    // .trim().isLength({min:0,max:15}).withMessage(' maximum 15 character are allowed'),
    // body('usertype')
    // .exists().withMessage('usertype is required')
    // .isIn([1,2,0]).withMessage(' can be 1 or 2'),
    // body('login_ip')
    // .exists().withMessage('login_ip is required')
    // .trim().isLength({min:1, max: 100}).withMessage("maximum 100 character are allowed"),
    // body('Created_by_username')
    // .exists().withMessage('Created_by_username is required')
    // .trim().isLength({min:1, max: 50}).withMessage("maximum 50 character are allowed"),
]

exports.getAdminActivityLog =[
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getAgentSelfActivityLog = [
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
    }).withMessage('wrong request')
]

exports.getAgentActivityLog = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getSubAdminActivityLog = [
    query('username')
    .exists().withMessage('Username is required')
    .notEmpty().withMessage('Username must be filled'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
] 

exports.getAgentWithNoActivity = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            // console.log('Invalid request')
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addSwitchAccLog = [
    // body('userid')
    // .exists().withMessage('userid is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9'),
    // body('agentUsername')
    // .exists().withMessage('agentUsername is required')
    // .trim().isLength({min:3,max:50}).withMessage('min 3 and max 50 character are allowed'),
    // body('agentName')
    // .exists().withMessage('agentName is required')
    // .trim().isLength({min:3,max:50}).withMessage('min 3 and max 50 character are allowed'),
    // body('agentType')
    // .exists().withMessage('agentType is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9'),
    // body('oldParentUsername')
    // .exists().withMessage('oldParentUsername is required')
    // .trim().isLength({min:3,max:50}).withMessage('min 3 and max 50 character are allowed'),
    // body('oldParentName')
    // .exists().withMessage('oldParentName is required')
    // .trim().isLength({min:3,max:50}).withMessage('min 3 and max 50 character are allowed'),
    // body('newParentUsername')
    // .exists().withMessage('newParentUsername is required')
    // .trim().isLength({min:3,max:50}).withMessage('min 3 and max 50 character are allowed'),
    // body('newParentName')
    // .exists().withMessage('newParentName is required')
    // .trim().isLength({min:3,max:50}).withMessage('min 3 and max 50 character are allowed'),
    // body('userName')
    // .exists().withMessage('userName is required')
    // .trim().isLength({min:3,max:50}).withMessage('min 3 and max 50 character are allowed'),
    // body('fullName')
    // .exists().withMessage('fullName is required')
    // .trim().isLength({min:3,max:50}).withMessage('min 3 and max 50 character are allowed'),
    // body('user_detials')
    // .custom(value => {
    //     if (value === undefined) {
    //         // console.log('Invalid request')
    //         return true
    //     }
    //     return false
    // }).withMessage('wrong request')
]

exports.getSwithAccountLog = [
    query('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username must be filled'),
    // query('start')
    // .exists().withMessage('start is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('start should be number'),
    // query('end')
    // .exists().withMessage('end is required')
    // .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    // .isNumeric().withMessage('end should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            // console.log('Invalid request')
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addUssdLog = [
    // body('MSISDN')
    // .exists().withMessage('field is required'),
    // body('IMSI')
    // .exists().withMessage('field is required'),
    // body('input')
    // .exists().withMessage('field is required'),
    // body('datetime')
    // .exists().withMessage('field is required'),
    // body('isnewrequest')
    // .exists().withMessage('field is required'),
    // body('operatorId')
    // .exists().withMessage('field is required'),
    // body('freeFlow')
    // .exists().withMessage('field is required'),
    // body('responceMesssage')
    // .exists().withMessage('field is required'),
]

exports.addP2aLog = [
    // body('MSISDN')
    // .exists().withMessage('field is required'),
    // body('input')
    // .exists().withMessage('field is required'),
    // body('lastInput')
    // .exists().withMessage('field is required'),
    // body('smsResponce')
    // .exists().withMessage('field is required'),
]