// ASHA — Create & track referrals (Module 5)
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle, Clock, AlertTriangle, MapPin, Plus, Sparkles, Loader2 } from 'lucide-react'
import { referralsApi, appointmentsApi, type Referral, type FacilityWithDoctors } from '../../services/api'

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

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Referrals</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">{referrals.filter(r => r.status === 'pending').length} pending · Sub-centre Mandav</p>
        </div>
        <button onClick={() => setView(v => v === 'list' ? 'create' : 'list')}
          className={view === 'create' ? 'btn-secondary text-sm py-2' : 'btn-primary text-sm py-2'}>
          {view === 'create' ? '← Back to list' : <><Plus size={15} /> New referral</>}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Create form ── */}
        {view === 'create' && (
          <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">
            <AnimatePresence>
              {submitted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle size={16} /> Referral sent — {selectedFacility} notified.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Patient */}
            <div>
              <label htmlFor="ref-patient" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Patient name / ID</label>
              <input id="ref-patient" type="text" value={patient} onChange={e => setPatient(e.target.value)}
                placeholder="e.g. Meena Patil · #P-001" className="input-field" />
            </div>

            {/* Urgency — pick FIRST to drive hospital suggestions */}
            <div>
              <label className="block text-sm font-medium text-[#2C2C2A] mb-2">Urgency level</label>
              <div className="space-y-2" role="group" aria-label="Urgency">
                {(['routine', 'urgent', 'emergency'] as UrgencyLevel[]).map(u => {
                  const cfg = urgencyConfig[u]
                  return (
                    <button key={u} type="button" onClick={() => { setUrgency(u); setSelectedFacility('') }}
                      aria-pressed={urgency === u}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all
                        ${urgency === u ? `${cfg.color} border-current` : 'bg-white border-[#D3D1C7] hover:border-gray-300'}`}>
                      <span className={`mt-0.5 flex-shrink-0 ${urgency === u ? '' : 'text-[#5F5E5A]'}`}>{cfg.icon}</span>
                      <div>
                        <p className="font-semibold text-sm capitalize">{cfg.label}</p>
                        <p className="text-xs opacity-80 mt-0.5">{cfg.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recommended hospitals based on urgency */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-[#2C2C2A]">Refer to hospital</label>
                <span className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  <Sparkles size={9} aria-hidden="true" /> Suggested for {urgency}
                </span>
              </div>

              {/* Recommended section */}
              <div className="space-y-2 mb-3">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Recommended</p>
                {recommendedFacilities.map(f => (
                  <button key={f.id} type="button" onClick={() => setSelectedFacility(f.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                      ${selectedFacility === f.name ? 'border-teal-500 bg-teal-50' : 'border-teal-200 bg-teal-50/40 hover:border-teal-400'}`}
                    aria-pressed={selectedFacility === f.name}>
                    <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${"badge-teal"}`}>
                      {f.tier}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#2C2C2A]">{f.name}</p>
                      <p className="text-[10px] text-[#5F5E5A]">{f.distance} · {f.doctors.filter(d => d.available).length} doctors on duty</p>
                    </div>
                    {selectedFacility === f.name && <CheckCircle size={16} className="text-teal-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Other facilities */}
              <details className="rounded-xl border border-[#D3D1C7] overflow-hidden">
                <summary className="px-4 py-2.5 text-xs font-medium text-[#5F5E5A] cursor-pointer hover:bg-gray-50">
                  Other facilities (not recommended for this urgency)
                </summary>
                <div className="p-2 space-y-1.5 bg-gray-50/50">
                  {facilities.filter(f => !recommendedFacilities.some(r => r.id === f.id)).map(f => (
                    <button key={f.id} type="button" onClick={() => setSelectedFacility(f.name)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left text-xs transition-all
                        ${selectedFacility === f.name ? 'border-teal-500 bg-teal-50' : 'border-[#D3D1C7] bg-white hover:border-gray-300'}`}>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${"badge-teal"}`}>{f.tier}</span>
                      <span className="flex-1 font-medium text-[#2C2C2A]">{f.name}</span>
                      <span className="text-[#5F5E5A]">{f.distance}</span>
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="ref-reason" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Reason for referral</label>
              <textarea id="ref-reason" rows={3} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Describe the clinical indication clearly…" className="input-field resize-none" />
            </div>

            <button onClick={createReferral} disabled={!patient.trim() || !reason.trim() || !selectedFacility}
              className="btn-primary w-full justify-center text-sm py-3 disabled:opacity-40">
              <ArrowRight size={15} /> Send referral to {selectedFacility || '…'}
            </button>
          </motion.div>
        )}

        {/* ── Referral list ── */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-3">
            {referrals.map((ref, i) => {
              const stepIdx = [ref.status === 'reached',ref.status === 'treated'].indexOf(true)
              return (
                <motion.article key={ref.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`card p-5 space-y-3 ${ref.urgency === 'emergency' ? 'border-l-4 border-l-red-500' : ref.urgency === 'urgent' ? 'border-l-4 border-l-amber-400' : ''}`}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-sm text-[#2C2C2A]">{ref.patientName}</p>
                        <span className="text-[10px] font-mono text-[#5F5E5A]">{ref.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                        <MapPin size={11} className="text-teal-500" /> Sub-centre
                        <ArrowRight size={11} /> {ref.toFacilityName}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`${urgencyBadge[ref.urgency]} text-[10px] capitalize`}>{ref.urgency}</span>
                      <span className={`${statusBadge[ref.status]} text-[10px]`}>{statusLabel[ref.status]}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#5F5E5A] leading-relaxed">{ref.reason}</p>
                  <div className="flex items-center gap-0">
                    {stepFlow.map((s, si) => {
                      const done = si <= stepIdx; const active = si === stepIdx
                      return (
                        <div key={s.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-teal-500' : 'bg-gray-100'}`}>
                              {done ? <CheckCircle size={13} className="text-white" /> : <span className="w-2 h-2 rounded-full bg-gray-300" />}
                            </div>
                            <span className={`text-[9px] mt-0.5 font-medium text-center leading-tight max-w-[52px] ${active ? 'text-teal-600' : done ? 'text-[#5F5E5A]' : 'text-gray-400'}`}>{s.label}</span>
                          </div>
                          {si < stepFlow.length - 1 && <div className={`flex-1 h-0.5 -mt-4 ${si < stepIdx ? 'bg-teal-300' : 'bg-gray-200'}`} aria-hidden="true" />}
                        </div>
                      )
                    })}
                  </div>
                  {ref.status === 'pending' && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <AlertTriangle size={11} /> Patient has not yet reached {ref.toFacilityName}. Follow up if not arrived within 24h.
                    </div>
                  )}
                  <p className="text-[10px] text-[#5F5E5A] flex items-center gap-1"><Clock size={10} /> {new Date(ref.createdAt).toLocaleDateString('en-IN')}</p>
                </motion.article>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

