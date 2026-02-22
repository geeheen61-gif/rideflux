# RideFlux Backend Server

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```
### 2. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

### 3. Seed Admin User (Optional)

```bash
node config/seedAdmin.js
```

This creates an admin user with:
- Email: `admin@rideflux.com`
- Password: `Admin@123`

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/user` | Register new user |
| POST | `/register/driver` | Register new driver |
| POST | `/login/:role` | Login (user/driver/admin) |
| POST | `/social-login` | Google OAuth login |
| POST | `/verify-otp` | Verify OTP |
| POST | `/resend-otp` | Resend OTP |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with OTP |
| GET | `/profile` | Get user profile |

### User Routes (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rides` | Get user ride history |
| GET | `/stats` | Get user statistics |

### Driver Routes (`/api/drivers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/status` | Update driver online/offline status |
| GET | `/online` | Get all online drivers |
| GET | `/stats` | Get driver statistics |
| GET | `/trips` | Get driver trip history |

### Ride Routes (`/api/rides`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/request` | Request a new ride |
| GET | `/active` | Get active ride |
| PUT | `/:rideId/accept` | Accept ride (driver) |
| PUT | `/:rideId/reject` | Reject ride (driver) |
| PUT | `/:rideId/status` | Update ride status |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get system statistics |
| GET | `/users` | Get all users |
| GET | `/drivers` | Get all drivers |
| GET | `/pending-drivers` | Get pending driver approvals |
| PUT | `/approve-driver/:id` | Approve driver |
| DELETE | `/reject-driver/:id` | Reject driver |
| GET | `/rides` | Get all rides |
| DELETE | `/rides/:id` | Delete ride |
| GET | `/settings` | Get system settings |
| POST | `/settings` | Update system settings |

---

## 🔌 Socket.io Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `join_ride` | `rideId` | Join ride room |
| `join_driver` | `driverId` | Join driver channel |
| `join_user` | `userId` | Join user channel |
| `driver_location_update` | `{driverId, lat, lng, rideId}` | Update driver location |
| `user_location_update` | `{userId, lat, lng, rideId}` | Update user location |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `ride_update` | `{ride object}` | Ride status changed |
| `driver_location` | `{driverId, lat, lng}` | Driver location updated |
| `user_location` | `{userId, lat, lng}` | User location updated |
| `new_ride_request` | `{ride object}` | New ride request for driver |

---

## 🗄️ Database Models

### User
- name, email, phone, password
- isVerified, socialId, provider
- otp, otpExpires

### Driver
- name, email, phone, password
- vehicleType, vehicleNumber, vehicleColor
- isOnline, isApproved, currentLocation
- rating, totalTrips

### Admin
- name, email, password

### Ride
- passenger, driver
- pickup, drop (with GeoJSON location)
- fare, distance, duration
- status, vehicleType
- timestamps

### Settings
- baseFare, perKmRate, perMinRate
- cancellationFee, minimumFare

---

## 🔒 Security

- JWT authentication for all protected routes
- Password hashing with bcrypt
- Role-based access control (user, driver, admin)
- Google OAuth token verification
- OTP-based email verification

---

## 📝 Notes

- Make sure to change `JWT_SECRET` in production
- Use environment-specific `.env` files for dev/staging/prod
- Enable HTTPS in production
- Configure CORS properly for your frontend domain

