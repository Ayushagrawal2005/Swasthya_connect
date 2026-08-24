import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, Patient, VisitRecord } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Generate ABDM-style health ID
function generateHealthId(): string {
  const seg = () => String(Math.floor(1000 + Math.random() * 9000))
  return `91-${seg()}-${seg()}-${seg()}`
}

// GET /patients/search?q=
router.get('/search', requireAuth, (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim()
  if (!q) { res.json([]); return }

  const results = db.patients.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.phone.includes(q) ||
    p.healthId.includes(q) ||
    p.village.toLowerCase().includes(q)
  )

  res.json(results.map(p => ({
    ...p,
    visits: db.visits.filter(v => v.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date)),
  })))
})

// GET /patients/:id
router.get('/:id', requireAuth, (req, res) => {
  const p = db.patients.find(p => p.id === req.params.id)
  if (!p) { res.status(404).json({ error: 'Patient not found' }); return }
  const visits = db.visits.filter(v => v.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date))
  res.json({ ...p, visits })
})

// POST /patients/register
router.post('/register', requireAuth, (req, res) => {
  const { name, phone, age, gender, village, condition, language, aadhaarLast4 } = req.body as Record<string, string>
  if (!name || !phone || !age || !gender || !village) {
    res.status(400).json({ error: 'name, phone, age, gender, village required' })
    return
  }

  const newPatient: Patient = {
    id: uuid(),
    healthId: generateHealthId(),
    name,
    age: parseInt(age),
    gender: gender as 'M' | 'F' | 'O',
    dob: '',
    village,
    phone,
    language: language || 'Marathi',
    bloodGroup: '',
    allergies: [],
    conditions: condition ? [condition] : [],
    diseaseHistory: [],
    medications: [],
    noShowCount: 0,
    totalFollowUps: 0,
    distanceKmFromPHC: 0,
    registeredBy: req.user!.userId,
    createdAt: new Date().toISOString(),
  }

  db.patients.push(newPatient)
  res.status(201).json({ patientId: newPatient.id, healthId: newPatient.healthId, name: newPatient.name })
})

// POST /patients/:id/visits
router.post('/:id/visits', requireAuth, (req, res) => {
  const patient = db.patients.find(p => p.id === req.params.id)
  if (!patient) { res.status(404).json({ error: 'Patient not found' }); return }

  const visit: VisitRecord = {
    id: uuid(),
    patientId: patient.id,
    date: req.body.date || new Date().toISOString().split('T')[0],
    facility: req.body.facility || '',
    tier: req.body.tier || 'sub-centre',
    worker: req.user!.name,
    type: req.body.type || 'visit',
    title: req.body.title || 'Visit',
    detail: req.body.detail || '',
    vitals: req.body.vitals,
    riskScore: req.body.riskScore,
    riskLevel: req.body.riskLevel,
    reportFile: req.body.reportFile,
  }

  db.visits.push(visit)
  res.status(201).json(visit)
})

// GET /patients/:id/records  (alias for full visits list with filter)
router.get('/:id/records', requireAuth, (req, res) => {
  const typeFilter = req.query.type as string | undefined
  const q = String(req.query.q || '').toLowerCase()

  let visits = db.visits.filter(v => v.patientId === req.params.id)
  if (typeFilter && typeFilter !== 'all') visits = visits.filter(v => v.type === typeFilter)
  if (q) visits = visits.filter(v => v.title.toLowerCase().includes(q) || v.detail.toLowerCase().includes(q))

  res.json(visits.sort((a, b) => b.date.localeCompare(a.date)))
})

// GET /patients/:id/medicines
router.get('/:id/medicines', requireAuth, (req, res) => {
  const p = db.patients.find(p => p.id === req.params.id)
  if (!p) { res.status(404).json({ error: 'Not found' }); return }
  res.json(p.medications)
})

// GET /patients/:id/referrals
router.get('/:id/referrals', requireAuth, (req, res) => {
  res.json(db.referrals.filter(r => r.patientId === req.params.id))
})

export default router
