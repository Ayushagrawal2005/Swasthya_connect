/**
 * ASHA Direct Teleconsultation
 * Same eSanjeevani-style flow as patient portal, but ASHA worker
 * searches for + links a patient before starting the triage wizard.
 *
 * Flow:
 *   1. Search & select patient
 *   2. Confirm patient + show brief summary
 *   3. Triage wizard (sourcePortal = 'asha')
 *   4. Queue status
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, UserCheck, ArrowRight, ArrowLeft, Video,
  ClipboardList, Activity, Clock, Loader2, AlertCircle,
  User, Heart, X, CheckCircle,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { patientsApi, type PatientRecord } from '../../services/api'
import { TriageFormWizard } from '../../components/triage/TriageFormWizard'
import { QueueStatusCard } from '../../components/teleconsult/QueueStatusCard'

type Step = 'search' | 'confirm' | 'triage' | 'queue'

export function AshaDirectTeleconsultPage() {
  const navigate = useNavigate()
  const { userId } = useApp()

  const [step, setStep] = useState<Step>('search')

  // Patient search state
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<PatientRecord[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)

  // Post-triage state
  const [triageSessionId, setTriageSessionId] = useState<string | null>(null)

  // ─── Patient Search ───────────────────────────────────────────
  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    setResults([])
    try {
      const patients = await patientsApi.search(query.trim())
      setResults(patients as PatientRecord[])
      if (patients.length === 0) setSearchError('No patients found. Try a different name or ID.')
    } catch {
      setSearchError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  function selectPatient(p: PatientRecord) {
    setSelectedPatient(p)
    setStep('confirm')
  }

  // ─── STEP 1: Search ───────────────────────────────────────────
  if (step === 'search') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-start justify-center p-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="card p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100">
                <Video size={28} className="text-orange-600" />
              </div>
              <h1 className="text-xl font-bold text-[#2C2C2A]">Assisted Teleconsultation</h1>
              <p className="text-sm text-[#5F5E5A]">
                Search for a patient to link before starting the health assessment
              </p>
            </div>

            {/* Search box */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#2C2C2A]">
                Search Patient
              </label>
              <div className="flex gap-2">
                <div className="flex flex-1 items-center border-2 border-[#D3D1C7] rounded bg-white focus-within:border-teal-500 transition-colors">
                  <Search size={16} className="ml-3 text-[#5F5E5A] flex-shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Name, Health ID, phone..."
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-[#2C2C2A] placeholder-[#9B9A96]"
                    aria-label="Search patients"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !query.trim()}
                  className="btn-primary px-5 flex-shrink-0"
                >
                  {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            {/* Error */}
            {searchError && (
              <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="flex-shrink-0" />
                {searchError}
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <p className="text-xs text-[#5F5E5A] font-medium">
                    {results.length} patient{results.length !== 1 ? 's' : ''} found — tap to select
                  </p>
                  {results.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      className="w-full text-left p-4 rounded-xl border-2 border-[#D3D1C7] hover:border-orange-400 hover:bg-orange-50/40 transition-all flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700 flex-shrink-0 text-sm">
                        {p.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2C2C2A] text-sm">{p.name}</p>
                        <p className="text-xs text-[#5F5E5A]">
                          {p.age}y · {p.gender} · {p.village || ''}
                        </p>
                        {p.conditions?.length > 0 && (
                          <p className="text-xs text-teal-700 mt-0.5">
                            {p.conditions.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>
                      <ArrowRight size={16} className="text-orange-500 flex-shrink-0" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cancel */}
            <button
              onClick={() => navigate('/asha/teleconsult')}
              className="btn-secondary w-full justify-center text-sm"
            >
              <ArrowLeft size={16} />
              Go back
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── STEP 2: Confirm Patient ──────────────────────────────────
  if (step === 'confirm' && selectedPatient) {
    // Derive risk from most recent visit that has riskLevel
    const latestRiskVisit = [...(selectedPatient.visits || [])]
      .reverse()
      .find(v => v.riskLevel)
    const riskLevel = latestRiskVisit?.riskLevel || ''
    const riskScore = latestRiskVisit?.riskScore

    const riskColor =
      riskLevel === 'high' || riskLevel === 'emergency'
        ? 'text-red-600 bg-red-50 border-red-200'
        : riskLevel === 'medium'
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-green-600 bg-green-50 border-green-200'

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-start justify-center p-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="card p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
                <UserCheck size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-[#2C2C2A]">Confirm Patient</h2>
              <p className="text-sm text-[#5F5E5A]">
                Verify this is the correct patient before starting the assessment
              </p>
            </div>

            {/* Patient card */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-200 flex items-center justify-center font-bold text-teal-800 text-lg flex-shrink-0">
                  {selectedPatient.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-lg font-bold text-[#2C2C2A]">{selectedPatient.name}</p>
                  <p className="text-sm text-[#5F5E5A]">
                    {selectedPatient.age}y · {selectedPatient.gender}
                    {selectedPatient.village ? ` · ${selectedPatient.village}` : ''}
                  </p>
                  {selectedPatient.healthId && (
                    <p className="text-xs text-teal-700 font-mono mt-0.5">{selectedPatient.healthId}</p>
                  )}
                </div>
              </div>

              {/* Conditions */}
              {selectedPatient.conditions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#5F5E5A] uppercase mb-2">Known Conditions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatient.conditions.map((c: string) => (
                      <span key={c} className="text-xs px-2.5 py-1 bg-white border border-teal-300 text-teal-800 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk level */}
              {riskLevel && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${riskColor}`}>
                  <Heart size={12} />
                  Risk: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                  {riskScore ? ` (${riskScore}/100)` : ''}
                </div>
              )}
            </div>

            {/* Process steps preview */}
            <div className="space-y-2 py-2">
              {[
                { icon: <ClipboardList size={16} />, label: 'Health Assessment', desc: '6-step triage wizard' },
                { icon: <Activity size={16} />, label: 'AI Summary', desc: 'Generated for doctor review' },
                { icon: <Clock size={16} />, label: 'Queue', desc: 'Placed by urgency level' },
                { icon: <Video size={16} />, label: 'Video Consultation', desc: 'Patient + doctor connect' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                    {s.icon}
                  </div>
                  <span className="font-medium text-[#2C2C2A]">{s.label}</span>
                  <span className="text-[#5F5E5A] text-xs ml-auto">{s.desc}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedPatient(null); setStep('search') }}
                className="btn-secondary flex-1 justify-center"
              >
                <X size={16} />
                Change Patient
              </button>
              <button
                onClick={() => setStep('triage')}
                className="btn-primary flex-1 justify-center"
              >
                <CheckCircle size={16} />
                Start Assessment
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── STEP 3: Triage Wizard (reuse existing component) ─────────
  if (step === 'triage' && selectedPatient) {
    return (
      <TriageFormWizard
        patientId={selectedPatient.id}
        sourcePortal="asha"
        onComplete={(sessionId) => {
          setTriageSessionId(sessionId)
          setStep('queue')
        }}
        onCancel={() => setStep('confirm')}
      />
    )
  }

  // ─── STEP 4: Queue Status ─────────────────────────────────────
  if (step === 'queue' && selectedPatient) {
    return (
      <QueueStatusCard
        triageSessionId={triageSessionId || ''}
        patientId={selectedPatient.id}
        onConsultationStart={() => {
          // ASHA portal: navigate to the existing assisted teleconsult page
          navigate('/asha/teleconsult-live')
        }}
      />
    )
  }

  return null
}
