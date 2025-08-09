const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // e.g. smtp.gmail.com
  port: process.env.SMTP_PORT,       // usually 587 or 465
  secure: process.env.SMTP_SECURE === 'true',  // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Your App Name" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
