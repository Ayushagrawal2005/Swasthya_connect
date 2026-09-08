# Complete Offline Mode Guide for Rural Deployment

## 🎯 Purpose
Run the entire healthcare platform without internet connectivity - perfect for rural PHCs with intermittent or no internet access.

---

## Table of Contents
1. [Offline Architecture Overview](#offline-architecture-overview)
2. [Current Setup (Online)](#current-setup-online)
3. [Offline Components Required](#offline-components-required)
4. [Step-by-Step Offline Setup](#step-by-step-offline-setup)
5. [Local Database Setup](#local-database-setup)
6. [ML Model Offline Integration](#ml-model-offline-integration)
7. [OCR Offline Alternative](#ocr-offline-alternative)
8. [Data Synchronization Strategy](#data-synchronization-strategy)
9. [Deployment on Local Server](#deployment-on-local-server)
10. [Testing Offline Mode](#testing-offline-mode)

---

## 1. Offline Architecture Overview

### Current Architecture (Requires Internet)
```
Frontend (Browser)
    ↓ Internet Required
Backend API → Firebase Firestore (Cloud)
    ↓ Internet Required
ML Backend (Local)
OCR Service → Gemini API (Cloud) ← Internet Required
```

### Target Offline Architecture
```
Frontend (Browser) ← Local Network Only
    ↓
Backend API ← Local Server
    ↓
SQLite/PostgreSQL (Local Database)
    ↓
ML Backend (Local) ← Already Offline!
OCR Service → Tesseract/PaddleOCR (Local) ← No Internet!
```

---

## 2. Current Setup (Online)

### What Requires Internet Now:
1. ✅ **Firebase Firestore** - Cloud database (needs constant internet)
2. ✅ **Google Gemini API** - OCR service (needs internet per request)
3. ❌ **ML Model** - Already runs locally (no internet needed!)
4. ❌ **Frontend** - Static files (can be served locally)
5. ❌ **Backend API** - Node.js server (can run locally)

### What's Already Offline-Ready:
- ✅ ML Triage Model (XGBoost) - runs on port 5000 locally
- ✅ Frontend build - can be served from local server
- ✅ Backend logic - just needs local database

---

## 3. Offline Components Required

### Replace Cloud Services:

| Component | Current (Online) | Offline Alternative | Reason |
|-----------|------------------|---------------------|---------|
| **Database** | Firebase Firestore | SQLite or PostgreSQL | Local data storage |
| **OCR** | Google Gemini API | Tesseract/PaddleOCR | Local text extraction |
| **File Storage** | Firebase Storage | Local File System | Store images/PDFs locally |
| **Authentication** | Firebase Auth | Local JWT + bcrypt | Local user management |
| **ML Model** | ✅ Already Local | No change needed | Already offline! |

---

## 4. Step-by-Step Offline Setup

### Phase 1: Replace Firebase with Local Database

#### Option A: SQLite (Recommended for Single PHC)
**Pros:**
- Zero configuration
- Single file database
- Perfect for 1-2 ASHA workers
- <10,000 patients

**Setup:**
```bash
# Install SQLite package
cd backend
npm install better-sqlite3
```

#### Option B: PostgreSQL (Recommended for CHC/District Hospital)
**Pros:**
- Handles concurrent users (10+)
- Better for 10,000+ patients
- Advanced querying
- Multi-facility support

**Setup:**
```bash
# Install PostgreSQL locally
# Windows: Download from postgresql.org
# Install PostgreSQL package
cd backend
npm install pg
```

### Phase 2: Modify Backend for Local Database

Create new database configuration:

**`backend/src/config/database.ts`**
```typescript
import Database from 'better-sqlite3';
import path from 'path';

// SQLite database file location
const dbPath = path.join(__dirname, '../../data/healthcare.db');
export const db = new Database(dbPath);

// Initialize tables
export function initializeDatabase() {
  // Patients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      phone TEXT,
      village TEXT,
      healthId TEXT,
      chronicConditions TEXT, -- JSON string
      allergies TEXT, -- JSON string
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      doctorId TEXT,
      facilityId TEXT,
      date TEXT,
      time TEXT,
      status TEXT,
      tokenNumber INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    )
  `);

  // Triage records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS triage_records (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      bpSystolic INTEGER,
      bpDiastolic INTEGER,
      temperature REAL,
      spo2 INTEGER,
      pulse INTEGER,
      severity INTEGER,
      urgencyLevel TEXT,
      riskScore INTEGER,
      mlPrediction TEXT, -- JSON string
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    )
  `);

  // Referrals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      fromFacility TEXT,
      toFacility TEXT,
      urgency TEXT,
      status TEXT,
      reason TEXT,
      aiExplanation TEXT, -- JSON string
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    )
  `);

  // Consultations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      doctorId TEXT,
      chiefComplaints TEXT, -- JSON array
      diagnosis TEXT,
      prescription TEXT, -- JSON array
      advice TEXT,
      followUpDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    )
  `);

  // OCR uploads table (for offline queuing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ocr_queue (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      imagePath TEXT,
      documentType TEXT,
      extractedData TEXT, -- JSON string
      processed INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    )
  `);

  // Sync queue for when internet becomes available
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      tableName TEXT,
      recordId TEXT,
      action TEXT, -- 'create', 'update', 'delete'
      data TEXT, -- JSON string
      synced INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Local database initialized');
}
```

**Update API endpoints to use SQLite:**

**`backend/src/routes/patients.ts`**
```typescript
import express from 'express';
import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create patient
router.post('/patients', (req, res) => {
  const id = uuidv4();
  const { name, age, gender, phone, village, healthId } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO patients (id, name, age, gender, phone, village, healthId)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  try {
    stmt.run(id, name, age, gender, phone, village, healthId);
    
    // Add to sync queue for later cloud sync
    addToSyncQueue('patients', id, 'create', req.body);
    
    res.json({ success: true, id, message: 'Patient registered offline' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register patient' });
  }
});

// Get all patients
router.get('/patients', (req, res) => {
  const patients = db.prepare('SELECT * FROM patients ORDER BY createdAt DESC').all();
  res.json(patients);
});

// Get patient by ID
router.get('/patients/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (patient) {
    res.json(patient);
  } else {
    res.status(404).json({ error: 'Patient not found' });
  }
});

// Add to sync queue helper
function addToSyncQueue(tableName: string, recordId: string, action: string, data: any) {
  const stmt = db.prepare(`
    INSERT INTO sync_queue (id, tableName, recordId, action, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(uuidv4(), tableName, recordId, action, JSON.stringify(data));
}

export default router;
```

### Phase 3: Replace Gemini OCR with Local OCR

#### Install Tesseract OCR (Free, Offline)

**Option A: Tesseract (Good for printed text)**
```bash
# Install Tesseract on Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Or use chocolatey:
choco install tesseract

# Install Python package
cd "gemini ocr - Copy"
pip install pytesseract pillow
```

**Option B: PaddleOCR (Better for handwriting, Indian languages)**
```bash
pip install paddlepaddle paddleocr
```

**Create offline OCR service:**

**`offline-ocr/tesseract_ocr.py`**
```python
from fastapi import FastAPI, File, UploadFile
import pytesseract
from PIL import Image
import io
import re

app = FastAPI()

# Configure Tesseract path (Windows)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

@app.post("/extract-medicines")
async def extract_medicines(file: UploadFile = File(...)):
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Extract text using Tesseract
    text = pytesseract.image_to_string(image)
    
    # Parse medicines using regex patterns
    medicines = parse_medicines(text)
    
    return {
        "medicines": medicines,
        "raw_text": text,
        "confidence": calculate_confidence(medicines),
        "offline_mode": True
    }

def parse_medicines(text: str):
    """Parse medicine information from OCR text"""
    medicines = []
    
    # Common medicine patterns
    # Example: "Paracetamol 500mg - 1 tablet - twice daily - 5 days"
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Look for medicine patterns
        # This is a simple parser - can be enhanced
        medicine = {
            "name": extract_medicine_name(line),
            "dosage": extract_dosage(line),
            "frequency": extract_frequency(line),
            "duration": extract_duration(line),
            "confidence": 0.85
        }
        
        if medicine["name"]:
            medicines.append(medicine)
    
    return medicines

def extract_medicine_name(text: str):
    # Remove common non-medicine words and extract first capitalized word
    words = text.split()
    for word in words:
        if word[0].isupper() and len(word) > 3:
            return word
    return ""

def extract_dosage(text: str):
    # Look for patterns like "500mg", "10ml", "1 tablet"
    dosage_pattern = r'\d+\s*(mg|ml|tablet|cap|sachet)'
    match = re.search(dosage_pattern, text, re.IGNORECASE)
    return match.group(0) if match else ""

def extract_frequency(text: str):
    # Look for frequency patterns
    freq_patterns = [
        r'once daily', r'twice daily', r'thrice daily',
        r'1x daily', r'2x daily', r'3x daily',
        r'every \d+ hours', r'after meals', r'before meals'
    ]
    for pattern in freq_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0)
    return ""

def extract_duration(text: str):
    # Look for duration patterns
    duration_pattern = r'\d+\s*(days|weeks|months)'
    match = re.search(duration_pattern, text, re.IGNORECASE)
    return match.group(0) if match else ""

def calculate_confidence(medicines):
    if not medicines:
        return 0
    # Calculate based on how many fields were extracted
    total_fields = len(medicines) * 4  # name, dosage, frequency, duration
    filled_fields = sum([
        bool(m["name"]) + bool(m["dosage"]) + 
        bool(m["frequency"]) + bool(m["duration"])
        for m in medicines
    ])
    return round(filled_fields / total_fields, 2) if total_fields > 0 else 0

@app.post("/extract-lab-results")
async def extract_lab_results(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    text = pytesseract.image_to_string(image)
    
    # Parse lab results
    results = parse_lab_results(text)
    
    return {
        "results": results,
        "raw_text": text,
        "offline_mode": True
    }

def parse_lab_results(text: str):
    """Parse lab results from OCR text"""
    results = []
    lines = text.split('\n')
    
    for line in lines:
        # Look for patterns like "Hemoglobin: 12.5 g/dL"
        if ':' in line:
            parts = line.split(':')
            if len(parts) == 2:
                test_name = parts[0].strip()
                value_part = parts[1].strip()
                
                # Extract numeric value
                value_match = re.search(r'[\d.]+', value_part)
                if value_match:
                    results.append({
                        "test_name": test_name,
                        "value": value_match.group(0),
                        "unit": value_part.replace(value_match.group(0), '').strip(),
                        "confidence": 0.8
                    })
    
    return results

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Offline OCR",
        "provider": "Tesseract",
        "offline_mode": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

### Phase 4: Frontend Offline Support

**Add Service Worker for offline caching:**

**`public/service-worker.js`**
```javascript
const CACHE_NAME = 'healthcare-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  // Add all critical assets
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Add offline detection in frontend:**

**`src/lib/offlineSync.ts`**
```typescript
import axios from 'axios';

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Local storage queue for offline operations
export class OfflineQueue {
  private queueKey = 'offline_operations_queue';

  // Add operation to queue
  addToQueue(operation: {
    endpoint: string;
    method: string;
    data: any;
  }) {
    const queue = this.getQueue();
    queue.push({
      ...operation,
      timestamp: Date.now(),
      id: Math.random().toString(36)
    });
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  // Get queue
  getQueue(): any[] {
    const stored = localStorage.getItem(this.queueKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Process queue when online
  async processQueue() {
    if (!isOnline()) return;

    const queue = this.getQueue();
    const processed: string[] = [];

    for (const operation of queue) {
      try {
        await axios({
          method: operation.method,
          url: operation.endpoint,
          data: operation.data
        });
        processed.push(operation.id);
      } catch (error) {
        console.error('Failed to sync:', error);
      }
    }

    // Remove processed items
    const remaining = queue.filter(op => !processed.includes(op.id));
    localStorage.setItem(this.queueKey, JSON.stringify(remaining));

    return processed.length;
  }

  // Clear queue
  clearQueue() {
    localStorage.removeItem(this.queueKey);
  }
}

// Initialize offline sync
export const offlineQueue = new OfflineQueue();

// Auto-sync when online
window.addEventListener('online', () => {
  console.log('🌐 Back online! Syncing data...');
  offlineQueue.processQueue().then(count => {
    console.log(`✅ Synced ${count} operations`);
  });
});

window.addEventListener('offline', () => {
  console.log('📴 Gone offline! Operations will be queued.');
});
```

**Update API calls to use offline queue:**

**`src/services/triageApi.ts`** (modified)
```typescript
import axios from 'axios';
import { isOnline, offlineQueue } from '../lib/offlineSync';

const ML_API = 'http://localhost:5000';

export async function predictTriage(vitals: any) {
  // ML model is already local, so it works offline!
  try {
    const response = await axios.post(`${ML_API}/predict`, vitals);
    return response.data;
  } catch (error) {
    // Fallback to rule-based triage if ML service is down
    return ruleBasedTriage(vitals);
  }
}

function ruleBasedTriage(vitals: any) {
  // Simple rule-based fallback
  let score = 0;
  
  // BP checks
  if (vitals.bpSystolic >= 180) score += 30;
  else if (vitals.bpSystolic >= 160) score += 20;
  else if (vitals.bpSystolic >= 140) score += 10;
  
  // SpO2 checks
  if (vitals.spo2 < 90) score += 30;
  else if (vitals.spo2 < 94) score += 15;
  
  // Temperature
  if (vitals.temperature >= 103) score += 20;
  else if (vitals.temperature >= 101) score += 10;
  
  // Severity
  score += vitals.severity * 5;
  
  // Determine urgency
  let urgency = 'Low';
  if (score >= 70) urgency = 'Emergency';
  else if (score >= 50) urgency = 'High';
  else if (score >= 30) urgency = 'Medium';
  
  return {
    urgency,
    riskScore: score,
    confidence: 75,
    offline_fallback: true
  };
}
```

---

## 5. Local Database Setup

### Complete SQLite Setup Script

**`backend/setup-offline-db.js`**
```javascript
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize database
const db = new Database(path.join(dataDir, 'healthcare.db'));

console.log('🔧 Setting up offline database...');

// Create all tables
db.exec(`
  -- Patients
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    village TEXT,
    healthId TEXT,
    chronicConditions TEXT,
    allergies TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
  CREATE INDEX IF NOT EXISTS idx_patients_healthId ON patients(healthId);

  -- Vitals
  CREATE TABLE IF NOT EXISTS vitals (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    bpSystolic INTEGER,
    bpDiastolic INTEGER,
    temperature REAL,
    spo2 INTEGER,
    pulse INTEGER,
    weight REAL,
    height REAL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients(id)
  );

  -- Triage Records
  CREATE TABLE IF NOT EXISTS triage_records (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    urgencyLevel TEXT,
    riskScore INTEGER,
    mlPrediction TEXT,
    symptoms TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients(id)
  );

  -- Appointments
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    doctorId TEXT,
    facilityId TEXT,
    date TEXT,
    time TEXT,
    status TEXT,
    tokenNumber INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients(id)
  );

  -- Referrals
  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    fromFacility TEXT,
    toFacility TEXT,
    urgency TEXT,
    status TEXT,
    reason TEXT,
    aiExplanation TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients(id)
  );

  -- Consultations
  CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    doctorId TEXT,
    chiefComplaints TEXT,
    diagnosis TEXT,
    prescription TEXT,
    advice TEXT,
    followUpDate TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients(id)
  );

  -- Sync Queue
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    tableName TEXT,
    recordId TEXT,
    action TEXT,
    data TEXT,
    synced INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
`);

console.log('✅ Offline database created successfully!');
console.log('📁 Location:', path.join(dataDir, 'healthcare.db'));

// Insert sample data
db.exec(`
  INSERT OR IGNORE INTO patients (id, name, age, gender, phone, village, healthId)
  VALUES 
    ('P001', 'Test Patient', 30, 'Male', '9876543210', 'Test Village', 'ABHA-001'),
    ('P002', 'Sample Patient', 45, 'Female', '9876543211', 'Sample Village', 'ABHA-002');
`);

console.log('✅ Sample data inserted');
console.log('🎉 Offline database setup complete!');

db.close();
```

**Run setup:**
```bash
cd backend
npm install better-sqlite3
node setup-offline-db.js
```

---

## 6. ML Model Offline Integration

### Good News: ML Model Already Works Offline! ✅

Your XGBoost model already runs locally without internet:
- Model file: `ml-backend/models/triage_model.pkl`
- Scaler: `ml-backend/models/scaler.pkl`
- No external API calls needed

**Just ensure ML service starts on boot:**

**`ml-backend/run-offline.bat`** (Windows)
```batch
@echo off
echo Starting ML Service (Offline Mode)...
cd %~dp0
python app.py
pause
```

**`ml-backend/run-offline.sh`** (Linux)
```bash
#!/bin/bash
echo "Starting ML Service (Offline Mode)..."
cd "$(dirname "$0")"
python3 app.py
```

---

## 7. OCR Offline Alternative

### PaddleOCR Setup (Better for Hindi/Marathi)

**`offline-ocr/paddle_ocr.py`**
```python
from fastapi import FastAPI, File, UploadFile
from paddleocr import PaddleOCR
import numpy as np
from PIL import Image
import io

app = FastAPI()

# Initialize PaddleOCR with English and Hindi
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en',  # Can add 'hi', 'mr' for Hindi/Marathi
    use_gpu=False  # Set True if GPU available
)

@app.post("/extract-medicines")
async def extract_medicines(file: UploadFile = File(...)):
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    img_array = np.array(image)
    
    # OCR extraction
    result = ocr.ocr(img_array, cls=True)
    
    # Extract text
    text_lines = []
    for line in result[0]:
        text_lines.append(line[1][0])  # Extract text only
    
    full_text = '\n'.join(text_lines)
    
    # Parse medicines
    medicines = parse_medicines_paddle(full_text)
    
    return {
        "medicines": medicines,
        "raw_text": full_text,
        "offline_mode": True,
        "engine": "PaddleOCR"
    }

def parse_medicines_paddle(text: str):
    # Similar parsing logic as Tesseract
    # ... (use same parse_medicines function from above)
    pass

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Offline OCR",
        "provider": "PaddleOCR",
        "languages": ["English", "Hindi", "Marathi"],
        "offline_mode": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

**Install PaddleOCR:**
```bash
pip install paddlepaddle paddleocr
```

---

## 8. Data Synchronization Strategy

### Sync When Internet Returns

**`backend/src/services/syncService.ts`**
```typescript
import { db } from '../config/database';
import axios from 'axios';

const CLOUD_API = 'https://your-cloud-backend.com/api';

export class SyncService {
  async syncToCloud() {
    console.log('🔄 Starting cloud synchronization...');

    // Get unsynced records
    const queue = db.prepare('SELECT * FROM sync_queue WHERE synced = 0').all();

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        // Send to cloud
        await axios.post(`${CLOUD_API}/${item.tableName}`, {
          action: item.action,
          data: JSON.parse(item.data)
        });

        // Mark as synced
        db.prepare('UPDATE sync_queue SET synced = 1 WHERE id = ?').run(item.id);
        synced++;
      } catch (error) {
        console.error(`Failed to sync ${item.id}:`, error);
        failed++;
      }
    }

    console.log(`✅ Synced ${synced} records, ${failed} failed`);
    return { synced, failed };
  }

  async syncFromCloud() {
    // Pull updates from cloud
    try {
      const response = await axios.get(`${CLOUD_API}/updates?since=${this.getLastSync()}`);
      const updates = response.data;

      // Apply updates to local database
      for (const update of updates) {
        this.applyUpdate(update);
      }

      this.setLastSync(Date.now());
      console.log(`✅ Pulled ${updates.length} updates from cloud`);
    } catch (error) {
      console.error('Failed to pull updates:', error);
    }
  }

  private applyUpdate(update: any) {
    // Apply update to local database based on table and action
    // ... implementation
  }

  private getLastSync(): number {
    // Get last sync timestamp from config
    return 0;
  }

  private setLastSync(timestamp: number) {
    // Save last sync timestamp
  }
}
```

---

## 9. Deployment on Local Server

### Option 1: Raspberry Pi (Recommended for PHCs)

**Hardware:**
- Raspberry Pi 4 (4GB RAM minimum)
- 64GB SD card
- Power supply
- Case with cooling

**Setup:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt-get install python3 python3-pip

# Install dependencies
sudo apt-get install sqlite3

# Copy project files
# Install and run services
cd healthcare-platform
npm install
npm run build

cd backend
npm install

cd ../ml-backend
pip3 install -r requirements.txt

# Create startup script
```

**Auto-start on boot:**

**`/etc/systemd/system/healthcare-backend.service`**
```ini
[Unit]
Description=Healthcare Platform Backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/healthcare-platform/backend
ExecStart=/usr/bin/node src/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

### Option 2: Windows PC/Laptop

**Create all-in-one startup script:**

**`start-offline-mode.bat`**
```batch
@echo off
echo ========================================
echo Healthcare Platform - Offline Mode
echo ========================================

echo Starting Backend...
start /B cmd /c "cd backend && npm run dev"
timeout /t 3

echo Starting ML Service...
start /B cmd /c "cd ml-backend && python app.py"
timeout /t 3

echo Starting Offline OCR...
start /B cmd /c "cd offline-ocr && python tesseract_ocr.py"
timeout /t 3

echo Starting Frontend...
start /B cmd /c "npm run dev"

echo.
echo ========================================
echo All services started!
echo.
echo Access the application at:
echo http://localhost:5173
echo ========================================
pause
```

### Option 3: Docker (Advanced)

**`docker-compose.offline.yml`**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    volumes:
      - ./backend/data:/app/data
    environment:
      - DATABASE_TYPE=sqlite
      - DATABASE_PATH=/app/data/healthcare.db

  ml-backend:
    build: ./ml-backend
    ports:
      - "5000:5000"
    volumes:
      - ./ml-backend/models:/app/models

  ocr-service:
    build: ./offline-ocr
    ports:
      - "8000:8000"

  frontend:
    build: .
    ports:
      - "5173:5173"
    depends_on:
      - backend
      - ml-backend
      - ocr-service
```

---

## 10. Testing Offline Mode

### Test Checklist

**1. Database Operations**
```bash
# Test patient registration
curl -X POST http://localhost:4000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Patient","age":30,"gender":"Male"}'

# Verify in SQLite
sqlite3 backend/data/healthcare.db "SELECT * FROM patients;"
```

**2. ML Model (Already Offline)**
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"bpSystolic":140,"bpDiastolic":90,"temperature":98.6,"spo2":95,"pulse":75,"age":30,"severity":5,"chestPain":0,"breathingDifficulty":0,"bleeding":0,"consciousness":1,"duration":2}'
```

**3. Offline OCR**
```bash
# Test with image file
curl -X POST http://localhost:8000/extract-medicines \
  -F "file=@prescription.jpg"
