# UptimeRobot Setup - Complete Guide

## ✅ What's Done:
1. Health endpoints added to all services
2. Frontend `.env` updated with production URLs
3. All changes committed and pushed

---

## 🎯 Fix UptimeRobot Monitors (IMPORTANT!)

### The Problem:
Your OCR monitor is showing **"405 Method Not Allowed"** because it's using **HEAD** request instead of **GET**.

### The Solution:
Edit each monitor in UptimeRobot and change the HTTP method to **GET**.

---

## 📝 Update Your 3 Monitors:

### Monitor #1: Backend API
1. Go to UptimeRobot Dashboard
2. Click on **"Swasthya Backend"** monitor
3. Click **"Edit"**
4. Find **"HTTP Method"** setting
5. Change from `HEAD` to **`GET`**
6. Click **"Save Changes"**

### Monitor #2: ML Service
1. Click on **"Swasthya ML Service"** monitor
2. Click **"Edit"**
3. Change HTTP Method to **`GET`**
4. Click **"Save Changes"**

### Monitor #3: OCR Service
1. Click on **"Swasthya OCR Service"** monitor
2. Click **"Edit"**
3. Change HTTP Method to **`GET`**
4. Click **"Save Changes"**

---

## ✅ Verify All Monitors Are Working:

After changing to GET method, all 3 should show:

| Service | URL | Status |
|---------|-----|--------|
| Backend API | https://swasthya-connect-1x6r.onrender.com/health | ✅ Up (200 OK) |
| ML Service | https://swasthya-connect-ml.onrender.com/health | ✅ Up (200 OK) |
| OCR Service | https://swasthya-connect-ocr.onrender.com/health | ✅ Up (200 OK) |

---

## 🚀 Test Your Portal

After monitors are working, wait 30 minutes then test:

1. **Login** - Should be fast (1-2 seconds)
2. **Patient Registration** - Should work smoothly
3. **OCR Upload** - Should process medical documents
4. **Triage Assessment** - Should predict risk levels

---

## 💡 Why This Works:

- **UptimeRobot pings every 5 minutes** → Keeps services warm
- **No cold starts** → Always ready for demo
- **Free forever** → No credit card needed
- **Perfect for hackathons** → Reliable demo experience

---

## 🎯 Your Production URLs:

```
Backend:  https://swasthya-connect-1x6r.onrender.com
ML:       https://swasthya-connect-ml.onrender.com
OCR:      https://swasthya-connect-ocr.onrender.com
Frontend: https://swasthya-connect-9nwa.vercel.app
```

---

## ✅ Final Checklist:

- [ ] Changed all 3 monitors to GET method in UptimeRobot
- [ ] All monitors showing "Up" status (green)
- [ ] Frontend `.env` updated (already done ✅)
- [ ] Tested login on portal (fast response)
- [ ] Ready for Smart India Hackathon demo! 🏆
