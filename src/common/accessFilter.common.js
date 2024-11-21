const sqlQuery = require("./sqlQueryReplica.common")
const role = require("../utils/userRoles.utils")
const HttpException = require('../utils/HttpException.utils');

const redisMaster = require("./master/radisMaster.common")

let tableName1 = "er_master_region"
let tableName2 = "er_login"

async function regionFilter(query,username,type){
    try{
        //check if the user is sub-admin
        // console.log(query,username,type)s
        if(type == role.SubAdmin){
            // get the allowed region list
                var searchKeyValue1 = {
                    region_ids : username.join(","),
                    active : 1
                }
                var key = ["CAST(region_uuid AS CHAR(16)) AS region_uuid","region_name as name"]
                var orderby = "region_uuid"
                var ordertype = "ASC"
                const listResponce = await sqlQuery.searchQueryNoLimit(tableName1,searchKeyValue1,key,orderby,ordertype)
                // console.log(listResponce)
                if(listResponce.length == 0) return []
            
                // console.log(listFilteredResponce)
                return(listResponce)
        }
        if(type != role.Admin){
            //get agent region id
                var agentRegion = sqlQuery.searchQuery(tableName2,{user_uuid:username},['CAST(region_uuid AS CHAR(16)) region_uuid','region_name AS name'],'userid','ASC',1,0);
                return(agentRegion)
        }   
        return(query)
    }catch(error){
        console.log(error);
        throw new HttpException(error.status, error.message);
    }

}   

async function agnetTypeFilter(query,username,usertype){
    try{

        if(usertype != role.SubAdmin && usertype != role.Admin){ // if agent is using 
            // console.log(query)
            // get the agent user type
            let listUser, allowedAgentList
            let strAgentTypeList = await redisMaster.asyncGet('ALLOWED_USER_TYPE_'+username)
            if(strAgentTypeList == null){
                listUser = await sqlQuery.searchQuery(tableName2,{user_uuid : username},['usertype_id'],'userid','ASC',1,0)
                // console.log(listUser[0].usertype_id,listUser)
                allowedAgentList = query.slice(listUser[0].usertype_id, query.length)
                // console.log(allowedAgentList)

                redisMaster.post('ALLOWED_USER_TYPE_'+username,JSON.stringify(allowedAgentList))
            }else{
                allowedAgentList = JSON.parse(strAgentTypeList)
            }
            
            return(allowedAgentList)
        }

        return(query)

    }catch(error){
        console.log(error);
        throw new HttpException(error.status, error.message); 
    }
}

module.exports = {
    regionFilter,agnetTypeFilter
}