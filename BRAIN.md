# BRAIN.md - Project Memory Layer

> **Purpose:** Persistent memory for AI coding assistants. Contains all architecture decisions, constraints, patterns, and project knowledge.

**Last Updated:** 2026-08-24  
**Project:** SwasthyaConnect Healthcare Platform  
**Repository:** https://github.com/Ayushagrawal2005/Swasthya_connect

---

## 🎯 Project Identity

### What This Is
An AI-powered healthcare coordination platform for rural India that connects ASHA workers, doctors, and patients through intelligent triage, teleconsultation, and real-time coordination.

### Core Mission
Improve healthcare delivery in resource-constrained rural settings through ML-powered triage (96.38% accuracy), explainable AI, and offline-first architecture.

### Target Users
1. **ASHA Workers** - Community health workers in villages
2. **Doctors** - PHC/CHC/District hospital physicians
3. **Patients** - Rural population with limited healthcare access
4. **Administrators** - Health facility managers

---

## 🏗️ System Architecture

### Microservices Structure

```
┌─────────────────────────────────────────────┐
│  Frontend (React + TypeScript) - Port 5173  │
│  - Patient, ASHA, Doctor, Admin portals     │
│  - Real-time WebSocket updates              │
└────────────────┬────────────────────────────┘
                 │ HTTP/WebSocket
                 ↓
┌─────────────────────────────────────────────┐
│  Backend API (Node.js + Express) - Port 4000│
│  - JWT Authentication                        │
│  - Business Logic Layer                      │
│  - WebSocket Server                          │
└──────┬──────────────────────┬────────────────┘
       │                      │
       ↓                      ↓
┌──────────────┐    ┌─────────────────────┐
│  Firebase    │    │  ML Backend         │
│  Firestore   │    │  (Flask + XGBoost)  │
│  (Database)  │    │  Port 5000          │
└──────────────┘    │  - Triage Model     │
                    │  - 96.38% Accuracy  │
                    └──────────┬──────────┘
                               │
                               ↓
                    ┌─────────────────────┐
                    │  OCR Service        │
                    │  (FastAPI + Gemini) │
                    │  Port 8000          │
                    └─────────────────────┘
```

### Service Responsibilities

**Frontend (Port 5173)**
- 4 role-based portals (Patient, ASHA, Doctor, Admin)
- Real-time updates via WebSocket
- Offline-first with service workers
- State management via React Context

**Backend (Port 4000)**
- RESTful API endpoints
- JWT authentication & authorization
- WebSocket server for live updates
- Firebase Firestore integration
- Business logic orchestration

**ML Backend (Port 5000)**
- XGBoost triage predictions
- Feature importance calculation
- Model: `ml-backend/models/triage_model.pkl`
- Scaler: `ml-backend/models/scaler.pkl`
- **Already 100% offline-capable**

**OCR Service (Port 8000)**
- Google Gemini Vision API integration
- Medicine extraction from prescriptions
- Lab report parsing
- Document classification

---

## 🧠 Critical Architecture Decisions

### Decision Log

#### AD-001: XGBoost for Triage (2026-08-20)
**Decision:** Use XGBoost over Neural Networks, Random Forest, SVM  
**Rationale:**
- Best accuracy: 96.38% vs 95.2% (Random Forest) vs 93.1% (Neural Net)
- Fastest inference: <50ms (production requirement)
- Handles missing data naturally (critical for rural settings)
- Interpretable feature importance (medical compliance)
- Industry-proven in production

**Alternatives Considered:**
- Random Forest (95.2% accuracy, slower)
- Neural Network (93.1%, needs more data)
- Logistic Regression (87.4%, too simple)
- SVM (89.2%, very slow training)

**Trade-offs Accepted:**
- Model size (45MB) - acceptable for local deployment
- Slight sklearn version warning - does not affect predictions

#### AD-002: Firebase Firestore for Database (2026-08-15)
**Decision:** Use Firebase Firestore over PostgreSQL/MongoDB  
**Rationale:**
- Real-time listeners for live updates (critical requirement)
- Serverless scaling for pilot deployment
- Offline sync built-in
- Quick development iteration

