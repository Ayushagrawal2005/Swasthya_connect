import { Router } from 'express'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'
import { createNotification } from '../services/notifications.js'

const router = Router()

// GET /notifications — get notifications for current user
router.get('/', requireAuth, (req, res) => {
  const userId = req.user!.userId
  const notifications = db.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
  res.json(notifications.slice(0, limit))
})

// GET /notifications/unread-count
router.get('/unread-count', requireAuth, (req, res) => {
  const userId = req.user!.userId
  const count = db.notifications.filter(n => n.userId === userId && !n.read).length
  res.json({ count })
})

// PATCH /notifications/:id/read
router.patch('/:id/read', requireAuth, (req, res) => {
  const notif = db.notifications.find(n => n.id === req.params.id)
  if (!notif) return res.status(404).json({ error: 'Not found' })
  if (notif.userId !== req.user!.userId) return res.status(403).json({ error: 'Forbidden' })
  
  notif.read = true
  res.json(notif)
})

// PATCH /notifications/mark-all-read
router.patch('/mark-all-read', requireAuth, (req, res) => {
  const userId = req.user!.userId
  db.notifications
    .filter(n => n.userId === userId && !n.read)
    .forEach(n => n.read = true)
  
  res.json({ success: true })
})

// POST /notifications/send (admin only - for testing)
router.post('/send', requireAuth, (req, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }
  
  const notif = createNotification(
    req.body.userId,
    req.body.type || 'system',
    req.body.title,
    req.body.message,
    req.body.options
  )
  
  res.status(201).json(notif)
})

export default router
