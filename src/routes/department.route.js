const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const departmentController = require('../controllers/department.controller')

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const {allDepartment,createDepartment,updateDepartment,deleteDepartment} = require('../middleware/validators/departmentValidators.middleware')

//department apis
router.get('/', allDepartment, awaitHandlerFactory(departmentController.allDepartment));
router.get('/download', allDepartment, awaitHandlerFactory(departmentController.downloadDepartments));
router.get('/id', allDepartment, awaitHandlerFactory(departmentController.getDepartmentById));
router.post('/', createDepartment, auth(role.Admin), awaitHandlerFactory(departmentController.createDepartment));
router.patch('/', updateDepartment, auth(role.Admin), awaitHandlerFactory(departmentController.updateDepartment));
router.delete('/', deleteDepartment, auth(role.Admin), awaitHandlerFactory(departmentController.deleteDepartment));

module.exports = router;