**Constraints:**
- Requires internet for cloud mode
- Vendor lock-in accepted for MVP
- Future migration path: SQLite for offline (documented)

**Migration Strategy:**
- Offline mode: Use SQLite with sync queue
- Production scale: Migrate to PostgreSQL + Redis

#### AD-003: Explainable AI for Referrals (2026-08-22)
**Decision:** Build custom explainability layer vs using SHAP/LIME  
**Rationale:**
- Medical-specific factors (vitals, guidelines, risk)
- Simpler for non-technical ASHA workers
- Faster computation (<100ms)
- Domain-specific confidence scoring

**Implementation:**
- File: `src/lib/referralExplainer.ts`
- Component: `src/components/ui/ReferralExplanationPanel.tsx`
- 6 factor categories analyzed
- Clinical guidelines referenced (WHO, JNC 8, IHCI)

#### AD-004: Gemini Vision API for OCR (2026-08-18)
**Decision:** Use Gemini over Tesseract/AWS Textract  
**Rationale:**
- Better accuracy for handwritten prescriptions (~92% vs ~85%)
- Free tier sufficient for pilot
- Structured output parsing
- Multi-language support (Hindi, Marathi)

**Offline Alternative:**
- Tesseract OCR for completely offline mode
- PaddleOCR for better Hindi/Marathi support
- Documented in `docs/OFFLINE_MODE_GUIDE.md`

#### AD-005: Monorepo Structure (2026-08-10)
**Decision:** Keep all services in single repo vs separate repos  
**Rationale:**
- Easier coordination during rapid development
- Shared types/interfaces
- Single deploy pipeline
- Smaller team

**Structure:**
```
healthcare-platform/
├── src/              (Frontend)
├── backend/          (API)
├── ml-backend/       (ML Service)
├── gemini ocr - Copy/ (OCR Service)
└── docs/             (Documentation)
```

#### AD-006: TypeScript for Frontend (2026-08-10)
**Decision:** TypeScript over JavaScript  
**Rationale:**
- Type safety for medical data (critical)
- Better IDE support
- Catches errors at compile time
- Team preference

**Constraints:**
- All implicit 'any' types must be fixed
- Strict mode enabled
- No `@ts-ignore` without justification

---

## 📐 Design Patterns & Conventions

### Frontend Patterns

**Component Structure:**
```typescript
// Pattern: Feature-based organization
src/
  pages/
    asha/          // ASHA-specific pages
    doctor/        // Doctor-specific pages
    patient/       // Patient-specific pages
    admin/         // Admin-specific pages
    shared/        // Shared across roles
  components/
    ui/            // Reusable UI components
    layout/        // Layout components (Navbar, Sidebar)
  lib/             // Business logic, utilities
  services/        // API calls, external services
  data/            // Mock data, constants
```

**Naming Conventions:**
- Components: PascalCase (e.g., `PatientDetail.tsx`)
- Files: camelCase for utilities (e.g., `triageEngine.ts`)
- Constants: UPPER_SNAKE_CASE
- API endpoints: kebab-case

**State Management:**
```typescript
// Pattern: Context for auth, local state for components
// NO Redux/Zustand - keep it simple
// Real-time updates via Firebase listeners
```

**API Calls Pattern:**
```typescript
// Pattern: Service layer abstraction
// File: src/services/api.ts
// All axios calls go through centralized service
// Error handling at service layer
// Loading states managed in components
```

### Backend Patterns

**API Structure:**
```
Pattern: RESTful with consistent response format
Success: { success: true, data: {...} }
Error: { success: false, error: "message" }
```

**Authentication Flow:**
```
1. POST /api/auth/login → JWT token
2. Include token in Authorization header
3. Middleware validates JWT
4. Attach user info to req.user
```

**Database Access:**
```typescript
// Pattern: Direct Firestore SDK calls
// No ORM layer (Firebase SDK is the abstraction)
// Collections: patients, appointments, referrals, consultations
```

### ML Service Patterns

**Prediction Endpoint:**
```python
# Pattern: POST with JSON body
# Input: 12 features (vitals + symptoms)
# Output: urgency, confidence, risk_score, feature_importance
# Response time: <50ms (cached model)
```

