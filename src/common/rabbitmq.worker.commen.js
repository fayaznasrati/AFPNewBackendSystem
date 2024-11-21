var amqp = require('amqplib/callback_api'); // connection url at process.env.CLOUDAMQP_URL
const HttpException = require('../utils/HttpException.utils');
const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

const sqlQuery = require('../common/sqlQuery.common')
var rabbitConnection = null

class rabbitMQ {

    constructor() {
        console.log('rabbitmq constructor')
        
    }
}

exports.start = () => {
    try {
        amqp.connect(process.env.CLOUDAMQP_URL, function(error0, connection) {
            if (error0) {
                throw new HttpException(500, 'Something went wrong');
            }

            rabbitConnection = connection;
            console.log(' [rabbitMQ] connection created')

            connection.on("error", function(err) {
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] conn error", err.message);
                }
            });

            connection.on("close", function() {
                console.error("[AMQP] reconnecting");
                return setTimeout(start, 1000);
            });

        });
    } catch (error) {
        console.log(error)
        throw new HttpException(500, 'Something went wrong');
    }
}

// create connection and send message to a perticular queue
exports.sendMessage = function sendMessage(queue, msg, response) {
    try {
        rabbitConnection.createChannel(function(error1, channel) {
            if (error1) {
                console.log(error1)
                response('error in sending message', null)
                throw new HttpException(500, 'Something went wrong');
            }
            // console.log(' [rabbitMQ] Created the send channel')
            channel.assertQueue(queue, {
                durable: true,
            });
            channel.sendToQueue(queue, Buffer.from(msg), {
                persistent: true
            });
            // console.log(" [rabbitMQ] Queue %s message Sent :- %s", queue, msg);
            response(null, 'message sent')
            setTimeout(function() {
                channel.close();
                // console.log(" [rabbitMQ] Closed the send channel");
            }, 500);
        });
    } catch (error) {
        console.log(error)
        throw new HttpException(500, 'Something went wrong');
    }

}

// create worker with queue name and function to be done
exports.createWorker = function createWorker(name, queue, fun, response) {
    try {
        // console.log(fun)
        rabbitConnection.createChannel(function(error1, channel) {
            if (error1) {
                response(error1, null)
                // throw new HttpException(500, 'Something went wrong');
            }
            workerChannel[name] = {
                    name: name,
                    channel: channel,
                    queue: queue,
                    status: 1
                }
                // console.log(' [rabbitMQ] %s worker is created', name)
            channel.assertQueue(queue, {
                durable: true
            });
            channel.prefetch(1);
            response(null, 'worker cerated')
            channel.consume(queue, async function(msg) {
                // console.log(" [rabbitMQ] %s Received %s", name, msg.content.toString());
                // console.log(fun)
                res = await fun(msg.content.toString())
                if (res) {
                    if (workerChannel[name].status) {
                        console.log("[rabbitMQ] " + name + " work done")
                        channel.ack(msg)
                    }
                }
            }, {
                noAck: false
            });
        });
    } catch (error) {
        console.log(error)
        throw new HttpException(500, 'Something went wrong');
    }
}

module.exports = new rabbitMQ