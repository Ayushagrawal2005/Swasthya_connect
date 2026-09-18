/**
 * Triage Sessions API
 * Handles structured triage with dynamic questions, history, and document collection
 */

import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'
import {
  generateDynamicQuestions,
  generateKeywordSuggestions,
  generateTriageSummary,
} from '../services/geminiQuestions.js'
import { orchestratePostTriageCare } from '../services/careOrchestration.js'

const router = Router()

// ═══════════════════════════════════════════════════════════════
// CREATE TRIAGE SESSION
// ═══════════════════════════════════════════════════════════════

router.post('/sessions', requireAuth, async (req, res) => {
  try {
    const { patientId, visitId, sourcePortal } = req.body
    const user = (req as any).user

    // Validate
    if (!patientId || !sourcePortal) {
      return res.status(400).json({ error: 'patientId and sourcePortal required' })
    }

    // Authorization: patient can only create for themselves, ASHA can create for assigned patients
    if (user.role === 'patient' && user.patientId !== patientId) {
      return res.status(403).json({ error: 'Cannot create triage for another patient' })
    }

    const now = new Date().toISOString()
    const session: any = {
      id: uuid(),
      patientId,
      visitId: visitId || undefined,
      initiatedBy: user.id,
      sourcePortal,
      chiefComplaint: '',
      selectedConditions: [],
      symptomsDescription: '',
      questions: [],
      vitals: {},
      history: {
        medical: [],
        medicalNotes: '',
        personal: [],
        personalNotes: '',
        family: [],
        familyNotes: '',
      },
      allergies: [],
      medications: [],
      documentIds: [],
      summaryId: undefined,
      summaryText: '',
      riskLevel: undefined,
      riskScore: 0,
      confidence: 0,
      triggeredFlags: [],
      hospitalLevel: 0,
      hospitalLevelLabel: '',
      hospitalLevelDesc: '',
      recommendedFacilityId: '',
      recommendedFacilityName: '',
      recommendedAction: '',
      status: 'draft',
      currentStep: 1,
      totalSteps: 6,
      createdAt: now,
      updatedAt: now,
      submittedAt: undefined,
    }

    db.triageSessionsExtended.push(session)

    res.json({ session })
  } catch (error) {
    console.error('Create triage session error:', error)
    res.status(500).json({ error: 'Failed to create triage session' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET TRIAGE SESSION
// ═══════════════════════════════════════════════════════════════

router.get('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    const session = db.triageSessionsExtended.find(s => s.id === id)
    if (!session) {
      return res.status(404).json({ error: 'Triage session not found' })
    }

    // Authorization
    if (user.role === 'patient' && user.patientId !== session.patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    res.json({ session })
  } catch (error) {
    console.error('Get triage session error:', error)
    res.status(500).json({ error: 'Failed to get triage session' })
  }
})

// ═══════════════════════════════════════════════════════════════
// SAVE/UPDATE TRIAGE ANSWERS
// ═══════════════════════════════════════════════════════════════

router.patch('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const user = (req as any).user
    const updates = req.body

    const session = db.triageSessionsExtended.find(s => s.id === id)
    if (!session) {
      return res.status(404).json({ error: 'Triage session not found' })
    }

    // Authorization
    if (user.role === 'patient' && user.patientId !== session.patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (session.status === 'submitted') {
      return res.status(400).json({ error: 'Cannot modify submitted triage' })
    }

    // Update fields
    if (updates.chiefComplaint !== undefined) session.chiefComplaint = updates.chiefComplaint
    if (updates.selectedConditions !== undefined) session.selectedConditions = updates.selectedConditions
    if (updates.symptomsDescription !== undefined) session.symptomsDescription = updates.symptomsDescription
    if (updates.questions !== undefined) session.questions = updates.questions
    if (updates.vitals !== undefined) session.vitals = { ...session.vitals, ...updates.vitals }
    if (updates.history !== undefined) session.history = { ...session.history, ...updates.history }
    if (updates.allergies !== undefined) session.allergies = updates.allergies
    if (updates.medications !== undefined) session.medications = updates.medications
    if (updates.documentIds !== undefined) session.documentIds = updates.documentIds
    if (updates.currentStep !== undefined) session.currentStep = updates.currentStep
    if (updates.status !== undefined) session.status = updates.status

    session.updatedAt = new Date().toISOString()

    res.json({ session })
  } catch (error) {
    console.error('Update triage session error:', error)
    res.status(500).json({ error: 'Failed to update triage session' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET DYNAMIC QUESTIONS (Gemini-powered)
// ═══════════════════════════════════════════════════════════════

router.post('/sessions/:id/questions', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { condition, chiefComplaint, existingAnswers, maxQuestions, language } = req.body

    const session = db.triageSessionsExtended.find(s => s.id === id)
    if (!session) {
      return res.status(404).json({ error: 'Triage session not found' })
    }

    const questions = await generateDynamicQuestions(
      condition || session.selectedConditions[0] || 'general',
      chiefComplaint || session.chiefComplaint,
      existingAnswers || session.questions,
      maxQuestions || 7,
      language || 'en'
    )

    res.json({ questions })
  } catch (error) {
    console.error('Generate questions error:', error)
    res.status(500).json({ error: 'Failed to generate questions' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET KEYWORD SUGGESTIONS (Gemini-powered)
// ═══════════════════════════════════════════════════════════════

router.post('/sessions/:id/keywords', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { condition, chiefComplaint, language } = req.body

    const session = db.triageSessionsExtended.find(s => s.id === id)
    if (!session) {
      return res.status(404).json({ error: 'Triage session not found' })
    }

    const result = await generateKeywordSuggestions(
      condition || session.selectedConditions[0] || 'general',
      chiefComplaint || session.chiefComplaint,
      language || 'en'
    )

    res.json(result)
  } catch (error) {
    console.error('Generate keywords error:', error)
    res.status(500).json({ error: 'Failed to generate keywords' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GENERATE SUMMARY (AI-assisted)
// ═══════════════════════════════════════════════════════════════

router.post('/sessions/:id/summary', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { useAI, language } = req.body
    const user = (req as any).user

    const session = db.triageSessionsExtended.find(s => s.id === id)
    if (!session) {
      return res.status(404).json({ error: 'Triage session not found' })
    }

    // Get patient details (from in-memory store or fall back to JWT info)
    const patient = db.patients.find(p => p.id === session.patientId) as any
    const patientAge = patient?.age ?? user.age ?? 0
    const patientGender = patient?.gender ?? user.gender ?? 'unknown'

    // Generate summary using Gemini (or rule-based fallback)
    const summaryResult = await generateTriageSummary(
      patientAge,
      patientGender,
      session.chiefComplaint,
      session.selectedConditions,
      session.questions,
      session.history,
      session.allergies,
      session.medications,
      session.vitals,
      language || 'en'
    )

    // Create summary record
    const now = new Date().toISOString()
    const summary: any = {
      id: uuid(),
      triageSessionId: session.id,
      patientId: session.patientId,
      chiefComplaint: session.chiefComplaint,
      suspectedConditions: session.selectedConditions,
      symptoms: [], // Extract from answers
      duration: '',
      severity: '',
      redFlags: summaryResult.redFlags,
      medicalHistory: session.history.medical,
      personalHistory: session.history.personal,
      familyHistory: session.history.family,
      allergies: session.allergies,
      medications: session.medications,
      uploadedDocumentIds: session.documentIds,
      documentSummary: '',
      riskLevel: session.riskLevel || 'low',
      riskScore: session.riskScore || 0,
      confidence: summaryResult.confidence,
      summaryText: summaryResult.summaryText,
      aiAssisted: useAI !== false,
      reviewedBy: undefined,
      reviewedAt: undefined,
      recommendedAction: session.recommendedAction || 'Standard teleconsultation',
      recommendedFacilityId: session.recommendedFacilityId,
      recommendedFacilityName: session.recommendedFacilityName,
      createdAt: now,
      updatedAt: now,
    }

    db.triageSummaries.push(summary)

    // Update session
    session.summaryId = summary.id
    session.summaryText = summary.summaryText
    session.updatedAt = now

    res.json({ summary, aiAssisted: summary.aiAssisted })
  } catch (error) {
    console.error('Generate summary error:', error)
    res.status(500).json({ error: 'Failed to generate summary' })
  }
})

// ═══════════════════════════════════════════════════════════════
// SUBMIT TRIAGE (triggers care orchestration)
// ═══════════════════════════════════════════════════════════════

router.post('/sessions/:id/submit', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { summaryId, confirmed } = req.body
    const user = (req as any).user

    const session = db.triageSessionsExtended.find(s => s.id === id)
    if (!session) {
      return res.status(404).json({ error: 'Triage session not found' })
    }

    if (!summaryId || !confirmed) {
      return res.status(400).json({ error: 'Summary must be confirmed before submission' })
    }

    const summary = db.triageSummaries.find(s => s.id === summaryId)
    if (!summary || summary.triageSessionId !== session.id) {
      return res.status(400).json({ error: 'Invalid summary' })
    }

    if (session.status === 'submitted') {
      return res.status(400).json({ error: 'Triage already submitted' })
    }

    const now = new Date().toISOString()
    session.status = 'submitted'
    session.submittedAt = now
    session.updatedAt = now

    // Get patient (from in-memory store or fall back to user JWT info)
    const patient = db.patients.find(p => p.id === session.patientId) as any
    const patientName = patient?.name ?? user.name ?? 'Patient'
    const patientAge = patient?.age ?? user.age ?? 0
    const patientGender = patient?.gender ?? user.gender ?? 'unknown'
    const patientPhone = patient?.phone ?? user.phone ?? ''

    // Determine risk-based priority
    let priority: 'routine' | 'standard' | 'priority' | 'urgent' | 'emergency' = 'standard'
    switch (session.riskLevel) {
      case 'low':
        priority = 'standard'
        break
      case 'medium':
        priority = 'priority'
        break
      case 'high':
        priority = 'urgent'
        break
      case 'emergency':
        priority = 'emergency'
        break
    }

    // Create teleconsult queue entry
    const queueEntry: any = {
      id: uuid(),
      triageSessionId: session.id,
      patientId: session.patientId,
      patientName: patientName,
      age: patientAge,
      gender: patientGender,
      priority,
      token: `TC-${Date.now().toString().slice(-6)}`,
      estimatedWaitMinutes: priority === 'emergency' ? 0 : priority === 'urgent' ? 10 : priority === 'priority' ? 20 : 30,
      assignedDoctorId: undefined,
      assignedDoctorName: undefined,
      status: 'waiting',
      chiefComplaint: session.chiefComplaint,
      riskLevel: session.riskLevel || 'low',
      redFlags: summary.redFlags,
      summaryId: summary.id,
      queuedAt: now,
      calledAt: undefined,
      startedAt: undefined,
      completedAt: undefined,
    }

    db.teleconsultQueue.push(queueEntry)

    // Create longitudinal record
    const longitudinalRecord: any = {
      id: uuid(),
      patientId: session.patientId,
      recordType: 'triage',
      triageSessionId: session.id,
      teleconsultQueueId: queueEntry.id,
      title: `Triage: ${session.chiefComplaint}`,
      summary: summary.summaryText,
      createdBy: user.id,
      createdByRole: user.role,
      riskLevel: session.riskLevel,
      recordDate: now,
      createdAt: now,
    }

    db.longitudinalRecords.push(longitudinalRecord)

    // Trigger care orchestration (creates appointments, referrals, escalations as needed)
    try {
      await orchestratePostTriageCare({
        triageId: session.id,
        patientId: session.patientId,
        patientName: patientName,
        age: patientAge,
        phone: patientPhone,
        score: session.riskScore || 0,
        level: session.riskLevel || 'low',
        triggeredFlags: session.triggeredFlags,
        autoEscalate: session.riskLevel === 'emergency',
        hospitalLevel: session.hospitalLevel,
        hospitalLevelLabel: session.hospitalLevelLabel,
        requestingUserId: user.id,
        requestingUserName: user.name,
      })
    } catch (orchError) {
      console.error('Care orchestration warning:', orchError)
      // Don't fail submission if orchestration has issues
    }

    res.json({
      triageSession: session,
      queueEntry,
      followUpCreated: false, // Will be created after teleconsult completion
      message: 'Triage submitted successfully. Added to teleconsultation queue.',
    })
  } catch (error) {
    console.error('Submit triage error:', error)
    res.status(500).json({ error: 'Failed to submit triage' })
  }
})

// ═══════════════════════════════════════════════════════════════
// GET PATIENT TRIAGE HISTORY
// ═══════════════════════════════════════════════════════════════

router.get('/patients/:patientId/history', requireAuth, async (req, res) => {
  try {
    const { patientId } = req.params
    const user = (req as any).user

    // Authorization
    if (user.role === 'patient' && user.patientId !== patientId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const sessions = db.triageSessionsExtended
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({ sessions })
  } catch (error) {
    console.error('Get triage history error:', error)
    res.status(500).json({ error: 'Failed to get triage history' })
  }
})

export default router
