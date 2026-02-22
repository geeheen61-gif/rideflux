const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // One-time fix: Drop problematic indexes if they exist to allow sparse recreation
    try {
      const db = conn.connection.db;
      await db.collection('users').dropIndex('phone_1').catch(() => { });
      await db.collection('drivers').dropIndex('phone_1').catch(() => { });
      console.log('Database indexes synchronized successfully');

      // Seed Super Admin if not exists
      const adminExists = await Admin.findOne({ email: 'admin@rideflux.com' });
      if (!adminExists) {
        await Admin.create({
          name: 'Super Admin',
          email: 'admin@rideflux.com',
          password: 'admin123'
        });
        console.log('Super Admin account created successfully');
      }
    } catch (err) {
      console.log('Database maintenance step completed');
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
