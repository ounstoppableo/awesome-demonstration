const mysql = require('mysql2/promise');

// 连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // 限制最大连接数
  queueLimit: 0,
});

// 导出连接池
module.exports = pool;
