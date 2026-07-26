document.addEventListener('DOMContentLoaded', function() {
  loadFeaturedCourses();
  loadLatestCourses();
  loadCategories();
  loadStats();
  initScrollReveal();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('category')) {
    document.getElementById('categoryFilter') && (document.getElementById('categoryFilter').value = urlParams.get('category'));
  }

  if (window.location.pathname.endsWith('courses.html') || window.location.pathname.endsWith('courses')) {
    loadCourses();
    loadCategoryFilter();
  }

  if (window.location.pathname.endsWith('apks.html') || window.location.pathname.endsWith('apks')) {
    loadApks();
  }

  if (window.location.pathname.includes('apk-detail')) {
    const params = new URLSearchParams(window.location.search);
    const apkId = params.get('id');
    if (apkId) {
      loadApkDetail(apkId);
    } else {
      document.getElementById('apkDetail').innerHTML = '<p class="text-center" style="color:var(--gray-400);padding:60px 0;">APK not found.</p>';
    }
  }

  if (window.location.pathname.includes('course-detail')) {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    if (courseId) {
      loadCourseDetail(courseId);
    } else {
      document.getElementById('courseDetail').innerHTML = '<p class="text-center" style="color:var(--gray-400);padding:60px 0;">Course not found.</p>';
    }
  }
});

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

async function loadStats() {
  try {
    const [coursesRes, categories] = await Promise.all([
      apiGet('/courses/'),
      apiGet('/courses/categories')
    ]);
    const courses = coursesRes.courses || [];
    animateCounter('totalCourses', courses.length, '+');
    animateCounter('totalCategories', categories.length, '+');
    animateCounter('totalStudents', 523, '+');
  } catch {
    document.getElementById('totalCourses') && (document.getElementById('totalCourses').textContent = '0+');
    document.getElementById('totalCategories') && (document.getElementById('totalCategories').textContent = '5+');
    document.getElementById('totalStudents') && (document.getElementById('totalStudents').textContent = '500+');
  }
}

function animateCounter(elementId, target, suffix) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const duration = 1500;
  const start = performance.now();
  const from = 0;
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(from + (target - from) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function toggleFaq(btn) {
  const item = btn.parentElement;
  item.classList.toggle('active');
}

function searchCourses() {
  const query = document.getElementById('searchInput').value;
  if (query.trim()) {
    window.location.href = `courses.html?search=${encodeURIComponent(query)}`;
  }
}

function renderCourseCard(course) {
  const diffClass = `difficulty-${course.difficulty?.toLowerCase() || 'beginner'}`;
  const rating = course.rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  let stars = '';
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) stars += '★';
    else if (i === fullStars && hasHalf) stars += '★';
    else stars += '☆';
  }
  return `
    <div class="course-card">
      <div class="thumbnail">
        <img src="${course.thumbnail_url || 'https://via.placeholder.com/400x250/7c3aed/ffffff?text=Course'}" alt="${course.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x250/7c3aed/ffffff?text=Course'">
        <div class="badges">
          ${course.featured ? '<span class="badge badge-featured">Featured</span>' : ''}
          ${course.best_seller ? '<span class="badge badge-best-seller">Best Seller</span>' : ''}
        </div>
        <div class="price-tag">Rs. ${course.sale_price || '0'}</div>
      </div>
      <div class="body">
        <h3 class="title">${course.title}</h3>
        <p class="description">${course.description || ''}</p>
        <div class="meta">
          <span class="difficulty ${diffClass}">${course.difficulty || 'Beginner'}</span>
          <span class="meta-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> ${course.duration || 'N/A'}</span>
          <span class="rating">${stars} <span>${rating.toFixed(1)}</span></span>
        </div>
      </div>
      <div class="footer">
        <div class="price">
          ${course.original_price ? `<span class="original-price">Rs. ${course.original_price}</span>` : ''}
          <span class="sale-price">Rs. ${course.sale_price || '0'}</span>
        </div>
        <a href="course-detail.html?id=${course.id}" class="buy-btn">Buy Now</a>
      </div>
    </div>
  `;
}

async function loadFeaturedCourses() {
  const grid = document.getElementById('featuredCourses');
  if (!grid) return;
  try {
    const courses = await apiGet('/courses/featured');
    if (courses.length === 0) {
      grid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;padding:40px 0;">No featured courses yet.</p>';
      return;
    }
    grid.innerHTML = courses.slice(0, 6).map(renderCourseCard).join('');
  } catch {
    grid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;padding:40px 0;">Unable to load courses.</p>';
  }
}

