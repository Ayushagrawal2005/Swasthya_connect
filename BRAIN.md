# Healthcare Platform - Project Brain 🧠

## Project Overview

A comprehensive rural healthcare platform built with React + TypeScript (frontend) and Node.js + Express + Firebase (backend), featuring AI-powered triage, real-time teleconsultation, and offline-first architecture for low-connectivity environments.

**Tech Stack:**
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Framer Motion
- Backend: Node.js, Express, TypeScript, Firebase Firestore
- Real-time: Socket.IO, WebRTC (SimplePeer)
- AI/ML: Groq API (triage), Python ML service (risk scoring)
- Additional: OCR service (FastAPI), offline sync with IndexedDB

---

## Architecture Principles

### 1. Multi-Role System
Five primary user types with 12 distinct role workflows:
- **ASHA Workers**: Community health workers doing field triage and patient management
- **Doctors**: Remote consultation, prescription, referral management
- **Patients**: Self-triage, appointment booking, health records
- **Facility Managers** (6 roles): Admin, Inventory, Beds, Ambulance, Diagnostic, Referral coordination
- **Admin**: Platform-wide staff management, inventory, diagnostics coordination

### 2. Offline-First Design
- IndexedDB for local data persistence
- Background sync when connectivity restored
- Graceful degradation when APIs unavailable
- Mock data fallbacks for demos

### 3. Real-Time Communication
- WebRTC peer-to-peer video calls
- Socket.IO signaling server for call coordination
- Real-time teleconsult request queue
- Live notifications for doctors

---

## Key Directories

```
healthcare-platform/
├── src/
│   ├── pages/           # Route components by role
│   │   ├── asha/       # ASHA worker interfaces
│   │   ├── doctor/     # Doctor portal
│   │   ├── patient/    # Patient portal
│   │   ├── facility/   # Facility management (6 roles)
│   │   ├── emergency/  # Emergency "Bachao Bachao"
│   │   ├── admin/      # Admin dashboard
│   │   └── shared/     # Shared components
│   ├── components/      # Reusable UI components
│   │   ├── layout/     # Navbar, Sidebar
│   │   ├── emergency/  # Emergency Map
│   │   └── ui/         # Buttons, Cards, etc.
│   ├── services/        # API clients and utilities
│   │   ├── api.ts      # REST API client
│   │   ├── webrtc.ts   # WebRTC service
│   │   ├── geminiTriage.ts  # AI triage (Groq)
│   │   ├── emergencyService.ts # Emergency API
│   │   ├── geolocation.ts # GPS tracking
│   │   └── patientDataApi.ts # Patient data fetching
│   ├── lib/            # Core logic and utilities
│   │   ├── triageEngine.ts    # Risk scoring
│   │   ├── riskScoring.ts     # Algorithm
│   │   └── adaptiveQuestions.ts # Fallback questions
│   ├── data/           # Mock/sample data
│   └── context/        # React context providers
├── services/
│   ├── api/            # Backend Express server
│   │   └── src/
│   │       ├── routes/ # API endpoints
│   │       │   ├── emergency.ts # Emergency endpoints
│   │       │   ├── schemes-simple.ts # Scheme checker
│   │       │   └── ... # Other routes
│   │       ├── middleware/ # Auth, validation
│   │       ├── services/   # Business logic
│   │       ├── signaling.ts # WebRTC signaling
│   │       └── server.ts    # Main entry point
│   ├── ml/             # Python ML risk prediction
│   │   ├── app.py      # Main FastAPI server
│   │   ├── groq_conversation_engine.py # Voice triage
│   │   └── voice_triage_api.py # Voice endpoints
│   └── ocr/            # FastAPI OCR service (Gemini)
├── deploy-scripts/     # Deployment automation
└── docs/               # Documentation (removed, see BRAIN.md)
```

---

## Critical Patterns & Conventions

