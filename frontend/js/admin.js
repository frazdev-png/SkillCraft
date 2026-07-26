document.addEventListener('DOMContentLoaded', function() {
  if (!requireAdmin()) return;
  loadAdminUserInfo();
  loadAdminStats();
  loadAllOrders();
  loadAdminCourses();
  loadAllUsers();
  loadAdminApks();
  loadAllApkPurchases();
});

async function loadAdminUserInfo() {
  try {
    const user = await apiGet('/auth/me');
    const el = document.getElementById('adminUserName');
    if (el) el.textContent = user.name;
  } catch {}
}

function switchAdminTab(tab, btn) {
  document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('adminOrdersSection').style.display = tab === 'orders' ? 'block' : 'none';
  document.getElementById('adminCoursesSection').style.display = tab === 'courses' ? 'block' : 'none';
  document.getElementById('adminUsersSection').style.display = tab === 'users' ? 'block' : 'none';
  document.getElementById('adminSettingsSection').style.display = tab === 'settings' ? 'block' : 'none';
  document.getElementById('adminCategoriesSection').style.display = tab === 'categories' ? 'block' : 'none';
  document.getElementById('adminApksSection').style.display = tab === 'apks' ? 'block' : 'none';
  document.getElementById('adminApkPurchasesSection').style.display = tab === 'apks' ? 'block' : 'none';
  if (tab === 'orders') loadAllOrders();
  if (tab === 'courses') loadAdminCourses();
  if (tab === 'users') loadAllUsers();
  if (tab === 'categories') loadAdminCategories();
  if (tab === 'apks') { loadAdminApks(); loadAllApkPurchases(); }
}

async function loadAdminStats() {
  const container = document.getElementById('adminStats');
  try {
    const [coursesRes, orders, users, apksRes] = await Promise.all([
      apiGet('/courses/'),
      apiGet('/orders/all'),
      apiGet('/auth/users'),
      apiGet('/apks/?per_page=1')
    ]);
    const courses = coursesRes.courses || coursesRes;
    const coursesCount = Array.isArray(courses) ? courses.length : (coursesRes.total || 0);
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const approvedOrders = orders.filter(o => o.status === 'approved');

    const apkTotal = apksRes.total || 0;
    container.innerHTML = `
      <div class="stat-card"><div class="stat-value">${coursesCount}</div><div class="stat-label">Total Courses</div></div>
      <div class="stat-card"><div class="stat-value">${apkTotal}</div><div class="stat-label">Cracked APKs</div></div>
      <div class="stat-card"><div class="stat-value">${orders.length}</div><div class="stat-label">Total Orders</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--warning);">${pendingOrders.length}</div><div class="stat-label">Pending Orders</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--success);">${approvedOrders.length}</div><div class="stat-label">Approved Orders</div></div>
      <div class="stat-card"><div class="stat-value">${users.length}</div><div class="stat-label">Total Users</div></div>
    `;
  } catch {}
}

async function loadAllOrders() {
  const tbody = document.getElementById('ordersBody');
  const noOrders = document.getElementById('noOrders');
  showLoading();
  try {
    const orders = await apiGet('/orders/all');
    if (orders.length === 0) {
      tbody.innerHTML = '';
      noOrders.style.display = 'block';
      return;
    }
    noOrders.style.display = 'none';
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>${o.full_name || 'N/A'}</td>
        <td>${o.email || 'N/A'}</td>
        <td>${o.phone || 'N/A'}</td>
        <td>${o.course_title || 'N/A'}</td>
        <td>Rs. ${o.amount || '0'}</td>
        <td style="font-size:12px;max-width:100px;overflow:hidden;text-overflow:ellipsis;">${o.transaction_id || 'N/A'}</td>
        <td>
          ${o.screenshot_url ? `
            <a href="${o.screenshot_url}" target="_blank" rel="noopener noreferrer">
              <img src="${o.screenshot_url}" alt="Screenshot" style="width:48px;height:36px;object-fit:cover;border-radius:4px;cursor:pointer;border:1px solid var(--gray-200);">
            </a>
            <button class="btn-delete" onclick="deleteScreenshot('${o.id}')" style="display:block;margin-top:4px;font-size:10px;padding:2px 6px;" title="Delete screenshot">&#128465;</button>
          ` : '<span style="color:var(--gray-400);font-size:11px;">—</span>'}
        </td>
        <td><span class="status-${o.status}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
        <td style="font-size:12px;">${o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}</td>
        <td>
          ${o.status === 'pending' ? `
            <button class="btn-approve" onclick="approveOrder('${o.id}')">Approve</button>
            <button class="btn-reject" onclick="rejectOrder('${o.id}')">Reject</button>
          ` : '<span style="color:var(--gray-400);font-size:12px;">Processed</span>'}
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--gray-400);padding:40px;">Failed to load orders.</td></tr>';
  } finally {
    hideLoading();
  }
}

