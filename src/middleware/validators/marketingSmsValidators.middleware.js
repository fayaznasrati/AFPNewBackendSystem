const { body, query } = require('express-validator');

exports.createSmsTemplateCategorySchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('name')
    .exists()
    .withMessage('name is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('name maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]
exports.allSmsTemplateCategorySchema = [
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
exports.updateSmsTemplateCategorySchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('category_uuid')
    .exists()
    .withMessage('category_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('category_uuid maximum limit is 16 words'),
    body('name')
    .exists()
    .withMessage('name is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('name maximum limit is 16 words'),
    body()
    .custom(value => { return !!Object.keys(value).length; })
    .withMessage('Please provide required field to update')
    .custom(value => {
        const updates = Object.keys(value);
        const allowUpdates = ["username", "category_uuid", "name"];
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
exports.deleteSmsTemplateCategorySchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('category_uuid')
    .exists()
    .withMessage('category_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('category_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

// #################################################################

exports.createSmsTemplateSchemaa = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('category_uuid')
    .exists()
    .withMessage('category_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('category_uuid maximum limit is 16 words'),
    body('name')
    .exists()
    .withMessage('name is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage('should contain proper character A-Z a-z -')
    .trim().isLength({ min: 5, max: 100 })
    .withMessage('name maximum  minimum limit is 5 limit is 100 words'),
    body('message')
    .exists()
    .withMessage('message is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .trim().isLength({ min: 3, max: 500 })
    .withMessage('message limit is 500 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]
exports.allSmsTemplateSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
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
exports.getTemplateDetails = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('template_uuid')
    .exists()
    .withMessage('template_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('template_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]
exports.findMessageSmsTemplateschema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('template_uuid')
    .exists()
    .withMessage('template_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('template_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]
exports.updateSmsTemplateSchemaa = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('template_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('template_uuid maximum limit is 16 words'),
    body('category_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('category_uuid maximum limit is 16 words'),
    body('name')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('should contain proper character A-Z a-z')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('name maximum limit is 100 words'),
    body('message')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .trim().isLength({ min: 3, max: 500 })
    .withMessage('message maximum limit is 500 words'),
    body().custom(value => { return !!Object.keys(value).length; })
    .withMessage('Please provide required field to update')
    .custom(value => {
        const updates = Object.keys(value);
        const allowUpdates = ["username", "template_uuid", "category_uuid", "name", "message"];
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
exports.deleteSmsTemplateSchemaa = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('template_uuid')
    .exists()
    .withMessage('template_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('template_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

// #################################################################

exports.createcreateSmsGroup = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('agent_type_uuid')
    .exists()
    .withMessage('agent_type_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent_type_uuid maximum limit is 16 words'),
    body('agentTypeName')
    .exists().withMessage('agentTypeName is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('maximum character is 50'),
    body('message')
    .exists().withMessage('message should be there')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 500 }).withMessage('maximum is 500 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.createcreateSmsGroupWithTemplate = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('agent_type_uuid')
    .exists()
    .withMessage('agent_type_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent_type_uuid maximum limit is 16 words'),
    body('agentTypeName')
    .exists().withMessage('agentTypeName is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('maximum character is 50'),
    body('template_uuid')
    .exists()
    .withMessage('template_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('template_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.allSmsGroupSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
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

exports.allSmsGroupDateRangeschema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
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
    query('start_date')
    .exists()
    .withMessage('start is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date format should be YYYY-MM-DD'),
    query('end_date')
    .exists()
    .withMessage('start is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date format should be YYYY-MM-DD'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.findMessageSmsgroupSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('send_group_sms_uuid')
    .exists()
    .isString()
    .withMessage('should be a string')
    .withMessage('send_group_sms_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('send_group_sms_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateSmsGroupSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('send_group_sms_uuid')
    .exists()
    .withMessage('send_group_sms_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 3, max: 16 })
    .withMessage('send_group_sms_uuid maximum limit is 16 words'),
    body('template_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('template_uuid maximum limit is 16 words'),
    body('name')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('should contain proper character A-Z a-z')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('name maximum limit is 50 words'),
    body('type')
    .optional()
    .isIn([1, 2])
    .withMessage('message maximum  minimum limit is 10 limit is 500 words'),
    body('title')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('should contain proper character A-Z a-z')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('title maximum limit is 50 words'),
    body('message')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .trim().isLength({ min: 3, max: 500 })
    .withMessage('message maximum limit is 500 words'),
    body().custom(value => {
        return !!Object.keys(value).length;
    })
    .withMessage('Please provide required field to update')
    .custom(value => {
        const updates = Object.keys(value);
        const allowUpdates = ["send_group_sms_uuid", "template_uuid", "name", "type", "title", "message"];
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

exports.deleteSmsGroupSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string'),
    query('send_group_sms_uuid')
    .exists()
    .withMessage('send_group_sms_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('send_group_sms_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

// ############################################

exports.createSmsSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('send_group_sms_uuid')
    .exists()
    .withMessage('send_group_sms_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('send_group_sms_uuid maximum limit is 16 words'),
    body('number')
    .exists()
    .withMessage('number is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('should be a number'),
    body('message')
    .exists()
    .withMessage('message is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .trim().isLength({ min: 3, max: 500 })
    .withMessage('message maximum limit is 500 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.allSmsSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
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
    query('send_group_sms_uuid')
    .exists()
    .withMessage('send_group_sms_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('send_group_sms_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateSmsSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('send_sms_uuid')
    .exists()
    .withMessage('send_sms_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('send_sms_uuid maximum limit is 16 words'),
    body('send_group_sms_uuid')
    .exists()
    .withMessage('send_group_sms_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('send_group_sms_uuid maximum limit is 16 words'),
    body('number')
    .optional()
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('number should be number'),
    body('message')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .trim().isLength({ min: 3, max: 500 })
    .withMessage('message maximum limit is 500 words'),
    body().custom(value => {
        return !!Object.keys(value).length;
    })
    .withMessage('Please provide required field to update')
    .custom(value => {
        const updates = Object.keys(value);
        const allowUpdates = ["send_sms_uuid", "send_group_sms_uuid", "number", "message"];
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

exports.getPendingSms = [
]

exports.updatePendingStatus = [
    body('messageId')
    .exists().withMessage('is required')
]