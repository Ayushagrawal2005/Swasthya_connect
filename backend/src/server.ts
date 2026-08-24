import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() })

// Middleware
app.use(cors())
app.use(express.json())

// Simple JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'healthcare-secret-key'

// In-memory store
const store = {
  users: [
    { id: '1', username: 'asha1', password: 'password', role: 'asha', name: 'ASHA Kavita' },
    { id: '2', username: 'doctor1', password: 'password', role: 'doctor', name: 'Dr. Patil' },
    { id: '3', username: 'admin1', password: 'password', role: 'admin', name: 'Admin User' },
    { id: '4', username: 'patient1', password: 'password', role: 'patient', name: 'Meena Jadhav' }
  ],
  patients: [
    { 
      id: 'P001', 
      name: 'Meena Jadhav', 
      age: 24, 
      gender: 'Female',
      phone: '9876543210',
      village: 'Mandav',
      healthId: '91-7842-3301-6629',
      visits: []
    }
  ],
  facilities: [
    { id: 'F001', name: 'PHC Beed', type: 'phc' },
    { id: 'F002', name: 'District Hospital Beed', type: 'district' }
  ],
  // Medical records storage
  medicalRecords: [] as any[],
  prescriptions: [] as any[],
  consultations: [] as any[]
}

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.sendStatus(401)
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// Routes
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body
  const user = store.users.find(u => u.username === username && u.password === password)
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({ 
    token, 
    user: { id: user.id, username: user.username, role: user.role, name: user.name } 
  })
})

app.get('/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user })
})

// Patient routes
app.get('/patients/search', authenticateToken, (req, res) => {
  const { q } = req.query
  let results = store.patients
  if (q) {
    results = results.filter(p => 
      p.name.toLowerCase().includes(String(q).toLowerCase()) ||
      p.healthId.includes(String(q))
    )
  }
  res.json({ patients: results })
})

app.get('/patients/:id', authenticateToken, (req, res) => {
  const patient = store.patients.find(p => p.id === req.params.id)
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' })
  }
  res.json(patient)
})

app.post('/patients', authenticateToken, (req, res) => {
  const { name, age, gender, phone, village } = req.body
  const newPatient = {
    id: `P${String(store.patients.length + 1).padStart(3, '0')}`,
    name,
    age: parseInt(age),
    gender,
    phone,
    village,
    healthId: `91-${Math.random().toString().substr(2, 4)}-${Math.random().toString().substr(2, 4)}-${Math.random().toString().substr(2, 4)}`,
    visits: []
  }
  store.patients.push(newPatient)
  res.json({ success: true, patient: newPatient })
})

// Triage routes  
app.post('/triage/assess', authenticateToken, (req, res) => {
  const { symptoms, vitals, patientId } = req.body
  
  // Simple scoring logic
  let score = 20 // Base score
  
  if (symptoms.fever) score += 15
  if (symptoms.chestPain) score += 25
  if (symptoms.breathingDifficulty) score += 30
  if (vitals.systolic > 140) score += 20
  if (vitals.temperature > 100) score += 10
  
  let level = 'low'
  let hospitalLevel = 'PHC'
  
  if (score >= 75) {
    level = 'emergency'
    hospitalLevel = 'District Hospital'
  } else if (score >= 50) {
    level = 'high' 
    hospitalLevel = 'Rural Hospital'
  } else if (score >= 30) {
    level = 'medium'
    hospitalLevel = 'PHC'
  }

  res.json({
    score,
    risk_level: level,
    hospital_level: hospitalLevel,
    recommendation: score >= 75 ? 'Immediate referral' : 'Monitor condition'
  })
})

// Appointments routes
app.get('/appointments/facilities', authenticateToken, (req, res) => {
  res.json({ facilities: store.facilities })
})

app.get('/appointments/slots', authenticateToken, (req, res) => {
  const slots = [
    { time: '09:00', available: true },
    { time: '10:00', available: false },
    { time: '11:00', available: true },
    { time: '14:00', available: true }
  ]
  res.json({ slots })
})

app.post('/appointments/book', authenticateToken, (req, res) => {
  res.json({ success: true, appointmentId: 'APT001' })
})

// Admin routes
app.get('/admin/overview', authenticateToken, (req, res) => {
  res.json({
    totalPatients: store.patients.length,
    todayVisits: 45,
    pendingReferrals: 8,
    criticalAlerts: 2
  })
})

// OCR and Medical Records routes
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000'

