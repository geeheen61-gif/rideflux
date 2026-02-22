# 🚀 Render.com Deployment Guide for RideFlux

Render is a great platform for deploying Node.js applications with full **WebSocket/Socket.IO** support, making it an excellent choice for RideFlux.

---

## 📋 Step-by-Step Deployment

### **Step 1: Create a Render Account**
1. Go to [render.com](https://render.com).
2. Sign up with your **GitHub** account (this makes deployment much easier).

### **Step 2: Create a New Web Service**
1. Click the **"New +"** button and select **"Web Service"**.
2. Connect your GitHub repository (`rideflux`).
3. If your repo contains both the Flutter app and the server, you'll need to configure the **Root Directory**.

### **Step 3: Service Configuration**
Set the following settings in the Render dashboard:
- **Name:** `rideflux-api` (or your choice)
- **Environment:** `Node`
- **Region:** Choose the one closest to you
- **Branch:** `main`
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### **Step 4: Configure Environment Variables**
Click on the **"Advanced"** button and then **"Add Environment Variable"**. Add all the keys from your local `.env` file:

| Key | Value (from your .env) |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render's default) |
| `MONGO_URI` | *Your MongoDB connection string* |
| `JWT_SECRET` | `rideflux_secret_key_123` |
| `MAPBOX_TOKEN` | *Your Mapbox token* |
| `EMAIL_USER` | `sulta4567@gmail.com` |
| `EMAIL_PASS` | `qgpp zrpn fdri ksvq` |
| `GOOGLE_CLIENT_ID` | *Your Google Client ID* |
| `GOOGLE_CLIENT_SECRET` | *Your Google Client Secret* |

### **Step 5: Deploy**
1. Click **"Create Web Service"**.
2. Render will start building and deploying your app.
3. Once finished, you will see a URL like `https://rideflux-api.onrender.com`.

### **Step 6: Update Flutter App**
Update `lib/services/api_service.dart` and `lib/services/auth_service.dart` with your new Render URL:

```dart
final String baseUrl = 'https://rideflux-api.onrender.com/api';
final String socketUrl = 'https://rideflux-api.onrender.com';
```

---

## 🔧 Troubleshooting

### **Issue: "Port already in use" or "Connection timeout"**
Render automatically assigns a port. Ensure your `server.js` uses `process.env.PORT`:
```javascript
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { ... });
```
*(I already fixed this for you in server.js!)*

### **Issue: MongoDB Connection Failed**
If your MongoDB is on Atlas, make sure you have allowed access from all IP addresses:
1. Go to **Network Access** in MongoDB Atlas.
2. Add IP Address `0.0.0.0/0` (standard for cloud deployments).

### **Issue: App goes to "Sleep"**
On the **Free Tier**, Render "spins down" your service after 15 minutes of inactivity. The first request after a long break might take 30 seconds to wake up the server.
- **Solution:** Use a tool like [Cron-job.org](https://cron-job.org) to ping your URL every 10 minutes, or upgrade to a paid plan ($7/month).

---

## ✅ Benefits of Render
- **Full WebSocket Support**: Real-time tracking will work perfectly.
- **Auto-deploys**: Every time you push to GitHub, Render updates your site.
- **Easy Logs**: Click "Logs" in the Render dashboard to see real-time errors.
