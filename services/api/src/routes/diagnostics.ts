import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, DiagOrder } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /diagnostics?facilityId=&status=&q=
router.get('/', requireAuth, (req, res) => {
  let orders = db.diagOrders
  if (req.query.facilityId) orders = orders.filter(o => o.facilityId === req.query.facilityId)
  if (req.query.status)     orders = orders.filter(o => o.status === req.query.status)
  if (req.query.patientId)  orders = orders.filter(o => o.patientId === req.query.patientId)
  const q = String(req.query.q || '').toLowerCase()
  if (q) orders = orders.filter(o => o.patientName.toLowerCase().includes(q) || o.test.toLowerCase().includes(q))
  res.json(orders.sort((a, b) => b.date.localeCompare(a.date)))
})

// POST /diagnostics/orders
router.post('/orders', requireAuth, (req, res) => {
  const { patientId, patientName, testName, facilityId } = req.body as Record<string, string>
  const order: DiagOrder = {
    id: uuid(),
    patientId: patientId || '',
    patientName: patientName || '',
    test: testName,
    orderedBy: req.user!.name,
    facilityId: facilityId || req.user!.facilityId,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: 'ordered',
    available: true,
  }
  db.diagOrders.push(order)
  res.status(201).json(order)
})

// PATCH /diagnostics/:id/status
router.patch('/:id/status', requireAuth, (req, res) => {
  const order = db.diagOrders.find(o => o.id === req.params.id)
  if (!order) { res.status(404).json({ error: 'Not found' }); return }
  order.status = req.body.status
  if (req.body.result)   order.result = req.body.result
  if (req.body.flagged !== undefined) order.flagged = req.body.flagged
  res.json(order)
})

export default router
