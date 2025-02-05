require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'maindatabase.cgrxb7qxgahh.me-south-1.rds.amazonaws.com',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'Ne*Y#kjroie7knslke>???WFJ',
    database: process.env.DB_DATABASE || 'afghanpaydb',
    port: process.env.DB_PORT || 3306,
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        if (err.code === 'ENOTFOUND') {
            console.error('The hostname could not be resolved. Check your network and DNS configuration.');
        } else if (err.code === 'ETIMEDOUT') {
            console.error('The connection attempt timed out. Check your Security Group and firewall settings.');
        }
        process.exit(1);
    } else {
        console.log('Connected to the database successfully!');
        connection.end();
    }
});