async function loadLatestCourses() {
  const grid = document.getElementById('latestCourses');
  if (!grid) return;
  try {
    const res = await apiGet('/courses/?per_page=6');
    const courses = res.courses || [];
    if (courses.length === 0) {
      grid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;padding:40px 0;">No courses available yet.</p>';
      return;
    }
    grid.innerHTML = courses.slice(0, 6).map(renderCourseCard).join('');
  } catch {
    grid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;padding:40px 0;">Unable to load courses.</p>';
  }
}

async function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  try {
    const cats = await apiGet('/courses/categories');
    const icons = ['&#128187;', '&#128202;', '&#128013;', '&#127912;', '&#128241;', '&#9881;', '&#129302;', '&#128640;'];
    if (cats.length === 0) {
      grid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;padding:40px 0;">No categories yet.</p>';
      return;
    }
    grid.innerHTML = cats.map((cat, i) => `
      <a href="courses.html?category=${encodeURIComponent(cat)}" class="category-card">
        <div class="cat-icon">${icons[i % icons.length]}</div>
        <div class="cat-name">${cat}</div>
        <div class="cat-count">Premium</div>
      </a>
    `).join('');
  } catch {
    grid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;padding:40px 0;">Unable to load categories.</p>';
  }
}

let currentPage = 1;

async function loadCourses(page) {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;
  if (page) currentPage = page;
  showLoading();
  try {
    const category = document.getElementById('categoryFilter')?.value || '';
    const difficulty = document.getElementById('difficultyFilter')?.value || '';
    const search = document.getElementById('courseSearch')?.value || '';
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get('search') || '';

    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty);
    if (search) params.set('search', search);
    else if (urlSearch) params.set('search', urlSearch);
    params.set('page', currentPage);
    params.set('per_page', 12);

    const res = await apiGet(`/courses/?${params.toString()}`);
    const courses = res.courses || [];

    if (courses.length === 0) {
      grid.innerHTML = '';
      document.getElementById('noCourses').style.display = 'block';
      document.getElementById('pagination').innerHTML = '';
      return;
    }
    document.getElementById('noCourses').style.display = 'none';
    grid.innerHTML = courses.map(renderCourseCard).join('');

    renderPagination(res.page, res.pages);

    if (urlSearch) {
      document.getElementById('courseSearch') && (document.getElementById('courseSearch').value = urlSearch);
    }
  } catch {
    grid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;padding:40px 0;">Failed to load courses.</p>';
  } finally {
    hideLoading();
  }
}

function renderPagination(current, total) {
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }
  let html = '';
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  if (current > 1) html += `<button class="page-btn" onclick="loadCourses(${current - 1})">&laquo; Prev</button>`;
  if (start > 1) html += `<button class="page-btn" onclick="loadCourses(1)">1</button>${start > 2 ? '<span class="page-dots">...</span>' : ''}`;
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn${i === current ? ' active' : ''}" onclick="loadCourses(${i})">${i}</button>`;
  }
  if (end < total) html += `${end < total - 1 ? '<span class="page-dots">...</span>' : ''}<button class="page-btn" onclick="loadCourses(${total})">${total}</button>`;
  if (current < total) html += `<button class="page-btn" onclick="loadCourses(${current + 1})">Next &raquo;</button>`;
  el.innerHTML = html;
}

async function loadCategoryFilter() {
  try {
    const cats = await apiGet('/courses/categories');
    const select = document.getElementById('categoryFilter');
    if (select && cats.length > 0) {
      cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });
    }
  } catch {}
}

