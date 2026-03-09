const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// We are using the Brevo HTTP API on port 443 to bypass Render SMTP port blocking
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const getApiKey = () => process.env.BREVO_API_KEY || process.env.BREVO_SMTP_PASS;
const getSenderEmail = () => process.env.BREVO_SMTP_USER || '8782fe001@smtp-brevo.com';

const sendEmailViaBrevo = async (toEmail, subject, htmlContent) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ Missing Brevo API Key or SMTP Password in environment variables.');
  }

  const payload = {
    sender: { email: getSenderEmail(), name: 'RideFlux' },
    to: [{ email: toEmail }],
    subject: subject,
    htmlContent: htmlContent
  };

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });
    console.log(`✅ Email sent to ${toEmail} via Brevo API: ${response.data.messageId}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Email API error (${toEmail}):`, err.response ? JSON.stringify(err.response.data) : err.message);
    throw err;
  }
};

/**
 * Simplified Email Template to avoid Spam filters and improve delivery reliability.
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

  return await sendEmailViaBrevo(
    email,
    `Your RideFlux code: ${otp}`,
    getEmailTemplate('Verify your email', content)
  );
};

exports.sendWelcomeEmail = async (email, name) => {
  const content = `
    <p>Hi ${name},</p>
    <p>Welcome to RideFlux! Your account has been successfully verified.</p>
    <p>You can now log in and start using our premium ride-sharing services.</p>
  `;

  return await sendEmailViaBrevo(
    email,
    'Welcome to RideFlux!',
    getEmailTemplate('Welcome Aboard', content)
  );
};

exports.sendResetPasswordEmail = async (email, otp) => {
  const content = `
    <p>We received a request to reset your password. Use the code below to proceed:</p>
    <div class="otp-container">
      <div class="otp-code">${otp}</div>
    </div>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `;

  return await sendEmailViaBrevo(
    email,
    'Password Reset Code',
    getEmailTemplate('Reset your password', content)
  );
};