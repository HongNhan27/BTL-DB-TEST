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
    msgDiv.textContent = 'Vui lòng nhập đầy đủ thông tin.';
    msgDiv.className = 'message error';
    msgDiv.style.display = 'block';
    return;
  }

  if (new Date(fromDate) > new Date(toDate)) {
    msgDiv.textContent = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc.';
    msgDiv.className = 'message error';
    msgDiv.style.display = 'block';
    return;
  }

  if (parseFloat(minTotal) < 0) {
    msgDiv.textContent = 'Tổng tối thiểu phải lớn hơn hoặc bằng 0.';
    msgDiv.className = 'message error';
    msgDiv.style.display = 'block';
    return;
  }

  try {
    tbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
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
      const tongDoanhThu = new Intl.NumberFormat('vi-VN').format(parseFloat(r.tong_doanh_thu || 0));
      const giaTriTB = new Intl.NumberFormat('vi-VN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(parseFloat(r.gia_tri_trung_binh || 0));
      
      tr.innerHTML = `
        <td>${r.restaurant_ID}</td>
        <td>${r.restaurant_name || ''}</td>
        <td>${r.so_don_hang || 0}</td>
        <td>${tongDoanhThu} đ</td>
        <td>${giaTriTB} đ</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    msgDiv.textContent = 'Lỗi: ' + err.message;
    msgDiv.className = 'message error';
    msgDiv.style.display = 'block';
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Lỗi khi tải dữ liệu</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('rs-form').addEventListener('submit', handleRSForm);
});
