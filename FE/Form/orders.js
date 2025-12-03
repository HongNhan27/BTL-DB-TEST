// FE/Form/orders.js
const API_BASE = '/api';

let currentOrders = [];
let currentCustomerID = null;
let currentTrangThai = null;

// Status transition rules
const statusTransitions = {
  'đang xử lý': ['đang giao', 'hủy'],
  'đang giao': ['hoàn tất'],
  'hoàn tất': [],
  'hủy': []
};

function showOrderMessage(msg, isError = false) {
  const msgDiv = document.getElementById('orders-message');
  msgDiv.textContent = msg;
  msgDiv.className = 'message ' + (isError ? 'error' : 'success');
  msgDiv.style.display = 'block';
  
  setTimeout(() => {
    msgDiv.style.display = 'none';
  }, 5000);
}

// Load orders from stored procedure
async function loadOrders(customerID, trangThai) {
  const tbody = document.querySelector('#orders-table tbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Đang tải...</td></tr>';

  try {
    const url = `${API_BASE}/orders?customerID=${encodeURIComponent(customerID)}&trangThai=${encodeURIComponent(trangThai)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || data.message || 'Lỗi API');
    }

    currentOrders = data.data || [];
    currentCustomerID = customerID;
    currentTrangThai = trangThai;

    if (currentOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không tìm thấy đơn hàng nào.</td></tr>';
      document.getElementById('table-controls').style.display = 'none';
      return;
    }

    displayOrders(currentOrders);
    document.getElementById('table-controls').style.display = 'block';

  } catch (err) {
    console.error(err);
    showOrderMessage('Lỗi khi tải danh sách đơn hàng: ' + err.message, true);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Lỗi khi tải dữ liệu</td></tr>';
    document.getElementById('table-controls').style.display = 'none';
  }
}

// Display orders in table
function displayOrders(orders) {
  const tbody = document.querySelector('#orders-table tbody');
  tbody.innerHTML = '';

  orders.forEach(order => {
    const tr = document.createElement('tr');
    const ngayTao = order.ngay_tao ? new Date(order.ngay_tao).toLocaleString('vi-VN') : '';
    const giaDon = new Intl.NumberFormat('vi-VN').format(order.gia_don_hang || 0);
    const phiGiao = new Intl.NumberFormat('vi-VN').format(order.phi_giao_hang || 0);
    
    tr.innerHTML = `
      <td>${order.order_ID}</td>
      <td>${ngayTao}</td>
      <td>${order.restaurant_name || ''} (#${order.restaurant_ID || ''})</td>
      <td><span class="status-badge status-${order.trang_thai.replace(/\s+/g, '-')}">${order.trang_thai}</span></td>
      <td>${giaDon} đ</td>
      <td>${phiGiao} đ</td>
      <td>${order.dia_chi || ''}</td>
      <td>
        <button class="btn-edit-order action-btn edit" data-id="${order.order_ID}" data-status="${order.trang_thai}">Sửa</button>
        <button class="btn-delete-order action-btn delete" data-id="${order.order_ID}" data-status="${order.trang_thai}">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners
  document.querySelectorAll('.btn-edit-order').forEach(btn => {
    btn.addEventListener('click', () => openUpdateModal(
      parseInt(btn.dataset.id),
      btn.dataset.status
    ));
  });

  document.querySelectorAll('.btn-delete-order').forEach(btn => {
    btn.addEventListener('click', () => deleteOrder(
      parseInt(btn.dataset.id),
      btn.dataset.status
    ));
  });
}

// Sort orders
function sortOrders(orders, sortBy, sortOrder) {
  const sorted = [...orders];
  sorted.sort((a, b) => {
    let aVal, bVal;
    
    switch(sortBy) {
      case 'ngay_tao':
        aVal = new Date(a.ngay_tao || 0);
        bVal = new Date(b.ngay_tao || 0);
        break;
      case 'gia_don_hang':
        aVal = parseFloat(a.gia_don_hang || 0);
        bVal = parseFloat(b.gia_don_hang || 0);
        break;
      case 'order_ID':
        aVal = parseInt(a.order_ID || 0);
        bVal = parseInt(b.order_ID || 0);
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
  
  return sorted;
}

// Open update modal
function openUpdateModal(orderID, currentStatus) {
  const modal = document.getElementById('update-modal');
  const select = document.getElementById('new-status');
  
  document.getElementById('update-order-id').value = orderID;
  document.getElementById('update-order-id-display').textContent = orderID;
  document.getElementById('current-status-display').textContent = currentStatus;
  
  // Populate available status options based on current status
  select.innerHTML = '<option value="">--Chọn trạng thái--</option>';
  
  if (statusTransitions[currentStatus]) {
    statusTransitions[currentStatus].forEach(status => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      select.appendChild(option);
    });
  }
  
  if (select.options.length === 1) {
    showOrderMessage('Đơn hàng này không thể chuyển trạng thái', true);
    return;
  }
  
  modal.style.display = 'block';
}

// Close update modal
function closeUpdateModal() {
  document.getElementById('update-modal').style.display = 'none';
  document.getElementById('update-status-form').reset();
}

// Update order status
async function updateOrderStatus(orderID, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderID}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trangThai: newStatus })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || data.message || 'Lỗi không xác định');
    }

    showOrderMessage(data.message || 'Cập nhật trạng thái thành công');
    closeUpdateModal();
    
    // Reload orders
    if (currentCustomerID && currentTrangThai) {
      await loadOrders(currentCustomerID, currentTrangThai);
    }

  } catch (err) {
    console.error(err);
    showOrderMessage('Lỗi khi cập nhật: ' + err.message, true);
  }
}

