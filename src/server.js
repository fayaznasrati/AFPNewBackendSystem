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
const cleanOldReportFiles = require('./utils/delete_report_files_after_30_minuts'); // adjust path as needed
const multer = require('multer') ;
// const upload = multer({ dest: 'uploads/' }); // temp folder
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



var apiRouter = require('./routes/index'); 

app.use('/api/v1', apiRouter);

app.get("/api", (req, res) => {
    res.json({ message: "Welcome to AFP application." });
});

// Static file path serving for reports 
app.use('/api/v1/recharge/admin-report/files', express.static('/var/www/html/AFPNewBackendSystem/the_topup_reports'));
app.use('/api/v1/recharge/agent-report/files', express.static('/var/www/html/AFPNewBackendSystem/the_topup_reports'));
// call to clean old report files every 30 minutes
setInterval(cleanOldReportFiles, 30 * 60 * 1000);


// 404 error
app.all('*', (req, res, next) => {
    console.error("Unknown URL HIT : ",req.url)
    res.status(404).json({ errors: [ {msg : 'Endpoint Not Found'}] });
});

app.listen(port, () =>{
    console.log(`🚀 Server running on port ${port}!`)
   const used = process.memoryUsage();
    console.log(`Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`RSS: ${(used.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`External: ${(used.external / 1024 / 1024).toFixed(2)} MB`);
    
}
);
