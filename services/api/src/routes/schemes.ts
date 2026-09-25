/**
 * Government Scheme Checker API Routes
 * 
 * Provides scheme eligibility checking with AI explanations
 * Enforces consent requirements for ASHA/doctor access to patient data
 */

import { Router } from 'express'
import { schemesDb, consentsDb } from '../services/db'
import schemeEligibilityService, {
  type ApplicantInfo,
  type Scheme,
} from '../services/schemeEligibility'
import groqService from '../services/groqService'
import auditLogService from '../services/auditLog'

const router = Router()

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

/**
 * GET /schemes
 * Get all active schemes (optionally filtered by state)
 */
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const { state } = req.query

    let schemes: any[]

    if (state) {
      schemes = await schemesDb.getByState(state as string)
    } else {
      schemes = await schemesDb.getAllActive()
    }

    res.json(schemes)
  } catch (error: any) {
    console.error('Error fetching schemes:', error)
    res.status(500).json({ error: 'Failed to fetch schemes' })
  }
})

/**
 * GET /schemes/:id
 * Get a specific scheme by ID
 */
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params
    const scheme = await schemesDb.findById(id)

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' })
    }

    res.json(scheme)
  } catch (error: any) {
    console.error('Error fetching scheme:', error)
    res.status(500).json({ error: 'Failed to fetch scheme' })
  }
})

/**
 * POST /schemes/check-eligibility
 * Check eligibility for schemes based on applicant info
 * 
 * Body: ApplicantInfo + optional patientId (for ASHA/doctor)
 */
router.post('/check-eligibility', requireAuth, async (req: any, res) => {
  try {
    const { userId, role, patientId: userPatientId, name } = req.user
    const { applicantInfo, patientId: targetPatientId } = req.body as {
      applicantInfo: ApplicantInfo
      patientId?: string
    }

    if (!applicantInfo) {
      return res.status(400).json({ error: 'applicantInfo is required' })
    }

    // Consent check for ASHA/doctor accessing patient data
    if ((role === 'asha' || role === 'doctor') && targetPatientId) {
      const hasConsent = await consentsDb.hasValidConsent(
        targetPatientId,
        userId,
        'Government Scheme Information'
      )

      if (!hasConsent) {
        // Log unauthorized attempt
        await auditLogService.log({
          eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          actorId: userId,
          actorRole: role,
          actorName: name,
          patientId: targetPatientId,
          action: 'check_scheme_eligibility_without_consent',
          success: false,
        })

        return res.status(403).json({
          error: 'Patient consent required to access scheme information',
          consentRequired: true,
        })
      }
    }

    // Audit log - scheme check started
    await auditLogService.log({
      eventType: 'SCHEME_CHECK_STARTED',
      actorId: userId,
      actorRole: role,
      actorName: name,
      patientId: targetPatientId || userPatientId,
      action: 'check_scheme_eligibility',
      success: true,
      metadata: {
        state: applicantInfo.state,
        age: applicantInfo.age,
      },
    })

    // Get active schemes (filter by state if provided)
    let schemes: Scheme[]
    if (applicantInfo.state) {
      schemes = await schemesDb.getByState(applicantInfo.state)
    } else {
      schemes = await schemesDb.getAllActive()
    }

    // Evaluate eligibility using rule engine
    const results = await schemeEligibilityService.evaluateEligibility(applicantInfo, schemes)

    // Filter to show only relevant results
    const relevantResults = schemeEligibilityService.filterRelevantResults(results)

    // Audit log - scheme check completed
    await auditLogService.log({
      eventType: 'SCHEME_CHECK_COMPLETED',
      actorId: userId,
      actorRole: role,
      actorName: name,
      patientId: targetPatientId || userPatientId,
      action: 'check_scheme_eligibility_completed',
      success: true,
      metadata: {
        totalSchemes: schemes.length,
        matchedSchemes: relevantResults.filter(r => r.status === 'LIKELY_ELIGIBLE').length,
        needsVerification: relevantResults.filter(r => r.status === 'NEEDS_VERIFICATION')
          .length,
      },
    })

    res.json({
      results: relevantResults,
      totalEvaluated: schemes.length,
      likelyEligible: relevantResults.filter(r => r.status === 'LIKELY_ELIGIBLE').length,
      needsVerification: relevantResults.filter(r => r.status === 'NEEDS_VERIFICATION').length,
    })
  } catch (error: any) {
    console.error('Error checking eligibility:', error)
    res.status(500).json({ error: 'Failed to check eligibility' })
  }
})

/**
 * POST /schemes/explain
 * Get AI explanation for a scheme match
 * 
 * Body: { schemeId, applicantInfo, language }
 */
