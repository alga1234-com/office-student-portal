const express = require('express');
const router = express.Router();
const requireLogin = require('../middleware/auth');

router.get('/dashboard', requireLogin, (req, res) => {
  res.render('dashboard');
});

module.exports = router;
// script.js -- OASIS Student Portal

// LOGIN/LOGOUT LOGIC FOR NAVBAR
// This script expects a button or link with id="loginLogoutBtn" in the navbar.
// It toggles between "Login" and "Logout" based on authentication state (stored in localStorage).

// Usage: 
// 1. On login page, after successful login, call setLoggedIn(true);
// 2. On logout, setLoggedIn(false); or simply rely on the logic here.

function isLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
}

function setLoggedIn(status) {
  localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
}

function updateLoginLogoutButton() {
  const btn = document.getElementById('loginLogoutBtn');
  if (!btn) return;
  if (isLoggedIn()) {
    btn.textContent = "Logout";
    btn.href = "#";
  } else {
    btn.textContent = "Login";
    btn.href = "Login.html";
  }
}

window.addEventListener('DOMContentLoaded', function() {
  // Default: set as logged in if state not set (for demo; remove for production)
  if (localStorage.getItem('isLoggedIn') === null) {
    setLoggedIn(true);
  }
  updateLoginLogoutButton();

  // Navbar logout/login logic
  const btn = document.getElementById('loginLogoutBtn');
  if (btn) {
    btn.addEventListener('click', function(e) {
      if (isLoggedIn()) {
        setLoggedIn(false);
        updateLoginLogoutButton();
        window.location.href = "Login.html";
        e.preventDefault();
      }
      // If not logged in, default <a> behavior goes to Login.html
    });
  }

  // NAVBAR AVATAR INITIAL (for demo)
  const navAvatar = document.getElementById('navProfileAvatar');
  if (navAvatar && window.user && user.name && user.name.length > 0) {
    navAvatar.textContent = user.name[0].toUpperCase();
  }

  // PROFILE PAGE LOGIC (if applicable)
  if (document.getElementById('profileName')) {
    // Dummy user data for demonstration (replace with backend fetch in production)
    window.user = window.user || {
      name: "Amina Yusuf",
      email: "240072225@mubs.ac.ug",
      contact: "+256781492126",
      address: "123, Mugabe Avenue, Kampala",
      role: "student",
      roles: ["student", "admin", "guest"],
      activities: [
        { action: "Submitted assignment: Mathematics", date: "2025-07-26 09:33" },
        { action: "Updated home address", date: "2025-07-19 16:54" },
        { action: "Changed role to Prefect", date: "2025-07-10 08:27" },
        { action: "Logged in", date: "2025-07-01 10:14" }
      ]
    };

    // Populate profile
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('contact').value = user.contact;
    document.getElementById('address').value = user.address;
    document.getElementById('role-select').value = user.role;
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) profileAvatar.textContent = user.name[0].toUpperCase();

    // Populate activities
    function renderActivities() {
      const actDiv = document.getElementById('profileActivities');
      if (!actDiv) return;
      actDiv.innerHTML = '';
      if (!user.activities || user.activities.length === 0) {
        actDiv.innerHTML = '<div style="color:#888;">No activities yet.</div>';
        return;
      }
      user.activities.forEach(act => {
        const el = document.createElement('div');
        el.className = 'activity-item';
        el.innerHTML = `${act.action} <span class="activity-date">${act.date}</span>`;
        actDiv.appendChild(el);
      });
    }
    renderActivities();

    // Role switching
    document.getElementById('role-select').addEventListener('change', function() {
      const newRole = this.value;
      user.role = newRole;
      user.activities.unshift({
        action: "Changed role to " + newRole.charAt(0).toUpperCase() + newRole.slice(1),
        date: new Date().toISOString().slice(0,16).replace('T', ' ')
      });
      document.getElementById('role-switch-success').textContent = "Role switched!";
      setTimeout(() => { document.getElementById('role-switch-success').textContent = ""; }, 1500);
      renderActivities();
      // TODO: Save role change to backend if needed
    });

    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', function(e) {
      e.preventDefault();
      user.contact = document.getElementById('contact').value;
      user.address = document.getElementById('address').value;
      user.activities.unshift({
        action: "Updated contact/home address",
        date: new Date().toISOString().slice(0,16).replace('T', ' ')
      });
      document.getElementById('profileSuccessMsg').textContent = "Profile updated!";
      renderActivities();
      setTimeout(() => { document.getElementById('profileSuccessMsg').textContent = ""; }, 1500);
      // TODO: Save contact & address to backend if needed
    });
  }

  // LOGIN PAGE LOGIC (if applicable)
  // Handles OTP login and redirects to dashboard on success
  if (document.getElementById('loginRequestOtpBtn')) {
    let loginEmail = '';
    document.getElementById('loginRequestOtpBtn').onclick = function () {
      loginEmail = document.getElementById('login-email').value.trim();
      if (!loginEmail) {
        document.getElementById('login-msg').textContent = "Please enter your email.";
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
          document.getElementById('login-msg').textContent = "OTP sent to your email.";
        } else {
          document.getElementById('login-msg').textContent = res.message || "Failed to send OTP.";
        }
      });
    };

    document.getElementById('loginOtpBtn').onclick = function () {
      const otp = document.getElementById('login-otp').value.trim();
      if (!otp) {
        document.getElementById('login-msg').textContent = "Please enter the OTP.";
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
          document.getElementById('login-msg').textContent = "First login: Please set a new password from the link sent to your email.";
        } else if (res.token && res.user) {
          localStorage.setItem('oasisAuth', JSON.stringify({ user: res.user, token: res.token }));
          setLoggedIn(true); // Mark as logged in
          window.location.href = "dashboard.html";
        } else {
          document.getElementById('login-msg').textContent = res.message || "Invalid OTP.";
        }
      });
    };

    document.getElementById('loginResendBtn').onclick = function () {
      if (!loginEmail) {
        document.getElementById('login-msg').textContent = "Please enter your email above first.";
        return;
      }
      fetch('/api/auth/request-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      })
      .then(res => res.json())
      .then(res => {
        document.getElementById('login-msg').textContent = res.success ? "OTP resent!" : (res.message || "Failed to resend OTP.");
      });
    };
  }
});