import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, Appointment } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const TIME_SLOTS = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM','03:30 PM']

// GET /appointments/facilities
router.get('/facilities', requireAuth, (req, res) => {
  const facilities = db.facilities.map(f => ({
    ...f,
    doctors: db.doctors.filter(d => d.facilityId === f.id),
  }))
  res.json(facilities)
})

// GET /appointments/facilities/:id/slots?date=
router.get('/facilities/:id/slots', requireAuth, (req, res) => {
  const { date } = req.query as { date: string }
  const doctors = db.doctors.filter(d => d.facilityId === req.params.id && d.available)
  const booked = db.appointments.filter(a => a.facilityId === req.params.id && a.date === date).map(a => a.time)
  const available = TIME_SLOTS.filter(s => !booked.includes(s))
  res.json({ date, slots: available, doctors })
})

// POST /appointments
router.post('/', requireAuth, (req, res) => {
  const { patientId, patientName, facilityId, doctorId, date, time } = req.body as Record<string, string>
  if (!patientName || !facilityId || !doctorId || !date || !time) {
    res.status(400).json({ error: 'patientName, facilityId, doctorId, date, time required' })
    return
  }

  const queueToday = db.appointments.filter(a => a.facilityId === facilityId && a.date === date).length
  const appt: Appointment = {
    id: uuid(),
    patientId: patientId || '',
    patientName,
    facilityId,
    doctorId,
    bookedBy: req.user!.userId,
    date,
    time,
    type: req.body.type || 'in-person',
    status: 'scheduled',
    queuePosition: queueToday + 1,
    estimatedWait: queueToday * 15,
    token: `T-${String(queueToday + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
  }

  db.appointments.push(appt)

  // Update doctor slot count
  const doc = db.doctors.find(d => d.id === doctorId)
  if (doc && doc.slotsToday > 0) doc.slotsToday--

  res.status(201).json(appt)
})

// GET /appointments?patientId= or ?bookedBy=
router.get('/', requireAuth, (req, res) => {
  let appts = db.appointments
  if (req.query.patientId) appts = appts.filter(a => a.patientId === req.query.patientId)
  if (req.query.bookedBy)  appts = appts.filter(a => a.bookedBy === req.query.bookedBy)
  if (req.query.facilityId) appts = appts.filter(a => a.facilityId === req.query.facilityId)
  if (req.query.date)      appts = appts.filter(a => a.date === req.query.date)
  res.json(appts.sort((a, b) => a.time.localeCompare(b.time)))
})

// PATCH /appointments/:id/status
router.patch('/:id/status', requireAuth, (req, res) => {
  const appt = db.appointments.find(a => a.id === req.params.id)
  if (!appt) { res.status(404).json({ error: 'Not found' }); return }
  appt.status = req.body.status
  res.json(appt)
})

export default router