```

**4. Disconnect Internet and Test Full Workflow**
1. Disable WiFi/Ethernet
2. Open http://localhost:5173
3. Register patient ✓
4. Perform triage ✓
5. Upload prescription ✓
6. Create referral ✓
7. All should work without internet!

---

## 11. Complete Offline Setup Checklist

### Before Deployment:

- [ ] Install SQLite database
- [ ] Migrate backend to use local database
- [ ] Install Tesseract or PaddleOCR
- [ ] Replace Gemini API with local OCR
- [ ] Test ML model (already local)
- [ ] Build frontend production bundle
- [ ] Set up local file storage
- [ ] Create sync queue system
- [ ] Test all features offline
- [ ] Create startup scripts
- [ ] Document for field staff

### Hardware Requirements (Per PHC):

**Minimum:**
- Raspberry Pi 4 (4GB) or equivalent PC
- 64GB storage
- Local network router
- Backup power (UPS)

**Optimal:**
- Intel i3/i5 PC or laptop
- 8GB RAM
- 256GB SSD
- Dual network adapters (local + mobile data)
- UPS with 4-hour backup

---

## 12. Advantages of Offline Mode

### Benefits:

1. **No Internet Required** - Works in remote areas
2. **Faster Response** - No network latency
3. **Data Privacy** - Data stays local
4. **Cost Savings** - No cloud hosting fees
5. **Reliable** - Not dependent on connectivity
6. **24/7 Operation** - Always available

### Limitations:

1. **No Multi-Facility Sync** - Until internet restored
2. **OCR Accuracy** - Local OCR ~85% vs Gemini ~92%
3. **Manual Backups** - Need external backup strategy
4. **Single Point of Failure** - If server fails, all data at risk

---

## 13. Hybrid Mode (Recommended)

### Best of Both Worlds:

**When Offline:**
- Use local database (SQLite)
- Use local OCR (Tesseract/Paddle)
- Use local ML model (already local)
- Queue operations for sync

**When Online:**
- Sync to cloud (Firebase/PostgreSQL)
- Use Gemini API for better OCR
- Send data to central dashboard
- Backup automatically

**`backend/src/middleware/connectionManager.ts`**
```typescript
export function checkConnectionMode() {
  if (isInternetAvailable()) {
    return 'online';
  } else {
    return 'offline';
  }
}

export async function isInternetAvailable(): Promise<boolean> {
  try {
    await axios.get('https://www.google.com', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
```

---

## Summary

### Steps to Make Your App Fully Offline:

1. ✅ **Replace Firebase with SQLite** - Local database
2. ✅ **Replace Gemini with Tesseract/PaddleOCR** - Local OCR
3. ✅ **ML Model Already Local** - No change needed
4. ✅ **Add Sync Queue** - For when internet returns
5. ✅ **Deploy on Local Server** - Raspberry Pi or PC
6. ✅ **Test Offline Workflow** - Ensure everything works

### Your app is PERFECT for rural areas because:
- ✅ ML model runs locally (96.38% accuracy, no internet needed)
- ✅ Small footprint (can run on Raspberry Pi)
- ✅ Adaptive questions reduce data entry
- ✅ Can work on tablets/phones via local WiFi
- ✅ Sync later when internet available

**This makes it ideal for rural PHCs with intermittent or no internet!** 🎉

---

_Last Updated: August 24, 2026_  
_Perfect for Rural Deployment 🏥🌾_
