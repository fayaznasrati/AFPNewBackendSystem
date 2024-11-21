const express = require("express");
const dotenv = require('dotenv');
const cors = require("cors");
const helmet = require('helmet');
const bodyParser = require('body-parser');
// const awsUpload = require('./common/testFile.Common')

const HttpException = require('./utils/HttpException.utils');
const errorMiddleware = require('./middleware/error. middleware');

const rString = require('./utils/randomString.utils');
const algEncryptDecrypt = require('./utils/encryption.utils');

//cron
const cron = require('./common/node-cron')

// Init express
const app = express();

// configer env
dotenv.config()

// parse requests of content-type: application/json
// parses incoming requests with JSON payloads
app.use(express.json());
// enabling cors for all requests by using cors middleware
app.use(cors());
// Enable pre-flight
app.options("*", cors());

// static functions
app.use(express.static(__dirname + '/uploads'))

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port = Number(process.env.PORT)||5000;

// Error middleware
app.use(errorMiddleware);

/*strRandom = rString.generateRandomString(15);

console.log(strRandom);

strRandomHash = rString.generateRandomHash(strRandom);

console.log(strRandomHash);


strEncryptedString = algEncryptDecrypt.encryptString("ba9ba9d4700765a137ebc08a55bf9c60124287a80b4e0397507c09a26a1a2372","Jay");

console.log(strEncryptedString);

strDecryptedString = algEncryptDecrypt.decryptString("ba9ba9d4700765a137ebc08a55bf9c60124287a80b4e0397507c09a26a1a2372",strEncryptedString);

console.log(strDecryptedString);
*/

/*
let date = 
new Date(Date.UTC(2012, 11, 20, 3, 0, 0));
console.log('Given IST datetime: ' + date);

let usaTime = 
date.toLocaleString("en-US", {
    timeZone: "America/New_York" 
});
console.log('USA datetime: ' + usaTime);


const str = new Date().toISOString('en-US', { timeZone: 'Asia/Kolkata' });
console.log(str);

*/

// Add headers
app.use(function(req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//router files for
/*
const adminRouter = require('./routes/admin.route');
const smsRoute = require('./routes/marketingSms.route');
const regionRoutes = require('./routes/region.routes');
const ticketRoute = require('./routes/ticket.routes');
const redisRoute = require('./routes/redis.route')
const rabbitmqRoute = require('./routes/rabbitmq.routes')
const operatorRoute = require('./routes/operator.routes')
const countryRoutes = require('./routes/country.routes')
const provinceRoute = require('./routes/province.route')
const districtRoutes = require('./routes/district.routes')
const languageRoutes = require('./routes/language.routes')
const notificationRoute = require('./routes/Notification.routes')
const agentRoute = require('./routes/agent.route')
const postpaidRoute = require('./routes/postpaid.routes')
const slabRoute = require('./routes/slab.route')
const loginRoute = require('./routes/login.route')
const emoneyRoute = require('./routes/emoney.routes')
const walletRoute = require('./routes/wallet.route')
const stocksRoute = require('./routes/stocks.route')
const commissionRoute = require('./routes/commission.route')
*/


//redirecting routes
/*
app.use(`/api/v1/admin`, adminRouter);
app.use(`/api/v1/smsRoute`, smsRoute)
app.use(`/api/v1/region`, regionRoutes)
app.use(`/api/v1/ticket`, ticketRoute)
app.use(`/api/v1/redis`, redisRoute)
app.use(`/api/v1/rabbitmq`, rabbitmqRoute)
app.use(`/api/v1/operator`, operatorRoute)
app.use(`/api/v1/country`, countryRoutes)
app.use(`/api/v1/province`, provinceRoute)
app.use(`/api/v1/district`, districtRoutes)
app.use(`/api/v1/language`, languageRoutes)
app.use(`/api/v1/notification`, notificationRoute)
app.use(`/api/v1/agent`, agentRoute)
app.use(`/api/v1/postpaid`, postpaidRoute)
app.use(`/api/v1/slab`, slabRoute)
app.use(`/api/v1/login`, loginRoute)
app.use(`/api/v1/emoney`, emoneyRoute)
app.use(`/api/v1/wallet`, walletRoute)
app.use(`/api/v1/stock`, stocksRoute)
app.use(`/api/v1/commission`, commissionRoute)
*/

// console.log(Number(123.456).toFixed(2))

var apiRouter = require('./routes/index'); 

app.use('/api/v1', apiRouter);

app.get("/", (req, res) => {
    res.json({ message: "Welcome to AFP application." });
});

// 404 error
app.all('*', (req, res, next) => {
    console.error("Unknown URL HIT : ",req.url)
    res.status(404).json({ errors: [ {msg : 'Endpoint Not Found'}] });
    // const err = new HttpException(404, 'Endpoint Not Found');
    // next(err);
});

app.listen(port, () =>
    console.log(`🚀 Server running on port ${port}!`));
