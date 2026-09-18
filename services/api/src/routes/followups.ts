import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, type FollowUp } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'
import { notifyFollowUpCreated, notifyFollowUpCompleted, notifyFollowUpEscalated } from '../services/notifications.js'

const router = Router()

// POST /followups — create new followup with auto-assignment and notifications
router.post('/', requireAuth, (req, res) => {
  const now = new Date().toISOString()
  const dueDate = req.body.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  
  // Auto-assign to ASHA if not specified
  let assignedTo = req.body.assignedTo
  let assignedToName = req.body.assignedToName
  if (!assignedTo) {
    const asha = db.users.find(u => u.role === 'asha')
    if (asha) {
      assignedTo = asha.id
      assignedToName = asha.name
    }
  }

  // Auto-generate reminder schedule: 1 day before + on due date
  const dayBefore = new Date(new Date(dueDate).getTime() - 86400000).toISOString().split('T')[0]
  const reminderSchedule = [dayBefore, dueDate]

  const followUp: FollowUp = {
    id: uuid(),
    patientId: req.body.patientId,
    patientName: req.body.patientName,
    age: req.body.age || 0,
    phone: req.body.phone || '',
    condition: req.body.condition,
    risk: req.body.risk || 'medium',
    dueDate,
    status: 'upcoming',
    notes: req.body.notes || '',
    nextStep: req.body.nextStep || '',
    lastVisit: req.body.lastVisit || now.split('T')[0],
    assignedTo,
    assignedToName,
    createdBy: req.user!.userId,
    createdByName: req.user!.name,
    sourcePortal: req.body.sourcePortal || 'system',
    sourceId: req.body.sourceId,
    reminderSchedule,
    createdAt: now,
    updatedAt: now,
  }

  db.followUps.push(followUp)
  
  // Send notifications
  notifyFollowUpCreated(followUp)
  
  res.status(201).json(followUp)
})

// GET /followups?assignedTo=&status=&patientId=&sourcePortal=
router.get('/', requireAuth, (req, res) => {
  let fups = db.followUps
  if (req.query.assignedTo) fups = fups.filter(f => f.assignedTo === req.query.assignedTo)
  if (req.query.status)     fups = fups.filter(f => f.status === req.query.status)
  if (req.query.patientId)  fups = fups.filter(f => f.patientId === req.query.patientId)
  if (req.query.sourcePortal) fups = fups.filter(f => f.sourcePortal === req.query.sourcePortal)
  
  // default: return assigned to current user (for ASHA/doctor view)
  if (!req.query.assignedTo && !req.query.patientId && req.user!.role !== 'admin') {
    fups = fups.filter(f => f.assignedTo === req.user!.userId || f.patientId === req.user!.userId)
  }
  
  res.json(fups)
})

// GET /followups/:id
router.get('/:id', requireAuth, (req, res) => {
  const f = db.followUps.find(f => f.id === req.params.id)
  if (!f) return res.status(404).json({ error: 'Not found' })
  res.json(f)
})

// PATCH /followups/:id/complete
router.patch('/:id/complete', requireAuth, (req, res) => {
  const f = db.followUps.find(f => f.id === req.params.id)
  if (!f) return res.status(404).json({ error: 'Not found' })
  
  f.status = 'completed'
  f.completedAt = new Date().toISOString()
  f.completedBy = req.user!.userId
  f.completionNotes = req.body.notes || ''
  f.updatedAt = new Date().toISOString()
  
  notifyFollowUpCompleted(f)
  
  res.json(f)
})

// PATCH /followups/:id/escalate
router.patch('/:id/escalate', requireAuth, (req, res) => {
  const f = db.followUps.find(f => f.id === req.params.id)
  if (!f) return res.status(404).json({ error: 'Not found' })
  
  f.status = 'escalated'
  f.escalatedAt = new Date().toISOString()
  f.escalatedTo = req.body.escalatedTo
  f.escalationReason = req.body.reason || 'Escalation required'
  f.updatedAt = new Date().toISOString()
  
  notifyFollowUpEscalated(f)
  
  res.json(f)
})

// PATCH /followups/:id/status
router.patch('/:id/status', requireAuth, (req, res) => {
  const f = db.followUps.find(f => f.id === req.params.id)
  if (!f) return res.status(404).json({ error: 'Not found' })
  
  f.status = req.body.status
  f.updatedAt = new Date().toISOString()
  
  if (req.body.status === 'completed') {
    f.completedAt = new Date().toISOString()
    f.completedBy = req.user!.userId
    notifyFollowUpCompleted(f)
  }
  
  res.json(f)
})

// PATCH /followups/:id/done (legacy compatibility)
router.patch('/:id/done', requireAuth, (req, res) => {
  const f = db.followUps.find(f => f.id === req.params.id)
  if (!f) return res.status(404).json({ error: 'Not found' })
  
  f.status = 'completed'
  f.completedAt = new Date().toISOString()
  f.completedBy = req.user!.userId
  f.updatedAt = new Date().toISOString()
  
  notifyFollowUpCompleted(f)
  
  res.json(f)
})

export default router
