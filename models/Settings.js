const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    carBaseFare: { type: Number, default: 5.50 },
    bikeBaseFare: { type: Number, default: 3.20 },
    surgeMultiplier: { type: Number, default: 1.0 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', SettingsSchema);
