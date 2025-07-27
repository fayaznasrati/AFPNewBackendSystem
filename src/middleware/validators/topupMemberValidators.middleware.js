const { body, query } = require('express-validator');

exports.createMemberGroup = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('name')
    .exists().withMessage('Group name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('Group name minimum 3 character maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getMemberGroups = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
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

exports.updateMemberGroup = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('group_uuid is of 16 characters'),
    body('name')
    .exists().withMessage('Group name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('Group name minimum 3 character maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.deleteMessagegroup = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('group_uuid is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.addMember = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('group_uuid is of 16 characters'),
    body('groupName')
    .exists().withMessage('Group name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('Group name minimum 3 character maximum limit is 50 words'),
    body('memberName')
    .optional(),
    body('mobile')
    .optional(),
    body('multipleMobile')
    .optional(),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]


exports.addMemberBulk = [
  query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username max 50 chars'),

  body().isArray().withMessage('Request body should be an array'),

  body('*.group_uuid')
    .exists().withMessage('group_uuid is required')
    .isString().isLength({ min: 16, max: 16 }).withMessage('group_uuid must be 16 chars'),

  body('*.groupName')
    .exists().withMessage('groupName is required')
    .isString().isLength({ min: 3, max: 50 }),

  body('*.memberName')
    .optional()
    .isString(),

  body('*.mobile')
    .exists().withMessage('mobile is required')
    .isString().isLength({ min: 10, max: 10 }).withMessage('mobile must be 10 digits'),

  body('*.amount')
    .optional()
    .isNumeric(),

  body('user_detials')
    .custom(value => value === undefined).withMessage('wrong request')
];

exports.getMemberList = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('group_uuid is of 16 characters'),
    query('groupName')
    .exists().withMessage('Group name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('Group name minimum 3 character maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateMemberDetails = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('member_uuid')
    .exists().withMessage('member_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('member_uuid is of 16 characters'),
    body('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('group_uuid is of 16 characters'),
    body('groupName')
    .exists().withMessage('Group name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('Group name minimum 3 character maximum limit is 50 words'),
    body('memberName')
    .optional(),
    body('mobile')
    .exists().withMessage('Mobile number is required')
    .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    .trim().isLength({ min: 10, max:10}).withMessage('Mobile mumber is of 10 digits')
    .isNumeric().withMessage('start should be number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.deleteMember= [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('member_uuid')
    .exists().withMessage('member_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('member_uuid is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getUserGroupList = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.addAgentGroup = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("user_uuid")
    .exists().withMessage('user_uuid is required')
    .trim().isLength({min:16,max:16}).withMessage('is of 16 character'),
    body("groupName")
    .exists().withMessage("groupName is required")
    .trim().isLength({min:1, max:100}).withMessage('can be of 100 character max'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getAgentGroupList = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query("user_uuid")
    .exists().withMessage('user_uuid is required')
    .trim().isLength({min:16,max:16}).withMessage('is of 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getAgentMemberList = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query("group_uuid")
    .exists().withMessage('group_uuid is required')
    .trim().isLength({min:16,max:16}).withMessage('is of 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.addAgentGroupMember = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("group_uuid")
    .exists().withMessage('group_uuid is required')
    .trim().isLength({min:16,max:16}).withMessage('is of 16 character'),
    body("memberName")
    .optional(),
    body('mobile')
    .exists().withMessage("mobile number is required")
    .trim().isLength({ min:10, max:10}).withMessage('Please Enter Complete 10 Numbers!'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.updateAgentMember = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("member_uuid")
    .exists().withMessage('member_uuid is required')
    .trim().isLength({min:16,max:16}).withMessage('is of 16 character'),
    body("group_uuid")
    .exists().withMessage('group_uuid is required')
    .trim().isLength({min:16,max:16}).withMessage('is of 16 character'),
    body("memberName")
    .optional(),
    body('mobile')
    .exists().withMessage("mobile number is required")
    .trim().isLength({ min:10, max:10}).withMessage('Please Enter Complete 10 Numbers!'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.deleteAgentMember = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query("member_uuid")
    .exists().withMessage('member_uuid is required')
    .trim().isLength({min:16,max:16}).withMessage('is of 16 character'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]