**Model Loading:**
```python
# Pattern: Load once at startup
# Files: triage_model.pkl, scaler.pkl
# Joblib for serialization
# Scikit-learn version warning is known and safe
```

---

## 🔧 Technical Constraints

### Hard Constraints (Cannot Change)

1. **ML Model Must Stay Local**
   - Requirement: No external ML API calls
   - Reason: Offline operation for rural areas
   - Current: ✅ Model runs on port 5000 locally

2. **< 50ms Triage Prediction**
   - Requirement: Real-time feel for ASHA workers
   - Current: ✅ <50ms achieved with XGBoost

3. **Mobile Responsive (Tablets)**
   - Requirement: ASHA workers use tablets
   - Implementation: TailwindCSS responsive classes
   - Tested: Chrome DevTools tablet mode

4. **Works Without Internet**
   - Requirement: Rural PHCs have intermittent connectivity
   - Current: ML works offline, need to add SQLite + Tesseract
   - Documented: `docs/OFFLINE_MODE_GUIDE.md`

### Soft Constraints (Can Negotiate)

1. **Firebase Dependency**
   - Current: Requires internet for database
   - Alternative: SQLite for offline (documented)
   - Migration effort: ~3 days

2. **OCR Accuracy**
   - Current: 92% with Gemini (online)
   - Offline: 85% with Tesseract (acceptable)
   - Trade-off: Connectivity vs accuracy

3. **Build Time**
   - Current: ~30 seconds (acceptable for development)
   - Could optimize with code splitting if needed

---

## 🎨 UI/UX Patterns

### Color Scheme
```css
/* Primary: Indigo (healthcare/trust) */
--primary: #4F46E5
--primary-dark: #4338CA

/* Status Colors */
--success: #10B981 (green)
--warning: #F59E0B (amber)
--danger: #EF4444 (red)
--info: #3B82F6 (blue)

/* Urgency Indicators */
Low: Green (#10B981)
Medium: Amber (#F59E0B)
High: Orange (#F97316)
Emergency: Red (#EF4444)
```

### Typography
```css
/* Headings: Inter (system font) */
/* Body: Inter
/* Code: Fira Code (monospace) */
```

### Component Library
- **NO external UI library** (Material-UI, Ant Design)
- Custom components with TailwindCSS
- Framer Motion for animations
- Lucide React for icons

### Animation Patterns
```typescript
// Pattern: Subtle, purposeful animations
// Entry: fadeIn + slideUp (200ms)
// Exit: fadeOut + slideDown (150ms)
// Hover: scale(1.02) + shadow
// Loading: Pulse animation
```

---

## 📊 Data Models

### Core Entities

**Patient:**
```typescript
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  village: string;
  healthId: string; // ABHA ID
  chronicConditions: string[];
  allergies: string[];
  createdAt: Date;
}
```

**TriageRecord:**
```typescript
interface TriageRecord {
  id: string;
  patientId: string;
  vitals: {
    bpSystolic: number;
    bpDiastolic: number;
    temperature: number; // Fahrenheit
    spo2: number; // %
    pulse: number; // bpm
  };
  symptoms: {
    chestPain: boolean;
    breathingDifficulty: boolean;
    bleeding: boolean;
    alteredConsciousness: boolean;
    duration: number; // hours
  };
  severity: number; // 1-10 scale
  mlPrediction: {
    urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
    confidence: number; // 0-100
    riskScore: number; // 0-100
    featureImportance: Record<string, number>;
  };
  createdAt: Date;
}
```

**Referral:**
```typescript
interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  fromFacility: string;
  toFacility: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Pending' | 'Accepted' | 'InTransit' | 'Completed';
  reason: string;
  vitals: VitalSigns;
  aiExplanation?: ReferralExplanation; // From explainer
  createdAt: Date;
  acceptedAt?: Date;
}
```

**ReferralExplanation:**
```typescript
interface ReferralExplanation {
  decision: 'required' | 'recommended' | 'optional';
  confidence: number; // 0-100
  primaryReason: string;
  contributingFactors: ReferralFactor[];
  clinicalGuidelines: string[];
  riskIfNotReferred: string;
  facilityRecommendation: {
    suggested: string;
    reason: string;
    capabilities: string[];
  };
}

interface ReferralFactor {
  category: 'clinical' | 'vital' | 'history' | 'risk' | 'resource' | 'policy';
  factor: string;
  value: string | number;
  threshold?: string | number;
  impact: 'high' | 'medium' | 'low';
  explanation: string;
}
```