async function loadCourseDetail(courseId) {
  const container = document.getElementById('courseDetail');
  const relatedGrid = document.getElementById('relatedCourses');
  showLoading();
  try {
    const course = await apiGet(`/courses/${courseId}`);
    const diffClass = `difficulty-${course.difficulty?.toLowerCase() || 'beginner'}`;
    container.innerHTML = `
      <div class="detail-header" style="margin-top:20px;">
        <div class="detail-thumb">
          <img src="${course.thumbnail_url || 'https://via.placeholder.com/180x120/7c3aed/ffffff?text=Course'}" alt="${course.title}" onerror="this.src='https://via.placeholder.com/180x120/7c3aed/ffffff?text=Course'">
        </div>
        <div class="detail-info">
          <h1>${course.title}</h1>
          <div class="meta">
            <span class="difficulty ${diffClass}">${course.difficulty || 'Beginner'}</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> ${course.duration || 'N/A'}</span>
            <span>&#9733; ${course.rating || '0'} Rating</span>
            <span>${course.category || ''}</span>
          </div>
          <div class="price-row">
            <span class="sale-price">Rs. ${course.sale_price || '0'}</span>
          ${course.original_price ? `<span class="original-price">Rs. ${course.original_price}</span>` : ''}
          </div>
          <button class="btn btn-primary" onclick="openPaymentModal('${course.id}', '${course.title.replace(/'/g, "\\'")}', ${course.sale_price})">Buy Now - Rs. ${course.sale_price || '0'}</button>
        </div>
      </div>
      <div class="detail-description">
        <h2>About This Course</h2>
        <p>${course.description || 'No description available.'}</p>
      </div>
    `;

    try {
      const allCourses = await apiGet(`/courses/?category=${encodeURIComponent(course.category || '')}`);
      const related = allCourses.filter(c => c.id !== courseId).slice(0, 4);
      if (related.length > 0) {
        relatedGrid.innerHTML = related.map(renderCourseCard).join('');
      } else {
        relatedGrid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;">No related courses found.</p>';
      }
    } catch {
      relatedGrid.innerHTML = '';
    }
  } catch {
    container.innerHTML = '<p class="text-center" style="color:var(--gray-400);padding:60px 0;">Course not found or failed to load.</p>';
  } finally {
    hideLoading();
  }
}

function openPaymentModal(courseId, courseTitle, coursePrice) {
  if (!isLoggedIn()) {
    showToast('Please login to purchase', 'warning');
    setTimeout(() => { window.location.href = `login.html?redirect=course-detail.html?id=${courseId}`; }, 500);
    return;
  }
  document.getElementById('payCourseId').value = courseId;
  document.getElementById('paymentSummary').innerHTML = `
    <div class="pay-row"><span class="label">Course</span><span class="value">${courseTitle}</span></div>
    <div class="pay-row"><span class="label">Price</span><span class="value">Rs. ${coursePrice}</span></div>
  `;
  document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
  document.getElementById('paymentForm').reset();
}

function renderApkCard(apk) {
  return `
    <div class="apk-card">
      <div class="apk-icon">
        <img src="${apk.icon_url || 'https://via.placeholder.com/80x80/7c3aed/ffffff?text=APK'}" alt="${apk.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/80x80/7c3aed/ffffff?text=APK'">
      </div>
      <div class="apk-info">
        <h3 class="apk-title">${apk.title}</h3>
        <p class="apk-desc">${apk.description || ''}</p>
      </div>
      <div class="apk-footer">
        <div class="apk-price">Rs. ${apk.price || '0'}</div>
        ${apk.price > 0 ? `<a href="apk-detail.html?id=${apk.id}" class="buy-btn">Buy & Download</a>` : `<a href="${apk.apk_url}" target="_blank" rel="noopener noreferrer" class="buy-btn" style="background:var(--success);">Free Download</a>`}
      </div>
    </div>
  `;
}

let apkCurrentPage = 1;

async function loadApks(page) {
  const grid = document.getElementById('apkGrid');
  if (!grid) return;
  if (page) apkCurrentPage = page;
  showLoading();
  try {
    const search = document.getElementById('apkSearch')?.value || '';
    const sort = document.getElementById('apkSort')?.value || '';
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', apkCurrentPage);
    params.set('per_page', 12);

    const res = await apiGet(`/apks/?${params.toString()}`);
    const apks = res.apks || [];

    if (apks.length === 0) {
      grid.innerHTML = '';
      document.getElementById('noApks').style.display = 'block';
      document.getElementById('apkPagination').innerHTML = '';
      return;
    }
    document.getElementById('noApks').style.display = 'none';

    let sorted = [...apks];
    if (sort === 'price_asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') sorted.sort((a, b) => b.price - a.price);

    grid.innerHTML = sorted.map(renderApkCard).join('');
    renderApkPagination(res.page, res.pages);
  } catch {
    grid.innerHTML = '<p class="text-center" style="color:var(--gray-400);grid-column:1/-1;padding:40px 0;">Failed to load APKs.</p>';
  } finally {
    hideLoading();
  }
}

function renderApkPagination(current, total) {
  const el = document.getElementById('apkPagination');
  if (total <= 1) { el.innerHTML = ''; return; }
  let html = '';
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  if (current > 1) html += `<button class="page-btn" onclick="loadApks(${current - 1})">&laquo; Prev</button>`;
  if (start > 1) html += `<button class="page-btn" onclick="loadApks(1)">1</button>${start > 2 ? '<span class="page-dots">...</span>' : ''}`;
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn${i === current ? ' active' : ''}" onclick="loadApks(${i})">${i}</button>`;
  }
  if (end < total) html += `${end < total - 1 ? '<span class="page-dots">...</span>' : ''}<button class="page-btn" onclick="loadApks(${total})">${total}</button>`;
  if (current < total) html += `<button class="page-btn" onclick="loadApks(${current + 1})">Next &raquo;</button>`;
  el.innerHTML = html;
}

