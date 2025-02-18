const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || "172.28.28.101" ,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "AFP@#$Devel0per",
    database: process.env.DB_DATABASE || "afghanpaydb" ,
    waitForConnections: true,
    connectionLimit: 500,
    queueLimit: 1000,
    multipleStatements: true,
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to the database!');
        connection.release();
    }
});
