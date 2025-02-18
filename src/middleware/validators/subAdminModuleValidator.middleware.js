const { body, query } = require('express-validator');

//basic validation for module
exports.subAdminAddModuleName = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("moduleName")
    .exists().withMessage('moduleName is required')
    .trim().isLength({ min: 1, max: 100 }).withMessage('moduleName maximum limit is 100 words'),
    body("moduleTitle")
    .exists().withMessage('moduleTitle is required')
    .trim().isLength({ min: 1, max: 100 }).withMessage('moduleTitle maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request'),
]

exports.subAdminGetAllModuleName = [
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

exports.subAdminUpdateModuleName = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("sub_admin_module_id")
    .exists().withMessage('sub_admin_module_id is required')
    .trim().isLength({ min:1, max:11}).withMessage('sub_admin_module_id can be of 11 character max'),
    body("moduleName")
    .exists().withMessage('moduleName is required')
    .trim().isLength({ min: 3, max: 100 }).withMessage('moduleName maximum limit is 100 words'),
    body("moduleTitle")
    .exists().withMessage('moduleTitle is required')
    .trim().isLength({ min: 1, max: 100 }).withMessage('moduleTitle maximum limit is 100 words'),
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
exports.subAdminGetAllSubModuleListName = [
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

exports.subAdminAddSubModuleName = [
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

exports.subAdminUpdateSubModuleName = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("sub_admin_sub_module_id")
    .exists().withMessage('sub_admin_sub_module_id is required')
    .trim().isLength({ min:1, max:11}).withMessage('sub_admin_sub_module_id can be of 11 character max'),
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

exports.subAdminGetAllModuleList = [
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
    })
    .withMessage('wrong request'),
]

exports.departmentAssignRights = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    body("moduleList")
    .exists().withMessage('moduleList is required'),
    body('department_uuid')
    .exists().withMessage('department_uuid is required')
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

exports.getSubMododuleByDepartmentId = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
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

exports.subAdminGetAssignedModule = [
    query('username')
    .exists().withMessage('username is required')
    .isString().withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 }).withMessage('username maximum limit is 50 words'),
    query('department_uuid')
    .exists().withMessage('department_uuid is required')
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