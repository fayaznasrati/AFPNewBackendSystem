const UserModel = require('../models/admin.model');
const agentModule = require('../models/agent.module')

const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

const sqlQuery = require('../common/sqlQuery.common')

const userRoles = require('../utils/userRoles.utils');
const apiMethod = require('../utils/apiMethod.utils');
// const { tableName1 } = require('../controllers/agentLoginFun.controller');

const forceLogOutCheck = () => {

    return async function(req, res, next) {
        try{

            const tableName1 = "er_login"

            // admin force logout check 
            if(req.body.user_detials.type == userRoles.Admin){
                // console.log('Checking admin force Logout')
                return next()
            }

            // subadmin force logout check
            if(req.body.user_detials.type == userRoles.SubAdmin){
                // console.log('Checking sub-admin force Logout')
                return next()
            }

            // agent force logout check
            if(req.body.user_detials.type != userRoles.SubAdmin && req.body.user_detials.type != userRoles.Admin){
                // console.log('Checking agent force Logout')
                // get status from er login 
                // console.log(tableName1)
                const statusResponce = await sqlQuery.searchQuery(tableName1,{user_uuid : req.body.user_detials.user_uuid},['fource_logout'],'userid','ASC',1,0)
                if(statusResponce.length == 0) return res.status(400).json({ errors: [ {msg : "user not found"}] });
                if(statusResponce[0].fource_logout == 1) return res.status(400).json({ errors: [ {msg : "user is force logOut, login again"}] });
                return next()
            }
            
        }catch(error){
            console.log(error);
            return res.status(400).json({ errors: [ {msg : error.message}] });
        }       
    }
}

module.exports = forceLogOutCheck;