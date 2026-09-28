# SwasthyaConnect API Documentation

## 📡 1. Backend/API Base URLs

### Development
```
Backend API: http://localhost:4000
ML/XGBoost API: http://localhost:5000
OCR Service: http://localhost:8000
```

### Environment Variables
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:4000
VITE_ML_API_URL=http://localhost:5000

# Backend (services/api/.env)
PORT=4000
OCR_SERVICE_URL=http://localhost:8000
```

---

## 🔐 9. Authentication Method

**Type**: JWT (JSON Web Token)

### Authentication Flow:
1. **Login**: POST `/auth/login` with username/password
2. **Receive**: JWT token + user info
3. **Store**: Token in `localStorage.swasthya_token`
4. **Use**: Send token in `Authorization: Bearer <token>` header

### JWT Payload Structure:
```typescript
{
  userId: string
  username: string
  role: 'patient' | 'asha' | 'doctor' | 'admin'
  name: string
  facilityId: string
  patientId?: string  // Only for patient role
  iat: number         // Issued at
  exp: number         // Expires in 24h
}
```

### localStorage Keys:
```javascript
swasthya_token      // JWT token
swasthya_role       // User role
swasthya_userId     // User ID
swasthya_name       // User name
swasthya_facilityId // Facility ID
swasthya_patientId  // Patient ID (if role=patient)
```

---

## 🗂️ 2. API Endpoint List

### Authentication
```
POST   /auth/login           - Login with username/password
GET    /auth/me              - Get current user info (requires auth)
```

### Patients
```
GET    /patients/search      - Search patients by name/phone/healthId
GET    /patients/:id         - Get patient details with visits
POST   /patients/register    - Register new patient
POST   /patients/:id/visits  - Add visit record
```

### Appointments
```
GET    /appointments         - List appointments (filtered by user)
POST   /appointments         - Book new appointment
PATCH  /appointments/:id     - Update appointment status
```

### Triage Sessions
```
POST   /triage               - Create triage session
GET    /triage/:id           - Get triage session
GET    /triage/patient/:id   - Get patient's triage history
```

### Referrals
```
GET    /referrals            - List referrals (filtered)
POST   /referrals            - Create referral
PATCH  /referrals/:id        - Update referral status
POST   /referrals/:id/accept - Accept referral
```

### Follow-ups
```
GET    /followups            - List follow-ups (filtered)
POST   /followups            - Create follow-up
PATCH  /followups/:id        - Update follow-up status
PATCH  /followups/:id/done   - Mark follow-up as done
```

### Facilities & Doctors
```
GET    /facilities           - List all facilities
GET    /facilities/:id       - Get facility details
GET    /doctors              - List all doctors
GET    /doctors/facility/:id - Get doctors by facility
PATCH  /doctors/:id/availability - Update doctor availability
```

### Consultations
```
POST   /consultations        - Create consultation record
GET    /consultations/patient/:id - Get patient consultations
```

### Medical Records
```
POST   /medical-records      - Upload medical record
GET    /medical-records/patient/:id - Get patient records
```

### Inventory
```
GET    /inventory            - List inventory items
POST   /inventory            - Add inventory item
PATCH  /inventory/:id        - Update inventory item
```

### Chronic Care
```
GET    /chronic              - List chronic patients
POST   /chronic              - Add chronic patient
GET    /chronic/:id          - Get chronic patient details
POST   /chronic/:id/reading  - Add health reading
```

### Diagnostics
```
GET    /diagnostics          - List diagnostic orders
POST   /diagnostics          - Create diagnostic order
PATCH  /diagnostics/:id      - Update diagnostic status
```

### Escalations
```
GET    /escalations          - List emergency escalations
POST   /escalations          - Create escalation
PATCH  /escalations/:id/acknowledge - Acknowledge escalation
PATCH  /escalations/:id/arrived     - Mark patient arrived
```

### IVR (Voice System)
```
GET    /ivr/cases            - List IVR cases
POST   /ivr/case             - Create IVR case
```

### OCR (Document Processing)
```
POST   /ocr/extract          - Extract text from document image (multipart/form-data)
```

### Admin
```
GET    /admin/overview       - Get admin dashboard overview
GET    /admin/dashboard      - Get admin dashboard data
```

### Notifications
```
GET    /notifications        - List user notifications
POST   /notifications        - Create notification
PATCH  /notifications/:id/read - Mark as read
```

### Wellness Features
```
POST   /wellness/family-member      - Add family member
GET    /wellness/family-members     - List family members
DELETE /wellness/family-member/:id  - Delete family member

