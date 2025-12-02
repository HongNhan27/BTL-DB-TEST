// server.js
const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
// Middleware parse body JSON
app.use(express.json());// Nếu bạn submit form dạng application/x-www-form-urlencoded thì cần thêm:
app.use(express.urlencoded({ extended: true }));
// Serve static FE (HTML/JS/CSS)
app.use(express.static(path.join(__dirname, 'FE')));
// API routes
const mainRouter = require('./BE/routers/mainRouter');
app.use('/api', mainRouter);
// Trang chính: trả về file HTML (FE/Form/index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'FE', 'Form', 'index.html'));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});