const bcrypt = require ('bcrypt');
// Hashing
const password = 'myaismud8812';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hashed password:', hash);
});