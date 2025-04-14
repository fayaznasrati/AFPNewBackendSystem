const sqlQuery = require('./sqlQuery.common')
const sqlQueryReplica = require('./sqlQueryReplica.common')
const dbConnection = require('../db/db-connection')
const dbConnectionReplica = require('../db/db-connection-replica')
const HttpException = require('../utils/HttpException.utils');
const { searchQuery } = require('./sqlQuery.common');

const tableName1 = "er_master_country"
const tableName2 = "er_master_region"
const tableName3 = "er_master_province"
const tableName4 = "er_master_district"
const tableName5 = "er_agent_type"
const tableName6 = "er_master_operator"
const tableName7 = "er_master_department"
const tableName8 = "er_login"

class checkCommomDetails {
    //function to check country
    async checkCountry(id, name) {
        try {
            //verify country id
            var searchKeyValue = {
                country_uuid: id, //str  id
                country_name: name, //str  name
                active : 1
            }
            var key = ["COUNT(1)"]
            var orderby = "country_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName1, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse1[0]["COUNT(1)"]) return 0
            return 1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async getCountryId(id, name){
        try {
            //verify country id
            var searchKeyValue = {
                country_uuid: id, //str  id
                country_name: name, //str  name
                active : 1
            }
            var key = ["country_id"]
            var orderby = "country_id"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQuery(tableName1, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length == 0) return 0
            return lisResponse1[0].country_id

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    //function to check region
    async checkRegion(countryId, regionId, regionName) {
        try {
            //verify country id
            var searchKeyValue = {
                country_uuid: countryId, // country id
                region_uuid: regionId, //str  id
                region_name: regionName, //str  name
                active : 1
            }
            var key = ["COUNT(1)"]
            var orderby = "region_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName2, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse1[0]["COUNT(1)"]) return 0
            return 1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async getRegionId(countryId, regionId, regionName) {
        try {
            //verify country id
            var searchKeyValue = {
                country_uuid: countryId, // country id
                region_uuid: regionId, //str  id
                region_name: regionName, //str  name
                active : 1
            }
            var key = ["region_id"]
            var orderby = "region_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQuery(tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length == 0) return 0
            return lisResponse1[0].region_id

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async checkRegionwithoutCountry(regionId, regionName) {
        try {
            //verify country id
            var searchKeyValue = {
                region_uuid: regionId, //str  id
                region_name: regionName, //str  name
                active : 1,
            }
            var key = ["region_id"]
            var orderby = "region_id"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQuery(tableName2, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length === 0)return 0
            return lisResponse1[0].region_id

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    //function to check province
    async checkProvince(regionId, provinceId, provinceName) {
        try {
            //verify country id
            var searchKeyValue = {
                region_uuid: regionId, //str  id
                province_uuid: provinceId, //str province uuid 
                province_name: provinceName, //str province name
                active : 1
            }
            var key = ["COUNT(1)"]
            var orderby = "province_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName3, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse1[0]["COUNT(1)"]) return 0
            return 1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    //function to check province
    async getProvinceId(regionId, provinceId, provinceName) {
        try {
            //verify country id
            var searchKeyValue = {
                region_uuid: regionId, //str  id
                province_uuid: provinceId, //str province uuid 
                province_name: provinceName, //str province name
                active : 1
            }
            var key = ["province_id"]
            var orderby = "province_id"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQuery(tableName3, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length == 0) return 0
            return lisResponse1[0].province_id

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    //function to check province
    async checkDistrict(provinceId, districtId, districtName) {
        try {
            //verify country id
            var searchKeyValue = {
                province_uuid: provinceId, //str  provinceId
                district_uuid: districtId, //str districtId
                district_name: districtName, //str district
                active : 1
            }
            var key = ["COUNT(1)"]
            var orderby = "district_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName4, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse1[0]["COUNT(1)"]) return 0
            return 1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    //function to check province
    async getDistrictId(provinceId, districtId, districtName) {
        try {
            //verify country id
            var searchKeyValue = {
                province_uuid: provinceId, //str  provinceId
                district_uuid: districtId, //str districtId
                district_name: districtName, //str district
                active : 1
            }
            var key = ["district_id"]
            var orderby = "district_id"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQuery(tableName4, searchKeyValue, key, orderby, ordertype, 1, 0)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length == 0) return 0
            return lisResponse1.district_id

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async getParentChildList(parent_id){
        try{    

            const lisResponse1 = await sqlQuery.searchQuery(tableName8, {userid : parent_id}, ["child_id"], "userid", "ASC", 1, 0)
            if (lisResponse1.length == 0) throw new Error('Agent not found');

            let child_list = lisResponse1[0].child_id
            if (child_list == '') return []
            
            child_list = child_list.split(',')
            return child_list

        }catch (error){
            throw new Error(error.message);
        }
    }

    async updateParentChildList (parent_id, child_list){
        try{    
            let strChildList = child_list.join(',')

            const updateResponce = await sqlQuery.updateQuery(tableName8, { child_id : strChildList }, { userid : parent_id })
            return 1

        }catch (error){
            throw new Error(error.message);
        }
    }

    async getAgentTypeId(type_uuid) {
        try {

            //verify agent type id
            var searchKeyValue = {
                agent_type_uuid: type_uuid, //str  type_uuid
            }
            var key = ["agent_type_id"]
            var orderby = "agent_type_id"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName5, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length === 0) return 0
            return lisResponse1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async checkAgentType(type_uuid, typeName) {
        try {

            //verify agent type id
            var searchKeyValue = {
                agent_type_uuid: type_uuid, //str  type_uuid
                agent_type_name: typeName, //str type_name
            }
            var key = ["agent_type_id"]
            var orderby = "agent_type_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName5, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length == 0) return 0
            return lisResponse1[0].agent_type_id

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async getAllAgentType() {
        try {

            //verify agent type id
            var searchKeyValue = {
                active: 1
            }
            var key = ["agent_type_id","CAST(agent_type_uuid AS CHAR(16)) agent_type_uuid","agent_type_name"]
            var orderby = "agent_type_id"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName5, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length === 0) return 0

            return lisResponse1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async getAllOperatorWithId() {
        try {

            //verify agent type id
            var searchKeyValue = {
                active: 1
            }
            var key = ["operator_id", "CAST(operator_uuid AS CHAR(16)) AS operatorUuid","operator_name"]
            var orderby = "operator_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName6, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse1.length) return 0
            return lisResponse1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async getOperatorById(operator_uuid) {
        try {

            //verify agent type id
            var searchKeyValue = {
                operator_uuid:operator_uuid,
                active: 1
            }
            var key = ["operator_id",'operator_name']
            var orderby = "operator_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName6, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse1.length) return 0
            return lisResponse1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async checkOperator(operator_uuid,operator_name) {
        try {

            //verify agent type id
            var searchKeyValue = {
                operator_uuid:operator_uuid,
                operator_name:operator_name,
                active: 1
            }
            var key = ["COUNT(1)"]
            var orderby = "operator_name"
            var ordertype = "ASC"

            // fire sql query to get user id
            const lisResponse1 = await sqlQueryReplica.searchQueryNoLimit(tableName6, searchKeyValue, key, orderby, ordertype)

            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (!lisResponse1[0]["COUNT(1)"]) return 0
            return 1

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async getAllDepartment() {
        try{

            var key = ["department_id","department_name","CAST(department_uuid AS CHAR(16)) AS department_uuid"]
            var orderby = "department_id"
            var ordertype = "ASC"

            const lisResponse1 = await sqlQueryReplica.searchQueryNoConNolimit(tableName7,key, orderby, ordertype)
            // check if the result is there and responce accordingly
            if (!lisResponse1) {
                throw new HttpException(500, 'Something went wrong');
            }
            if (lisResponse1.length === 0) return 0
            return lisResponse1

        }catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    async chekParentAgentChain (parentUuid, childuuid) {
        try{
            
            let parentDetails, sql, i = 6;
            while (i > 0){
                // get parent id
                sql = `SELECT ${tableName8}.user_uuid As parent_uuid
                        FROM ${tableName8} JOIN ( SELECT parent_id FROM ${tableName8} WHERE CAST(user_uuid AS  CHAR(16)) = '${childuuid}' ) AS parentTable
                        ON ${tableName8}.userid = parentTable.parent_id`

                parentDetails = await dbConnectionReplica.query(sql)
                if(parentDetails.length == 0) return 0 // if parent not found return 0

                if(parentDetails[0].parent_uuid == parentUuid) return 1 // found parent ok to procede
                
                // parent not match loop again and chekc the parentDetails parent 
                childuuid = parentDetails[0].parent_uuid
                i -= 1 // we have 6 level so max we will search for 6 time
            }

            return 0

        }catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }
}


module.exports = new checkCommomDetails()