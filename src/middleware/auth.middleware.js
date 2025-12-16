const HttpException = require('../utils/HttpException.utils');

const UserModel = require('../models/admin.model');
const agentModule = require('../models/agent.module')

const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
const path = require('path');

const redisMaster = require('../common/master/radisMaster.common')

// configer env
dotenv.config()

const userRoles = require('../utils/userRoles.utils')

const auth = (...roles) => {
    return async function(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            // console.log("token : ", authHeader)
            // console.log('username : ', req.query)
            // console.log('body : ', req.body)
            const bearer = 'Bearer ';

            if (!authHeader || !authHeader.startsWith(bearer)) {
                return res.status(400).json({ errors: [ {msg : 'Access denied. No credentials sent!'}] });
            }

            const token = authHeader.replace(bearer, '');
            const secretKey = process.env.SECRET_JWT || "";

            // Verify Token
            const decoded = jwt.verify(token, secretKey);
            // console.log(decoded,req.query.username)
            //const user = await UserModel.findOne({ id: decoded.user_id });
             const username = decoded.user_id;
            const SESSION_IDLE_TIME = Number(process.env.SESSION_IDLE_TIME || 900);
         
            //to verify admin
            if(decoded.userType == userRoles.Admin || decoded.userType == userRoles.SubAdmin) {
           // 🔐 Redis session check
            const redisKey = `admin_login_session_${username}`;
            let sessionToken = await redisMaster.asyncGet(redisKey);

            if (!sessionToken || sessionToken !== token) {
              return res.status(401).json({
                errors: [{ msg: 'jwt expired' }]
              });
            }
                let user
                let strUser = await redisMaster.asyncGet(`AUTH_SUB_ADMIN_${decoded.user_id}`)

                if( strUser ){
                    user = JSON.parse(strUser)
                    // await redisMaster.exp(redisKey, SESSION_IDLE_TIME);
                }else{
                     // 🔁 Sliding expiration
                    // await redisMaster.exp(redisKey, SESSION_IDLE_TIME);
                    user = await UserModel.findOne({ username: decoded.user_id });
                    if(user){
                        redisMaster.post(`AUTH_SUB_ADMIN_${decoded.user_id}`, JSON.stringify(user))
                    }
                }

                if (!user) {
                    return res.status(400).json({ errors: [ {msg : 'Authorization failed'}] });
                }
                await redisMaster.exp(redisKey, SESSION_IDLE_TIME);

                // console.log(user)
                // check if the current user is the owner user
                const ownerAuthorized = req.query.username == user.username;

                // if the current user is not the owner and
                // if the user role don't have the permission to do this action.
                // the user will get this error
                if (!ownerAuthorized || (roles.length && !roles.includes(user.usertype))) {
                    return res.status(400).json({ errors: [ {msg : 'Unauthorized'}] });
                }

                let region_list = [0]
                if ( user.region_id != "" ) region_list = user.region_id.split(',')

                // adding user details in the req

                var user_detials = {
                    id: user.admin_userid, // admin or sub admin user id
                    username: user.username, // admin or sub admin user Name
                    type: user.usertype, // admin or sub admin
                    department: user.usertype_id, // department id
                    name: user.full_name,   // admin or sub admin user full_name
                    mobile : user.mobile || 0, // admin or sub admin mobile number
                    userid: process.env.USER_id, //default id from er_login table
                    user_uuid: process.env.USER_UUID,   // default uuid from er login table
                    region_list : region_list, // allocated region list
                    region_id : 0
                };

                req.body.user_detials = user_detials

                // if the user has permissions
                req.currentUser = user;
                next();
            }

            // to verify admin as agent 
            if(decoded.userType == "Admin-Agent"){

                 // 🔐 Redis session check
            const redisKey = `agent_login_session_${username}`;
            const sessionToken = await redisMaster.asyncGet(redisKey);

            if (!sessionToken || sessionToken !== token) {
              return res.status(401).json({
                errors: [{ msg: 'jwt expired' }]
              });
            }
                let user = await agentModule.searchAgentid(decoded.agent_id) 
                // console.log(user)

                if (!user) {
                    return res.status(400).json({ errors: [ {msg : 'Authorization failed'}] });
                }
                // console.log(req.query.username ,user.username)
                const ownerAuthorized = req.query.username == user.username;
                // console.log(ownerAuthorized)

                if (!ownerAuthorized || (roles.length && !roles.includes(user.usertype))) {
                    return res.status(400).json({ errors: [ {msg : 'Unauthorized'}] });
                }

                // adding user details in the req

                var user_detials = {
                    userid: user.userid, // agent user id
                    user_uuid: user.user_uuid, // agent user id
                    type: userRoles.usertype_id, // agent type ( like distributer, retailer or etc )
                    name : user.full_name,
                    region_id : 0,
                };

                // console.log(user_detials)

                req.body.user_detials = user_detials

                // if the user has permissions
                req.currentUser = user;
                next();

            }

            // to verify agent
            if(decoded.userType == userRoles.Agnet){
                // console.log(decoded)

                       // 🔐 Redis session check
            const redisKey = `agent_login_session_${req.query.username}`;
            const sessionToken = await redisMaster.asyncGet(redisKey);

            if (!sessionToken || sessionToken !== token) {
              return res.status(401).json({
                errors: [{ msg: 'jwt expired' }]
              });
            }
               await redisMaster.exp(redisKey, SESSION_IDLE_TIME);
                let user = await agentModule.searchAgentid(decoded.user_id) 
                // console.log(user)

                if (!user) {
                    return res.status(400).json({ errors: [ {msg : 'Authorization failed'}] });
                }


                if (user.user_status != 1) {
                    return res.status(400).json({ errors: [ {msg : 'user is In-Active'}] });
                }

                if (user.fource_logout == 1){
                    return res.status(400).json({ errors: [ {msg : "user is force logOut, login again"}] });
                }

                // console.log(req.query.username ,user.username)
                const ownerAuthorized = req.query.username == user.username;
                // console.log(ownerAuthorized)

                // get agent type and verify each agen type
                // console.log(user)
                if (!ownerAuthorized || (roles.length && !roles.includes(user.usertype_id))) {
                    return res.status(400).json({ errors: [ {msg : 'Unauthorized'}] });
                }

                let child_list = [0];
                if(user.child_id != "") child_list = user.child_id.split(",")

                // adding user details in the req

                var user_detials = {
                    userid: user.userid,    // agent user id
                    username : user.username,
                    user_uuid: user.user_uuid,  // agent user uuid
                    type: user.usertype_id, // agent type (like 'distributer', 'retailer', etc)
                    name : user.full_name,
                    mobile : user.mobile || 0,
                    child_list : child_list,
                    region_id : user.region_id
                };

                // console.log(user_detials)

                req.body.user_detials = user_detials

                // if the user has permissions
                req.currentUser = user;
                next();
            }

        } catch (e) {
            if(e.message != 'jwt expired'){
                console.log(e.message);
            }
            return res.status(400).json({ errors: [ {msg : e.message}] });
            // e.status = 400;
            // next(e.message);
        }
    }
}

module.exports = auth;