const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const Driver = require('./models/Driver');
const auth = require('./middlewares/auth.middleware'); // Optional check

// Connect to database
connectDB();

// 📱 Self-Pinger (Prevent Render Sleep Mode)
const axios = require('axios');
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://rideflux.onrender.com';
setInterval(() => {
  axios.get(`${RENDER_URL}/ping`).catch(() => { });
}, 10 * 60 * 1000); // Ping every 10 mins

// ✅ Env Variable Validation Logic
const validateEnv = () => {
  const required = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'BREVO_SMTP_USER', 'BREVO_SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing Render Environment Variables:', missing.join(', '));
    console.error('⚠️ FIX: Go to Render Dashboard -> Your Service -> Environment -> Add them manually.');
  } else {
    console.log('🌍 All Environment Variables Loaded successfully.');
    console.log(`📡 Ready on Port: ${process.env.PORT} | Sending from: ${process.env.BREVO_SMTP_USER}`);
  }
};
validateEnv();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/drivers', require('./routes/driver.routes'));
app.use('/api/rides', require('./routes/ride.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Socket Logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_ride', (rideId) => {
    socket.join(rideId);
    console.log(`Socket ${socket.id} joined ride: ${rideId}`);
  });

  socket.on('join_driver', (driverId) => {
    socket.join(driverId);
    console.log(`Socket ${socket.id} joined driver channel: ${driverId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user channel: ${userId}`);
  });

  socket.on('update_location', async (data) => {
    // Broadcast driver location to anyone tracking
    if (data.rideId) {
      io.to(data.rideId).emit('driver_location_update', data);
    } else {
      io.emit('driver_location_update', data);
    }

    // Update Driver in DB for search capabilities
    if (data.driverId && data.lat && data.lng) {
      try {
        await Driver.findByIdAndUpdate(data.driverId, {
          currentLocation: {
            type: 'Point',
            coordinates: [data.lng, data.lat]
          },
          isOnline: true
        });
      } catch (err) {
        console.error('Error updating driver location:', err);
      }
    }
  });

  socket.on('update_user_location', (data) => {
    // Broadcast user location to its ride room
    if (data.rideId) {
      io.to(data.rideId).emit('user_location_update', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send('RideFlux API is running with Sockets...');
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;

