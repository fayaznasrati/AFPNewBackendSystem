const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const awaitHandlerFactory = require("../middleware/awaitHandlerFactory.middleware");
const forceLogOutCheck = require("../middleware/forceLogoutCheck.middleware");

const agentController = require("../controllers/agent.controller");
const ebundleController = require("../controllers/ebundle.controller");
const agentLoginFun = require("../controllers/agentLoginFun.controller");

const apiMethod = require("../utils/apiMethod.utils");
const role = require("../utils/userRoles.utils");

//multer decleration
let multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./src/uploads/profile");
  },
  filename: function (req, file, cb) {
    let fileName = new Date();
    cb(
      null,
      fileName.getFullYear().toString() +
        "-" +
        fileName.getMonth().toString() +
        "-" +
        fileName.getDate().toString() +
        "-" +
        fileName.getHours().toString() +
        "-" +
        fileName.getMinutes().toString() +
        "-" +
        fileName.getSeconds().toString() +
        "-" +
        file.originalname
    );
  },
});

const filterFilter = (req, file, cb) => {
  // only image are allowed
  if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb("imgage type should be .png, .jpeg", false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: filterFilter,
});

const {
  agentLogin,
  getDetails,
  updateAgentDetails,
  changePassword,
  addContactNumber,
  updateContactNumber,
  updatPin,
  forgetSendPassword,
  updateImage,
} = require("../middleware/validators/agentLoginFunValidators.middleware");

const {
  allTypeSchema,
  createTypeSchema,
  updateTypeSchema,
  deleteTypeSchema,
  getAgentByAgentType,
  getLowerAgentType,
} = require("../middleware/validators/agentValidator.middleware");



router.post("/create-bundle", ebundleController.createEbundle);
router.get("/bundles", ebundleController.getEbundle);
router.get("/bundles-filter", ebundleController.filterEbundle);

router.get("/bundles/id", ebundleController.getEbundleById);
router.put("/bundles/id", ebundleController.updateBundle);
router.delete("/bundles/id", ebundleController.deleteBundle); 

// Agent Type APIs
// router.get('/type', allTypeSchema, auth(), awaitHandlerFactory(agentController.allType));
// router.post('/type', createTypeSchema, auth(role.Admin), awaitHandlerFactory(agentController.createType));

// //Agent login

// router.put('/details',updateAgentDetails,auth(1,2,3,4,5,6), awaitHandlerFactory(agentLoginFun.updateAgentDetails))

module.exports = router;