async function loadApkDetail(apkId) {
  const container = document.getElementById('apkDetail');
  showLoading();
  try {
    const apk = await apiGet(`/apks/${apkId}`);
    container.innerHTML = `
      <div class="apk-detail-card">
        <div class="apk-detail-header">
          <img src="${apk.icon_url || 'https://via.placeholder.com/120x120/7c3aed/ffffff?text=APK'}" alt="${apk.title}" class="apk-detail-icon" onerror="this.src='https://via.placeholder.com/120x120/7c3aed/ffffff?text=APK'">
          <div class="apk-detail-info">
            <h1>${apk.title}</h1>
            <p>${apk.description || 'No description available.'}</p>
            <div class="price-row">
              <span class="sale-price">Rs. ${apk.price || '0'}</span>
            </div>
            <button class="btn btn-primary" onclick="openApkPaymentModal('${apk.id}', '${apk.title.replace(/'/g, "\\'")}', ${apk.price})">
              ${apk.price > 0 ? `Buy Now - Rs. ${apk.price}` : 'Free Download'}
            </button>
          </div>
        </div>
      </div>
    `;
  } catch {
    container.innerHTML = '<p class="text-center" style="color:var(--gray-400);padding:60px 0;">APK not found or failed to load.</p>';
  } finally {
    hideLoading();
  }
}

function openApkPaymentModal(apkId, apkTitle, apkPrice) {
  if (!isLoggedIn()) {
    showToast('Please login to purchase', 'warning');
    setTimeout(() => { window.location.href = `login.html?redirect=apk-detail.html?id=${apkId}`; }, 500);
    return;
  }
  document.getElementById('payApkId').value = apkId;
  document.getElementById('apkPaymentSummary').innerHTML = `
    <div class="pay-row"><span class="label">APK</span><span class="value">${apkTitle}</span></div>
    <div class="pay-row"><span class="label">Price</span><span class="value">Rs. ${apkPrice}</span></div>
  `;
  document.getElementById('apkPaymentModal').style.display = 'flex';
}

function closeApkPaymentModal() {
  document.getElementById('apkPaymentModal').style.display = 'none';
  document.getElementById('apkPaymentForm').reset();
}

async function submitApkPayment(e) {
  e.preventDefault();
  const apkId = document.getElementById('payApkId').value;
  const fullName = document.getElementById('apkPayName').value;
  const email = document.getElementById('apkPayEmail').value;
  const phone = document.getElementById('apkPayPhone').value;
  const transactionId = document.getElementById('apkPayTid').value;
  const screenshotFile = document.getElementById('apkPayScreenshot').files[0];

  showLoading();
  try {
    let screenshotUrl = '';
    if (screenshotFile) {
      const fd = new FormData();
      fd.append('file', screenshotFile);
      const uploadResult = await apiUpload('/upload/screenshot', fd);
      screenshotUrl = uploadResult.url;
    }

    await apiPost('/apks/purchase', {
      apk_id: apkId,
      full_name: fullName,
      email: email,
      phone: phone,
      transaction_id: transactionId,
      screenshot_url: screenshotUrl
    });
    showToast('Payment request submitted! After approval, you can download the APK.', 'success');
    closeApkPaymentModal();
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function submitPayment(e) {
  e.preventDefault();
  const courseId = document.getElementById('payCourseId').value;
  const fullName = document.getElementById('payName').value;
  const email = document.getElementById('payEmail').value;
  const phone = document.getElementById('payPhone').value;
  const transactionId = document.getElementById('payTid').value;
  const screenshotFile = document.getElementById('payScreenshot').files[0];

  showLoading();
  try {
    let screenshotUrl = '';
    if (screenshotFile) {
      const fd = new FormData();
      fd.append('file', screenshotFile);
      const uploadResult = await apiUpload('/upload/screenshot', fd);
      screenshotUrl = uploadResult.url;
    }

    const order = await apiPost('/orders/', {
      course_id: courseId,
      full_name: fullName,
      email: email,
      phone: phone,
      transaction_id: transactionId,
      screenshot_url: screenshotUrl
    });
    showToast('Payment request submitted successfully! After verification, your course will be unlocked.', 'success');
    closePaymentModal();
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}
