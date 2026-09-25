/**
 * Facility Medicine Management Routes
 */

import { Router } from 'express'
import { db } from '../firebase-admin'
import { requireFacilityAuth, requireRole, requireFacilityAccess } from '../middleware/facilityAuth'
import { MedicineInventory, StockEvent } from '../types/facility'
import { Timestamp } from 'firebase-admin/firestore'

const router = Router()

// All routes require facility auth
router.use(requireFacilityAuth)

/**
 * GET /facility/:facilityId/inventory
 * Get medicine inventory for a facility
 */
router.get('/:facilityId/inventory', requireFacilityAccess, async (req, res) => {
  try {
    const { facilityId } = req.params
    const { lowStock, category } = req.query

    let query = db.collection(`facilities/${facilityId}/inventory`)

    if (lowStock === 'true') {
      query = query.where('lowStock', '==', true)
    }
    if (category) {
      query = query.where('category', '==', category)
    }

    const snapshot = await query.get()
    const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    res.json(inventory)
  } catch (error: any) {
    console.error('❌ Get inventory error:', error.message)
    res.status(500).json({ error: 'Failed to get inventory' })
  }
})

/**
 * POST /facility/:facilityId/inventory/:medicineId/verify
 * Verify stock (one-tap stock beacon)
 */
router.post('/:facilityId/inventory/:medicineId/verify', requireFacilityAccess, requireRole('pharmacist', 'facility_admin'), async (req, res) => {
  try {
    const { facilityId, medicineId } = req.params

    const docRef = db.collection(`facilities/${facilityId}/inventory`).doc(medicineId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Medicine not found' })
    }

    const updates = {
      lastVerifiedAt: Timestamp.now(),
      lastVerifiedBy: req.facilityUser!.name || req.facilityUser!.uid,
    }

    await docRef.update(updates)

    // Create stock event
    const medicine = doc.data() as MedicineInventory
    await db.collection(`facilities/${facilityId}/stockEvents`).add({
      medicineId,
      medicineName: medicine.genericName,
      type: 'verified',
      delta: 0,
      beforeQuantity: medicine.totalQuantity,
      afterQuantity: medicine.totalQuantity,
      batchNumber: null,
      reason: 'Daily stock verification',
      prescriptionId: null,
      userId: req.facilityUser!.uid,
      userName: req.facilityUser!.name || 'Unknown',
      facilityId,
      createdAt: Timestamp.now(),
    })

    res.json({ success: true, message: 'Stock verified' })
  } catch (error: any) {
    console.error('❌ Verify stock error:', error.message)
    res.status(500).json({ error: 'Failed to verify stock' })
  }
})

/**
 * PATCH /facility/:facilityId/inventory/:medicineId/adjust
 * Adjust stock quantity
 */
router.patch('/:facilityId/inventory/:medicineId/adjust', requireFacilityAccess, requireRole('pharmacist', 'facility_admin'), async (req, res) => {
  try {
    const { facilityId, medicineId } = req.params
    const { delta, batchNumber, reason } = req.body

    if (delta === undefined || !reason) {
      return res.status(400).json({ error: 'delta and reason required' })
    }

    const docRef = db.collection(`facilities/${facilityId}/inventory`).doc(medicineId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Medicine not found' })
    }

    const medicine = doc.data() as MedicineInventory
    const beforeQuantity = medicine.totalQuantity
    const afterQuantity = beforeQuantity + delta

    if (afterQuantity < 0) {
      return res.status(400).json({ error: 'Cannot reduce stock below zero' })
    }

    // Update batch if specified
    let updatedBatches = medicine.batches
    if (batchNumber && delta !== 0) {
      const batchIndex = updatedBatches.findIndex(b => b.batchNumber === batchNumber)
      if (batchIndex !== -1) {
        updatedBatches[batchIndex].quantity += delta
        // Remove batch if quantity is zero
        if (updatedBatches[batchIndex].quantity <= 0) {
          updatedBatches = updatedBatches.filter((_, i) => i !== batchIndex)
        }
      } else if (delta > 0) {
        // Add new batch
        updatedBatches.push({
          batchNumber,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
          quantity: delta,
        })
      }
    }

    const updates: any = {
      totalQuantity: afterQuantity,
      batches: updatedBatches,
      lowStock: afterQuantity <= medicine.reorderLevel && afterQuantity > 0,
      stockOut: afterQuantity === 0,
      updatedAt: Timestamp.now(),
    }

    await docRef.update(updates)

    // Create stock event
    const eventType = afterQuantity === 0 ? 'stock-out' : 
                      beforeQuantity === 0 ? 'stock-in' : 
                      'adjust'

    await db.collection(`facilities/${facilityId}/stockEvents`).add({
      medicineId,
      medicineName: medicine.genericName,
      type: eventType,
      delta,
      beforeQuantity,
      afterQuantity,
      batchNumber: batchNumber || null,
      reason,
      prescriptionId: null,
      userId: req.facilityUser!.uid,
      userName: req.facilityUser!.name || 'Unknown',
      facilityId,
      createdAt: Timestamp.now(),
    })

    // Audit log
    await db.collection('auditLogs').add({
      userId: req.facilityUser!.uid,
      userName: req.facilityUser!.name || 'Unknown',
      role: req.facilityUser!.role,
      facilityId,
      action: 'update',
      entityType: 'medicine',
      entityId: medicineId,
      before: medicine,
      after: { ...medicine, ...updates },
      reason,
      timestamp: Timestamp.now(),
    })

    res.json({ success: true, newQuantity: afterQuantity })
  } catch (error: any) {
    console.error('❌ Adjust stock error:', error.message)
    res.status(500).json({ error: 'Failed to adjust stock' })
  }
})

