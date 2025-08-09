// script.js -- Common JS for OASIS Student Portal
// Usage: Include in every HTML page for shared auth and UI logic

// --- Auth Management (Token, User, Login/Logout) ---

/**
 * Get auth info from localStorage
 * @returns {object|null} { token, user }
 */
function getAuth() {
  try {
    const data = localStorage.getItem('oasisAuth');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Save auth info to localStorage
 * @param {object} obj { token, user }
 */
function setAuth(obj) {
  localStorage.setItem('oasisAuth', JSON.stringify(obj));
}

/**
 * Remove auth info from localStorage
 */
function clearAuth() {
  localStorage.removeItem('oasisAuth');
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
  const auth = getAuth();
  return !!(auth && auth.token && auth.user);
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
  }
}

/**
 * Get current username/email or initials for avatar
 * @returns {string}
 */
function getUserInitial() {
  const auth = getAuth();
  if (!auth || !auth.user) return "A";
  const user = auth.user;
  if (user.username) return user.username[0].toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "A";
}

// --- Navbar Login/Logout/Profile Button Logic ---

/**
 * Update navbar buttons based on login state
 */
function updateNavbar() {
  const auth = getAuth();
  const loginBtn = document.getElementById('loginLogoutBtn');
  const profileAvatar = document.getElementById('profileAvatarNavbar');

  if (profileAvatar) {
    profileAvatar.textContent = getUserInitial();
  }

  if (loginBtn) {
    if (auth) {
      loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
      loginBtn.onclick = function() {
        clearAuth();
        window.location.href = "login.html";
      };
      loginBtn.setAttribute("aria-label", "Logout");
    } else {
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      loginBtn.onclick = function() {
        window.location.href = "login.html";
      };
      loginBtn.setAttribute("aria-label", "Login");
    }
  }
}

/**
 * Call on every page load if navbar exists
 */
document.addEventListener("DOMContentLoaded", updateNavbar);

// --- API Helper Functions ---

/**
 * Fetch wrapper with auth token if available
 * @param {string} url
 * @param {object} options
 * @returns {Promise<Response>}
 */
function apiFetch(url, options={}) {
  const auth = getAuth();
  const headers = options.headers || {};
  if (auth && auth.token) {
    headers['Authorization'] = 'Bearer ' + auth.token;
  }
  return fetch(url, { ...options, headers });
}

// --- Utility: Show message in a div by id
function showMsg(msg, type, elId) {
  const el = document.getElementById(elId || 'login-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = type || '';
}

// --- Login Form Handler (for login.html) ---

if (document.getElementById('loginBtn')) {
  document.getElementById('loginBtn').onclick = function() {
    const identifier = document.getElementById('login-username-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!identifier || !password) {
      showMsg("Please enter username/email and password.", "error", "login-msg");
      return;
    }

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    })
    .then(res => res.json())
    .then(res => {
      if (res.token && res.user) {
        setAuth({ token: res.token, user: res.user });
        window.location.href = "dashboard.html";
      } else {
        showMsg(res.error || "Login failed.", "error", "login-msg");
      }
    })
    .catch(() => showMsg("Network error.", "error", "login-msg"));
  };

  // Enter key triggers login
  document.getElementById('login-password').addEventListener('keypress', function(e) {
    if (e.which === 13 || e.key === 'Enter') document.getElementById('loginBtn').click();
  });
  document.getElementById('login-username-email').addEventListener('keypress', function(e) {
    if (e.which === 13 || e.key === 'Enter') document.getElementById('loginBtn').click();
  });
}

// --- Forgot Password Page Logic (forgot-password.html) ---

