const { body, query } = require('express-validator');

exports.createWalletMemberGroup = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('groupName')
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

exports.getWalletMemberGroup = [
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

exports.updateWalletMembergroup = [
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
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.deleteWalletMemberGroup = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('group_uuid')
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

exports.addWalletMemberGroupAgent = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({min:16, max:16}).withMessage('group uuid is of 16 characters'),
    body('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getWalletMemberGroupAgent = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('start')
    .exists().withMessage('start is required')
    .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    .isNumeric().withMessage('start should be number'),
    query('end')
    .exists().withMessage('end is required')
    .matches(/^[0-9\s]+$/).withMessage('should contain proper character 0-9')
    .isNumeric().withMessage('end should be number'),
    query('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({min:16, max:16}).withMessage('group uuid is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.getWalletMemberGroupAgentById = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('member_uuid')
    .exists().withMessage('member_uuid is required')
    .trim().isLength({min:16, max:16}).withMessage('group uuid is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.updateWalletMemberGroupAgent = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('member_uuid')
    .exists().withMessage('member_uuid is required')
    .trim().isLength({min:16, max:16}).withMessage('group uuid is of 16 characters'),
    body('group_uuid')
    .exists().withMessage('group_uuid is required')
    .trim().isLength({min:16, max:16}).withMessage('group uuid is of 16 characters'),
    body('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]

exports.deleteWalletMemberGroupAgent = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('member_uuid')
    .exists().withMessage('member_uuid is required')
    .trim().isLength({min:16, max:16}).withMessage('group uuid is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    }).withMessage('wrong request')
]