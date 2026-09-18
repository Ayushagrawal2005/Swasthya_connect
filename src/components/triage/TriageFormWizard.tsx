/**
 * Triage Form Wizard
 * Multi-step form for structured patient triage before teleconsultation
 * Steps: 1. Chief Complaint, 2. Dynamic Questions, 3. History, 4. Allergies, 5. Medications, 6. Documents & Summary
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X, Save
} from 'lucide-react'
import { ChiefComplaintStep } from './ChiefComplaintStep'
import { DynamicQuestionsStep } from './DynamicQuestionsStep'
import { HistoryTabsStep } from './HistoryTabsStep'
import { AllergiesStep } from './AllergiesStep'
import { MedicationsStep } from './MedicationsStep'
import { DocumentsSummaryStep } from './DocumentsSummaryStep'
import { LanguageSelector } from './LanguageSelector'
import { triageSessionsApi } from '../../services/triageSessionsApi'
import type {
  TriageSession,
  AllergyEntry,
  MedicationEntry,
  PatientHistory,
  TriageQuestionResponse
} from '../../types/teleconsult'

interface Props {
  patientId: string
  sourcePortal: 'patient' | 'asha'
  visitId?: string
  onComplete: (sessionId: string) => void
  onCancel: () => void
}

export function TriageFormWizard({ patientId, sourcePortal, visitId, onComplete, onCancel }: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6
  
  // Language selection
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en')
  
  // Form state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Step 1: Chief Complaint
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [symptomsDescription, setSymptomsDescription] = useState('')
  
  // Step 2: Dynamic Questions
  const [questionResponses, setQuestionResponses] = useState<TriageQuestionResponse[]>([])
  
  // Step 3: History
  const [history, setHistory] = useState<PatientHistory>({
    medical: [],
    medicalNotes: '',
    personal: [],
    personalNotes: '',
    family: [],
    familyNotes: ''
  })
  
  // Step 4: Allergies
  const [allergies, setAllergies] = useState<AllergyEntry[]>([])
  
  // Step 5: Medications
  const [medications, setMedications] = useState<MedicationEntry[]>([])
  
  // Step 6: Documents
  const [documentIds, setDocumentIds] = useState<string[]>([])

  // Create session on mount
  useEffect(() => {
    createSession()
  }, [])

  async function createSession() {
    setLoading(true)
    setError(null)
    try {
      const session = await triageSessionsApi.create({
        patientId,
        sourcePortal,
        visitId
      })
      setSessionId(session.id)
    } catch (err: any) {
      setError(err.message || 'Failed to create triage session')
    } finally {
      setLoading(false)
    }
  }

  // Auto-save draft when moving between steps
  async function saveDraft() {
    if (!sessionId) return
    
    setSaving(true)
    try {
      await triageSessionsApi.update(sessionId, {
        chiefComplaint,
        selectedConditions,
        symptomsDescription,
        questions: questionResponses,
        history,
        allergies,
        medications,
        currentStep,
      })
    } catch (err) {
      console.warn('Auto-save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  function nextStep() {
    if (currentStep < totalSteps) {
      saveDraft()
      setCurrentStep(currentStep + 1)
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  async function handleSubmit() {
    if (!sessionId) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Generate summary
      const { summary } = await triageSessionsApi.generateSummary(sessionId, true)
      
      // Submit triage
      const result = await triageSessionsApi.submit(sessionId, summary.id, true)
      
      // Complete
      onComplete(sessionId)
    } catch (err: any) {
      setError(err.message || 'Failed to submit triage')
      setLoading(false)
    }
  }

  if (loading && !sessionId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-sm text-[#5F5E5A]">Preparing health assessment...</p>
        </div>
      </div>
    )
  }

  if (error && !sessionId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="card p-6 max-w-md space-y-4 text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto" />
          <div>
            <h2 className="font-semibold text-lg text-[#2C2C2A] mb-2">Unable to Start</h2>
            <p className="text-sm text-[#5F5E5A]">{error}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createSession} className="btn-primary flex-1">Retry</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white border-b border-[#D3D1C7] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold text-[#2C2C2A]">Health Assessment</h1>
              <p className="text-xs text-[#5F5E5A]">Step {currentStep} of {totalSteps}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <LanguageSelector
                value={language}
                onChange={setLanguage}
              />
              {saving && (
                <div className="flex items-center gap-2 text-xs text-teal-600">
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </div>
              )}
              <button
                onClick={onCancel}
                className="text-[#5F5E5A] hover:text-[#2C2C2A] p-2"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <ChiefComplaintStep
                chiefComplaint={chiefComplaint}
                setChiefComplaint={setChiefComplaint}
                selectedConditions={selectedConditions}
                setSelectedConditions={setSelectedConditions}
                symptomsDescription={symptomsDescription}
                setSymptomsDescription={setSymptomsDescription}
                sessionId={sessionId}
                language={language}
              />
            )}
            
            {currentStep === 2 && (
              <DynamicQuestionsStep
                sessionId={sessionId!}
                condition={selectedConditions[0] || 'general'}
                chiefComplaint={chiefComplaint}
                responses={questionResponses}
                language={language}
                setResponses={setQuestionResponses}
              />
            )}            
            {currentStep === 3 && (
              <HistoryTabsStep
                history={history}
                setHistory={setHistory}
              />
            )}
            
            {currentStep === 4 && (
              <AllergiesStep
                allergies={allergies}
                setAllergies={setAllergies}
              />
            )}
            
            {currentStep === 5 && (
              <MedicationsStep
                medications={medications}
                setMedications={setMedications}
              />
            )}
            
            {currentStep === 6 && (
              <DocumentsSummaryStep
                sessionId={sessionId!}
                documentIds={documentIds}
                setDocumentIds={setDocumentIds}
                chiefComplaint={chiefComplaint}
                selectedConditions={selectedConditions}
                history={history}
                allergies={allergies}
                medications={medications}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {currentStep < totalSteps && (
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="btn-secondary"
                disabled={saving}
              >
                <ArrowLeft size={18} />
                Previous
              </button>
            )}
            <button
              onClick={nextStep}
              className="btn-primary ml-auto"
              disabled={saving || (currentStep === 1 && !chiefComplaint)}
            >
              Next
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 text-sm">Error</p>
              <p className="text-red-700 text-xs mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-600">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
