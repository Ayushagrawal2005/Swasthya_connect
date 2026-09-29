// ASHA — Create & track referrals (Module 5)
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle, Clock, AlertTriangle, MapPin, Plus, Sparkles, Loader2, Brain } from 'lucide-react'
import { referralsApi, appointmentsApi, type Referral, type FacilityWithDoctors } from '../../services/api'
import { generateReferralExplanation, type ReferralExplanation } from '../../lib/referralExplainer'
import { ReferralExplanationPanel } from '../../components/ui/ReferralExplanationPanel'
import { useApp, useT } from '../../context/AppContext'
import { createLocalizer } from '../../lib/localize'

type UrgencyLevel = 'routine' | 'urgent' | 'emergency'

interface LocalReferral {
  id: string
  patient: string
  from: string
  to: string
  reason: string
  urgency: UrgencyLevel
  date: string
  status: string
}

const existingReferrals: LocalReferral[] = [
  { id: 'REF-A01', patient: 'Meena Patil', from: 'Sub-centre Mandav', to: 'District Hospital Beed',
    reason: 'High BP 148/92 in 32W pregnancy — specialist obstetric review needed', urgency: 'urgent', date: '21 Aug 2026', status: 'pending' },
  { id: 'REF-A02', patient: 'Lata Kale (child)', from: 'Sub-centre Mandav', to: 'Rural Hospital Beed',
    reason: 'Grade II malnutrition — NRC admission for nutritional rehabilitation', urgency: 'urgent', date: '12 Aug 2026', status: 'reached' },
  { id: 'REF-A03', patient: 'Suresh Pawar', from: 'Sub-centre Mandav', to: 'PHC Beed',
    reason: 'Suspected TB — sputum AFB test required', urgency: 'routine', date: '10 Aug 2026', status: 'treated' },
]

const urgencyBadge: Record<string, string> = { routine: 'badge-teal', urgent: 'badge-amber', emergency: 'badge-red' }
const statusBadge: Record<string, string> = { pending: 'badge-amber', accepted: 'badge-teal', reached: 'badge-teal', treated: 'badge-green', missed: 'badge-red', redirected: 'badge-amber' }
const statusLabel: Record<string, string>  = { pending: 'Pending', accepted: 'Accepted', reached: 'Reached', treated: 'Treated', missed: 'Missed', redirected: 'Redirected' }

const stepFlow = [
  { key: 'sent', label: 'Sent' },
  { key: 'reached', label: 'Reached' },
  { key: 'treated', label: 'Treated' },
]

const urgencyConfig: Record<UrgencyLevel, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
  routine:   { label: 'Routine',   desc: 'Non-urgent — within 24-48 hours',          icon: <Clock size={14} />,         color: 'bg-teal-50 border-teal-300 text-teal-800' },
  urgent:    { label: 'Urgent',    desc: 'Needs attention today — within 4-6 hours', icon: <AlertTriangle size={14} />, color: 'bg-amber-50 border-amber-300 text-amber-800' },
  emergency: { label: 'Emergency', desc: 'Immediate — life-threatening situation',   icon: <AlertTriangle size={14} />, color: 'bg-red-50 border-red-300 text-red-800' },
}

const tierPriority: Record<string, number> = { 'sub-centre': 1, phc: 2, 'rural-hospital': 3, district: 4 }

