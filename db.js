const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'ash',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds
});

// Test the connection
(async () => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    console.log(`✅ Connected to MySQL. Server time: ${rows[0].now}`);
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    process.exit(1); // Exit if DB connection fails
  }
})();

module.exports = { pool };

