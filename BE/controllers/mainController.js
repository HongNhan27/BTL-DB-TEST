// BE/controllers/mainController.js
const { sql, poolPromise } = require('../database/db');
/**
 * API: GET /api/users
 * - Lấy danh sách users, kèm search (theo tên/email/SĐT) nếu có query ?search=
 */
exports.getUsers = async (req, res) => {
  const search = req.query.search || '';

  try {
    const pool = await poolPromise;
    let query = `
      SELECT ID, Ho_ten, Email, SDT, TKNH, Dia_chi
      FROM USERS
      WHERE 1 = 1
    `;

    const request = pool.request();

    if (search) {
      query += `
        AND (
          Ho_ten LIKE @search
          OR Email LIKE @search
          OR SDT   LIKE @search
        )
      `;
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    // Có thể thêm ORDER BY ID nếu muốn
    query += ' ORDER BY ID ASC';

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách users',
      error: err.message
    });
  }
};
/**
 * API: POST /api/users
 * - Thêm user mới bằng stored procedure InsertUser
 * Body JSON: { ID, Ho_ten, Email, SDT, Password, TKNH, Dia_chi }
 */
exports.createUser = async (req, res) => {
  const { ID, Ho_ten, Email, SDT, Password, TKNH, Dia_chi } = req.body;

  // Validate cơ bản (ở FE cũng nên validate nữa)
  if (!ID || !Ho_ten || !Email) {
    return res.status(400).json({
      success: false,
      message: 'ID, Ho_ten, Email là bắt buộc'
    });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('ID', sql.Int, parseInt(ID, 10))
      .input('Ho_ten', sql.NVarChar(40), Ho_ten)
      .input('Email', sql.VarChar(320), Email)
      .input('SDT', sql.VarChar(10), SDT)
      .input('Password', sql.VarChar(100), Password)
      .input('TKNH', sql.VarChar(20), TKNH)
      .input('Dia_chi', sql.NVarChar(255), Dia_chi);

    await request.execute('InsertUser');

    res.json({ success: true, message: 'Thêm user thành công' });
  } catch (err) {
    console.error(err);
    const sqlMsg =
      err.originalError && err.originalError.info
        ? err.originalError.info.message
        : err.message;

    res.status(400).json({
      success: false,
      message: 'Lỗi khi thêm user',
      error: sqlMsg
    });
  }
};
/**
 * API: PUT /api/users/:id
 * - Cập nhật user bằng stored procedure UpdateUser
 */
exports.updateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { Ho_ten, Email, SDT, Password, TKNH, Dia_chi } = req.body;

  if (!Ho_ten || !Email) {
    return res.status(400).json({
      success: false,
      message: 'Ho_ten và Email là bắt buộc'
    });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('ID', sql.Int, id)
      .input('Ho_ten', sql.NVarChar(40), Ho_ten)
      .input('Email', sql.VarChar(320), Email)
      .input('SDT', sql.VarChar(10), SDT)
      .input('Password', sql.VarChar(100), Password)
      .input('TKNH', sql.VarChar(20), TKNH)
      .input('Dia_chi', sql.NVarChar(255), Dia_chi);

    await request.execute('UpdateUser');

    res.json({ success: true, message: 'Cập nhật user thành công' });
  } catch (err) {
    console.error(err);
    const sqlMsg =
      err.originalError && err.originalError.info
        ? err.originalError.info.message
        : err.message;

    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật user',
      error: sqlMsg
    });
  }
};
/**
 * API: DELETE /api/users/:id
 * - Xóa user bằng stored procedure DeleteUser
 *   -> có xử lý logic: không cho xóa nếu liên quan ORDERS/SHIPPER/RESTAURANT
 */
exports.deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const pool = await poolPromise;
    const request = pool.request().input('UserID', sql.Int, id);

    await request.execute('DeleteUser');

    res.json({ success: true, message: 'Xóa user thành công' });
  } catch (err) {
    console.error(err);
    const sqlMsg =
      err.originalError && err.originalError.info
        ? err.originalError.info.message
        : err.message;

    res.status(400).json({
      success: false,
      message: 'Lỗi khi xóa user',
      error: sqlMsg
    });
  }
};
/**
 * API: GET /api/orders
 * - Gọi stored procedure GetOrderByCustomerAndStatus
 * Query: ?customerID=3&trangThai=hoàn%20tất
 */
