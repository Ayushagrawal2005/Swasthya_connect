import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, VitalReading } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'
import { broadcast } from '../ws/server.js'

const router = Router()

// GET /chronic?alertLevel=&worker=
router.get('/', requireAuth, (req, res) => {
  let pts = db.chronicPatients
  if (req.query.alertLevel && req.query.alertLevel !== 'all') {
    pts = pts.filter(p => p.alertLevel === req.query.alertLevel)
  }
  if (req.query.worker) pts = pts.filter(p => p.worker === req.query.worker)
  res.json(pts)
})

// GET /chronic/:id
router.get('/:id', requireAuth, (req, res) => {
  const p = db.chronicPatients.find(p => p.id === req.params.id)
  if (!p) { res.status(404).json({ error: 'Not found' }); return }
  res.json(p)
})

// POST /chronic/:id/readings
router.post('/:id/readings', requireAuth, (req, res) => {
  const p = db.chronicPatients.find(p => p.id === req.params.id)
  if (!p) { res.status(404).json({ error: 'Not found' }); return }

  const reading: VitalReading = {
    date: req.body.date || new Date().toLocaleDateString('en-IN'),
    value: req.body.value,
    numeric: req.body.numeric,
    note: req.body.note,
    recordedBy: req.user!.name,
  }
  p.readings.push(reading)
  p.lastContactDate = reading.date

  // Recompute progression
  const vals = p.readings.slice(-3).map(r => r.numeric)
  if (vals.length >= 2) {
    const delta = ((vals[vals.length-1] - vals[0]) / vals[0]) * 100
    p.progressionStatus = delta > 10 ? 'worsening' : delta < -10 ? 'improving' : 'stable'
  }

  broadcast('chronic:updated', { id: p.id, progressionStatus: p.progressionStatus, latestReading: reading })
  res.status(201).json(reading)
})

// POST /chronic/:id/alerts/:alertId/acknowledge
router.post('/:id/alerts/:alertId/acknowledge', requireAuth, (req, res) => {
  const p = db.chronicPatients.find(p => p.id === req.params.id)
  if (!p) { res.status(404).json({ error: 'Not found' }); return }
  const alert = p.alerts.find(a => a.id === req.params.alertId)
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return }
  alert.acknowledged = true
  res.json(alert)
})

// POST /chronic/:id/sms
router.post('/:id/sms', requireAuth, (req, res) => {
  const p = db.chronicPatients.find(p => p.id === req.params.id)
  if (!p) { res.status(404).json({ error: 'Not found' }); return }
  // In real app: send SMS via Twilio/MSG91. Here we just log it.
  console.log(`📱 SMS to ${p.phone}: ${req.body.message || 'Please attend your scheduled checkup.'}`)
  res.json({ sent: true, to: p.phone, patient: p.name })
})

export default router
