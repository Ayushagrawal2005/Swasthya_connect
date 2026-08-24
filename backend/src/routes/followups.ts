import { Router } from 'express'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /followups?assignedTo=&status=
router.get('/', requireAuth, (req, res) => {
  let fups = db.followUps
  if (req.query.assignedTo) fups = fups.filter(f => f.assignedTo === req.query.assignedTo)
  if (req.query.status)     fups = fups.filter(f => f.status === req.query.status)
  if (req.query.patientId)  fups = fups.filter(f => f.patientId === req.query.patientId)
  // default: return assigned to current user
  if (!req.query.assignedTo && !req.query.patientId) {
    fups = fups.filter(f => f.assignedTo === req.user!.userId)
  }
  res.json(fups)
})

// PATCH /followups/:id/done
router.patch('/:id/done', requireAuth, (req, res) => {
  const f = db.followUps.find(f => f.id === req.params.id)
  if (!f) { res.status(404).json({ error: 'Not found' }); return }
  f.status = 'done'
  f.completedAt = new Date().toISOString()
  res.json(f)
})

// PATCH /followups/:id/status
router.patch('/:id/status', requireAuth, (req, res) => {
  const f = db.followUps.find(f => f.id === req.params.id)
  if (!f) { res.status(404).json({ error: 'Not found' }); return }
  f.status = req.body.status
  if (req.body.status === 'done') f.completedAt = new Date().toISOString()
  res.json(f)
})

export default router
