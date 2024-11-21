const { body, query } = require('express-validator');

exports.createTicketCategorySchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('name')
    .exists()
    .withMessage('ticket_category_name is required')
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
    .withMessage('ticket_category_name maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.allTicketCategorySchema = [
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

exports.updateTicketCategorySchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('ticket_category_uuid')
    .exists()
    .withMessage('ticket_category_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('ticket_category_uuid maximum limit is 16 words'),
    body('name')
    .exists()
    .withMessage('ticket_category_name is required')
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
    .withMessage('ticket_category_name maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteTicketCategorySchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('ticket_category_uuid')
    .exists()
    .withMessage('ticket_category_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('ticket_category_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

//##############################################################################

exports.createTicketSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('ticket_category_uuid')
    .exists()
    .withMessage('ticket_category_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('ticket_category_uuid maximum limit is 16 words'),
    body('subject')
    .exists()
    .withMessage('subject is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9-,.\s]+$/)
    .withMessage('should contain proper character A-Z a-z -,.')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('ticket_category_uuid maximum limit is 100 words'),
    body('ticket_status')
    .exists()
    .withMessage('ticket_status_uuid is required')
    .isIn([1, 2, 3, 4])
    .withMessage('the value should be 1 for Pending, 2 for In-Process, 3 for Failed, 4 for Delivered'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.allTicketSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
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

exports.specificTicketSchema = [
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

exports.updateTicketSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('ticket_disp_id')
    .exists()
    .withMessage('ticket_disp_id is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 14, max: 14 })
    .withMessage('ticket_disp_id maximum limit is 14 words'),
    body('ticket_category_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('ticket_category_uuid maximum limit is 16 words'),
    body('subject')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .matches(/^[a-zA-Z0-9-,.\s]+$/)
    .withMessage('should contain proper character A-Z a-z - , .')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('ticket_category_uuid minimum limit is 5 and maximum limit is 100 words'),
    body('ticket_status_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('ticket_status_uuid maximum limit is 16 words'),
    body('status')
    .optional()
    .isIn([1, 0])
    .withMessage('should be 1, 0'),
    body()
    .custom(value => {
        return !!Object.keys(value).length;
    })
    .withMessage('Please provide required field to update')
    .custom(value => {
        const updates = Object.keys(value);
        const allowUpdates = ['username', 'ticket_disp_id', 'ticket_category_uuid', 'subject', 'ticket_status_uuid', 'status'];
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

exports.deleteTicketSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('ticket_disp_id')
    .exists()
    .isString()
    .withMessage('should be a string')
    .withMessage('ticket_disp_id is required')
    .trim().isLength({ min: 14, max: 14 })
    .withMessage('ticket_disp_id maximum limit is 14 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

// #################################################################################

exports.allTicketmessageSchema = [
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

exports.specificTicketmessageSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('ticket_disp_id')
    .exists()
    .withMessage('ticket_disp_id is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 2, max: 14 })
    .withMessage('ticket_message_disp_id maximum limit is 14 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.createTicketmessageSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('ticket_disp_id')
    .exists()
    .withMessage('ticket_disp_id is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 2, max: 14 })
    .withMessage('ticket_disp_id maximum limit is 14 words'),
    body('message')
    .exists()
    .withMessage('ticket_message is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('only space are not allowed')
    .trim().isLength({ min: 3, max: 500 })
    .withMessage('ticket_message maximum limit is 500 words'),
    body('filename')
    .optional({nullable: true})
    .notEmpty().optional({nullable: true}).withMessage('filename can be null but empty string is not allowed'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.createTicketMessage = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('ticket_category_uuid')
    .exists().withMessage('ticket_category_uuid is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 }).withMessage('ticket_category_uuid maximum limit is 16 words'),
    body('subject')
    .exists().withMessage('subject is required')
    .isString().withMessage('should be a string')
    .notEmpty().withMessage('tick subject cant be empty')
    .trim().isLength({ min: 3, max: 100 }).withMessage('ticket_category_uuid maximum limit is 100 words'),
    body('message')
    .exists().withMessage('ticket_message is required')
    .isString().withMessage('should be a string')
    .notEmpty().withMessage('tick subject cant be empty')
    .trim().isLength({ min: 3, max: 500 }).withMessage('ticket_message maximum limit is 500 words'),
    body('filename')
    .optional({nullable: true})
    .notEmpty().optional({nullable: true}).withMessage('filename can be null but empty string is not allowed'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getImage = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    query('imageName')
    .exists().withMessage('imageName is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getDownlineTicket =[
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
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
    .withMessage('wrong request'),
]