POST   /wellness/menstrual-cycle    - Add menstrual cycle
GET    /wellness/menstrual-cycles   - List cycles
DELETE /wellness/menstrual-cycle/:id - Delete cycle

POST   /wellness/pregnancy          - Create pregnancy tracker
GET    /wellness/pregnancies        - List pregnancy trackers
PATCH  /wellness/pregnancy/:id      - Update pregnancy
POST   /wellness/pregnancy/:id/checkup - Add checkup
```

### Triage Sessions (eSanjeevani-style)
```
GET    /triage-sessions             - List sessions
POST   /triage-sessions             - Create session
GET    /triage-sessions/:id         - Get session
PATCH  /triage-sessions/:id         - Update session
```

### Teleconsult Queue
```
GET    /teleconsult-queue           - Get queue
POST   /teleconsult-queue           - Add to queue
PATCH  /teleconsult-queue/:id       - Update queue item
DELETE /teleconsult-queue/:id       - Remove from queue
```

### Longitudinal Records
```
GET    /longitudinal/patient/:id    - Get patient timeline
GET    /longitudinal/summary/:id    - Get care summary
```

### **NEW: Consent Management**
```
GET    /consents                    - List user's consents
GET    /consents/:id                - Get consent details
POST   /consents                    - Create new consent
PATCH  /consents/:id/revoke         - Revoke consent
POST   /consents/check              - Check if consent exists
GET    /consents/history/:patientId - Get consent history
```

### **NEW: Government Schemes**
```
GET    /schemes                     - List active schemes
GET    /schemes/:id                 - Get scheme details
POST   /schemes/check-eligibility   - Check eligibility
POST   /schemes/explain             - Get AI explanation
POST   /schemes/compare             - Compare schemes
POST   /schemes                     - Create scheme (admin)
PUT    /schemes/:id                 - Update scheme (admin)
```

---

## 📝 3. Request/Response Examples

### Login
**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "username": "patient1",
  "password": "demo123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "username": "patient1",
    "role": "patient",
    "name": "Meena Devi",
    "patientId": "patient123"
  }
}
```

### Search Patients
**Request:**
```http
GET /patients/search?q=meena
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "patient123",
    "healthId": "91-1234-5678-9012",
    "name": "Meena Devi",
    "age": 28,
    "gender": "F",
    "phone": "9876543210",
    "village": "Chandrapur",
    "conditions": ["Pregnancy"],
    "visits": [
      {
        "id": "visit123",
        "date": "2024-01-15",
        "vitals": {
          "bp": "120/80",
          "temp": 98.6,
          "spo2": 98,
          "pulse": 72
        }
      }
    ]
  }
]
```

### Create Appointment
**Request:**
```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient123",
  "facilityId": "facility1",
  "doctorId": "doctor1",
  "date": "2024-01-20",
  "slot": "10:00",
  "purpose": "Routine checkup",
  "bookedBy": "asha1"
}
```

**Response:**
```json
{
  "id": "appt123",
  "patientId": "patient123",
  "facilityId": "facility1",
  "doctorId": "doctor1",
  "date": "2024-01-20",
  "slot": "10:00",
  "purpose": "Routine checkup",
  "status": "scheduled",
  "tokenNumber": 5,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Create Consent
**Request:**
```http
POST /consents
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientId": "asha1",
  "recipientRole": "asha",
  "recipientName": "ASHA Sunita",
  "dataCategory": "Medical Records",
  "purpose": "Treatment consultation",
  "durationDays": 30
}
```

**Response:**
```json
{
  "id": "consent123",
  "patientId": "patient123",
  "grantedBy": "user123",
  "recipientId": "asha1",
  "recipientRole": "asha",
  "recipientName": "ASHA Sunita",
  "dataCategory": "Medical Records",
  "purpose": "Treatment consultation",
  "status": "ACTIVE",
  "grantedAt": "2024-01-15T10:30:00Z",
  "expiresAt": "2024-02-15T10:30:00Z"
}
```

### Check Scheme Eligibility
**Request:**
```http
POST /schemes/check-eligibility
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicantInfo": {
    "age": 28,
    "gender": "F",
    "state": "Madhya Pradesh",
    "isRural": true,
    "annualIncome": 120000,
    "isBPL": true,
    "isPregnant": true
  },
  "patientId": "patient123"
}
```

**Response:**
```json
{
  "results": [
    {
      "scheme": {
        "id": "scheme1",
        "schemeName": "Pradhan Mantri Matru Vandana Yojana",
        "description": "Maternity benefit program",
        "benefits": ["₹5000 cash benefit", "Health support"],
        "officialSource": "https://wcd.nic.in/schemes/pmmvy",
        "applicationUrl": "https://pmmvy.nic.in"
      },
      "status": "LIKELY_ELIGIBLE",
      "matchedCriteria": ["Age", "Gender", "Pregnancy", "Income"],
      "missingCriteria": [],
      "score": 95,
      "reason": "All required criteria matched"
    }
  ],
  "totalEvaluated": 15,
  "likelyEligible": 2,
  "needsVerification": 3
}
```

### OCR Extract
**Request:**
```http
POST /ocr/extract
Authorization: Bearer <token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="prescription.jpg"
Content-Type: image/jpeg

