$(function () {
  // ----- LOGIN FLOW -----
  let loginEmail = '';
  // Step 1: Request OTP
  if ($('#loginRequestOtpBtn').length) {
    $('#loginRequestOtpBtn').click(function () {
      loginEmail = $('#login-email').val();
      if (!loginEmail) {
        $('#login-msg').text('Please enter your email.');
        return;
      }
      $.post('/api/auth/request-login-otp', { email: loginEmail }, function (res) {
        if (res.success) {
          $('#loginRequestSection').hide();
          $('#loginOtpSection').show();
          $('#loginOtpEmail').val(loginEmail);
          $('#login-msg').text('OTP sent to your email.');
        } else {
          $('#login-msg').text(res.message || 'Failed to send OTP.');
        }
      });
    });
  }
  // Step 2: Enter OTP
  if ($('#loginOtpBtn').length) {
    $('#loginOtpBtn').click(function () {
      const otp = $('#login-otp').val();
      if (!otp) {
        $('#login-msg').text('Please enter the OTP.');
        return;
      }
      $.post('/api/auth/login-with-otp', { email: loginEmail, otp }, function (res) {
        if (res.mustChange) {
          // Must change password after OTP
          $('#loginOtpSection').hide();
          $('#forcePwdSection').show();
          $('#forcePwdEmail').val(loginEmail);
          $('#forcePwdOtp').val(otp);
          $('#login-msg').text('First login: Set a new password.');
        } else if (res.token && res.user) {
          localStorage.setItem('oasisAuth', JSON.stringify({ user: res.user, token: res.token }));
          window.location.href = "dashboard.html";
        } else {
          $('#login-msg').text(res.message || 'Invalid OTP.');
        }
      });
    });
  }
  // Step 3: Forced password change after login
  if ($('#forcePwdBtn').length) {
    $('#forcePwdBtn').click(function () {
      const email = $('#forcePwdEmail').val();
      const otp = $('#forcePwdOtp').val();
      const newPassword = $('#forceNewPwd').val();
      const confirmPassword = $('#forceConfirmPwd').val();
      if (!newPassword || !confirmPassword) {
        $('#login-msg').text('Enter and confirm your new password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        $('#login-msg').text('Passwords do not match.');
        return;
      }
      $.post('/api/auth/force-change-password', { email, otp, newPassword }, function (res) {
        if (res.token && res.user) {
          localStorage.setItem('oasisAuth', JSON.stringify({ user: res.user, token: res.token }));
          window.location.href = "dashboard.html";
        } else {
          $('#login-msg').text(res.message || 'Failed to set new password.');
        }
      });
    });
  }

  // ----- SIGNUP FLOW -----
  if ($('#signupBtn').length) {
    $('#signupBtn').click(function () {
      const name = $('#signup-name').val();
      const email = $('#signup-email').val();
      const password = $('#signup-password').val();
      if (!name || !email || !password) {
        $('#signup-msg').text('All fields are required.');
        return;
      }
      $.post('/api/auth/signup', { name, email, password }, function (res) {
        if (res.success) {
          $('#signup-msg').text('Signup successful! You can now log in.');
          setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
          $('#signup-msg').text(res.message || 'Signup failed.');
        }
      });
    });
  }

  // ----- FORGOT PASSWORD FLOW -----
  let resetEmail = '';
  // Step 1: Request OTP
  if ($('#sendResetOtpBtn').length) {
    $('#sendResetOtpBtn').click(function () {
      resetEmail = $('#reset-email').val();
      if (!resetEmail) {
        $('#forgot-msg').text('Please enter your email.');
        return;
      }
      $.post('/api/auth/request-reset-otp', { email: resetEmail }, function (res) {
        if (res.success) {
          $('#resetOtpSection').show();
          $('#resetOtpEmail').val(resetEmail);
          $('#forgot-msg').text('OTP sent to your email.');
        } else {
          $('#forgot-msg').text(res.message || 'Failed to send OTP.');
        }
      });
    });
  }
  // Step 2: Enter OTP + set new password
  if ($('#resetPwdBtn').length) {
    $('#resetPwdBtn').click(function () {
      const email = $('#resetOtpEmail').val();
      const otp = $('#reset-otp').val();
      const newPassword = $('#reset-new-password').val();
      const confirmPassword = $('#reset-confirm-password').val();
      if (!otp || !newPassword || !confirmPassword) {
        $('#forgot-msg').text('Please fill all fields.');
        return;
      }
      if (newPassword !== confirmPassword) {
        $('#forgot-msg').text('Passwords do not match.');
        return;
      }
      $.post('/api/auth/reset-password', { email, otp, newPassword }, function (res) {
        if (res.success) {
          $('#forgot-msg').text('Password reset! You can log in now.');
          setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
          $('#forgot-msg').text(res.message || 'Failed to reset password.');
        }
      });
    });
  }
});