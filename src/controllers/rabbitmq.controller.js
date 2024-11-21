// testing RabbitMQ
// const rabbitMQ = require('./common/rabbitmq.common')
// rabbitMQ.start()
// setTimeout(() => { rabbitMQ.sendMessage("dummy", "How are you.....?"); }, 7000);
// setTimeout(() => { rabbitMQ.sendMessage("dummy", "what are you doing...."); }, 14000);
// setTimeout(() => { rabbitMQ.sendMessage("dummy", "are you free tomorrow...."); }, 21000);
// // creating worker jon mona
// setTimeout(() => { rabbitMQ.createWorker("jon", "dummy"); }, 24000);
// setTimeout(() => { rabbitMQ.createWorker("mona", "dummy"); }, 24000);
// // close the work of jon
// setTimeout(() => { rabbitMQ.endWorker('jon'); }, 29000);

// const rabbitMQ = require('./common/rabbitmq.common')
// setTimeout(() => { rabbitMQ.sendMessage("dummy", "How are you.....?"); }, 7000);
// setTimeout(() => { rabbitMQ.createWorker("jon", "dummy", fun) }, 17000);

async function fun(msg) {
    console.log(msg);
    return (1)
}

const { createWorker, sendMessage, endWorker, start } = require('../common/rabbitmq.common')
const HttpException = require('../utils/HttpException.utils');
const { validationResult } = require('express-validator');

class rabbitmgController {

    constructor() {
        start()
    }

    sendMessage = (req, res, next) => {
        sendMessage(req.body.queue, req.body.message, (err, message) => {
            if (err) {
                res.send(err);
            } else {
                res.send(message);
            }
        })
    }
    createWorker = (req, res, next) => {
        createWorker(req.body.name, req.body.queue, fun, (err, message) => {
            if (err) {
                res.send(err);
            } else {
                res.send(message);
            }
        })
    }
    endWorker = (req, res) => {
        endWorker(req.queue.name, (err, message) => {
            if (err) {
                res.send(err);
            } else {
                res.send(message);
            }
        })
    }
}

module.exports = new rabbitmgController()