export function AshaReferralsPage() {
  const [view, setView]         = useState<'list' | 'create'>('list')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [facilities, setFacilities] = useState<FacilityWithDoctors[]>([])
  const [loading, setLoading]   = useState(true)
  const [patient, setPatient]   = useState('')
  const [reason, setReason]     = useState('')
  const [urgency, setUrgency]   = useState<UrgencyLevel>('routine')
  const [selectedFacility, setSelectedFacility] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [currentExplanation, setCurrentExplanation] = useState<ReferralExplanation | null>(null)

  const { language } = useApp()
  const t = useT()
  const L = createLocalizer(language)

  useEffect(() => {
    Promise.all([referralsApi.outgoing(), appointmentsApi.facilities()])
      .then(([refs, facs]) => { setReferrals(refs); setFacilities(facs) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const urgencyOrder: Record<UrgencyLevel, number> = { emergency: 3, urgent: 2, routine: 1 }
  const recommendedFacilities = facilities
    .filter(f => f.tier !== 'sub-centre')
    .sort((a, b) => {
      if (urgency === 'emergency') return tierPriority[b.tier] - tierPriority[a.tier]
      return tierPriority[a.tier] - tierPriority[b.tier]
    })
    .slice(0, urgency === 'emergency' ? 3 : 2)

  function createReferral() {
    if (!patient.trim() || !reason.trim() || !selectedFacility) return
    referralsApi.create({ patientName: patient, toFacilityName: selectedFacility, reason, urgency })
      .then(ref => {
        setReferrals(p => [ref, ...p])
        setSubmitted(true)
        setTimeout(() => { setSubmitted(false); setView('list'); setPatient(''); setReason(''); setUrgency('routine'); setSelectedFacility('') }, 2000)
      })
      .catch(() => {/* silent */})
  }

  function showAIExplanation(referral: Referral) {
    // Generate explanation based on referral data
    const explanation = generateReferralExplanation(
      {
        name: referral.patientName,
        age: 52, // Would come from patient record in real system
        gender: 'F',
        vitals: {
          bp: '168/104', // Mock data - would come from patient record
          temp: '98.6°F',
          pulse: '88 bpm',
          spo2: '96%',
          weight: '64 kg'
        },
        conditions: ['Hypertension', 'Iron-deficiency Anaemia'],
        riskScore: referral.urgency === 'emergency' ? 85 : referral.urgency === 'urgent' ? 65 : 45
      },
      {
        reason: referral.reason,
        urgency: referral.urgency as 'routine' | 'urgent' | 'emergency',
        toFacility: referral.toFacilityName,
        fromFacility: 'Sub-centre Mandav'
      }
    )
    
    setCurrentExplanation(explanation)
    setShowExplanation(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#123B6D] to-[#1a5490] bg-clip-text text-transparent">
                {t('referrals')}
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {referrals.filter(r => r.status === 'pending').length} {t('pending')}
                </span>
                <span>·</span>
                <span>{L.facility('Sub-Centre Mandav')}</span>
              </p>
            </div>
            <button 
              onClick={() => setView(v => v === 'list' ? 'create' : 'list')}
              className={view === 'create' 
                ? 'bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2'
                : 'bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2'
              }
            >
              {view === 'create' ? '← Back to List' : <><Plus size={18} /> New Referral</>}
            </button>
          </div>
        </motion.div>

      <AnimatePresence mode="wait">
        {/* ── Create form ── */}
        {view === 'create' && (
          <motion.div 
            key="form" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 space-y-6"
          >
            <AnimatePresence>
              {submitted && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 text-sm text-green-800 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl px-4 py-3"
                >
                  <CheckCircle size={20} /> 
                  <span className="font-medium">Referral sent — {selectedFacility} notified.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Patient */}
            <div>
              <label htmlFor="ref-patient" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Patient Name / ID
              </label>
              <input 
                id="ref-patient" 
                type="text" 
                value={patient} 
                onChange={e => setPatient(e.target.value)}
                placeholder="e.g. Meena Patil · #P-001" 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400"
              />
            </div>

            {/* Urgency — pick FIRST to drive hospital suggestions */}
            <div>
              <label className="block text-sm font-semibold text-[#123B6D] mb-3">Urgency Level</label>
              <div className="space-y-3" role="group" aria-label="Urgency">
                {(['routine', 'urgent', 'emergency'] as UrgencyLevel[]).map(u => {
                  const cfg = urgencyConfig[u]
                  return (
                    <button 
                      key={u} 
                      type="button" 
                      onClick={() => { setUrgency(u); setSelectedFacility('') }}
                      aria-pressed={urgency === u}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                        urgency === u 
                          ? u === 'emergency' 
                            ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300' 
                            : u === 'urgent'
                            ? 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300'
                            : 'bg-gradient-to-r from-teal-50 to-teal-100 border-teal-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`mt-0.5 flex-shrink-0 ${urgency === u ? u === 'emergency' ? 'text-red-600' : u === 'urgent' ? 'text-amber-600' : 'text-teal-600' : 'text-gray-400'}`}>
                        {cfg.icon}
                      </span>
                      <div>
                        <p className={`font-bold text-base capitalize mb-1 ${urgency === u ? u === 'emergency' ? 'text-red-800' : u === 'urgent' ? 'text-amber-800' : 'text-teal-800' : 'text-gray-700'}`}>
                          {cfg.label}
                        </p>
                        <p className={`text-sm ${urgency === u ? 'opacity-90' : 'text-gray-500'}`}>
                          {cfg.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recommended hospitals based on urgency */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <label className="block text-sm font-semibold text-[#123B6D]">Refer to Hospital</label>
                <span className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full font-medium">
                  <Sparkles size={12} aria-hidden="true" /> Suggested for {urgency}
                </span>
              </div>

              {/* Recommended section */}
              <div className="space-y-3 mb-4">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">Recommended</p>
                {recommendedFacilities.map(f => (
                  <button 
                    key={f.id} 
                    type="button" 
                    onClick={() => setSelectedFacility(f.name)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] ${
                      selectedFacility === f.name 
                        ? 'border-teal-400 bg-gradient-to-r from-teal-50 to-teal-100' 
                        : 'border-teal-200 bg-teal-50/40 hover:border-teal-300'
                    }`}
                    aria-pressed={selectedFacility === f.name}
                  >
                    <div className="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-teal-300 flex-shrink-0 uppercase">
                      {f.tier}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base text-[#123B6D] mb-1">{f.name}</p>
                      <p className="text-xs text-gray-600">{f.distance} · {f.doctors.filter(d => d.available).length} doctors on duty</p>
                    </div>
                    {selectedFacility === f.name && (
                      <CheckCircle size={20} className="text-teal-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Other facilities */}
              <details className="rounded-xl border-2 border-gray-200 overflow-hidden bg-white">
                <summary className="px-4 py-3 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
                  Other facilities (not recommended for this urgency)
                </summary>
                <div className="p-3 space-y-2 bg-gray-50">
                  {facilities.filter(f => !recommendedFacilities.some(r => r.id === f.id)).map(f => (
                    <button 
                      key={f.id} 
                      type="button" 
                      onClick={() => setSelectedFacility(f.name)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left text-sm transition-all ${
                        selectedFacility === f.name 
                          ? 'border-teal-400 bg-gradient-to-r from-teal-50 to-teal-100' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full border border-gray-300 uppercase">
                        {f.tier}
                      </span>
                      <span className="flex-1 font-semibold text-[#123B6D]">{f.name}</span>
                      <span className="text-gray-600 text-xs">{f.distance}</span>
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="ref-reason" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Reason for Referral
              </label>
              <textarea 
                id="ref-reason" 
                rows={4} 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                placeholder="Describe the clinical indication clearly…" 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400 resize-none"
              />
            </div>

            <button 
              onClick={createReferral} 
              disabled={!patient.trim() || !reason.trim() || !selectedFacility}
              className="w-full bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white px-6 py-4 rounded-2xl font-bold text-base hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              <ArrowRight size={20} /> Send Referral to {selectedFacility || '…'}
            </button>
          </motion.div>
        )}

        {/* ── Referral list ── */}
        {view === 'list' && (
          <motion.div 
            key="list" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {referrals.map((ref, i) => {
              const stepIdx = [ref.status === 'reached',ref.status === 'treated'].indexOf(true)
              return (
                <motion.article 
                  key={ref.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-white rounded-2xl shadow-lg p-6 space-y-4 border-2 hover:shadow-xl transition-all ${
                    ref.urgency === 'emergency' 
                      ? 'border-l-4 border-l-red-500 border-red-200' 
                      : ref.urgency === 'urgent' 
                      ? 'border-l-4 border-l-amber-400 border-amber-200' 
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="font-bold text-lg text-[#123B6D]">{L.name(ref.patientName)}</p>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{ref.id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-teal-500" /> 
                        <span>{L.facility('Sub-Centre Mandav')}</span>
                        <ArrowRight size={14} /> 
                        <span className="font-medium">{L.facility(ref.toFacilityName)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`${
                        ref.urgency === 'emergency' 
                          ? 'bg-red-100 text-red-700' 
                          : ref.urgency === 'urgent'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-teal-100 text-teal-700'
                      } px-3 py-1 rounded-full text-xs font-bold capitalize`}>
                        {L.status(ref.urgency)}
                      </span>
                      <span className={`${
                        ref.status === 'pending' 
                          ? 'bg-amber-100 text-amber-700'
                          : ref.status === 'accepted' || ref.status === 'reached'
                          ? 'bg-teal-100 text-teal-700'
                          : ref.status === 'treated'
                          ? 'bg-green-100 text-green-700'
                          : ref.status === 'missed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      } px-3 py-1 rounded-full text-xs font-bold`}>
                        {L.status(ref.status)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">
                    {ref.reason}
                  </p>
                  
                  {/* AI Explanation Button */}
                  <button
                    onClick={() => showAIExplanation(ref)}
                    className="flex items-center gap-2 text-sm text-indigo-700 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-2 border-indigo-200 rounded-xl px-4 py-3 transition-all font-semibold hover:scale-[1.02]"
                  >
                    <Brain size={16} />
                    <span>Why was this referral created?</span>
                    <Sparkles size={14} className="text-indigo-500" />
                  </button>
                  
                  {/* Progress Steps */}
                  <div className="flex items-center gap-0">
                    {stepFlow.map((s, si) => {
                      const done = si <= stepIdx; const active = si === stepIdx
                      return (
                        <div key={s.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                              done ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gray-100'
                            }`}>
                              {done ? (
                                <CheckCircle size={16} className="text-white" />
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                              )}
                            </div>
                            <span className={`text-xs mt-1.5 font-semibold text-center leading-tight max-w-[60px] ${
                              active ? 'text-teal-600' : done ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {s.label}
                            </span>
                          </div>
                          {si < stepFlow.length - 1 && (
                            <div className={`flex-1 h-1 -mt-4 rounded-full ${
                              si < stepIdx ? 'bg-teal-400' : 'bg-gray-200'
                            }`} aria-hidden="true" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {ref.status === 'pending' && (
                    <div className="flex items-center gap-2 text-sm text-amber-800 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl px-4 py-3">
                      <AlertTriangle size={16} /> 
                      <span className="font-medium">
                        Patient has not yet reached {ref.toFacilityName}. Follow up if not arrived within 24h.
                      </span>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Clock size={12} /> 
                    {new Date(ref.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </motion.article>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Explainable AI Panel */}
      <AnimatePresence>
        {showExplanation && currentExplanation && (
          <ReferralExplanationPanel
            explanation={currentExplanation}
            onClose={() => setShowExplanation(false)}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

