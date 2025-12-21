const marketingSmsModel = require('../models/marketingSms.model');
const HttpException = require('../utils/HttpException.utils');
const { validationResult, param } = require('express-validator');

const redisMaster = require('../common/master/radisMaster.common');
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const checkCommomDetails = require('../common/commonQuery.common')

const dotenv = require('dotenv');
// configer env
dotenv.config()

// const ds = require("node-dataset");

// const { toIsoString } = require('../common/timeFunction.common')
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const REPORT_DIR = '/var/www/html/AFPNewBackendSystem/the_topup_reports';

const smsFunction = require('../common/smsFunction.common')

const { sendSms } = require('./function.controller');
const req = require('express/lib/request');
const smsFunctionCommon = require('../common/smsFunction.common');

class smsController {
    // sql table names
    tableName1 = 'er_marketing_sms_template_categories'
    tableName2 = 'er_marketing_sms_templates'
    tableName3 = 'er_send_marketing_group_sms'
    tableName4 = 'er_send_marketing_sms'
    tableName5 = 'er_wallet_transfer_sms_log_2'
    tableName6 = 'er_sms_success_log'
    tableName7 = 'er_login'

    // function to createe sms templete
    createSmsTemplateCategory = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/createSmsTemplateCategory',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // varibles for sql query
            var param = {
                category_uuid: "uuid()",
                category_name: req.body.name, //str category name
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, //str user id
                last_modified_by: req.body.user_detials.id //str user id
            }

            // fire sql query to ad sms templete in the data base
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            // check if the result is there and responce accordingly

            // send responce to the frontend
            res.status(201).send({ message: 'sms templete category created successfully !!' });

