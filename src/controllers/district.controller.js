const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const redisMaster = require('../common/master/radisMaster.common');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const { toIsoString } = require('../common/timeFunction.common')

class districtController {
    // table name
    tableName1 = "er_master_district" //for district
    tableName2 = "er_master_province" // for province

    //function to create district
    createDistrict = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('district/createDistrict',JSON.stringify(req.body), JSON.stringify(req.query))
            // set id to provience id name
            const id = req.body.province_uuid

            // search if provience exists or not
            // variables for sqlQuery
            var searchKeyValue = {
                province_uuid: req.body.province_uuid, //str property uuid
                province_name: req.body.provinceName, //str province name
                active: 1,
            }
            var key = ["COUNT(1)"]
            var orderby = "province_name"
            var ordertype = "ASC"

            // fore sql query to get str province name
            const lisResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponce[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg : "Province Not Found"}] });
            }

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // now create district as the province is verified
            // variables for sqlQuery
            var param = {
                district_uuid: "uuid()",
                district_name: req.body.name, //str name
                province_uuid: req.body.province_uuid, //str property uuid
                province_name: req.body.provinceName, //str province name
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, //str user_detials
                last_modified_by: req.body.user_detials.id, //str user_detials
            }

            //fire sql query to create district
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            //send responce to front end
            res.status(201).send({ message: 'District created successfully' });

            // delete data from district+provience_id variable name from radis
            redisMaster.delete('district' + id)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to get district by province id
    districtByProvienceUuid = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('district/districtByProvinceUuid',JSON.stringify(req.body), JSON.stringify(req.query))
            const id = req.query.province_uuid // str provience uuid

            // check in redis if district+provience_id value is there in redis
            redisMaster.get('district' + id, async(err, reply) => {

                // check error and resply
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    // radis dont have any data fire sql query to get the district name
                    // variables for sql query
                    var searchKeyValue = {
                        province_uuid: req.query.province_uuid, //str property uuid
                        active: 1,
                    }
                    var key = ["CAST(district_uuid AS CHAR(16)) AS district_uuid", "district_name AS name"]
                    var orderby = "district_name"
                    var ordertype = "ASC"

                    // fire sql query to search district name from
                    const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (lisResults.length === 0) {
                        return res.status(204).send({ message: 'District not found'})
                    }

                    // send data to redis server to update 
                    const strResponse = JSON.stringify(lisResults)
                    redisMaster.post('district' + id, strResponse)

                    // var offset = req.query.start
                    // var limit = req.query.end > lisResults.length ? lisResults.length : req.query.end - offset + 1

                    // send responce ti front end
                    return res.status(200).send(lisResults)
                }
                var lisRegion = JSON.parse(reply)

                // var offset = req.query.start
                // var limit = req.query.end > lisRegion.length ? lisRegion.length : req.query.end - offset + 1

                // redis have the data, convet string to json and send to the fronte nd
                res.status(200).send(lisRegion)
            })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to update the county name
    updateDistrict = async(req, res) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('district/updateDistrict',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query used to update the district name or proviecne
            var param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
            }

            // optional variables district name
            if (req.body.name) {
                param.district_name = req.body.name //str name
            }

            // optional variable provience id need to be check
            if (req.body.province_uuid) {
                //variable for sql query
                var searchKeyValue = {
                    province_uuid: req.body.province_uuid, //str property uuid
                    active: 1,
                }
                var key = ["province_name"]
                var orderby = "province_name"
                var ordertype = "ASC"

                // fire sql query to check of the provience uuid id there or not and get str provience name
                const objResponce = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 100, 0)
                if (!objResponce) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (objResponce.length === 0) {
                    return res.status(400).send({ message: 'Provience not Found' })
                }

                // add variable in the param fro sql query to update the variable
                param.province_uuid = req.body.province_uuid
                param.province_name = objResponce[0].province_name

                // as the district related to the provience is changing deleting the respective data from redis
                redisMaster.delete('district' + req.body.province_uuid)
            }


            // deleting the data from the redis in case the provience id are different or same (new provience id  and the old provience)
            // creating variable for sqlquery
            var searchKeyValue = {
                district_uuid: req.body.district_uuid,
                active: 1,
            }
            var key = ["CAST(province_uuid AS CHAR(16)) AS province_uuid"]
            var orderby = "province_uuid"
            var ordertype = "ASC"

            // fire sql query to get the str province id to delete the respective data from redis server 
            const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // check if the result is there and responce accordingly
            if (lisResponce.length === 0) {
                return res.status(400).send({ message: 'District not found' })
            }

            // deleting the data from redis server for the given id
            redisMaster.delete('district' + lisResponce[0].province_uuid)

            if (Object.keys(param).length === 2) return res.status(400).json({ errors: [ {msg : "Invalid search requests"}] }); // param check

            // creating the search variable for sql query
            var searchKeyValue = {
                district_uuid: req.body.district_uuid, // str display uuid
                active: 1
            }

            // fire sql query to update the name or provience
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'District not found' :
                affectedRows && changedRows ? 'District updated successfully' : 'Details Updated';

            //send responce to front end
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to delete the district  change the active value to 0
    deleteDistrict = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('district/deleteDistrict',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql to update the active state 
            const param = {
                last_modified_on: isodate, // dt current date time
                last_modified_by: req.body.user_detials.id, // str user id
                active: 0
            }

            // variable to search the provience id of the district to delete the appropriate provience value from redis
            var searchKeyValue = {
                district_uuid: req.query.district_uuid, // str district uuid
                active: 1,
            }
            var key = ["CAST(province_uuid AS CHAR(16)) AS province_uuid"]
            var orderby = "province_uuid"
            var ordertype = "ASC"

            //fire sql query to get the province uuid for the perticular district
            var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)

            // check if the result is there and responce accordingly
            if (objResponce.length === 0) {
                return res.status(400).send({ message: 'District not found' })
            }
            // deleting the perticular district+provience_id variable from the redis 
            redisMaster.delete('district' + objResponce[0].province_uuid)

            // varibles for sql query to search the district
            var searchKeyValue = {
                district_uuid: req.query.district_uuid,
                active: 1
            }

            // fire sql query to update the active value to 0
            const result = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = result;
            const message = !affectedRows ? 'District not found' :
                affectedRows && changedRows ? 'District delete successfully' : 'Delete failed as data allready deleted';

            //send responce to the front end
            res.send({ message, info });

        } catch (error) {
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

module.exports = new districtController();