// FE/Form/stats-spending.js
const API_BASE = '/api';

async function handleSPForm(e) {
  
  e.preventDefault();
  const cid = document.getElementById('sp-cid').value;
  const from = document.getElementById('sp-from').value;
  const to = document.getElementById('sp-to').value;
  const msgDiv = document.getElementById('sp-message');
  msgDiv.style.display = 'block'; 
  msgDiv.textContent = '';

  if (!cid || !from || !to) {
    msgDiv.textContent = 'Nhập đầy đủ customerID, fromDate, toDate.';
    msgDiv.className = 'message error';
    return;
  }

  try {
    const url = `${API_BASE}/stats/spending?customerID=${cid}&fromDate=${from}&toDate=${to}`;
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
  document.getElementById('sp-form').addEventListener('submit', handleSPForm);
});
