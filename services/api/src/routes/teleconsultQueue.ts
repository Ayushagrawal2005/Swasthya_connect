/**
 * Teleconsult Queue API
 * Manages teleconsultation queue with priority-based routing
 */

import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// ═══════════════════════════════════════════════════════════════
// GET TELECONSULT QUEUE
// Priority order: emergency → urgent → priority → standard → routine
// ═══════════════════════════════════════════════════════════════

router.get('/queue', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { status, doctorId } = req.query

    let queue = db.teleconsultQueue.filter(q => {
      if (status && q.status !== status) return false
      if (doctorId && q.assignedDoctorId !== doctorId) return false
      return true
    })

    // Sort by priority and queue time
    const priorityOrder = { emergency: 0, urgent: 1, priority: 2, standard: 3, routine: 4 }
    queue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()
    })

    res.json({ queue })
  } catch (error) {
    console.error('Get queue error:', error)
    res.status(500).json({ error: 'Failed to get teleconsult queue' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET QUEUE STATUS FOR PATIENT
// ═══════════════════════════════════════════════════════════════

router.get('/queue/status/:patientId', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params
    const user = (req as any).user

    // Authorization
    if (user.role === 'patient' && user.patientId !== patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const activeQueue = db.teleconsultQueue.find(
      q => q.patientId === patientId && (q.status === 'waiting' || q.status === 'called' || q.status === 'in-progress')
    )

    if (!activeQueue) {
      return res.json({ inQueue: false })
    }

    // Calculate position in queue
    const waitingQueue = db.teleconsultQueue
      .filter(q => q.status === 'waiting')
      .sort((a, b) => {
        const priorityOrder = { emergency: 0, urgent: 1, priority: 2, standard: 3, routine: 4 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()
      })

    const position = waitingQueue.findIndex(q => q.id === activeQueue.id) + 1

    res.json({
      inQueue: true,
      queueEntry: activeQueue,
      position: position > 0 ? position : 0,
      totalWaiting: waitingQueue.length,
    })
  } catch (error) {
    console.error('Get queue status error:', error)
    res.status(500).json({ error: 'Failed to get queue status' })
  }
})

// ═══════════════════════════════════════════════════════════════
// DOCTOR CALLS NEXT PATIENT
// ═══════════════════════════════════════════════════════════════

router.post('/queue/:id/call', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    if (user.role !== 'doctor' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only doctors can call patients' })
    }

    const queueEntry = db.teleconsultQueue.find(q => q.id === id)
    if (!queueEntry) {
      return res.status(404).json({ error: 'Queue entry not found' })
    }

    if (queueEntry.status !== 'waiting') {
      return res.status(400).json({ error: 'Patient is not in waiting status' })
    }

    const now = new Date().toISOString()
    queueEntry.status = 'called'
    queueEntry.calledAt = now
    queueEntry.assignedDoctorId = user.id
    queueEntry.assignedDoctorName = user.name

    // Notify patient
    const notification: any = {
      id: uuid(),
      userId: queueEntry.patientId,
      type: 'system',
      title: 'Doctor is Ready',
      message: `Dr. ${user.name} is ready for your teleconsultation. Please join now.`,
      read: false,
      actionUrl: `/patient/teleconsult/${queueEntry.id}`,
      relatedId: queueEntry.id,
      relatedType: 'teleconsult' as any,
      createdAt: now,
    }
    db.notifications.push(notification)

    res.json({ queueEntry, message: 'Patient called successfully' })
  } catch (error) {
    console.error('Call patient error:', error)
    res.status(500).json({ error: 'Failed to call patient' })
  }
})

// ═══════════════════════════════════════════════════════════════
// START TELECONSULTATION
// ═══════════════════════════════════════════════════════════════

router.post('/queue/:id/start', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    const queueEntry = db.teleconsultQueue.find(q => q.id === id)
    if (!queueEntry) {
      return res.status(404).json({ error: 'Queue entry not found' })
    }

    if (queueEntry.status === 'in-progress') {
      return res.json({ queueEntry, message: 'Consultation already in progress' })
    }

    if (queueEntry.status !== 'called' && queueEntry.status !== 'waiting') {
      return res.status(400).json({ error: 'Invalid queue status' })
    }

    const now = new Date().toISOString()
    queueEntry.status = 'in-progress'
    queueEntry.startedAt = now

    if (!queueEntry.assignedDoctorId) {
      queueEntry.assignedDoctorId = user.id
      queueEntry.assignedDoctorName = user.name
    }

    res.json({ queueEntry, message: 'Consultation started' })
  } catch (error) {
    console.error('Start consultation error:', error)
    res.status(500).json({ error: 'Failed to start consultation' })
  }
})