            // delete sms template category from the redis server
            redisMaster.delete('templeteCategory')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get all sms templete Category
    allSmsTemplateCategory = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/allSmsTemplateCategory',JSON.stringify(req.body), JSON.stringify(req.query))
            // check in the redis server if the sms tmeplete category is there or not
            redisMaster.get("templeteCategory", async(err, reply) => {
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    //redis dont have data now fire sql query to get sms templete categoty name asnd send it to redis server
                    //variables to sqlQuery
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    var searchKeyValue = {
                        active: 1,
                    }
                    var key = ["CAST(category_uuid AS CHAR(16)) AS category_uuid", "category_name AS name"]
                    var orderby = "category_name"
                    var ordertype = "ASC"

                    // fire search query to get str category_uuid, str category_name
                    const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (lisResults.length === 0) {
                        return res.status(204).send({ message: 'No such Template category is avaliable !!' })
                    }

                    // change jsnon result to string and update the redis server
                    const strResponse = JSON.stringify(lisResults)
                    redisMaster.post('templeteCategory', strResponse)

                    // var offset = req.query.start
                    // var limit = req.query.end > lisResults.length ? lisResults.length : req.query.end - offset + 1

                    //send responce to front end
                    return res.status(200).send(lisResults)
                }

                var lisRegion = JSON.parse(reply)

                // var offset = req.query.start
                // var limit = req.query.end > lisRegion.length ? lisRegion.length : req.query.end - offset + 1

                // redis have the data,convert it to json data type and send it to front end
                res.status(200).send(lisRegion)
            })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });

        }
    }

    //function to update sms template category name
    updateSmsTemplateCategory = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/updateSmsTemplateCategory',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query
            var param = {
                category_name: req.body.name, //str country_name
                last_modified_on: isodate,
                last_modified_by: req.body.user_detials.id
            }
            var searchKeyValue = {
                category_uuid: req.body.category_uuid,
                active: 1
            }

            // fire sql query to update the name of the category
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'SMS Template category not found' :
                affectedRows && changedRows ? 'SMS Template category updated successfully' : 'Details Updated';

            // send responce to front end
            res.send({ message, info });

            // delete data from redis
            redisMaster.delete('templeteCategory')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to change the activate state of the sms template category
    deleteSmsTemplateCategory = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/deleteSmsTemplateCategory',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query
            const param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
                active: 0
            }
            var searchKeyValue = {
                category_uuid: req.query.category_uuid, // str category uuid
                active: 1
            }

            // firre sql query to update the state of the sms category to unactive
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'SMS Template category not found' :
                affectedRows && changedRows ? 'SMS Template category delete successfully' : 'SMS template delete faild';

            // sending rewponce to the frontend
            res.send({ message, info });

            //deleteing the sms templete category data from redis
            redisMaster.delete('templeteCategory')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // ##################################################################
    // sms templete
    // function to create sms category
    createSmsTemplate = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/createSmsTemplate',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //check the sms temolete category uuid and get id
            //varibles to sqlquery to check sms templete category
            var searchKeyValue = {
                category_uuid: req.body.category_uuid, // str category uuid
                active: 1,
            }
            var key = ["sms_template_category_id"]
            var orderby = "sms_template_category_id"
            var ordertype = "ASC"

            // fire sqlquery to get the str sms_template_category_id
            const lisResponse = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // check if the result is there and responce accordingly
            if (lisResponse.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'SMS template category not found'}] });

            }

            //now create sms template using
            // variable for sqlQuery to create sms template
            var param = {
                template_uuid: "uuid()",
                sms_template_category_id: lisResponse[0].sms_template_category_id, // str sms_template_category
                template_name: req.body.name, // str template_name
                template_message: req.body.message, // str template_message
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, //str user id
                last_modified_by: req.body.user_detials.id //str user id
            }

            // fire sql query to create sms template
            const objResult = await sqlQuery.createQuery(this.tableName2, param)

            // check if the result is there and responce accordingly

            // send responce to form end
            res.status(201).send({ message: 'sms templete successfully created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function get all sms templates 
    allSmsTemplate = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/allSmsTemplate',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit variables for sql query
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var struserid = req.body.user_detials.id

            const lisTotalRecords = await marketingSmsModel.allSmsTemplateCount(struserid)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // fire sql query to get all sms template
            const lisResult = await marketingSmsModel.allSmsTemplate(struserid, limit, offset)

            // check if the result is there and responce accordingly
            // if (lisResult.length === 0) {
            //     return res.status(204).json({ message : 'No sms template found'});
            // }

            //sending the leist to front ned
            // res.status(200).send(lisResult)
            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisResult)
            }else{
                res.status(200).send({
                    reportList : lisResult,
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

    downloadSmsTemplate = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.query.pageNumber) req.query.pageNumber = 0;

        const struserid = req.body.user_detials.id;

        const lisTotalRecords = await marketingSmsModel.allSmsTemplateCount(struserid);
        const intTotlaRecords = Number(lisTotalRecords[0].count);
        const intPageCount = Math.ceil(intTotlaRecords / Number(process.env.PER_PAGE_COUNT));

        const offset = req.query.pageNumber > 0
            ? (Number(req.query.pageNumber) - 1) * Number(process.env.PER_PAGE_COUNT)
            : 0;
        const limit = req.query.pageNumber > 0
            ? Number(process.env.PER_PAGE_COUNT)
            : intTotlaRecords;

        const lisResult = await marketingSmsModel.allSmsTemplate(struserid, limit, offset);

        // === Export Excel if pageNumber == 0 ===
        if (req.query.pageNumber == 0) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
            const fileName = `sms_templates_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            // Skip generation if already exists and fresh
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const createdTime = moment(stats.ctime);
                if (moment().diff(createdTime, 'minutes') < 30) {
                    return res.status(200).send({
                        success: true,
                        downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`
                    });
                }
            }

            // Generate Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('SMS Templates');

            if (lisResult.length > 0) {
                const sample = lisResult[0];
                worksheet.columns = Object.keys(sample).map((key) => ({
                    header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    key: key,
                    width: 25
                }));
                worksheet.getRow(1).font = { bold: true };
            }

            worksheet.addRows(lisResult);
            await workbook.xlsx.writeFile(filePath);

            // Auto-delete after 30 minutes
            setTimeout(() => {
                fs.unlink(filePath, err => {
                    if (err && err.code !== 'ENOENT') {
                        console.error(`Failed to delete report file ${fileName}:`, err.message);
                    }
                });
            }, 30 * 60 * 1000);

            return res.status(200).json({
                success: true,
                downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`
            });
        }

        // === Paginated JSON Response ===
        return res.status(200).send({
            reportList: lisResult,
            totalRepords: intTotlaRecords,
            pageCount: intPageCount,
            currentPage: Number(req.query.pageNumber),
            pageLimit: Number(process.env.PER_PAGE_COUNT)
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ errors: [{ msg: error.message }] });
    }
};

    // function to get message form the sms template by template uuid
    findMessageSmsTemplate = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/findMessageSmsTemplate',JSON.stringify(req.body), JSON.stringify(req.query))
            //variable for sqlQuery
            var searchKeyValue = {
                template_uuid: req.query.template_uuid, // str template uuid
                created_by: req.body.user_detials.id, //str userid
                active: 1,
            }
            var key = ["template_message as message"]
            var orderby = "template_message"
            var ordertype = "ASC"

            //fire sql query to get str template_message by templete id
            const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'No message avaliable !!' })
            }

            // send message to the front end
            res.status(200).send(lisResult[0])

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getTemplateDetails = async (req, res) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/getTemplateDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            // fire sql query to get all sms template
            const lisResult = await marketingSmsModel.getTemplateDetails(req.query.template_uuid)

            // check if the result is there and responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'No Template avaliable !!' })
            }

            //sending the leist to front ned
            res.status(200).send(lisResult[0])

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    // function to update the sms template by id
    updateSmsTemplate = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/updateSmsTemplate',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query to update the sms template 
            var param = {
                template_name: req.body.name, // str template name
                template_message: req.body.message, //str message
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, // str user id
            }

            //check if user want to update the sms template category
            if (req.body.category_uuid) {
                // check the category is active or not
                //variable for sqlQuery to search for category
                var searchKeyValue = {
                    category_uuid: req.body.category_uuid, // str category_uuid
                    active: 1,
                }
                var key = ["sms_template_category_id"]
                var orderby = "sms_template_category_id"
                var ordertype = "ASC"

                // fire sql query to get the str category_id
                const lisResponse = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

                // check if the result is there and responce accordingly
                if (lisResponse.length === 0) {
                    return res.status(400).json({ errors: [ {msg : "SMS Template category not found"}] });

                }

                // asign the variable to the update the category id
                param.sms_template_category_id = lisResponse[0].sms_template_category_id //str sms_category_id
            }

            //check if there is sufficent data to make a update request
            if (Object.keys(param).length === 2) return res.status(400).json({ errors: [ {msg : 'Improper update request'}] });

            var searchKeyValue = {
                template_uuid: req.body.template_uuid, //str template uuid
                created_by: req.body.user_detials.id, //str userid
                active: 1
            }

            // fire sql query to update the sms template
            const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'sms Template not found' :
                affectedRows && changedRows ? 'sms Template updated successfully' : 'Details Updated';

            // send responce to the frontend
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to deactivate the sms template
    deleteSmsTemplate = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/deleteSmsTemplate',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // search template uuid in the sned marketing group sms
                //get template id
                    //variable for sqlQuery
                    var searchKeyValue = {
                        template_uuid: req.query.template_uuid, // str template uuid
                        active: 1,
                    }
                    var key = ["sms_template_id"]
                    var orderby = "sms_template_id"
                    var ordertype = "ASC"

                    //fire sql query to get str template_message by templete id
                    const lisResult1 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype,1,0)

                    // check if the result is there and responce accordingly
                    if (lisResult1.length === 0) {
                        return res.status(400).json({ errors: [ {msg : "template not found",}] });
                    }
                // check if template id is in group table
                    var searchKeyValue = {
                        sms_template_id: lisResult1[0].sms_template_id , // str template uuid
                    }
                    var key = ["COUNT(1)"]
                    var orderby = "send_group_sms_id"
                    var ordertype = "ASC"

                    //fire sql query to get str template_message by templete id
                    const lisResult2 = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype,1,0)

                    // check if the result is there and responce accordingly
                    if (lisResult2[0]["COUNT(1)"]) {
                        return res.status(400).json({ errors: [ {msg : "Template allready used, not allowed to delete template"}] });
                    }

            // variable for sql query
            const param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
                active: 0
            }
            var searchKeyValue = {
                template_uuid: req.query.template_uuid, // str template uuid
                created_by: req.body.user_detials.id, //str userid
                active: 1
            }

            // fire sql query to update the active value to 0
            const objResult = await sqlQuery.updateQuery(this.tableName2, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'sms Template not found' :
                affectedRows && changedRows ? 'sms Template delete successfully' : 'SMS Template delete faild, allready deleted';

            // send responce to the frontend 
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // ##################################################################
    // sms-group-message
    
    //fucntion to send bulk sms 
    createSmsGroupWithTemplate = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/createSmsGroupWithTemplate',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            var param = {
                send_group_sms_uuid: "uuid()",
                message_type: 1,
                sms_template_id: 0,
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, // str user id
                last_modified_by: req.body.user_detials.id //str user id
            }

            //verify agent
            const objResponce1 = await checkCommomDetails.checkAgentType(req.body.agent_type_uuid, req.body.agentTypeName)
            if (!objResponce1) return res.status(400).json({ errors: [ {msg : 'Agent type not found'}] });

            param.group_name = req.body.agentTypeName

            //get details from template
            //variable for sqlQuery
            var searchKeyValue = {
                template_uuid: req.body.template_uuid, // str template uuid
                created_by: req.body.user_detials.id, //str userid
                active: 1,
            }
            var key = ["template_message", "sms_template_id", "template_name"]
            var orderby = "template_message"
            var ordertype = "ASC"

            //fire sql query to get str template_message by templete id
            const lisResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponce.length === 0) return res.status(400).json({ errors: [ {msg : 'SMS Template not found'}] });


            param.sms_template_id = lisResponce[0].sms_template_id
            param.sms_title = lisResponce[0].template_name
            param.sms_message = lisResponce[0].template_message

            // send sms to all agent
            this.getAllAgentSendSms(objResponce1, lisResponce[0].template_message)

            //add data to sms group
            // fire sql query to create sms group
            const objResult = await sqlQuery.createQuery(this.tableName3, param);

            //send responce to front end
            res.status(201).send({ message: 'sms marketing group created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    createSmsGroup = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/createSmsGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            var param = {
                send_group_sms_uuid: "uuid()",
                sms_title: "custom message",
                sms_message: req.body.message,
                message_type: 2,
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, // str user id
                last_modified_by: req.body.user_detials.id //str user id
            }

            //verify agent
            const objResponce1 = await checkCommomDetails.checkAgentType(req.body.agent_type_uuid, req.body.agentTypeName)
            if (!objResponce1) return res.status(400).json({ errors: [ {msg : 'Agent type not found'}] });

            param.group_name = req.body.agentTypeName

            //add data to sms group
            // fire sql query to create sms group
            const objResult = await sqlQuery.createQuery(this.tableName3, param);

            // send sms to all agent
            this.getAllAgentSendSms(objResponce1, req.body.message)

            // check if the result is there and responce accordingly
            //send responce to front end
            res.status(201).send({ message: 'sms marketing group created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getAllAgentSendSms = async (userTypeId,message) => {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/getAllSendSms',JSON.stringify(req.body), JSON.stringify(req.query))
            // get agent type list
            let agentList = await sqlQueryReplica.searchQueryNoLimit(this.tableName7,{usertype_id : userTypeId},['userid'],'userid','ASC')
            if(agentList.length == 0) return({error : 'no agent foud'})

            agentList.forEach((agent)=>{
                smsFunctionCommon.agentSms({
                    recieverMessage : message,
                    agentId : agent.userid
                })
            })

            return ({message : 'sms send successfully' })

        }catch(error){
            console.log(error);
            return ({error:'sms queuq error'})
        }
    }

    //function to get all sms group details
    allSmsGroup = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/allSmsGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            // limiting variables 
            // var offset = req.query.start
            // var limit = req.query.end - offset

            //fire sql query to get sms group details
            const lisResult = await marketingSmsModel.allSmsGroup()

            // check if the result is there and responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResult.length === 0) {
                return res.status(204).json( {message: 'no sms group found'});

            }

            //changing variable names
            const lisResultReName = lisResult.map(result => {
                var { send_group_sms_uuid, group_name, message_type, created_on, template_name } = result
                return {
                    send_group_sms_uuid: send_group_sms_uuid.toString(),
                    name: group_name,
                    type: message_type,
                    date: created_on,
                    template: template_name,
                }
            })

            //sending responce to the front end
            res.status(200).send(lisResultReName)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // get all sms group by date of creation range
    allSmsGroupDateRange = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/allSmsGroupDateRange',JSON.stringify(req.body), JSON.stringify(req.query))
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            //limit variables for sql query
            // var offset = req.query.start
            // var limit = req.query.end - offset

            // date range variable from sql query
            var start = req.query.start_date
            var end = req.query.end_date

            const lisTotalRecords = await marketingSmsModel.allSmsGroupDateRangeCount(start, end)

            let intTotlaRecords = Number(lisTotalRecords[0].count)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            // fire sql query to get the detials
            const lisResult = await marketingSmsModel.allSmsGroupDateRange(start, end, limit, offset)

            // check if the result is there and responce accordingly
            if (!lisResult) {
                throw new HttpException(500, 'something went wrong !!');
            }
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'No sms group is avaliable !!' })
            }

            // chaning the avriable name reassingment 
            const lisResultReName = lisResult.map(result => {
                    var { send_group_sms_uuid, group_name, message_type, created_on, template_name,sms_message } = result
                    return {
                        send_group_sms_uuid: send_group_sms_uuid,
                        name: group_name,
                        type: message_type,
                        date: created_on,
                        template: template_name,
                        message : sms_message,
                    }
                })

                //sending response to the front end
            // res.status(200).send(lisResultReName)
            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisResultReName)
            }else{
                res.status(200).send({
                    reportList : lisResultReName,
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




    downloadSmsGroupDateRange = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.query.pageNumber) req.query.pageNumber = 0;

        const start = req.query.start_date;
        const end = req.query.end_date;

        const lisTotalRecords = await marketingSmsModel.allSmsGroupDateRangeCount(start, end);
        const intTotlaRecords = Number(lisTotalRecords[0].count);
        const intPageCount = Math.ceil(intTotlaRecords / Number(process.env.PER_PAGE_COUNT));

        const offset = req.query.pageNumber > 0
            ? (Number(req.query.pageNumber) - 1) * Number(process.env.PER_PAGE_COUNT)
            : 0;
        const limit = req.query.pageNumber > 0
            ? Number(process.env.PER_PAGE_COUNT)
            : intTotlaRecords;

        const lisResult = await marketingSmsModel.allSmsGroupDateRange(start, end, limit, offset);

        if (!lisResult) {
            throw new Error('Something went wrong while fetching SMS group data.');
        }
        if (lisResult.length === 0) {
            return res.status(204).send({ message: 'No SMS group is available!' });
        }

        const formattedResult = lisResult.map(result => {
            const { send_group_sms_uuid, group_name, message_type, created_on, template_name, sms_message } = result;
            return {
                send_group_sms_uuid,
                name: group_name,
                type: message_type,
                date: created_on,
                template: template_name,
                message: sms_message
            };
        });

        // === Excel Export Mode ===
        if (req.query.pageNumber == 0) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
            const fileName = `sms_group_report_${dateStr}_${timeStr}.xlsx`;
            const filePath = path.join(REPORT_DIR, fileName);

            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const createdTime = moment(stats.ctime);
                if (moment().diff(createdTime, 'minutes') < 30) {
                    return res.status(200).json({
                        success: true,
                        downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`
                    });
                }
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('SMS Group Report');

            if (formattedResult.length > 0) {
                worksheet.columns = Object.keys(formattedResult[0]).map((key) => ({
                    header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    key,
                    width: 25
                }));
                worksheet.getRow(1).font = { bold: true };
            }

            worksheet.addRows(formattedResult);
            await workbook.xlsx.writeFile(filePath);

            setTimeout(() => {
                fs.unlink(filePath, (err) => {
                    if (err && err.code !== 'ENOENT') {
                        console.error(`Failed to delete report file ${fileName}:`, err.message);
                    }
                });
            }, 30 * 60 * 1000); // 30 minutes

            return res.status(200).json({
                success: true,
                downloadUrl: `/api/v1/recharge/agent-report/files/${fileName}`
            });
        }

        // === Normal JSON Paginated Response ===
        return res.status(200).send({
            reportList: formattedResult,
            totalRepords: intTotlaRecords,
            pageCount: intPageCount,
            currentPage: Number(req.query.pageNumber),
            pageLimit: Number(process.env.PER_PAGE_COUNT)
        });

    } catch (error) {
        console.error(error);
        return res.status(400).json({ errors: [{ msg: error.message }] });
    }
};

    //function to get sms group message by id
    findMessageSmsgroup = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/findMessageGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            //variables for sql query
            var searchKeyValue = {
                send_group_sms_uuid: req.query.send_group_sms_uuid, // str send_group_sms_uuid
                active: 1,
            }
            var key = ["sms_message AS message"]
            var orderby = "sms_message"
            var ordertype = "ASC"

            // first sql query to get the message
            const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName3, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (lisResults.length === 0) {
                return res.status(204).send({ message: 'SMS Group not found' })
            }

            //send responce to frontend
            res.status(200).send(lisResults)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update the data of sms group
    updateSmsGroup = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/updateSmsGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to upadate the data in sma group
            var param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id // str userid
            }

            // check if sms template uuid is there or not 
            if (req.body.template_uuid) {
                //search if the template id is active or not
                //variable for sms template search query
                var searchKeyValue = {
                    template_uuid: req.body.template_uuid, //str template uuid
                    active: 1,
                }
                var key = ["sms_template_id"]
                var orderby = "sms_template_id"
                var ordertype = "ASC"

                // sms template search query to get str sms_template_id
                const lisResponce = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 100, 0)

                // check if the result is there and responce accordingly
                if (!lisResponce) {
                    throw new HttpException(500, 'message Template ont found');
                }
                if (lisResponce.length === 0) {
                    return res.status(400).json({ errors: [ {msg : 'SMS template not found'}] });

                }
                // add sms template name in the param variable to apdate it
                param.sms_template_id = lisResponce[0].sms_template_id
            }
            //addint different update request to the param variable 
            if (req.body.name) {
                param.group_name = req.body.name //str group_name
            }
            if (req.body.type) {
                param.message_type = req.body.type // str message_type
            }
            if (req.body.title) {
                param.sms_title = req.body.title // str sms_title
            }
            if (req.body.message) {
                param.sms_message = req.body.message // str sms_message
            }

            // check if the update query is proper or not
            if (Object.keys(param).length === 2) return res.status(400).json({ errors: [ {msg : 'Improper update request'}] });


            //search variable eith parameter
            var searchKeyValue = {
                send_group_sms_uuid: req.body.send_group_sms_uuid, //str send_group_sms_uuid
                active: 1
            }

            // fire sql query to update sms group
            const objResult = await sqlQuery.updateQuery(this.tableName3, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Group Message not found' :
                affectedRows && changedRows ? 'Group Message updated successfully' : 'Details Updated';

            // send responce to the frontend
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to update the active status to 0
    deleteSmsGroup = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/deleteSmsGroup',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variabels for the sql query
            const param = {
                last_modified_on: isodate, // dt current date time
                last_modified_by: req.body.user_detials.id, // str user id
                active: 0
            }
            var searchKeyValue = {
                send_group_sms_uuid: req.query.send_group_sms_uuid, //str sms_group_uuid
                active: 1
            }

            //fire sql query to update the active value to 0
            const objResult = await sqlQuery.updateQuery(this.tableName3, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Group Message not found' :
                affectedRows && changedRows ? 'Group Message Deleted successfully' : 'Delete faild, all ready deleted';

            // send response to frontend
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //########################################################
    //sms table 
    //function to create sms
    createSms = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/createSms',JSON.stringify(req.body), JSON.stringify(req.query))
            //check group sms id
            //variable for sql query to check the group sms id
            var searchKeyValue = {
                send_group_sms_uuid: req.body.send_group_sms_uuid, // str send_group_sms_uuid
                active: 1,
            }
            var key = ["send_group_sms_id"]
            var orderby = "send_group_sms_id"
            var ordertype = "ASC"

            // fire sql query to get str group_sms_id
            const lisResponce = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 100, 0)

            // check if the result is there and responce accordingly
            if (lisResponce.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'SMS Group not found'}] });
            }

            //variable for sqlQuery to create sms
            var param = {
                send_group_sms_uuid: req.body.send_group_sms_uuid, //str send_group_sms_uuid
                send_group_sms_id: lisResponce[0].send_group_sms_id, // str send_group_sms_id
                number: req.body.number, //int mobile_number
                message: req.body.message, // str send_message
            }

            //fire sql query to create the sms 
            const onjresult = await sendSms(param)

            // check if the result is there and responce accordingly
            if ( onjresult.error ) {
                return res.status(400).json({ errors: [ {msg : onjresult.error }] });
            }

            // sned responce to frontend
            res.status(201).send({ message: 'sms successfully created!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get all sms by group sms uuid with detials 
    allSmsId = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('marketingSms/allSmsId',JSON.stringify(req.body), JSON.stringify(req.query))
            //variables for sql query
            // var offset = req.query.start
            // var limit = req.query.end - offset
            var searchKeyValue = {
                send_group_sms_uuid: req.query.send_group_sms_uuid, //str send_group_sms_uuid
            }
            var key = ["CAST(send_sms_uuid AS CHAR(16)) AS send_sms_uuid", "mobile_number AS number", "sms_message AS message", "sms_status AS status"]
            var orderby = "mobile_number"
            var ordertype = "ASC"

            //fire sql query to get str send_sms_uuid,int mobile_number,str sms_message,bool sms_status
            const lisResult = await sqlQueryReplica.searchQueryNoLimit(this.tableName4, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (lisResult.length === 0) {
                return res.status(204).send({ message: 'SMS not found' })
            }
            // send rescponce to frontend
            res.status(200).send(lisResult)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update the sms 
    updateSms = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('marketingSms/updateSms',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query to update sms
            var param = {
                last_modified_on: isodate,
            }

            // if request to update the sms group check if it is there or not
            if (req.body.send_group_sms_uuid !== undefined) {
                //check send_group_sms_uuid is valid or not
                //variable for sql query to check if sms group id is there or not
                var searchKeyValue = {
                    send_group_sms_uuid: req.body.send_group_sms_uuid,
                    active: 1,
                }
                var key = ["send_group_sms_id"]
                var orderby = "send_group_sms_id"
                var ordertype = "ASC"

                //fire sql query to get the str sms_group_id
                var lisResponce = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 100, 0)

                // check if the result is there and responce accordingly
                if (!lisResponce) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (lisResponce.length === 0) {
                    return res.status(400).json({ errors: [ {msg : 'SMS template not found'}] });

                }
                //adding the variable name to the param to be updated
                param.send_group_sms_uuid = req.body.send_group_sms_uuid //str send_group_sms_uuid
                param.send_group_sms_id = lisResponce[0].send_group_sms_id //str send_group_sms_id
            }
            // other update requests 
            if (req.body.number) {
                param.mobile_number = req.body.number //int mobile_number
            }
            if (req.body.message) {
                param.sms_message = req.body.message //str message
            }

            // check if the param is have update values
            if (Object.keys(param).length === 1) return res.status(400).json({ errors: [ {msg : 'Improper update request'}] });


            var searchKeyValue = {
                send_sms_uuid: req.body.send_sms_uuid, //str send_sms_uuid
            }

            //fire sql query to update the sms
            const objResult = await sqlQuery.updateQuery(this.tableName4, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'sms not found' :
                affectedRows && changedRows ? 'sms updated successfully' : 'Details updated';

            //send responce to the frontend
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // get pending sms from table er_wallet
    getRoshanPendingSms = async(req,res)=>{
        try{
            // check body
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                //  //  console.log('marketingSms/getRoshanPendingSms',JSON.stringify(req.body), JSON.stringify(req.query))
            // if(req.body.code != process.env.API_PASSWORD){
            //     return res.send([])
            // }

            let searchKeyValue = {
                status: 0,
                operator_id : 5
            }
            let key = ['id','userid','username','mobile','operator_id','SMS','CAST(created_on AS CHAR(20)) as created_on','status','mobile1','operator_id1','mobile2','operator_id2','mobile3','operator_id3','mobile4','operator_id4','mobile5','operator_id5']
            let sendSmsResponce = await sqlQueryReplica.searchQuery(this.tableName5,searchKeyValue,key,'id','asc',100,0);

            // if(sendSmsResponce.length == 0) return res.status(200).send("null")

            // const dataset = await new ds.DataSet("test").fromJSON(sendSmsResponce)

            // console.log(dataset.getData())
            res.status(200).send(sendSmsResponce)

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updatePendingStatus = async (req, res) => {
        try{
            // int intID, string strsmpp_respose, int intUseID, string strUserName, string strSMS, string strOperatorID1, string strMobile1, string strOperatorID2, string strMobile2, string strOperatorID3, string strMobile3, string strOperatorID4, string strMobile4, string strOperatorID5, string strMobile5, string strDileveryDatetime, string strPhoneNumber, string strResMessageID, string strResponseFinalStatus
            // console.log(req.body)
             //  console.log('marketingSms/updatePendingStatus',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            let { intID,strsmpp_respose,intUseID,strUserName,strSMS,strOperatorID1,strMobile1,strOperatorID2,strMobile2,strOperatorID3,strMobile3,strOperatorID4,strMobile4,strOperatorID5,strMobile5,strOperatorID6,strMobile6,strDileveryDatetime,strPhoneNumber,strResMessageID,strResponseFinalStatus} = req.body
            
            if (strDileveryDatetime == "NA") strDileveryDatetime = isodate
            
            if (strsmpp_respose != "Bound") return res.status(400).json({ message : 'message status not updates'})

            // update status in er_wallet_transfer_sms_log_2 table  
            let objSeatchKeyValue = {
                id : intID,
                status : 0, 
            }  
            let objUpdateParam = {
                status : 1, 
                smpp_respose : strsmpp_respose, 
                final_status : strResponseFinalStatus,
                delaverydatetime : strDileveryDatetime,
                res_phonenumber : strPhoneNumber,
                res_message_id : strResMessageID
            }
            let objUpdateResponce = await sqlQuery.updateQuery(this.tableName5,objUpdateParam,objSeatchKeyValue)
            
            let { affectedRows, changedRows, info } = objUpdateResponce
            if(affectedRows,changedRows){
                // insert into er_sms_success_log
                let objInsertParam = {
                    id : intID,
                    userid :  intUseID, //str
                    username : strUserName, //str 
                    mobile : strMobile1,
                    operator_id : strOperatorID1,
                    SMS : strSMS, //str
                    created_on: isodate,
                    status : 1, // 0 not send, 1 send
                    mobile1 :  strMobile2,
                    operator_id1 : strOperatorID2,
                    mobile2 :  strMobile3,
                    operator_id2 : strOperatorID3,
                    mobile3 :  strMobile4,
                    operator_id3 : strOperatorID4,
                    mobile4 :  strMobile5,
                    operator_id4 : strOperatorID5 ,
                    mobile5 :  strMobile6 ? strMobile6 : 'NA',
                    operator_id5 : strOperatorID6 ? strOperatorID6 : 'NA',
                    smpp_respose : strsmpp_respose, 
                    final_status : strResponseFinalStatus,
                    delaverydatetime : strDileveryDatetime,
                    res_phonenumber : strPhoneNumber,
                    res_message_id : strResMessageID 
                }
                let insertResponce = await sqlQuery.createQuery(this.tableName6,objInsertParam)
                res.json({ message : "status updates"})
            }else{
                res.json({ message : "status updates already"})
            }

        }catch (error) {
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

module.exports = new smsController;