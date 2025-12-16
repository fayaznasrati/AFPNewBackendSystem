const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const redisMaster = require('../common/master/radisMaster.common');
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const role = require('../utils/userRoles.utils')

const dotenv = require('dotenv');
const path = require('path');

const ticketModule = require('../models/ticket.module')

// const { toIsoString } = require('../common/timeFunction.common')

// configer env
dotenv.config()

const awsURL = process.env.AWS_path
const awsCommon = require('../common/awsS3.common')

const fs = require('fs')

class ticketController {
    // table names
    tableName1 = 'er_ticket_category';
    tableName2 = 'er_tickets';
    tableName3 = 'er_ticket_message';
    tableName4 = 'er_login'

    //function to create tickit category
    createTicketCategory = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('ticket/createTicketCategory',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // variable for sql query to create tickit category
            var param = {
                    ticket_category_uuid: "uuid()",
                    ticket_category_name: req.body.name, //str category_name
                    created_on: isodate, //dt current date time
                    created_by: req.body.user_detials.id, // str user_id
                    last_modified_by: req.body.user_detials.id, // str user_id
                    last_modified_on: isodate //dt current date time
                }
                // fire sql query to create tickit category
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'ticket category successfully created!' });

            // delete ticket category form redis server
            redisMaster.delete("ticketCategory")

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to display all tickit category
    allTicketCategory = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('ticket/allTicketCategory',JSON.stringify(req.body), JSON.stringify(req.query))
            // get the tickit category for the redis server
            redisMaster.get('ticketCategory', async(err, reply) => {

                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    //no data in redis, get the data from sql  and add to radis
                    //variable for sqlQuery to get tickit category
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    var searchKeyValue = {
                        active: 1,
                    }
                    var key = ["CAST(ticket_category_uuid AS CHAR(16)) AS ticket_category_uuid", "ticket_category_name AS name"]
                    var orderby = "ticket_category_name"
                    var ordertype = "ASC"

                    // fire sql query to get str ticket_category_uuid, str ticket_category_name
                    const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (!lisResults) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (lisResults.length === 0) {
                        return res.status(204).send({ message: 'Ticket category not found' })
                    }

                    // change the json data to string and add to redis server
                    const strResponse = JSON.stringify(lisResults)
                    redisMaster.post('ticketCategory', strResponse)

                    //send responce to frontend
                    return res.status(200).send(lisResults)
                }
                //redis have the data, convet the data to json and send it to front end
                res.status(200).send(JSON.parse(reply))
            })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update the ticket category
    updateTicketCategory = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('ticket/UpdateTicketCategory',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to update tickit category
            var param = {
                ticket_category_name: req.body.name, //str tickit_category_name
                last_modified_by: req.body.user_detials.id, //str user_id
                last_modified_on: isodate //dt current date time
            }
            var searchKeyValue = {
                ticket_category_uuid: req.body.ticket_category_uuid, //str ticket_category_uuid
                active: 1
            }

            //fire sql query to update tickit category
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'ticket category not found' :
                affectedRows && changedRows ? 'ticket category updated successfully' : 'Details Updated';
            res.send({ message, info });

            //delete data from resid server
            redisMaster.delete("ticketCategory")

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to delete -> active status change for tickit category
    deleteTicketCategory = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('ticket/deleteTicketCategory',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to change active status
            const param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user_id
                active: 0
            }
            var searchKeyValue = {
                ticket_category_uuid: req.query.ticket_category_uuid, // str ticket_category uuid
                active: 1
            }

            // fire sql query to change the active status
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'ticket category not found' :
                affectedRows && changedRows ? 'ticket category delete successfully' : 'delete faild, allready deleted';

            res.send({ message, info });

            // delete data from redis
            redisMaster.delete("ticketCategory")

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //############################################################################################
    // function to create tickit 
    createTicket = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('ticket/createTicket',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to check the tickit category
            var searchKeyValue = {
                ticket_category_uuid: req.body.ticket_category_uuid,
                active: 1,
            }
            var key = ["ticket_category_id", "ticket_category_name"]
            var orderby = "ticket_category_name"
            var ordertype = "ASC"

            // fire sql query to get str ticket_category_id, str ticket_category_name
            const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // check if the result is there and responce accordingly
            if (!lisResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponce.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'ticket category not found'}] });
            }

            // ??????????? ticket_status_id is not verified from the bd

            var date_d = date

            //variable for sql query to create tickit
            const strDateDisplayId = pad2(date_d.getDate()) + pad2(date_d.getMonth() + 1) + date_d.getFullYear() + pad2(date_d.getHours()) + pad2(date_d.getMinutes()) + pad2(date_d.getSeconds())

            var param = {
                ticket_disp_id: strDateDisplayId, //str display id
                ticket_category_id: lisResponce[0].ticket_category_id, //str display category id
                ticket_category_name: lisResponce[0].ticket_category_name, //str display category name
                ticket_subject: req.body.subject, //str display subject
                ticket_status_name: req.body.ticket_status, //str display status
                created_on: isodate, //dt current date time
                last_modified_on: isodate //dt current date time
            }

            // fire sql query to create tickit
            const objResult = await sqlQuery.createQuery(this.tableName2, param)
                // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'ticket successfully created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get allTicket
    allTicket = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('ticket/allTicket',JSON.stringify(req.body), JSON.stringify(req.query))
            //variable for sql query to update tickit
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                active: 1,
            }
            if (req.query.startDate) searchKeyValue.start_date = req.query.startDate;
            if (req.query.endDate) searchKeyValue.end_date = req.query.endDate;
            if (req.query.ticketId) searchKeyValue.ticket_disp_id = req.query.ticketId;
            if (req.query.status) searchKeyValue.ticket_status_name = req.query.status;
            if(req.query.category) searchKeyValue.ticket_category_name = req.query.category;

            var key = ["ticket_disp_id", "ticket_category_name AS name", "ticket_subject AS subject", "ticket_status_name AS status", "CAST(created_on AS CHAR(20)) AS created", "last_modified_on AS modified"]
            var orderby = "created_on"
            var ordertype = "DESC"

            // fire sql query to get str tickit_disp_id, str ticket_category_name, str ticket_subject, str ticket_status_name, dt created_on, dt last_modified_on
            const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResults) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResults.length === 0) {
                return res.status(204).send({ message: 'tick not found' })
            }
            res.status(200).send(lisResults)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get ticki details by id
    findTicket = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('ticket/findTicket',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            //variables for sql query to get ticki details
            var searchKeyValue = {}

            if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

            if (req.query.start_date) searchKeyValue.start_date = req.query.start_date
            if (req.query.end_date) searchKeyValue.end_date = req.query.end_date
            if (req.query.ticket_disp_id) searchKeyValue.ticket_disp_id = req.query.ticket_disp_id
            if (req.query.statusName) searchKeyValue.ticket_status_name = req.query.statusName
            if (req.query.categoryName) searchKeyValue.ticket_category_name = req.query.categoryName

            if (Object.keys(searchKeyValue).length === 0) return res.status(400).json({ errors: [ {msg : 'Search parameter dont have proper value'}] });

            if(!(req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin)) {
                searchKeyValue.created_by_type = ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2
                searchKeyValue.created_by_id = ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid
            }

            // const { start, end } = req.query
            // var offset = start
            // var limit = end - offset
            var key = ["ticket_disp_id", "ticket_category_name AS name", "ticket_subject AS subject", "ticket_status_name AS status", "CAST(created_on AS CHAR(20)) AS created", "last_modified_on AS modified"]
            var orderby = "created_on"
            var ordertype = "DESC"

            const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, ['COUNT(1) AS count'], orderby, ordertype)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // fire sql query to search
            const lisResults = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, limit, offset)

            // check if the result is there and responce accordingly
            // if (!lisResults) {
            //     throw new HttpException(500, 'Something went wrong');
            // }
            // if (lisResults.length === 0) {
            //     return res.status(204).send({ message: 'ticket not found' })
            // }
            // res.status(200).send(lisResults)

            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisResults)
            }else{
                res.status(200).send({
                    reportList : lisResults,
                    totalRepords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
            }

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update tickit
    updateTicket = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('ticket/updateTicket',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to update tickit
            var param = {
                last_modified_on: isodate //dt current date time
            }

            // optional update variables
            if (req.body.ticket_category_uuid) {
                //variable for sql query to check tickit category
                var searchKeyValue = {
                    ticket_category_uuid: req.body.ticket_category_uuid, //str ticket_category_uuid
                    active: 1,
                }
                var key = ["ticket_category_id", "ticket_category_name"]
                var orderby = "ticket_category_name"
                var ordertype = "ASC"

                //field sql query to get str ticket_category_id, str ticket_category_name
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

                // check if the result is there and responce accordingly
                if (!lisResponce) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (lisResponce.length === 0) {
                    return res.status(400).json({ errors: [ {msg : "ticket category not found"}] });
                }
                //update the param
                param.ticket_category_id = lisResponce[0].ticket_category_id //str ticket_category_id
                param.ticket_category_name = lisResponce[0].ticket_category_name //str ticket_category_name
            }

            if (req.body.subject) {
                param.ticket_subject = req.body.subject
            }
            if (req.body.ticket_status_uuid) {
                param.ticket_status_id = req.body.ticket_status_uuid
                param.ticket_status_name = req.body.status
            }

            // check if the update request is proper or not
            if (Object.keys(param).length === 1) return res.status(400).json({ errors: [ {msg : 'improper update request'}] });

            var searchKeyValue = {
                ticket_disp_id: req.body.ticket_disp_id,
                active: 1
            }

            //sql query to update ticket
            const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'ticket not found' :
                affectedRows && changedRows ? 'ticket updated successfully' : 'Details Updated';
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to delete -> update the ticket status
    deleteTicket = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('ticket/deleteTicket',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query to to update the ticket
            const param = {
                last_modified_on: isodate, // dt current date time
                active: 0
            }
            var searchKeyValue = {
                ticket_disp_id: req.query.ticket_disp_id, //str ticket_category_id
                active: 1
            }

            // fire sql query to update the ticket
            const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'ticket not found' :
                affectedRows && changedRows ? 'ticket delete successfully' : 'delete faild, allready deleted';
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // #############################################################################################
    //function to create tickit message
    createTicketmessage = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('ticket/createTicketMessage',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to search tickit
            var searchKeyValue = {
                ticket_disp_id: req.body.ticket_disp_id, //str ticket_disp_id
                active: 1,
            }
            var key = ["ticket_id"]
            var orderby = "ticket_id"
            var ordertype = "ASC"

            //sql query to search tickit message
            const objResponce = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 100, 0)

            // check if the result is there and responce accordingly
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (objResponce.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'ticket not found'}] });
            }

            var date_d = date

            // console.log(req.body.user_detials)

            //variable for sqlQuery to cate tickit message
            const strDateDisplayId = pad2(date_d.getDate()) + pad2(date_d.getMonth() + 1) + date_d.getFullYear() + pad2(date_d.getHours()) + pad2(date_d.getMinutes()) + pad2(date_d.getSeconds())
            var param = {
                ticket_id: objResponce[0].ticket_id,
                ticket_message_disp_id: strDateDisplayId,
                ticket_disp_id: req.body.ticket_disp_id,
                ticket_message: req.body.message,
                created_by_type: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                created_by_id: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
                created_by_name: req.body.user_detials.name,
                created_on: isodate
            }
            // optional image attachment
            if(req.body.filename) {
                param.er_ticket_attachment = req.body.filename
            }

            // fire sql query to create tickit message
            const objResult = await sqlQuery.createQuery(this.tableName3, param)

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'ticket message successfully created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get all tickit category message 
    allTicketmessage = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('ticket/allTicketMessage',JSON.stringify(req.body), JSON.stringify(req.query))
            //variable for sql query to 
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var key = ["ticket_message_disp_id", "ticket_message AS message"]
            var orderby = "created_on"
            var ordertype = "DESC"

            //fire sql query to get str ticket_message_disp_id, str ticket_message
            const lisResults = await sqlQueryReplica.searchQueryNoConNolimit(this.tableName3, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResults) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResults.length === 0) {
                return res.status(204).send({ message: 'Ticket message not found' });
            }
            res.status(200).send(lisResults)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to find tickit message
    findOneTicketmessage = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('ticket/findOneTicketMessage',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            var searchKeyValue = {
                ticket_disp_id: req.query.ticket_disp_id, 
                active: 1
            };
            var key = ["ticket_disp_id", "ticket_category_name AS categoryName", "ticket_subject AS subject", "CAST(created_on AS CHAR(20)) AS created","ticket_id"]
            var orderby = "created_on"
            var ordertype = "DESC"

            // fire sql query to search
            const lisResponce = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // console.log(lisResponce)
            if(lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'Ticket not found'}]})

            //variable for sql query to search
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                ticket_id: lisResponce[0].ticket_id
            }

            var key = ["ticket_message_disp_id AS messageId", "ticket_message AS message","created_by_name AS userName","CAST(created_on AS CHAR(20)) as dateTime","er_ticket_attachment AS imageAttachment"]
            var orderby = "created_on"
            var ordertype = "DESC"

            const lisTotalRecords = await sqlQueryReplica.searchQueryNoLimit(this.tableName3, searchKeyValue, ['COUNT(1) AS count'], orderby, ordertype)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // fire sql query to get str ticket_message_disp_id, str ticket_message
            const lisResults = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, limit, offset)

            // check if the result is there and responce accordingly
            if (!lisResults) {
                throw new HttpException(500, 'Something went wrong');
            }

            var finalLisResults = lisResults.map((result)=>{
                let {imageAttachment,...other} = result
                other.imageAttachment = imageAttachment ? (imageAttachment.includes(awsURL) ? imageAttachment.replace(awsURL,'') : imageAttachment) : null
                return other
            })

            lisResponce[0].messageList = finalLisResults //.length == 0 ? "No message list" : finalLisResults

            var {ticket_id,...other} = lisResponce[0]

            res.status(200).send({
                ...other,
                totalRepords : intTotlaRecords,
                pageCount : intPageCount,
                currentPage : Number(req.query.pageNumber),
                pageLimit : Number(process.env.PER_PAGE_COUNT)

            })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to create ticket and message 
    createTicketMessage = async (req, res, next) =>{
        try{
            // check body and query in req
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                 //  console.log('ticket/createTicketMessage',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // check category 
                //variable for sql query to check the tickit category
                var searchKeyValue = {
                    ticket_category_uuid: req.body.ticket_category_uuid,
                    active: 1,
                }
                var key = ["ticket_category_id", "ticket_category_name"]
                var orderby = "ticket_category_name"
                var ordertype = "ASC"

                // fire sql query to get str ticket_category_id, str ticket_category_name
                const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

                if (lisResponce1.length === 0) {
                    return res.status(400).json({ errors: [ {msg : 'ticket category not found'}] });
                }

            // add subjaect and category in tickt list
                var date_d = date

                //variable for sql query to create tickit
                const strDateDisplayId = pad2(date_d.getDate()) + pad2(date_d.getMonth() + 1) + date_d.getFullYear() + pad2(date_d.getHours()) + pad2(date_d.getMinutes()) + pad2(date_d.getSeconds())

                var param = {
                    ticket_disp_id: strDateDisplayId, //str display id
                    ticket_category_id: lisResponce1[0].ticket_category_id, //str display category id
                    ticket_category_name: lisResponce1[0].ticket_category_name, //str display category name
                    ticket_subject: req.body.subject, //str display subject
                    created_by_type: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                    created_by_id: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
                    created_on: isodate, //dt current date time
                    last_modified_on: isodate //dt current date time
                }

                // fire sql query to create tickit
                const objResponce2 = await sqlQuery.createQuery(this.tableName2, param)
                // console.log(objResponce2)
            
            // add message and if attachment (image) name is provided then add image with it
                var date_d = date

                //variable for sqlQuery to cate tickit message
                const strDateMessageDisplayId = pad2(date_d.getDate()) + pad2(date_d.getMonth() + 1) + date_d.getFullYear() + pad2(date_d.getHours()) + pad2(date_d.getMinutes()) + pad2(date_d.getSeconds())
                var param = {
                    ticket_id: objResponce2.insertId,
                    ticket_message_disp_id: strDateMessageDisplayId,
                    ticket_disp_id: strDateDisplayId,
                    ticket_message: req.body.message,
                    created_by_type: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? 1 : 2,
                    created_by_id: ( req.body.user_detials.type == role.SubAdmin || req.body.user_detials.type == role.Admin) ? req.body.user_detials.id : req.body.user_detials.userid,
                    created_by_name: req.body.user_detials.name,
                    created_on: isodate
                }

                if(req.body.filename) {
                    // add fine name in param
                        param.er_ticket_attachment = req.body.filename
                }

                // fire sql query to create tickit message
                const objResult = await sqlQuery.createQuery(this.tableName3, param)
                // console.log(objResult)
            
            // send responce to the front end
                if(objResult.warningStatus && objResult.info != '') return res.status(400).json({ errors: [ {msg : objResult.info }] });
                res.status(200).send({message : 'ticket created successfully'})

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get downlaine tickets
    getDownlineTicket = async(req,res) =>{
        try{
            // check body and query in req
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('ticket/getDownlineTicket',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // find user using full name or by phone number
                var searchKeyValue = {
                    created_by_type: 2,
                    child_ids :  req.body.user_detials.child_list.join(',') || '0',
                }
                if (req.query.name) searchKeyValue.full_name = req.query.name //str user full name
                if (req.query.mobile) searchKeyValue.mobile = req.query.mobile // str user primary number

            // search ticket
                //variables for sql query to get ticki details

                if((req.query.start_date && !req.query.end_date )||(req.query.end_date && !req.query.start_date )) return res.status(400).json({ errors: [ {msg : 'Date range is not proper'}] });

                if (req.query.start_date) searchKeyValue.start_date = req.query.start_date
                if (req.query.end_date) searchKeyValue.end_date = req.query.end_date
                if (req.query.statusName) searchKeyValue.ticket_status_name = req.query.statusName

                // const { start, end } = req.query
                // var offset = start
                // var limit = end - offset

                const lisTotalRecords = await ticketModule.getDownlineMemberTicketCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

                // fire sql query to search
                const lisResults = await ticketModule.getDownlineMemberTicket(searchKeyValue, limit, offset)

                // check if the result is there and responce accordingly
                // if (lisResults.length === 0) {
                //     return res.status(204).send({ message: 'ticket not found' })
                // }

                // var finalResult = lisResults.map(result => {
                //     var {...other} = result
                //     other.agentId = lisResponce1[0].username
                //     other.agentName = lisResponce1[0].full_name
                //     return other
                // })

                // res.status(200).send(finalResult)
                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(lisResults)
                }else{
                    res.status(200).send({
                        reportList : lisResults,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    saveImage = async (req, res) => {
        try{
            // console.log(req.file)
             //  console.log('ticket/saveImage',JSON.stringify(req.body), JSON.stringify(req.query))
            let imageUrl = req.file.path.includes('src\\uploads\\tickets\\') ? req.file.path.replace("src\\uploads\\tickets\\",'') : req.file.path.replace("src/uploads/tickets/",'')

            res.status(200).send({ message :'image upload sucessful', url : imageUrl})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getImage = async (req, res) => {
        try{
            //  //  console.log('ticket/getImage',JSON.stringify(req.body), JSON.stringify(req.query))
            let filename1 = __dirname + '/../uploads/tickets/' + req.query.imageName
            let filename2 = __dirname + '\\..\\uploads\\tickets\\' + req.query.imageName
            // console.log(filename)
            // res.status(200).sendFile(path.resolve(filename));
            if (fs.existsSync(filename1) || fs.existsSync(filename2) ) {
                let filename = fs.existsSync(filename1) ? filename1 : filename2
                res.status(200).sendFile(path.resolve(filename));
            }
            else{
                res.status(204).send({message:"image file not found"})
            }
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    checkValidation = (req) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors)
            throw new HttpException(400, 'Validation faild', errors);
        }
    }
}

function pad2(n) { return n < 10 ? '0' + n : n }

module.exports = new ticketController;