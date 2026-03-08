const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Using Port 587 with secure: false (STARTTLS) is generally more reliable on cloud providers like Render
// Optimized for High Speed and Reliability on Cloud Providers
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  pool: true,    // Use a pool of connections for faster sending
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
  },
  tls: {
    ciphers: 'SSLv3', // Broad compatible ciphers
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // Reduced to 10s for faster failure detection
  greetingTimeout: 10000,
  socketTimeout: 20000
});

// Non-blocking verification to avoid delaying server startup
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️ SMTP Warm-up Warning (Emails may fail):', error.message);
  } else {
    console.log('🚀 High-Speed Email Pool Ready');
  }
});

/**
 * Simplified Email Template to avoid Spam filters and improve delivery reliability.
 * Removing the large 445KB logo attachment as it flags transactional emails.
 */
const getEmailTemplate = (title, content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica', Arial, sans-serif; background-color: #f4f4f7; color: #333; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f7; padding-bottom: 40px; padding-top: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #333; border-radius: 8px; overflow: hidden; }
        .header { background-color: #000000; padding: 30px; text-align: center; }
        .logo { color: #00E5FF; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .title { color: #000; font-size: 22px; font-weight: bold; margin-bottom: 20px; }
        .otp-container { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 20px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #00B0FF; }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table class="main" align="center">
          <tr>
            <td class="header">
              <div class="logo">RIDEFLUX</div>
            </td>
          </tr>
          <tr>
            <td class="content">
              <div class="title">${title}</div>
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p>© 2026 RideFlux. All rights reserved.</p>
              <p>The Future of Logistics.</p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
};

exports.sendOtpEmail = async (email, otp) => {
  const content = `
    <p>Your verification code is below. Please enter it in the app to complete your registration.</p>
    <div class="otp-container">
      <div class="otp-code">${otp}</div>
    </div>
    <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your RideFlux code: ${otp}`,
    text: `Your verification code is: ${otp}`,
    html: getEmailTemplate('Verify your email', content)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Email error (${email}):`, err.message);
    throw err;
  }
};

exports.sendWelcomeEmail = async (email, name) => {
  const content = `
    <p>Hi ${name},</p>
    <p>Welcome to RideFlux! Your account has been successfully verified.</p>
    <p>You can now log in and start using our premium ride-sharing services.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to RideFlux!',
    html: getEmailTemplate('Welcome Aboard', content)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return info;
  } catch (err) {
    console.error(`❌ Welcome email error (${email}):`, err.message);
    throw err;
  }
};

exports.sendResetPasswordEmail = async (email, otp) => {
  const content = `
    <p>We received a request to reset your password. Use the code below to proceed:</p>
    <div class="otp-container">
      <div class="otp-code">${otp}</div>
    </div>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Code',
    html: getEmailTemplate('Reset your password', content)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to ${email}`);
    return info;
  } catch (err) {
    console.error(`❌ Reset email error (${email}):`, err.message);
    throw err;
  }
};