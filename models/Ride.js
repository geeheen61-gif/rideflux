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
    enum: ['requested', 'accepted', 'arrived', 'started', 'completed', 'cancelled'],
    default: 'requested'
  },
  fare: Number,
  distance: Number,
  duration: Number,
  vehicleType: { type: String, enum: ['bike', 'car', 'luxury', 'economy'], default: 'car' },
  createdAt: { type: Date, default: Date.now }
});

RideSchema.index({ 'pickup.location': '2dsphere' });

module.exports = mongoose.model('Ride', RideSchema);
