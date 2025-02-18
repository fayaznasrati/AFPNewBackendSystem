const client = require('../../db/db-redis');
const HttpException = require('../../utils/HttpException.utils');
class redisMaster {
    get(key, next) {
        // console.log('Redis get ' + key)
        client.get(key, function(err, reply) {
            next(err, reply)
        });
    }
    post(key, value) {
        // console.log('Redis post ' + key)
        client.set(key, value, function(err, reply) {
            if (err) {
                console.log(err)
                throw new HttpException(500, 'Something went wrong');
            }
        });
    }
    exp(key, time) {
        client.expire(key, time, function(err, reply) {
            if (err) {
                console.log(err)
                throw new HttpException(500, 'Something went wrong');
            }
        });
    }
    delete(key) {
        // console.log('Redis delete ' + key)
        client.del(key, function(err, reply) {
            if (err) {
                console.log(err)
                throw new HttpException(500, 'Something went wrong');
            }
        });
    }
    incr(key){
        return new Promise((resolve, reject) => {
            client.incr(key, function(err, reply) {
                if(err) reject (err)
                else resolve (reply)
            });
        })
    }
    decr(key){
        return new Promise((resolve, reject) => {
            try{
                client.decr(key, function(err, reply) {
                    if(err) reject (err)
                    else resolve (reply)
                });
            }catch(err){
                console.log(err)
                resolve (0)
            }
        })
    }
    asyncGet(key) {
        return new Promise((resolve, reject) => {
            client.get(key, function(err, reply) {
                if(err) reject (err)
                else resolve (reply)
            });
        })
    }

}

module.exports = new redisMaster;