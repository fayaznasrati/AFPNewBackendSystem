const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');
const redisMaster = require('../common/master/radisMaster.common')

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

class languageController {
    // sql table names
    tableName1 = "er_master_language"
        // function to create language
    createLanguage = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('language/createLanguage',JSON.stringify(req.body), JSON.stringify(req.query))
            // variable for sql query

            var param = {
                lang_uuid: 'uuid()',
                lang_name: req.body.name, // str language name
                lang_symbol: req.body.symbol // str language symbol
            }

            // fire sql query to create language
            const onjResult = await sqlQuery.createQuery(this.tableName1, param)

            // check if the result is there and responce accordingly

            //send responce to frontend
            res.status(201).send({ message: 'Language successfully created!' });

            // delete the data from the redis
            redisMaster.delete('language')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to get all the languages
    allLanguage = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // console.log('language/allLanguage',JSON.stringify(req.body), JSON.stringify(req.query))

            // check in the redis if it contain some data related to language or not
            redisMaster.get('language', async(err, reply) => {

                if (err) {
                    throw new HttpException(500, 'Something went wrong');
                }
                if (reply === null || reply === undefined) {
                    // check in sql data base nd update the redis with the data
                    // variable for sql query
                    // var offset = req.query.start
                    // var limit = req.query.end - offset
                    var key = ["CAST(lang_uuid AS CHAR(16)) AS lang_uuid", "lang_symbol AS symbol", "lang_name AS name"]
                    var orderby = "lang_name"
                    var ordertype = "ASC"

                    // fire sql query to get the str language name, str language uuid
                    const lisResults = await sqlQueryReplica.searchQueryNoLimit(this.tableName1, key, orderby, ordertype)

                    // check if the result is there and responce accordingly
                    if (lisResults.length === 0) {
                        return res.status(204).send({ message: 'Language not found' })
                    }

                    // convert the sql result, jeson to string to save in the redis server  
                    const strResponse = JSON.stringify(lisResults)
                    redisMaster.post('language', strResponse)

                    // sending responce the the frontend
                    return res.status(200).send(lisResults)
                }
                // if redis contain the language data then convert it into json and send to the frontend
                res.status(200).send(JSON.parse(reply))
            })

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update language name or symbole
    updateLanguage = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('language/updateLanguage',JSON.stringify(req.body), JSON.stringify(req.query))
            // variable for sql query
            var param = {}
            if (req.body.symbol) {
                param.lang_symbol = req.body.symbol //str language symbol
            }
            if (req.body.name) {
                param.lang_name = req.body.name //str language name
            }

            //check if any thing is to be update
            if (Object.keys(param).length === 0) {
                return res.status(400).json({ errors: [ {msg : "Update field not found"}] });
            }
            var searchKeyValue = {
                lang_uuid: req.body.lang_uuid
            }

            // fire sql query to update language name or symbol
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, changedRows, info } = objResult;
            const message = !affectedRows ? 'Language not found' :
                affectedRows && changedRows ? 'Language updated successfully' : 'Details Updated';

            // send responce to front end
            res.send({ message, info });

            // delete data redis server
            redisMaster.delete('language')

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    // function to delete data from sql server
    deleteLanguage = async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('language/deleteLanguage',JSON.stringify(req.body), JSON.stringify(req.query))
            //varibles from sql query
            var searchKeyValue = {
                lang_uuid: req.query.lang_uuid // str language uuid
            }

            // sql delete query
            const objResult = await sqlQuery.deleteQuery(this.tableName1, searchKeyValue);

            // check if the result is there and responce accordingly
            const { affectedRows, info, warningStatus } = objResult;
            const message = !affectedRows ? 'Language not found' :
                affectedRows && !warningStatus ? 'Language delete successfully' : 'Delete faild, as language allready deleted';

            // send response to the frontend
            res.send({ message, info });

            // delete sql data from redis server
            redisMaster.delete('language')

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
module.exports = new languageController()