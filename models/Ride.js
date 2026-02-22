const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickup: {
    address: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number] // [lng, lat]
    }
  },
  drop: {
    address: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number] // [lng, lat]
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'arrived', 'started', 'completed', 'cancelled'],
    default: 'pending'
  },
  fare: Number,
  distance: Number,
  duration: Number,
  vehicleType: { type: String, enum: ['bike', 'car', 'comfort', 'luxury', 'economy'], default: 'car' },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  completedAt: { type: Date }
});

RideSchema.index({ 'pickup.location': '2dsphere' });

module.exports = mongoose.model('Ride', RideSchema);
