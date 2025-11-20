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
  const workerCount = Math.min(numCPUs, 7); // Use 7 of 8 cores

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
// ==================================================Safe database test endpoints=============================================================
// Database test endpoints with correct paths for your project structure
// app.get("/api/test/db-simple", async (req, res) => {
//     try {
//         const db = require('./db/db-connection'); // Correct path
//         // Use the query method - returns [rows, fields]
//         const result = await db.query('SELECT * FROM er_recharge LIMIT 10');
//         res.json({ 
//             success: true, 
//             data: result[0], // First element is rows
//             worker: process.pid 
//         });
//     } catch (error) {
//         console.error('DB Simple Test Error:', error.message);
//         res.status(500).json({ 
//             error: 'DB Simple Query failed',
//             message: error.message,
//             worker: process.pid 
//         });
//     }
// });
// Realistic database tests for airtime top-up system
app.get("/api/test/recharge-successful", async (req, res) => {
    try {
        const db = require('./db/db-connection');
        // Test: Get successful recharges (status = 2) - common operation
        const result = await db.query(`
            SELECT id, mobile_number, amount, operator_name, created_on 
            FROM er_recharge 
            WHERE status = 2 
            ORDER BY created_on DESC 
            LIMIT 50
        `);
        res.json({ 
            success: true, 
            count: result[0].length,
            transactions: result[0],
            worker: process.pid 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Successful recharges query failed',
            message: error.message 
        });
    }
});

app.get("/api/test/recharge-by-operator", async (req, res) => {
    try {
        const db = require('./db/db-connection');
        // Test: Group by operator for dashboard - medium complexity
        const result = await db.query(`
            SELECT 
                operator_name,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as average_amount
            FROM er_recharge 
            WHERE created_on >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            GROUP BY operator_name
            ORDER BY total_amount DESC
        `);
        res.json({ 
            success: true, 
            operator_stats: result[0],
            worker: process.pid 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Operator stats failed',
            message: error.message 
        });
    }
});

app.get("/api/test/recharge-hourly", async (req, res) => {
    try {
        const db = require('./db/db-connection');
        // Test: Hourly transaction volume - complex aggregation
        const result = await db.query(`
            SELECT 
                HOUR(created_on) as hour_of_day,
                COUNT(*) as transaction_count,
                SUM(amount) as hourly_amount
            FROM er_recharge 
            WHERE created_on >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY HOUR(created_on)
            ORDER BY hour_of_day
        `);
        res.json({ 
            success: true, 
            hourly_stats: result[0],
            worker: process.pid 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Hourly stats failed',
            message: error.message 
        });
    }
});

app.get("/api/test/recharge-search", async (req, res) => {
    try {
        const db = require('./db/db-connection');
        const mobile = req.query.mobile || '07307%';
        // Test: Search by mobile number - common user operation
        const result = await db.query(`
            SELECT id, trans_number, mobile_number, amount, status, operator_name, created_on
            FROM er_recharge 
            WHERE mobile_number LIKE ?
            ORDER BY created_on DESC 
            LIMIT 20
        `, [mobile]);
        res.json({ 
            success: true, 
            count: result[0].length,
            search_results: result[0],
            worker: process.pid 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Search failed',
            message: error.message 
        });
    }
});

app.get("/api/test/recharge-amount-ranges", async (req, res) => {
    try {
        const db = require('./db/db-connection');
        // Test: Amount distribution - analytics query
        const result = await db.query(`
            SELECT 
                CASE 
                    WHEN amount <= 10 THEN '0-10'
                    WHEN amount <= 50 THEN '11-50' 
                    WHEN amount <= 100 THEN '51-100'
                    ELSE '100+'
                END as amount_range,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount
            FROM er_recharge 
            WHERE created_on >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY amount_range
            ORDER BY total_amount DESC
        `);
        res.json({ 
            success: true, 
            amount_distribution: result[0],
            worker: process.pid 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Amount ranges failed',
            message: error.message 
        });
    }
});

// Test on read replica for heavy reports
app.get("/api/test/replica-daily-report", async (req, res) => {
    try {
        const dbReplica = require('./db/db-connection-replica');
        // Heavy report query - perfect for read replica
        const result = await dbReplica.query(`
            SELECT 
                DATE(created_on) as transaction_date,
                operator_name,
                COUNT(*) as daily_count,
                SUM(amount) as daily_amount,
                SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN status != 2 THEN 1 ELSE 0 END) as failed_count
            FROM er_recharge 
            WHERE created_on >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_on), operator_name
            ORDER BY transaction_date DESC, daily_amount DESC
            LIMIT 100
        `);
        res.json({ 
            success: true, 
            daily_report: result[0],
            worker: process.pid 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Replica report failed',
            message: error.message 
        });
    }
});

// Test transaction status distribution
app.get("/api/test/status-distribution", async (req, res) => {
    try {
        const db = require('./db/db-connection');
        const result = await db.query(`
            SELECT 
                status,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM er_recharge), 2) as percentage
            FROM er_recharge 
            WHERE created_on >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY status
            ORDER BY count DESC
        `);
        res.json({ 
            success: true, 
            status_distribution: result[0],
            worker: process.pid 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Status distribution failed',
            message: error.message 
        });
    }
});
// =================================================End of Safe database test endpoints==============================================================

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
