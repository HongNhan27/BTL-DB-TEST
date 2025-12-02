// FE/Form/restaurant-stats.js
const API_BASE = '/api';

async function handleRSForm(e) {
  e.preventDefault();
  const fromDate = document.getElementById('rs-from').value;
  const toDate = document.getElementById('rs-to').value;
  const minTotal = document.getElementById('rs-min').value;
  const msgDiv = document.getElementById('rs-message');
  const tbody = document.querySelector('#rs-table tbody');

  msgDiv.textContent = '';
  tbody.innerHTML = '';

  if (!fromDate || !toDate || !minTotal) {
    msgDiv.textContent = 'Nhập đầy đủ from/to/minTotal.';
    msgDiv.className = 'message error';
    return;
  }

  try {
    const url = `${API_BASE}/stats/restaurantsales?fromDate=${fromDate}&toDate=${toDate}&minTotal=${minTotal}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || data.message);

    const list = data.data;
    if (!list || list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">Không có dữ liệu.</td></tr>';
      return;
    }

    list.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.restaurant_ID}</td>
        <td>${r.restaurant_name}</td>
        <td>${r.so_don_hang}</td>
        <td>${r.tong_doanh_thu}</td>
        <td>${r.gia_tri_trung_binh}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    msgDiv.textContent = 'Lỗi: ' + err.message;
    msgDiv.className = 'message error';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('rs-form').addEventListener('submit', handleRSForm);
});
