require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Twilio client setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Email transporter setup (fix typo 'gmail')
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// SQLite DB setup
const db = new sqlite3.Database('./dms.db', (err) => {
  if (err) {
    console.error('DB connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeTables();
    seedAdmin();
  }
});

// Initialize tables
function initializeTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_code TEXT NOT NULL,
      grade TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('open', 'in_progress', 'closed')) DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      code TEXT,
      created_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  });
}

// Seed admin user
async function seedAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.run(
      `INSERT OR IGNORE INTO users (username, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'admin@mubs.ac.ug', '0700000000', hashedPassword, 'admin'],
      (err) => {
        if (err) console.error('Failed to seed admin:', err);
        else console.log('Admin user ensured');
      }
    );
  } catch (e) {
    console.error('Error seeding admin:', e);
  }
}

// JWT auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Routes

// Register user
app.post('/api/register', async (req, res) => {
  const { username, email, phone, password, role } = req.body;
  if (!username || !email || !password || !role)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)');
    stmt.run(username, email, phone, hashedPassword, role, function (err) {
      if (err) {
        return res.status(500).json({ error: 'User registration failed: ' + err.message });
      }
      res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
    });
    stmt.finalize();
  } catch (err) {
    res.status(500).json({ error: 'Registration error: ' + err.message });
  }
});

// Login user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

// Change password
app.post('/api/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Current password incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update password' });
      res.json({ message: 'Password changed successfully' });
    });
  });
});

// Request password reset (combined for email or phone)
// Request password reset (combined for email or phone)
app.post('/api/request-reset', (req, res) => {
  const { emailOrPhone } = req.body;
  const code = crypto.randomInt(100000, 999999).toString();

  db.get('SELECT id FROM users WHERE email = ? OR phone = ?', [emailOrPhone, emailOrPhone], (err, user) => {
    if (!user) return res.status(404).json({ error: 'User not found' });

    db.run('INSERT INTO password_resets (user_id, code, created_at) VALUES (?, ?, datetime(\'now\'))', [user.id, code], (err) => {
      if (err) return res.status(500).json({ error: 'Internal error' });

      if (emailOrPhone.includes('@')) {
        // Send email
        transporter.sendMail({
          from: `"DMS Support" <${process.env.SMTP_USER}>`,
          to: emailOrPhone,
          subject: 'Password Reset Code',
          text: `Your password reset code is: ${code}`,
          html: `<p>Hello,</p><p>Your password reset code is: <strong>${code}</strong></p><p>This code will expire in 15 minutes.</p>`
        }, (err, info) => {
          if (err) {
            console.error('Failed to send email:', err);
            return res.status(500).json({ error: 'Failed to send email' });
          }
          res.json({ message: 'Reset code sent via email' });
        });
      } else {
        // Send SMS via Twilio
        twilioClient.messages
          .create({
            body: `Your password reset code is: ${code}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: emailOrPhone,
          })
          .then(message => {
            res.json({ message: 'Reset code sent via SMS' });
          })
          .catch(err => {
            console.error('Failed to send SMS:', err);
            res.status(500).json({ error: 'Failed to send SMS' });
          });
      }
    });
  });
});