/**
 * POST /facility/:facilityId/inventory/:medicineId/dispense
 * Dispense medicine against prescription
 */
router.post('/:facilityId/inventory/:medicineId/dispense', requireFacilityAccess, requireRole('pharmacist', 'facility_admin'), async (req, res) => {
  try {
    const { facilityId, medicineId } = req.params
    const { quantity, prescriptionId, batchNumber } = req.body

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be positive' })
    }

    const docRef = db.collection(`facilities/${facilityId}/inventory`).doc(medicineId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Medicine not found' })
    }

    const medicine = doc.data() as MedicineInventory
    const beforeQuantity = medicine.totalQuantity
    const afterQuantity = beforeQuantity - quantity

    if (afterQuantity < 0) {
      return res.status(400).json({ error: 'Not enough stock available' })
    }

    // Update batch quantities (FIFO - use oldest batch first)
    let remainingToDispense = quantity
    const updatedBatches = [...medicine.batches]
    
    for (let i = 0; i < updatedBatches.length && remainingToDispense > 0; i++) {
      const batch = updatedBatches[i]
      const dispensedFromBatch = Math.min(batch.quantity, remainingToDispense)
      batch.quantity -= dispensedFromBatch
      remainingToDispense -= dispensedFromBatch
    }

    // Remove empty batches
    const finalBatches = updatedBatches.filter(b => b.quantity > 0)

    const updates: any = {
      totalQuantity: afterQuantity,
      batches: finalBatches,
      lowStock: afterQuantity <= medicine.reorderLevel && afterQuantity > 0,
      stockOut: afterQuantity === 0,
      updatedAt: Timestamp.now(),
    }

    await docRef.update(updates)

    // Create stock event
    await db.collection(`facilities/${facilityId}/stockEvents`).add({
      medicineId,
      medicineName: medicine.genericName,
      type: afterQuantity === 0 ? 'stock-out' : 'dispense',
      delta: -quantity,
      beforeQuantity,
      afterQuantity,
      batchNumber: batchNumber || null,
      reason: prescriptionId ? `Dispensed for prescription ${prescriptionId}` : 'Dispensed',
      prescriptionId: prescriptionId || null,
      userId: req.facilityUser!.uid,
      userName: req.facilityUser!.name || 'Unknown',
      facilityId,
      createdAt: Timestamp.now(),
    })

    // Audit log
    await db.collection('auditLogs').add({
      userId: req.facilityUser!.uid,
      userName: req.facilityUser!.name || 'Unknown',
      role: req.facilityUser!.role,
      facilityId,
      action: 'update',
      entityType: 'medicine',
      entityId: medicineId,
      before: medicine,
      after: { ...medicine, ...updates },
      reason: `Dispensed ${quantity} ${medicine.unit}`,
      timestamp: Timestamp.now(),
    })

    res.json({ success: true, newQuantity: afterQuantity })
  } catch (error: any) {
    console.error('❌ Dispense error:', error.message)
    res.status(500).json({ error: 'Failed to dispense medicine' })
  }
})

/**
 * GET /facility/:facilityId/stock-events
 * Get stock events history
 */
router.get('/:facilityId/stock-events', requireFacilityAccess, async (req, res) => {
  try {
    const { facilityId } = req.params
    const { medicineId, limit: limitStr } = req.query

    let query = db.collection(`facilities/${facilityId}/stockEvents`)
      .orderBy('createdAt', 'desc')

    if (medicineId) {
      query = query.where('medicineId', '==', medicineId)
    }

    if (limitStr) {
      query = query.limit(parseInt(limitStr as string))
    } else {
      query = query.limit(50)
    }

    const snapshot = await query.get()
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    res.json(events)
  } catch (error: any) {
    console.error('❌ Get stock events error:', error.message)
    res.status(500).json({ error: 'Failed to get stock events' })
  }
})

export default router
