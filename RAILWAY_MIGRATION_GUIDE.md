# 🚂 Railway.app Migration Guide for RideFlux

## Why Railway?

Railway.app is the **recommended platform** for RideFlux because:
- ✅ **Full WebSocket/Socket.IO support** - No serverless limitations
- ✅ **Free tier** - $5 credit per month (enough for development)
- ✅ **Easy deployment** - Connect GitHub and deploy in minutes
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Environment variables** - Easy configuration management
- ✅ **Logs & monitoring** - Built-in debugging tools

---

## 📋 Step-by-Step Migration

### **Step 1: Create Railway Account**

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (recommended for easy deployment)

### **Step 2: Deploy from GitHub**

1. Click "Deploy from GitHub repo"
2. Select your `rideflux` repository
3. Railway will auto-detect the Node.js app in the `server` folder

**Important:** If Railway doesn't detect the server folder automatically:
- Go to Settings → Root Directory
- Set to `server`

### **Step 3: Configure Environment Variables**

Add these environment variables in Railway dashboard:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

**Get MongoDB URI:**
- Use MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas
- Create cluster → Connect → Get connection string
- Replace `<password>` with your database password

### **Step 4: Update server.js for Railway**

Railway automatically sets the `PORT` environment variable. Your current code already handles this:

```javascript
const PORT = process.env.PORT || 5000;
```

✅ No changes needed!

### **Step 5: Deploy**

1. Railway will automatically deploy when you push to GitHub
2. Wait for deployment to complete (usually 2-3 minutes)
3. Railway will provide a public URL like: `https://rideflux-production.up.railway.app`

### **Step 6: Update Flutter App**

Update `lib/services/api_service.dart`:

```dart
class ApiService {
  // Replace Vercel URLs with Railway URLs
  final String baseUrl = 'https://your-app.up.railway.app/api';
  final String socketUrl = 'https://your-app.up.railway.app';
  
  // ... rest of the code
}
```

### **Step 7: Test Socket.IO Connection**

1. Run your Flutter app
2. Check console logs for:
   ```
   ✅ Socket connected successfully! Socket ID: abc123
   📡 Joined user channel: user_id
   ```
3. Test real-time location tracking

---

## 🔧 Troubleshooting

### **Issue: App not starting**

**Check logs in Railway dashboard:**
```bash
# Common issues:
# 1. Missing environment variables
# 2. MongoDB connection failed
# 3. Port binding issues
```

**Solution:**
- Verify all environment variables are set
- Test MongoDB connection string locally first
- Check Railway logs for specific error messages

### **Issue: Socket.IO not connecting**

**Check:**
1. CORS settings in `server.js` - should allow your Flutter app's origin
2. Socket.IO client version matches server version
3. Railway URL is correct in Flutter app

**Current CORS config (already correct):**
```javascript
const io = socketio(server, {
  cors: {
    origin: "*", // Allows all origins (fine for development)
    methods: ["GET", "POST", "PUT"]
  }
});
```

### **Issue: Database connection failed**

**Solution:**
1. Whitelist Railway's IP in MongoDB Atlas:
   - Go to Network Access
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
2. Verify connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/rideflux?retryWrites=true&w=majority
   ```

---

## 💰 Cost Estimation

### **Free Tier ($5 credit/month)**
- Covers ~500 hours of runtime
- Perfect for development and testing
- No credit card required initially

### **When you need to upgrade:**
- High traffic (1000+ concurrent users)
- 24/7 uptime requirements
- Estimated cost: $5-10/month for small production app

---

## 🚀 Advanced: Custom Domain

1. Go to Railway project → Settings → Domains
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `api.rideflux.com`)
4. Add CNAME record in your DNS provider:
   ```
   CNAME api.rideflux.com → your-app.up.railway.app
   ```
5. Railway automatically provisions SSL certificate

---

## 📊 Monitoring & Logs

### **View Real-time Logs**
1. Go to Railway dashboard
2. Click on your service
3. Click "Logs" tab
4. See real-time console output

### **Useful log filters:**
- `Socket connected` - Track new connections
- `Error` - Find errors quickly
- `Ride accepted` - Monitor ride flow

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Fix location tracking"
   git push origin main
   ```
3. Railway detects the push and redeploys automatically
4. Check deployment status in Railway dashboard

---

## 🎯 Post-Migration Checklist

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] MongoDB Atlas whitelist updated
- [ ] App deployed successfully
- [ ] Public URL obtained
- [ ] Flutter app updated with new URLs
- [ ] Socket.IO connection tested
- [ ] Real-time location tracking verified
- [ ] Ride request flow tested
- [ ] Driver acceptance flow tested
- [ ] Update documentation with new URLs

---

## 🆘 Need Help?

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Socket.IO Docs:** https://socket.io/docs/v4/

---

## 🎉 Benefits After Migration

✅ **Real-time location updates** - <1 second latency  
✅ **Reliable Socket.IO** - No serverless limitations  
✅ **Better user experience** - Instant ride updates  
✅ **Lower battery usage** - No constant HTTP polling  
✅ **Scalable** - Can handle production traffic  
✅ **Easy debugging** - Real-time logs and monitoring  

**Your RideFlux app will work as intended with true real-time tracking!** 🚗💨

