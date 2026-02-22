const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  socialId: { type: String },
  provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
  vehicleType: { type: String, enum: ['bike', 'car', 'comfort', 'luxury', 'economy'], default: 'car' },
  vehicleNumber: { type: String },
  isOnline: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
  isApproved: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  role: { type: String, default: 'driver' },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

DriverSchema.index({ currentLocation: '2dsphere' });

// Hash password before saving
DriverSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
DriverSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Driver', DriverSchema);
