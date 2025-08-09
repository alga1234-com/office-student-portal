$(function() {
  $('#loginBtn').click(function(){
    const username = $('#login-username').val();
    const password = $('#login-password').val();
    if (!username || !password) {
      $('#login-msg').text('Please enter both username and password.');
      return;
    }
    $.post('/api/login', { username, password }, function(res){
      if (res.success) {
        localStorage.setItem('oasisAuth', JSON.stringify({ user: res.user }));
        window.location.href = "dashboard.html";
      } else {
        $('#login-msg').text(res.message);
      }
    });
  });
});