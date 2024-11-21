const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')
const redisMaster = require('../common/master/radisMaster.common')

const roles = require('../utils/userRoles.utils')

// const { toIsoString } = require('../common/timeFunction.common')

class loginReasonController {
    tableName1 = 'er_master_login_reason'

    createLoginReason = async (req, res) => {
        try{
            // body and query check
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                console.log('loginReason/createLoginReason',JSON.stringify(req.body), JSON.stringify(req.query))
                var date = new Date();
                date.setHours(date.getHours() + 4, date.getMinutes() + 30);
                var isodate = date.toISOString();

            // variable for sql query
                var param = {
                    reason_uuid: "uuid()",
                    reason: req.body.reason, //str name
                    created_on: isodate, //dt current date time
                    created_by: req.body.user_detials.id, // str user id
                    created_by_type: ( req.body.user_detials.type == roles.Admin || req.body.user_detials.type == roles.SubAdmin ) ? 1 : 2,
                    active : 1
                }

            // fire sql query to create new country
                const objresult = await sqlQuery.createQuery(this.tableName1, param)

            //check result and responce accordingly
                res.status(201).send({ message: 'login reason created successfully' });

            // delete country data from radis server
                redisMaster.delete('loginReason')
                
        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    getLoginReason = async (req, res) => {
        try{
            // check body / query 
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                // console.log('loginReason/getLoginReason',JSON.stringify(req.body), JSON.stringify(req.query))
                // call radis to get the country names
            redisMaster.get('loginReason', async(err, reply) => {

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
                    var key = ["CAST(reason_uuid AS CHAR(16)) AS reason_uuid", "reason"]
                    var orderby = "reason"
                    var ordertype = "ASC"

                    // fire sql query to get str country_uuid, str country_name
                    const lisresults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, searchKeyValue, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (lisresults.length === 0) {
                        return res.status(204).send({ message: 'login reason not found' })
                    }

                    //convert data to string and send to the radis server
                    const strResponse = JSON.stringify(lisresults)
                    redisMaster.post('loginReason', strResponse)

                    //send responce to the front end
                    return res.status(200).send(lisresults)
                }

                //as radis contain the data change back it to json and then send it to front end
                res.status(200).send(JSON.parse(reply))
            })

        }catch(error){
            console.log(error);
            res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to update the login reason
    updateLoginReason = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('loginReason/updateLoginReason',JSON.stringify(req.body), JSON.stringify(req.query))
            //variables for sql query
                var param = {
                    reason: req.body.reason, //str login reason name
                }
                var searchKeyValue = {
                    reason_uuid: req.body.reason_uuid, //str login reason uuid
                    active: 1
                }

            // fire sql query to update login resaon name
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Login Reason not found' :
                affectedRows && changedRows ? 'login reason updated successfully' : 'login reason updated successfully';

            // send responce to fornt end
            res.send({ message, info });

            // delete data front front end as it had been changed
            redisMaster.delete('loginReason')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    
    deleteLoginReason = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('loginReason/deleteLoginReason',JSON.stringify(req.body), JSON.stringify(req.query))
            //variable for sql query
            const param = {
                active: 0
            }
            var searchKeyValue = {
                reason_uuid: req.query.reason_uuid, //str country uuid
                active: 1
            }

            // fire sql query change active value to 0
            const bojResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = bojResult;
            const message = !affectedRows ? 'login resaon not found' :
                affectedRows && changedRows ? 'login resaon delete successfully' : 'login resason allready deteted';

            // send responce to the front end
            res.send({ message, info });

            // delete thhe data fron redis server
            redisMaster.delete('loginReason')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }
}

module.exports = new loginReasonController()