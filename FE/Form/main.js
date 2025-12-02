// FE/Form/main.js
// URL base của API (server.js dùng /api)c
const API_BASE = '/api';
// ==========================// 1. CRUD USERS// ==========================
let editMode = false;
let editingUserId = null;
// Gọi API lấy danh sách users
async function loadUsers(search = '') {
  const tableBody = document.querySelector('#users-table tbody');
  tableBody.innerHTML = '<tr><td colspan="7">Đang tải...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/users?search=${encodeURIComponent(search)}`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || 'Lỗi API');
    }

    const users = data.data;
    if (!users || users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7">Không có dữ liệu.</td></tr>';
      return;
    }

    tableBody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.ID}</td>
        <td>${u.Ho_ten}</td>
        <td>${u.Email}</td>
        <td>${u.SDT || ''}</td>
        <td>${u.TKNH || ''}</td>
        <td>${u.Dia_chi || ''}</td>
        <td>
          <button class="btn-edit" data-id="${u.ID}">Sửa</button>
          <button class="btn-delete" data-id="${u.ID}">Xóa</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Gắn event cho nút Sửa / Xóa
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => startEditUser(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.id));
    });

  } catch (err) {
    console.error(err);
    showUserMessage('Lỗi khi tải danh sách users: ' + err.message, true);
  }
}
function showUserMessage(msg, isError = false) {
  const msgDiv = document.getElementById('user-message');
  msgDiv.textContent = msg;
  msgDiv.className = 'message ' + (isError ? 'error' : 'success');
}
// Bắt đầu edit: fill form với dữ liệu hàng được chọn
function startEditUser(id) {
  // Lấy dữ liệu từ dòng trong bảng
  const row = [...document.querySelectorAll('#users-table tbody tr')]
    .find(tr => tr.children[0].textContent === String(id));

  if (!row) return;

  const [idCell, nameCell, emailCell, sdtCell, tknhCell, diachiCell] = row.children;

  document.getElementById('user-id').value = idCell.textContent;
  document.getElementById('user-id').disabled = true; // không cho đổi ID
  document.getElementById('user-hoten').value = nameCell.textContent;
  document.getElementById('user-email').value = emailCell.textContent;
  document.getElementById('user-sdt').value = sdtCell.textContent;
  document.getElementById('user-tknh').value = tknhCell.textContent;
  document.getElementById('user-diachi').value = diachiCell.textContent;
  document.getElementById('user-password').value = ''; // cho nhập lại

  editMode = true;
  editingUserId = id;
  document.getElementById('user-form-title').textContent = 'Cập nhật user';
  document.getElementById('user-submit-btn').textContent = 'Lưu';
  document.getElementById('user-cancel-edit-btn').style.display = 'inline-block';
}
// Hủy chế độ edit -> quay về create
function cancelEditUser() {
  editMode = false;
  editingUserId = null;
  document.getElementById('user-id').disabled = false;
  document.getElementById('user-form').reset();
  document.getElementById('user-form-title').textContent = 'Thêm user mới';
  document.getElementById('user-submit-btn').textContent = 'Tạo mới';
  document.getElementById('user-cancel-edit-btn').style.display = 'none';
}
// Submit form create/update
async function handleUserFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('user-id').value;
  const hoten = document.getElementById('user-hoten').value;
  const email = document.getElementById('user-email').value;
  const sdt = document.getElementById('user-sdt').value;
  const password = document.getElementById('user-password').value;
  const tknh = document.getElementById('user-tknh').value;
  const diachi = document.getElementById('user-diachi').value;

  // Validate đơn giản (có thể kiểm tra thêm pattern SĐT, email, ...)
  if (!id || !hoten || !email) {
    showUserMessage('ID, Họ tên, Email không được bỏ trống', true);
    return;
  }

  const payload = {
    ID: id,
    Ho_ten: hoten,
    Email: email,
    SDT: sdt,
    Password: password,
    TKNH: tknh,
    Dia_chi: diachi
  };

  try {
    let url = `${API_BASE}/users`;
    let method = 'POST';

    if (editMode && editingUserId) {
      url = `${API_BASE}/users/${editingUserId}`;
      method = 'PUT';
      // server không dùng ID trong body khi update, chỉ dùng params
      delete payload.ID;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || data.message || 'API error');
    }

    showUserMessage(data.message || 'Thành công');
    cancelEditUser();
    loadUsers(document.getElementById('user-search-input').value || '');

  } catch (err) {
    console.error(err);
    showUserMessage('Lỗi khi lưu user: ' + err.message, true);
  }
}
// Xóa user
async function deleteUser(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa user ' + id + ' ?')) return;

  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || data.message || 'API error');
    }

    showUserMessage(data.message || 'Xóa thành công');
    loadUsers(document.getElementById('user-search-input').value || '');

  } catch (err) {
    console.error(err);
    showUserMessage('Lỗi khi xóa user: ' + err.message, true);
  }
}
// ==========================// 2. Search orders (GetOrderByCustomerAndStatus)// ==========================
async function handleOrderSearch(e) {
  e.preventDefault();
  const customerID = document.getElementById('order-customer-id').value;
  const trangThai = document.getElementById('order-trangthai').value;
  const msgDiv = document.getElementById('orders-message');
  const tbody = document.querySelector('#orders-table tbody');

  msgDiv.textContent = '';
  tbody.innerHTML = '';

  if (!customerID || !trangThai) {
    msgDiv.textContent = 'Vui lòng nhập đầy đủ Customer ID và trạng thái.';
    msgDiv.className = 'message error';
    return;
  }

  try {
    const url = `${API_BASE}/orders?customerID=${encodeURIComponent(customerID)}&trangThai=${encodeURIComponent(trangThai)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || data.message || 'API error');
    }

    const orders = data.data;
    if (!orders || orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">Không tìm thấy đơn nào.</td></tr>';
      return;
    }

    orders.forEach(o => {
      const tr = document.createElement('tr');
      const ngayTao = o.ngay_tao ? new Date(o.ngay_tao).toLocaleString() : '';
      tr.innerHTML = `
        <td>${o.order_ID}</td>
        <td>${ngayTao}</td>
        <td>${o.restaurant_name} (#${o.restaurant_ID})</td>
        <td>${o.trang_thai}</td>
        <td>${o.gia_don_hang}</td>
        <td>${o.phi_giao_hang}</td>
        <td>${o.dia_chi}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    msgDiv.textContent = 'Lỗi khi tìm kiếm đơn hàng: ' + err.message;
    msgDiv.className = 'message error';
  }
}
// ==========================// 3. Stats spending (fn_TongChiTieuKhachHang)// ==========================
async function handleStatsForm(e) {
  e.preventDefault();
  const customerID = document.getElementById('stats-customer-id').value;
  const fromDate = document.getElementById('stats-from-date').value;
  const toDate = document.getElementById('stats-to-date').value;
  const msgDiv = document.getElementById('stats-message');

  msgDiv.textContent = '';

  if (!customerID || !fromDate || !toDate) {
    msgDiv.textContent = 'Vui lòng nhập đầy đủ thông tin.';
    msgDiv.className = 'message error';
    return;
  }

  try {
    const url = `${API_BASE}/stats/spending?customerID=${encodeURIComponent(customerID)}&fromDate=${fromDate}&toDate=${toDate}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || data.message || 'API error');
    }

    msgDiv.textContent = data.message;
    msgDiv.className = 'message success';

  } catch (err) {
    console.error(err);
    msgDiv.textContent = 'Lỗi khi tính toán: ' + err.message;
    msgDiv.className = 'message error';
  }
}
// ==========================// DOMContentLoaded: gắn event// ==========================
document.addEventListener('DOMContentLoaded', () => {
  // Users
  loadUsers();

  document.getElementById('user-form').addEventListener('submit', handleUserFormSubmit);
  document.getElementById('user-cancel-edit-btn').addEventListener('click', cancelEditUser);

  document.getElementById('user-search-btn').addEventListener('click', () => {
    const search = document.getElementById('user-search-input').value || '';
    loadUsers(search);
  });

  document.getElementById('user-refresh-btn').addEventListener('click', () => {
    document.getElementById('user-search-input').value = '';
    loadUsers('');
  });

  // Orders
  document.getElementById('order-search-form').addEventListener('submit', handleOrderSearch);

  // Stats
  document.getElementById('stats-form').addEventListener('submit', handleStatsForm);
});