### API Communication
**Base URL:** `http://localhost:4000` (configured via `VITE_API_URL`)

**Authentication:**
- JWT tokens stored in localStorage
- Token passed in `Authorization: Bearer <token>` header
- Auth middleware validates on backend

**API Service Pattern:**
```typescript
// services/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const someApi = {
  async list() {
    const res = await fetch(`${API_BASE}/endpoint`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  }
}
```

### Component Structure
- Use functional components with hooks
- Extract reusable logic to custom hooks
- Keep components focused (single responsibility)
- Use `motion.div` from Framer Motion for animations

### State Management
- React Context for global state (user, auth, language)
- Local state with `useState` for component-specific data
- No Redux/Zustand - keeping it simple

### Styling
- TailwindCSS utility classes
- Custom design tokens in `index.css`
- Responsive design: mobile-first approach
- Dark mode support via theme classes

---

## WebRTC Teleconsult System

### Architecture
```
ASHA Browser ←→ Socket.IO Server (Port 4000) ←→ Doctor Browser
                        ↓
                 Teleconsult Queue
                 (In-memory Map)
```

### Flow
1. **ASHA starts call:**
   - `webrtcService.connect()` → Socket.IO connection
   - `emit('request-teleconsult')` → Add to queue
   - Show "Waiting for doctor..." screen

2. **Doctor receives notification:**
   - Connected via `register-doctor` event
   - Listens for `new-teleconsult-request`
   - Shows notification banner on DoctorHome

3. **Doctor accepts:**
   - `emit('accept-teleconsult')` → Notify ASHA
   - Navigate to `/doctor/teleconsult` with sessionId
   - Both join same WebRTC room

4. **WebRTC connection:**
   - Both call `joinRoom(sessionId)`
   - Signaling server relays ICE candidates
   - SimplePeer establishes peer connection
   - Video/audio streams flow directly P2P

### Key Files
- `services/api/src/signaling.ts` - Socket.IO server
- `src/services/webrtc.ts` - WebRTC client wrapper
- `src/pages/asha/AshaTeleconsult.tsx` - ASHA video UI
- `src/pages/doctor/DoctorTeleconsult.tsx` - Doctor video UI
- `src/pages/doctor/DoctorHome.tsx` - Notification receiver

---

## AI-Powered Triage

### Two-Tier System

**Tier 1: Groq API (Dynamic Questions)**
- Model: `openai/gpt-oss-120b`
- Generates contextual follow-up questions
- Multilingual: English, Hindi, Marathi
- Timeout: 8 seconds → fallback

**Tier 2: Fallback Questions**
- Hardcoded adaptive questions
- Used when Groq fails/timeout
- Stored in `src/lib/adaptiveQuestions.ts`

### Risk Scoring
**ML Model Service:** `services/ml/app.py`
- Receives triage answers as features
- Returns risk score (0-100)
- Categories: Low (<60), Moderate (60-79), High (≥80)

**Rule-Based Engine:** `src/lib/triageEngine.ts`
- Red flag detection (chest pain, bleeding, etc.)
- Fallback when ML unavailable
- Combines symptom patterns

### Implementation
```typescript
// src/services/geminiTriage.ts
export async function getNextQuestion(history, firstAnswer, language) {
  // Try Groq API first
  const groqResponse = await callGroq(buildPrompt(history, language))
  
  // Fallback to hardcoded
  if (!groqResponse) {
    return getFollowUpQuestions(firstAnswer)[history.length - 1]
  }
  
  return groqResponse
}
```

---

## Patient Data System

### Longitudinal Records
**API Endpoint:** `/api/longitudinal/patients/:patientId`

**Structure:**
```typescript
interface PatientSummary {
  demographics: { name, age, gender, bloodGroup }
  medicalHistory: { allergies, chronicConditions }
  currentMedications: [{ name, dosage, frequency }]
  recentVisits: [{ date, diagnosis, provider }]
  vitalsTrend: [{ bp, temp, pulse, date }]
}
```

