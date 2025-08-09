const bcrypt = require('bcrypt');
const password = 'changeme123'; // <-- default password

bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Bcrypt hash for password:', password);
  console.log(hash);
});
print("New hash:", new_hash.decode())
