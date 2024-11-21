const { body, query } = require('express-validator');

exports.createLoginSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('name')
    .exists()
    .withMessage('Please enter a proper Name')
    .isString()
    .withMessage('Name should be a string')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Only characters are allowed in full name')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('Name allowed length is 3-50 characters'),
    body('email')
    .optional({nullable: true})
    .isString()
    .withMessage('enter a proper email address')
    .isEmail()
    .optional({nullable: true})
    .withMessage('enter a proper email address')
    .trim().isLength({ min: 3, max: 50 })
    .optional({nullable: true})
    .withMessage('Allowed email length is 3-50 characters'),
    body('password')
    .optional()
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter proper password')
    .trim().isLength({ min: 3, max: 150 })
    .withMessage('email  maximum limit is 150 words'),
    body('gender')
    .optional()
    .isIn([1,2, 0,null]).withMessage('value should be 1 for Male, 2 for Female, 3 for Other or Null'),
    // body('mobile')
    // .exists()
    // .withMessage('mobile is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('start should be number')
    // .isLength({ min: 10, max: 20 })
    // .withMessage('mobile  maximum limit is 20 words'),
    body('address')
    .exists()
    .withMessage('address is required')
    .isString()
    .withMessage('should be a string')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter proper Address')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('Allowed address length is 3-100 characters'),
    body('shopName')
    .exists()
    .withMessage('shopName is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('Allowed shop name length is 3-100 characters'),
    body('parent_uuid')
    .optional(),
    body('region_uuid')
    .exists()
    .withMessage('Select a proper Region')
    .isString()
    .withMessage('Select a proper Region')
    .trim().isLength({ min: 3, max: 16 })
    .withMessage('Select a proper Region'),
    body('regionName')
    .exists()
    .withMessage('Select a proper Region')
    .isString()
    .withMessage('Select a proper Region')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('Select a proper Region'),
    body('agent_type_uuid')
    .exists()
    .withMessage('Select a proper Agent Type')
    .isString()
    .withMessage('Select a proper Agent Type')
    .trim().isLength({ min: 3, max: 16 })
    .withMessage('Select a proper Agent Type'),
    body('country_uuid')
    .exists()
    .withMessage('Select a proper Country')
    .isString()
    .withMessage('Select a proper Country')
    .trim().isLength({ min: 3, max: 16 })
    .withMessage('Select a proper Country'),
    body('countryName')
    .exists()
    .withMessage('Select a proper Country')
    .isString()
    .withMessage('Select a proper Country')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('Select a proper Country'),
    body('province_uuid')
    .exists()
    .withMessage('Select a proper Province')
    .isString()
    .withMessage('Select a proper Province')
    .trim().isLength({ min: 3, max: 16 })
    .withMessage('Select a proper Province'),
    body('provienceName')
    .exists()
    .withMessage('Select a proper Province')
    .isString()
    .withMessage('Select a proper Province')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('Select a proper Province'),
    body('district_uuid')
    .exists()
    .withMessage('Select a proper District')
    .isString()
    .withMessage('Select a proper District')
    .trim().isLength({ min: 3, max: 16 })
    .withMessage('Select a proper District'),
    body('districtName')
    .exists()
    .withMessage('Select a proper District')
    .isString()
    .withMessage('Select a proper District')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('Select a proper District'),
    body('lang_uuid')
    .exists()
    .withMessage('Select a proper language')
    .isString()
    .withMessage('Select a proper language')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('Select a proper language'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.addMpinSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists().withMessage('user_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('status')
    .optional()
    .isIn([1, 0])
    .withMessage('status must be 1,0'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getDetialsSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 5, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updateAgentDetialsSchema = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 5, max: 50 })
    .withMessage('username minimum limit is 5 and maximum limit is 50 words'),
    body('user_uuid')
    .exists().withMessage('Select and agent to update details')
    .isString()
    .withMessage('Select and agent to update details')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('Selected agent is not proper'),
    body('name')
    .exists()
    .withMessage('Enter proper name')
    .isString()
    .withMessage('Enter proper name')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Enter proper name')
    .trim().isLength({ min: 3, max: 50 })
    .withMessage('Name allowed length is 3-50 characters'),
    body('email')
    .optional({nullable: true})
    .isEmail()
    .optional({nullable: true})
    .withMessage('enter a proper email address')
    .isString()
    .optional({nullable: true})
    .withMessage('enter a proper email address')
    .trim().isLength({ min: 3, max: 50 })
    .optional({nullable: true})
    .withMessage('Allow email length is 3-50 characters'),
    body('gender')
    .optional(),
    // body('mobile')
    // .optional()
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('start should be number')
    // .isLength({ min: 10, max: 20 })
    // .withMessage('mobile  maximum limit is 20 words'),
    body('address')
    .exists()
    .withMessage('Enter proper address')
    .isString()
    .withMessage('Enter proper address')
    .custom(val => {
        var inval = val
        val = val.split(' ')
        if (val.length >= inval.length) return false
        return true
    }).withMessage('Enter proper Address')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('Allowed address length is 3-100 characters'),
    body('shopName')
    .exists()
    .withMessage('Shop name is required')
    .isString()
    .withMessage('Shop name is required')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('Allowed shop name length is 3-100 characters'),
    // body('agent_type_uuid')
    // .exists()
    // .withMessage('it is required')
    // .isString()
    // .withMessage('should be a string')
    // .isLength({ min: 3, max: 16 })
    // .withMessage('agent_type_uuid  maximum limit is 16 words'),
    body('province_uuid')
    .exists()
    .withMessage('Select a proper Province')
    .isString()
    .withMessage('Select a proper Province')
    .trim().isLength({ min: 3, max: 16 })
    .withMessage('Select a proper Province')
    .custom((val, { req }) => {
        if (req.body.provienceName === undefined) return false
        return true
    }).withMessage('Select a proper Province'),
    body('provienceName')
    .exists()
    .withMessage('Select a proper Province')
    .isString()
    .withMessage('Select a proper Province')
    .trim().isLength({ min: 3, max: 500 })
    .withMessage('Select a proper Province'),
    body('district_uuid')
    .exists()
    .withMessage('Select a proper District')
    .isString()
    .withMessage('Select a proper District')
    .trim().isLength({ min: 3, max: 16 })
    .withMessage('Select a proper District')
    .custom((val, { req }) => {
        if (req.body.districtName === undefined) return false
        return true
    }).withMessage('Select a proper District'),
    body('districtName')
    .exists()
    .withMessage('Select a proper District')
    .isString()
    .trim().isLength({ min: 3, max: 500 })
    .withMessage('Select a proper District'),
    body('lang_uuid')
    .optional({nullable: true})
    .isString().optional({nullable: true}).withMessage('Select a proper language')
    .trim().isLength({ min: 3, max: 16 }).optional({nullable: true}).withMessage('Select a proper language'),
    body()
    .custom(value => {
        if (value.user_uuid === undefined) return Object.keys(value).length >= 1;
        return Object.keys(value).length >= 2;
    })
    .withMessage('Select a proper language'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getCommisionType = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists().withMessage('user uuid is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getAllAgent = [
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

exports.changeAgentActiveState = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists().withMessage("user_uuid is required")
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getParentName = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('region_uuid')
    .optional({nullable: true})
    .trim().isLength({ min: 16, max:16}).optional({nullable: true}).withMessage('region_uuid have 16 character'),
    // query('start')
    // .exists()
    // .withMessage('start is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('should be a number'),
    // query('end')
    // .exists()
    // .withMessage('end is required')
    // .matches(/^[0-9\s]+$/)
    // .withMessage('should contain proper character 0-9')
    // .isNumeric()
    // .withMessage('should be a number'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')

]

exports.advanceSearch = [
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

exports.getUplineAgentList = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('agentUuid')
    .exists().withMessage('agent id is required')
    .trim().isLength({ min: 16, max: 16 }).withMessage('agent is in not proper'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.PostPaidCommision = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists().withMessage("user_uuid is required")
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('slab_uuid')
    .exists().withMessage("user_uuid is required")
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('slab_uuid  maximum limit is 16 words'),
    body('slabName')
    .exists().withMessage("slabName is required")
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('slab_uuid  maximum limit is 100 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.updatePrePaidCommission = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('commissionValue')
    .exists()
    .withMessage('commissionValue is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter a valid comission value'),

    body('commisionList[0].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[0].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[0].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('commisionList[1].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[1].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[1].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('commisionList[2].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[2].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[2].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('commisionList[3].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[3].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[3].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('commisionList[4].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[4].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[4].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.addPrePaidCommission = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('commissionValue')
    .exists()
    .withMessage('commissionValue is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('Enter a valid commission value'),

    body('commisionList[0].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[0].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[0].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('commisionList[1].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[1].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[1].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('commisionList[2].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[2].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[2].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('commisionList[3].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[3].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[3].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('commisionList[4].operator_uuid')
    .exists().withMessage('operator_uuid is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('operator_uuid should be of  16 words'),
    body('commisionList[4].limit')
    .exists().withMessage('limit is required')
    .matches(/^[0-9.\s]+$/)
    .withMessage('should contain proper character 0-9 .')
    .isNumeric()
    .withMessage('start should be number')
    .trim().isLength({ min: 1, max: 10 })
    .withMessage('limit maximum limit is 10 length'),
    body('commisionList[4].active')
    .exists().withMessage('active status is required')
    .isIn([1, 0])
    .withMessage('active should be 1, 0'),

    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.verifyAgentUserUuid = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists().withMessage("user_uuid is required")
    .isString()
    .withMessage('should be a string')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.agentForceLogout = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('agent_uuid')
    .exists()
    .withMessage('agent_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.addPrePaidas1stTran = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getSlabList =[
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.addAutoGenNumber = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    body('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.deleteAlternateNumber = [
    query('username')
    .exists()
    .withMessage('username is required')
    .isString()
    .withMessage('should be string')
    .trim().isLength({ min: 1, max: 50 })
    .withMessage('username maximum limit is 50 words'),
    query('user_uuid')
    .exists()
    .withMessage('user_uuid is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('user_uuid  maximum limit is 16 words'),
    query('agent_contact_uuid')
    .exists()
    .withMessage('agent contact id is required')
    .trim().isLength({ min: 16, max: 16 })
    .withMessage('agent contact id  maximum limit is 16 words'),
    body('user_detials')
    .custom(value => {
        if (value === undefined) {
            return true
        }
        return false
    })
    .withMessage('wrong request')
]

exports.getForceLogoutStatus = [
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