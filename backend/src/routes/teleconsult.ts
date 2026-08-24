import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, TeleconsultSession } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /teleconsult/available-doctors
router.get('/available-doctors', requireAuth, (req, res) => {
  const available = db.doctors.filter(d => d.available)
  res.json(available.map(d => ({
    ...d,
    facility: db.facilities.find(f => f.id === d.facilityId)?.name || '',
  })))
})

// POST /teleconsult/initiate
router.post('/initiate', requireAuth, (req, res) => {
  const { patientId, doctorId } = req.body as Record<string, string>
  const sessionId = uuid()
  const session: TeleconsultSession = {
    id: sessionId,
    patientId: patientId || '',
    doctorId: doctorId || db.doctors[0].id,
    initiatedBy: req.user!.userId,
    roomToken: `room_${sessionId.replace(/-/g,'').slice(0,12)}`,
    startedAt: new Date().toISOString(),
    status: 'waiting',
  }
  db.teleconsultSessions.push(session)
  res.status(201).json({ sessionId: session.id, roomToken: session.roomToken, callUrl: `/teleconsult/room/${session.roomToken}` })
})

// POST /teleconsult/:sessionId/notes
router.post('/:sessionId/notes', requireAuth, (req, res) => {
  const session = db.teleconsultSessions.find(s => s.id === req.params.sessionId)
  if (!session) { res.status(404).json({ error: 'Session not found' }); return }
  session.notes = req.body.consultationNotes
  session.prescription = req.body.prescription
  session.endedAt = new Date().toISOString()
  session.status = 'ended'

  // Also save as a visit record
  if (session.patientId) {
    db.visits.push({
      id: uuid(),
      patientId: session.patientId,
      date: new Date().toISOString().split('T')[0],
      facility: db.facilities.find(f => f.id === db.doctors.find(d => d.id === session.doctorId)?.facilityId)?.name || 'PHC',
      tier: 'phc',
      worker: req.user!.name,
      type: 'visit',
      title: 'Teleconsultation',
      detail: req.body.consultationNotes || '',
    })
  }

  res.json({ savedAt: session.endedAt, sessionId: session.id })
})

// GET /teleconsult/sessions
router.get('/sessions', requireAuth, (req, res) => {
  let sessions = db.teleconsultSessions
  if (req.query.patientId) sessions = sessions.filter(s => s.patientId === req.query.patientId)
  if (req.query.doctorId)  sessions = sessions.filter(s => s.doctorId  === req.query.doctorId)
  res.json(sessions)
})

export default router
