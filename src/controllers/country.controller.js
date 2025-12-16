const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

const redisMaster = require('../common/master/radisMaster.common')

// const { toIsoString } = require('../common/timeFunction.common')

class countryController {
    // table name
    tableName1 = 'er_master_country'

    // function to create country 
    createCountry = async(req, res, next) => {
        try {
             //  console.log('country/createCountry',JSON.stringify(req.body), JSON.stringify(req.query))
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            // variable for sql query
            var param = {
                country_uuid: "uuid()",
                country_name: req.body.name, //str name
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, // str user id
                last_modified_by: req.body.user_detials.id, // str user id
            }

            // fire sql query to create new country
            const objresult = await sqlQuery.createQuery(this.tableName1, param)

            //check result and responce accordingly
            res.status(201).send({ message: 'Country created successfully' });

            // delete country data from radis server
            redisMaster.delete('country')

        } catch (error) {
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to send all countries name with uuid
    allCountry = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //  //  console.log('country/allCountry',JSON.stringify(req.body), JSON.stringify(req.query))
            // call radis to get the country names
            redisMaster.get('country', async(err, reply) => {

                // var offset = req.query.start
                // var limit = req.query.end - offset

                // check if redis reply contain the data or not
                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {

                    // call sql for ountry data as radis dont have it 
                    // variables for sql query
                    var searchKeyValue = {
                        active: 1,
                    }
                    var key = ["CAST(country_uuid AS CHAR(16)) AS country_uuid", "country_name AS name"]
                    var orderby = "country_name"
                    var ordertype = "ASC"

                    // fire sql query to get str country_uuid, str country_name
                    const lisresults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (lisresults.length === 0) {
                        return res.status(204).send({ message: 'Country not found' })
                    }

                    //convert data to string and send to the radis server
                    const strResponse = JSON.stringify(lisresults)
                    redisMaster.post('country', strResponse)

                    //send responce to the front end
                    return res.status(200).send(lisresults)
                }

                //as radis contain the data change back it to json and then send it to front end
                res.status(200).send(JSON.parse(reply))
            })

        } catch (error) {
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to update the country name
    updateCountry = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('country/updateCountry',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variables for sql query
            var param = {
                country_name: req.body.name, //str country name
                last_modified_on: isodate, // dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
            }
            var searchKeyValue = {
                country_uuid: req.body.country_uuid, //str country uuid
                active: 1
            }

            // fire sql query to update country name
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'country not found' :
                affectedRows && changedRows ? 'country updated successfully' : 'Details Updated';

            // send responce to fornt end
            res.send({ message, info });

            // delete data front front end as it had been changed
            redisMaster.delete('country')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // delete function to delete the country by changing active to 0
    deleteCountry = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('country/deleteCountry',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sql query
            const param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str user id
                active: 0
            }
            var searchKeyValue = {
                country_uuid: req.query.country_uuid, //str country uuid
                active: 1
            }

            // fire sql query change active value to 0
            const bojResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = bojResult;
            const message = !affectedRows ? 'country not found' :
                affectedRows && changedRows ? 'country delete successfully' : 'Delete Failed, allready deteted';

            // send responce to the front end
            res.send({ message, info });

            // delete thhe data fron redis server
            redisMaster.delete('country')

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

module.exports = new countryController;