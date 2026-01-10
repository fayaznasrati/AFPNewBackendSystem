const cluster = require("cluster");
const os = require("os");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const bodyParser = require("body-parser");
// const errorMiddleware = require('./middleware/error.middleware');
const errorMiddleware = require("./middleware/error. middleware");
const cleanOldReportFiles = require("./utils/delete_report_files_after_30_minuts");

// configer env
dotenv.config();

// Check if we should run in cluster mode
const runInCluster = cluster.isMaster && process.env.NODE_ENV === "prod";

if (runInCluster) {
  // Master process - Cluster management
  const numCPUs = os.cpus().length;
  // Configurable worker count (default to 4 if not specified)
  const maxWorkers = process.env.WORKER_COUNT ? parseInt(process.env.WORKER_COUNT) : 4;
  const workerCount = Math.min(numCPUs, maxWorkers);

  console.log(`🖥️  Server Specifications:`);
  console.log(`   CPU Cores: ${numCPUs}`);
  console.log(`   Optimal Workers: ${workerCount}`);
  console.log(
    `   Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`
  );
  console.log(`📡 External Services: RabbitMQ & Redis on separate servers`);

  // Fork workers with staggered startup
  for (let i = 0; i < workerCount; i++) {
    setTimeout(() => {
      const worker = cluster.fork();
      console.log(`✅ Worker ${worker.process.pid} started`);
    }, i * 300);
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `♻️  Worker ${worker.process.pid} died (${signal || code}). Restarting...`
    );
    setTimeout(() => cluster.fork(), 1000);
  });

  cluster.on("online", (worker) => {
    console.log(`🔗 Worker ${worker.process.pid} is online`);
  });
} else {
  // Worker process - Your existing application with optimizations
  const app = express();

  // High-performance middleware stack
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    compression({
      level: 6,
      threshold: 1024,
    })
  );

  app.use(cors());

  // Optimized body parsing
  app.use(
    express.json({
      limit: "5mb",
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: "5mb",
      parameterLimit: 5000,
    })
  );

  // Add headers
  app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type,Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
  });

  // Your routes
  var apiRouter = require("./routes/index");
  app.use("/api/v1", apiRouter);
app.post("/api/logout", (req, res) => {
    res.status(200).json({ 
        message: "signed out successfully", 
    });
});

  // Error middleware
  app.use(errorMiddleware);

  app.get("/api", (req, res) => {
    res.json({
      message: "Welcome to AFP application.",
      worker: `Worker ${process.pid}`,
      port: port,
    });
  });

// Health check endpoint for load testing
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "AFP TopUp API",
        worker: process.pid,
        port: port,
        timestamp: new Date().toISOString(),
        uptime: `${process.uptime().toFixed(2)} seconds`,
        memory: {
            heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

// Simple ping endpoint
app.get("/api/ping", (req, res) => {
    res.status(200).json({ 
        message: "pong", 
        worker: process.pid,
        timestamp: new Date().toISOString()
    });
});

  // Static file path serving for reports
  app.use(
    "/api/v1/recharge/admin-report/files",
    express.static("/var/www/html/AFPNewBackendSystem/the_topup_reports", {
      maxAge: "1h",
      etag: false,
    })
  );
  app.use(
    "/api/v1/recharge/agent-report/files",
    express.static("/var/www/html/AFPNewBackendSystem/the_topup_reports", {
      maxAge: "1h",
      etag: false,
    })
  );

  // call to clean old report files every 30 minutes
  setInterval(cleanOldReportFiles, 30 * 60 * 1000);

  // 404 error
  app.all("*", (req, res, next) => {
    console.error(`Worker ${process.pid}: Unknown URL HIT:`, req.url);
    res.status(404).json({ errors: [{ msg: "Endpoint Not Found" }] });
  });

  // Calculate port for this worker - FIXED VERSION
  const basePort = Number(process.env.PORT) || 5000;
  const workerId = cluster.worker ? cluster.worker.id - 1 : 0;
  const port = basePort + workerId;

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Worker ${process.pid} running on port ${port}!`);

    // Worker-specific memory logging
    const used = process.memoryUsage();
    console.log(`📊 Worker ${process.pid} Memory Status:`);
    console.log(
      `   Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`   Heap Used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   RSS: ${(used.rss / 1024 / 1024).toFixed(2)} MB`);
  });

  // Optimize server timeouts
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log(`👋 Worker ${process.pid} shutting down gracefully`);
    server.close(() => {
      process.exit(0);
    });
  });
}