### Database Schema (Firestore)

**Collections:**
```
patients/
  {patientId}/
    - Basic info
    - visits[] (subcollection)
    - referrals[] (subcollection)

appointments/
  {appointmentId}/
    - patientId, doctorId, facilityId
    - date, time, status, tokenNumber

triage_records/
  {triageId}/
    - patientId, vitals, mlPrediction
    - timestamp

referrals/
  {referralId}/
    - Patient info, facilities
    - AI explanation
    - Status tracking

consultations/
  {consultationId}/
    - patientId, doctorId
    - diagnosis, prescription
    - followUpDate
```

---

## 🔐 Security & Authentication

### Authentication Flow
```
1. User submits username/password
2. Backend validates against Firestore users collection
3. Backend generates JWT with role & userId
4. Frontend stores JWT in localStorage
5. All API calls include JWT in Authorization header
6. Backend middleware validates JWT on each request
```

### Role-Based Access Control (RBAC)
```typescript
enum Role {
  PATIENT = 'patient',
  ASHA = 'asha',
  DOCTOR = 'doctor',
  ADMIN = 'admin'
}

// Permissions matrix
const permissions = {
  patient: ['view_own_records', 'book_appointment'],
  asha: ['register_patient', 'triage', 'create_referral', 'upload_ocr'],
  doctor: ['view_all_patients', 'write_prescription', 'accept_referral'],
  admin: ['manage_users', 'view_analytics', 'manage_inventory']
};
```

### Data Privacy Rules
- **Patient Data:** Only accessible by treating healthcare workers
- **PHI Encryption:** All sensitive fields encrypted at rest (Firebase default)
- **Audit Log:** All data access logged (to implement)
- **HIPAA Compliance:** Architecture supports HIPAA but not certified

### Environment Variables (Never Commit)
```bash
# Frontend (.env)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx

# Backend (.env)
FIREBASE_SERVICE_ACCOUNT=path/to/serviceAccount.json
JWT_SECRET=random_secret_key

# OCR Service (.env)
GEMINI_API_KEY=xxx
```

---

## 🤖 ML Model Details

### Training Pipeline

**Data Sources:**
1. UCI Heart Disease (303 samples)
2. Statlog Heart (270 samples)
3. Pima Indians Diabetes (768 samples)
4. Sylhet Diabetes (520 samples)
5. Rural India Synthetic (25,750 samples)

**Total:** 27,606 samples

**Features (12):**
```python
features = [
    'bp_systolic',      # mmHg
    'bp_diastolic',     # mmHg
    'temperature',      # Fahrenheit
    'spo2',            # %
    'pulse',           # bpm
    'age',             # years
    'severity',        # 1-10 scale
    'chest_pain',      # binary
    'breathing_difficulty', # binary
    'bleeding',        # binary
    'consciousness',   # binary
    'duration'         # hours
]
```

**Model Configuration:**
```python
XGBClassifier(
    n_estimators=200,
    max_depth=15,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,      # L1 regularization
    reg_lambda=1.0,     # L2 regularization
    random_state=42
)
```

**Performance Metrics:**
- Test Accuracy: 96.38%
- Cross-Validation: 96.8%
- ROC-AUC: 0.99
- Inference Time: <50ms
- Model Size: 45MB

**Feature Importance:**
```
SpO2: 18%
Temperature: 16%
BP Systolic: 15%
Severity: 14%
Chest Pain: 12%
Breathing Difficulty: 10%
Pulse: 8%
Age: 5%
Duration: 2%
```

### Prediction API

**Endpoint:** `POST http://localhost:5000/predict`

**Request:**
```json
{
  "bpSystolic": 140,
  "bpDiastolic": 90,
  "temperature": 98.6,
  "spo2": 95,
  "pulse": 75,
  "age": 30,
  "severity": 5,
  "chestPain": 0,
  "breathingDifficulty": 0,
  "bleeding": 0,
  "consciousness": 1,
  "duration": 2
}
```

