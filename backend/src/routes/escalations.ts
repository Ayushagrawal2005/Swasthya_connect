import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, Escalation } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'
import { broadcast } from '../ws/server.js'

const router = Router()

// GET /escalations
router.get('/', requireAuth, (req, res) => {
  res.json(db.escalations.sort((a, b) => b.sentTime.localeCompare(a.sentTime)))
})

// POST /escalations
router.post('/', requireAuth, (req, res) => {
  const { patientName, patientId, reason, toFacilityId, toFacilityName } = req.body as Record<string, string>
  const toFac = db.facilities.find(f => f.id === toFacilityId) || db.facilities.find(f => f.tier === 'district')!

  const esc: Escalation = {
    id: uuid(),
    patientId,
    patientName,
    reason,
    fromFacilityId: req.user!.facilityId,
    toFacilityId: toFac.id,
    toFacilityName: toFacilityName || toFac.name,
    triggeredBy: req.user!.userId,
    sentTime: new Date().toISOString(),
    status: 'sent',
  }

  db.escalations.push(esc)
  broadcast('escalation:new', esc)
  res.status(201).json(esc)
})

// PATCH /escalations/:id/acknowledge
router.patch('/:id/acknowledge', requireAuth, (req, res) => {
  const esc = db.escalations.find(e => e.id === req.params.id)
  if (!esc) { res.status(404).json({ error: 'Not found' }); return }
  esc.status = 'acknowledged'
  broadcast('escalation:updated', esc)
  res.json(esc)
})

// PATCH /escalations/:id/arrived
router.patch('/:id/arrived', requireAuth, (req, res) => {
  const esc = db.escalations.find(e => e.id === req.params.id)
  if (!esc) { res.status(404).json({ error: 'Not found' }); return }
  esc.status = 'arrived'
  esc.arrivedAt = new Date().toISOString()
  broadcast('escalation:updated', esc)
  res.json(esc)
})

export default router