**Usage in Teleconsult:**
- Fetched via `getPatientSummaryForTeleconsult(patientId)`
- Displayed in sidebar during video call
- Falls back to mock data (Meena) if API fails

---

## Critical Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000
VITE_GROQ_API_KEY=gsk_...  # For AI triage
VITE_OCR_SERVICE_URL=http://localhost:8000
```

### Backend (services/api/.env)
```
PORT=4000
JWT_SECRET=healthcare-secret-key
FIREBASE_PROJECT_ID=healthcare-india-dev
OCR_SERVICE_URL=http://localhost:8000
ML_SERVICE_URL=http://localhost:5000
```

---

## Common Issues & Solutions

### Issue: WebSocket Connection Refused
**Cause:** Multiple WebSocket servers on same port
**Solution:** 
- Only use Socket.IO, not raw WebSocket
- Removed duplicate `WebSocketServer` from server.ts
- Fixed in commit: Commented out conflicting WS instance

### Issue: White Screen in Teleconsult
**Cause:** Invalid imports or uncaught errors in WebRTC service
**Solution:**
- Check TypeScript compile errors
- Verify all exports exist
- Add error boundaries in React

### Issue: "No routes matched location"
**Cause:** Navigation to non-existent route
**Solution:**
- Check App.tsx route definitions
- Use correct route paths in navigate()
- Example: `/asha/teleconsult` not `/asha/teleconsult-live`

### Issue: Patient Data Shows "Meena" Instead of Selected Patient
**Cause:** Hardcoded fallback patientId
**Solution:**
- Pass patientId in navigation state
- Update `AshaTriage.tsx` to include patient in navigate():
```typescript
navigate('/asha/teleconsult', {
  state: { patientId: selectedPatient?.id, triageData }
})
```

### Issue: Groq API JSON Parsing Errors
**Cause:** Malformed JSON from LLM
**Solution:**
- Regex extraction of JSON object
- Manual field extraction as fallback
- Trailing comma cleanup
- Implemented in `geminiTriage.ts`

---

## Testing Workflows

### ASHA Triage → Teleconsult
1. Login: `asha1@swasthya.gov.in` / `password`
2. Navigate to Triage
3. Select patient (link patient first)
4. Answer 4-6 questions (dynamic or fallback)
5. Get risk score from ML or rule engine
6. Click "Join Doctor" → Navigate to teleconsult
7. Wait for doctor to accept

### Doctor Accepts Call
1. Login: `doctor1@swasthya.gov.in` / `password`
2. Should see notification banner on DoctorHome
3. Click "Accept Call"
4. Navigate to teleconsult with sessionId
5. Video connection establishes automatically

### Two-Browser Test
- Browser 1: ASHA (Chrome)
- Browser 2: Doctor (Firefox/Incognito)
- Both must allow camera/microphone permissions
- Both should see each other's video feed

---

## Database Schema (Firebase Firestore)

### Collections
- `users` - All user accounts (ASHA, Doctor, Patient, Admin)
- `patients` - Patient demographics and health IDs
- `appointments` - Scheduled consultations
- `referrals` - Inter-facility referrals
- `triageSessions` - Triage records with risk scores
- `followUps` - Scheduled follow-up appointments
- `prescriptions` - Medication prescriptions
- `longitudinalRecords` - Historical health data

### Key Relationships
- `userId` links to `users` collection
- `patientId` links to `patients` collection
- `referrals.fromFacility` → facility codes
- `appointments.doctorId` → doctor user ID

---

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- Explicit return types for public functions
- Interface over type for object shapes
- Avoid `any`, use `unknown` if needed

### Naming
- Components: PascalCase (e.g., `AshaTriage.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useApp`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_QUESTIONS`)
- Private methods: camelCase (e.g., `handleSubmit`)

