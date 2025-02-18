const dotenv = require("dotenv");
const path = require("path");
const mysql2 = require("mysql2");

// configer env
dotenv.config();

class DBConnection {
  constructor() {
    this.db = mysql2.createPool({
      host: process.env.DB_HOST_READ_REPLICA  ,
      user: process.env.DB_USER ,
      password: process.env.DB_PASS ,
      database: process.env.DB_DATABASE  ,
      waitForConnections: true,
      connectionLimit: 500,
      queueLimit: 1000,
      multipleStatements: true

    });
    console.log("Replicator Database Connecting...:", process.env.DB_HOST_READ_REPLICA);
    this.checkConnection();
  }

  checkConnection() {
    this.db.getConnection((err, connection) => {
      if (err) {
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          console.error("❌ Replica Database connection was closed.");
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
          console.error("❌ Replica Database has too many connections.");
        }
        if (err.code === "ECONNREFUSED") {
          console.error("❌ Replica Database connection was refused.");
        } else console.error(" ❌Replica Database connection error", err);
      }
      if (connection) {
        connection.release();
        console.log("✅ Replicator Database Host:", process.env.DB_HOST_READ_REPLICA);
        console.log("✅ connected to Replica MySQL successfully...!!!");
      }
      return;
    });
  }

  execute = async (sql, values) => {
    // console.log(sql, values);
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      // execute will internally call prepare and query
      this.db.execute(sql, values, callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };

  query = async (sql, values) => {
    // console.log(sql, values);
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      // execute will internally call prepare and query
      this.db.query(sql, values, callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };

  simpleQuery = async (sql) => {
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      // execute will internally call prepare and query
      this.db.query(sql, callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };

  startTransaction = async () => {
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      // execute will internally call prepare and query
      this.db.beginTransaction(callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };

  commitTrasnaction = async () => {
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      // execute will internally call prepare and query
      this.db.commit(callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };

  rollbackTransaction = async () => {
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      // execute will internally call prepare and query
      this.db.rollback(callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      // convert mysql errors which in the mysqlErrorList list to http status code
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      throw err;
    });
  };
}

// like ENUM
const HttpStatusCodes = Object.freeze({
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: 422,
  ER_DUP_ENTRY: 409,
});

module.exports = new DBConnection();
