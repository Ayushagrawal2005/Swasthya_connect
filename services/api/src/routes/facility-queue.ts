/**
 * Facility Queue Management Routes
 */

import { Router } from 'express'
import { db } from '../firebase-admin'
import { requireFacilityAuth, requireRole, requireFacilityAccess } from '../middleware/facilityAuth'
import { logCreate, logUpdate } from '../services/auditLog'
import { QueueEntry, QueueStatus } from '../types/facility'
import { Timestamp } from 'firebase-admin/firestore'

const router = Router()

// All routes require facility auth
router.use(requireFacilityAuth)

/**
 * GET /facility/:facilityId/queue
 * Get queue entries for a facility
 */
router.get('/:facilityId/queue', requireFacilityAccess, async (req, res) => {
  try {
    const { facilityId } = req.params
    const { status, date } = req.query

    let query = db.collection(`facilities/${facilityId}/queue`)
      .orderBy('priority', 'asc')
      .orderBy('createdAt', 'asc')

    if (status) {
      query = query.where('status', '==', status)
    }

    const snapshot = await query.get()
    const queue = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    res.json(queue)
  } catch (error: any) {
    console.error('❌ Get queue error:', error.message)
    res.status(500).json({ error: 'Failed to get queue' })
  }
})

/**
 * POST /facility/:facilityId/queue/checkin
 * Check-in a patient (from appointment or walk-in)
 */
router.post('/:facilityId/queue/checkin', requireFacilityAccess, requireRole('queue_desk', 'facility_admin'), async (req, res) => {
  try {
    const { facilityId } = req.params
    const { patientId, patientName, patientIdentifier, triageColour, doctorId, doctorName, source, appointmentId } = req.body

    if (!patientId || !patientName || !triageColour) {
      return res.status(400).json({ error: 'patientId, patientName, and triageColour required' })
    }

    // Generate token number
    const todaySnapshot = await db.collection(`facilities/${facilityId}/queue`)
      .where('status', 'in', ['waiting', 'in-consultation'])
      .get()
    const tokenNumber = `T${String(todaySnapshot.size + 1).padStart(3, '0')}`

    // Calculate priority (1=red, 2=yellow, 3=green)
    const priority = triageColour === 'red' ? 1 : triageColour === 'yellow' ? 2 : 3

    // Calculate estimated wait time
    const waitingBefore = todaySnapshot.docs.filter(doc => {
      const data = doc.data()
      return data.status === 'waiting' && data.priority <= priority
    }).length
    const estimatedWaitMinutes = waitingBefore * 15 // 15 min per patient

    const entry: Omit<QueueEntry, 'id'> = {
      tokenNumber,
      patientId,
      patientName,
      patientIdentifier: patientIdentifier || patientId,
      triageColour,
      department: 'General',
      doctorId: doctorId || null,
      doctorName: doctorName || null,
      status: 'waiting',
      priority,
      manualPriorityOverride: false,
      overrideReason: null,
      createdAt: Timestamp.now(),
      calledAt: null,
      completedAt: null,
      waitTimeMinutes: 0,
      estimatedWaitMinutes,
      notificationSent: false,
      source: source || 'walk-in',
      appointmentId: appointmentId || null,
    }

    const docRef = await db.collection(`facilities/${facilityId}/queue`).add(entry)

    // Audit log
    await logCreate(
      req.facilityUser!.uid,
      req.facilityUser!.name || 'Unknown',
      req.facilityUser!.role,
      facilityId,
      'queue',
      docRef.id,
      entry
    )

    // TODO: Emit Socket.IO event

    res.json({ id: docRef.id, ...entry, createdAt: entry.createdAt.toDate().toISOString() })
  } catch (error: any) {
    console.error('❌ Check-in error:', error.message)
    res.status(500).json({ error: 'Failed to check-in patient' })
  }
})

/**
 * PATCH /facility/:facilityId/queue/:tokenId/call-next
 * Call next patient (move to in-consultation)
 */
