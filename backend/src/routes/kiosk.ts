import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, KioskEntry } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'
import { broadcast } from '../ws/server.js'

const router = Router()

// GET /kiosk/queue/:facilityId
router.get('/queue/:facilityId', (req, res) => {
  const entries = db.kioskEntries
    .filter(e => e.facilityId === req.params.facilityId && e.status !== 'done')
    .sort((a, b) => a.queuePosition - b.queuePosition)
  res.json(entries)
})

// POST /kiosk/checkin
router.post('/checkin', (req, res) => {
  const { healthId, name, type, facilityId } = req.body as Record<string, string>
  const fid = facilityId || db.facilities[1].id   // default to PHC

  let patientId: string | undefined
  if (healthId) {
    const p = db.patients.find(p => p.healthId === healthId)
    if (p) patientId = p.id
  }

  const position = db.kioskEntries.filter(e => e.facilityId === fid && e.status === 'waiting').length + 1
  const entry: KioskEntry = {
    id: uuid(),
    facilityId: fid,
    patientId,
    name: name || (patientId ? db.patients.find(p => p.id === patientId)?.name || 'Patient' : 'Walk-in Patient'),
    type: (type as KioskEntry['type']) || 'walk-in',
    token: `T-${String(position).padStart(3, '0')}`,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    status: 'waiting',
    queuePosition: position,
    estimatedWait: (position - 1) * 10,
  }

  db.kioskEntries.push(entry)
  broadcast('kiosk:new', { facilityId: fid, entry })
  res.status(201).json(entry)
})

// PATCH /kiosk/:id/call
router.patch('/:id/call', requireAuth, (req, res) => {
  const entry = db.kioskEntries.find(e => e.id === req.params.id)
  if (!entry) { res.status(404).json({ error: 'Not found' }); return }
  entry.status = 'called'
  broadcast('kiosk:called', { facilityId: entry.facilityId, entry })
  res.json(entry)
})

// PATCH /kiosk/:id/done
router.patch('/:id/done', requireAuth, (req, res) => {
  const entry = db.kioskEntries.find(e => e.id === req.params.id)
  if (!entry) { res.status(404).json({ error: 'Not found' }); return }
  entry.status = 'done'
  broadcast('kiosk:done', { facilityId: entry.facilityId, entry })
  res.json(entry)
})

export default router
