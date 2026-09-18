# SwasthyaConnect - Rural Healthcare Platform

A comprehensive digital health platform designed for India's rural healthcare ecosystem, connecting ASHAs, patients, doctors, and healthcare facilities.

## 🎯 Features

### For Patients
- **AI-Powered Triage** - Groq AI symptom checker with multilingual support (English, Hindi, Marathi)
- **Teleconsultation** - Direct video consultation with doctors via WebRTC
- **Appointment Booking** - Schedule visits to PHC/CHC facilities
- **Health Records** - Longitudinal patient records with vitals tracking
- **Wellness Tracker** - Track nutrition, sleep, exercise, and stress
- **Medicine Tracker** - Medication reminders and adherence tracking
- **Referral System** - Seamless referrals to higher facilities

### For ASHA Workers
- **Patient Registration** - Quick onboarding with Aadhaar/mobile
- **OCR Document Scanning** - AI-powered prescription/lab report extraction via Groq Vision
- **Triage & Assessment** - Structured patient triage with AI assistance
- **Home Visit Tracking** - Maternal, child health, chronic disease monitoring
- **Follow-up Management** - Automated follow-up scheduling
- **Teleconsult Facilitation** - Help patients connect with doctors

### For Doctors
- **Queue Management** - Smart patient queue based on triage severity
- **Patient Summary** - AI-generated clinical summaries
- **Video Consultation** - WebRTC-based teleconsultation
- **Prescription & Orders** - Digital prescriptions, lab orders, referrals
- **Follow-up Board** - Track patient follow-ups
- **Emergency Escalation** - Quick escalation for critical cases

### For Administrators
- **Staff Management** - Manage doctors, ASHAs, pharmacists
- **Facility Dashboard** - Real-time overview of facility operations
- **Inventory Management** - Medicine stock tracking
- **Analytics** - Health trends, utilization metrics

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **State**: React Context + Custom Hooks
- **Routing**: React Router v6
- **Real-time**: WebSocket for live updates
- **Video**: WebRTC (PeerJS) for teleconsultation

### Backend
- **Runtime**: Node.js + Express + TypeScript
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth + JWT
- **Real-time**: WebSocket (ws library)
- **AI**: Groq API for question generation, summarization
- **OCR**: Groq Vision API for document extraction

### ML Services
- **Triage Model**: XGBoost (96.4% accuracy)
- **OCR Service**: Groq Vision API (FastAPI)
- **Framework**: Python + Flask + FastAPI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Firebase project with Firestore enabled

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/swasthyaconnect.git
cd swasthyaconnect

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install ML backend dependencies
cd ../ml-backend
pip install -r requirements.txt

# Install OCR service dependencies
cd "../gemini ocr - Copy"
pip install -r requirements.txt
```

### 2. Configure Environment

#### Frontend (`.env`)
```bash
VITE_API_URL=http://localhost:4000
VITE_ML_API_URL=http://localhost:5000
VITE_GROQ_API_KEY=your_groq_api_key
```

#### Backend (`backend/.env`)
```bash
PORT=4000
JWT_SECRET=your_jwt_secret

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_DATABASE_URL=your_database_url
FIREBASE_STORAGE_BUCKET=your_storage_bucket

# Groq AI
GROQ_API_KEY=your_groq_api_key

# OCR Service
OCR_SERVICE_URL=http://localhost:8000
```

#### OCR Service (`gemini ocr - Copy/.env`)
```bash
GROQ_API_KEY=your_groq_api_key
OCR_MOCK_MODE=false
```

> ⚠️ **Never commit `.env` files or Firebase credentials to version control!**

### 3. Firebase Setup

1. Create Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Download service account key → save as `backend/serviceAccountKey.json`
5. Update `.env` files with your Firebase config

### 4. Get Groq API Key

1. Visit https://console.groq.com
2. Sign up for free account
3. Generate API key
4. Add to `.env` files

### 5. Start Development Servers

```bash
# Terminal 1: Frontend
npm run dev
# → http://localhost:5173

