// BE/routers/mainRouter.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/mainController');

// USERS CRUD
router.get('/users', controller.getUsers);
router.post('/users', controller.createUser);
router.put('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

// ORDERS – GetOrderByCustomerAndStatus
router.get('/orders', controller.searchOrders);

// STATS – fn_TongChiTieuKhachHang
router.get('/stats/spending', controller.getCustomerSpending);

// STATS – GetRestaurantSalesStats
router.get('/stats/restaurantsales', controller.getRestaurantSalesStats);

// STATS – fn_TongTienTietKiemTuVoucher
router.get('/stats/voucherSaving', controller.getCustomerVoucherSaving);

module.exports = router;
