import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, Referral } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'
import { broadcast } from '../ws/server.js'

const router = Router()

// GET /referrals  (with optional filters)
router.get('/', requireAuth, (req, res) => {
  let refs = db.referrals
  if (req.query.patientId)    refs = refs.filter(r => r.patientId === req.query.patientId)
  if (req.query.createdBy)    refs = refs.filter(r => r.createdBy === req.query.createdBy)
  if (req.query.toFacilityId) refs = refs.filter(r => r.toFacilityId === req.query.toFacilityId)
  if (req.query.status)       refs = refs.filter(r => r.status === req.query.status)
  res.json(refs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
})

// GET /referrals/incoming?doctorId=  (referrals to the doctor's facility)
router.get('/incoming', requireAuth, (req, res) => {
  const user = req.user!
  const facility = db.facilities.find(f => f.id === user.facilityId)
  if (!facility) { res.json([]); return }
  const refs = db.referrals.filter(r => r.toFacilityId === user.facilityId && r.status === 'pending')
  res.json(refs)
})

// GET /referrals/outgoing?createdBy=
router.get('/outgoing', requireAuth, (req, res) => {
  const refs = db.referrals.filter(r => r.createdBy === req.user!.userId)
  res.json(refs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
})

// POST /referrals
router.post('/', requireAuth, (req, res) => {
  const { patientId, patientName, toFacilityId, toFacilityName, reason, urgency } = req.body as Record<string, string>
  if (!patientName || !toFacilityName || !reason || !urgency) {
    res.status(400).json({ error: 'patientName, toFacilityName, reason, urgency required' })
    return
  }

  const ref: Referral = {
    id: uuid(),
    patientId: patientId || '',
    patientName,
    fromFacilityId: req.user!.facilityId,
    toFacilityId: toFacilityId || '',
    toFacilityName,
    reason,
    urgency: urgency as Referral['urgency'],
    status: 'pending',
    createdBy: req.user!.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.referrals.push(ref)

  // Broadcast to doctor's referral inbox
  broadcast('referral:new', ref)

  res.status(201).json(ref)
})

// PATCH /referrals/:id/accept
router.patch('/:id/accept', requireAuth, (req, res) => {
  const ref = db.referrals.find(r => r.id === req.params.id)
  if (!ref) { res.status(404).json({ error: 'Not found' }); return }
  ref.status = 'accepted'
  ref.updatedAt = new Date().toISOString()
  broadcast('referral:updated', ref)
  res.json(ref)
})

// PATCH /referrals/:id/redirect
router.patch('/:id/redirect', requireAuth, (req, res) => {
  const ref = db.referrals.find(r => r.id === req.params.id)
  if (!ref) { res.status(404).json({ error: 'Not found' }); return }
  ref.status = 'redirected'
  if (req.body.toFacilityName) ref.toFacilityName = req.body.toFacilityName
  ref.updatedAt = new Date().toISOString()
  broadcast('referral:updated', ref)
  res.json(ref)
})

// PATCH /referrals/:id/status
router.patch('/:id/status', requireAuth, (req, res) => {
  const ref = db.referrals.find(r => r.id === req.params.id)
  if (!ref) { res.status(404).json({ error: 'Not found' }); return }
  ref.status = req.body.status
  ref.updatedAt = new Date().toISOString()
  broadcast('referral:updated', ref)
  res.json(ref)
})

export default router
