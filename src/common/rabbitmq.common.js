var amqp = require('amqplib/callback_api'); // connection url at process.env.CLOUDAMQP_URL
const HttpException = require('../utils/HttpException.utils');
const dotenv = require('dotenv');
const path = require('path');

// configer env
dotenv.config()

var rabbitConnection = null
var workerChannel = {}

// const rb = require('./rabbitmq.worker.commen')

// connect to rabbitMQ and save in rabbitConnection
exports.start = () => {
    return new Promise((resolve, reject) => {
        amqp.connect(process.env.CLOUDAMQP_URL, (error, connection) => {
            if (error) {
                return setTimeout(()=> {
                    this.start()
                    resolve('connection Re - created')
                }, 1000);
                // throw new HttpException(500, 'Something went wrong');
            }
        
            rabbitConnection = connection;
            console.log('[rabbitMQ] connection created')
        
            connection.on("error", (err) => {
                if (err.message !== "Connection closing") {
                    console.error("[rabbitMQ] conn error", err.message);
                }
            });

            connection.on("connected", ()=>{
                console.log('[rabbitMQ] connected')
                resolve('connection created')
            })
        
            connection.on("close", () => {
                console.error("[rabbitMQ] reconnecting");
                return setTimeout(()=> {
                    this.start()
                    resolve('connection Re - created')
                }, 1000);
            });

            resolve('connection created')
        });
    })  
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
exports.createWorker = async (queue, fun) => {
    try {

        if( !rabbitConnection ){
            await this.start()
        }

        return new Promise((resolve, reject) => {
            rabbitConnection.createChannel(function(error1, channel) {
                
                if(error1){
                    reject(error1)
                }

                channel.assertQueue(queue, {
                    durable: true
                });

                channel.prefetch(1);

                channel.consume(queue, async function(msg) {
                    let startTime = new Date()
                    let endTime 

                    await fun(msg.content.toString())
                    endTime = new Date()

                    setTimeout(() => {
                        channel.ack(msg)
                    }, 100 - (endTime-startTime))
    
                }, {
                    noAck: false
                });

                resolve('worker Created')
                console.log('worker Created')

            })
        })

    } catch (error) {
        console.log(error)
        
    }
}

// remove worker and discconect it from the rabbitMQ
exports.endWorker = function endWorker(name, response) {
    try {
        var channel = workerChannel[name].channel
        workerChannel[name].status = 0
        console.log(' [rabbitMQ] closing worker for %s', name)
        channel.close();
        response(null, 'worker closed')
    } catch (error) {
        console.log(error)
        throw new HttpException(500, 'Something went wrong');
    }
}


// module.exports = new rabbitMQ()