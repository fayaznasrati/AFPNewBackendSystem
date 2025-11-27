const express = require("express");
const dotenv = require('dotenv');
const cors = require("cors");
const helmet = require('helmet');
const bodyParser = require('body-parser');
const errorMiddleware = require('./middleware/error. middleware');
const cleanOldReportFiles = require('./utils/delete_report_files_after_30_minuts'); // adjust path as needed
// const health = require('./routes/health');
//cron
const cron = require('./common/node-cron')
// Init express
const app = express();
// configer env
dotenv.config()
// parse requests of content-type: application/json
// parses incoming requests with JSON payloads
app.use(express.json());
app.use(cors());
// Enable pre-flight// enabling cors for all requests by using cors middleware
app.options("*", cors());
// static functions
app.use(express.static(__dirname + '/uploads'))
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port = Number(process.env.PORT);

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
// Error middleware
app.use(errorMiddleware);
app.get("/api", (req, res) => {
    res.json({ message: "Welcome to AFP application." });
});

// app.use('/api/v1', health);

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

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}!`);
  const used = process.memoryUsage();
  console.log(`======== Memory Usage Status !======`);
  console.log(`Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap Used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`RSS: ${(used.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`External: ${(used.external / 1024 / 1024).toFixed(2)} MB`);

  // Check disk usage at startup
  const { exec } = require("child_process");
  console.log(`======== Server Storage Status !======`);
  exec("df -h", (err, stdout) => {
    if (err) return console.error(err);
    console.log("[DISK USAGE]\n" + stdout);
  });
});
 