**Response:**
```json
{
  "urgency": "Medium",
  "confidence": 85.2,
  "risk_score": 55,
  "feature_importance": {
    "SpO2": 0.18,
    "Temperature": 0.16,
    ...
  },
  "probabilities": {
    "Low": 0.15,
    "Medium": 0.55,
    "High": 0.25,
    "Emergency": 0.05
  }
}
```

### Model Retraining Strategy
```
Frequency: Quarterly (when 1000+ new real cases collected)
Process: 
  1. Export new cases from production
  2. Add to training dataset
  3. Retrain with same hyperparameters
  4. Validate on holdout set
  5. A/B test new model vs old
  6. Deploy if accuracy improves by >1%
```

---

## 🎯 Feature Implementation Status

### ✅ Completed Features

**ASHA Portal:**
- [x] Patient Registration (with ABHA ID)
- [x] AI-Powered Triage (96.38% accuracy)
- [x] OCR Document Upload (Gemini API)
- [x] Appointment Booking
- [x] Referral Creation (with auto-generation)
- [x] Follow-up Management
- [x] Teleconsultation (with patient panel)

**Doctor Portal:**
- [x] Patient Dashboard with Search
- [x] Patient Detail View (complete history)
- [x] Consultation Notes Entry
- [x] Digital Prescription Builder
- [x] Referral Inbox (with AI explanations)
- [x] Emergency Escalations
- [x] Follow-up Board
- [x] Video Teleconsultation

**Patient Portal:**
- [x] Health Records View
- [x] Appointment Booking
- [x] Referral Tracking
- [x] Medicine Adherence Tracker
- [x] Teleconsultation Access
- [x] Prescription Downloads

**Admin Portal:**
- [x] Real-Time Dashboard (KPIs)
- [x] Medicine Inventory Management
- [x] Diagnostic Test Coordination
- [x] Staff Management
- [x] Analytics & Charts

**Shared Features:**
- [x] Chronic Care Tracker
- [x] IVR Simulator
- [x] Explainable AI for Referrals

### 🚧 Partial/Planned Features

**High Priority:**
- [ ] Offline Mode (SQLite + Tesseract OCR)
- [ ] Data Sync Queue (offline → online)
- [ ] PDF Export for Prescriptions
- [ ] SMS Notifications (Twilio integration)

**Medium Priority:**
- [ ] Multi-language Support (Hindi, Marathi)
- [ ] Voice Input for Triage
- [ ] Ambulance Coordination
- [ ] Lab Integration APIs

**Low Priority:**
- [ ] Mobile Apps (React Native)
- [ ] WhatsApp Integration
- [ ] Telemedicine Platform Integration
- [ ] ABDM (Ayushman Bharat) Full Integration

---

## 🐛 Known Issues & Workarounds

### Issue 1: Sklearn Version Warning
**Error:** 
```
InconsistentVersionWarning: Trying to unpickle estimator StandardScaler 
from version 1.9.0 when using version 1.7.2
```

**Impact:** Cosmetic warning only, no functional impact  
**Workaround:** Ignore the warning (predictions are correct)  
**Proper Fix:** Retrain model with sklearn 1.7.2  
**Priority:** Low (no user impact)

### Issue 2: Firebase Realtime Updates Delay
**Symptom:** Sometimes updates take 2-3 seconds to appear  
**Cause:** Firebase Firestore listener throttling  
**Workaround:** Add manual refresh button  
**Proper Fix:** Implement optimistic UI updates  
**Priority:** Medium

### Issue 3: OCR Accuracy for Handwriting
**Symptom:** Handwritten prescriptions have ~85% accuracy  
**Cause:** Gemini API limitation for poor handwriting  
**Workaround:** Manual review step after extraction  
**Proper Fix:** Train custom OCR model  
**Priority:** Low (manual review is standard practice)

### Issue 4: Large Model File Size
**Symptom:** triage_model.pkl is 45MB  
**Impact:** Slow git clone for new developers  
**Workaround:** Use Git LFS or download separately  
**Proper Fix:** Model quantization or distillation  
**Priority:** Low

