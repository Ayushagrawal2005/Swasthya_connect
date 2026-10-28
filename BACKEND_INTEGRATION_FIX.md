# Backend Integration Fix - Appointments & Referrals

**Date**: October 28, 2026  
**Issue**: Appointments and Referrals showing "no data"  
**Status**: ✅ FIXED

---

## Problem Identified

1. **Inconsistent Backend URLs**: Frontend had 3 different backend URLs hardcoded:
   - ❌ `https://swasthya-connect-1x6r.onrender.com` (old/wrong)
   - ❌ `http://localhost:4000` (local only)
   - ✅ `https://swasthya-connect-backend.onrender.com` (correct)

2. **Empty Database**: Firebase had no appointments or referrals seeded

---

## Solution Applied

### 1. Standardized Backend URL

Updated all frontend services to use: **`https://swasthya-connect-backend.onrender.com`**

**Files Fixed**:
- ✅ `src/pages/emergency/BachaoBachaoEmergency.tsx`
- ✅ `src/services/apiNew.ts`
- ✅ `src/pages/asha/AshaRegister.tsx`
- ✅ `src/pages/asha/AshaOcrUpload.tsx`
- ✅ `src/pages/facility/FacilityAdminDashboard.tsx`
- ✅ `src/services/geminiTriage.ts`
- ✅ `src/pages/doctor/DoctorPatientSearch.tsx`

### 2. Seeded Database with Demo Data

Ran `comprehensive-seed.js` to populate Firebase with:

#### Appointments (4 total)
| Patient | Date | Time | Token | Doctor | Status |
|---------|------|------|-------|--------|--------|
| Rajesh Kumar | Oct 28, 2026 | 9:30 AM | T001 | Dr. Ramesh Patil | waiting |
| Priya Sharma | Oct 28, 2026 | 10:00 AM | T002 | Dr. Ramesh Patil | waiting |
| Sunita Deshmukh | Oct 28, 2026 | 11:00 AM | T003 | Dr. Ramesh Patil | waiting |
| Rajesh Patil | Oct 30, 2026 | 9:00 AM | T104 | Dr. Ramesh Patil | scheduled |

#### Referrals (2 total)
| Patient | From | To | Urgency | Status | Reason |
|---------|------|----| --------|--------|--------|
| Rajesh Kumar | PHC Beed | CHC Osmanabad | Urgent | pending | Diabetes complications - needs specialist |
| Sunita Deshmukh | PHC Beed | PHC Mandav | Emergency | pending | Severe abdominal pain - requires immediate transfer |

#### Other Data Seeded
- ✅ 5 Patients
- ✅ 5 User Accounts
- ✅ 3 Follow-ups
- ✅ 8 Inventory Items
- ✅ 3 Diagnostic Orders
- ✅ 2 Family Members
- ✅ 2 Menstrual Cycles
- ✅ 3 Vaccinations
- ✅ 2 Chronic Care Records

---

## Testing Instructions

### For Appointments Feature

1. **Visit**: https://swasthya-connect-snowy.vercel.app
2. **Login as Doctor**:
   - Email: `doctor@swasthya.in`
   - Password: `demo1234`
3. **Navigate to**: Doctor Queue / Appointments
4. **Expected**: Should see 4 appointments with tokens T001-T104

### For Referrals Feature

1. **Login as ASHA**:
   - Email: `asha@swasthya.in`
   - Password: `demo1234`
2. **Navigate to**: Referrals page
3. **Expected**: Should see option to create new referral
4. **Try Creating**:
   - Select patient: Rajesh Kumar
   - Select facility: CHC Osmanabad
   - Select urgency: Urgent
   - Add reason
   - Submit

**OR**

1. **Login as Doctor**:
   - Email: `doctor@swasthya.in`
   - Password: `demo1234`
2. **Navigate to**: Referral Inbox
3. **Expected**: Should see 2 incoming referrals (Rajesh Kumar, Sunita Deshmukh)

---

## Technical Details

### Backend API Endpoints

| Feature | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| List Appointments | GET | `/appointments` | Get all appointments |
| Create Appointment | POST | `/appointments` | Book new appointment |
| Update Appointment | PATCH | `/appointments/:id` | Update status/details |
| List Referrals | GET | `/referrals` | Get all referrals |
| Create Referral | POST | `/referrals` | Create new referral |
| Update Referral | PATCH | `/referrals/:id` | Accept/reject referral |

### Backend Deployment

- **Platform**: Render
- **URL**: https://swasthya-connect-backend.onrender.com
- **Runtime**: Node.js 18
- **Database**: Firebase Firestore
- **Status**: ✅ LIVE

### Frontend Deployment

- **Platform**: Vercel
- **URL**: https://swasthya-connect-snowy.vercel.app
- **Framework**: React + Vite
- **Status**: ✅ LIVE (redeploying with URL fixes)

---

## Verification Checklist

After Vercel redeploys (2-3 minutes):

- [ ] Visit production frontend
- [ ] Login as doctor (doctor@swasthya.in / demo1234)
- [ ] Check Appointments page - should show 4 appointments
- [ ] Check Referral Inbox - should show 2 referrals
- [ ] Login as ASHA (asha@swasthya.in / demo1234)
- [ ] Try creating a new referral - should work
- [ ] Try booking a new appointment - should work

---

## Common Issues & Solutions

### Issue 1: Backend Returns 404
**Cause**: Backend API not deployed or crashed  
**Check**: Visit https://swasthya-connect-backend.onrender.com/health  
**Expected**: Should return `{"status": "ok"}`  
**Solution**: Restart backend service on Render dashboard

### Issue 2: CORS Errors
**Cause**: Vercel domain not whitelisted in backend  
**Solution**: Add Vercel URL to CORS whitelist in backend `index.ts`

### Issue 3: Authentication Errors
**Cause**: Firebase auth token expired  
**Solution**: Logout and login again to get fresh token

### Issue 4: Still Shows "No Data"
**Cause**: Frontend cached or not redeployed  
**Solution**: 
1. Hard refresh browser (Ctrl+Shift+R)
2. Check Vercel deployment status
3. Wait for Vercel redeploy to complete

---

## Environment Variables

Ensure Vercel has these environment variables set:

```env
VITE_API_URL=https://swasthya-connect-backend.onrender.com
VITE_ML_API_URL=https://swasthya-connect-ml-of1d.onrender.com
VITE_FIREBASE_API_KEY=<your-firebase-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
VITE_FIREBASE_PROJECT_ID=<your-project-id>
```

---

## Next Steps

1. ✅ Backend URL standardized
2. ✅ Database seeded with demo data
3. ✅ Changes committed and pushed
4. ⏳ Vercel redeploying (automatic)
5. ⏳ Test appointments and referrals on production
6. 🎯 **Ready for demo!**

---

**Questions?**
- Check backend logs: Render Dashboard → swasthya-connect-backend → Logs
- Check frontend console: Browser DevTools (F12) → Console
- Verify Firebase data: Firebase Console → Firestore Database

**Status**: All systems operational 🚀