router.patch('/:facilityId/queue/:tokenId/call-next', requireFacilityAccess, requireRole('queue_desk', 'facility_admin'), async (req, res) => {
  try {
    const { facilityId, tokenId } = req.params

    const docRef = db.collection(`facilities/${facilityId}/queue`).doc(tokenId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Queue entry not found' })
    }

    const before = doc.data()

    const updates = {
      status: 'in-consultation',
      calledAt: Timestamp.now(),
    }

    await docRef.update(updates)

    // Audit log
    await logUpdate(
      req.facilityUser!.uid,
      req.facilityUser!.name || 'Unknown',
      req.facilityUser!.role,
      facilityId,
      'queue',
      tokenId,
      before,
      { ...before, ...updates }
    )

    // TODO: Emit Socket.IO event
    // TODO: Send SMS notification

    res.json({ id: tokenId, ...before, ...updates })
  } catch (error: any) {
    console.error('❌ Call next error:', error.message)
    res.status(500).json({ error: 'Failed to call next patient' })
  }
})

/**
 * PATCH /facility/:facilityId/queue/:tokenId/complete
 * Mark consultation as complete
 */
router.patch('/:facilityId/queue/:tokenId/complete', requireFacilityAccess, requireRole('queue_desk', 'facility_admin', 'doctor'), async (req, res) => {
  try {
    const { facilityId, tokenId } = req.params

    const docRef = db.collection(`facilities/${facilityId}/queue`).doc(tokenId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Queue entry not found' })
    }

    const before = doc.data()

    const updates = {
      status: 'completed',
      completedAt: Timestamp.now(),
    }

    await docRef.update(updates)

    // Audit log
    await logUpdate(
      req.facilityUser!.uid,
      req.facilityUser!.name || 'Unknown',
      req.facilityUser!.role,
      facilityId,
      'queue',
      tokenId,
      before,
      { ...before, ...updates }
    )

    // TODO: Emit Socket.IO event

    res.json({ id: tokenId, ...before, ...updates })
  } catch (error: any) {
    console.error('❌ Complete error:', error.message)
    res.status(500).json({ error: 'Failed to mark as complete' })
  }
})

/**
 * PATCH /facility/:facilityId/queue/:tokenId/priority
 * Manually override priority (requires reason)
 */
router.patch('/:facilityId/queue/:tokenId/priority', requireFacilityAccess, requireRole('facility_admin'), async (req, res) => {
  try {
    const { facilityId, tokenId } = req.params
    const { priority, reason } = req.body

    if (!priority || !reason) {
      return res.status(400).json({ error: 'priority and reason required' })
    }

    const docRef = db.collection(`facilities/${facilityId}/queue`).doc(tokenId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Queue entry not found' })
    }

    const before = doc.data()

    const updates = {
      priority,
      manualPriorityOverride: true,
      overrideReason: reason,
    }

    await docRef.update(updates)

    // Audit log (use override action)
    await logUpdate(
      req.facilityUser!.uid,
      req.facilityUser!.name || 'Unknown',
      req.facilityUser!.role,
      facilityId,
      'queue',
      tokenId,
      before,
      { ...before, ...updates }
    )

    res.json({ id: tokenId, ...before, ...updates })
  } catch (error: any) {
    console.error('❌ Priority override error:', error.message)
    res.status(500).json({ error: 'Failed to override priority' })
  }
})

// Audit log service (simplified for now)
async function logCreate(userId: string, userName: string, role: string, facilityId: string, entityType: string, entityId: string, data: any) {
  try {
    await db.collection('auditLogs').add({
      userId,
      userName,
      role,
      facilityId,
      action: 'create',
      entityType,
      entityId,
      before: null,
      after: data,
      reason: null,
      timestamp: Timestamp.now(),
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}

async function logUpdate(userId: string, userName: string, role: string, facilityId: string, entityType: string, entityId: string, before: any, after: any) {
  try {
    await db.collection('auditLogs').add({
      userId,
      userName,
      role,
      facilityId,
      action: 'update',
      entityType,
      entityId,
      before,
      after,
      reason: null,
      timestamp: Timestamp.now(),
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}

export default router
