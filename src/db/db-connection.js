const dotenv = require("dotenv");
const path = require("path");
const mysql2 = require("mysql2");

// configer env
dotenv.config();

class DBConnection {
  constructor() {
    // Optimized connection pool for external services
    const connectionsPerWorker = 1000;
    
    this.db = mysql2.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      waitForConnections: true,
      connectionLimit: connectionsPerWorker,
      queueLimit: 10000,
      acquireTimeout: 60000, // Valid option
      connectTimeout: 60000, // Connection timeout
      timeout: 60000, // Query timeout
      multipleStatements: true,
      charset: 'utf8mb4',
      timezone: '+00:00',
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    console.log(`Worker ${process.pid}: Master Database Connecting to: ${process.env.DB_HOST} (${connectionsPerWorker} connections)`);
    this.checkConnection();
    this.setupPoolMonitoring();
  }

  setupPoolMonitoring() {
    this.db.on('acquire', (connection) => {
      // Connection acquired
    });
    
    this.db.on('release', (connection) => {
      // Connection released
    });
    
    this.db.on('enqueue', () => {
      console.warn(`Worker ${process.pid}: DB connection queue growing`);
    });
  }

  checkConnection() {
    this.db.getConnection((err, connection) => {
      if (err) {
        console.error(`Worker ${process.pid}: Master DB connection error:`, err.message);
      }
      if (connection) {
        connection.release();
        console.log(`Worker ${process.pid}: ✅ Connected to Master MySQL successfully`);
      }
    });
  }

  execute = async (sql, values, timeout = 15000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      const callback = (error, result) => {
        clearTimeout(timeoutId);
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      
      this.db.execute(sql, values, callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      console.error(`Worker ${process.pid}: DB Execute Error:`, err.message);
      throw err;
    });
  };

  query = async (sql, values, timeout = 15000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      const callback = (error, result) => {
        clearTimeout(timeoutId);
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      
      this.db.query(sql, values, callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      console.error(`Worker ${process.pid}: DB Query Error:`, err.message);
      throw err;
    });
  };

  simpleQuery = async (sql, timeout = 15000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      const callback = (error, result) => {
        clearTimeout(timeoutId);
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      };
      
      this.db.query(sql, callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      console.error(`Worker ${process.pid}: DB SimpleQuery Error:`, err.message);
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
      
      this.db.beginTransaction(callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      console.error(`Worker ${process.pid}: Start Transaction Error:`, err.message);
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
      
      this.db.commit(callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      console.error(`Worker ${process.pid}: Commit Transaction Error:`, err.message);
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
      
      this.db.rollback(callback);
    }).catch((err) => {
      const mysqlErrorList = Object.keys(HttpStatusCodes);
      err.status = mysqlErrorList.includes(err.code)
        ? HttpStatusCodes[err.code]
        : err.status;

      console.error(`Worker ${process.pid}: Rollback Transaction Error:`, err.message);
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