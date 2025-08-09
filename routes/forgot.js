$(function(){
  let resetEmail = '';
  $('#sendCodeBtn').click(function(){
    resetEmail = $('#reset-email').val();
    if (!resetEmail) {
      $('#forgot-msg').text('Please enter your email.');
      return;
    }
    $.post('/api/send-reset-code', { email: resetEmail }, function(res){
      if (res.success) {
        $('#codeSection').show();
        $('#forgot-msg').text('Reset code sent! (demo code: 123456)');
      } else {
        $('#forgot-msg').text(res.message);
      }
    });
  });

  $('#verifyCodeBtn').click(function(){
    const code = $('#reset-code').val();
    if (!code) {
      $('#forgot-msg').text('Please enter the code.');
      return;
    }
    $.post('/api/verify-reset-code', { code }, function(res){
      if (res.success) {
        $('#pwSection').show();
        $('#forgot-msg').text('Code verified. Enter new password.');
      } else {
        $('#forgot-msg').text(res.message);
      }
    });
  });

  $('#setPwBtn').click(function(){
    const password = $('#new-password').val();
    if (!password) {
      $('#forgot-msg').text('Please enter a new password.');
      return;
    }
    $.post('/api/reset-password', { email: resetEmail, password }, function(res){
      if (res.success) {
        $('#forgot-msg').text('Password reset! You can log in now.');
        setTimeout(()=>window.location.href='login.html',1500);
      } else {
        $('#forgot-msg').text(res.message);
      }
    });
  });
});