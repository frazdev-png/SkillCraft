function updateNavbar() {
  const token = getToken();
  const authBtns = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');
  const adminLink = document.getElementById('adminNavLink');

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (authBtns) authBtns.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'block';
        if (userName) userName.textContent = payload.name || (payload.role === 'admin' ? 'Admin' : 'User');
      }
      if (adminLink) {
        adminLink.style.display = payload.role === 'admin' ? 'inline-block' : 'none';
      }
    } catch {
      if (authBtns) authBtns.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
    }
  } else {
    if (authBtns) authBtns.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}

function toggleEye(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isPassword = inp.type === 'password';
  inp.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword ? '&#128064;' : '&#128065;';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe')?.checked ?? true;

  showLoading();
  try {
    const data = await apiPost('/auth/login', { email, password });
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', data.token);
    storage.setItem('user', JSON.stringify(data.user));
    if (!rememberMe) {
      localStorage.setItem('token', data.token);
    }
    showToast('Login successful!', 'success');
    if (data.user.role === 'admin') {
      setTimeout(() => { window.location.href = 'admin.html'; }, 500);
    } else {
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    }
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;

  if (password !== confirm) {
    showToast('Passwords do not match!', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  showLoading();
  try {
    const data = await apiPost('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showToast('Registration successful!', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  showToast('Logged out successfully', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 500);
}

function isLoggedIn() {
  return !!getToken();
}

function isAdmin() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

function requireAuth() {
  if (!isLoggedIn()) {
    showToast('Please login first', 'warning');
    setTimeout(() => { window.location.href = 'login.html'; }, 500);
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isLoggedIn()) {
    showToast('Please login first', 'warning');
    setTimeout(() => { window.location.href = 'login.html'; }, 500);
    return false;
  }
  if (!isAdmin()) {
    showToast('Admin access required', 'error');
    setTimeout(() => { window.location.href = 'index.html'; }, 500);
    return false;
  }
  return true;
}

function initNavbar() {
  const toggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function() {
      navLinks.classList.toggle('open');
    });
  }
  window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
      if (window.scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.navbar') && navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  updateNavbar();
  initNavbar();
});
