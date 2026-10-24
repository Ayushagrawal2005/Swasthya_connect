import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../store/index.js'
import { JWT_SECRET, requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, email, password } = req.body as { username?: string; email?: string; password: string }
  const loginIdentifier = username || email
  
  if (!loginIdentifier || !password) {
    res.status(400).json({ error: 'Email/username and password required' })
    return
  }

  // Find user by email (username is mapped to email for demo accounts)
  const user = db.users.find(u => u.email === loginIdentifier && u.passwordHash === password)
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const payload = { userId: user.id, role: user.role, name: user.name, facilityId: user.facilityId, patientId: user.patientId }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })

  res.json({ token, user: { id: user.id, username: user.email, role: user.role, name: user.name, facilityId: user.facilityId, patientId: user.patientId } })
})

// GET /auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router
