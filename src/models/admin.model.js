const dbConnection = require('../db/db-connection');
const dbConnectionReplica = require('../db/db-connection-replica')
const { multipleColumnSet } = require('../utils/common.utils');
const Role = require('../utils/userRoles.utils');

const varRandomString = require('../utils/randomString.utils');
const varEncryptionString = require('../utils/encryption.utils');

class AdminModel {

    tableName = 'er_login_admin';

    matchPassword = async(params) => {

        //const { columnSet, values } = multipleColumnSet(params);
        //const sql = `SELECT encryption_key,password FROM ${this.tableName} WHERE ${columnSet}`;

        //const result = await query(sql, [...values]);

        const sqlEK = `SELECT encryption_key,password,usertype,emailid,mobile,full_name,status FROM ${this.tableName} WHERE username = ? AND active = 1 LIMIT 1`;
        const resultEK = await dbConnection.query(sqlEK, [params.username]);

        //console.log(resultEK[0]["encryption_key"]);
        //console.log(resultEK[0]["password"]);

        // console.log(resultEK);
        //console.log(resultEK[1]);
        if (resultEK.length) {
            const key = resultEK[0]["encryption_key"];
            const storedpassword = resultEK[0]["password"];

            //const getHashPassword = this.getHashPassword('ae4510d45fcd9c850349fd1f9a6dba3d544ab52344d6e1b9eff8f336e7194098','cRzMjXdiDL4RqrSjvPYw0HGG2JHcBg==');

            const getHashPassword = this.getHashPassword(key, storedpassword);
             console.log(getHashPassword)
            if(resultEK[0].status != 1) return 3
            
            if (params.password == getHashPassword) {
                if(resultEK[0].status == 1) return { id: params.username,mobile: resultEK[0].mobile , emailid : resultEK[0].emailid ,usertype: resultEK[0].usertype, fullName: resultEK[0].full_name };
                else return 3
            } else {
                return 2;
            }
        } else {
            return 1;
        }
    }

    findOne = async(params) => {
        const { columnSet, values } = multipleColumnSet(params);

        const sql = `SELECT admin_userid,username,usertype,full_name,usertype_id,mobile,region_id FROM ${this.tableName} WHERE ${columnSet} AND active = 1`;

        const result = await dbConnectionReplica.query(sql, [...values]);

        //const sql = `SELECT * FROM ${this.tableName} WHERE username=?`;

        //const result = await query(sql, [params.username]);

        // return back the first row (user)
        return result[0];
    }

    setEncryptionKey() {
        var strRandomString = varRandomString.generateRandomString(15);
        var strRandomHash = varRandomString.generateRandomHash(strRandomString);
        return strRandomHash;
    }

    setHashPassword(strKey, strText) {
        return varEncryptionString.encryptString(strKey, strText);
    }

    getHashPassword(strKey1, strText1) {
        return varEncryptionString.decryptString(strKey1, strText1);
    }

    setUserName() {
        return "AFP-" + varRandomString.generateRandomNumber(5);
    }
}

module.exports = new AdminModel;
