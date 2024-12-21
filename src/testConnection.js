const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'maindatabase.cgrxb7qxgahh.me-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'Ne*Y#kjroie7knslke>???WFJ', // Ensure the password matches
    database: 'afghanpaydb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000, // 60 seconds
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to the database!');
        connection.release();
    }
});
