/**
 * Longitudinal Patient Records API
 * Provides searchable, filterable patient history across all care events
 */

import { Router } from 'express'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// ═══════════════════════════════════════════════════════════════
// GET PATIENT LONGITUDINAL RECORDS
// ═══════════════════════════════════════════════════════════════

router.get('/patients/:patientId', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params
    const { recordType, fromDate, toDate, limit = 50, offset = 0 } = req.query
    const user = (req as any).user

    // Authorization
    if (user.role === 'patient' && user.patientId !== patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    let records = db.longitudinalRecords.filter(r => r.patientId === patientId)

    // Filter by type
    if (recordType) {
      records = records.filter(r => r.recordType === recordType)
    }

    // Filter by date range
    if (fromDate) {
      records = records.filter(r => new Date(r.recordDate) >= new Date(fromDate as string))
    }
    if (toDate) {
      records = records.filter(r => new Date(r.recordDate) <= new Date(toDate as string))
    }

    // Sort by date (newest first)
    records.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())

    const total = records.length
    const paginatedRecords = records.slice(Number(offset), Number(offset) + Number(limit))
    const hasMore = Number(offset) + Number(limit) < total

    res.json({
      records: paginatedRecords,
      total,
      hasMore,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error) {
    console.error('Get longitudinal records error:', error)
    res.status(500).json({ error: 'Failed to get longitudinal records' })
  }
})

// ═══════════════════════════════════════════════════════════════
// SEARCH PATIENT LONGITUDINAL RECORDS
// ═══════════════════════════════════════════════════════════════

router.get('/patients/:patientId/search', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params
    const { searchTerm, recordType, fromDate, toDate, limit = 50, offset = 0 } = req.query
    const user = (req as any).user

    // Authorization
    if (user.role === 'patient' && user.patientId !== patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    let records = db.longitudinalRecords.filter(r => r.patientId === patientId)

    // Search in title and summary
    if (searchTerm) {
      const term = (searchTerm as string).toLowerCase()
      records = records.filter(r =>
        r.title.toLowerCase().includes(term) ||
        r.summary.toLowerCase().includes(term) ||
        r.diagnosis?.toLowerCase().includes(term)
      )
    }

    // Filter by type
    if (recordType) {
      records = records.filter(r => r.recordType === recordType)
    }

    // Filter by date range
    if (fromDate) {
      records = records.filter(r => new Date(r.recordDate) >= new Date(fromDate as string))
    }
    if (toDate) {
      records = records.filter(r => new Date(r.recordDate) <= new Date(toDate as string))
    }

    // Sort by relevance (date for now)
    records.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())

    const total = records.length
    const paginatedRecords = records.slice(Number(offset), Number(offset) + Number(limit))
    const hasMore = Number(offset) + Number(limit) < total

    res.json({
      records: paginatedRecords,
      total,
      hasMore,
      offset: Number(offset),
      limit: Number(limit),
      searchTerm,
    })
  } catch (error) {
    console.error('Search longitudinal records error:', error)
    res.status(500).json({ error: 'Failed to search longitudinal records' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET PATIENT DOCUMENTS
// ═══════════════════════════════════════════════════════════════

router.get('/patients/:patientId/documents', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params
    const { documentType, triageSessionId, limit = 50, offset = 0 } = req.query
    const user = (req as any).user

    // Authorization
    if (user.role === 'patient' && user.patientId !== patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    let documents = db.documentUploads.filter(d => d.patientId === patientId)

    // Filter by type
    if (documentType) {
      documents = documents.filter(d => d.documentType === documentType)
    }

    // Filter by triage session
    if (triageSessionId) {
      documents = documents.filter(d => d.triageSessionId === triageSessionId)
    }

    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    const total = documents.length
    const paginatedDocuments = documents.slice(Number(offset), Number(offset) + Number(limit))
    const hasMore = Number(offset) + Number(limit) < total

    res.json({
      documents: paginatedDocuments,
      total,
      hasMore,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error) {
    console.error('Get documents error:', error)
    res.status(500).json({ error: 'Failed to get documents' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET SPECIFIC RECORD DETAILS
// ═══════════════════════════════════════════════════════════════

router.get('/records/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    const record = db.longitudinalRecords.find(r => r.id === id)
    if (!record) {
      return res.status(404).json({ error: 'Record not found' })
    }

    // Authorization
    if (user.role === 'patient' && user.patientId !== record.patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Fetch related records based on type
    let relatedData: any = {}

    switch (record.recordType) {
      case 'triage':
        if (record.triageSessionId) {
          relatedData.triageSession = db.triageSessionsExtended.find(t => t.id === record.triageSessionId)
          relatedData.summary = db.triageSummaries.find(s => s.triageSessionId === record.triageSessionId)
        }
        break
      case 'teleconsult':
        if (record.teleconsultQueueId) {
          relatedData.queueEntry = db.teleconsultQueue.find(q => q.id === record.teleconsultQueueId)
        }
        if (record.consultationNotesId) {
          relatedData.consultationNotes = db.consultationNotes.find(c => c.id === record.consultationNotesId)
        }
        break
      case 'referral':
        if (record.referralId) {
          relatedData.referral = db.referrals.find(r => r.id === record.referralId)
        }
        break
      case 'follow-up':
        if (record.followUpId) {
          relatedData.followUp = db.followUps.find(f => f.id === record.followUpId)
        }
        break
      case 'appointment':
        if (record.appointmentId) {
          relatedData.appointment = db.appointments.find(a => a.id === record.appointmentId)
        }
        break
      case 'document':
        if (record.documentId) {
          relatedData.document = db.documentUploads.find(d => d.id === record.documentId)
        }
        break
    }

    res.json({
      record,
      relatedData,
    })
  } catch (error) {
    console.error('Get record details error:', error)
    res.status(500).json({ error: 'Failed to get record details' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET PATIENT TIMELINE (condensed view)
// ═══════════════════════════════════════════════════════════════

router.get('/patients/:patientId/timeline', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params
    const { limit = 20 } = req.query
    const user = (req as any).user

    // Authorization
    if (user.role === 'patient' && user.patientId !== patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    let records = db.longitudinalRecords
      .filter(r => r.patientId === patientId)
      .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
      .slice(0, Number(limit))

    // Simplified timeline view
    const timeline = records.map(r => ({
      id: r.id,
      date: r.recordDate,
      type: r.recordType,
      title: r.title,
      summary: r.summary.substring(0, 150) + (r.summary.length > 150 ? '...' : ''),
      riskLevel: r.riskLevel,
      createdBy: r.createdByRole,
    }))

    res.json({ timeline })
  } catch (error) {
    console.error('Get timeline error:', error)
    res.status(500).json({ error: 'Failed to get timeline' })
  }
})

export default router
