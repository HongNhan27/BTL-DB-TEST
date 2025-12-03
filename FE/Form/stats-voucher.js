// FE/Form/stats-voucher.js
const API_BASE = '/api';

async function handleVSForm(e) {
  e.preventDefault();
  const cid = document.getElementById('vs-cid').value;
  const from = document.getElementById('vs-from').value;
  const to = document.getElementById('vs-to').value;
  const msgDiv = document.getElementById('vs-message');
  msgDiv.style.display = 'block'; 
  msgDiv.textContent = '';

  if (!cid || !from || !to) {
    msgDiv.textContent = 'Nhập đầy đủ customerID, fromDate, toDate.';
    msgDiv.className = 'message error';
    return;
  }

  try {
    const url = `${API_BASE}/stats/voucherSaving?customerID=${cid}&fromDate=${from}&toDate=${to}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || data.message);

    msgDiv.textContent = data.message;
    msgDiv.className = 'message success';

  } catch (err) {
    msgDiv.textContent = 'Lỗi: ' + err.message;
    msgDiv.className = 'message error';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('vs-form').addEventListener('submit', handleVSForm);
});
