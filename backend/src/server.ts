/**
 * Healthcare Platform Backend Server
 * Using Firebase Firestore for data persistence
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import db from './services/db'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() })

// Middleware
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'healthcare-secret-key'
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000'

// ═══════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await db.users.findByUsername(username) as any

    if (!user || user.password !== password) {
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
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user })
})

// ═══════════════════════════════════════════════════════════════
// PATIENT ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/patients/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query
    const patients = await db.patients.search(q as string || '')
    res.json(patients)
  } catch (error) {
    console.error('Patient search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

app.get('/patients/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await db.patients.findById(req.params.id)
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    res.json(patient)
  } catch (error) {
    console.error('Get patient error:', error)
    res.status(500).json({ error: 'Failed to get patient' })
  }
})

app.post('/patients/register', authenticateToken, async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      healthId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      allergies: [],
      conditions: req.body.condition ? [req.body.condition] : [],
      diseaseHistory: [],
      medications: [],
      noShowCount: 0,
      totalFollowUps: 0,
      distanceKmFromPHC: Math.random() * 20
    }

    const patient = await db.patients.create(patientData)
    res.json({ 
      patientId: patient.id, 
      healthId: patient.healthId, 
      name: patient.name 
    })
  } catch (error) {
    console.error('Register patient error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/patients/:id/visits', authenticateToken, async (req: any, res) => {
  try {
    const visitData = {
      ...req.body,
      date: new Date().toISOString(),
      worker: req.user.username
    }

    const visit = await db.patients.addVisit(req.params.id, visitData)
    res.json(visit)
  } catch (error) {
    console.error('Add visit error:', error)
    res.status(500).json({ error: 'Failed to add visit' })
  }
})

app.get('/patients/:id/records', authenticateToken, async (req, res) => {
  try {
    const visits = await db.patients.getVisits(req.params.id)
    const medRecords = await db.medicalRecords.getByPatient(req.params.id)

    // Helper: Firestore Timestamp → ISO string
    function toIso(val: any): string {
      if (!val) return new Date().toISOString()
      if (typeof val === 'string') return val
      if (val._seconds !== undefined) return new Date(val._seconds * 1000).toISOString()
      if (typeof val.toDate === 'function') return val.toDate().toISOString()
      return new Date().toISOString()
    }

    const combined = [
      ...visits.map((v: any) => ({ ...v, date: toIso(v.date || v.createdAt) })),
      ...medRecords.map((r: any) => ({
        id:           r.id,
        patientId:    r.patientId,
        date:         toIso(r.createdAt),
        type:         'ocr-upload',
        title:        `Medical Record — ${r.documentType || 'Document'}`,
        detail:       r.summary || '',
        facility:     'Uploaded',
        worker:       r.uploadedBy || '',
        documentType: r.documentType || 'unknown',
        summary:      r.summary     || '',
        medicines:    r.medicines   || [],
        testValues:   r.testValues  || [],
        datesFound:   r.datesFound  || [],
        rawText:      r.rawText     || '',
      }))
    ].sort((a: any, b: any) => (a.date > b.date ? -1 : 1))

    res.json(combined)
  } catch (error) {
    console.error('Get records error:', error)
    res.status(500).json({ error: 'Failed to get records' })
  }
})

// ═══════════════════════════════════════════════════════════════
// CONSULTATION ROUTES
// ═══════════════════════════════════════════════════════════════

// POST /patients/:id/consultations — doctor saves a consultation record
app.post('/patients/:id/consultations', authenticateToken, async (req: any, res) => {
  try {
    const { chiefComplaint, diagnosis, notes, prescription, medicines, followUpDate } = req.body
    const consultation = await db.consultations.create({
      patientId:       req.params.id,
      chiefComplaint:  chiefComplaint  || '',
      diagnosis:       diagnosis       || '',
      notes:           notes           || '',
      prescription:    prescription    || '',
      medicines:       medicines       || [],   // [{ name, dosage, frequency, duration }]
      followUpDate:    followUpDate    || null,
      doctorId:        req.user.id,
      doctorName:      req.user.name   || req.user.username,
      date:            new Date().toISOString(),
    })

    // Also write a VisitRecord so it appears in the patient timeline
    await db.patients.addVisit(req.params.id, {
      type:    'diagnosis',
      title:   diagnosis || chiefComplaint || 'Consultation',
      detail:  notes || '',
      facility: 'PHC / Doctor Portal',
      tier:    'phc',
      worker:  req.user.name || req.user.username,
      consultationId: consultation.id,
      prescription,
      medicines: medicines || [],
    })

    res.json(consultation)
  } catch (error) {
    console.error('Save consultation error:', error)
    res.status(500).json({ error: 'Failed to save consultation' })
  }
})

// GET /patients/:id/consultations — list all consultations for a patient
app.get('/patients/:id/consultations', authenticateToken, async (req, res) => {
  try {
    const consultations = await db.consultations.getByPatient(req.params.id)
    res.json(consultations)
  } catch (error) {
    console.error('Get consultations error:', error)
    res.status(500).json({ error: 'Failed to get consultations' })
  }
})

// GET /api/patients/:id/summary — unified summary for doctor view
// Merges OCR records + consultations + visits into one response
app.get('/api/patients/:id/summary', authenticateToken, async (req, res) => {
  try {
    const [medRecords, consultations, visits] = await Promise.all([
      db.medicalRecords.getByPatient(req.params.id).catch(() => []),
      db.consultations.getByPatient(req.params.id).catch(() => []),
      db.patients.getVisits(req.params.id).catch(() => []),
    ])

    // Collect all medicines from OCR records
    const allMedicines: any[] = []
    ;(medRecords as any[]).forEach((r: any) => {
      if (r.medicines && Array.isArray(r.medicines)) {
        r.medicines.forEach((m: any) => allMedicines.push({ ...m, source: 'ocr', recordId: r.id }))
      }
    })
    ;(consultations as any[]).forEach((c: any) => {
      if (c.medicines && Array.isArray(c.medicines)) {
        c.medicines.forEach((m: any) => allMedicines.push({ ...m, source: 'doctor', consultationId: c.id }))
      }
    })

    // Recent test values from OCR
    const recentTests: any[] = []
    ;(medRecords as any[]).forEach((r: any) => {
      if (r.testValues && Array.isArray(r.testValues)) {
        recentTests.push(...r.testValues.map((t: any) => ({ ...t, recordId: r.id })))
      }
    })

    // Build unified timeline
    const timeline: any[] = [
      ...(medRecords as any[]).map((r: any) => ({
        type: 'record',
        date: r.createdAt?._seconds ? new Date(r.createdAt._seconds * 1000).toISOString() : r.createdAt || new Date().toISOString(),
        data: r,
      })),
      ...(consultations as any[]).map((c: any) => ({
        type: 'consultation',
        date: c.date || (c.createdAt?._seconds ? new Date(c.createdAt._seconds * 1000).toISOString() : new Date().toISOString()),
        data: c,
      })),
      ...(visits as any[]).map((v: any) => ({
        type: 'visit',
        date: typeof v.date === 'string' ? v.date : v.date?._seconds ? new Date(v.date._seconds * 1000).toISOString() : new Date().toISOString(),
        data: v,
      })),
    ].sort((a, b) => (a.date > b.date ? -1 : 1))

    res.json({
      records:       medRecords,
      consultations,
      visits,
      summary: {
        totalRecords:       (medRecords as any[]).length,
        totalConsultations: (consultations as any[]).length,
        totalVisits:        (visits as any[]).length,
        totalPrescriptions: (consultations as any[]).length,
        activeMedicines:    allMedicines,
        recentTests,
      },
      timeline,
    })
  } catch (error) {
    console.error('Patient summary error:', error)
    res.status(500).json({ error: 'Failed to get patient summary' })
  }
})

// POST /patients/:id/records — save OCR-extracted medical record to patient
app.post('/patients/:id/records', authenticateToken, async (req: any, res) => {
  try {
    const record = await db.medicalRecords.create({
      patientId: req.params.id,
      documentType: req.body.documentType || 'unknown',
      rawText:      req.body.rawText || '',
      summary:      req.body.summary || '',
      medicines:    req.body.medicines || [],
      testValues:   req.body.testValues || [],
      datesFound:   req.body.datesFound || [],
      uploadedBy:   req.user.username,
      verified:     false,
    })
    res.json(record)
  } catch (error) {
    console.error('Save medical record error:', error)
    res.status(500).json({ error: 'Failed to save record' })
  }
})

// Alias: /api/patients/:id/records (some frontend code uses this path)
app.post('/api/patients/:id/records', authenticateToken, async (req: any, res) => {
  try {
    const record = await db.medicalRecords.create({
      patientId: req.params.id,
      documentType: req.body.documentType || 'unknown',
      rawText:      req.body.rawText || '',
      summary:      req.body.summary || '',
      medicines:    req.body.medicines || [],
      testValues:   req.body.testValues || [],
      datesFound:   req.body.datesFound || [],
      uploadedBy:   req.user.username,
      verified:     false,
    })
    res.json(record)
  } catch (error) {
    console.error('Save medical record error:', error)
    res.status(500).json({ error: 'Failed to save record' })
  }
})

app.get('/patients/:id/medicines', authenticateToken, async (req, res) => {
  try {
    const patient = await db.patients.findById(req.params.id) as any
    res.json(patient?.medications || [])
  } catch (error) {
    console.error('Get medicines error:', error)
    res.status(500).json({ error: 'Failed to get medicines' })
  }
})

app.get('/patients/:id/referrals', authenticateToken, async (req, res) => {
  try {
    const referrals = await db.referrals.list({ patientId: req.params.id })
    res.json(referrals)
  } catch (error) {
    console.error('Get referrals error:', error)
    res.status(500).json({ error: 'Failed to get referrals' })
  }
})

// ═══════════════════════════════════════════════════════════════
// APPOINTMENTS ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/appointments/facilities', authenticateToken, async (req, res) => {
  try {
    const facilities = await db.facilities.getAllWithDoctors()
    res.json(facilities)
  } catch (error) {
    console.error('Get facilities error:', error)
    res.status(500).json({ error: 'Failed to get facilities' })
  }
})

app.get('/appointments/facilities/:id/slots', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query
    
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ]
    
    res.json({
      date: date || new Date().toISOString().split('T')[0],
      slots: timeSlots,
      doctors: []
    })
  } catch (error) {
    console.error('Get slots error:', error)
    res.status(500).json({ error: 'Failed to get slots' })
  }
})

app.post('/appointments', authenticateToken, async (req: any, res) => {
  try {
    const { patientName, patientId, facilityId, doctorId, date, time, type = 'in-person' } = req.body
    
    const queuePosition = await db.appointments.getQueuePosition(facilityId, date)
    
    const appointmentData = {
      patientId: patientId || `P${Date.now()}`,
      patientName,
      facilityId,
      doctorId,
      bookedBy: req.user.username,
      date,
      time,
      type,
      status: 'scheduled',
      queuePosition,
      estimatedWait: (queuePosition - 1) * 15,
      token: `T${Math.floor(Math.random() * 900 + 100)}`
    }
    
    const appointment = await db.appointments.create(appointmentData)
    res.json(appointment)
  } catch (error) {
    console.error('Book appointment error:', error)
    res.status(500).json({ error: 'Booking failed' })
  }
})

app.get('/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await db.appointments.list(req.query)
    res.json(appointments)
  } catch (error) {
    console.error('List appointments error:', error)
    res.status(500).json({ error: 'Failed to list appointments' })
  }
})

app.patch('/appointments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body
    const appointment = await db.appointments.updateStatus(req.params.id, status)
    res.json(appointment)
  } catch (error) {
    console.error('Update appointment error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

// ═══════════════════════════════════════════════════════════════
// TRIAGE ROUTES
// ═══════════════════════════════════════════════════════════════

app.post('/triage/assess', authenticateToken, async (req: any, res) => {
  try {
    // In production, this would call ML backend
    // For now, return mock data
    res.json({
      urgency_level: 2,
      risk_level: 'moderate',
      risk_label: 'Moderate Risk',
      score: 65,
      confidence: 0.85,
      auto_escalate: false,
      flags: [],
      hospital_level: 1,
      hospital_level_label: 'PHC',
      hospital_level_desc: 'Primary Health Centre',
      probabilities: { low: 0.2, moderate: 0.65, high: 0.15 }
    })
  } catch (error) {
    console.error('Triage assess error:', error)
    res.status(500).json({ error: 'Assessment failed' })
  }
})

app.post('/triage/save', authenticateToken, async (req: any, res) => {
  try {
    const triageData = {
      ...req.body,
      workerId: req.user.id
    }

    const triage = await db.triage.create(triageData)
    res.json({ triageId: triage.id, savedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Save triage error:', error)
    res.status(500).json({ error: 'Save failed' })
  }
})

app.get('/triage/sessions', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.query
    
    if (patientId) {
      const sessions = await db.triage.getByPatient(patientId as string)
      res.json(sessions)
    } else {
      const sessions = await db.triage.getAll()
      res.json(sessions)
    }
  } catch (error) {
    console.error('Get triage sessions error:', error)
    res.status(500).json({ error: 'Failed to get sessions' })
  }
})

// ═══════════════════════════════════════════════════════════════
// REFERRALS ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/referrals', authenticateToken, async (req, res) => {
  try {
    const referrals = await db.referrals.list(req.query)
    res.json(referrals)
  } catch (error) {
    console.error('List referrals error:', error)
    res.status(500).json({ error: 'Failed to list referrals' })
  }
})

app.get('/referrals/incoming', authenticateToken, async (req: any, res) => {
  try {
    const referrals = await db.referrals.list({ toFacilityId: req.user.facilityId })
    res.json(referrals)
  } catch (error) {
    console.error('Get incoming referrals error:', error)
    res.status(500).json({ error: 'Failed to get referrals' })
  }
})

app.get('/referrals/outgoing', authenticateToken, async (req: any, res) => {
  try {
    const referrals = await db.referrals.list({ fromFacilityId: req.user.facilityId })
    res.json(referrals)
  } catch (error) {
    console.error('Get outgoing referrals error:', error)
    res.status(500).json({ error: 'Failed to get referrals' })
  }
})

app.post('/referrals', authenticateToken, async (req: any, res) => {
  try {
    const referralData = {
      ...req.body,
      fromFacilityId: req.user.facilityId || 'F001',
      createdBy: req.user.username
    }

    const referral = await db.referrals.create(referralData)
    res.json(referral)
  } catch (error) {
    console.error('Create referral error:', error)
    res.status(500).json({ error: 'Failed to create referral' })
  }
})

app.patch('/referrals/:id/accept', authenticateToken, async (req, res) => {
  try {
    const referral = await db.referrals.accept(req.params.id)
    res.json(referral)
  } catch (error) {
    console.error('Accept referral error:', error)
    res.status(500).json({ error: 'Failed to accept referral' })
  }
})

app.patch('/referrals/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body
    const referral = await db.referrals.updateStatus(req.params.id, status)
    res.json(referral)
  } catch (error) {
    console.error('Update referral error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UPS ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/followups', authenticateToken, async (req, res) => {
  try {
    const followups = await db.followups.list(req.query)
    res.json(followups)
  } catch (error) {
    console.error('List followups error:', error)
    res.status(500).json({ error: 'Failed to list followups' })
  }
})

app.patch('/followups/:id/done', authenticateToken, async (req, res) => {
  try {
    const followup = await db.followups.markDone(req.params.id)
    res.json(followup)
  } catch (error) {
    console.error('Mark followup done error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

app.patch('/followups/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body
    const followup = await db.followups.updateStatus(req.params.id, status)
    res.json(followup)
  } catch (error) {
    console.error('Update followup error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

// ═══════════════════════════════════════════════════════════════
// CHRONIC CARE ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/chronic', authenticateToken, async (req, res) => {
  try {
    const patients = await db.chronic.list(req.query)
    res.json(patients)
  } catch (error) {
    console.error('List chronic patients error:', error)
    res.status(500).json({ error: 'Failed to list patients' })
  }
})

app.get('/chronic/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await db.chronic.findById(req.params.id)
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    res.json(patient)
  } catch (error) {
    console.error('Get chronic patient error:', error)
    res.status(500).json({ error: 'Failed to get patient' })
  }
})

app.post('/chronic/:id/readings', authenticateToken, async (req: any, res) => {
  try {
    const reading = {
      ...req.body,
      date: new Date().toISOString().split('T')[0],
      recordedBy: req.user.username
    }

    await db.chronic.addReading(req.params.id, reading)
    res.json(reading)
  } catch (error) {
    console.error('Add reading error:', error)
    res.status(500).json({ error: 'Failed to add reading' })
  }
})

// ═══════════════════════════════════════════════════════════════
// INVENTORY ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.query
    const items = await db.inventory.list(facilityId as string)
    res.json(items)
  } catch (error) {
    console.error('List inventory error:', error)
    res.status(500).json({ error: 'Failed to list inventory' })
  }
})

app.patch('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const item = await db.inventory.update(req.params.id, req.body)
    res.json(item)
  } catch (error) {
    console.error('Update inventory error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTIC ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/diagnostics', authenticateToken, async (req, res) => {
  try {
    const orders = await db.diagnostics.list(req.query)
    res.json(orders)
  } catch (error) {
    console.error('List diagnostics error:', error)
    res.status(500).json({ error: 'Failed to list orders' })
  }
})

app.post('/diagnostics/orders', authenticateToken, async (req: any, res) => {
  try {
    const orderData = {
      ...req.body,
      orderedBy: req.user.username,
      date: new Date().toISOString().split('T')[0]
    }

    const order = await db.diagnostics.create(orderData)
    res.json(order)
  } catch (error) {
    console.error('Create diagnostic order error:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

app.patch('/diagnostics/:id/status', authenticateToken, async (req, res) => {
  try {
    const order = await db.diagnostics.updateStatus(req.params.id, req.body)
    res.json(order)
  } catch (error) {
    console.error('Update diagnostic error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

// ═══════════════════════════════════════════════════════════════
// STAFF ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/staff', authenticateToken, async (req, res) => {
  try {
    const facilities = await db.facilities.getAllWithDoctors()
    res.json(facilities)
  } catch (error) {
    console.error('Get staff error:', error)
    res.status(500).json({ error: 'Failed to get staff' })
  }
})

app.patch('/staff/doctors/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { available, slotsToday } = req.body
    const doctor = await db.doctors.updateAvailability(req.params.id, available, slotsToday)
    res.json(doctor)
  } catch (error) {
    console.error('Update doctor availability error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

// ═══════════════════════════════════════════════════════════════
// ESCALATIONS ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/escalations', authenticateToken, async (req, res) => {
  try {
    const escalations = await db.escalations.list()
    res.json(escalations)
  } catch (error) {
    console.error('List escalations error:', error)
    res.status(500).json({ error: 'Failed to list escalations' })
  }
})

app.post('/escalations', authenticateToken, async (req: any, res) => {
  try {
    const escalationData = {
      ...req.body,
      fromFacilityId: req.user.facilityId || 'F001',
      triggeredBy: req.user.username,
      sentTime: new Date().toISOString()
    }

    const escalation = await db.escalations.create(escalationData)
    res.json(escalation)
  } catch (error) {
    console.error('Create escalation error:', error)
    res.status(500).json({ error: 'Failed to create escalation' })
  }
})

app.patch('/escalations/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const escalation = await db.escalations.acknowledge(req.params.id)
    res.json(escalation)
  } catch (error) {
    console.error('Acknowledge escalation error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

app.patch('/escalations/:id/arrived', authenticateToken, async (req, res) => {
  try {
    const escalation = await db.escalations.markArrived(req.params.id)
    res.json(escalation)
  } catch (error) {
    console.error('Mark arrived error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UPS ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/followups', authenticateToken, async (req, res) => {
  try {
    const { assignedTo, status } = req.query
    const params: any = {}
    if (assignedTo) params.assignedTo = assignedTo
    if (status) params.status = status
    
    const followups = await db.followups.list(params)
    res.json(followups)
  } catch (error) {
    console.error('List followups error:', error)
    res.status(500).json({ error: 'Failed to list follow-ups' })
  }
})

app.patch('/followups/:id/done', authenticateToken, async (req, res) => {
  try {
    const followup = await db.followups.updateStatus(req.params.id, 'completed')
    res.json(followup)
  } catch (error) {
    console.error('Mark followup done error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

app.patch('/followups/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body
    const followup = await db.followups.updateStatus(req.params.id, status)
    res.json(followup)
  } catch (error) {
    console.error('Update followup status error:', error)
    res.status(500).json({ error: 'Update failed' })
  }
})

// ═══════════════════════════════════════════════════════════════
// IVR ROUTES
// ═══════════════════════════════════════════════════════════════

app.post('/ivr/case', authenticateToken, async (req, res) => {
  try {
    const caseData = {
      ...req.body,
      lang: req.body.lang || 'hi'
    }

    const ivrCase = await db.ivr.create(caseData)
    res.json(ivrCase)
  } catch (error) {
    console.error('Create IVR case error:', error)
    res.status(500).json({ error: 'Failed to create case' })
  }
})

app.get('/ivr/cases', authenticateToken, async (req, res) => {
  try {
    const cases = await db.ivr.list()
    res.json(cases)
  } catch (error) {
    console.error('List IVR cases error:', error)
    res.status(500).json({ error: 'Failed to list cases' })
  }
})

// ═══════════════════════════════════════════════════════════════
// OCR ROUTES
// ═══════════════════════════════════════════════════════════════

app.post('/api/ocr/extract', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const formData = new FormData()
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    const ocrResponse = await axios.post(`${OCR_SERVICE_URL}/ocr/extract`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    })

    // Do NOT auto-save here — callers are responsible for saving via
    // POST /patients/:id/records so there is no double-write.
    res.json(ocrResponse.data)
  } catch (error: any) {
    console.error('OCR extraction error:', error.message)
    res.status(500).json({ error: 'OCR extraction failed', details: error.message })
  }
})

// Alias: /ocr/extract (used by AshaRegister.tsx fallback)
app.post('/ocr/extract', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const formData = new FormData()
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    // Correct path on OCR service is /ocr/extract (not /extract)
    const ocrResponse = await axios.post(`${OCR_SERVICE_URL}/ocr/extract`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    })

    res.json(ocrResponse.data)
  } catch (error: any) {
    console.error('OCR extraction error:', error.message)
    res.status(500).json({ error: 'OCR extraction failed', details: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/admin/overview', authenticateToken, async (req, res) => {
  try {
    const [patients, appointments, referrals, followups, inventory] = await Promise.all([
      db.patients.search(''),
      db.appointments.list({}),
      db.referrals.list({}),
      db.followups.list({}),
      db.inventory.list(),
    ])

    const today = new Date().toISOString().split('T')[0]
    const todayAppts = appointments.filter((a: any) => a.date === today)
    const pendingRefs = referrals.filter((r: any) => r.status === 'pending')
    const overdueFollowups = followups.filter((f: any) => f.status !== 'completed' && f.dueDate < today)
    const criticalStock = inventory.filter((i: any) => i.critical || i.current <= i.threshold * 0.3)

    const footfallData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, idx) => ({
      day, patients: 80 + Math.floor(Math.random() * 120), referrals: 5 + Math.floor(Math.random() * 20)
    }))

    const referralDistribution = [
      { name: 'Sub-centre', value: 38, color: '#FF9933' },
      { name: 'PHC',        value: 45, color: '#138808' },
      { name: 'Rural Hosp', value: 12, color: '#000080' },
      { name: 'District',   value: 5,  color: '#D85A30' },
    ]

    res.json({
      kpis: [
        { label: 'Total patients',     value: patients.length,         change: '+8.4%', icon: 'users' },
        { label: 'Today\'s visits',    value: todayAppts.length,       change: `${todayAppts.length} today`, icon: 'activity' },
        { label: 'Pending referrals',  value: pendingRefs.length,      change: `${pendingRefs.length} pending`, icon: 'arrow-right', alert: pendingRefs.length > 5 },
        { label: 'Overdue follow-ups', value: overdueFollowups.length, change: `${overdueFollowups.length} overdue`, icon: 'clock', alert: overdueFollowups.length > 0 },
        { label: 'Stock alerts',       value: criticalStock.length,    change: 'Low stock', icon: 'package', alert: criticalStock.length > 0 },
        { label: 'Total referrals',    value: referrals.length,        change: 'All time', icon: 'trending-up' },
      ],
      footfallData,
      referralDistribution,
      stockAlerts: criticalStock.slice(0, 6),
      followUpBoard: overdueFollowups.slice(0, 5).map((f: any) => ({
        name: f.patientName, condition: f.condition, due: f.dueDate, status: f.status, asha: f.assignedTo || 'ASHA'
      })),
      totalPatients: patients.length,
      todayVisits: todayAppts.length,
      pendingReferrals: pendingRefs.length,
      criticalAlerts: criticalStock.length,
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    res.status(500).json({ error: 'Failed to get overview' })
  }
})

app.get('/admin/dashboard', authenticateToken, async (req, res) => {
  try {
    const [patients, appointments, referrals, followups] = await Promise.all([
      db.patients.search(''),
      db.appointments.list({}),
      db.referrals.list({}),
      db.followups.list({}),
    ])

    const today = new Date().toISOString().split('T')[0]
    const todayAppts = appointments.filter((a: any) => a.date === today)
    const overdueFollowups = followups.filter((f: any) => f.status !== 'completed' && f.dueDate <= today)
    const todayReferrals = referrals.filter((r: any) => {
      const d = r.createdAt?.toDate ? r.createdAt.toDate().toISOString().split('T')[0] : (r.createdAt || '').slice(0, 10)
      return d === today
    })

    res.json({
      activeCases: patients.slice(0, 10).map((p: any) => ({
        id: p.id,
        name: p.name,
        age: p.age || 0,
        village: p.village || '',
        condition: p.conditions?.[0] || p.condition || 'General',
        riskLevel: p.riskLevel || 'low',
        riskScore: p.riskScore || 0,
        lastSeen: p.updatedAt?.toDate ? p.updatedAt.toDate().toLocaleDateString('en-IN') : 'Recently',
      })),
      todayStats: {
        visited: todayAppts.length,
        triages: 0,
        referrals: todayReferrals.length,
        overdueFollowUps: overdueFollowups.length,
      },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    res.status(500).json({ error: 'Failed to get dashboard' })
  }
})

// ═══════════════════════════════════════════════════════════════
// WEBSOCKET SERVER
// ═══════════════════════════════════════════════════════════════

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('WS received:', data.type)
      
      if (data.type === 'auth') {
        // Handle authentication
      }
    } catch (error) {
      console.error('WS message error:', error)
    }
  })

  ws.on('close', () => {
    console.log('WebSocket client disconnected')
  })
})

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  console.log('🚀 Healthcare Backend running on port', PORT)
  console.log('📡 WebSocket server ready')
  console.log('🔥 Connected to Firebase Firestore')
})