### File Organization
- One component per file
- Co-locate related utilities
- Separate API logic into services/
- Keep mock data in data/

### Error Handling
- Try-catch for async operations
- Graceful degradation (fallbacks)
- User-friendly error messages
- Console logging for debugging

---

## Performance Considerations

### Bundle Size
- Code splitting by route (React.lazy)
- Tree-shaking via Vite
- Lazy load heavy dependencies

### Network
- Debounce search inputs
- Cache API responses where applicable
- Optimize images (compress, WebP)

### Rendering
- Memoize expensive computations
- Virtualize long lists (if needed)
- Avoid unnecessary re-renders

---

## Security Best Practices

### Authentication
- JWTs with expiration
- Refresh tokens (planned)
- Role-based access control

### Data Validation
- Backend validates all inputs
- Frontend validates for UX
- Sanitize user input

### API Security
- CORS configured for allowed origins
- Rate limiting (to be added)
- HTTPS in production

---

## Deployment

### Frontend (Vite Build)
```bash
npm run build
# Output: dist/ folder
# Deploy to: Vercel, Netlify, or static hosting
```

### Backend (Node.js)
```bash
cd services/api
npm run build
node dist/server.js
# Deploy to: Railway, Render, or VPS
```

### Environment Variables
- Set all VITE_* variables for frontend
- Set PORT, JWT_SECRET, Firebase config for backend
- Use secrets management in production

---

## Future Enhancements

### Planned Features
- [ ] Call recording and playback
- [ ] Screen sharing in teleconsult
- [ ] Prescription e-signing
- [ ] SMS notifications via Twilio
- [ ] WhatsApp integration
- [ ] Multi-language UI (full i18n)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Telemedicine regulations compliance

### Technical Debt
- [ ] Add comprehensive tests (Jest, Playwright)
- [ ] Implement error boundaries
- [ ] Add request retry logic
- [ ] Optimize re-renders
- [ ] Add API response caching
- [ ] Improve offline sync reliability

---

## Quick Reference

### Start Development
```bash
# Frontend
npx vite --port 5173

# Backend
cd services/api && npm run dev

# ML Service
cd services/ml && python app.py

# OCR Service
cd services/ocr && uvicorn main:app --reload --port 8000
```

### Build for Production
```bash
npm run build
cd services/api && npm run build
```

### Common Commands
```bash
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run format        # Prettier
```

---

## Contact & Resources

**Documentation:**
- See `docs/` folder for detailed guides
- `REAL_TIME_TELECONSULT_COMPLETE.md` - WebRTC implementation
- `WEBRTC_TELECONSULT_STATUS.md` - Status and testing
- `ML_MODEL_DEEP_DIVE.md` - ML service details
- `OFFLINE_MODE_GUIDE.md` - Offline sync

**Key Decision Records:**
- Socket.IO over raw WebSocket (easier room management)
- Groq over Gemini (better reliability, speed)
- SimplePeer over manual RTCPeerConnection (battle-tested)
- Firebase over PostgreSQL (easier scaling, offline support)

**Credentials (Demo):**
- ASHA: `asha1@swasthya.gov.in` / `password`
- Doctor: `doctor1@swasthya.gov.in` / `password`
- Patient: `patient1` / `password`

---

---

## Emergency System - "Bachao Bachao" 🚨

### Overview
Critical emergency alert system with live GPS tracking, nearest facility matching, and real-time notifications for life-threatening situations.

### Architecture
```
Patient/ASHA → Emergency Trigger → Live GPS Tracking
                     ↓
           Nearest Facility Finder (Haversine)
                     ↓
           Facility Notifications + Map Display
                     ↓
           Bed Arrangement + Ambulance Dispatch
```

### Key Features

**1. Live Location Tracking**
- Continuous GPS monitoring during emergency
- Updates every 5 seconds
- Distance calculation to facilities
- ETA estimation based on speed