<binary image data>
--boundary--
```

**Response:**
```json
{
  "extractedText": "Patient Name: Meena Devi\nMedicine: Paracetamol 500mg\nDosage: Twice daily",
  "confidence": 0.92,
  "fields": {
    "patientName": "Meena Devi",
    "medicines": ["Paracetamol 500mg"],
    "dosage": "Twice daily"
  }
}



## 🗄️ 4. Firebase Collections/Schema

### **users**
```typescript
{
  id: string
  username: string
  password: string  // Plain text in demo (use bcrypt in production)
  email?: string
  role: 'patient' | 'asha' | 'doctor' | 'admin'
  name: string
  facilityId: string
  patientId?: string  // For patient role
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **patients**
```typescript
{
  id: string
  healthId: string  // ABDM-style: 91-1234-5678-9012
  name: string
  age: number
  gender: 'M' | 'F' | 'O'
  dob: string
  village: string
  phone: string
  language: string
  bloodGroup: string
  allergies: string[]
  conditions: string[]
  diseaseHistory: string[]
  medications: string[]
  noShowCount: number
  totalFollowUps: number
  distanceKmFromPHC: number
  registeredBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **visits**
```typescript
{
  id: string
  patientId: string
  date: string
  vitals: {
    bp?: string
    temp?: number
    spo2?: number
    pulse?: number
    weight?: number
    height?: number
  }
  symptoms: string[]
  diagnosis?: string
  prescription?: string
  notes?: string
  expiresAt: string  // Vitals expire after 10 days
  createdAt: Timestamp
}
```

### **appointments**
```typescript
{
  id: string
  patientId: string
  facilityId: string
  doctorId: string
  date: string
  slot: string
  purpose: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  tokenNumber: number
  bookedBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **triage_sessions**
```typescript
{
  id: string
  patientId: string
  performedBy: string
  symptoms: string[]
  answers: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high'
  riskScore: number
  recommendations: string[]
  urgencyLevel: 'routine' | 'urgent' | 'emergency'
  aiSummary?: string
  createdAt: Timestamp
}
```

### **referrals**
```typescript
{
  id: string
  patientId: string
  fromFacilityId: string
  toFacilityId: string
  reason: string
  urgency: 'routine' | 'urgent' | 'emergency'
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **followups**
```typescript
{
  id: string
  patientId: string
  patientName: string
  condition: string
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  assignedTo: string
  notes?: string
  completedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **facilities**
```typescript
{
  id: string
  name: string
  type: 'PHC' | 'CHC' | 'District Hospital' | 'Sub-centre'
  address: string
  phone: string
  capabilities: string[]
  createdAt: Timestamp
}
```

### **doctors**
```typescript
{
  id: string
  name: string
  specialization: string
  facilityId: string
  phone: string
  available: boolean
  slotsToday: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **consultations**
```typescript
{
  id: string
  patientId: string
  doctorId: string
  type: 'in-person' | 'teleconsult'
  diagnosis: string
  prescription: string
  notes: string
  followUpDate?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **medical_records**
```typescript
{
  id: string
  patientId: string
  type: 'lab_report' | 'prescription' | 'xray' | 'other'
  title: string
  url: string
  uploadedBy: string
  createdAt: Timestamp
}
```

### **inventory**
```typescript
{
  id: string
  facilityId: string
  name: string
  category: string
  current: number
  threshold: number
  unit: string
  critical: boolean
  lastRestocked?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **chronic_patients**
```typescript
{
  id: string
  patientId: string
  condition: string
  severity: string
  alertLevel: 'green' | 'yellow' | 'red'
  readings: Array<{
    date: string
    value: number
    unit: string
  }>
  checkups: Array<{
    date: string
    notes: string
  }>
  alerts: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **diagnostic_orders**
```typescript
{
  id: string
  patientId: string
  facilityId: string
  testType: string
  status: 'pending' | 'sample_collected' | 'completed'
  orderedBy: string
  results?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **escalations**
```typescript
{
  id: string
  patientId: string
  patientName: string
  condition: string
  severity: 'critical' | 'urgent'
  location: string
  reportedBy: string
  status: 'pending' | 'acknowledged' | 'arrived'
  acknowledgedAt?: Timestamp
  arrivedAt?: Timestamp
  createdAt: Timestamp
}
```

### **ivr_cases**
```typescript
{
  id: string
  caseId: string
  callerPhone: string
  symptoms: string[]
  urgency: string
  location: string
  notes: string
  createdAt: Timestamp
}
```

### **family_members**
```typescript
{
  id: string
  guardianPatientId: string
  name: string
  relationship: string
  age: number
  gender: string
  healthId?: string
  createdAt: Timestamp
}
```

### **menstrual_cycles**
```typescript
{
  id: string
  patientId: string
  startDate: string
  endDate?: string
  flowIntensity: string
  symptoms: string[]
  notes?: string
  createdAt: Timestamp
}
```

### **pregnancy_trackers**
```typescript
{
  id: string
  patientId: string
  lmpDate: string
  eddDate: string
  currentWeek: number
  checkups: Array<{
    date: string
    weight: number
    bp: string
    notes: string
  }>
  complications: string[]
  status: 'active' | 'completed'
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **NEW: consents**
```typescript
{
  id: string
  patientId: string
  grantedBy: string
  recipientId: string
  recipientRole: string
  recipientName?: string
  dataCategory: string
  purpose: string
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'PENDING'
  grantedAt: string
  expiresAt?: string
  revokedAt?: string
  revokedBy?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **NEW: schemes**
```typescript
{
  id: string
  schemeName: string
  description: string
  ministry?: string
  state?: string
  officialSource?: string
  applicationUrl?: string
  benefits: string[]
  eligibilityRules: {
    minAge?: number
    maxAge?: number
    incomeLimit?: number
    genderRequirement?: 'M' | 'F' | 'ANY'
    ruralOnly?: boolean
    urbanOnly?: boolean
    disabilityRequired?: boolean
    seniorCitizenRequired?: boolean
    pregnancyRequired?: boolean
    healthConditionRequirement?: string[]
    categoryRequirement?: string[]
    stateRequirement?: string[]
    bplRequired?: boolean
  }
  requiredDocuments: string[]
  lastVerified?: string
  active: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### **NEW: auditLogs**
```typescript
{
  id: string
  eventType: 'CONSENT_GRANTED' | 'CONSENT_REVOKED' | 'PATIENT_DATA_ACCESSED' | 'SCHEME_CHECK_STARTED' | etc.
  actorId: string
  actorRole: string
  actorName?: string
  patientId?: string
  resourceId?: string
  resourceType?: string
  action: string
  purpose?: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Timestamp
  createdAt: Timestamp
}
```

---

## 🔌 6. WebRTC/Signaling Details

### Socket.IO Connection
```javascript
// Client-side connection
import { io } from 'socket.io-client'

const socket = io('http://localhost:4000', {
  transports: ['websocket'],
  auth: {
    token: localStorage.getItem('swasthya_token')
  }
})
```

### Signaling Server Setup
**File**: `services/api/src/signaling.ts`

### Socket.IO Event Names

#### Room Management
```javascript
// Join a teleconsult room
socket.emit('join-room', {
  roomId: 'consultation-123',
  userId: 'user123',
  role: 'patient' | 'doctor'
})

// Leave room
socket.emit('leave-room', {
  roomId: 'consultation-123',
  userId: 'user123'
})
```

#### WebRTC Signaling
```javascript
// Send WebRTC offer
socket.emit('webrtc-offer', {
  roomId: 'consultation-123',
  offer: RTCSessionDescription,
  from: 'user123'
})

// Receive WebRTC offer
socket.on('webrtc-offer', (data) => {
  // data.offer, data.from
})

// Send WebRTC answer
socket.emit('webrtc-answer', {
  roomId: 'consultation-123',
  answer: RTCSessionDescription,
  from: 'user123'
})

// Receive WebRTC answer
socket.on('webrtc-answer', (data) => {
  // data.answer, data.from
})

// Send ICE candidate
socket.emit('ice-candidate', {
  roomId: 'consultation-123',
  candidate: RTCIceCandidate,
  from: 'user123'
})

// Receive ICE candidate
socket.on('ice-candidate', (data) => {
  // data.candidate, data.from
})
```

#### Room Events
```javascript
// User joined room
socket.on('user-joined', (data) => {
  // data.userId, data.role
})

// User left room
socket.on('user-left', (data) => {
  // data.userId
})

// Room ready (both users present)
socket.on('room-ready', (data) => {
  // data.participants
})
```

### WebRTC Configuration
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

const peerConnection = new RTCPeerConnection(rtcConfig)
```

---

## 🤖 7. Groq Integration Endpoint

### **IMPORTANT**: Groq API is called from **BACKEND ONLY**

**Backend Service**: `services/api/src/services/groqService.ts`

### Configuration
```env
# services/api/.env
GROQ_API_KEY=gsk_your_api_key_here
```

### Internal Groq API Usage
```typescript
// Backend service call to Groq
const response = await axios.post(
  'https://api.groq.com/openai/v1/chat/completions',
  {
    model: 'mixtral-8x7b-32768',
    messages: [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'User prompt' }
    ],
    temperature: 0.3,
    max_tokens: 1000
  },
  {
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
)
```

### Frontend API Endpoints Using Groq
```http
# Scheme explanation (uses Groq internally)
POST /schemes/explain
{
  "schemeId": "scheme123",
  "applicantInfo": { ... },
  "language": "en"
}

# Scheme comparison (uses Groq internally)
POST /schemes/compare
{
  "schemeIds": ["scheme1", "scheme2"],
  "applicantInfo": { ... },
  "language": "en"
}
```

**Frontend NEVER calls Groq directly** - all AI features go through backend API.

---

## 🧠 8. XGBoost/ML Endpoint

### ML Backend Base URL
```
http://localhost:5000
```

### ML Endpoints

#### Health Risk Prediction
```http
POST /predict-risk
Content-Type: application/json

{
  "age": 28,
  "gender": "F",
  "symptoms": ["fever", "cough"],
  "vitals": {
    "bp": "120/80",
    "temp": 101.5,
    "spo2": 96
  },
  "chronic_conditions": ["diabetes"]
}
```

**Response:**
```json
{
  "risk_score": 0.65,
  "risk_level": "medium",
  "confidence": 0.82,
  "recommendations": [
    "Monitor temperature",
    "Rest and hydration"
  ]
}
```

#### Disease Classification
```http
POST /classify-disease
Content-Type: application/json

{
  "symptoms": ["fever", "headache", "body_ache"],
  "duration_days": 3,
  "age": 28,
  "gender": "F"
}
```

**Response:**
```json
{
  "predicted_disease": "Dengue",
  "confidence": 0.78,
  "alternatives": [
    { "disease": "Malaria", "probability": 0.15 },
    { "disease": "Flu", "probability": 0.07 }
  ]
}
```

---

## 🔐 10. Environment Variables

### Frontend (`.env`)
```bash
# API URLs
VITE_API_URL=http://localhost:4000
VITE_ML_API_URL=http://localhost:5000

# NO API KEYS IN FRONTEND FOR SECURITY
```

### Backend (`services/api/.env`)
```bash
# Server
PORT=4000
JWT_SECRET=your-jwt-secret-change-in-production

# Firebase
FIREBASE_PROJECT_ID=swasthyaconnect-4bfa1
FIREBASE_DATABASE_URL=https://swasthyaconnect-4bfa1-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=swasthyaconnect-4bfa1.firebasestorage.app

# External Services
OCR_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### ML Backend (`ml-backend/.env`)
```bash
PORT=5000
MODEL_PATH=./models/xgboost_model.pkl
CONFIDENCE_THRESHOLD=0.75
```

---

## 📊 Common Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": "Field 'name' is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"patient1","password":"demo123"}'
```

### Get Patients (with auth)
```bash
curl -X GET "http://localhost:4000/patients/search?q=meena" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Consent
```bash
curl -X POST http://localhost:4000/consents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId":"asha1",
    "recipientRole":"asha",
    "dataCategory":"Medical Records",
    "purpose":"Treatment",
    "durationDays":30
  }'
```

---

## 📚 Additional Resources

- **Frontend Code**: `src/services/*.ts` (API clients)
- **Backend Routes**: `services/api/src/routes/*.ts`
- **Database Services**: `services/api/src/services/db.ts`
- **WebRTC**: `services/api/src/signaling.ts`
- **Authentication**: `services/api/src/middleware/auth.ts`

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**API Version**: v1