router.post('/explain', requireAuth, async (req: any, res) => {
  try {
    const { userId, role, name, patientId } = req.user
    const { schemeId, applicantInfo, language = 'en' } = req.body

    if (!schemeId || !applicantInfo) {
      return res.status(400).json({ error: 'schemeId and applicantInfo required' })
    }

    // Get scheme
    const scheme = await schemesDb.findById(schemeId)

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' })
    }

    // Evaluate eligibility first
    const result = schemeEligibilityService.evaluateSingleScheme(applicantInfo, scheme)

    // Build minimal request for AI (DATA MINIMIZATION)
    const explanationRequest = {
      schemeName: scheme.schemeName,
      schemeDescription: scheme.description,
      benefits: scheme.benefits || [],
      matchedCriteria: result.matchedCriteria,
      missingCriteria: result.missingCriteria,
      requiredDocuments: scheme.requiredDocuments || [],
      // Minimal patient context - NO sensitive data
      patientAge: applicantInfo.age,
      patientState: applicantInfo.state,
      isRural: applicantInfo.isRural,
      annualIncome: applicantInfo.annualIncome,
    }

    // Get AI explanation
    const explanation = await groqService.explainSchemeMatch(explanationRequest, language)

    // Audit log
    await auditLogService.log({
      eventType: 'AI_EXPLANATION_REQUESTED',
      actorId: userId,
      actorRole: role,
      actorName: name,
      patientId,
      action: 'get_scheme_explanation',
      success: true,
      metadata: {
        schemeId,
        schemeName: scheme.schemeName,
        language,
      },
    })

    res.json({
      scheme,
      eligibilityResult: result,
      aiExplanation: explanation,
    })
  } catch (error: any) {
    console.error('Error generating explanation:', error)
    
    // Return deterministic result even if AI fails
    const scheme = await schemesDb.findById(req.body.schemeId)
    if (scheme) {
      const result = schemeEligibilityService.evaluateSingleScheme(req.body.applicantInfo, scheme)
      return res.json({
        scheme,
        eligibilityResult: result,
        aiExplanation: null,
        aiError: 'AI explanation temporarily unavailable',
      })
    }

    res.status(500).json({ error: 'Failed to generate explanation' })
  }
})

/**
 * POST /schemes/compare
 * Compare multiple schemes and get AI recommendations
 */
router.post('/compare', requireAuth, async (req: any, res) => {
  try {
    const { userId, role, name } = req.user
    const { schemeIds, applicantInfo, language = 'en' } = req.body

    if (!schemeIds || !Array.isArray(schemeIds) || schemeIds.length === 0) {
      return res.status(400).json({ error: 'schemeIds array required' })
    }

    // Get schemes
    const schemes = await Promise.all(
      schemeIds.map((id: string) => schemesDb.findById(id))
    )

    const validSchemes = schemes.filter(Boolean) as Scheme[]

    if (validSchemes.length === 0) {
      return res.status(404).json({ error: 'No valid schemes found' })
    }

    // Evaluate all schemes
    const results = await schemeEligibilityService.evaluateEligibility(
      applicantInfo,
      validSchemes
    )

    // Build explanation requests
    const explanationRequests = results.map(r => ({
      schemeName: r.scheme.schemeName,
      schemeDescription: r.scheme.description,
      benefits: r.scheme.benefits || [],
      matchedCriteria: r.matchedCriteria,
      missingCriteria: r.missingCriteria,
      requiredDocuments: r.scheme.requiredDocuments || [],
      patientAge: applicantInfo.age,
      patientState: applicantInfo.state,
      isRural: applicantInfo.isRural,
      annualIncome: applicantInfo.annualIncome,
    }))

    // Get AI comparison
    const comparison = await groqService.compareSchemes(explanationRequests, language)

    res.json({
      schemes: validSchemes,
      eligibilityResults: results,
      comparison,
    })
  } catch (error: any) {
    console.error('Error comparing schemes:', error)
    res.status(500).json({ error: 'Failed to compare schemes' })
  }
})

/**
 * POST /schemes (Admin only)
 * Create a new scheme
 */
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { role } = req.user

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const schemeData = req.body

    // Validation
    if (!schemeData.schemeName || !schemeData.description) {
      return res.status(400).json({ error: 'schemeName and description required' })
    }

    const scheme = await schemesDb.create(schemeData)

    res.status(201).json(scheme)
  } catch (error: any) {
    console.error('Error creating scheme:', error)
    res.status(500).json({ error: 'Failed to create scheme' })
  }
})

/**
 * PUT /schemes/:id (Admin only)
 * Update a scheme
 */
router.put('/:id', requireAuth, async (req: any, res) => {
  try {
    const { role } = req.user
    const { id } = req.params

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const updated = await schemesDb.update(id, req.body)

    if (!updated) {
      return res.status(404).json({ error: 'Scheme not found' })
    }

    res.json(updated)
  } catch (error: any) {
    console.error('Error updating scheme:', error)
    res.status(500).json({ error: 'Failed to update scheme' })
  }
})

export default router
