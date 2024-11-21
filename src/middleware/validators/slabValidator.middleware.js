const { body, query } = require('express-validator');

exports.createSlabManagerSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('slabName')
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
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('Enter slab name, slab name can be alphanumeric only')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('name maximum limit is 50 words'),
    body('slabdetail[0].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('slabdetail[0].commisionPercentage')
    .exists().withMessage('commisionPercentage is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper commission percentage for 1st Operator')
    .isNumeric()
    .withMessage('Commission percentage should be number only')
    .trim().isLength({ min: 1, max: 5 })
    .withMessage('commisionPercentage maximum limit is 2 words'),
    body('slabdetail[0].targetStatus')
    .exists().withMessage('target status is required')
    .isIn([1, 0])
    .withMessage('Select proper target status'),
    body('slabdetail[0].target')
    .exists().withMessage('target is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper target value for 1st Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('Target maximum limit is 13 words'),
    body('slabdetail[0].reward')
    .exists().withMessage('reward is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper reward for 1st Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('reward maximum limit is 13 words'),

    body('slabdetail[1].operator_uuid')
    .optional()
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('slabdetail[1].commisionPercentage')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper commission percentage for 2nd Operator')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 5 })
    .withMessage('commisionPercentage maximum limit is 2 words'),
    body('slabdetail[1].targetStatus')
    .optional()
    .isIn([1, 0])
    .withMessage('Select proper target status'),
    body('slabdetail[1].target')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper target value for 2nd Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('target maximum limit is 13 words'),
    body('slabdetail[1].reward')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper reward for 2nd Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('reward maximum limit is 13 words'),

    body('slabdetail[2].operator_uuid')
    .optional()
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('slabdetail[2].commisionPercentage')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper commission percentage for 3rd Operator')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 5 })
    .withMessage('commisionPercentage maximum limit is 2 words'),
    body('slabdetail[2].targetStatus')
    .optional()
    .isIn([1, 0])
    .withMessage('Select proper target status'),
    body('slabdetail[2].target')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper target value for 3rd Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('target maximum limit is 13 words'),
    body('slabdetail[2].reward')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper reward for 3rd Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('reward maximum limit is 13 words'),

    body('slabdetail[3].operator_uuid')
    .optional()
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('slabdetail[3].commisionPercentage')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper commission percentage for 4th Operator')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 5 })
    .withMessage('commisionPercentage maximum limit is 2 words'),
    body('slabdetail[3].targetStatus')
    .optional()
    .isIn([1, 0])
    .withMessage('Select proper target status'),
    body('slabdetail[3].target')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper target value for 4th Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('target maximum limit is 13 words'),
    body('slabdetail[3].reward')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper reward for 4th Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('reward maximum limit is 13 words'),

    body('slabdetail[4].operator_uuid')
    .optional()
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('slabdetail[4].commisionPercentage')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 5 })
    .withMessage('Enter proper commission percentage for 5th Operator'),
    body('slabdetail[4].targetStatus')
    .optional()
    .isIn([1, 0])
    .withMessage('Select proper target status'),
    body('slabdetail[4].target')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper target value for 5th Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('target maximum limit is 13 words'),
    body('slabdetail[4].reward')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper reward for 5th Operator')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('reward maximum limit is 13 words'),


    body("operatorsUuid1")
    .custom((value, { req }) => {
        var operators = []
        for (i = 1; i <= 5; i++) {
            if (req.body["operatorsUuid" + i] === undefined) continue
            if (operators.includes(req.body["operatorsUuid" + i])) return false
            if (req.body["operatorsUuid" + i] !== undefined) operators.push(req.body["operatorsUuid" + i])
        }
        return true
    }).withMessage('same operatorsUuid is entered multiple time'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.allSlabManagerName = [
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
    query('user_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
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

exports.getParentSlab = [
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
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be a string')
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

exports.agentSlabById = [ 
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('start')
    .exists()
    .withMessage('start is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('start should be number'),
    query('end')
    .exists()
    .withMessage('end is required')
    .matches(/^[0-9\s]+$/)
    .withMessage('should contain proper character 0-9')
    .isNumeric()
    .withMessage('end should be number'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be a string')
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

exports.getSlabManagerDetialsbyidSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('slab_uuid')
    .exists()
    .withMessage('slab_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('Select slab name from slab list'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateSlabManagerSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('slab_uuid')
    .exists()
    .withMessage('slab_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('slab_uuid maximum limit is 16 words'),
    body('operator_uuid')
    .exists()
    .withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid maximum limit is 16 words'),
    body('commisionPercentage')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper commission percentage ')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 5 })
    .withMessage('salamCommision maximum limit is 2 words'),
    body('targetStatus')
    .optional()
    .isIn([1, 0, 2, '1','0', '2'])
    .withMessage('Target Status should be 1, 0'),
    body('target')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper target value ')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('targetStatus maximum limit is 13 words'),
    body('reward')
    .optional()
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter proper reward value ')
    .isNumeric()
    .withMessage('should be number')
    .trim().isLength({ min: 1, max: 13 })
    .withMessage('target maximum limit is 13 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')

]

// validator for default slab

exports.createDefaultSlabSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .optional()
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid maximum limit is 16 words'),
    body('masterSlab')
    .exists()
    .withMessage('masterSlab is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('masterSlab maximum limit is 16 words'),
    body('distributorSlab')
    .exists()
    .withMessage('distributorSlab is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('distributorSlab maximum limit is 16 words'),
    body('masSubDistributorSlab')
    .exists()
    .withMessage('masSubDistributorSlab is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('masSubDistributorSlab maximum limit is 16 words'),
    body('SubDistributorSlab')
    .exists()
    .withMessage('SubDistributorSlab is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('SubDistributorSlab maximum limit is 16 words'),
    body('masRetailerSlab')
    .exists()
    .withMessage('masRetailerSlab is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('masRetailerSlab maximum limit is 16 words'),
    body('retailerSlab')
    .exists()
    .withMessage('retailerSlab is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('retailerSlab maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]
exports.getDefaultSlabSchema = [
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
exports.updateDefaultSlabSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('default_slab_uuid')
    .exists()
    .withMessage('default_slab_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('default_slab_uuid maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]