const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const getEmailTemplate = (title, content, buttonLabel, buttonUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RideFlux</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050608; color: #ffffff; }
        .email-wrapper { width: 100%; background-color: #050608; padding: 40px 10px; }
        .container { max-width: 480px; margin: 0 auto; background-color: #0d0f14; border-radius: 32px; border: 1px solid #1c1f26; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
        .header { padding: 48px 20px 24px; text-align: center; }
        .logo-img { height: 60px; margin-bottom: 20px; }
        .logo-text { font-size: 30px; font-weight: 900; color: #00E5FF; letter-spacing: 4px; text-transform: uppercase; margin: 0; text-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }
        .hero { padding: 0 40px 24px; text-align: center; }
        .hero h1 { font-size: 32px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; }
        .content { padding: 0 40px 48px; text-align: center; line-height: 1.8; }
        .content p { font-size: 16px; color: #a1a1aa; margin: 0 0 30px; }
        .glass-box { background: rgba(0, 229, 255, 0.05); border-radius: 24px; padding: 40px 20px; border: 1px solid rgba(0, 229, 255, 0.15); margin-bottom: 32px; backdrop-filter: blur(10px); }
        .otp-label { font-size: 11px; font-weight: 800; color: #00E5FF; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 2px; opacity: 0.7; }
        .otp-value { font-size: 48px; font-weight: 900; color: #ffffff; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace; text-shadow: 0 0 25px rgba(0, 229, 255, 0.5); }
        .btn { display: inline-block; background: linear-gradient(135deg, #00E5FF 0%, #00B0FF 100%); color: #000000 !important; padding: 20px 40px; border-radius: 18px; font-size: 16px; font-weight: 900; text-decoration: none; box-shadow: 0 10px 20px rgba(0, 229, 255, 0.3); }
        .footer { padding: 48px 40px; background-color: #000000; text-align: center; border-top: 1px solid #14171c; }
        .footer p { font-size: 13px; color: #52525b; margin: 8px 0; }
        .accent { color: #00E5FF; font-weight: 900; }
      </style>
    </head>
    <body>
      <table class="email-wrapper" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <img src="cid:applogo" class="logo-img" alt="RideFlux Logo" />
                <p class="logo-text">RIDEFLUX</p>
              </div>
              <div class="hero">
                <h1>${title}</h1>
              </div>
              <div class="content">
                ${content}
                ${buttonLabel ? `<div style="margin-top: 10px;"><a href="${buttonUrl}" class="btn">${buttonLabel}</a></div>` : ''}
              </div>
              <div class="footer">
                <p><strong style="color: #ffffff;">RIDEFLUX INC.</strong></p>
                <p>The Future is Here.</p>
                <p>© 2026 RideFlux. All rights reserved.</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const LOGO_ATTACHMENT = [
  {
    filename: 'app_logo.png',
    path: path.join(__dirname, '../assets/app_logo.png'),
    cid: 'applogo'
  }
];

exports.sendOtpEmail = async (email, otp) => {
  const content = `
    <p>Authentication required. Secure your account by entering the verification code provided below.</p>
    <div class="glass-box">
      <div class="otp-label">Secure Access Code</div>
      <div class="otp-value">${otp}</div>
    </div>
    <p style="font-size: 14px; color: #71717a;">Code expires in <span class="accent">10 minutes</span>. If you did not request this, please secure your account.</p>
  `;

  const mailOptions = {
    from: { name: 'RideFlux', address: process.env.EMAIL_USER },
    to: email,
    subject: `[${otp}] RideFlux Verification Code`,
    html: getEmailTemplate('Identity Verification', content),
    attachments: LOGO_ATTACHMENT
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err.message);
    throw err;
  }
};

exports.sendWelcomeEmail = async (email, name) => {
  const content = `
    <p>Hi <span class="accent">${name}</span>,</p>
    <p>Welcome to the <span class="accent">RideFlux</span> community! Your account is now fully active and verified.</p>
    <p>We are thrilled to have you on board. Get ready for a premium ride-sharing experience.</p>
  `;

  const mailOptions = {
    from: { name: 'RideFlux', address: process.env.EMAIL_USER },
    to: email,
    subject: 'Welcome to RideFlux!',
    html: getEmailTemplate(`Welcome aboard, ${name}`, content),
    attachments: LOGO_ATTACHMENT
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err.message);
    throw err;
  }
};

exports.sendResetPasswordEmail = async (email, otp) => {
  const content = `
    <p>Safety alert: A password reset has been requested. Use the secure code below to finalize your new security credentials.</p>
    <div class="glass-box">
      <div class="otp-label">Security Reset Code</div>
      <div class="otp-value">${otp}</div>
    </div>
    <p style="font-size: 14px; color: #71717a;">If this was not you, please disregard this email.</p>
  `;

  const mailOptions = {
    from: { name: 'RideFlux', address: process.env.EMAIL_USER },
    to: email,
    subject: 'Security: RideFlux Reset Protocol',
    html: getEmailTemplate('Reset your protocol', content),
    attachments: LOGO_ATTACHMENT
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err.message);
    throw err;
  }
};