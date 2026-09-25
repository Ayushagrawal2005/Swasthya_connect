/**
 * Facility Management Routes
 * Handles facility CRUD, staff assignments, transfers, and facility-scoped operations
 */

import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { db } from '../firebase-admin'
import { requireAuth } from '../middleware/auth'

const router = Router()

// ============================================================================
// FACILITY MANAGEMENT
// ============================================================================

/**
 * GET /facilities
 * List all facilities with optional filters
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { type, status, district, state } = req.query

    let facilitiesRef = db.collection('facilities')

    // Apply filters
    if (type) facilitiesRef = facilitiesRef.where('type', '==', type) as any
    if (status) facilitiesRef = facilitiesRef.where('status', '==', status) as any
    if (district) facilitiesRef = facilitiesRef.where('location.district', '==', district) as any
    if (state) facilitiesRef = facilitiesRef.where('location.state', '==', state) as any

    const snapshot = await facilitiesRef.get()
    const facilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    res.json({ facilities, count: facilities.length })
  } catch (error: any) {
    console.error('Error fetching facilities:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /facilities/:id
 * Get single facility details
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const doc = await db.collection('facilities').doc(id).get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Facility not found' })
    }

    res.json({ facility: { id: doc.id, ...doc.data() } })
  } catch (error: any) {
    console.error('Error fetching facility:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /facilities
 * Create new facility (admin only)
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    // Only admins can create facilities
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create facilities' })
    }

    const facilityData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: req.body.status || 'active'
    }

    const docRef = await db.collection('facilities').add(facilityData)
    const newFacility = { id: docRef.id, ...facilityData }

    res.status(201).json({ facility: newFacility })
  } catch (error: any) {
    console.error('Error creating facility:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PATCH /facilities/:id
 * Update facility details
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    // Only admins or facility managers can update
    if (req.user?.role !== 'admin' && req.user?.role !== 'facility-manager') {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    }

    await db.collection('facilities').doc(id).update(updateData)
    const updated = await db.collection('facilities').doc(id).get()

    res.json({ facility: { id: updated.id, ...updated.data() } })
  } catch (error: any) {
    console.error('Error updating facility:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// FACILITY STATISTICS
// ============================================================================

/**
 * GET /facilities/:id/stats
 * Get facility operational statistics
 */
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { date } = req.query
    const today = date || new Date().toISOString().split('T')[0]

    // Get stats from various collections
    const [
      patientsSnap,
      appointmentsSnap,
      referralsOutSnap,
      referralsInSnap,
      inventorySnap,
      staffSnap
    ] = await Promise.all([
      db.collection('patients').where('facilityId', '==', id).get(),
      db.collection('appointments').where('facilityId', '==', id).where('date', '==', today).get(),
      db.collection('referrals').where('fromFacilityId', '==', id).get(),
      db.collection('referrals').where('toFacilityId', '==', id).get(),
      db.collection('inventory').where('facilityId', '==', id).where('quantity', '<=', 10).get(),
      db.collection('staff').where('facilityId', '==', id).where('status', '==', 'active').get()
    ])

    const stats = {
      facilityId: id,
      date: today,
      patientsRegistered: patientsSnap.size,
      appointmentsToday: appointmentsSnap.size,
      referralsOut: referralsOutSnap.size,
      referralsIn: referralsInSnap.size,
      medicinesLowStock: inventorySnap.size,
      staffActive: staffSnap.size
    }

    res.json({ stats })
  } catch (error: any) {
    console.error('Error fetching facility stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// FACILITY STAFF MANAGEMENT
// ============================================================================

/**
 * GET /facilities/:id/staff
 * Get all staff assigned to facility
 */
router.get('/:id/staff', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { type, status } = req.query

    let staffRef = db.collection('staff').where('facilityId', '==', id)

    if (type) staffRef = staffRef.where('staffType', '==', type) as any
    if (status) staffRef = staffRef.where('status', '==', status) as any

    const snapshot = await staffRef.get()
    const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    res.json({ staff, count: staff.length })
  } catch (error: any) {
    console.error('Error fetching facility staff:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /facilities/:id/staff
 * Assign staff to facility
 */
router.post('/:id/staff', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const assignment = {
      facilityId: id,
      ...req.body,
      assignedDate: new Date().toISOString(),
      status: 'active'
    }

    const docRef = await db.collection('staff').add(assignment)
    const newAssignment = { id: docRef.id, ...assignment }

    res.status(201).json({ assignment: newAssignment })
  } catch (error: any) {
    console.error('Error assigning staff:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// FACILITY INVENTORY
// ============================================================================

/**
 * GET /facilities/:id/inventory
 * Get facility medicine inventory
 */
router.get('/:id/inventory', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { lowStock } = req.query

    let inventoryRef = db.collection('inventory').where('facilityId', '==', id)

    if (lowStock === 'true') {
      inventoryRef = inventoryRef.where('quantity', '<=', 10) as any
    }

    const snapshot = await inventoryRef.get()
    const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    res.json({ inventory, count: inventory.length })
  } catch (error: any) {
    console.error('Error fetching facility inventory:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PATCH /facilities/:id/inventory/:itemId
 * Update inventory item quantity
 */
router.patch('/:id/inventory/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params
    const { quantity, operation } = req.body // operation: 'add', 'subtract', 'set'

    const itemDoc = await db.collection('inventory').doc(itemId).get()
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const currentQuantity = itemDoc.data()?.quantity || 0
    let newQuantity = currentQuantity

    if (operation === 'add') newQuantity = currentQuantity + quantity
    else if (operation === 'subtract') newQuantity = Math.max(0, currentQuantity - quantity)
    else if (operation === 'set') newQuantity = quantity

    await db.collection('inventory').doc(itemId).update({
      quantity: newQuantity,
      lastUpdated: new Date().toISOString()
    })

    const updated = await db.collection('inventory').doc(itemId).get()
    res.json({ item: { id: updated.id, ...updated.data() } })
  } catch (error: any) {
    console.error('Error updating inventory:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// FACILITY TRANSFERS
// ============================================================================

/**
 * POST /facilities/:id/transfers
 * Request transfer between facilities
 */
router.post('/:id/transfers', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const transfer = {
      fromFacilityId: id,
      ...req.body,
      requestedBy: req.user?.userId,
      requestedDate: new Date().toISOString(),
      status: 'requested'
    }

    const docRef = await db.collection('transfers').add(transfer)
    const newTransfer = { id: docRef.id, ...transfer }

    res.status(201).json({ transfer: newTransfer })
  } catch (error: any) {
    console.error('Error creating transfer:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /facilities/:id/transfers
 * Get facility transfers (incoming and outgoing)
 */
router.get('/:id/transfers', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { direction } = req.query // 'incoming', 'outgoing', or 'all'

    let transfers: any[] = []

    if (direction === 'incoming' || direction === 'all' || !direction) {
      const incomingSnap = await db.collection('transfers')
        .where('toFacilityId', '==', id)
        .get()
      transfers.push(...incomingSnap.docs.map(doc => ({ id: doc.id, direction: 'incoming', ...doc.data() })))
    }

    if (direction === 'outgoing' || direction === 'all' || !direction) {
      const outgoingSnap = await db.collection('transfers')
        .where('fromFacilityId', '==', id)
        .get()
      transfers.push(...outgoingSnap.docs.map(doc => ({ id: doc.id, direction: 'outgoing', ...doc.data() })))
    }

    res.json({ transfers, count: transfers.length })
  } catch (error: any) {
    console.error('Error fetching transfers:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PATCH /facilities/:id/transfers/:transferId
 * Update transfer status (approve/reject)
 */
router.patch('/:id/transfers/:transferId', requireAuth, async (req, res) => {
  try {
    const { transferId } = req.params
    const { status, notes } = req.body

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    }

    if (status === 'approved') {
      updateData.approvedBy = req.user?.userId
      updateData.approvedDate = new Date().toISOString()
    }

    if (notes) updateData.notes = notes

    await db.collection('transfers').doc(transferId).update(updateData)
    const updated = await db.collection('transfers').doc(transferId).get()

    res.json({ transfer: { id: updated.id, ...updated.data() } })
  } catch (error: any) {
    console.error('Error updating transfer:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// FACILITY ALERTS
// ============================================================================

/**
 * GET /facilities/:id/alerts
 * Get facility alerts
 */
router.get('/:id/alerts', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, severity } = req.query

    let alertsRef = db.collection('alerts').where('facilityId', '==', id)

    if (status) alertsRef = alertsRef.where('status', '==', status) as any
    if (severity) alertsRef = alertsRef.where('severity', '==', severity) as any

    const snapshot = await alertsRef.orderBy('createdAt', 'desc').limit(50).get()
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    res.json({ alerts, count: alerts.length })
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /facilities/:id/alerts
 * Create facility alert
 */
router.post('/:id/alerts', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const alert = {
      facilityId: id,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'active'
    }

    const docRef = await db.collection('alerts').add(alert)
    const newAlert = { id: docRef.id, ...alert }

    res.status(201).json({ alert: newAlert })
  } catch (error: any) {
    console.error('Error creating alert:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PATCH /facilities/:id/alerts/:alertId
 * Resolve or acknowledge alert
 */
router.patch('/:id/alerts/:alertId', requireAuth, async (req, res) => {
  try {
    const { alertId } = req.params
    const { status } = req.body

    const updateData: any = { status }

    if (status === 'resolved') {
      updateData.resolvedAt = new Date().toISOString()
      updateData.resolvedBy = req.user?.userId
    }

    await db.collection('alerts').doc(alertId).update(updateData)
    const updated = await db.collection('alerts').doc(alertId).get()

    res.json({ alert: { id: updated.id, ...updated.data() } })
  } catch (error: any) {
    console.error('Error updating alert:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
