const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Open or create the database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to SQLite database.');
});

// Create users table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'student', 'superuser', 'registra')),
    reg_no TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (
      (role = 'student' AND reg_no IS NOT NULL) OR
      (role IN ('admin', 'superuser', 'registra') AND reg_no IS NULL)
    )
  )
`);

app.use(bodyParser.json());

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, email, password, role, reg_no, phone } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (role === 'student' && !reg_no) {
    return res.status(400).json({ error: 'reg_no is required for students.' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    db.run(
      `INSERT INTO users (username, email, phone, password_hash, role, reg_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, phone || null, hashedPassword, role, reg_no || null],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists.' });
          }
          return res.status(500).json({ error: 'Database error.' });
        }

        return res.status(201).json({ message: 'User registered successfully.', userId: this.lastID });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login endpoint
app.post('/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Missing username/email or password.' });
  }

  // Find user by username or email
  db.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [usernameOrEmail, usernameOrEmail],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Check password
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Success
      res.json({ message: 'Login successful.', user: { id: user.id, username: user.username, role: user.role } });
    }
  );
});

app.listen(PORT, 'localhost', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
