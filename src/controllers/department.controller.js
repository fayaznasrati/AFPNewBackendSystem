const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const redisMaster = require('../common/master/radisMaster.common')

const { toIsoString } = require('../common/timeFunction.common')

class departmentController{

    //table name
    tableName1 = 'er_master_department'
    tableName2 = 'er_login_admin'

// function to create department 
    createDepartment = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('department/createDepartment',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();


            var searchKeyValue = {
                active: 1,
                department_name: req.body.name, //str department name
            }
            var key = ["CAST(department_uuid AS CHAR(16)) AS department_uuid", "department_name AS name"]
            var orderby = "department_name"
            var ordertype = "ASC"

            // fire sql query to get str department_uuid, str department_name
            const lisresults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (lisresults.length) {
                return res.status(409).send({ message: 'Department name already exsit!' })
            }
            // variable for sql query
            var param = {
                department_uuid: "uuid()",
                department_name: req.body.name, //str name
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, // str user id
                last_modified_by: req.body.user_detials.id, // str user id
            }

            // fire sql query to create new department
            const objresult = await sqlQuery.createQuery(this.tableName1, param)

            //check result and responce accordingly
            res.status(201).send({ message: 'Department created successfully' });

            // delete department data from radis server
            redisMaster.delete('department')

        } catch (error) {
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // get single dep details
    getDepartmentById = async(req,res,next)=> {
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('department/getDepartmentById',JSON.stringify(req.body), JSON.stringify(req.query))
        //search dep  details
            var searchKeyValue ={
                department_uuid : req.query.department_uuid,
                active : 1
            }
            var key = ["CAST(department_uuid AS CHAR(16)) AS department_uuid", "department_name AS name"]
            var orderby = "department_name"
            var ordertype = "ASC"

            var departemnt = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
            if(departemnt.length === 0) return res.status(204).send({ message:'sub admin details not found'})
            var DepDetails = departemnt[0]
            console.log('DepDetails',DepDetails);
            res.status(200).send(DepDetails);
        }catch (error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    allDepartment = async(req,res,next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('[Admin/getSubAdminList]', JSON.stringify(req.body), JSON.stringify(req.query));
            if ( ! req.query.pageNumber ) req.query.pageNumber = 0


            var searchKeyValue = {
                active: 1,
            }

            var key = ["CAST(department_uuid AS CHAR(16)) AS department_uuid", "department_name AS name"]
            var orderby = "department_name"
            var ordertype = "ASC"

            const lisTotalRecords =await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

            let intTotlaRecords = Number(lisTotalRecords.length)
            let intPageCount = ( intTotlaRecords % Number(process.env.PER_PAGE_COUNT) == 0 ) ? intTotlaRecords / Number(process.env.PER_PAGE_COUNT) : parseInt(intTotlaRecords / Number(process.env.PER_PAGE_COUNT)) + 1

            let offset = req.query.pageNumber > 0 ? Number(req.query.pageNumber - 1) * Number(process.env.PER_PAGE_COUNT) : 0
            let limit = req.query.pageNumber > 0 ? Number(process.env.PER_PAGE_COUNT) : intTotlaRecords


            const lisResult = await sqlQueryReplica.searchQuery(this.tableName1,searchKeyValue, key, orderby, ordertype, limit, offset)

            if( req.query.pageNumber == 0 ) {
                res.status(200).send(lisResult)
            }else{
                res.status(200).send({
                    reportList : lisResult,
                    totalRecords : intTotlaRecords,
                    pageCount : intPageCount,
                    currentPage : Number(req.query.pageNumber),
                    pageLimit : Number(process.env.PER_PAGE_COUNT)
                })
            }

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
//function to update department name
    updateDepartment = async(req,res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('department/updateDepartment',JSON.stringify(req.body), JSON.stringify(req.query))
            // console.log("Query", req.query)
            // console.log("body", req.body)
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query
            var param = {
                department_name: req.body.name, //str department name
                last_modified_on: isodate, // dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
            }
            var searchKeyValue = {
                department_uuid: req.query.department_uuid, //str department uuid
                active: 1
            }

            // fire sql query to update department name
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Department not found' :
                affectedRows && changedRows ? 'Department updated successfully' : 'Details Updated';

            // send responce to fornt end
            res.send({ message, info });

            // delete data front front end as it had been changed
            redisMaster.delete('department')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
//function to delete department
    deleteDepartment = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('department/deleteDepartment',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // check for foren key
                //get department id
                    var searchKeyValue = {
                        department_uuid: req.query.department_uuid, //str department uuid
                        active: 1
                    }
                    var key = ["department_id"]
                    var orderby = "department_name"
                    var ordertype = "ASC"

                    // fire sql query to get str department_uuid, str department_name
                    const lisresults1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (lisresults1.length === 0) {
                        return res.status(400).json({ errors: [ {msg : "department not found"}] })
                    }
                //check if department id is under use
                    var searchKeyValue = {
                        usertype_id : lisresults1[0].department_id
                    }
                    var key = ["COUNT(1)"]
                    var orderby = "full_name"
                    var ordertype = "ASC"

                    // fire sql query to get str department_uuid, str department_name
                    const lisresults = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (lisresults[0]["COUNT(1)"]) {
                        return res.status(400).json({ errors: [ {msg : "Department under use, not allowed to delete"}] })
                    }

            //variable for sql query
            const param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
                active: 0
            }
            var searchKeyValue = {
                department_uuid: req.query.department_uuid, //str department uuid
                active: 1
            }

            // fire sql query change active value to 0
            const bojResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = bojResult;
            const message = !affectedRows ? 'Department not found' :
                affectedRows && changedRows ? 'Department Deleted Successfully' : 'Delete allready deteted';

            // send responce to the front end
            res.send({ message, info });

            // delete the data fron redis server
            redisMaster.delete('department')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
}

module.exports = new departmentController();