exports.searchOrders = async (req, res) => {
  const customerID = req.query.customerID;
  const trangThai = req.query.trangThai; // N'đang xử lý', ...

  if (!customerID || !trangThai) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu customerID hoặc trangThai'
    });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('CustomerID', sql.Int, parseInt(customerID, 10))
      .input('TrangThai', sql.NVarChar(50), trangThai);

    const result = await request.execute('GetOrderByCustomerAndStatus');

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    const sqlMsg =
      err.originalError && err.originalError.info
        ? err.originalError.info.message
        : err.message;

    res.status(400).json({
      success: false,
      message: 'Lỗi khi tìm kiếm đơn hàng',
      error: sqlMsg
    });
  }
};
/**
 * API: GET /api/stats/spending
 * - Gọi function fn_TongChiTieuKhachHang
 * Query: ?customerID=3 & fromDate=2024-01-01 & toDate=2025-12-31
 */
exports.getCustomerSpending = async (req, res) => {
  const { customerID, fromDate, toDate } = req.query;

  if (!customerID || !fromDate || !toDate) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu customerID, fromDate hoặc toDate'
    });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('CustomerID', sql.Int, parseInt(customerID, 10))
      .input('FromDate', sql.DateTime, new Date(fromDate))
      .input('ToDate', sql.DateTime, new Date(toDate));

    const query = `
      SELECT dbo.fn_TongChiTieuKhachHang(@CustomerID, @FromDate, @ToDate) AS Total;
    `;
    const result = await request.query(query);
    const total = result.recordset[0].Total;

    let message = null;
    if (total < 0) {
      switch (total) {
        case -1:
          message = 'Lỗi: Tham số đầu vào NULL.';
          break;
        case -2:
          message = 'Lỗi: Khoảng thời gian không hợp lệ (FromDate > ToDate).';
          break;
        case -3:
          message = 'Lỗi: Khách hàng không tồn tại.';
          break;
        default:
          message = 'Lỗi không xác định.';
      }
    } else {
      message = `Tổng chi tiêu của khách hàng #${customerID} là ${total} (từ ${fromDate} đến ${toDate}).`;
    }

    res.json({ success: true, total, message });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tính tổng chi tiêu',
      error: err.message
    });
  }
};

// 3.3 – PROC GetRestaurantSalesStats
// API: GET /api/stats/restaurantsales?fromDate=2024-01-01&toDate=2026-01-01&minTotal=50000
exports.getRestaurantSalesStats = async (req, res) => {
  const { fromDate, toDate, minTotal } = req.query;

  if (!fromDate || !toDate || !minTotal) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu fromDate, toDate hoặc minTotal'
    });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('FromDate', sql.DateTime, new Date(fromDate))
      .input('ToDate', sql.DateTime, new Date(toDate))
      .input('MinTotal', sql.Decimal(10, 2), parseFloat(minTotal));

    const result = await request.execute('GetRestaurantSalesStats');

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error(err);
    const sqlMsg =
      err.originalError && err.originalError.info
        ? err.originalError.info.message
        : err.message;

    res.status(400).json({
      success: false,
      message: 'Lỗi khi thống kê doanh thu nhà hàng',
      error: sqlMsg
    });
  }
};

// 3.3 – FUNCTION fn_TongTienTietKiemTuVoucher
// API: GET /api/stats/voucherSaving?customerID=4&fromDate=2024-01-01&toDate=2026-01-01
exports.getCustomerVoucherSaving = async (req, res) => {
  const { customerID, fromDate, toDate } = req.query;

  if (!customerID || !fromDate || !toDate) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu customerID, fromDate hoặc toDate'
    });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('CustomerID', sql.Int, parseInt(customerID, 10))
      .input('FromDate', sql.DateTime, new Date(fromDate))
      .input('ToDate', sql.DateTime, new Date(toDate));

    const query = `
      SELECT dbo.fn_TongTienTietKiemTuVoucher(@CustomerID, @FromDate, @ToDate) AS TotalSaving;
    `;
    const result = await request.query(query);
    const total = result.recordset[0].TotalSaving;

    let message;
    if (total < 0) {
      switch (total) {
        case -1:
          message = 'Lỗi: Tham số đầu vào NULL.';
          break;
        case -2:
          message = 'Lỗi: Khoảng thời gian không hợp lệ (FromDate > ToDate).';
          break;
        case -3:
          message = 'Lỗi: Khách hàng không tồn tại.';
          break;
        default:
          message = 'Lỗi không xác định.';
      }
    } else {
      message = `Khách hàng #${customerID} đã tiết kiệm ${total} nhờ voucher (từ ${fromDate} đến ${toDate}).`;
    }

    res.json({
      success: true,
      total,
      message
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tính tổng tiền tiết kiệm từ voucher',
      error: err.message
    });
  }
};
