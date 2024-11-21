const { body, query } = require('express-validator');

//basic validation for module
exports.addModule = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("moduleName")
    .exists().withMessage('moduleName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('moduleName maximum limit is 100 words'),
    body("moduleTitle")
    .exists().withMessage('moduleTitle is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('moduleTitle maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getAllModuleName = [
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

exports.updateModuleName = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("agent_module_id")
    .exists().withMessage('agent_module_id is required')
    .trim().isLength({ min:1, max:11}).withMessage('agent_module_id can be of 11 character max'),
    body("moduleName")
    .exists().withMessage('moduleName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('moduleName maximum limit is 100 words'),
    body("moduleTitle")
    .exists().withMessage('moduleTitle is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('moduleTitle maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

// basic validation for sub-module 
exports.getAllSubModuleList = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('moduleName')
    .exists().withMessage('moduleName is required')
    .trim().isLength({min:1, max: 100 }).withMessage('module name can bo of 100 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.addSubModule = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("moduleName")
    .exists().withMessage('moduleName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('moduleName maximum limit is 100 words'),
    body("subModuleName")
    .exists().withMessage('subModuleName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('subModuleName maximum limit is 100 words'),
    body("subModuleTitle")
    .exists().withMessage('subModuleTitle is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('subModuleTitle maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.updateSubModuleName = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("agent_sub_module_id")
    .exists().withMessage('agent_sub_module_id is required')
    .trim().isLength({ min:1, max:11}).withMessage('agent_sub_module_id can be of 11 character max'),
    body("moduleName")
    .exists().withMessage('moduleName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('moduleName maximum limit is 100 words'),
    body("subModuleName")
    .exists().withMessage('subModuleName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('subModuleName maximum limit is 100 words'),
    body("subModuleTitle")
    .exists().withMessage('subModuleTitle is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('subModuleTitle maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

// required validation
exports.getSubModuleListByUserId = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('moduleName')
    .exists().withMessage('module name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 100 }).withMessage('module name maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getSubModulePermissions =[
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('moduleName')
    .exists().withMessage('module name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 100 }).withMessage('module name maximum limit is 100 words'),
    query('subModuleName')
    .exists().withMessage('module name is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 100 }).withMessage('module name maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getAllModuleList = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
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
    })
    .withMessage('wrong request'),
]

exports.agentAssignRights = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("moduleList")
    .exists().withMessage('moduleList is required'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('User not created, enter proper details'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.updateAssignRights = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("moduleList")
    .exists().withMessage('moduleList is required'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('User not created, enter proper details'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getAssignedModule = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getParentModuleList = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.parentAgentAssignRights = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'), 
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('is of 16 characters'),
    body('moduleList')
    .exists().withMessage('moduleList is required'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.getParentAgentAssignRights = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.updateParentAgentAssignRights = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("moduleList")
    .exists().withMessage('moduleList is required'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .trim().isLength({ min:16, max: 16}).withMessage('is of 16 characters'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]