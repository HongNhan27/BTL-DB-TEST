// BE/database/db.js
// Cấu hình pool kết nối
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true // dev local thì để true
  }
};
// Tạo 1 pool dùng chung cho toàn app
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ Failed to connect to SQL Server:', err);
    throw err;
  });
module.exports = {
  sql,
  poolPromise
};