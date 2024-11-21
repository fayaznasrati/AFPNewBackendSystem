const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const redisMaster = require('../common/master/radisMaster.common')
const sqlQuery = require('../common/sqlQuery.common');
const sqlQueryReplica = require('../common/sqlQueryReplica.common');

// const { toIsoString } = require('../common/timeFunction.common')

class provinceController {
    // table name
    tableName1 = "er_master_province"
    tableName2 = "er_master_region"

    //function to create proveience
    createProvince = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('province/createProvince',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            const strRegionUuid = req.body.region_uuid //str region uuid

            //variable for sql query to check the region name
            var searchKeyValue = {
                region_uuid: req.body.region_uuid, //str region uuid
                region_name: req.body.regionName, //str region name
                active: 1,
            }
            var key = ["COUNT(1)"]
            var orderby = "country_name"
            var ordertype = "ASC"

            // fire sql query to get str country_name
            const objResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!objResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!objResponce[0]["COUNT(1)"]) {
                return res.status(400).json({ errors: [ {msg : 'Region not found'}] });
            }

            //variables for sql query to create provience 
            var param = {
                province_uuid: "uuid()",
                province_name: req.body.name, //str provience name
                region_uuid: req.body.region_uuid, //str region uuid
                region_name: req.body.regionName, //str region name
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, //str user id
                last_modified_by: req.body.user_detials.id, // str user id
            }

            //fire sql query to create provience
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            // check if the result is there and responce accordingly]
            res.status(201).send({ message: 'province successfully created!' });

            // delete data from the redis using provienc+country uuid
            redisMaster.delete('province' + strRegionUuid)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get provience by country uuid
    provinceByRegionUuid = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('province/provinceByRegionUuid',JSON.stringify(req.body), JSON.stringify(req.query))
            const strRegionUuid = req.query.region_uuid //str country uuid

            // check in redis if there is data or not
            redisMaster.get('province' + strRegionUuid, async(err, reply) => {

                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    //no data in redis check in sql and add data to redis
                    //variable for sql query to get provience
                    var searchKeyValue = {
                        region_uuid: strRegionUuid, //str region uuid
                        active: 1,
                    }
                    var key = ["CAST(province_uuid AS CHAR(16)) AS province_uuid", "province_name AS name"]
                    var orderby = "province_name"
                    var ordertype = "ASC"

                    // fire sql query to get all provience
                    const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (!lisResults) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (lisResults.length === 0) {
                        return res.status(204).send({ message: 'Provience not found !!' })
                    }

                    // convert the json to string and send it to redis server
                    const strResponse = JSON.stringify(lisResults)
                    redisMaster.post('province' + strRegionUuid, strResponse)

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

    //function to updae the proviendce name
    updateProvince = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('province/updateProvince',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            var searchKeyValue = {
                province_uuid: req.body.province_uuid, // str property uuid
                active: 1,
            }
            var key = ["CAST(region_uuid AS CHAR(16)) AS region_uuid", "region_name"]
            var orderby = "region_name"
            var ordertype = "ASC"

            // fire sql query to to get str country uuid
            const lisResponce1 = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)
            if (!lisResponce1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponce1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'Region not found'}] });
            }
            redisMaster.delete('province' + lisResponce1[0].region_uuid)

            if (req.body.region_uuid !== lisResponce1[0].region_uuid || req.body.regionName !== lisResponce1[0].region_name) {

                // variable for sql query to check if the country name is there and active
                var searchKeyValue = {
                    region_uuid: req.body.region_uuid, //str region_uuid
                    region_name: req.body.regionName, //str regionName
                    active: 1,
                }
                var key = ["COUNT(1)"]
                var orderby = "region_name"
                var ordertype = "ASC"

                // fire sql query to get str country name
                const lidResponce2 = await sqlQueryReplica.searchQueryNoLimit(this.tableName2, searchKeyValue, key, orderby, ordertype)

                // check if the result is there and responce accordingly
                if (!lidResponce2[0]["COUNT(1)"]) {
                    return res.status(204).send({ message: 'No Such Country avaliable !!' })
                }

                // delete provience uuid and name from redis as changes are made in db
                redisMaster.delete('province' + req.body.region_uuid)
            }

            // now update the provience
            // variable for sql query toupdate the data
            var param = {
                province_name: req.body.name, //str provience name
                region_uuid: req.body.region_uuid, //str region uuid
                region_name: req.body.regionName, //str region name
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, // str user id
            }
            var searchKeyValue = {
                province_uuid: req.body.province_uuid,
                active: 1
            }

            //fire the sql query to update the pprovience
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Province not found' :
                affectedRows && changedRows ? 'Province updated successfully' : 'Details Updated';

            // delete the data from redis server
            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // delete -> deactivat te provience 
    deleteProvince = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('province/deleteProvince',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get the current county uuid and delete data from redis
            var searchKeyValue = {
                province_uuid: req.query.province_uuid,
            }
            var key = ["CAST(region_uuid AS CHAR(16)) AS region_uuid"]
            var orderby = "region_uuid"
            var ordertype = "ASC"

            // fire sql query to to get the country uuid
            var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)
            if (objResponce.length === 0) {
                return res.status(204).send({ message: 'No province is avaliable !!' })
            }
            // delete the data from redos
            redisMaster.delete('province' + objResponce[0].region_uuid)


            // variable for sql query to get the country uuid
            const param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, // str user id
                active: 0
            }
            var searchKeyValue = {
                province_uuid: req.query.province_uuid, // str property uuid
                active: 1
            }

            // fire sql query to to checnge the active state
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Province not found' :
                affectedRows && changedRows ? 'Province delete successfully' : 'delete faild, allready deleted';

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

module.exports = new provinceController();