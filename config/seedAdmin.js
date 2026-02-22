const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    const adminExists = await Admin.findOne({ email: 'admin@rideflux.com' });
    if (adminExists) {
      console.log('Super Admin already exists.');
      process.exit(0);
    }

    await Admin.create({
      name: 'Super Admin',
      email: 'admin@rideflux.com',
      password: 'admin123'
    });

    console.log('Super Admin account created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