### Issue 5: TypeScript Build Cache
**Symptom:** tsconfig.tsbuildinfo grows large and causes slow builds  
**Workaround:** Delete file periodically, it regenerates  
**Proper Fix:** Add to .gitignore (done)  
**Priority:** Resolved

---

## 📁 Critical File Locations

### Configuration Files
```
.env                    - Frontend environment variables (gitignored)
.env.example            - Template for .env
backend/.env            - Backend environment variables (gitignored)
gemini ocr - Copy/.env  - OCR service API key (gitignored)
```

### Core Business Logic
```
src/lib/triageEngine.ts         - Triage question flow logic
src/lib/adaptiveQuestions.ts    - Adaptive questioning system
src/lib/riskScoring.ts          - Risk calculation rules
src/lib/referralExplainer.ts    - Explainable AI logic (370 lines)
src/services/triageApi.ts       - ML API integration
src/services/api.ts             - Centralized API service
```

### ML Model Files
```
ml-backend/models/triage_model.pkl  - XGBoost model (45MB)
ml-backend/models/scaler.pkl        - StandardScaler
ml-backend/models/model_metadata.json - Model info
ml-backend/app.py                   - Flask API server
ml-backend/train_model.py           - Training script
```

### Key Components
```
src/pages/asha/AshaTriage.tsx           - Main triage interface
src/pages/doctor/DoctorTeleconsult.tsx  - Video consultation
src/components/ui/ReferralExplanationPanel.tsx - XAI modal (350 lines)
src/components/layout/Navbar.tsx        - Top navigation
src/components/layout/Sidebar.tsx       - Side navigation
```

### Documentation
```
README.md                              - Main GitHub README
docs/PROJECT_COMPREHENSIVE_REPORT.md   - Complete project overview
docs/ML_MODEL_DEEP_DIVE.md            - ML technical details
docs/ML_ACCURACY_FAQ.md               - ML questions
docs/EXPLAINABLE_AI_REFERRALS.md      - XAI documentation
docs/OFFLINE_MODE_GUIDE.md            - Offline deployment
docs/VIDEO_CONSULTATION_GUIDE.md      - Teleconsult guide
BRAIN.md                              - This file (project memory)
```

---

## 🚀 Deployment Configurations

### Development Mode
```bash
# All services on localhost
Frontend: http://localhost:5173
Backend: http://localhost:4000
ML: http://localhost:5000
OCR: http://localhost:8000

# Start all:
Terminal 1: npm run dev
Terminal 2: cd backend && npm run dev
Terminal 3: cd ml-backend && python app.py
Terminal 4: cd "gemini ocr - Copy" && uvicorn main:app --reload --port 8000
```

### Production Considerations
```
Frontend: Deploy to Vercel/Netlify
Backend: Deploy to AWS EC2/Railway/Render
ML Backend: Keep on local PHC server (offline requirement)
OCR: Can use cloud or local Tesseract
Database: Firebase (or PostgreSQL + Redis)
```

### Offline Deployment (Rural PHC)
```
Hardware: Raspberry Pi 4 (4GB) or Intel i3 PC
Database: SQLite (replace Firebase)
OCR: Tesseract or PaddleOCR (replace Gemini)
ML: Already local (no changes needed)
Network: Local WiFi for tablets
Cost: ~₹7,500 per PHC
```

---

## 🔄 Data Flow Diagrams

### Triage Flow
```
1. ASHA enters vitals → Frontend validation
2. Frontend calls ML API → POST /predict
3. ML model predicts urgency → <50ms response
4. Frontend displays result + recommendations
5. If High/Emergency → Auto-create referral
6. Save triage record to Firestore
7. Notification sent to doctor (WebSocket)
```

### Referral Flow with Explainable AI
```
1. Referral created (manual or auto-triage)
2. Frontend calls referralExplainer.ts
3. Analyze patient data + vitals + history
4. Calculate confidence score (75% base + factors)
5. Match to clinical guidelines (WHO, JNC 8)
6. Generate multi-factor explanation
7. Display in ReferralExplanationPanel modal
8. Doctor views explanation → accepts/rejects
9. Update referral status in Firestore
```

