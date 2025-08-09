const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const router = express.Router();

// Example: POST /api/auth/request-login-otp
router.post('/request-login-otp', async (req, res) => {
  const { email } = req.body;
  // 1. Check user exists
  // 2. Generate OTP, store in db (hash it!), set expiry (e.g. Date.now()+5*60*1000)
  // 3. Send email via nodemailer
  // 4. Respond { success: true }
  res.json({ success: true });
});

// More endpoints...
module.exports = router;