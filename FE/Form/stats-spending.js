// FE/Form/stats-spending.js
const API_BASE = '/api';

async function handleSPForm(e) {
  e.preventDefault();
  const cid = document.getElementById('sp-cid').value;
  const from = document.getElementById('sp-from').value;
  const to = document.getElementById('sp-to').value;
  const msgDiv = document.getElementById('sp-message');

  msgDiv.textContent = '';

  if (!cid || !from || !to) {
    msgDiv.textContent = 'Vui lòng nhập đầy đủ thông tin.';
    msgDiv.className = 'message error';
    msgDiv.style.display = 'block';
    return;
  }

  if (parseInt(cid, 10) < 1) {
    msgDiv.textContent = 'Customer ID phải là số nguyên dương.';
    msgDiv.className = 'message error';
    msgDiv.style.display = 'block';
    return;
  }

  if (new Date(from) > new Date(to)) {
    msgDiv.textContent = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc.';
    msgDiv.className = 'message error';
    msgDiv.style.display = 'block';
    return;
  }

  try {
    msgDiv.textContent = 'Đang tính toán...';
    msgDiv.className = 'message';
    msgDiv.style.display = 'block';
    const url = `${API_BASE}/stats/spending?customerID=${cid}&fromDate=${from}&toDate=${to}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || data.message);

    const total = parseFloat(data.total || 0);
    let message = data.message;
    
    if (total !== null && total !== undefined && !isNaN(total)) {
      const formattedTotal = new Intl.NumberFormat('vi-VN').format(total);
      message = `Tổng chi tiêu của khách hàng #${cid}: ${formattedTotal} đ (từ ${from} đến ${to})`;
    }
    
    msgDiv.textContent = message;
    msgDiv.className = 'message success';
    msgDiv.style.display = 'block';

  } catch (err) {
    console.error(err);
    msgDiv.textContent = 'Lỗi: ' + err.message;
    msgDiv.className = 'message error';
    msgDiv.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sp-form').addEventListener('submit', handleSPForm);
});