if (document.getElementById('sendCodeBtn')) {
  let resetEmail = '';
  let verifiedCode = '';

  document.getElementById('sendCodeBtn').onclick = async function() {
    resetEmail = document.getElementById('reset-email').value.trim();
    if (!resetEmail) return showMsg('Please enter your email.', '', 'forgot-msg');
    showMsg('', '', 'forgot-msg');

    try {
      const res = await fetch('/api/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (data.success || data.message === "Reset code sent via email") {
        document.getElementById('codeSection').style.display = 'block';
        showMsg('Reset code sent! (check your email)', 'success', 'forgot-msg');
      } else {
        showMsg(data.message || "Failed to send reset code.", '', 'forgot-msg');
      }
    } catch (err) {
      showMsg("Network error: could not request code.", '', 'forgot-msg');
    }
  };

  document.getElementById('verifyCodeBtn').onclick = async function() {
    const code = document.getElementById('reset-code').value.trim();
    if (!code) return showMsg('Please enter the code.', '', 'forgot-msg');
    showMsg('', '', 'forgot-msg');

    try {
      const res = await fetch('/api/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('pwSection').style.display = 'block';
        showMsg('Code verified. Enter new password.', 'success', 'forgot-msg');
        verifiedCode = code;
      } else {
        showMsg(data.message || "Invalid code.", '', 'forgot-msg');
      }
    } catch (err) {
      showMsg("Network error: could not verify code.", '', 'forgot-msg');
    }
  };

  document.getElementById('setPwBtn').onclick = async function() {
    const password = document.getElementById('new-password').value;
    if (!password) return showMsg('Please enter a new password.', '', 'forgot-msg');
    if (!resetEmail || !verifiedCode) {
      showMsg('Missing email or code. Please restart the process.', '', 'forgot-msg');
      return;
    }
    showMsg('', '', 'forgot-msg');

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, password, code: verifiedCode })
      });
      const data = await res.json();
      if (data.success) {
        showMsg('Password reset! Redirecting...', 'success', 'forgot-msg');
        setTimeout(() => window.location.href = 'login.html', 1500);
      } else {
        showMsg(data.message || "Failed to reset password.", '', 'forgot-msg');
      }
    } catch (err) {
      showMsg("Network error: could not reset password.", '', 'forgot-msg');
    }
  };
}

// --- OTP Login (if used elsewhere) ---

if (document.getElementById('loginRequestOtpBtn')) {
  let loginEmail = '';

  document.getElementById('loginRequestOtpBtn').onclick = function () {
    loginEmail = document.getElementById('login-email').value.trim();
    if (!loginEmail) {
      showMsg("Please enter your email.", "error", "login-msg");
      return;
    }
    fetch('/api/auth/request-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail })
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        document.getElementById('loginRequestSection').style.display = 'none';
        document.getElementById('loginOtpSection').style.display = 'block';
        showMsg("OTP sent to your email.", "success", "login-msg");
      } else {
        showMsg(res.message || "Failed to send OTP.", "error", "login-msg");
      }
    });
  };

  document.getElementById('loginOtpBtn').onclick = function () {
    const otp = document.getElementById('login-otp').value.trim();
    if (!otp) {
      showMsg("Please enter the OTP.", "error", "login-msg");
      return;
    }
    fetch('/api/auth/login-with-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, otp })
    })
    .then(res => res.json())
    .then(res => {
      if (res.mustChange) {
        showMsg("First login: Please set a new password from the link sent to your email.", "info", "login-msg");
      } else if (res.token && res.user) {
        setAuth({ token: res.token, user: res.user });
        window.location.href = "dashboard.html";
      } else {
        showMsg(res.message || "Invalid OTP.", "error", "login-msg");
      }
    });
  };

  document.getElementById('loginResendBtn').onclick = function () {
    if (!loginEmail) {
      showMsg("Please enter your email above first.", "error", "login-msg");
      return;
    }
    fetch('/api/auth/request-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail })
    })
    .then(res => res.json())
    .then(res => {
      showMsg(res.success ? "OTP resent!" : (res.message || "Failed to resend OTP."), res.success ? "success" : "error", "login-msg");
    });
  };
}

// --- Optional: Protect dashboard or other pages ---
if (typeof window !== "undefined" && window.location.pathname.endsWith("dashboard.html")) {
  requireAuth();
}