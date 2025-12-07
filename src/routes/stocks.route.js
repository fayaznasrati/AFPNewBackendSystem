const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const stocksController = require('../controllers/stock.controller')

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const { getAgentDetialsSchema, transferStockSchema,StockTransferReport,rejectStockRequest,
    modifyStockRequest,downlineStockTransferReport,createStockRequest,getRequestStatus,
    getImage,topStockRequestReport, stockRecievedReport
 } = require('../middleware/validators/stockValidator.middleware')

//multer decleration
let multer = require('multer')
const storage = multer.diskStorage({ 
    destination : function(req,file,cb){
        cb(null,'./src/uploads/stocks')
    },
    filename : function(req,file,cb){
        let fileName = new Date()
        cb(null , fileName.getFullYear().toString()+ '-'+ fileName.getMonth().toString() + '-'+ fileName.getDate().toString()+ '-'+ fileName.getHours().toString()+  '-'+fileName.getMinutes().toString()+  '-'+ fileName.getSeconds().toString()+  '-'+ file.originalname)
    }
})

const filterFilter = (req,file,cb) =>{
    // only image are allowed
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'){
        cb(null,true)
    }else{
        cb('imgage type should be .png, .jpeg',false)
    }
}

const upload = multer({
    storage : storage,
    limits : {
        fileSize : 1024 * 1024 * 5  // 1024 * 1024 * (5 bytes) = 5.24288 megabytes
    },
    fileFilter : filterFilter
})


router.get('/', getAgentDetialsSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,1], permission: apiMethod.view } , agent: { module: [6,1], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.getAgentDetials))
router.get('/download', getAgentDetialsSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,1], permission: apiMethod.view } , agent: { module: [6,1], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.downloadAgentDetials))
router.post('/', transferStockSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,1], permission: apiMethod.add } , agent: { module: [6,1], permission: apiMethod.add }}), awaitHandlerFactory(stocksController.transferStock))

router.get('/admin-transaction',StockTransferReport,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,2], permission: apiMethod.view } , agent: { module: [6,2], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.adminStockTransferReport))
router.get('/download-admin-transaction',StockTransferReport,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,2], permission: apiMethod.view } , agent: { module: [6,2], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.downloadAdminStockTransferReport))
router.get('/download-pdf-admin-transaction',StockTransferReport,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,2], permission: apiMethod.view } , agent: { module: [6,2], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.downloadPDFAdminStockTransferReport))
router.get('/admin-recieved',StockTransferReport,auth(1,2,3,4,5,6), accessManager({ agent: { module: [6,4], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.stockRecievedReport))
router.get('/agent-received',StockTransferReport,auth(1,2,3,4,5,6), accessManager({ agent: { module: [6,4], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.stockRecievedReport))
router.get('/agent-received-excel-download',StockTransferReport,auth(1,2,3,4,5,6), accessManager({ agent: { module: [6,4], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.downloadStockRecievedReport))
router.get('/agent-transaction',downlineStockTransferReport,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [3,3], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.downlineStockTransferReport))
router.get('/download-agent-transaction',downlineStockTransferReport,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [3,3], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.downloadDownlineStockTransferReport))
router.get('/download-pdf-agent-transaction',downlineStockTransferReport,auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [3,3], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.downloadPDFDownlineStockTransferReport))

router.get('/pending-request',StockTransferReport,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,4], permission: apiMethod.view } , agent: { module: [6,3], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.stocksRequests))
router.get('/download-pending-request',StockTransferReport,auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,4], permission: apiMethod.view } , agent: { module: [6,3], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.downloadPendingStocksRequests))
router.post('/accept-request',modifyStockRequest, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,4], permission: apiMethod.edit } , agent: { module: [6,3], permission: apiMethod.edit }}), awaitHandlerFactory(stocksController.acceptStockRequest))
router.post('/reject-request',rejectStockRequest, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [3,4], permission: apiMethod.edit } , agent: { module: [6,3], permission: apiMethod.edit }}), awaitHandlerFactory(stocksController.rejectStockRequest))
router.get('/request-report',StockTransferReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [3,5], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.stockRequestReport))
router.get('/download-request-report',StockTransferReport, auth(role.Admin,role.SubAdmin), accessManager({subAdmin : { module: [3,5], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.dwonloadStockRequestReport))

router.post('/request', createStockRequest, auth(1,2,3,4,5,6), accessManager({agent: { module: [7,1], permission: apiMethod.add }}), awaitHandlerFactory(stocksController.createStockRequest))
router.get('/request', getRequestStatus, auth(1,2,3,4,5,6), accessManager({agent: { module: [7,2], permission: apiMethod.view }}), awaitHandlerFactory(stocksController.getRequestStatus))

// router.post('/image', upload.single("recfile"), awaitHandlerFactory(stocksController.saveImage))
router.get('/image/:key',getImage, awaitHandlerFactory(stocksController.getImage))

// top stock request
router.get('/top-agent/report',topStockRequestReport, auth(), awaitHandlerFactory(stocksController.topStockRequestReport))

module.exports = router;