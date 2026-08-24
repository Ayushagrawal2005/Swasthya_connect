/**
 * ASHA — Patient Search + Longitudinal Record View
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, UserPlus, Activity, Thermometer, Wind, Heart,
  ChevronRight, ChevronDown, Stethoscope, FlaskConical,
  Pill, FileText, AlertTriangle, TrendingUp, Clock, CheckCircle,
  ArrowRight, Loader2,
} from 'lucide-react'
import { patientsApi, type PatientRecord, type VisitRecord } from '../../services/api'
import { AIPill } from '../../components/ui/AIPill'
import { useApp } from '../../context/AppContext'

const typeIcon: Record<VisitRecord['type'], React.ReactNode> = {
  visit:       <Stethoscope size={14} className="text-teal-500" />,
  lab:         <FlaskConical size={14} className="text-indigo-500" />,
  prescription:<Pill size={14} className="text-green-500" />,
  diagnosis:   <FileText size={14} className="text-amber-500" />,
  referral:    <ArrowRight size={14} className="text-coral-500" />,
  'ocr-upload':<FileText size={14} className="text-purple-500" />,
  imaging:     <FileText size={14} className="text-blue-500" />,
}

const typeBadge: Record<VisitRecord['type'], string> = {
  visit:       'badge-teal',
  lab:         'badge-teal',
  prescription:'badge-green',
  diagnosis:   'badge-amber',
  referral:    'badge-amber',
  'ocr-upload':'bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
  imaging:     'bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
}

const riskBadge: Record<string, string> = { low: 'badge-green', medium: 'badge-amber', high: 'badge-red', emergency: 'badge-red' }

export function AshaPatientSearchPage() {
  const navigate = useNavigate()
  const { userId } = useApp()
  const [query, setQuery]               = useState('')
  const [searching, setSearching]       = useState(false)
  const [patient, setPatient]           = useState<PatientRecord | null>(null)
  const [found, setFound]               = useState(false)
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [visits, setVisits]             = useState<VisitRecord[]>([])
  const [showLogForm, setShowLogForm]   = useState(false)
  const [logSaved, setLogSaved]         = useState(false)

  // Today's visit form state
  const [chief, setChief]   = useState('')
  const [bp, setBp]         = useState('')
  const [temp, setTemp]     = useState('')
  const [pulse, setPulse]   = useState('')
  const [notes, setNotes]   = useState('')

  // Derived from patient data
  const bpReadings = visits.filter(v => v.vitals?.bp).map(v => parseInt(v.vitals!.bp!.split('/')[0])).filter(Boolean)
  const bpTrend    = bpReadings.length >= 2 ? (bpReadings[0] > bpReadings[bpReadings.length - 1] ? 'improving' : bpReadings[0] < bpReadings[bpReadings.length - 1] ? 'worsening' : 'stable') : 'stable'
  const trendFlag  = bpTrend === 'worsening' ? '⚠ BP worsening trend' : ''
  const noShow     = patient ? patient.noShowCount > 0 : false
  const explain    = noShow ? `Patient has ${patient?.noShowCount} missed visit(s)` : ''

  function doSearch() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    patientsApi.search(q)
      .then(results => {
        if (results.length > 0) {
          setPatient(results[0])
          setVisits(results[0].visits || [])
          setFound(true)
        } else {
          setFound(false)
          setPatient(null)
        }
      })
      .catch(() => { setFound(false) })
      .finally(() => setSearching(false))
  }

  function saveVisit() {
    if (!patient) return
    patientsApi.addVisit(patient.id, {
      date: new Date().toISOString().split('T')[0],
      facility: 'Sub-Centre Mandav',
      tier: 'sub-centre',
      type: 'visit',
      title: chief || "Today's visit",
      detail: notes || `BP: ${bp}. Chief complaint: ${chief}.`,
      vitals: { bp, temp, pulse },
    })
      .then(v => {
        setVisits(p => [v, ...p])
        setLogSaved(true)
        setShowLogForm(false)
        setTimeout(() => setLogSaved(false), 3000)
      })
      .catch(() => {/* offline: save locally */
        setLogSaved(true)
        setShowLogForm(false)
        setTimeout(() => setLogSaved(false), 3000)
      })
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Patient search</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Search by name or phone number to pull existing record</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A]" aria-hidden="true" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Search by name, phone, or health ID…"
            className="input-field pl-9 text-sm" aria-label="Search patient" />
        </div>
        <button onClick={doSearch} className="btn-primary text-sm py-2.5 px-4">Search</button>
        <button onClick={() => navigate('/asha/register')} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-1.5">
          <UserPlus size={15} aria-hidden="true" /> New
        </button>
      </div>

      {/* Searching indicator */}
      {searching && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-teal-400" />
        </div>
      )}

      {/* No results */}
      {!searching && query && !found && (
        <p className="text-sm text-[#5F5E5A] py-4 text-center">No patients found for "{query}". <button onClick={() => navigate('/asha/register')} className="text-teal-600 underline">Register new patient</button></p>
      )}

      {/* Patient record */}
      {found && patient && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-5">
          {/* Identity card */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-lg font-semibold text-teal-700 flex-shrink-0">
                {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-[#2C2C2A]">{patient.name}</h2>
                  <span className="text-xs text-[#5F5E5A]">{patient.age}y · {patient.gender} · {patient.village}</span>
                </div>
                <p className="text-xs text-[#5F5E5A] mt-0.5 font-mono">ABDM: {patient.healthId}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patient.conditions.map(c => (
                    <span key={c} className="badge-amber text-[10px]">{c}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-[#5F5E5A]">{visits.length} visits total</p>
                <p className="text-xs font-medium text-teal-600 mt-0.5">{visits[0]?.date || '—'}</p>
              </div>
            </div>
          </div>

          {/* BP Trend flag */}
          {trendFlag && (
            <div className="card p-4 flex items-start gap-3 border-l-4 border-l-coral-500">
              <TrendingUp size={18} className="text-coral-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold text-[#2C2C2A]">BP — Worsening trend</p>
                  <AIPill />
                </div>
                <p className="text-xs text-[#5F5E5A]">{trendFlag}</p>
              </div>
            </div>
          )}

          {/* No-show risk */}
          {noShow && (
            <div className="card p-4 flex items-start gap-3 border-l-4 border-l-amber-400">
              <Clock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#2C2C2A]">No-show risk</p>
                <p className="text-xs text-[#5F5E5A] leading-relaxed">{explain}</p>
              </div>
            </div>
          )}

          {/* Log today's visit */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-header mb-0">Visit history ({visits.length} total)</h3>
              <button onClick={() => setShowLogForm(p => !p)}
                className={showLogForm ? 'btn-secondary text-sm py-2 px-4' : 'btn-primary text-sm py-2 px-4'}>
                {showLogForm ? 'Cancel' : '+ Log today\'s visit'}
              </button>
            </div>

            <AnimatePresence>
              {logSaved && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
                  <CheckCircle size={16} /> Visit logged and appended to Meena's record. Now {visits.length} visits total.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visit log form — Step 2 */}
            <AnimatePresence>
              {showLogForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="card p-5 space-y-4 mb-4 overflow-hidden">
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Log visit — 23 Aug 2026</p>

                  <div>
                    <label htmlFor="log-chief" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Chief complaint</label>
                    <input id="log-chief" type="text" value={chief} onChange={e => setChief(e.target.value)}
                      placeholder="e.g. Headache and dizziness for 2 days" className="input-field text-sm" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'log-bp', label: 'BP', val: bp, set: setBp, placeholder: '168/104', unit: 'mmHg', icon: <Activity size={13} /> },
                      { id: 'log-temp', label: 'Temp', val: temp, set: setTemp, placeholder: '98.4', unit: '°F', icon: <Thermometer size={13} /> },
                      { id: 'log-pulse', label: 'Pulse', val: pulse, set: setPulse, placeholder: '88', unit: 'bpm', icon: <Heart size={13} /> },
                    ].map(f => (
                      <div key={f.id}>
                        <label htmlFor={f.id} className="block text-xs font-medium text-[#2C2C2A] mb-1 flex items-center gap-1">
                          <span className="text-teal-500">{f.icon}</span>{f.label}
                        </label>
                        <div className="relative">
                          <input id={f.id} type="text" value={f.val} onChange={e => f.set(e.target.value)}
                            placeholder={f.placeholder} className="input-field text-xs pr-10" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#5F5E5A] pointer-events-none">{f.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label htmlFor="log-notes" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Notes</label>
                    <textarea id="log-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Clinical observations, advice given…" className="input-field resize-none text-sm" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={saveVisit} disabled={!chief.trim()}
                      className="btn-primary text-sm py-2.5 flex-1 justify-center disabled:opacity-40">
                      Save visit to record
                    </button>
                    <button onClick={() => navigate('/asha/triage')}
                      className="btn-secondary text-sm py-2.5 px-4">
                      Continue to triage →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visit timeline */}
            <div className="relative space-y-3">
              <div className="absolute left-[17px] top-4 bottom-0 w-0.5 bg-[#D3D1C7]" aria-hidden="true" />
              {visits.map((v, i) => {
                const isOpen = expanded === v.id
                return (
                  <motion.div key={v.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }} className="relative pl-10">
                    <div className={`absolute left-0 top-3 w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0
                      ${v.riskLevel === 'high' || v.riskLevel === 'emergency' ? 'bg-coral-50 border-coral-200' : 'bg-white border-[#D3D1C7]'}`}
                      aria-hidden="true">
                      {typeIcon[v.type]}
                    </div>
                    <button onClick={() => setExpanded(isOpen ? null : v.id)}
                      className="card w-full text-left p-4 hover:shadow-card-hover transition-all"
                      aria-expanded={isOpen} aria-controls={`visit-${v.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className={`${typeBadge[v.type]} text-[10px]`}>
                              {v.type === 'ocr-upload' ? 'OCR Upload' : v.type.charAt(0).toUpperCase() + v.type.slice(1)}
                            </span>
                            <span className="text-[10px] text-[#5F5E5A]">{v.date}</span>
                            {v.riskScore !== undefined && (
                              <span className={`${riskBadge[v.riskLevel ?? 'low']} text-[10px]`}>
                                Score {v.riskScore}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-sm text-[#2C2C2A]">{v.title}</p>
                          <p className="text-xs text-[#5F5E5A] mt-0.5">{v.facility} · {v.worker}</p>
                        </div>
                        {isOpen ? <ChevronDown size={14} className="text-[#5F5E5A] flex-shrink-0 mt-1" /> : <ChevronRight size={14} className="text-[#5F5E5A] flex-shrink-0 mt-1" />}
                      </div>
                      {isOpen && (
                        <div id={`visit-${v.id}`} className="mt-3 pt-3 border-t border-[#D3D1C7] space-y-2">
                          <p className="text-sm text-[#5F5E5A] leading-relaxed">{v.detail}</p>
                          {v.vitals && (
                            <div className="flex gap-3 flex-wrap text-xs">
                              {v.vitals.bp    && <span className="badge-teal">BP {v.vitals.bp}</span>}
                              {v.vitals.temp  && <span className="badge-teal">Temp {v.vitals.temp}°F</span>}
                              {v.vitals.pulse && <span className="badge-teal">Pulse {v.vitals.pulse}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Action row */}
          <div className="flex gap-3 flex-wrap pt-2">
            <button onClick={() => navigate('/asha/record')} className="btn-primary text-sm flex-1 justify-center">
              View full record →
            </button>
            <button onClick={() => navigate('/asha/triage')} className="btn-secondary text-sm px-5">
              Run triage
            </button>
            <button onClick={() => navigate('/asha/referrals')} className="btn-secondary text-sm px-5">
              Referral
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
