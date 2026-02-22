const express = require('express');
const router = express.Router();
const {
  registerUser,
  registerDriver,
  verifyOtp,
  login,
  socialLogin,
  forgotPassword,
  resetPassword,
  resendOtp,
  getProfile
} = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/register/user', registerUser);
router.post('/register/driver', registerDriver);
router.post('/verify-otp', verifyOtp);
router.post('/login/:role', login);
router.post('/social-login', socialLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOtp);
router.get('/profile', auth.protect, getProfile);

module.exports = router;
