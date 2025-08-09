const bcrypt = require('bcrypt');
bcrypt.hash('Lanbnet80#@!', 10, (err, hash) => { 
  if (err) throw err;
  console.log(hash);
});