// ═══════════════════════════════════════════════════════════════
// COMPLETE TELECONSULTATION (creates follow-up)
// ═══════════════════════════════════════════════════════════════

router.post('/queue/:id/complete', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { notes } = req.body
    const user = (req as any).user

    if (user.role !== 'doctor' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only doctors can complete consultations' })
    }

    const queueEntry = db.teleconsultQueue.find(q => q.id === id)
    if (!queueEntry) {
      return res.status(404).json({ error: 'Queue entry not found' })
    }

    if (queueEntry.status === 'completed') {
      return res.status(400).json({ error: 'Consultation already completed' })
    }

    const now = new Date().toISOString()
    queueEntry.status = 'completed'
    queueEntry.completedAt = now

    // Save consultation notes if provided
    if (notes) {
      const consultationNotes: any = {
        id: uuid(),
        teleconsultQueueId: queueEntry.id,
        triageSessionId: queueEntry.triageSessionId,
        patientId: queueEntry.patientId,
        doctorId: user.id,
        clinicalImpression: notes.clinicalImpression || '',
        diagnosis: notes.diagnosis,
        notes: notes.notes || '',
        prescription: notes.prescription || [],
        advice: notes.advice || '',
        followUpRequired: notes.followUpRequired !== false,
        followUpDate: notes.followUpDate,
        followUpNotes: notes.followUpNotes,
        referralRequired: notes.referralRequired || false,
        referralFacilityId: notes.referralFacilityId,
        referralReason: notes.referralReason,
        createdAt: now,
        updatedAt: now,
      }

      db.consultationNotes.push(consultationNotes)

      // Create longitudinal record
      const longitudinalRecord: any = {
        id: uuid(),
        patientId: queueEntry.patientId,
        recordType: 'teleconsult',
        teleconsultQueueId: queueEntry.id,
        consultationNotesId: consultationNotes.id,
        triageSessionId: queueEntry.triageSessionId,
        title: `Teleconsultation: ${queueEntry.chiefComplaint}`,
        summary: consultationNotes.clinicalImpression,
        createdBy: user.id,
        createdByRole: 'doctor',
        diagnosis: consultationNotes.diagnosis,
        medications: consultationNotes.prescription,
        recordDate: now,
        createdAt: now,
      }

      db.longitudinalRecords.push(longitudinalRecord)

      // Auto-create follow-up (default 2 days, or custom date)
      if (consultationNotes.followUpRequired) {
        const followUpDate = consultationNotes.followUpDate || 
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Find ASHA worker who initiated the triage
        const triageSession = db.triageSessionsExtended.find(t => t.id === queueEntry.triageSessionId)
        const ashaWorker = triageSession ? db.users.find(u => u.id === triageSession.initiatedBy && u.role === 'asha') : null

        const patient = db.patients.find(p => p.id === queueEntry.patientId)

        // Check for duplicate follow-ups
        const existingFollowUp = db.followUps.find(
          f => f.patientId === queueEntry.patientId &&
            f.sourceId === queueEntry.id &&
            f.status !== 'cancelled'
        )

        if (!existingFollowUp) {
          const followUp: any = {
            id: uuid(),
            patientId: queueEntry.patientId,
            patientName: queueEntry.patientName,
            age: queueEntry.age,
            phone: patient?.phone || '',
            condition: consultationNotes.diagnosis || queueEntry.chiefComplaint,
            risk: queueEntry.riskLevel,
            dueDate: followUpDate,
            status: 'upcoming',
            notes: consultationNotes.followUpNotes || 'Post-teleconsultation follow-up',
            nextStep: 'Phone follow-up',
            lastVisit: now.split('T')[0],
            assignedTo: ashaWorker?.id || user.id,
            assignedToName: ashaWorker?.name || user.name,
            createdBy: user.id,
            createdByName: user.name,
            sourcePortal: 'teleconsultation',
            sourceId: queueEntry.id,
            reminderSchedule: [followUpDate],
            createdAt: now,
            updatedAt: now,
          }

          db.followUps.push(followUp)

          // Notify ASHA worker
          if (ashaWorker) {
            const notification: any = {
              id: uuid(),
              userId: ashaWorker.id,
              type: 'followup-created',
              title: 'New Follow-up Assigned',
              message: `Follow-up for ${queueEntry.patientName} assigned for ${followUpDate}`,
              read: false,
              actionUrl: `/asha/followups`,
              relatedId: followUp.id,
              relatedType: 'followup',
              createdAt: now,
            }
            db.notifications.push(notification)
          }
        }
      }

      // Create referral if required
      if (consultationNotes.referralRequired && consultationNotes.referralFacilityId) {
        const facility = db.facilities.find(f => f.id === consultationNotes.referralFacilityId)
        const referral: any = {
          id: uuid(),
          patientId: queueEntry.patientId,
          patientName: queueEntry.patientName,
          fromFacilityId: user.facilityId,
          toFacilityId: consultationNotes.referralFacilityId,
          toFacilityName: facility?.name || 'Unknown Facility',
          reason: consultationNotes.referralReason || 'Specialist review required',
          urgency: queueEntry.riskLevel === 'high' || queueEntry.riskLevel === 'emergency' ? 'urgent' : 'routine',
          status: 'pending',
          createdBy: user.id,
          createdAt: now,
          updatedAt: now,
        }

        db.referrals.push(referral)
      }
    }

    // Notify patient
    const notification: any = {
      id: uuid(),
      userId: queueEntry.patientId,
      type: 'system',
      title: 'Consultation Completed',
      message: 'Your teleconsultation has been completed. You can view the prescription and advice in your health records.',
      read: false,
      actionUrl: '/patient/health-records',
      relatedId: queueEntry.id,
      relatedType: 'teleconsult' as any,
      createdAt: now,
    }
    db.notifications.push(notification)

    res.json({
      queueEntry,
      followUpCreated: true,
      message: 'Consultation completed successfully. Follow-up created.',
    })
  } catch (error) {
    console.error('Complete consultation error:', error)
    res.status(500).json({ error: 'Failed to complete consultation' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET TRIAGE SUMMARY FOR DOCTOR
// ═══════════════════════════════════════════════════════════════

router.get('/queue/:id/summary', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    if (user.role !== 'doctor' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only doctors can view summaries' })
    }

    const queueEntry = db.teleconsultQueue.find(q => q.id === id)
    if (!queueEntry) {
      return res.status(404).json({ error: 'Queue entry not found' })
    }

    const summary = db.triageSummaries.find(s => s.id === queueEntry.summaryId)
    const triageSession = db.triageSessionsExtended.find(t => t.id === queueEntry.triageSessionId)
    const patient = db.patients.find(p => p.id === queueEntry.patientId)

    res.json({
      queueEntry,
      summary,
      triageSession,
      patient,
    })
  } catch (error) {
    console.error('Get summary error:', error)
    res.status(500).json({ error: 'Failed to get summary' })
  }
})

export default router
