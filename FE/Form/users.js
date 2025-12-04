const API_BASE = '/api';
let editMode = false;
let editingUserId = null;

function formatTime24h(timeStr) {
  if (!timeStr) return null;

  // Match HH:MM
  const parts = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!parts) return null;

  // Thêm giây ":00" cho SQL TIME(0)
  const hour = parts[1].padStart(2, '0');
  const minute = parts[2];
  return `${hour}:${minute}:00`;
}
// Ẩn/hiện vùng theo vai trò
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('user-role').addEventListener('change', toggleRoleFields);
  document.getElementById('user-form').addEventListener('submit', handleSubmit);
  document.getElementById('user-cancel-edit-btn').addEventListener('click', cancelEdit);
  document.getElementById('user-search-btn').addEventListener('click', () => loadUsers(document.getElementById('user-search-input').value));
  document.getElementById('user-refresh-btn').addEventListener('click', () => loadUsers());
  loadUsers();
});

function toggleRoleFields() {
  const role = document.getElementById('user-role').value;
  document.querySelectorAll('.role-fields').forEach(div => div.style.display = 'none');
  if (role === 'RESTAURANT') document.getElementById('restaurant-fields').style.display = 'block';
  if (role === 'SHIPPER') document.getElementById('shipper-fields').style.display = 'block';
  if (role === 'ADMIN') document.getElementById('admin-fields').style.display = 'block';
}

// Hiển thị thông báo
function showMsg(msg, isErr = false) {
  const div = document.getElementById('user-message');
  div.textContent = msg;
  div.className = 'message ' + (isErr ? 'error' : 'success');
  div.style.display = 'block';
  setTimeout(() => div.style.display = 'none', 4000);
}

// ================= LOAD USERS =================
async function loadUsers(search = '') {
  const tbody = document.querySelector('#users-table tbody');
  tbody.innerHTML = '<tr><td colspan="7">Đang tải...</td></tr>';
  try {
    const res = await fetch(`${API_BASE}/users?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const users = data.data;
    tbody.innerHTML = '';
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có dữ liệu</td></tr>';
      return;
    }
    for (const u of users) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.ID}</td>
        <td>${u.Ho_ten}</td>
        <td>${u.Email}</td>
        <td>${u.SDT || ''}</td>
        <td>${u.vai_tro || ''}</td>
        <td>${u.Dia_chi || ''}</td>
        <td>
          <button class="btn btn-edit" data-id="${u.ID}">Sửa</button>
          <button class="btn btn-delete" data-id="${u.ID}">Xóa</button>
        </td>`;
      tbody.appendChild(tr);
    }

    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => startEdit(b.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => deleteUser(b.dataset.id)));
  } catch (err) {
    console.error(err);
    showMsg('Lỗi tải users: ' + err.message, true);
  }
}

// ================= CREATE / UPDATE =================
async function handleSubmit(e) {
  e.preventDefault();

  const payload = collectFormData();
  if (!payload) return;

  try {
    let method = 'POST';
    let url = `${API_BASE}/users`;
    if (editMode && editingUserId) {
      method = 'PUT';
      url = `${API_BASE}/users/${editingUserId}`;
      delete payload.ID;
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || data.message);
    showMsg(editMode ? 'Cập nhật thành công!' : 'Thêm user thành công!');
    cancelEdit();
    loadUsers();
  } catch (err) {
    showMsg('Lỗi: ' + err.message, true);
  }
}

// Thu thập dữ liệu form
function collectFormData() {
  const ID = parseInt(document.getElementById('user-id').value);
  const Ho_ten = document.getElementById('user-hoten').value.trim();
  const Email = document.getElementById('user-email').value.trim();
  const SDT = document.getElementById('user-sdt').value.trim();
  const Password = document.getElementById('user-password').value.trim();
  const TKNH = document.getElementById('user-tknh').value.trim();
  const Dia_chi = document.getElementById('user-diachi').value.trim();
  const vai_tro = document.getElementById('user-role').value;

  if (!Ho_ten || !Email || !vai_tro) {
    showMsg('Vui lòng nhập đầy đủ họ tên, email và vai trò.', true);
    return null;
  }

  const payload = { ID, Ho_ten, Email, SDT, Password, TKNH, Dia_chi, vai_tro };

  if (vai_tro === 'RESTAURANT') {
    const open = document.getElementById('rest-open').value.trim();
    const close = document.getElementById('rest-close').value.trim();

    // Validate bằng regex trước khi gửi
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (open && !timePattern.test(open)) {
      showMsg('Giờ mở cửa không hợp lệ. Nhập HH:MM (24h).', true);
      return null;
    }
    if (close && !timePattern.test(close)) {
      showMsg('Giờ đóng cửa không hợp lệ. Nhập HH:MM (24h).', true);
      return null;
    }

    payload.Thoi_gian_mo_cua = formatTime24h(open);
    payload.Thoi_gian_dong_cua = formatTime24h(close);
    payload.Trang_thai_rest = document.getElementById('rest-status').value;

  }
  if (vai_tro === 'SHIPPER') {
    payload.bien_so_xe = document.getElementById('ship-plate').value;
    payload.trang_thai_ship = document.getElementById('ship-status').value;
  }
  if (vai_tro === 'ADMIN') {
    payload.quyen_han = document.getElementById('admin-role').value;
  }
  return payload;
}

// ================= EDIT =================
function startEdit(id) {
  const tr = [...document.querySelectorAll('#users-table tbody tr')].find(r => r.children[0].textContent == id);
  if (!tr) return;
  const [ID, Ho_ten, Email, SDT, vai_tro, Dia_chi] = [...tr.children].map(td => td.textContent);

  document.getElementById('user-id').value = ID;
  document.getElementById('user-id').disabled = true;
  document.getElementById('user-hoten').value = Ho_ten;
  document.getElementById('user-email').value = Email;
  document.getElementById('user-sdt').value = SDT;
  document.getElementById('user-tknh').value = '';
  document.getElementById('user-diachi').value = Dia_chi;
  document.getElementById('user-password').value = '';
  document.getElementById('user-role').value = vai_tro;
  toggleRoleFields();

  editMode = true;
  editingUserId = ID;
  document.getElementById('user-form-title').textContent = 'Cập nhật user';
  document.getElementById('user-submit-btn').textContent = 'Lưu thay đổi';
  document.getElementById('user-cancel-edit-btn').style.display = 'inline-block';
  showMsg('Đang chỉnh sửa user ID ' + ID);
}

function cancelEdit() {
  editMode = false;
  editingUserId = null;
  document.getElementById('user-id').disabled = false;
  document.getElementById('user-form').reset();
  toggleRoleFields();
  document.getElementById('user-form-title').textContent = 'Thêm user mới';
  document.getElementById('user-submit-btn').textContent = 'Tạo mới';
  document.getElementById('user-cancel-edit-btn').style.display = 'none';
}

// ================= DELETE =================
async function deleteUser(id) {
  if (!confirm('Bạn có chắc muốn xóa user ID ' + id + '?')) return;
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || data.message);
    showMsg('Đã xóa user ID ' + id);
    loadUsers();
  } catch (err) {
    showMsg('Lỗi xóa: ' + err.message, true);
  }
}