// Delete order
async function deleteOrder(orderID, currentStatus) {
  if (currentStatus !== 'hủy') {
    showOrderMessage('Chỉ có thể xóa đơn hàng đã ở trạng thái "hủy"', true);
    return;
  }

  const confirmMsg = `Bạn có chắc chắn muốn xóa đơn hàng #${orderID}?\n\nLưu ý: Hành động này không thể hoàn tác.`;
  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/orders/${orderID}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || data.message || 'Lỗi không xác định');
    }

    showOrderMessage(data.message || 'Xóa đơn hàng thành công');
    
    // Reload orders
    if (currentCustomerID && currentTrangThai) {
      await loadOrders(currentCustomerID, currentTrangThai);
    }

  } catch (err) {
    console.error(err);
    showOrderMessage('Lỗi khi xóa: ' + err.message, true);
  }
}

// Handle search form
async function handleOrderSearch(e) {
  e.preventDefault();
  
  const customerID = document.getElementById('order-customer-id').value.trim();
  const trangThai = document.getElementById('order-trangthai').value;

  // Validation
  if (!customerID) {
    showOrderMessage('Vui lòng nhập Customer ID', true);
    return;
  }

  if (parseInt(customerID, 10) < 1) {
    showOrderMessage('Customer ID phải là số nguyên dương', true);
    return;
  }

  if (!trangThai) {
    showOrderMessage('Vui lòng chọn trạng thái', true);
    return;
  }

  await loadOrders(parseInt(customerID, 10), trangThai);
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Search form
  document.getElementById('order-search-form').addEventListener('submit', handleOrderSearch);

  // Refresh button
  document.getElementById('order-refresh-btn').addEventListener('click', () => {
    document.getElementById('order-customer-id').value = '';
    document.getElementById('order-trangthai').value = '';
    document.querySelector('#orders-table tbody').innerHTML = '<tr><td colspan="8" style="text-align: center;">Vui lòng tìm kiếm đơn hàng</td></tr>';
    document.getElementById('table-controls').style.display = 'none';
    showOrderMessage('Đã làm mới', false);
  });

  // Sort
  document.getElementById('apply-sort-btn').addEventListener('click', () => {
    if (currentOrders.length === 0) return;
    
    const sortBy = document.getElementById('sort-by').value;
    const sortOrder = document.getElementById('sort-order').value;
    const sorted = sortOrders(currentOrders, sortBy, sortOrder);
    displayOrders(sorted);
  });

  // Update status form
  document.getElementById('update-status-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const orderID = parseInt(document.getElementById('update-order-id').value, 10);
    const newStatus = document.getElementById('new-status').value;
    
    if (!newStatus) {
      showOrderMessage('Vui lòng chọn trạng thái mới', true);
      return;
    }
    
    updateOrderStatus(orderID, newStatus);
  });

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('update-modal');
    if (e.target === modal) {
      closeUpdateModal();
    }
  });
});