async function loadAdminCourses() {
  const tbody = document.getElementById('coursesBody');
  const noCourses = document.getElementById('noAdminCourses');
  showLoading();
  try {
    const res = await apiGet('/courses/?per_page=200');
    const courses = res.courses || res;
    if (courses.length === 0) {
      tbody.innerHTML = '';
      noCourses.style.display = 'block';
      return;
    }
    noCourses.style.display = 'none';
    tbody.innerHTML = courses.map(c => `
      <tr>
        <td>${c.title}</td>
        <td>${c.category || 'N/A'}</td>
        <td>${c.difficulty || 'N/A'}</td>
        <td>Rs. ${c.sale_price || '0'}</td>
        <td>${c.featured ? '&#9989;' : '&#10060;'}</td>
        <td>${c.best_seller ? '&#9989;' : '&#10060;'}</td>
        <td>
          <button class="btn-edit" onclick="editCourse('${c.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteCourse('${c.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:40px;">Failed to load courses.</td></tr>';
  } finally {
    hideLoading();
  }
}

async function loadAllUsers() {
  const tbody = document.getElementById('usersBody');
  const noUsers = document.getElementById('noUsers');
  try {
    const users = await apiGet('/auth/users');
    if (users.length === 0) {
      tbody.innerHTML = '';
      noUsers.style.display = 'block';
      return;
    }
    noUsers.style.display = 'none';
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="status-${u.role === 'admin' ? 'approved' : 'pending'}">${u.role}</span></td>
        <td>${u.role !== 'admin' ? `<button class="btn-delete" onclick="deleteUser('${u.id}')">Delete</button>` : '<span style="color:var(--gray-400);font-size:12px;">-</span>'}</td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--gray-400);padding:40px;">Failed to load users.</td></tr>';
  }
}

async function deleteUser(userId) {
  if (!confirm('Delete this user? Their orders will remain but they will lose account access.')) return;
  showLoading();
  try {
    await apiDelete(`/auth/users/${userId}`);
    showToast('User deleted', 'success');
    loadAllUsers();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function approveOrder(orderId) {
  showLoading();
  try {
    await apiPut(`/orders/${orderId}/status`, { status: 'approved' });
    showToast('Order approved! Course unlocked for user.', 'success');
    loadAllOrders();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function rejectOrder(orderId) {
  showLoading();
  try {
    await apiPut(`/orders/${orderId}/status`, { status: 'rejected' });
    showToast('Order rejected.', 'info');
    loadAllOrders();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const current = document.getElementById('currentPassword').value;
  const newPwd = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmNewPassword').value;

  if (newPwd !== confirm) {
    showToast('New passwords do not match!', 'error');
    return;
  }
  if (newPwd.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  showLoading();
  try {
    await apiPut('/auth/change-password', { current_password: current, new_password: newPwd });
    showToast('Password changed successfully!', 'success');
    document.getElementById('changePasswordForm').reset();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function populateCategoryDropdown(selected) {
  const select = document.getElementById('courseCategory');
  select.innerHTML = '<option value="">Select Category</option>';
  try {
    const cats = await apiGet('/courses/categories');
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      if (c === selected) opt.selected = true;
      select.appendChild(opt);
    });
  } catch {}
}

async function showAddCourseForm() {
  document.getElementById('courseModalTitle').textContent = 'Add Course';
  document.getElementById('courseForm').reset();
  document.getElementById('editCourseId').value = '';
  document.getElementById('courseSubmitBtn').textContent = 'Add Course';
  await populateCategoryDropdown();
  document.getElementById('courseModal').style.display = 'flex';
}

function closeCourseModal() {
  document.getElementById('courseModal').style.display = 'none';
  document.getElementById('courseForm').reset();
  document.getElementById('editCourseId').value = '';
}

async function handleCourseSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('editCourseId').value;
  const thumbnailFile = document.getElementById('courseThumbnail').files[0];
  const bannerFile = document.getElementById('courseBanner').files[0];

  showLoading();
  try {
    let thumbnailUrl = '';
    let bannerUrl = '';

    if (thumbnailFile) {
      const fd = new FormData();
      fd.append('file', thumbnailFile);
      const uploadResult = await apiUpload('/upload/image', fd);
      thumbnailUrl = uploadResult.url;
    }

    if (bannerFile) {
      const fd = new FormData();
      fd.append('file', bannerFile);
      const uploadResult = await apiUpload('/upload/image', fd);
      bannerUrl = uploadResult.url;
    }

    const courseData = {
      title: document.getElementById('courseTitle').value,
      description: document.getElementById('courseDescription').value,
      category: document.getElementById('courseCategory').value,
      duration: document.getElementById('courseDuration').value,
      difficulty: document.getElementById('courseDifficulty').value,
      rating: parseFloat(document.getElementById('courseRating').value) || 0,
      original_price: parseFloat(document.getElementById('courseOriginalPrice').value) || 0,
      sale_price: parseFloat(document.getElementById('courseSalePrice').value) || 0,
      google_drive_link: document.getElementById('courseDriveLink').value,
      featured: document.getElementById('courseFeatured').checked,
      best_seller: document.getElementById('courseBestSeller').checked,
      thumbnail_url: thumbnailUrl,
      banner_url: bannerUrl
    };

    if (editId) {
      const updateData = {};
      Object.keys(courseData).forEach(k => {
        if (courseData[k] !== '' && courseData[k] !== null) updateData[k] = courseData[k];
      });
      await apiPut(`/courses/${editId}`, updateData);
      showToast('Course updated successfully!', 'success');
    } else {
      if (!thumbnailUrl) throw new Error('Please upload a thumbnail image');
      if (!bannerUrl) throw new Error('Please upload a banner image');
      await apiPost('/courses/', courseData);
      showToast('Course added successfully!', 'success');
    }

    closeCourseModal();
    loadAdminCourses();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function editCourse(courseId) {
  showLoading();
  try {
    const course = await apiGet(`/courses/${courseId}`);
    await populateCategoryDropdown(course.category || '');
    document.getElementById('courseModalTitle').textContent = 'Edit Course';
    document.getElementById('editCourseId').value = courseId;
    document.getElementById('courseSubmitBtn').textContent = 'Update Course';
    document.getElementById('courseTitle').value = course.title || '';
    document.getElementById('courseDescription').value = course.description || '';
    document.getElementById('courseDuration').value = course.duration || '';
    document.getElementById('courseDifficulty').value = course.difficulty || '';
    document.getElementById('courseRating').value = course.rating || '';
    document.getElementById('courseOriginalPrice').value = course.original_price || '';
    document.getElementById('courseSalePrice').value = course.sale_price || '';
    document.getElementById('courseDriveLink').value = course.google_drive_link || '';
    document.getElementById('courseFeatured').checked = course.featured || false;
    document.getElementById('courseBestSeller').checked = course.best_seller || false;
    document.getElementById('courseModal').style.display = 'flex';
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course?')) return;
  showLoading();
  try {
    await apiDelete(`/courses/${courseId}`);
    showToast('Course deleted successfully!', 'success');
    loadAdminCourses();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

// ===== APK MANAGEMENT =====

async function loadAdminApks() {
  const tbody = document.getElementById('apksBody');
  const noApks = document.getElementById('noAdminApks');
  showLoading();
  try {
    const res = await apiGet('/apks/?per_page=200');
    const apks = res.apks || [];
    if (apks.length === 0) {
      tbody.innerHTML = '';
      noApks.style.display = 'block';
      return;
    }
    noApks.style.display = 'none';
    tbody.innerHTML = apks.map(a => `
      <tr>
        <td><img src="${a.icon_url || 'https://via.placeholder.com/32x32/7c3aed/ffffff?text=A'}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;"></td>
        <td>${a.title}</td>
        <td>Rs. ${a.price || '0'}</td>
        <td>${a.featured ? '&#9989;' : '&#10060;'}</td>
        <td>${a.downloads || 0}</td>
        <td>
          <button class="btn-edit" onclick="editApk('${a.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteApk('${a.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:40px;">Failed to load APKs.</td></tr>';
  } finally {
    hideLoading();
  }
}

async function loadAllApkPurchases() {
  const tbody = document.getElementById('apkPurchasesBody');
  const noPurchases = document.getElementById('noApkPurchases');
  showLoading();
  try {
    const purchases = await apiGet('/apks/purchases/all');
    if (purchases.length === 0) {
      tbody.innerHTML = '';
      noPurchases.style.display = 'block';
      return;
    }
    noPurchases.style.display = 'none';
    tbody.innerHTML = purchases.map(p => `
      <tr>
        <td>${p.full_name || 'N/A'}</td>
        <td>${p.email || 'N/A'}</td>
        <td>${p.phone || 'N/A'}</td>
        <td>${p.apk_title || 'N/A'}</td>
        <td>Rs. ${p.amount || '0'}</td>
        <td style="font-size:12px;max-width:80px;overflow:hidden;text-overflow:ellipsis;">${p.transaction_id || 'N/A'}</td>
        <td>
          ${p.screenshot_url ? `
            <a href="${p.screenshot_url}" target="_blank"><img src="${p.screenshot_url}" alt="SS" style="width:48px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--gray-200);"></a>
            <button class="btn-delete" onclick="deleteApkScreenshot('${p.id}')" style="display:block;margin-top:4px;font-size:10px;padding:2px 6px;">&#128465;</button>
          ` : '<span style="color:var(--gray-400);font-size:11px;">—</span>'}
        </td>
        <td><span class="status-${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
        <td style="font-size:12px;">${p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
        <td>
          ${p.status === 'pending' ? `
            <button class="btn-approve" onclick="approveApkPurchase('${p.id}')">Approve</button>
            <button class="btn-reject" onclick="rejectApkPurchase('${p.id}')">Reject</button>
          ` : '<span style="color:var(--gray-400);font-size:12px;">Processed</span>'}
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--gray-400);padding:40px;">Failed to load purchases.</td></tr>';
  } finally {
    hideLoading();
  }
}

async function approveApkPurchase(purchaseId) {
  showLoading();
  try {
    await apiPut(`/apks/purchases/${purchaseId}/status`, { status: 'approved' });
    showToast('APK purchase approved! User can now download.', 'success');
    loadAllApkPurchases();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function rejectApkPurchase(purchaseId) {
  showLoading();
  try {
    await apiPut(`/apks/purchases/${purchaseId}/status`, { status: 'rejected' });
    showToast('APK purchase rejected.', 'info');
    loadAllApkPurchases();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteApkScreenshot(purchaseId) {
  if (!confirm('Delete this payment screenshot?')) return;
  showLoading();
  try {
    await apiDelete(`/apks/purchases/${purchaseId}/screenshot`);
    showToast('Screenshot deleted', 'success');
    loadAllApkPurchases();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

function showAddApkForm() {
  document.getElementById('apkModalTitle').textContent = 'Add Cracked APK';
  document.getElementById('apkForm').reset();
  document.getElementById('editApkId').value = '';
  document.getElementById('apkSubmitBtn').textContent = 'Add APK';
  document.getElementById('apkModal').style.display = 'flex';
}

function closeApkModal() {
  document.getElementById('apkModal').style.display = 'none';
  document.getElementById('apkForm').reset();
  document.getElementById('editApkId').value = '';
}

async function handleApkSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('editApkId').value;
  const iconFile = document.getElementById('apkIcon').files[0];

  showLoading();
  try {
    let iconUrl = '';
    if (iconFile) {
      const fd = new FormData();
      fd.append('file', iconFile);
      const uploadResult = await apiUpload('/upload/image', fd);
      iconUrl = uploadResult.url;
    }

    const apkData = {
      title: document.getElementById('apkTitle').value,
      description: document.getElementById('apkDescription').value,
      icon_url: iconUrl,
      apk_url: document.getElementById('apkUrl').value,
      price: parseFloat(document.getElementById('apkPrice').value) || 0,
      featured: document.getElementById('apkFeatured').checked
    };

    if (editId) {
      const updateData = {};
      Object.keys(apkData).forEach(k => {
        if (apkData[k] !== '' && apkData[k] !== null) updateData[k] = apkData[k];
      });
      await apiPut(`/apks/${editId}`, updateData);
      showToast('APK updated successfully!', 'success');
    } else {
      await apiPost('/apks/', apkData);
      showToast('APK added successfully!', 'success');
    }

    closeApkModal();
    loadAdminApks();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function editApk(apkId) {
  showLoading();
  try {
    const apk = await apiGet(`/apks/${apkId}`);
    document.getElementById('apkModalTitle').textContent = 'Edit APK';
    document.getElementById('editApkId').value = apkId;
    document.getElementById('apkSubmitBtn').textContent = 'Update APK';
    document.getElementById('apkTitle').value = apk.title || '';
    document.getElementById('apkDescription').value = apk.description || '';
    document.getElementById('apkUrl').value = apk.apk_url || '';
    document.getElementById('apkPrice').value = apk.price || '';
    document.getElementById('apkFeatured').checked = apk.featured || false;
    document.getElementById('apkModal').style.display = 'flex';
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteApk(apkId) {
  if (!confirm('Are you sure you want to delete this APK?')) return;
  showLoading();
  try {
    await apiDelete(`/apks/${apkId}`);
    showToast('APK deleted successfully!', 'success');
    loadAdminApks();
    loadAdminStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function loadAdminCategories() {
  const container = document.getElementById('categoriesList');
  try {
    const cats = await apiGet('/courses/categories');
    if (cats.length === 0) {
      container.innerHTML = '<div class="dashboard-empty"><div class="empty-icon">&#128196;</div><h3>No categories yet</h3><p>Add categories to organize your courses.</p></div>';
      return;
    }
    container.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Category Name</th><th>Action</th></tr></thead>
        <tbody>
          ${cats.map(c => `
            <tr>
              <td>${c}</td>
              <td><button class="btn-delete" onclick="deleteCategory('${c.replace(/'/g, "\\'")}')">Delete</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    container.innerHTML = `<p style="text-align:center;color:var(--gray-400);padding:40px;">${e.message}</p>`;
  }
}

async function handleAddCategory() {
  const input = document.getElementById('newCategoryInput');
  const name = input.value.trim();
  if (!name) { showToast('Enter a category name', 'warning'); return; }
  showLoading();
  try {
    await apiPost('/courses/categories', { name });
    showToast(`Category '${name}' added!`, 'success');
    input.value = '';
    loadAdminCategories();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteScreenshot(orderId) {
  if (!confirm('Delete this payment screenshot? This cannot be undone.')) return;
  showLoading();
  try {
    await apiDelete(`/orders/${orderId}/screenshot`);
    showToast('Screenshot deleted', 'success');
    loadAllOrders();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteCategory(name) {
  if (!confirm(`Delete category '${name}'? Courses with this category will remain unchanged.`)) return;
  showLoading();
  try {
    await apiDelete(`/courses/categories/${encodeURIComponent(name)}`);
    showToast(`Category '${name}' deleted`, 'success');
    loadAdminCategories();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}
