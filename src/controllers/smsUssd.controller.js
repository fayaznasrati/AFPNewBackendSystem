const { validationResult } = require('express-validator');

const commonQueryCommon = require('../common/commonQuery.common')
const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const redisMaster = require('../common/master/radisMaster.common')

const smsUssdModule = require('../models/smsUssd.moduel')

const role = require('../utils/userRoles.utils')
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const REPORT_DIR = '/var/www/html/AFPNewBackendSystem/the_topup_reports';
// const { toIsoString } = require('../common/timeFunction.common')

class smsUssdController {

    tableName1 = 'er_ussd_activity_type'
    tableName2 = 'er_ussd_sms_activity'

    // #################### activity related controller
    createActivity = async(req,res) => {
        try{
            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('smsUssd/createActivity',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // insert parem
                var param = {
                    ussd_uuid : 'uuid()',
                    activity_name : req.body.activityName,
                    created_by_type : (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) ? 1 : 2 ,
                    created_by : (req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) ? req.body.user_detials.id : req.body.user_detials.userid,
                    created_on : isodate, //dt current
                }

                const insertDetails = await sqlQuery.createQuery(this.tableName1, param)

                redisMaster.delete('ussdActivityType')

            // send responce to fornt end
                res.status(200).send({ message : 'Activity created successfully'})

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getActivityList = async(req, res) =>{
        try{    
            // console.log('validation start')
            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('validation successfully')
                // console.log('smsUssd/getActivityList',JSON.stringify(req.body), JSON.stringify(req.query))
            // get data from redis
                redisMaster.get('ussdActivityType', async(err, reply) => {
                    // console.log(err, reply)

                    // handle error
                        if (err) {
                            throw new HttpException(500, 'Something went wrong');
                        }

                    // no data in redis get from sql
                        if (reply === null || reply === undefined) {
                            // sql search parem
                                var searchKeyValue = {
                                    active : 1
                                }
                                var key = ['CAST(ussd_uuid AS CHAR(16)) AS ussd_uuid','activity_name AS activityName']
            
                                const activityList = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, 'activity_name', 'ASC')
                                if(activityList.length == 0) return res.status(204).json({message : 'no activity list found'});
            
                            // convert data to string
                                const strResponse = JSON.stringify(activityList)
                                redisMaster.post('ussdActivityType', strResponse)
            
                            // limit and offset
                                // var offset = req.query.start
                                // var limit = req.query.end > activityList.length ? activityList.length : req.query.end - offset + 1
            
                            // send responce to front end
                                var filterResponce = activityList
                                return res.status(200).send(filterResponce)
                        }

                    // found data slice and send to front end
                        // console.log(reply)
                        var lisRegion = JSON.parse(reply)

                    // limit and offset
                        // var offset = req.query.start
                        // var limit = req.query.end > lisRegion.length ? lisRegion.length : req.query.end - offset + 1

                    // filter details
                        var filterResponce = lisRegion

                    // send responce to front end
                        // console.log(filterResponce)
                        return res.status(200).send(filterResponce)
                })

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    updateActivity = async (req, res) => {
        try{
            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('smsUssd/updateActivity',JSON.stringify(req.body), JSON.stringify(req.query))
            // update param
                let searchKeyValue = {
                    ussd_uuid : req.body.ussd_uuid,
                    active : 1
                }
                let params = {
                    activity_name : req.body.activityName
                };
                let updateResult = await sqlQuery.updateQuery(this.tableName1, params, searchKeyValue)

                let { affectedRows, changedRows, info } = updateResult;
                let message = !affectedRows ? 'slab manager not found' :
                    affectedRows && changedRows ? 'slab manager updated successfully' : 'Details Updated';
                let status = !affectedRows ? 400 :
                affectedRows && changedRows ? 200 : 400;

                redisMaster.delete('ussdActivityType')

                res.status(status).send({ message })

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] }); 
        }
    }

    // ############################ sms ussd activity related controller
    getUssdActivityReport = async(req,res) => {
        try{
            // check body and param
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('smsUssd/getUssdActivityReport',JSON.stringify(req.body), JSON.stringify(req.query))
                if ( ! req.query.pageNumber ) req.query.pageNumber = 0

            // limit and offset
                // var offset = req.query.start
                // var limit = req.query.end - offset

            // optional search paremeter
                var searchKeyValue = {
                    Active: 1, 
                }

                if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin ) {
                    // searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
                    if(req.body.user_detials.region_list.length != 7){
                        searchKeyValue.region_ids = req.body.user_detials.region_list.join(',')
                    }
                }else{
                    searchKeyValue.child_ids =  req.body.user_detials.child_list.join(',');
                }    

                if(req.query.userType_uuid) {
                    var userTypeId = await commonQueryCommon.getAgentTypeId(req.query.userType_uuid)
                    if(userTypeId == 0) return res.status(400).json({ errors: [ {msg : 'user type not found'}] });
                    searchKeyValue.usertype_id = userTypeId[0].agent_type_id
                }
                if(req.query.userid) searchKeyValue.username = req.query.userid //str user id
                if(req.query.userName) searchKeyValue.full_name = req.query.userName //str user name
                if(req.query.channel) searchKeyValue.channel = req.query.channel
                if(req.query.activity_uuid) {
                    // search activity type
                        var activityTypeId = await sqlQueryReplica.searchQuery(this.tableName1,{ussd_uuid : req.query.activity_uuid, active : 1},['id'],'id','ASC',1,0)
                        if(activityTypeId.length == 0) return res.status(400).json({ errors: [ {msg : 'activity type not found'}] });
                        searchKeyValue.activityId = activityTypeId[0].id
                }

            // check search param
                if(Object.keys(searchKeyValue).length == 0) return res.status(400).json({ errors: [ {msg : 'Improper search param'}] });

                var lisTotalRecords = await smsUssdModule.getUssdActivityReportCount(searchKeyValue)

                let intTotlaRecords = Number(lisTotalRecords[0].count)
                let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1
    
                let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
                let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords

            // search details from sms moduel
                var activityReport = await smsUssdModule.getUssdActivityReport(searchKeyValue, limit, offset)
                // if(activityReport.length == 0) return res.status(204).send({message : 'no report found'})

            // search agent type list
                const agentTypeList = await commonQueryCommon.getAllAgentType()
                if (agentTypeList == 0) return res.status(204).send({message : 'agent type list not found'})

            // set agent type name  
                var finalResult = activityReport.map((result)=>{
                    var {usertype_id,...other} = result
                    other.agentType = agentTypeList[usertype_id-1].agent_type_name
                    return other
                })

                if( req.query.pageNumber == 0 ) {
                    res.status(200).send(finalResult)
                }else{
                    res.status(200).send({
                        reportList : finalResult,
                        totalRepords : intTotlaRecords,
                        pageCount : intPageCount,
                        currentPage : Number(req.query.pageNumber),
                        pageLimit : Number(process.env.PER_PAGE_COUNT)
                    })
                }

            // send responce to fron end 
                // res.status(200).send(finalResult)

        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }


     downloadUssdActivityReport = async (req, res) => {
    try {
        // validate
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        if (!req.query.pageNumber) req.query.pageNumber = 0;

        const searchKeyValue = { Active: 1 };

        // user region or child filtering
        if (req.body.user_detials.type === role.Admin || req.body.user_detials.type === role.SubAdmin) {
        if (req.body.user_detials.region_list.length !== 7) {
            searchKeyValue.region_ids = req.body.user_detials.region_list.join(',');
        }
        } else {
        searchKeyValue.child_ids = req.body.user_detials.child_list.join(',');
        }

        // filter parameters
        if (req.query.userType_uuid) {
        const userTypeId = await commonQueryCommon.getAgentTypeId(req.query.userType_uuid);
        if (userTypeId.length === 0) return res.status(400).json({ errors: [{ msg: 'user type not found' }] });
        searchKeyValue.usertype_id = userTypeId[0].agent_type_id;
        }
        if (req.query.userid) searchKeyValue.username = req.query.userid;
        if (req.query.userName) searchKeyValue.full_name = req.query.userName;
        if (req.query.channel) searchKeyValue.channel = req.query.channel;

        if (req.query.activity_uuid) {
        const activityTypeId = await sqlQueryReplica.searchQuery(
            this.tableName1,
            { ussd_uuid: req.query.activity_uuid, active: 1 },
            ['id'],
            'id',
            'ASC',
            1,
            0
        );
        if (activityTypeId.length === 0) return res.status(400).json({ errors: [{ msg: 'activity type not found' }] });
        searchKeyValue.activityId = activityTypeId[0].id;
        }

        if (Object.keys(searchKeyValue).length === 0)
        return res.status(400).json({ errors: [{ msg: 'Improper search param' }] });

        const lisTotalRecords = await smsUssdModule.getUssdActivityReportCount(searchKeyValue);

        const intTotalRecords = Number(lisTotalRecords[0].count);
        const pageLimit = Number(process.env.PER_PAGE_COUNT);
        const intPageCount =
        intTotalRecords % pageLimit === 0
            ? intTotalRecords / pageLimit
            : Math.floor(intTotalRecords / pageLimit) + 1;

        const offset = req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * pageLimit : 0;
        const limit = req.query.pageNumber > 0 ? pageLimit : intTotalRecords;

        const activityReport = await smsUssdModule.getUssdActivityReport(searchKeyValue, limit, offset);

        const agentTypeList = await commonQueryCommon.getAllAgentType();
        if (!agentTypeList || agentTypeList.length === 0)
        return res.status(204).send({ message: 'agent type list not found' });

        const finalResult = activityReport.map((result) => {
        const { usertype_id, ...other } = result;
        other.agentType = agentTypeList[usertype_id - 1]?.agent_type_name || 'Unknown';
        return other;
        });

        // ✅ For Excel download
        if (req.query.pageNumber == 0) {
         const now = new Date();
        const dateStr = new Date().toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
        const fileName = `ussd_activity_report_${dateStr}_${timeStr}.xlsx`;
        const filePath = path.join(REPORT_DIR, fileName);

        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (Date.now() - stats.mtimeMs < 30 * 60 * 1000) {
            return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
            }
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('USSD Activity Report');

        if (finalResult.length > 0) {
            sheet.columns = Object.keys(finalResult[0]).map((key) => ({
            header: key,
            key: key,
            width: key.length < 20 ? 20 : key.length + 5
            }));
            sheet.addRows(finalResult);
        }

        await workbook.xlsx.writeFile(filePath);
        fs.chmodSync(filePath, 0o644);

        // Schedule file delete after 30 mins
        setTimeout(() => {
            fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', filePath);
            else console.log('Deleted expired file:', fileName);
            });
        }, 30 * 60 * 1000);

        return res.json({ success: true, downloadUrl: `/api/v1/recharge/admin-report/files/${fileName}` });
        }

        // ✅ Standard paginated response
        return res.status(200).json({
        reportList: finalResult,
        totalRepords: intTotalRecords,
        pageCount: intPageCount,
        currentPage: Number(req.query.pageNumber),
        pageLimit: pageLimit
        });

    } catch (error) {
        console.error('getUssdActivityReport', error);
        return res.status(400).json({ errors: [{ msg: error.message }] });
    }
};

}

module.exports = new smsUssdController()