# Government Scheme Checker - Now Enabled! ✅

## Overview

The **Government Scheme Checker** feature was already developed but completely disconnected from the application. It's now fully integrated and accessible to both patients and ASHA workers.

## What Was Missing

The feature existed in the codebase but was not accessible because:

1. ❌ Backend route **not registered** in server.ts
2. ❌ Frontend routes **not added** to App.tsx
3. ❌ Sidebar navigation **missing** menu items
4. ❌ Translation keys **not defined** for menu labels

## Solution Implemented

### 1. Backend Route Registration

**File**: `services/api/src/server.ts`

```typescript
import schemesRoutes from './routes/schemes-simple.js'

// Register the schemes API
app.use('/schemes', schemesRoutes)
```

**Endpoint**: `POST /schemes/ai-check`

### 2. Frontend Routes

**File**: `src/App.tsx`

Added routes for both portals:
- `/patient/schemes` → `<SchemeChecker />`
- `/asha/schemes` → `<AshaSchemeChecker />`

### 3. Sidebar Navigation

**File**: `src/components/layout/Sidebar.tsx`

Added navigation items:
- **Patient Portal**: "Govt. Schemes" with ₹ icon
- **ASHA Portal**: "Govt. Schemes" with ₹ icon

### 4. Translations

**File**: `src/lib/i18n.ts`

```typescript
govtSchemes: {
  en: 'Govt. Schemes',
  hi: 'सरकारी योजनाएं',
  mr: 'सरकारी योजना',
  ta: 'அரசு திட்டங்கள்',
  te: 'ప్రభుత్వ పథకాలు',
  bn: 'সরকারি প্রকল্প'
}
```

## How It Works

### For Patients

1. **Login** as patient (priya@swasthya.in / demo1234)
2. **Click** "Govt. Schemes" in sidebar
3. **Enter** details:
   - Age
   - State (dropdown of all Indian states)
   - Conditions (checkboxes): Pregnant, Senior Citizen, BPL, Disability, Rural, Farmer
4. **Submit** → AI analyzes eligibility
5. **View** results:
   - Scheme names (English + Hindi)
   - Description
   - Eligibility criteria
   - Benefits
   - Application process
   - Required documents

### For ASHA Workers

Same process at `/asha/schemes` - helps ASHAs advise patients on available schemes.

## AI-Powered Scheme Detection

Uses **Groq AI** to intelligently match user profile to government schemes:

**Covered Schemes**:
- Ayushman Bharat (PMJAY)
- Pradhan Mantri Matru Vandana Yojana (pregnant women)
- National Social Assistance Programme (elderly/disabled/BPL)
- State-specific health schemes
- And more...

**Input Profile**:
```json
{
  "age": 32,
  "state": "Maharashtra",
  "conditions": ["Pregnant", "Rural Area", "Below Poverty Line"]
}
```

**AI Response**:
```json
{
  "success": true,
  "schemes": [
    {
      "schemeName": "Pradhan Mantri Matru Vandana Yojana",
      "description": "Cash incentive for pregnant women...",
      "eligibility": "Pregnant women (19+ years)...",
      "benefits": ["₹5000 in 3 installments", "Nutrition support"],
      "howToApply": "Visit Anganwadi center or PHC...",
      "documents": ["Aadhaar Card", "Bank Account", "Pregnancy certificate"]
    },
    {
      "schemeName": "Ayushman Bharat (PM-JAY)",
      "description": "Health insurance up to ₹5 lakh...",
      ...
    }
  ]
}
```

## Backend API

### Endpoint

```
POST /schemes/ai-check
Content-Type: application/json
```

### Request Body

```json
{
  "age": 32,
  "state": "Maharashtra",
  "conditions": ["Pregnant", "Rural Area"]
}
```

### Response

```json
{
  "success": true,
  "schemes": [...],
  "message": "Found 3 eligible schemes"
}
```

### Error Handling

| Error | Status | Cause |
|-------|--------|-------|
| Age and state required | 400 | Missing required fields |
| AI service not configured | 503 | Missing GROQ_API_KEY |
| AI authentication failed | 503 | Invalid GROQ_API_KEY |
| Failed to check schemes | 500 | AI service error |

## Environment Setup

The backend needs a Groq API key:

**File**: `services/api/.env`

```bash
GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key from: https://console.groq.com/

## Files Changed

| File | Change |
|------|--------|
| `services/api/src/server.ts` | Added schemes route registration |
| `src/App.tsx` | Added patient & ASHA routes |
| `src/components/layout/Sidebar.tsx` | Added navigation items, imported BadgeIndianRupee icon |
| `src/lib/i18n.ts` | Added govtSchemes translation |

## Existing Feature Files

These files were already present but disconnected:

- `src/pages/patient/SchemeChecker.tsx` - Patient UI
- `src/pages/asha/AshaSchemeChecker.tsx` - ASHA UI  
- `services/api/src/routes/schemes-simple.ts` - Backend API

## Testing

### Patient Portal

```
1. Login: priya@swasthya.in / demo1234
2. Click: "Govt. Schemes" in sidebar
3. Enter: Age 28, State: Maharashtra
4. Check: "Pregnant", "Rural Area"
5. Submit
6. Verify: Shows Ayushman Bharat, PMMVY, etc.
```

### ASHA Portal

```
1. Login: asha@swasthya.in / demo1234
2. Click: "Govt. Schemes" in sidebar
3. Help a patient check eligibility
4. Fill form with patient details
5. Submit and review schemes with patient
```

## UI Features

- ✅ Clean, bilingual interface (English + Hindi labels)
- ✅ State dropdown with all 31 Indian states & UTs
- ✅ Checkbox conditions for easy selection
- ✅ Loading state while AI processes
- ✅ Error messages for failures
- ✅ Detailed scheme cards with all information
- ✅ Mobile-responsive design

## Benefits

### For Patients
- Discover schemes they're eligible for
- Understand how to apply
- Know required documents
- Access benefits they didn't know existed

### For ASHA Workers
- Tool to educate patients about schemes
- Help with application process
- Increase scheme enrollment in community
- Better health outcomes through financial support

## Future Enhancements

1. **Scheme Application Tracking** - Track application status
2. **Document Upload** - Help prepare applications
3. **Multilingual** - Full Hindi/Marathi interfaces
4. **SMS Alerts** - Notify about new schemes
5. **Scheme Comparison** - Compare benefits side-by-side
6. **Success Stories** - Show community members who benefited

## Git Commit

**Commit**: `366a7eb`  
**Message**: "feat: add government scheme checker feature"

---

**Status**: ✅ **ENABLED**  
**Date**: September 22, 2026  
**Impact**: Government scheme checker now accessible to all users
