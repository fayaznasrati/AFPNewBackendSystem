const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const ticketController = require('../controllers/ticket.controller');

const apiMethod = require('../utils/apiMethod.utils');
const role = require('../utils/userRoles.utils');
const accessManager = require('../middleware/acessManager.middleware');

const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');

const {
    createTicketCategorySchema,updateTicketCategorySchema,allTicketCategorySchema,deleteTicketCategorySchema,
    createTicketSchema,allTicketSchema,specificTicketSchema,updateTicketSchema,deleteTicketSchema,allTicketmessageSchema,
    specificTicketmessageSchema,createTicketmessageSchema,createTicketMessage,getImage,getDownlineTicket
} = require('../middleware/validators/tickieValidator.middleware');

//multer decleration
let multer = require('multer')
const storage = multer.diskStorage({ 
    destination : function(req,file,cb){
        cb(null,'./src/uploads/tickets')
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
        fileSize : 1024 * 1024 * 5
    },
    fileFilter : filterFilter
})

function uploadFile(req, res, next) {
    const upload = multer(
        {
            storage : storage,
            limits : {
                fileSize : 1024 * 1024 * 5
            },
            fileFilter : filterFilter
        }
    ).single('recfile');

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).send({ errors: [ {msg : err}] })
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).send({ errors: [ {msg : err}] })
        }
        // Everything went fine. 
        next()
    })
}

// ticket category APIs
router.get('/category', allTicketCategorySchema, awaitHandlerFactory(ticketController.allTicketCategory));
router.post('/category', createTicketCategorySchema, auth(role.Admin), awaitHandlerFactory(ticketController.createTicketCategory));
router.put('/category', updateTicketCategorySchema, auth(role.Admin), awaitHandlerFactory(ticketController.updateTicketCategory));
router.delete('/category', deleteTicketCategorySchema, auth(role.Admin), awaitHandlerFactory(ticketController.deleteTicketCategory));

// ticket apis
router.get('/', allTicketSchema, auth(role.Admin), awaitHandlerFactory(ticketController.allTicket));
router.get('/specific', specificTicketSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [8,1], permission: apiMethod.view } , agent: { module: [9,2], permission: apiMethod.view }}), awaitHandlerFactory(ticketController.findTicket));
router.post('/', createTicketSchema, auth(role.Admin), awaitHandlerFactory(ticketController.createTicket));
router.put('/', updateTicketSchema, auth(role.Admin), awaitHandlerFactory(ticketController.updateTicket));
router.delete('/', deleteTicketSchema, auth(role.Admin), awaitHandlerFactory(ticketController.deleteTicket));

// ticket message
router.get('/message', allTicketmessageSchema, auth(role.Admin), awaitHandlerFactory(ticketController.allTicketmessage))
router.get('/message/id', specificTicketmessageSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [8,2], permission: apiMethod.view } , agent: { module: [9,4], permission: apiMethod.view }}), awaitHandlerFactory(ticketController.findOneTicketmessage))
router.post('/message', createTicketmessageSchema, auth(role.Admin,role.SubAdmin,1,2,3,4,5,6), accessManager({subAdmin : { module: [8,2], permission: apiMethod.add } , agent: { module: [9,4], permission: apiMethod.add }}), awaitHandlerFactory(ticketController.createTicketmessage))

// create tick and add message
router.post('/ticket-message', createTicketMessage, auth(1,2,3,4,5,6), accessManager({agent: { module: [9,1], permission: apiMethod.add }}), awaitHandlerFactory(ticketController.createTicketMessage))

//image related routes
// router.post('/image',uploadFile, awaitHandlerFactory(ticketController.saveImage))
router.get('/image',getImage, awaitHandlerFactory(ticketController.getImage))

//search downline member
router.get('/downline',getDownlineTicket, auth(1,2,3,4,5,6),  accessManager({agent: { module: [9,3], permission: apiMethod.view }}), awaitHandlerFactory(ticketController.getDownlineTicket))

module.exports = router;