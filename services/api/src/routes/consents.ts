/**
 * Consent Management API Routes
 * 
 * Handles patient consent for data sharing
 * Enforces strict ownership and authorization checks
 */

import { Router } from 'express'
import { consentsDb } from '../services/db'
import auditLogService from '../services/auditLog'

const router = Router()

// Middleware to verify authenticated user (imported from existing middleware)
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

/**
 * GET /consents
 * Get all consents for the authenticated patient
 */
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const { userId, role, patientId } = req.user

    // Only patients can view their own consents
    // Or ASHA/doctors can view consents where they are the recipient
    let consents: any[] = []

    if (role === 'patient') {
      if (!patientId) {
        return res.status(400).json({ error: 'Patient ID not found' })
      }
      const includeHistory = req.query.history === 'true'
      consents = await consentsDb.getByPatient(patientId, includeHistory)
    } else if (role === 'asha' || role === 'doctor') {
      // Get consents where this user is the recipient
      const allConsents = await consentsDb.getByPatient('', true) // This needs refinement
      consents = allConsents.filter((c: any) => c.recipientId === userId)
    } else {
      return res.status(403).json({ error: 'Unauthorized role' })
    }

    res.json(consents)
  } catch (error: any) {
    console.error('Error fetching consents:', error)
    res.status(500).json({ error: 'Failed to fetch consents' })
  }
})

/**
 * GET /consents/:id
 * Get a specific consent by ID
 */
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const { userId, role, patientId } = req.user
    const { id } = req.params

    const consent = await consentsDb.findById(id)

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' })
    }

    // Verify ownership or recipient access
    if (role === 'patient' && consent.patientId !== patientId) {
      return res.status(403).json({ error: 'Unauthorized access' })
    }

    if ((role === 'asha' || role === 'doctor') && consent.recipientId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' })
    }

    res.json(consent)
  } catch (error: any) {
    console.error('Error fetching consent:', error)
    res.status(500).json({ error: 'Failed to fetch consent' })
  }
})

/**
 * POST /consents
 * Create a new consent
 */
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { userId, role, patientId, name } = req.user

    // Only patients can grant consent
    if (role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can grant consent' })
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID not found' })
    }

    const {
      recipientId,
      recipientRole,
      recipientName,
      dataCategory,
      purpose,
      durationDays,
    } = req.body

    // Validation
    if (!recipientId || !recipientRole || !dataCategory || !purpose) {
      return res.status(400).json({
        error: 'recipientId, recipientRole, dataCategory, and purpose are required',
      })
    }

    // Calculate expiry date
    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Create consent
    const consentData = {
      patientId,
      grantedBy: userId,
      recipientId,
      recipientRole,
      recipientName: recipientName || '',
      dataCategory,
      purpose,
      status: 'ACTIVE',
      grantedAt: new Date().toISOString(),
      expiresAt,
      revokedAt: null,
      revokedBy: null,
    }

    const consent = await consentsDb.create(consentData)

    // Audit log
    await auditLogService.log({
      eventType: 'CONSENT_GRANTED',
      actorId: userId,
      actorRole: role,
      actorName: name,
      patientId,
      resourceId: consent.id,
      resourceType: 'consent',
      action: 'grant_consent',
      purpose,
      success: true,
      metadata: {
        recipientId,
        recipientRole,
        dataCategory,
        expiresAt,
      },
    })

    res.status(201).json(consent)
  } catch (error: any) {
    console.error('Error creating consent:', error)
    res.status(500).json({ error: 'Failed to create consent' })
  }
})

/**
 * PATCH /consents/:id/revoke
 * Revoke a consent
 */
router.patch('/:id/revoke', requireAuth, async (req: any, res) => {
  try {
    const { userId, role, patientId, name } = req.user
    const { id } = req.params

    // Only patients can revoke their own consents
    if (role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can revoke consent' })
    }

    const consent = await consentsDb.findById(id)

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' })
    }

    // Verify ownership
    if (consent.patientId !== patientId) {
      return res.status(403).json({ error: 'Unauthorized: not your consent' })
    }

    // Check if already revoked
    if (consent.status === 'REVOKED') {
      return res.status(400).json({ error: 'Consent already revoked' })
    }

    // Revoke consent
    const updated = await consentsDb.revokeConsent(id, userId)

    // Audit log
    await auditLogService.log({
      eventType: 'CONSENT_REVOKED',
      actorId: userId,
      actorRole: role,
      actorName: name,
      patientId,
      resourceId: id,
      resourceType: 'consent',
      action: 'revoke_consent',
      success: true,
      metadata: {
        dataCategory: consent.dataCategory,
        recipientId: consent.recipientId,
      },
    })

    res.json(updated)
  } catch (error: any) {
    console.error('Error revoking consent:', error)
    res.status(500).json({ error: 'Failed to revoke consent' })
  }
})

/**
 * POST /consents/check
 * Check if valid consent exists for data access
 * Used by backend services to enforce consent
 */
router.post('/check', requireAuth, async (req: any, res) => {
  try {
    const { userId, role } = req.user
    const { patientId, dataCategory } = req.body

    if (!patientId || !dataCategory) {
      return res.status(400).json({ error: 'patientId and dataCategory required' })
    }

    // Check if user has valid consent
    const hasConsent = await consentsDb.hasValidConsent(patientId, userId, dataCategory)

    // Audit log for access attempt
    await auditLogService.log({
      eventType: hasConsent ? 'PATIENT_DATA_ACCESSED' : 'UNAUTHORIZED_ACCESS_ATTEMPT',
      actorId: userId,
      actorRole: role,
      patientId,
      action: 'check_consent',
      success: hasConsent,
      metadata: { dataCategory },
    })

    res.json({ hasConsent, patientId, dataCategory })
  } catch (error: any) {
    console.error('Error checking consent:', error)
    res.status(500).json({ error: 'Failed to check consent' })
  }
})

/**
 * GET /consents/history/:patientId
 * Get complete consent history for a patient
 * Admin/auditing purposes
 */
router.get('/history/:patientId', requireAuth, async (req: any, res) => {
  try {
    const { role, patientId: userPatientId } = req.user
    const { patientId } = req.params

    // Only the patient themselves or admins can view history
    if (role !== 'admin' && userPatientId !== patientId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const history = await consentsDb.getByPatient(patientId, true)

    res.json(history)
  } catch (error: any) {
    console.error('Error fetching consent history:', error)
    res.status(500).json({ error: 'Failed to fetch consent history' })
  }
})

export default router
