# 🧪 Login Test Instructions

## Quick Test

1. Open http://localhost:5173 in your browser
2. You should see 4 role cards on the left:
   - **Frontline Worker** (ASHA)
   - **Doctor / Clinician**
   - **Facility Admin**
   - **Patient**

3. Click ANY card (e.g., "Frontline Worker")
4. You should be instantly logged in and redirected to the dashboard

## If It Doesn't Work:

### Check Browser Console (F12)
Look for errors in the Console tab. Common issues:
- Network errors (backend not running)
- CORS errors
- 401 Unauthorized

### Manual Test
If auto-login doesn't work, try manual entry:
1. Type username: `asha1`
2. Type password: `password`
3. Click "Sign in securely"

### Backend Test
Test the backend directly:
```bash
# PowerShell
$response = Invoke-WebRequest -Uri "http://localhost:4000/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"asha1","password":"password"}' -UseBasicParsing
$response.Content
```

Should return:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "1",
    "username": "asha1",
    "role": "asha",
    "name": "ASHA Kavita"
  }
}
```

## Debug Checklist

✅ Backend running on port 4000?
```bash
curl http://localhost:4000/auth/login
```

✅ Frontend running on port 5173?
```bash
# Should open in browser
http://localhost:5173
```

✅ Browser console shows no errors?
- Press F12
- Check Console tab
- Look for red errors

✅ Network tab shows requests?
- Press F12
- Click Network tab
- Click a role card
- Should see POST to http://localhost:4000/auth/login

## Expected Flow

1. **Click role card**
2. **JavaScript calls:** `authApi.login('asha1', 'password')`
3. **Frontend sends:** POST to http://localhost:4000/auth/login
4. **Backend validates:** username & password
5. **Backend returns:** JWT token + user info
6. **Frontend stores:** token in localStorage as 'swasthya_token'
7. **Frontend calls:** AppContext.login()
8. **Frontend navigates:** to /asha or /doctor or /admin or /patient

## Current Credentials

All passwords are `password`:

| Role | Username | Password | Path |
|------|----------|----------|------|
| ASHA | asha1 | password | /asha |
| Doctor | doctor1 | password | /doctor |
| Admin | admin1 | password | /admin |
| Patient | patient1 | password | /patient |

## API Endpoint Details

### Login Request:
```http
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "username": "asha1",
  "password": "password"
}
```

### Login Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "asha1",
    "role": "asha",
    "name": "ASHA Kavita"
  }
}
```

## If Still Not Working

1. **Clear browser cache and localStorage:**
   - F12 → Application tab → Clear storage
   - Reload page

2. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Check backend logs:**
   Look at the terminal where backend is running
   Should show incoming requests

4. **Test with curl:**
   ```bash
   curl -X POST http://localhost:4000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"asha1","password":"password"}'
   ```

---

**Last updated:** Now
**Status:** Should be working ✅
