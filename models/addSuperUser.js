const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// 👤 Change these values as needed
const username = 'superuserax1';
const email = 'superadmin2@example.com';
const password = 'supersecure123';
const role = 'superuser'; // matches CHECK(role IN (...)) in your table

const db = new sqlite3.Database('./users.db');

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error hashing password:', err.message);
    return;
  }

  db.run(
    `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [username, email, hash, role],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.error(`⚠️ User '${username}' or email already exists.`);
        } else {
          console.error('❌ Failed to add user:', err.message);
        }
      } else {
        console.log(`✅ Superuser '${username}' added successfully.`);
      }
      db.close();
    }
  );
});
