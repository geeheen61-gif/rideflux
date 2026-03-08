const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const { sendOtpEmail, sendWelcomeEmail, sendResetPasswordEmail } = require('../utils/emailService');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// Helper: Token Generation
const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Helper: OTP Generation
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register User
// @route   POST /api/auth/register/user
exports.registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: 'Name, email and password are required' });

  try {
    const [userExists, driverExists] = await Promise.all([
      User.findOne({ $or: [{ email }, { phone: phone?.trim() }] }).select('_id email phone').lean(),
      Driver.findOne({ email }).select('_id').lean()
    ]);

    if (userExists) return res.status(400).json({ message: `${userExists.email === email ? 'Email' : 'Phone'} already exists` });
    if (driverExists) return res.status(409).json({ message: 'Email registered as Driver' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({ name, email, phone: phone?.trim(), password, otp, otpExpires, isVerified: false });
    console.log(`[AUTH] User Created: ${email} | OTP: ${otp}`);

    sendOtpEmail(email, otp).catch(err => console.error('[EMAIL_FAIL]', err.message));

    res.status(201).json({ message: 'Registration successful. Verify OTP.', email, role: 'user' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register Driver
// @route   POST /api/auth/register/driver
exports.registerDriver = async (req, res) => {
  const { name, email, phone, password, vehicleType, vehicleNumber } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: 'All fields are required' });

  try {
    const [driverExists, userExists] = await Promise.all([
      Driver.findOne({ $or: [{ email }, { phone: phone?.trim() }] }).select('_id email phone').lean(),
      User.findOne({ email }).select('_id').lean()
    ]);

    if (driverExists) return res.status(400).json({ message: `${driverExists.email === email ? 'Email' : 'Phone'} already exists` });
    if (userExists) return res.status(409).json({ message: 'Email registered as Passenger' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const driver = await Driver.create({ name, email, phone: phone?.trim(), password, vehicleType, vehicleNumber, otp, otpExpires, isVerified: false });
    console.log(`[AUTH] Driver Created: ${email} | OTP: ${otp}`);

    sendOtpEmail(email, otp).catch(err => console.error('[EMAIL_FAIL]', err.message));

    res.status(201).json({ message: 'Driver registered. Verify OTP.', email, role: 'driver' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { email, otp, role } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({ email, otp, otpExpires: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    sendWelcomeEmail(email, user.name).catch(() => { });

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
    res.status(500).json({ message: 'Verification failed' });
  }
};

// @desc    Login
// @route   POST /api/auth/login/:role
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const { role } = req.params;

  try {
    let Model = role === 'user' ? User : (role === 'driver' ? Driver : (role === 'admin' ? Admin : null));
    if (!Model) return res.status(400).json({ message: 'Invalid role' });

    const user = await Model.findOne({ $or: [{ email: email }, { phone: email }] });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });

    if (role !== 'admin' && !user.isVerified) return res.status(401).json({ message: 'Email not verified', isVerified: false });
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

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
    res.status(500).json({ message: 'Login failed' });
  }
};

// @desc    Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email, role } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log(`[AUTH] Forgot Pass OTP: ${email} -> ${otp}`);
    sendResetPasswordEmail(email, otp).catch(() => { });

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

// @desc    Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword, role } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({ email, resetPasswordOtp: otp, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: 'Invalid/expired OTP' });

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Reset failed' });
  }
};

// @desc    Resend OTP
exports.resendOtp = async (req, res) => {
  const { email, role, isPasswordReset } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Not found' });

    const otp = generateOTP();
    const exp = Date.now() + 10 * 60 * 1000;

    if (isPasswordReset) {
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = exp;
    } else {
      user.otp = otp;
      user.otpExpires = exp;
    }

    await user.save();
    console.log(`[AUTH] Resent OTP to ${email}: ${otp}`);
    sendOtpEmail(email, otp).catch(() => { });

    res.json({ message: 'OTP resent' });
  } catch (error) {
    res.status(500).json({ message: 'Resend failed' });
  }
};

// @desc    Social Login
exports.socialLogin = async (req, res) => {
  const { name, email, socialId, provider, role } = req.body;
  try {
    const Model = role === 'driver' ? Driver : User;
    let user = await Model.findOne({ $or: [{ email }, { socialId }] });

    if (user) {
      if (!user.socialId) {
        user.socialId = socialId;
        user.provider = provider;
        await user.save();
      }
    } else {
      user = await Model.create({ name, email, socialId, provider, role, isVerified: true });
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
    res.status(500).json({ message: 'Social failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const Model = req.user.role === 'driver' ? Driver : (req.user.role === 'admin' ? Admin : User);
    const user = await Model.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.testEmail = async (req, res) => {
  const { email } = req.body;
  try {
    await sendOtpEmail(email, '123456');
    res.json({ message: 'Test email triggered to ' + email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