### OCR Flow
```
1. ASHA uploads prescription photo
2. Frontend sends image to OCR API
3. OCR calls Gemini Vision API
4. Gemini extracts text + structure
5. OCR parses medicines (regex patterns)
6. Return structured JSON with confidence
7. Frontend displays for manual review
8. ASHA confirms/edits → Save to patient record
```

---

## 🎓 Learning Resources for New Contributors

### Required Knowledge
- **Frontend:** React 18, TypeScript, TailwindCSS
- **Backend:** Node.js, Express, Firebase
- **ML:** Python, scikit-learn, XGBoost basics
- **Medical:** Basic understanding of triage, vital signs

### Recommended Reading
1. **React Docs:** https://react.dev
2. **TypeScript Handbook:** https://www.typescriptlang.org/docs/
3. **XGBoost Paper:** https://arxiv.org/abs/1603.02754
4. **Firebase Firestore:** https://firebase.google.com/docs/firestore
5. **Medical Triage:** WHO Emergency Triage Assessment (ETAT)

### Code Reading Order (for new developers)
```
1. README.md - Understand project goals
2. BRAIN.md (this file) - Architecture & decisions
3. src/App.tsx - Routing structure
4. src/pages/asha/AshaTriage.tsx - Core triage logic
5. ml-backend/app.py - ML API endpoint
6. src/lib/referralExplainer.ts - Explainable AI
7. backend/src/server.ts - Backend entry point
```

---

## ⚠️ Critical "DO NOT" List

### Code Quality
- ❌ **DO NOT** use `any` type without explicit justification
- ❌ **DO NOT** commit `.env` files with secrets
- ❌ **DO NOT** hardcode API URLs (use environment variables)
- ❌ **DO NOT** bypass TypeScript errors with `@ts-ignore`
- ❌ **DO NOT** commit `node_modules` or `dist` folders

### Architecture
- ❌ **DO NOT** add state management library (Redux/Zustand) without discussion
- ❌ **DO NOT** change ML model without retraining and A/B testing
- ❌ **DO NOT** add external UI library (keep custom components)
- ❌ **DO NOT** make ML API calls from frontend (always through backend)
- ❌ **DO NOT** store patient data in localStorage (security risk)

### ML Model
- ❌ **DO NOT** modify model hyperparameters without validation
- ❌ **DO NOT** change feature order (breaks model)
- ❌ **DO NOT** retrain on imbalanced data without class weighting
- ❌ **DO NOT** deploy model without testing on holdout set

### Medical/Clinical
- ❌ **DO NOT** change urgency thresholds without medical review
- ❌ **DO NOT** remove auto-escalation rules for emergencies
- ❌ **DO NOT** modify clinical guidelines without verification
- ❌ **DO NOT** skip audit logging for patient data access

---

## 🔮 Future Architecture Plans

### Phase 1: Offline Capabilities (3 months)
```
Replace: Firebase → SQLite
Replace: Gemini OCR → Tesseract/PaddleOCR
Add: Sync queue for offline operations
Test: Raspberry Pi deployment
```

### Phase 2: Scale & Performance (6 months)
```
Add: Redis for caching
Add: Load balancer for backend
Optimize: Database queries
Add: CDN for static assets
Test: 1000+ concurrent users
```

### Phase 3: Advanced Features (12 months)
```
Add: Real-time video (WebRTC)
Add: Voice input for triage
Add: Federated learning across PHCs
Add: Regional ML models (state-specific)
Integrate: ABDM Health Stack
```

### Phase 4: National Scale (18+ months)
```
Deploy: Multi-region architecture
Add: Disaster recovery
Integrate: National health databases
Add: Research data export
Certify: HIPAA compliance
```

---

## 📞 Emergency Contacts & Resources

### Technical Support
- **ML Model Issues:** Check `ml-backend/README.md`
- **OCR Issues:** Check `gemini ocr - Copy/README.md`
- **Build Errors:** Delete `node_modules`, run `npm install`
- **Firebase Issues:** Check `.env` configuration

### Medical/Clinical Questions
- **Triage Protocols:** Refer to WHO ETAT guidelines
- **Clinical Thresholds:** JNC 8 Hypertension Guidelines
- **Emergency Criteria:** APACHE II scoring system

