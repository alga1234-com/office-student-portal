$(function() {
  $('#signupBtn').click(function(){
    const username = $('#signup-username').val();
    const email = $('#signup-email').val();
    const password = $('#signup-password').val();
    if (!username || !email || !password) {
      $('#signup-msg').text('All fields are required.');
      return;
    }
    $.post('/api/signup', { username, email, password }, function(res){
      if (res.success) {
        localStorage.setItem('oasisAuth', JSON.stringify({ user: res.user }));
        window.location.href = "dashboard.html";
      } else {
        $('#signup-msg').text(res.message);
      }
    });
  });
});