app.post('/api/ocr/extract', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Forward to OCR microservice
    const formData = new FormData()
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    const ocrResponse = await axios.post(`${OCR_SERVICE_URL}/ocr/extract`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    })

    res.json(ocrResponse.data)
  } catch (error: any) {
    console.error('OCR extraction failed:', error.message)
    
    // Fallback mock response if OCR service is unavailable
    res.json({
      raw_text: "Dr. R. Sharma, MBBS MD\nCity Clinic, Mankapur\n\nPatient: Mock Data\nDate: 18-08-2026\n\nRx\n1. Amlodipine 5mg - 1 tablet OD",
      document_type: "prescription",
      summary: "Prescription for hypertension management with Amlodipine 5mg once daily. Follow-up recommended in 2 weeks.",
      medicines: [
        { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", confidence: 0.9 }
      ],
      test_values: [],
      dates_found: ["18-08-2026"],
      needs_review: true,
      fallback: true
    })
  }
})

app.post('/api/patients/:id/records', authenticateToken, (req: any, res) => {
  const { id } = req.params
  const { 
    documentType, 
    rawText, 
    summary, 
    medicines, 
    testValues, 
    datesFound,
    imageUrl 
  } = req.body

  const patient = store.patients.find(p => p.id === id)
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' })
  }

  const record = {
    id: `REC${String(store.medicalRecords.length + 1).padStart(4, '0')}`,
    patientId: id,
    documentType,
    rawText,
    summary,
    medicines: medicines || [],
    testValues: testValues || [],
    datesFound: datesFound || [],
    imageUrl: imageUrl || null,
    uploadedBy: req.user.name,
    uploadedAt: new Date().toISOString(),
    verified: false
  }

  store.medicalRecords.push(record)
  res.json({ success: true, record })
})

app.get('/api/patients/:id/records', authenticateToken, (req, res) => {
  const { id } = req.params
  const records = store.medicalRecords.filter(r => r.patientId === id)
  res.json({ records })
})

app.get('/api/patients/:id/summary', authenticateToken, (req, res) => {
  const { id } = req.params
  
  const patient = store.patients.find(p => p.id === id)
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' })
  }

  const records = store.medicalRecords.filter(r => r.patientId === id)
  const prescriptions = store.prescriptions.filter(p => p.patientId === id)
  const consultations = store.consultations.filter(c => c.patientId === id)

  // Generate unified summary
  const allMedicines = [
    ...records.flatMap(r => r.medicines || []),
    ...prescriptions.flatMap(p => p.medicines || [])
  ]

  const allTests = records.flatMap(r => r.testValues || [])
  
  const timeline = [
    ...records.map(r => ({ type: 'record', date: r.uploadedAt, data: r })),
    ...prescriptions.map(p => ({ type: 'prescription', date: p.createdAt, data: p })),
    ...consultations.map(c => ({ type: 'consultation', date: c.date, data: c }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  res.json({
    patient,
    records,
    prescriptions,
    consultations,
    summary: {
      totalRecords: records.length,
      totalPrescriptions: prescriptions.length,
      totalConsultations: consultations.length,
      activeMedicines: allMedicines,
      recentTests: allTests
    },
    timeline
  })
})

app.post('/api/patients/:id/prescriptions', authenticateToken, (req: any, res) => {
  const { id } = req.params
  const prescription = {
    id: `PRX${String(store.prescriptions.length + 1).padStart(4, '0')}`,
    patientId: id,
    ...req.body,
    prescribedBy: req.user.name,
    createdAt: new Date().toISOString()
  }
  store.prescriptions.push(prescription)
  res.json({ success: true, prescription })
})

app.post('/api/patients/:id/consultations', authenticateToken, (req: any, res) => {
  const { id } = req.params
  const consultation = {
    id: `CON${String(store.consultations.length + 1).padStart(4, '0')}`,
    patientId: id,
    ...req.body,
    doctorName: req.user.name,
    date: new Date().toISOString()
  }
  store.consultations.push(consultation)
  res.json({ success: true, consultation })
})

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('WebSocket connected')
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('Received:', data)
      
      // Echo back for testing
      ws.send(JSON.stringify({ type: 'echo', data }))
    } catch (e) {
      console.error('WebSocket message error:', e)
    }
  })

  ws.on('close', () => {
    console.log('WebSocket disconnected')
  })
})

const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  console.log(`🚀 Healthcare Backend running on port ${PORT}`)
  console.log(`📡 WebSocket server ready`)
})