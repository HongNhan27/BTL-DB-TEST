// FE/Form/orders.js
const API_BASE = '/api';

async function handleOrderSearch(e) {
  e.preventDefault();
  const customerID = document.getElementById('order-customer-id').value;
  const trangThai = document.getElementById('order-trangthai').value;
  const msgDiv = document.getElementById('orders-message');
  const tbody = document.querySelector('#orders-table tbody');

  msgDiv.textContent = '';
  tbody.innerHTML = '';

  if (!customerID || !trangThai) {
    msgDiv.textContent = 'Nhập đầy đủ CustomerID và trạng thái.';
    msgDiv.className = 'message error';
    return;
  }

  try {
    const url = `${API_BASE}/orders?customerID=${encodeURIComponent(customerID)}&trangThai=${encodeURIComponent(trangThai)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || data.message);

    const orders = data.data;
    if (!orders || orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">Không có dữ liệu.</td></tr>';
      return;
    }

    orders.forEach(o => {
      const tr = document.createElement('tr');
      const ngay = o.ngay_tao ? new Date(o.ngay_tao).toLocaleString() : '';
      tr.innerHTML = `
        <td>${o.order_ID}</td>
        <td>${ngay}</td>
        <td>${o.restaurant_name} (#${o.restaurant_ID})</td>
        <td>${o.trang_thai}</td>
        <td>${o.gia_don_hang}</td>
        <td>${o.phi_giao_hang}</td>
        <td>${o.dia_chi}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    msgDiv.textContent = 'Lỗi: ' + err.message;
    msgDiv.className = 'message error';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('order-search-form')
    .addEventListener('submit', handleOrderSearch);
});
