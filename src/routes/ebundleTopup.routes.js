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

// router.get(
//   "/eBundleTypes/id", // Add leading slash
//   auth(1,2,3,4,5,6),
//   awaitHandlerFactory(ebundleController.getEbundleType)
// );

// router.post(
//   "/create-bundle", // Add leading slash
//   auth(1,2,3,4,5,6),
//   awaitHandlerFactory(ebundleController.createEbundle)
// );

router.post("/create-bundle", ebundleController.createEbundle);
router.get("/bundles", ebundleController.getEbundle);
router.get("/bundles-filter", ebundleController.filterEbundle);

router.get("/bundles/id", ebundleController.getEbundleById);
router.put("/bundles/id", ebundleController.updateBundle);
router.delete("/bundles/id", ebundleController.deleteBundle); 

// Agent Type APIs
// router.get('/type', allTypeSchema, auth(), awaitHandlerFactory(agentController.allType));
// router.post('/type', createTypeSchema, auth(role.Admin), awaitHandlerFactory(agentController.createType));
// router.put('/type', updateTypeSchema, auth(role.Admin), awaitHandlerFactory(agentController.updateType));
// router.delete('/type', deleteTypeSchema, auth(role.Admin), awaitHandlerFactory(agentController.deleteType));
// router.get('/type/userid', getLowerAgentType, auth(), awaitHandlerFactory(agentController.getLowerAgentType));

// //API to get agent by agent type id
// router.get('/by-agent-type',getAgentByAgentType, auth(), awaitHandlerFactory(agentController.getAgentByAgentType))

// //Agent login
// router.post('/login',agentLogin,awaitHandlerFactory(agentLoginFun.agentLogin))
// router.post('/logout',getDetails, auth(1,2,3,4,5,6), awaitHandlerFactory(agentLoginFun.logout))
// router.get('/details',getDetails, auth(1,2,3,4,5,6), forceLogOutCheck(), awaitHandlerFactory(agentLoginFun.getDetails))
// router.put('/details',updateAgentDetails,auth(1,2,3,4,5,6), awaitHandlerFactory(agentLoginFun.updateAgentDetails))
// router.put('/password',changePassword,auth(1,2,3,4,5,6),awaitHandlerFactory(agentLoginFun.changePassword))

// //API related to Agent contact details
// router.get('/contact',getDetails,auth(1,2,3,4,5,6), awaitHandlerFactory(agentLoginFun.getContactDetails))
// router.post('/contact',addContactNumber,auth(1,2,3,4,5,6), awaitHandlerFactory(agentLoginFun.addContactNumber))
// router.put('/contact',updateContactNumber,auth(1,2,3,4,5,6),awaitHandlerFactory(agentLoginFun.updateContactNumber))

// //api to get and upadte m-pin
// router.get('/pin',getDetails,auth(1,2,3,4,5,6), awaitHandlerFactory(agentLoginFun.getpin))
// router.put('/pin',updatPin,auth(1,2,3,4,5,6),awaitHandlerFactory(agentLoginFun.updatPin))

// // API for forget password
// router.post('/forgot-password',forgetSendPassword,awaitHandlerFactory(agentLoginFun.forgetSendPassword))

// // API related to profile Image
// // router.post('/profile_image/', upload.single("recfile"), updateImage, auth(), awaitHandlerFactory(agentLoginFun.updateImage))
// router.get('/profile_image/', getDetails, auth(), awaitHandlerFactory(agentLoginFun.getImage))

module.exports = router;
