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
Three primary user types with distinct workflows:
- **ASHA Workers**: Community health workers doing field triage and patient management
- **Doctors**: Remote consultation, prescription, referral management
- **Patients**: Self-triage, appointment booking, health records
- **Admin**: Staff management, inventory, diagnostics coordination

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
│   │   ├── admin/      # Admin dashboard
│   │   └── shared/     # Shared components
│   ├── components/      # Reusable UI components
│   │   ├── layout/     # Navbar, Sidebar
│   │   └── ui/         # Buttons, Cards, etc.
│   ├── services/        # API clients and utilities
│   │   ├── api.ts      # REST API client
│   │   ├── webrtc.ts   # WebRTC service
│   │   ├── geminiTriage.ts  # AI triage (Groq)
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
│   │       ├── middleware/ # Auth, validation
│   │       ├── services/   # Business logic
│   │       ├── signaling.ts # WebRTC signaling
│   │       └── server.ts    # Main entry point
│   ├── ml/             # Python ML risk prediction
│   └── ocr/            # FastAPI OCR service
└── docs/               # Documentation
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

## Last Updated
**Date:** 2025-09-18  
**Version:** 1.0.0  
**Status:** Production-ready with real-time teleconsult

This brain.md serves as the single source of truth for project architecture, patterns, and key decisions. Always refer to this before making changes.