### Community
- **GitHub Issues:** https://github.com/Ayushagrawal2005/Swasthya_connect/issues
- **Discussions:** https://github.com/Ayushagrawal2005/Swasthya_connect/discussions

---

## 📝 Version History

### v1.0.0 (2026-08-24) - Initial Release
- ✅ Complete 4-portal system (Patient, ASHA, Doctor, Admin)
- ✅ XGBoost ML triage (96.38% accuracy)
- ✅ Explainable AI for referrals
- ✅ Video teleconsultation
- ✅ OCR with Gemini Vision API
- ✅ 14 major features implemented
- ✅ Comprehensive documentation

### v0.9.0 (2026-08-20) - Beta
- ML model training completed
- Core features implemented
- Internal testing

### v0.5.0 (2026-08-15) - Alpha
- Basic frontend + backend
- Firebase integration
- Initial triage logic

---

## 🎯 Success Metrics

### Technical KPIs
- ML Prediction Time: <50ms ✅
- API Response Time: <200ms ✅
- Frontend Load Time: <3s ✅
- Uptime: 99.5%+ target
- Build Success Rate: 100% ✅

### Clinical KPIs
- Triage Accuracy: 96.38% ✅
- Emergency Detection: 98% recall ✅
- False Positive Rate: 8%
- User Satisfaction: 4.5/5 target

### Business KPIs
- PHCs Deployed: 0 (pilot pending)
- Patients Registered: 0 (pilot pending)
- Daily Triage Sessions: Target 150-200
- Cost per PHC: ₹7,500 (offline mode)

---

## 🧩 Integration Points

### Current Integrations
1. **Firebase Firestore** - Database & Auth
2. **Google Gemini API** - OCR service
3. **Local ML Model** - XGBoost triage

### Planned Integrations
1. **ABDM (Ayushman Bharat)** - Health ID integration
2. **Twilio** - SMS notifications
3. **e-Sanjeevani** - National telemedicine platform
4. **Lab Information Systems** - Test result import
5. **Pharmacy Systems** - Medicine availability

### Integration Patterns
```
Pattern: API Gateway approach
All external integrations go through backend API
Frontend never calls external services directly
Secrets stored in backend environment only
```

---

## 🎓 Onboarding Checklist for New AI Assistants

When starting work on this project:

- [ ] Read BRAIN.md (this file) completely
- [ ] Understand the 4-portal architecture
- [ ] Know that ML model is local and cannot be changed without retraining
- [ ] Understand XGBoost was chosen for specific reasons (see AD-001)
- [ ] Know the feature importance order (SpO2 18%, Temp 16%, BP 15%)
- [ ] Understand explainable AI is custom-built, not SHAP/LIME
- [ ] Know critical files: triageEngine.ts, referralExplainer.ts, app.py
- [ ] Understand offline-first requirement for rural deployment
- [ ] Know all environment variables needed (.env files)
- [ ] Understand the data flow: Frontend → Backend → ML/Firebase
- [ ] Review the "DO NOT" list carefully
- [ ] Check docs/ folder for detailed guides

---

## 💡 Quick Tips for AI Assistants

### When Modifying ML Code:
- Always check sklearn version compatibility
- Never change feature order (breaks model)
- Test predictions match expected format
- Verify <50ms inference time maintained

### When Modifying Frontend:
- Keep components under 300 lines
- Use TypeScript strictly (no 'any' types)
- Test mobile responsiveness
- Maintain consistent color scheme

### When Modifying Backend:
- Maintain RESTful conventions
- Keep response format consistent
- Never expose patient data without auth
- Log all database operations

### When Adding Features:
- Check if it works offline (rural requirement)
- Update BRAIN.md with decision rationale
- Add to feature status list
- Document in appropriate docs/ file

---

## 🏁 Final Notes

This project has the potential to save lives in rural India by:
- Providing instant, accurate triage (96.38%)
- Connecting patients with specialists via teleconsult
- Explaining medical decisions transparently
- Working without internet connectivity

**Every code change should keep this mission in mind.**

---

_Last Updated: 2026-08-24_  
_Maintained by: Project Team_  
_For updates: Edit this file and commit with changes_

**This BRAIN.md file is the single source of truth for project architecture, decisions, and context.**
