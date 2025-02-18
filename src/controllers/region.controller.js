const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const redisMaster = require('../common/master/radisMaster.common')

const role = require('../utils/userRoles.utils')

const accessFilter = require('../common/accessFilter.common')

// const { toIsoString } = require('../common/timeFunction.common')

class regionController {
    // tablen name
    tableName1 = "er_master_region"
    tableName2 = "er_master_country"
    tableName3 = "er_login"

    //function to create region
    createRegion = async(req, res, next) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('region/createRegion',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            const strCountryUuid = req.body.country_uuid //str country uuid

            //check for country name and id 
            //variable for sql query to check the country name
            var searchKeyValue = {
                country_uuid: req.body.country_uuid, //str country uuid
                country_name: req.body.countryName,
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
                return res.status(400).json({ errors: [ {msg : 'Country not found'}] });
            }

            //variable for sqlQuery to create region
            var param = {
                region_uuid: "uuid()",
                region_name: req.body.name, //str region name
                country_uuid: req.body.country_uuid, //str country uuid
                country_name: req.body.countryName, //str country name
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, //str user id
                last_modified_by: req.body.user_detials.id, //str user id
            }

            //fire sql query to created region
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'Region successfully created!' });

            //delete data from redis 
            redisMaster.delete('region' + strCountryUuid)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //fucntion to display all regions
    allRegion = async(req, res,next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('region/allRegion',JSON.stringify(req.body), JSON.stringify(req.query))
            const strCountryUuid = req.query.country_uuid || 'fc019da8-dfa4-11' //str country uuid
            let filterResponce
            //check in redis if region data is there or not
            redisMaster.get('region' + strCountryUuid, async(err, reply) => {

                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    //no data in redis, get data from redis and data in redis Server
                    //variable for sqlQuery to get regiosn

                    var searchKeyValue = {
                        country_uuid: strCountryUuid, //str country uuid
                        active: 1,
                    }
                    var key = ["CAST(region_uuid AS CHAR(16)) AS region_uuid", "region_name AS name"]
                    var orderby = "region_name"
                    var ordertype = "ASC"

                    // fire sql query to get all the regiosn
                    const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (!lisResults) {
                        throw new HttpException(500, 'Something went wrong');
                    }
                    if (lisResults.length === 0) {
                        return res.status(204).send({ message: 'Region not found' })
                    }

                    //convet the data to string to send to redis server
                    const strResponse = JSON.stringify(lisResults)
                    redisMaster.post('region' + strCountryUuid, strResponse)

                    // var offset = req.query.start
                    // var limit = req.query.end > lisResults.length ? lisResults.length : req.query.end - offset + 1

                    //send responce to front end
                    // return res.status(200).send(lisRegion.slice(offset, limit))
                    if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin){
                        filterResponce = await accessFilter.regionFilter(lisResults,req.body.user_detials.region_list,req.body.user_detials.type)
                    }
                    else{
                        filterResponce = await accessFilter.regionFilter(lisResults,req.body.user_detials.user_uuid,req.body.user_detials.type)
                    }
                    return res.status(200).send(filterResponce)
                }

                var lisRegion = JSON.parse(reply)

                // var offset = req.query.start
                // var limit = req.query.end > lisRegion.length ? lisRegion.length : req.query.end - offset + 1

                //redis have the data, convert string to json and send it to frontend
                // return res.status(200).send(lisRegion.slice(offset, limit))
                // regionFilter(query,username,type)
                if(req.body.user_detials.type == role.Admin || req.body.user_detials.type == role.SubAdmin){
                    let strRegionList = await redisMaster.asyncGet('ALLOWED_REGION_SUB_ADMIN_'+req.body.user_detials.username)
                    if(strRegionList == null){
                        filterResponce = await accessFilter.regionFilter(lisRegion,req.body.user_detials.region_list,req.body.user_detials.type)
                        redisMaster.post('ALLOWED_REGION_SUB_ADMIN_'+req.body.user_detials.username,JSON.stringify(filterResponce))
                    }else{
                        filterResponce = JSON.parse(strRegionList)
                    }
                }
                else{
                    let strRegionList = await redisMaster.asyncGet('ALLOWED_REGION_AGENT_'+req.body.user_detials.username)
                    if(strRegionList == null){
                        filterResponce = await accessFilter.regionFilter(lisRegion,req.body.user_detials.user_uuid,req.body.user_detials.type)
                        redisMaster.post('ALLOWED_REGION_AGENT_'+req.body.user_detials.username,JSON.stringify(filterResponce))
                    }else{
                        filterResponce = JSON.parse(strRegionList)
                    }
                }
                // console.log(filterResponce)
                return res.status(200).send(filterResponce)
            })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //fucntion to display all regions
    allRegionbyParentId = async(req, res,next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('region/allRegionByParentId',JSON.stringify(req.body), JSON.stringify(req.query))
            // get parent id and its region
            var searchKeyValue = {
                user_uuid : req.query.parent_uuid,
                Active : 1
            }
            var key = ["CAST(region_uuid AS CHAR(16)) AS region_uuid","region_name as regionName"]
            var orderby = "region_name"
            var ordertype = "ASC"

            var lisRegion = await sqlQueryReplica.searchQuery(this.tableName3, searchKeyValue, key, orderby, ordertype, 1, 0)
            if(lisRegion.length == 0) return res.status(400).json({ errors: [ {msg : "user not found"}] });

            res.status(200).send(lisRegion)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getRegionDetails = async (req, res) => {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('region/getRegionDetails',JSON.stringify(req.body), JSON.stringify(req.query))
            var searchKeyValue = {
                region_uuid: req.query.region_uuid, //str country uuid
                active: 1,
            }
            var key = ["CAST(region_uuid AS CHAR(16)) AS region_uuid", "region_name AS regionName","CAST(country_uuid AS CHAR(16)) AS country_uuid","country_name AS countryName"]
            var orderby = "region_name"
            var ordertype = "ASC"

            // fire sql query to get all the regiosn
            const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)
            
            // check if the result is there and responce accordingly
            if (!lisResults) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResults.length === 0) {
                return res.status(204).send({ message: 'Region not found' })
            }

            res.status(200).send(lisResults[0])

        }catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update the region data
    updateRegion = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('region/updateRegion',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // get current region country name
            // get the current county uuid and delete data from redis
            var searchKeyValue = {
                region_uuid: req.body.region_uuid, // str property uuid
                active: 1,
            }
            var key = ["CAST(country_uuid AS CHAR(16)) AS country_uuid", "country_name"]
            var orderby = "country_uuid"
            var ordertype = "ASC"

            // fire sql query to to get str country uuid
            const lisResponce1 = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 100, 0)
            if (!lisResponce1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponce1.length === 0) {
                return res.status(400).json({ errors: [ {msg : 'country not found'}] });
            }

            // delete the data from redis as the data corresponding to given country got change
            redisMaster.delete('region' + lisResponce1[0].country_uuid)

            if (req.body.country_uuid !== lisResponce1[0].country_uuid || req.body.countryName !== lisResponce1[0].country_name) {

                // variable for sql query to check if the country name is there and active
                var searchKeyValue = {
                    country_uuid: req.body.country_uuid, //str country uuid
                    country_name: req.body.countryName, //str country name
                    active: 1,
                }
                var key = ["COUNT(1)"]
                var orderby = "country_name"
                var ordertype = "ASC"

                // fire sql query to get str country name
                const lidResponce2 = await sqlQueryReplica.searchQuery(this.tableName2, searchKeyValue, key, orderby, ordertype, 100, 0)

                // check if the result is there and responce accordingly
                if (!lidResponce2) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (!lidResponce2[0]["COUNT(1)"]) {
                    return res.status(400).json({ errors: [ {msg : 'country not found'}] });
                }

                // delete region uuid and name from redis as changes are made in db
                redisMaster.delete('region' + req.body.country_uuid)
            }

            //variable for sqlQuery to update region
            var param = {
                region_name: req.body.name, //str region name
                country_uuid: req.body.country_uuid, //str country uuid
                country_name: req.body.countryName, //str country name
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
            }
            var searchKeyValue = {
                region_uuid: req.body.region_uuid, //str region uuid
                active: 1
            }

            //fire sql query to update region
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Region not found' :
                affectedRows && changedRows ? 'Region updated successfully' : 'Details Updated';

            res.send({ message, info });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to delete -> update active status of region
    deleteRegion = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('region/deleteRegion',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //check region uuid in the er_login table
                var searchKeyValue = {
                    region_uuid: req.query.region_uuid,
                    Active : 1
                }
                var key = ["COUNT(1)"]
                var orderby = "region_uuid"
                var ordertype = "ASC"

                // fire sql query to to get the country uuid
                var objResponce = await sqlQueryReplica.searchQueryNoLimit(this.tableName3, searchKeyValue, key, orderby, ordertype)

                if (objResponce[0]["COUNT(1)"]) return res.status(400).send({ message:'region is being used in some agent details'})

            // get the current county uuid and delete data from redis
                var searchKeyValue = {
                    region_uuid: req.query.region_uuid,
                }
                var key = ["CAST(country_uuid AS CHAR(16)) AS country_uuid"]
                var orderby = "country_uuid"
                var ordertype = "ASC"

            // fire sql query to to get the country uuid
                var objResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)
                if (!objResponce) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (objResponce.length === 0) {
                    return res.status(204).send({ message: 'Region not found' })
                }
            // delete the data from redos
                isMaster.delete('region' + objResponce[0].country_uuid)

            //variable for sqlQuery to to update status
                const param = {
                    last_modified_on: isodate, //dt current date time
                    last_modified_by: req.body.user_detials.id, //str user id
                    active: 0
                }
                var searchKeyValue = {
                    region_uuid: req.query.region_uuid, //str region uuid
                    active: 1
                }

            // fire sql query to delete -> update active status
                const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
                if (!objResult) {
                    throw new HttpException(500, 'Something went wrong');
                }
                const { affectedRows, changedRows, info } = objResult;
                const message = !affectedRows ? 'Region not found' :
                    affectedRows && changedRows ? 'Region delete successfully' : 'delete faild, allready deleted';
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

module.exports = new regionController;