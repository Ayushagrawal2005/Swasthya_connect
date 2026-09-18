import { Router } from 'express'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /inventory?facilityId=
router.get('/', requireAuth, (req, res) => {
  let items = db.stock
  if (req.query.facilityId) items = items.filter(s => s.facilityId === req.query.facilityId)
  else items = items.filter(s => s.facilityId === req.user!.facilityId)
  res.json(items)
})

// PATCH /inventory/:id
router.patch('/:id', requireAuth, (req, res) => {
  const item = db.stock.find(s => s.id === req.params.id)
  if (!item) { res.status(404).json({ error: 'Not found' }); return }
  if (req.body.current  !== undefined) item.current  = req.body.current
  if (req.body.lastRestocked) item.lastRestocked = req.body.lastRestocked
  item.critical = item.current < item.threshold
  res.json(item)
})

// POST /inventory/:id/reorder
router.post('/:id/reorder', requireAuth, (req, res) => {
  const item = db.stock.find(s => s.id === req.params.id)
  if (!item) { res.status(404).json({ error: 'Not found' }); return }
  console.log(`📦 Reorder request: ${item.name} — qty ${req.body.quantity || 'standard'} by ${req.user!.name}`)
  res.json({ ordered: true, item: item.name, requestedBy: req.user!.name })
})

// POST /inventory/bulk-reorder
router.post('/bulk-reorder', requireAuth, (req, res) => {
  const { items } = req.body as { items: string[] }
  const names = items.map(id => db.stock.find(s => s.id === id)?.name).filter(Boolean)
  console.log(`📦 Bulk reorder: ${names.join(', ')} by ${req.user!.name}`)
  res.json({ ordered: true, count: names.length, items: names })
})

export default router
