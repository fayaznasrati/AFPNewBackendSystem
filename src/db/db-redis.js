const dotenv = require('dotenv');
const path = require('path');
const redis = require('redis');
const pool = require('redis-connection-pool');

// configer env
dotenv.config()

class DBRedisConnection {
    constructor() {
        this.redisPool = pool('myRedisPool', {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            max_clients: 30,
            perform_checks: false,
            database: process.env.REDIS_DB,
            options: {
                auth_pass: process.env.REDIS_PASS
            }
        })


        // this.client = redis.createClient({
        //     host: process.env.REDIS_HOST,
        //     port: process.env.REDIS_PORT,
        //     password: process.env.REDIS_PASS
        // })
    }
}

module.exports = new DBRedisConnection().redisPool;