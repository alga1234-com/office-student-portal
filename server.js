require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const crypto = require('crypto');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000; // <-- Indicate port at the top
const HOST = process.env.HOST || '0.0.0.0';

console.log(`🟢 Starting server on port ${PORT}...`); // <-- Show port on top

const app = express();
app.use(bodyParser.json());

// Serve static files from ./public
app.use(express.static(path.join(__dirname, 'public')));

// --- Setup SQLite DB ---
const db = new sqlite3.Database('./database.sqlite', err => {
  if (err) console.error('DB connection error:', err);
  else console.log('Connected to SQLite DB');
});

// --- Nodemailer transporter ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

// --- In-memory reset codes store ---
const resetCodes = {};

// --- Helper to send reset code email with template ---
async function sendResetCode(email, code) {
  try {
    const templatePath = './templates/reset-password.html';
    let html = await fs.readFile(templatePath, 'utf-8');
    html = html.replace('{{CODE}}', code);

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Your Password Reset Code',
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Reset code email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send reset email:', err.message);
    return false;
  }
}

// --- Generate a 6-digit code ---
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- API: Send Reset Code ---
app.post('/api/send-reset-code', (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: 'Email required' });

  db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.json({ success: false, message: 'DB error' });
    if (!row) return res.json({ success: false, message: 'Email not registered' });

    const code = generateCode();
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    resetCodes[email] = { code, expires };

    const sent = await sendResetCode(email, code);
    if (sent) return res.json({ success: true });
    else return res.json({ success: false, message: 'Failed to send email' });
  });
});

// --- API: Verify Reset Code ---
app.post('/api/verify-reset-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.json({ success: false, message: 'Email and code required' });

  const record = resetCodes[email];
  if (!record) return res.json({ success: false, message: 'No code requested for this email' });

  if (Date.now() > record.expires) {
    delete resetCodes[email];
    return res.json({ success: false, message: 'Code expired' });
  }

  if (record.code !== code) return res.json({ success: false, message: 'Invalid code' });

  return res.json({ success: true });
});

// --- API: Reset Password ---
app.post('/api/reset-password', (req, res) => {
  const { email, password, code } = req.body;
  if (!email || !password || !code) {
    return res.json({ success: false, message: 'Email, password, and code required' });
  }

  const record = resetCodes[email];
  if (!record || record.code !== code || Date.now() > record.expires) {
    return res.json({ success: false, message: 'Invalid or expired code' });
  }

  // Hash password (simple hash here - replace with bcrypt in production)
  const hashed = crypto.createHash('sha256').update(password).digest('hex');

  db.run('UPDATE users SET password_hash = ? WHERE email = ?', [hashed, email], function(err) {
    if (err) return res.json({ success: false, message: 'DB error' });

    delete resetCodes[email]; // remove used code
    return res.json({ success: true });
  });
});

// --- API: Login (Example) ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, message: 'Email and password required' });

  // Hash password (should use bcrypt in production)
  const hashed = crypto.createHash('sha256').update(password).digest('hex');

  db.get('SELECT * FROM users WHERE email = ? AND password_hash = ?', [email, hashed], (err, user) => {
    if (err) return res.json({ success: false, message: 'DB error' });
    if (!user) return res.json({ success: false, message: 'Invalid email or password' });

    // On success, send redirect instruction to dashboard.html
    res.json({ success: true, redirect: '/dashboard.html' });
  });
});

// --- Serve index.html at root ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start server ---
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://localhost:3000`);
});