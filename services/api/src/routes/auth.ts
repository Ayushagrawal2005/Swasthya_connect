import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../store/index.js'
import { JWT_SECRET, requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /auth/login
router.post('/login', (req, res) => {
  console.log('🔐 Login attempt:', JSON.stringify(req.body, null, 2))
  
  const { username, email, password } = req.body as { username?: string; email?: string; password: string }
  const loginIdentifier = username || email
  
  console.log('📧 Login identifier:', loginIdentifier)
  console.log('🔑 Password provided:', password ? '✓' : '✗')
  
  if (!loginIdentifier || !password) {
    console.error('❌ Missing credentials')
    res.status(400).json({ error: 'Email/username and password required' })
    return
  }

  // Find user by email (username is mapped to email for demo accounts)
  console.log('🔍 Searching for user with email:', loginIdentifier)
  console.log('👥 Available users:', db.users.map(u => ({ email: u.email, role: u.role })))
  
  const user = db.users.find(u => u.email === loginIdentifier && u.passwordHash === password)
  
  if (!user) {
    console.error('❌ User not found or password mismatch')
    console.log('   Tried:', loginIdentifier, '/', password)
    console.log('   Available:', db.users.map(u => `${u.email}/${u.passwordHash}`))
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  console.log('✅ User found:', user.name, '-', user.role)
  
  const payload = { userId: user.id, role: user.role, name: user.name, facilityId: user.facilityId, patientId: user.patientId }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })

  console.log('🎫 Token generated successfully')
  
  res.json({ token, user: { id: user.id, username: user.email, role: user.role, name: user.name, facilityId: user.facilityId, patientId: user.patientId } })
})

// GET /auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router
