// FE/Form/users.js
const API_BASE = '/api';

// ========================== CRUD USERS ==========================
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
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không có dữ liệu.</td></tr>';
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
          <button class="btn-edit action-btn edit" data-id="${u.ID}">Sửa</button>
          <button class="btn-delete action-btn delete" data-id="${u.ID}">Xóa</button>
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
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Lỗi khi tải dữ liệu</td></tr>';
  }
}

function showUserMessage(msg, isError = false) {
  const msgDiv = document.getElementById('user-message');
  msgDiv.textContent = msg;
  msgDiv.className = 'message ' + (isError ? 'error' : 'success');
  msgDiv.style.display = 'block';
  
  // Tự động ẩn sau 5 giây
  setTimeout(() => {
    msgDiv.style.display = 'none';
  }, 5000);
}

// Validation functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  return /^0[0-9]{9}$/.test(phone);
}

function validatePassword(password) {
  if (password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

function validateBankAccount(account) {
  return /^[0-9]{10,16}$/.test(account);
}

function validateName(name) {
  // Chỉ cho phép chữ cái (có dấu) và khoảng trắng
  return /^[A-Za-zÀ-ỹ\s]+$/.test(name) && name.trim().length > 0;
}

// Bắt đầu edit: fill form với dữ liệu hàng được chọn
function startEditUser(id) {
  const row = [...document.querySelectorAll('#users-table tbody tr')]
    .find(tr => tr.children[0].textContent === String(id));

  if (!row) return;

  const [idCell, nameCell, emailCell, sdtCell, tknhCell, diachiCell] = row.children;

  document.getElementById('user-id').value = idCell.textContent;
  document.getElementById('user-id').disabled = true;
  document.getElementById('user-hoten').value = nameCell.textContent;
  document.getElementById('user-email').value = emailCell.textContent;
  document.getElementById('user-sdt').value = sdtCell.textContent;
  document.getElementById('user-tknh').value = tknhCell.textContent;
  document.getElementById('user-diachi').value = diachiCell.textContent;
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = false;

  editMode = true;
  editingUserId = id;
  document.getElementById('user-form-title').textContent = 'Cập nhật user';
  document.getElementById('user-submit-btn').textContent = 'Lưu thay đổi';
  document.getElementById('user-cancel-edit-btn').style.display = 'inline-block';
  
  // Scroll to form
  document.getElementById('user-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  document.getElementById('user-password').required = true;
  showUserMessage('Đã hủy chỉnh sửa', false);
}

// Validate form data
function validateUserForm() {
  const id = document.getElementById('user-id').value;
  const hoten = document.getElementById('user-hoten').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const sdt = document.getElementById('user-sdt').value.trim();
  const password = document.getElementById('user-password').value;
  const tknh = document.getElementById('user-tknh').value.trim();
  const diachi = document.getElementById('user-diachi').value.trim();

  // Validate ID
  if (!id || parseInt(id) < 1) {
    showUserMessage('ID phải là số nguyên dương', true);
    return false;
  }

  // Validate Họ tên
  if (!hoten) {
    showUserMessage('Họ tên không được để trống', true);
    return false;
  }
  if (!validateName(hoten)) {
    showUserMessage('Họ tên chỉ được chứa chữ cái và dấu cách', true);
    return false;
  }

  // Validate Email
  if (!email) {
    showUserMessage('Email không được để trống', true);
    return false;
  }
  if (!validateEmail(email)) {
    showUserMessage('Định dạng email không hợp lệ', true);
    return false;
  }

  // Validate SĐT
  if (!sdt) {
    showUserMessage('Số điện thoại không được để trống', true);
    return false;
  }
  if (!validatePhone(sdt)) {
    showUserMessage('Số điện thoại phải có 10 số và bắt đầu bằng 0', true);
    return false;
  }

  // Validate Password (chỉ khi tạo mới hoặc có nhập)
  if (!editMode && !password) {
    showUserMessage('Mật khẩu không được để trống', true);
    return false;
  }
  if (password && !validatePassword(password)) {
    showUserMessage('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái, chữ số và ký tự đặc biệt', true);
    return false;
  }

  // Validate TKNH
  if (!tknh) {
    showUserMessage('Tài khoản ngân hàng không được để trống', true);
    return false;
  }
  if (!validateBankAccount(tknh)) {
    showUserMessage('Tài khoản ngân hàng phải có từ 10 đến 16 chữ số', true);
    return false;
  }

  // Validate Địa chỉ
  if (!diachi) {
    showUserMessage('Địa chỉ không được để trống', true);
    return false;
  }

  return true;
}

// Submit form create/update
async function handleUserFormSubmit(e) {
  e.preventDefault();

  if (!validateUserForm()) {
    return;
  }

  const id = document.getElementById('user-id').value;
  const hoten = document.getElementById('user-hoten').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const sdt = document.getElementById('user-sdt').value.trim();
  const password = document.getElementById('user-password').value;
  const tknh = document.getElementById('user-tknh').value.trim();
  const diachi = document.getElementById('user-diachi').value.trim();

  const payload = {
    ID: parseInt(id, 10),
    Ho_ten: hoten,
    Email: email,
    SDT: sdt,
    Password: password || undefined,
    TKNH: tknh,
    Dia_chi: diachi
  };

  try {
    let url = `${API_BASE}/users`;
    let method = 'POST';

    if (editMode && editingUserId) {
      url = `${API_BASE}/users/${editingUserId}`;
      method = 'PUT';
      delete payload.ID;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      const errorMsg = data.error || data.message || 'Lỗi không xác định';
      throw new Error(errorMsg);
    }

    showUserMessage(data.message || (editMode ? 'Cập nhật thành công' : 'Thêm user thành công'));
    cancelEditUser();
    
    // Tải lại danh sách
    const searchValue = document.getElementById('user-search-input').value || '';
    await loadUsers(searchValue);

  } catch (err) {
    console.error(err);
    showUserMessage('Lỗi: ' + err.message, true);
  }
}

// Xóa user
async function deleteUser(id) {
  const userName = [...document.querySelectorAll('#users-table tbody tr')]
    .find(tr => tr.children[0].textContent === String(id))?.children[1]?.textContent || id;

  if (!confirm(`Bạn có chắc chắn muốn xóa user "${userName}" (ID: ${id})?\n\nLưu ý: Nếu user này đã có đơn hàng hoặc liên quan đến dữ liệu khác, việc xóa có thể thất bại.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();

    if (!data.success) {
      const errorMsg = data.error || data.message || 'Lỗi không xác định';
      throw new Error(errorMsg);
    }

    showUserMessage(data.message || 'Xóa user thành công');
    const searchValue = document.getElementById('user-search-input').value || '';
    await loadUsers(searchValue);

  } catch (err) {
    console.error(err);
    showUserMessage('Lỗi khi xóa: ' + err.message, true);
  }
}

// ========================== DOMContentLoaded ==========================
document.addEventListener('DOMContentLoaded', () => {
  // Load users khi trang load
  loadUsers();

  // Form submit
  document.getElementById('user-form').addEventListener('submit', handleUserFormSubmit);
  
  // Cancel edit
  document.getElementById('user-cancel-edit-btn').addEventListener('click', cancelEditUser);

  // Search
  document.getElementById('user-search-btn').addEventListener('click', () => {
    const search = document.getElementById('user-search-input').value || '';
    loadUsers(search);
  });

  // Search on Enter
  document.getElementById('user-search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('user-search-btn').click();
    }
  });

  // Refresh
  document.getElementById('user-refresh-btn').addEventListener('click', () => {
    document.getElementById('user-search-input').value = '';
    loadUsers('');
    showUserMessage('Đã tải lại danh sách', false);
  });
});