**2. Nearest Facility Finder**
- Haversine formula for distance calculation
- Filters by facility type (PHC, CHC, District Hospital)
- Searches within configurable radius (default 50km)
- Returns top 5 nearest facilities with:
  - Distance in kilometers
  - Available beds
  - Emergency capability
  - Contact information

**3. Interactive Emergency Map**
- Leaflet.js integration
- Shows patient location (red marker)
- Shows nearest facilities (green markers)
- Real-time updates as patient moves
- Distance circles visualization

**4. Emergency Workflow**
```
1. Patient/ASHA clicks "Bachao Bachao" button
2. System requests GPS permission
3. Live location tracking begins
4. Nearest facilities calculated
5. Notifications sent to all nearby facilities
6. ASHA sees facility list with distances
7. Can call facility or trigger ambulance
8. Facility managers see alert on dashboard
9. Can acknowledge and prepare resources
10. Live tracking continues until resolved
```

### API Endpoints

**Emergency Routes:** `/api/emergency/*`

```typescript
GET  /nearest-facilities?lat=X&lng=Y&radius=Z
POST /trigger { patientId, location, severity, symptoms }
PATCH /:id/location { latitude, longitude }
GET  /:id
GET  /?facilityId=X&status=Y
POST /:id/acknowledge { facilityId }
PATCH /:id/status { status: 'acknowledged' | 'dispatched' | 'resolved' }
GET  /notifications/list?facilityId=X
```

### File Structure

```
src/
├── services/
│   ├── geolocation.ts          # GPS tracking, Haversine distance
│   └── emergencyService.ts      # API calls, facility finder
├── components/
│   └── emergency/
│       └── EmergencyMap.tsx     # Leaflet map component
└── pages/
    ├── emergency/
    │   └── BachaoBachaoEmergency.tsx  # Main emergency UI
    ├── doctor/
    │   └── EmergencyEscalation.tsx    # Doctor emergency view
    └── facility/
        └── FacilityAdminDashboard.tsx # Facility alerts

services/api/src/
└── routes/
    └── emergency.ts             # Backend emergency API
```

### Geolocation Service

**Key Functions:**
```typescript
// Get current position
getCurrentPosition(): Promise<{lat, lng}>

// Calculate distance between two points
calculateDistance(lat1, lng1, lat2, lng2): number

// Start live tracking
startTracking(callback, interval): watchId

// Stop tracking
stopTracking(watchId): void
```

### Emergency Service

**Core Methods:**
```typescript
// Find nearest facilities
findNearestFacilities(lat, lng, radius): Promise<Facility[]>

// Trigger emergency
triggerEmergency(data): Promise<Emergency>

// Update patient location
updateLocation(emergencyId, lat, lng): Promise<void>

// Get emergency status
getEmergencyStatus(emergencyId): Promise<Emergency>
```

### Emergency Data Structure

```typescript
interface Emergency {
  id: string
  patientId: string
  patientName: string
  age: number
  severity: 'critical' | 'high' | 'moderate'
  symptoms: string
  location: {
    latitude: number
    longitude: number
    timestamp: Date
  }
  nearestFacilities: Array<{
    facilityId: string
    name: string
    distance: number
    eta: number
    bedsAvailable: number
  }>
  status: 'triggered' | 'acknowledged' | 'dispatched' | 'resolved'
  acknowledgedBy?: string
  triggeredAt: Date
  resolvedAt?: Date
}
```

### Integration Points

**ASHA Portal:**
- Emergency button on dashboard
- Quick access via `/asha/emergency/bachao-bachao`
- Shows patient info and nearest facilities
- Live location updates

**Doctor Portal:**
- Emergency escalation from EmergencyEscalation page
- "Launch Bachao Bachao" button for critical cases
- Passes patient data automatically

**Facility Portal:**
- Emergency alerts section on dashboard
- Mini-map showing patient location
- Acknowledge and respond buttons
- Filters by status (pending, acknowledged, resolved)

