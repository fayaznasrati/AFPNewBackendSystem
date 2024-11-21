const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

const sqlQuery = require('../common/sqlQuery.common')
const sqlQueryReplica = require('../common/sqlQueryReplica.common')

// const { toIsoString } = require('../common/timeFunction.common')

class postpaidController {
    tableName1 = "er_postpaid_commission"
    tableName2 = "er_login"

    //function to create post paid commision 
    createPostpaidCommission = async(req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            console.log('postPaid/createPostPaidCommission',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();
            
            //create postpaid commission data
            var param = {
                pc_uuid: "uuid()",
                user_uuid: req.body.user_detials.user_uuid, //str used uuid
                userid: lisResponce[0].userid, //str used id
                wallet1: req.body.commission1, //db wallet1 commision
                wallet2: req.body.commission2, //db wallet2 commision
                wallet3: req.body.commission3, //db wallet3 commision
                wallet4: req.body.commission4, //db wallet4 commision
                wallet5: req.body.commission5, //db wallet5 commision
                created_on: isodate, //dt current date time
                last_modified_on: isodate, //dt current date time
                created_by: req.body.user_detials.id, //str user id
                last_modified_by: req.body.user_detials.id, //str user id
            }

            //fire sql query and send relative responce to front end
            const objResult = await sqlQuery.createQuery(this.tableName1, param)

            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'PostPaid Commission created successfully !!' });

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to get post paid commision by user id
    getPostPaidData = async(req, res, next) => {
        try {
            this.checkValidation(req);
            // console.log('postPaid/getPostPaidData',JSON.stringify(req.body), JSON.stringify(req.query))
            // variable for sql query
            var offset = req.query.start
            var limit = req.query.end - offset

            var searchKeyValue = {
                user_uuid: req.body.user_detials.user_uuid, //str user_uuid
            }
            var key = ["CAST(pc_uuid AS CHAR(16)) AS pc_uuid", "wallet1 AS salaamCommission", "wallet2 AS etisalatCommission", "wallet3 AS roshanCommission", "wallet4 AS mtnCommission", "wallet5 AS awccCommission"]
            var orderby = "created_on"
            var ordertype = "DESC"

            //fires sql query to get str pc_uuid, db wallet1, db wallet2, db wallet3, db wallet4, db wallet5
            const lisResponce = await sqlQueryReplica.searchQuery(this.tableName1, searchKeyValue, key, orderby, ordertype, limit, offset)

            if (!lisResponce) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponce.length === 0) {
                return res.status(204).send({ message: 'No postpaid Commission found !!' })
            }

            res.status(200).send(lisResponce)

        } catch (error) {
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }
    }

    //function to update the post paid commision
    updatepostpaidCommission = async(req, res, next) => {
        try {

            this.checkValidation(req);
            console.log('postPaid/updatePostPaidCommission',JSON.stringify(req.body), JSON.stringify(req.query))
            var date = new Date();
            date.setHours(date.getHours() + 4, date.getMinutes() + 30);
            var isodate = date.toISOString();

            //variable for sqlQuery

            var param = {
                last_modified_on: isodate, //dt current date time
                last_modified_by: req.body.user_detials.id, //str 
            }

            // optiona update variables
            if (req.body.salaamCommission) { // check if commision is given or not
                param.wallet1 = req.body.salaamCommission //db wallet1
            }
            if (req.body.etisalatCommission) { // check if commision is given or not
                param.wallet2 = req.body.etisalatCommission //db wallet2
            }
            if (req.body.roshanCommission) { // check if commision is given or not
                param.wallet3 = req.body.roshanCommission //db wallet3
            }
            if (req.body.mtnCommission) { // check if commision is given or not
                param.wallet4 = req.body.mtnCommission //db wallet4
            }
            if (req.body.awccCommission) { // check if commision is given or not
                param.wallet5 = req.body.awccCommission //db wallet5
            }

            //check if the update param is proper or not 
            if (Object.keys(param).length === 2) return res.status(400).send({ message: 'invalid update query' })

            var searchKeyValue = {
                pc_uuid: req.body.pc_uuid //str pc_uuid
            }

            //fire sql query and send relative responce to front end
            const objResult = await sqlQuery.updateQuery(this.tableName1, param, searchKeyValue);

            if (!objResult) {
                throw new HttpException(500, 'Something went wrong');
            }

            const { affectedRows, changedRows, info } = objResult;

            const message = !affectedRows ? 'postpaid commission not found' :
                affectedRows && changedRows ? 'postpaid commission updated successfully' : 'Details Updated';

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

module.exports = new postpaidController;