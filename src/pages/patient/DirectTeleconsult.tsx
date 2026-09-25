/**
 * Direct Teleconsultation with Structured Triage
 * eSanjeevani-style workflow: Triage → Summary → Queue → Consultation
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardList, Activity, AlertCircle, ArrowRight, ArrowLeft,
  Video, Clock
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TriageFormWizard } from '../../components/triage/TriageFormWizard'
import { QueueStatusCard } from '../../components/teleconsult/QueueStatusCard'

type WorkflowStep = 'intro' | 'form-triage' | 'queue' | 'consultation'

export function DirectTeleconsultPage() {
  const navigate = useNavigate()
  const { patientId } = useApp()
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('intro')
  const [triageSessionId, setTriageSessionId] = useState<string | null>(null)
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null)

  // Intro screen - explain the process
  if (currentStep === 'intro') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="card p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100">
                <Video size={32} className="text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#2C2C2A]">
                Direct Teleconsultation
              </h1>
              <p className="text-[#5F5E5A] text-sm max-w-md mx-auto">
                Connect with a doctor online after completing a quick health assessment with voice and text support
              </p>
            </div>

            {/* Process Steps */}
            <div className="space-y-3 py-4">
              <ProcessStep
                icon={<ClipboardList size={20} />}
                number={1}
                title="Health Assessment"
                description="Answer 5-7 questions with voice or text input - questions will be spoken aloud"
                duration="~5 min"
              />
              <ProcessStep
                icon={<Activity size={20} />}
                number={2}
                title="AI Summary"
                description="System creates a summary for the doctor to review"
                duration="~1 min"
              />
              <ProcessStep
                icon={<Clock size={20} />}
                number={3}
                title="Queue"
                description="Join the consultation queue based on urgency"
                duration="Variable"
              />
              <ProcessStep
                icon={<Video size={20} />}
                number={4}
                title="Video Consultation"
                description="Connect with doctor via video call"
                duration="~15 min"
              />
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Your health information is protected</p>
                  <p className="text-xs text-blue-800">
                    All data is encrypted and only shared with your assigned doctor. Your triage
                    responses help the doctor understand your condition better.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1 justify-center"
              >
                <ArrowLeft size={18} />
                Cancel
              </button>
              <button
                onClick={() => setCurrentStep('form-triage')}
                className="btn-primary flex-1 justify-center"
              >
                Start Assessment
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Form Triage
  if (currentStep === 'form-triage') {
    return (
      <TriageFormWizard
        patientId={patientId || ''}
        sourcePortal="patient"
        onComplete={(sessionId) => {
          setTriageSessionId(sessionId)
          setCurrentStep('queue')
        }}
        onCancel={() => setCurrentStep('intro')}
      />
    )
  }

  // Queue Status
  if (currentStep === 'queue') {
    return (
      <QueueStatusCard
        triageSessionId={triageSessionId || ''}
        patientId={patientId || ''}
        onConsultationStart={(queueId) => {
          setQueueEntryId(queueId)
          // Navigate to actual teleconsult page
          navigate('/patient/teleconsult')
        }}
      />
    )
  }

  return null
}

// Helper component for process steps
function ProcessStep({
  icon,
  number,
  title,
  description,
  duration,
}: {
  icon: React.ReactNode
  number: number
  title: string
  description: string
  duration: string
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-[#D3D1C7] bg-white hover:border-teal-300 hover:bg-teal-50/30 transition-colors">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-600 font-semibold flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-teal-600">{icon}</div>
          <h3 className="font-semibold text-[#2C2C2A] text-sm">{title}</h3>
          <span className="ml-auto text-xs text-[#5F5E5A] flex-shrink-0">{duration}</span>
        </div>
        <p className="text-xs text-[#5F5E5A] leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