### Testing

**Mock Facilities:**
Located in `emergencyService.ts` with real GPS coordinates:
- Taloja PHC (19.0500, 73.1100)
- Kharghar CHC (19.0460, 73.0700)
- Panvel District Hospital (18.9894, 73.1175)
- Kamothe PHC (19.0280, 73.0940)
- Nerul CHC (19.0330, 73.0197)

**Test Workflow:**
1. Start servers (frontend + backend)
2. Login as ASHA
3. Navigate to Emergency
4. Click "Bachao Bachao"
5. Allow GPS permission
6. Verify facilities appear with distances
7. Check map shows markers
8. Verify live location updates

---

## Facility Management System

### Overview
Comprehensive facility administration with 6 specialized roles managing different aspects of healthcare facility operations.

### Six Facility Roles

**1. Admin Manager**
- Staff rostering and scheduling
- User management
- Access control
- System configuration

**2. Inventory Manager**
- Medicine stock tracking
- Supply chain management
- Low stock alerts
- Order management

**3. Bed Manager**
- Bed allocation and tracking
- Occupancy monitoring
- Patient admission/discharge
- Ward management

**4. Ambulance Coordinator**
- Ambulance fleet management
- Driver assignment
- Emergency dispatch
- Route optimization

**5. Diagnostic Manager**
- Lab test coordination
- Equipment management
- Result reporting
- Quality control

**6. Referral Coordinator**
- Inter-facility referrals
- Transfer coordination
- Bed availability checking
- Patient transport arrangement

### Facility Portal Structure

```
src/pages/facility/
├── FacilityLogin.tsx           # Role-based login
├── FacilityAdminDashboard.tsx  # Main dashboard with emergency alerts
├── StaffRostering.tsx          # Schedule management
├── BedManagement.tsx           # Bed tracking
├── AmbulanceCoordination.tsx   # Fleet management
├── InventoryTracking.tsx       # Stock management
├── DiagnosticCoordination.tsx  # Lab coordination
└── ReferralManagement.tsx      # Referral handling
```

### Role-Based Access

**Authentication Flow:**
1. User selects facility role
2. Logs in with credentials
3. Backend validates role permissions
4. Frontend routes to role-specific dashboard
5. Nav menu shows only authorized sections

**Permission Matrix:**
```typescript
const rolePermissions = {
  admin: ['staff', 'users', 'config', 'reports'],
  inventory: ['medicines', 'supplies', 'orders'],
  beds: ['admissions', 'discharges', 'wards'],
  ambulance: ['fleet', 'drivers', 'dispatch'],
  diagnostic: ['labs', 'tests', 'results'],
  referral: ['transfers', 'coordination', 'transport']
}
```

---

## Complete User Flows

### ASHA Worker Complete Journey

**1. Morning Routine**
- Login → Dashboard
- Check today's appointments
- Review assigned patients
- Check pending follow-ups

**2. Field Visit - Triage**
- Navigate to Triage
- Search and link patient
- Conduct AI-powered triage (Groq/fallback)
- Get risk score (ML model)
- Record vitals

**3. Emergency Situation**
- Click "Bachao Bachao" button
- GPS tracking starts
- Nearest facilities identified
- Call facility or trigger ambulance

**4. Teleconsultation**
- Join doctor from triage result
- Video call established via WebRTC
- Share patient history
- Doctor provides prescription

**5. OCR Document Upload**
- Scan paper prescriptions
- Upload to Gemini Vision API
- Extract structured data
- Save to patient record

**6. Follow-Up Scheduling**
- Check follow-up calendar
- Visit patient at scheduled time
- Update health status
- Reschedule if needed

**7. Referral Management**
- Create referral for specialist
- Select facility and department
- Track referral status
- Coordinate transport

### Doctor Complete Journey

