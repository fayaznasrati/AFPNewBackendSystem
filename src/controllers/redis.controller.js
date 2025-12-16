const client = require('../db/db-redis')
const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

class redisController {
    createVar = (req, res, next) => {
        const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('redis/createVar',JSON.stringify(req.body), JSON.stringify(req.query))
        client.set(req.body.name, req.body.value, function(err, reply) {
            if (err) {
                console.log(err)
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(201).send({ message: 'variable created successfully..!!!' })
        });
    }
    getvalue = (req, res, next) => {
        const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('redis/getVar',JSON.stringify(req.body), JSON.stringify(req.query))
        client.get(req.query.name, function(err, reply) {
            if (err) {
                console.log(err)
                throw new HttpException(500, 'Something went wrong');
            }
            if (reply === null) {
                return res.status(204).send({ message: "No such Variable exists in Redis..!!" })
            }
            res.status(200).send(reply)
        });
    }
    deletevar = (req, res, next) => {
        const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('redis/deleteVar',JSON.stringify(req.body), JSON.stringify(req.query))
        client.del(req.query.name, function(err, reply) {
            if (err) {
                console.log(err)
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(200).send({ message: 'Variable deleted successfully..!!' })
        });
    }
    expireVar = (req, res, next) => {
        const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
             //  console.log('redis/expireVar',JSON.stringify(req.body), JSON.stringify(req.query))
        client.expire(req.body.name, req.body.time, function(err, reply) {
            if (err) {
                console.log(err)
                throw new HttpException(500, 'Something went wrong');
            }
            res.status(200).send({ message: 'expiry time updated successfully..!!' })
        });
    }

    checkValidation = (req) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors)
            throw new HttpException(400, 'Validation faild', errors);
        }
    }
}

module.exports = new redisController;