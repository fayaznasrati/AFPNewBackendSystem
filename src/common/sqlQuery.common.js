const dbConnection = require('../db/db-connection')
const { multipleColumnSet, multipleAndColumnSet, multipleInsertColumnSet, multipleORColumnSet,multiRowInsert } = require('./query.common');
const HttpException = require('../utils/HttpException.utils');
const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

var boolConsole = process.env.CONSOLE_LOG == '1'
class sqlQueryCommon {

    // common sql create query 
    createQuery = async(tableName, keyValue) => {
        try {
            const { inColumnSet, inQueStr, inValues } = multipleInsertColumnSet(keyValue)
            const sql = `INSERT INTO ${tableName} (${inColumnSet}) VALUES (${inQueStr})`;
             //  if (boolConsole) console.log(sql, inColumnSet, inValues)
            const result = await dbConnection.query(sql, [...inValues]);
            const affectedRows = result ? result.affectedRows : 0;
            return result;
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    createQueryUpdate = async(tableName, keyValue) => {
        try {
            const { inColumnSet, inQueStr, inValues } = multipleInsertColumnSet(keyValue)
            const { upColumnSet, upValues } = multipleColumnSet(keyValue)
            const sql = `INSERT INTO ${tableName} (${inColumnSet}) VALUES (${inQueStr}) ON DUPLICATE KEY UPDATE ${upColumnSet}`;
             //  if (boolConsole) console.log(sql, inColumnSet, inValues)
            const result = await dbConnection.query(sql, [...inValues,...upValues]);
            const affectedRows = result ? result.affectedRows : 0;
            return result;
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    // create query with multiple data
    multiInsert = async(tableName,keyValue) =>{
        try{
            const {finalinColumnSet,finalinQueStr,finalinValues} = multiRowInsert(keyValue)
            const sql = `INSERT INTO ${tableName} (${finalinColumnSet}) VALUES ${finalinQueStr}`;
             //  if (boolConsole) console.log(sql, finalinColumnSet, finalinValues)
            const result = await dbConnection.execute(sql, [...finalinValues]);
            return result;
        }catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    //sql search query with where paramneter
    searchQuery = async(tableName, searchKeyValue, key, orderby, ordertype, limit, offset) => {
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            // console.log(boolConsole)
            const sql = `SELECT ${key.join(",")} FROM ${tableName} WHERE ${seColumnSet} ORDER BY ${orderby} ${ordertype} LIMIT ${limit} OFFSET ${offset} `;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }

      //sql search query with where ID parameter
    searchQueryById = async(tableName, searchKeyValue, key) => {
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            // console.log(boolConsole)
            const sql = `SELECT ${key.join(",")} FROM ${tableName} WHERE ${seColumnSet} `;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }

    searchQueryTimeout = async(tableName, searchKeyValue, key, orderby, ordertype, limit, offset) => {
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            // console.log(boolConsole)
            const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${key.join(",")} FROM ${tableName} WHERE ${seColumnSet} ORDER BY ${orderby} ${ordertype} LIMIT ${limit} OFFSET ${offset} `;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result
        } catch (error) {
            console.error(error);
            throw new HttpException(error.status, error.message);
        }

    }

    //sql search query with where paramneter and update lock
    searchQueryTran = async(tableName, searchKeyValue, key, orderby, ordertype, limit, offset) => {
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            const sql = `SELECT ${key.join(",")} FROM ${tableName} WHERE ${seColumnSet} ORDER BY ${orderby} ${ordertype} LIMIT ${limit} OFFSET ${offset} `;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }

    //sql search query with where paramneter
    searchOrQuery = async(tableName, searchKeyValue, key, orderby, ordertype, limit, offset) => {
        try {
            const { seColumnSet, sevalues } = multipleORColumnSet(searchKeyValue)
            const sql = `SELECT ${key.join(",")} FROM ${tableName} WHERE ${seColumnSet} ORDER BY ${orderby} ${ordertype} LIMIT ${limit} OFFSET ${offset} `;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }


    // search query without any where parameter
    searchQueryNoCon = async(tableName, key, orderby, ordertype, limit, offset) => {
        try {
            const sql = `SELECT ${key.join(",")} FROM ${tableName} ORDER BY ${orderby} ${ordertype} LIMIT ${limit} OFFSET ${offset} `;
             //  if (boolConsole) console.log(sql)
            const result = await dbConnection.query(sql);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }

    searchQueryNoConNolimit = async(tableName, key, orderby, ordertype) => {
        try {
            const sql = `SELECT ${key.join(",")} FROM ${tableName} ORDER BY ${orderby} ${ordertype}`;
             //  if (boolConsole) console.log(sql)
            const result = await dbConnection.query(sql);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }

    searchQueryNoLimit = async(tableName, searchKeyValue, key, orderby, ordertype) => {
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            const sql = `SELECT ${key.join(",")} FROM ${tableName} WHERE ${seColumnSet} ORDER BY ${orderby} ${ordertype}`;
            console.log("SQL:",sql);
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }

    searchQueryNoLimitTimeout = async(tableName, searchKeyValue, key, orderby, ordertype) => {
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            const sql = `SELECT /*+ MAX_EXECUTION_TIME(${process.env.SQL_QUERY_TIME_OUT}) */ ${key.join(",")} FROM ${tableName} WHERE ${seColumnSet} ORDER BY ${orderby} ${ordertype}`;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result
        } catch (error) {
            console.error(error);
            throw new HttpException(error.status, error.message);
        }

    }

    searchQueryNoLimitTran = async(tableName, searchKeyValue, key, orderby, ordertype) => {
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            const sql = `SELECT ${key.join(",")} FROM ${tableName} WHERE ${seColumnSet} ORDER BY ${orderby} ${ordertype} `;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }

    selectStar = async(tableName, key) => {
        try {
            const sql = `SELECT ${key.join(",")} FROM ${tableName}`;
             //  if (boolConsole) console.log(sql)
            const result = await dbConnection.query(sql);
            return result
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }

    }

    updateStar = async (tableName, keyValue) => {
        try{
            const { upColumnSet, upValues } = multipleColumnSet(keyValue)
            const sql = `UPDATE ${tableName} SET ${upColumnSet}`;
             //  if (boolConsole) console.log(sql, upColumnSet, upValues)
            const result = await dbConnection.query(sql, [...upValues]);
            // console.log(result)
            return result;
        }catch (error){
            console.log(error);
            throw new HttpException(error.status, error.message); 
        }
    }

    // upadate query to update values and active state of the data
    updateQuery = async(tableName, keyValue, searchKeyValue) => {
        try {
            const { upColumnSet, upValues } = multipleColumnSet(keyValue)
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            const sql = `UPDATE ${tableName} SET ${upColumnSet} WHERE ${seColumnSet}`;
             //  if (boolConsole) console.log(sql, upColumnSet, upValues, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...upValues, ...sevalues]);
            console.log(result)
            return result;
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    updateBalance = async(tableName, amt, searchKeyValue) =>{
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            const sql = `UPDATE ${tableName} SET ex_wallet = ex_wallet + ${amt} WHERE ${seColumnSet}`;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [ ...sevalues]);
            return result;
        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    // delete query to delete data from database
    deleteQuery = async(tableName, searchKeyValue) => {
        try {
            const { seColumnSet, sevalues } = multipleAndColumnSet(searchKeyValue)
            const sql = `DELETE FROM ${tableName} WHERE ${seColumnSet}`;
             //  if (boolConsole) console.log(sql, seColumnSet, sevalues)
            const result = await dbConnection.query(sql, [...sevalues]);
            return result;

        } catch (error) {
            console.log(error);
            throw new HttpException(error.status, error.message);
        }
    }

    specialCMD = async(type) => {
        try {
            var sql = ""
             //  if (boolConsole) console.log("type :", type)
            let result = 'ok'
            switch (type) {
                case "transaction":
                    // result = await dbConnection.startTransaction()
                    sql = 'START TRANSACTION'
                    break;
                case "commit":
                    // result = await dbConnection.commitTrasnaction()
                    sql = 'COMMIT'
                    break;
                case "rollback":
                    // result = await dbConnection.rollbackTransaction()
                    sql = 'ROLLBACK'
                    break;
            }
            // result = await dbConnection.simpleQuery(sql);
            // console.log(result)
            return result;

        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new sqlQueryCommon