**1. Dashboard Overview**
- Login → Doctor Home
- See teleconsult queue
- Check emergency escalations
- Review today's appointments

**2. Accept Teleconsult**
- Notification appears
- Click "Accept Call"
- Join WebRTC session
- View patient longitudinal data

**3. During Consultation**
- Video/audio communication
- Review medical history
- Check vitals and trends
- Ask follow-up questions

**4. Prescription & Diagnosis**
- Write prescription
- Set medication schedule
- Add diagnosis notes
- Schedule follow-up

**5. Emergency Escalation**
- Identify critical case
- Launch "Bachao Bachao"
- Alert nearest facilities
- Monitor response

**6. Referral Creation**
- Determine specialist need
- Create referral with notes
- Select target facility
- Track patient journey

### Patient Complete Journey

**1. Self-Service**
- Login → Patient Home
- View health records
- Check appointments
- Track medications

**2. Self-Triage**
- Navigate to Triage
- Answer AI questions
- Get risk assessment
- Receive recommendations

**3. Book Appointment**
- Select facility and doctor
- Choose time slot
- Confirm booking
- Receive notification

**4. Teleconsultation**
- Join scheduled video call
- Consult with doctor
- Receive prescription
- Download health report

**5. Medicine Tracking**
- View active prescriptions
- Set medication reminders
- Mark doses taken
- Check refill dates

**6. Referral Tracking**
- See referral status
- Check facility assignment
- View appointment details
- Get travel directions

### Admin Complete Journey

**1. System Overview**
- Login → Admin Dashboard
- View platform metrics
- Check active users
- Monitor system health

**2. Staff Management**
- Add new ASHA workers
- Assign facilities
- Manage permissions
- Review performance

**3. Diagnostic Coordination**
- Manage lab tests
- Coordinate with facilities
- Track test results
- Quality assurance

**4. Inventory Management**
- Monitor medicine stock
- Track supply chain
- Process orders
- Generate reports

**5. Analytics & Reporting**
- Patient demographics
- Consultation statistics
- Emergency response times
- Resource utilization

---

## AI & ML Integration

### Multi-AI Architecture

**1. Groq API (Primary Triage)**
- Model: `openai/gpt-oss-120b`
- Purpose: Dynamic question generation
- Latency: ~2-3 seconds
- Fallback: Adaptive questions

**2. Gemini Vision (OCR)**
- Model: `gemini-1.5-flash`
- Purpose: Document extraction
- Input: Images (prescriptions, reports)
- Output: Structured JSON

**3. Groq Conversation (Voice Triage)**
- Model: `mixtral-8x7b-32768`
- Purpose: Voice-based health assessment
- Real-time transcription
- Contextual follow-ups

**4. ML Risk Prediction**
- Framework: Scikit-learn
- Model: Random Forest / Gradient Boosting
- Input: Symptom vectors
- Output: Risk score (0-100)

### API Keys Configuration

```bash
# Frontend (.env)
VITE_GROQ_API_KEY=gsk_...
VITE_GEMINI_API_KEY=AIza...

# Backend (services/api/.env)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# ML Service (services/ml/.env)
GROQ_API_KEY=gsk_...
MODEL_PATH=./models/triage_model.pkl
```

---

## Deployment Guide Reference

### Quick Deploy Commands

**Frontend (Vercel):**
```bash
npm run build
vercel --prod
```

**Backend (Railway):**
```bash
cd services/api
railway up
```

**ML Service (Hugging Face Spaces):**
```bash
cd services/ml
git push hf main
```

**OCR Service (Google Cloud Run):**
```bash
cd services/ocr
gcloud run deploy --source .
```

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## Last Updated
**Date:** 2025-09-22  
**Version:** 2.0.0  
**Status:** Production-ready with Emergency System, Facility Management, and Multi-AI Integration

This brain.md serves as the single source of truth for project architecture, patterns, and key decisions. Always refer to this before making changes.
