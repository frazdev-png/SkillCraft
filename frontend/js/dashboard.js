document.addEventListener('DOMContentLoaded', function() {
  if (!requireAuth()) return;
  loadUserInfo();
  loadPurchasedCourses();
  loadPendingOrders();
  loadRejectedOrders();
});

async function loadUserInfo() {
  try {
    const user = await apiGet('/auth/me');
    const nameEl = document.getElementById('dashboardUserName');
    if (nameEl) nameEl.textContent = user.name;
    const roleEl = document.getElementById('dashboardUserRole');
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Student';
  } catch {}
}

function switchDashboardTab(tab, btn) {
  document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('purchasedSection').style.display = tab === 'purchased' ? 'block' : 'none';
  document.getElementById('apkSection').style.display = tab === 'apks' ? 'block' : 'none';
  document.getElementById('pendingSection').style.display = tab === 'pending' ? 'block' : 'none';
  document.getElementById('rejectedSection').style.display = tab === 'rejected' ? 'block' : 'none';

  if (tab === 'apks') loadPurchasedApks();
  if (tab === 'pending') loadPendingOrders();
  if (tab === 'rejected') loadRejectedOrders();
}

async function loadPurchasedCourses() {
  const container = document.getElementById('purchasedCourses');
  showLoading();
  try {
    const purchases = await apiGet('/orders/my-purchases');
    if (purchases.length === 0) {
      container.innerHTML = `
        <div class="dashboard-empty" style="grid-column:1/-1;">
          <div class="empty-icon">&#128218;</div>
          <h3>No courses yet</h3>
          <p>Purchase a course from the courses page. Once admin approves your payment, it will appear here with the Open Course button.</p>
          <a href="courses.html" class="btn btn-primary mt-16" style="display:inline-block;">Browse Courses</a>
        </div>
      `;
      return;
    }
    container.innerHTML = purchases.map(p => `
      <div class="purchase-card">
        <img src="${p.thumbnail_url || 'https://via.placeholder.com/100x70/7c3aed/ffffff?text=Course'}" alt="${p.course_title}" onerror="this.src='https://via.placeholder.com/100x70/7c3aed/ffffff?text=Course'">
        <div class="info">
          <h3>${p.course_title}</h3>
          <div class="meta">
            <span>${p.difficulty || 'N/A'}</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> ${p.duration || 'N/A'}</span>
          </div>
          <div style="margin-top:6px;">
            <span class="approved-badge">&#9989; Approved &amp; Unlocked</span>
          </div>
        </div>
        <div class="action">
          <a href="${p.google_drive_link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">&#128279; Open Course</a>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = `
      <div class="dashboard-empty" style="grid-column:1/-1;">
        <div class="empty-icon">&#9888;</div>
        <h3>Error loading courses</h3>
        <p>${e.message}</p>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

async function loadPurchasedApks() {
  const container = document.getElementById('purchasedApks');
  showLoading();
  try {
    const apks = await apiGet('/apks/purchases/my-approved');
    if (apks.length === 0) {
      container.innerHTML = `
        <div class="dashboard-empty" style="grid-column:1/-1;">
          <div class="empty-icon">&#128230;</div>
          <h3>No APKs yet</h3>
          <p>Purchase a cracked APK from the APKs page. Once approved, it will appear here with the download button.</p>
          <a href="apks.html" class="btn btn-primary mt-16" style="display:inline-block;">Browse APKs</a>
        </div>
      `;
      return;
    }
    container.innerHTML = apks.map(a => `
      <div class="purchase-card">
        <img src="${a.icon_url || 'https://via.placeholder.com/100x70/7c3aed/ffffff?text=A'}" alt="${a.apk_title}" onerror="this.src='https://via.placeholder.com/100x70/7c3aed/ffffff?text=APK'" style="width:56px;height:56px;border-radius:12px;object-fit:cover;">
        <div class="info">
          <h3>${a.apk_title}</h3>
          <p style="color:var(--gray-400);font-size:13px;margin-top:4px;">${a.description ? a.description.substring(0, 80) + '...' : ''}</p>
          <div style="margin-top:6px;">
            <span class="approved-badge">&#9989; Approved &amp; Unlocked</span>
          </div>
        </div>
        <div class="action">
          <a href="${a.apk_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">&#128279; Download APK</a>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = `
      <div class="dashboard-empty" style="grid-column:1/-1;">
        <div class="empty-icon">&#9888;</div>
        <h3>Error loading APKs</h3>
        <p>Please try again later.</p>
      </div>
    `;
  } finally {
    hideLoading();
  }
}

async function loadPendingOrders() {
  const container = document.getElementById('pendingOrders');
  try {
    const orders = await apiGet('/orders/pending-orders');
    if (orders.length === 0) {
      container.innerHTML = `
        <div class="dashboard-empty">
          <div class="empty-icon">&#9989;</div>
          <h3>No pending verifications</h3>
          <p>All your payments have been processed.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = orders.map(o => `
      <div class="purchase-card">
        <div class="info" style="flex:1;">
          <h3>${o.course_title}</h3>
          <div class="meta">
            <span>TID: ${o.transaction_id}</span>
            <span>Amount: Rs. ${o.amount}</span>
            <span>${new Date(o.created_at).toLocaleDateString()}</span>
          </div>
          ${o.screenshot_url ? `<div style="margin-top:8px;"><a href="${o.screenshot_url}" target="_blank" rel="noopener noreferrer"><img src="${o.screenshot_url}" alt="Payment Screenshot" style="height:48px;border-radius:4px;border:1px solid var(--gray-200);"></a></div>` : ''}
        </div>
        <div class="pending-badge">&#8987; Payment Verification Pending</div>
      </div>
    `).join('');
  } catch {}
}

async function loadRejectedOrders() {
  const container = document.getElementById('rejectedOrders');
  try {
    const orders = await apiGet('/orders/rejected-orders');
    if (orders.length === 0) {
      container.innerHTML = `
        <div class="dashboard-empty">
          <div class="empty-icon">&#9989;</div>
          <h3>No rejected payments</h3>
          <p>All your payments are in good standing.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = orders.map(o => `
      <div class="purchase-card">
        <div class="info">
          <h3>${o.course_title}</h3>
          <div class="meta">
            <span>TID: ${o.transaction_id}</span>
            <span>Amount: Rs. ${o.amount}</span>
            <span>${new Date(o.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="rejected-badge">&#10060; Payment Rejected</div>
      </div>
    `).join('');
  } catch {}
}