# Terminal 2: Backend
cd backend
npm run dev
# → http://localhost:4000

# Terminal 3: ML Backend
cd ml-backend
python app.py
# → http://localhost:5000

# Terminal 4: OCR Service
cd "gemini ocr - Copy"
uvicorn main:app --reload --port 8000
# → http://localhost:8000
```

### 6. Access the Platform

Open http://localhost:5173 and use demo credentials:

**Patients:**
- Meena Devi: Female, Age 28 (pregnant)
- Ravi Kumar: Male, Age 52 (hypertension, diabetes)
- Priya Sharma: Female, Age 34 (general health)

**ASHA Workers:**
- Kavita Shinde

**Doctors:**
- Dr. Anjali Deshmukh

> Password: `password123` (or as configured during seed)

## 📁 Project Structure

```
swasthyaconnect/
├── src/                      # Frontend source
│   ├── components/           # React components
│   ├── pages/                # Page components
│   ├── services/             # API clients
│   ├── lib/                  # Utilities
│   ├── data/                 # Static data
│   └── types/                # TypeScript types
├── backend/                  # Node.js backend
│   └── src/
│       ├── routes/           # API routes
│       ├── services/         # Business logic
│       ├── middleware/       # Auth, validation
│       └── store/            # Data access
├── ml-backend/               # Python ML service
│   ├── app.py                # Flask server
│   └── models/               # Trained models
└── gemini ocr - Copy/        # OCR service
    ├── main.py               # FastAPI server
    ├── groq_ocr.py           # Groq Vision integration
    └── extraction.py         # Fallback extraction
```

## 🌐 API Documentation

### Authentication
```http
POST /auth/login
POST /auth/register
POST /auth/verify-token
```

### Patient Management
```http
GET /patients
GET /patients/:id
POST /patients
PUT /patients/:id
```

### Triage & Teleconsult
```http
POST /triage-sessions
POST /triage-sessions/:id/questions
POST /triage-sessions/:id/keywords
POST /triage-sessions/:id/summary
POST /triage-sessions/submit

GET /teleconsult-queue
POST /teleconsult-queue/join
PUT /teleconsult-queue/:id/ready
```

### OCR
```http
POST /ocr/extract
```

## 🤖 AI Features

### Groq Integration
- **Model**: `openai/gpt-oss-120b` for text generation
- **Vision Model**: `llama-3.2-90b-vision-preview` for OCR
- **Use Cases**:
  - Dynamic medical question generation
  - Symptom keyword suggestions
  - Clinical summary generation
  - Document extraction from images

### XGBoost Triage Model
- **Accuracy**: 96.4%
- **Features**: 26 symptom indicators
- **Output**: Risk level (low/medium/high/emergency) + condition probabilities

## 🌍 Multilingual Support

All triage questions and AI-generated content support:
- 🇬🇧 English
- 🇮🇳 Hindi (हिंदी)
- 🇮🇳 Marathi (मराठी)

Language selection available in:
- Patient symptom checker
- ASHA triage workflow
- Direct teleconsultation assessment

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind |
| Backend | Node.js, Express, TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| AI/ML | Groq API, XGBoost |
| Video | WebRTC (PeerJS) |
| OCR | Groq Vision API |
| Real-time | WebSocket |

## 📊 Production Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render)
```bash
cd backend
npm run build
# Deploy with Node.js runtime
```

### Environment Variables
Ensure all production environment variables are set in your hosting platform.

## 🔐 Security

- ✅ JWT-based authentication
- ✅ Firebase Auth integration
- ✅ Environment variable isolation
- ✅ Input validation on all endpoints
- ✅ CORS configuration
- ⚠️ Never commit `.env` or `serviceAccountKey.json`
- ⚠️ Use HTTPS in production
- ⚠️ Implement rate limiting for APIs

## 🧪 Testing

```bash
# Frontend
npm run lint

# Backend
cd backend
npm run build  # TypeScript compilation test

# ML Model
cd ml-backend
python -m pytest tests/  # (if tests exist)
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📧 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ for rural India's healthcare workers and patients**
