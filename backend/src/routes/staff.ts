import { Router } from 'express'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /staff  — facilities with their doctors
router.get('/', requireAuth, (req, res) => {
  const facilities = db.facilities.map(f => ({
    ...f,
    doctors: db.doctors.filter(d => d.facilityId === f.id),
  }))
  res.json(facilities)
})

// PATCH /staff/doctors/:id/availability
router.patch('/doctors/:id/availability', requireAuth, (req, res) => {
  const doc = db.doctors.find(d => d.id === req.params.id)
  if (!doc) { res.status(404).json({ error: 'Not found' }); return }
  if (req.body.available  !== undefined) doc.available   = req.body.available
  if (req.body.slotsToday !== undefined) doc.slotsToday  = req.body.slotsToday
  res.json(doc)
})

export default router
