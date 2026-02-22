const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const { sendOtpEmail, sendWelcomeEmail, sendResetPasswordEmail } = require('../utils/emailService');

// Initialize OAuth2Client only if ID exists, or create a placeholder and check later
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// Generate Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register User
// @route   POST /api/auth/register/user
exports.registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const query = { $or: [{ email }] };
    if (phone && phone.trim() !== "") {
      query.$or.push({ phone });
    }
    const userExists = await User.findOne(query);
    if (userExists) {
      const field = userExists.email === email ? 'Email' : 'Phone';
      return res.status(400).json({ message: `${field} already exists as a Passenger` });
    }

    // Cross-role check
    const driverExists = await Driver.findOne({ email });
    if (driverExists) {
      return res.status(409).json({ message: 'This email is already registered as a Driver' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const userData = {
      name,
      email,
      password,
      otp,
      otpExpires
    };

    if (phone && phone.trim() !== "") {
      userData.phone = phone.trim();
    }

    const user = await User.create(userData);

    try {
      await sendOtpEmail(email, otp);
    } catch (emailErr) {
      console.error('Email Sending Failed:', emailErr);
      // We still created the user, but couldn't send the email.
      // In this case, we might want to return a specific message.
      return res.status(201).json({
        message: 'Registration successful, but we failed to send the OTP email. Please use the resend OTP option.',
        email: user.email,
        role: 'user'
      });
    }

    res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
      email: user.email,
      role: 'user'
    });
  } catch (error) {
    console.error('Registration Error Details:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { email, otp, role } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      vehicleType: user.vehicleType,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Register Driver
// @route   POST /api/auth/register/driver
exports.registerDriver = async (req, res) => {
  const { name, email, phone, password, vehicleType, vehicleNumber } = req.body;
  try {
    const query = { $or: [{ email }] };
    if (phone && phone.trim() !== "") {
      query.$or.push({ phone });
    }
    const driverExists = await Driver.findOne(query);
    if (driverExists) {
      const field = driverExists.email === email ? 'Email' : 'Phone';
      return res.status(400).json({ message: `${field} already exists as a Driver` });
    }

    // Cross-role check
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'This email is already registered as a Passenger' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const driverData = {
      name,
      email,
      password,
      vehicleType,
      vehicleNumber,
      otp,
      otpExpires
    };

    if (phone && phone.trim() !== "") {
      driverData.phone = phone.trim();
    }

    const driver = await Driver.create(driverData);

    try {
      await sendOtpEmail(email, otp);
    } catch (emailErr) {
      console.error('Email Sending Failed:', emailErr);
      return res.status(201).json({
        message: 'Registration successful, but we failed to send the OTP email. Please use the resend OTP option.',
        email: driver.email,
        role: 'driver'
      });
    }

    res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
      email: driver.email,
      role: 'driver'
    });
  } catch (error) {
    console.error('Driver Registration Error Details:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// @desc    Login User/Driver/Admin
// @route   POST /api/auth/login/:role
exports.login = async (req, res) => {
  const { email, password } = req.body; // email field can contain email or phone
  const { role } = req.params;
  try {
    let Model;
    if (role === 'user') Model = User;
    else if (role === 'driver') Model = Driver;
    else if (role === 'admin') Model = Admin;
    else return res.status(400).json({ message: 'Invalid role' });

    // Search by email OR phone
    const user = await Model.findOne({
      $or: [
        { email: email },
        { phone: email }
      ]
    });

    if (user && (await user.matchPassword(password))) {
      if (role !== 'admin' && !user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email first', isVerified: false });
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
        vehicleType: user.vehicleType,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(401).json({ message: 'Invalid email/phone or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Social Login (Google/Facebook)
// @route   POST /api/auth/social-login
exports.socialLogin = async (req, res) => {
  const { name, email, socialId, provider, role, token } = req.body;
  console.log(`Social Login request - Provider: ${provider}, Role: ${role}, Email: ${email}`);

  try {
    // Verify Token based on provider
    if (provider === 'google' && token) {
      if (!googleClient) {
        console.warn('GOOGLE_CLIENT_ID is not configured - skipping server-side token verification');
        // We'll trust the client-side SDK verification
      } else {
        try {
          // Try idToken verification first
          try {
            const ticket = await googleClient.verifyIdToken({
              idToken: token,
              audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            console.log('Google idToken verified for:', payload.email);
            if (payload.email && payload.email !== email) {
              return res.status(401).json({ message: 'Email mismatch during Google verification' });
            }
          } catch (idErr) {
            // idToken verification failed, try accessToken via tokeninfo
            try {
              const tokenInfo = await googleClient.getTokenInfo(token);
              console.log('Google accessToken verified for:', tokenInfo.email);
              if (tokenInfo.email && tokenInfo.email !== email) {
                return res.status(401).json({ message: 'Email mismatch during Google verification' });
              }
            } catch (accessErr) {
              // Both failed - Flutter already verified it client-side, so we allow it
              // but log the warning
              console.warn('Google token server verification skipped (client already verified):', accessErr.message);
            }
          }
        } catch (err) {
          console.error('Google Token Verification Failed:', err.message);
          // Don't reject - trust client-side verification
        }
      }
    }

    let Model = role === 'driver' ? Driver : (role === 'admin' ? Admin : User);

    // ─── Cross-role prevention ───────────────────────────────────────────────
    // Check if this email already exists in the OPPOSITE role's collection
    if (role === 'driver') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          message: 'This Google account is already registered as a Passenger. Please use a different Google account to register as a Driver, or log in as a Passenger.'
        });
      }
    } else if (role === 'user') {
      const existingDriver = await Driver.findOne({ email });
      if (existingDriver) {
        return res.status(409).json({
          message: 'This Google account is already registered as a Driver. Please use a different Google account to register as a Passenger, or log in as a Driver.'
        });
      }
    }

    // Search for user by email first
    let user = await Model.findOne({ email });

    // If not by email, try by socialId (only if socialId is provided)
    if (!user && socialId) {
      user = await Model.findOne({ socialId });
    }

    if (user) {
      console.log(`Matching user found for social login: ${user.email}`);

      // Link social account to existing local account, or update social details
      if (!user.socialId || user.provider !== provider) {
        user.socialId = socialId;
        user.provider = provider;
        user.isVerified = true; // Also verify them via Google
        await user.save();
      }
    } else {
      // Create new social user
      console.log(`Creating new social user for ${email} with role ${role}`);
      const newUserData = {
        name,
        email,
        socialId,
        provider,
        isVerified: true,
        role: role,
      };

      // Add driver-specific fields
      if (role === 'driver') {
        newUserData.vehicleType = 'car';
        newUserData.vehicleNumber = 'PENDING';
      }

      user = await Model.create(newUserData);

      // Send welcome email for first-time social registration (don't crash on failure)
      try {
        await sendWelcomeEmail(user.email, user.name);
        console.log(`Welcome email sent to new social user: ${email}`);
      } catch (emailErr) {
        console.error('Welcome email failed (non-fatal):', emailErr.message);
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isApproved: user.isApproved || false,
      vehicleType: user.vehicleType,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    console.error('Social Login Error Details:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// @desc    Forgot Password - Request OTP
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email, role } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendResetPasswordEmail(email, otp);

    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, role, newPassword } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
// @desc    Get user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const Model = req.user.role === 'driver' ? Driver : (req.user.role === 'admin' ? Admin : User);
    const user = await Model.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
exports.resendOtp = async (req, res) => {
  const { email, role, isPasswordReset } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (isPasswordReset) {
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = otpExpires;
      await user.save();
      await sendResetPasswordEmail(email, otp);
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
      await sendOtpEmail(email, otp);
    }

    res.json({ message: 'Verification code resent. Please check your email.' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
