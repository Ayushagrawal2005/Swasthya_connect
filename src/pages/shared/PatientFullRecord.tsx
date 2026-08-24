/**
 * Shared — Full Longitudinal Patient Record
 * Accessible to both ASHA worker (read + log) and Doctor (read + consult notes)
 * Shows: identity, disease history, medications, uploaded reports, visit timeline
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Shield, Pill, AlertTriangle, TrendingUp, Clock,
  ChevronDown, ChevronRight, Stethoscope, FlaskConical,
  FileText, ArrowRight, Image, Download, Activity, Thermometer,
  Heart, CheckCircle, DropletIcon,
} from 'lucide-react'
import {
  meena, getBPTrend, getTrendFlag, getNoShowRisk, getExplainableFlag,
  type VisitRecord, type RecordType,
} from '../../data/meenaPatient'
import { AIPill } from '../../components/ui/AIPill'
import { useApp } from '../../context/AppContext'

type Tab = 'overview' | 'history' | 'diseases' | 'medications' | 'reports'

// ─── Icons & badges per record type ───────────────────────────────────────

const typeIcon: Record<RecordType, React.ReactNode> = {
  visit:       <Stethoscope size={14} className="text-teal-500" />,
  lab:         <FlaskConical size={14} className="text-indigo-500" />,
  prescription:<Pill size={14} className="text-green-500" />,
  diagnosis:   <FileText size={14} className="text-amber-500" />,
  referral:    <ArrowRight size={14} className="text-coral-500" />,
  'ocr-upload':<FileText size={14} className="text-purple-500" />,
  imaging:     <Image size={14} className="text-blue-500" />,
}

const typeBadge: Record<RecordType, string> = {
  visit:       'badge-teal',
  lab:         'bg-indigo-50 text-indigo-700 border-indigo-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
  prescription:'badge-green',
  diagnosis:   'badge-amber',
  referral:    'badge-amber',
  'ocr-upload':'bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
  imaging:     'bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
}

const tierLabel: Record<string, string> = {
  'sub-centre': 'Sub-Centre', phc: 'PHC', 'rural-hospital': 'Rural Hosp.', district: 'District Hosp.'
}

const riskBadge = { low: 'badge-green', medium: 'badge-amber', high: 'badge-red', emergency: 'badge-red' }

export function PatientFullRecord() {
  const { role } = useApp()
  const [tab, setTab] = useState<Tab>('overview')
  const [expanded, setExpanded] = useState<string | null>('V010')  // today open by default
  const [filterType, setFilterType] = useState<RecordType | 'all'>('all')

  const bpTrend   = getBPTrend(meena)
  const trendFlag = getTrendFlag(meena)
  const noShow    = getNoShowRisk(meena)
  const explain   = getExplainableFlag(meena)

  const filteredVisits = filterType === 'all'
    ? meena.visits
    : meena.visits.filter(v => v.type === filterType)

  const reportsOnly = meena.visits.filter(v => v.reportFile)

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'history',    label: 'Visit history', count: meena.visits.length },
    { id: 'diseases',   label: 'Disease history', count: meena.diseaseHistory.length },
    { id: 'medications',label: 'Medications', count: meena.medications.length },
    { id: 'reports',    label: 'Reports & uploads', count: reportsOnly.length },
  ]

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in">
      {/* ── Identity card ── */}
      <div className="card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-lg font-semibold text-teal-700 flex-shrink-0">MP</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-semibold text-lg text-[#2C2C2A]">{meena.name}</h1>
              <span className="text-sm text-[#5F5E5A]">{meena.age}y · {meena.gender} · {meena.dob}</span>
            </div>
            <p className="text-xs text-[#5F5E5A] mb-1">{meena.village} · 📞 {meena.phone} · 🗣 {meena.language}</p>
            <p className="text-xs font-mono text-teal-600 mb-2">ABDM ID: {meena.healthId}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="badge-teal text-[10px] flex items-center gap-1">
                <DropletIcon size={9} /> {meena.bloodGroup}
              </span>
              {meena.allergies.map(a => (
                <span key={a} className="badge-red text-[10px]">⚠ {a}</span>
              ))}
              {meena.conditions.map(c => (
                <span key={c} className="badge-amber text-[10px]">{c}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Shield size={13} className="text-teal-500" aria-hidden="true" />
            <span className="text-[10px] text-teal-600 font-medium">ABDM linked · FHIR</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#D3D1C7] overflow-x-auto" role="tablist" aria-label="Patient record tabs">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5
              ${tab === t.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'}`}>
            {t.label}
            {t.count !== undefined && (
              <span className="text-[10px] bg-gray-100 text-[#5F5E5A] px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          {/* BP trend */}
          {trendFlag.isTrending && (
            <div className={`card p-4 flex items-start gap-3 border-l-4 ${trendFlag.direction === 'rising' ? 'border-l-coral-500' : 'border-l-teal-400'}`}>
              <TrendingUp size={18} className={trendFlag.direction === 'rising' ? 'text-coral-500 mt-0.5 flex-shrink-0' : 'text-teal-500 mt-0.5 flex-shrink-0'} aria-hidden="true" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#2C2C2A]">
                    HTN — {trendFlag.direction === 'rising' ? 'Worsening ↑' : 'Improving ↓'}
                  </p>
                  <AIPill />
                </div>
                {/* BP sparkline */}
                <div className="flex items-end gap-1.5 my-2 h-10" aria-label="BP trend chart" role="img">
                  {bpTrend.map((t, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5" title={`${t.bp} on ${t.date}`}>
                      <div
                        className={`w-9 rounded-sm ${t.sys >= 160 ? 'bg-red-400' : t.sys >= 140 ? 'bg-amber-400' : 'bg-teal-400'}`}
                        style={{ height: `${Math.max(8, ((t.sys - 100) / 80) * 40)}px` }}
                      />
                      <span className="text-[8px] text-[#5F5E5A] tabular-nums">{t.sys}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#5F5E5A]">{trendFlag.summary}</p>
              </div>
            </div>
          )}

          {/* No-show risk */}
          <div className={`card p-4 flex items-start gap-3 border-l-4 ${noShow.level === 'high' ? 'border-l-coral-500' : 'border-l-amber-400'}`}>
            <Clock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="text-sm font-semibold text-[#2C2C2A]">No-show risk: <span className="capitalize">{noShow.level}</span></p>
                <AIPill />
              </div>
              <p className="text-xs text-[#5F5E5A] leading-relaxed">{noShow.explanation}</p>
            </div>
          </div>

          {/* Explainable flag */}
          <div className="card p-4 bg-indigo-50 border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={13} aria-hidden="true" /> System insight — visible to ASHA & Doctor
            </p>
            <p className="text-sm text-indigo-800 leading-relaxed">{explain}</p>
          </div>

          {/* Quick vitals summary */}
          {meena.visits[0].vitals && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-3">Latest vitals (23 Aug 2026)</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[
                  { label: 'BP', value: meena.visits[0].vitals.bp, unit: 'mmHg', icon: <Activity size={13} />, alert: true },
                  { label: 'Temp', value: meena.visits[0].vitals.temp, unit: '°F', icon: <Thermometer size={13} />, alert: false },
                  { label: 'Pulse', value: meena.visits[0].vitals.pulse, unit: 'bpm', icon: <Heart size={13} />, alert: false },
                  { label: 'Weight', value: meena.visits[0].vitals.weight, unit: '', icon: <User size={13} />, alert: false },
                ].filter(v => v.value).map(v => (
                  <div key={v.label} className={`rounded-xl p-2.5 ${v.alert ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <p className={`text-[10px] flex items-center gap-1 ${v.alert ? 'text-red-600' : 'text-[#5F5E5A]'}`}>
                      <span aria-hidden="true">{v.icon}</span>{v.label}
                    </p>
                    <p className={`font-semibold tabular-nums text-sm mt-0.5 ${v.alert ? 'text-red-700' : 'text-[#2C2C2A]'}`}>{v.value}</p>
                    {v.unit && <p className="text-[9px] text-[#5F5E5A]">{v.unit}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISIT HISTORY */}
      {tab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by record type">
            {(['all', 'visit', 'lab', 'imaging', 'ocr-upload', 'referral'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} aria-pressed={filterType === t}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize
                  ${filterType === t ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#5F5E5A] border-[#D3D1C7] hover:border-teal-300'}`}>
                {t === 'ocr-upload' ? 'OCR upload' : t}
              </button>
            ))}
          </div>

          <div className="relative space-y-3">
            <div className="absolute left-[17px] top-4 bottom-0 w-0.5 bg-[#D3D1C7]" aria-hidden="true" />
            {filteredVisits.map((v, i) => {
              const isOpen = expanded === v.id
              return (
                <motion.div key={v.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }} className="relative pl-10">
                  <div className={`absolute left-0 top-3 w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0
                    ${v.riskLevel === 'high' || v.riskLevel === 'emergency' ? 'bg-red-50 border-red-200' : 'bg-white border-[#D3D1C7]'}`}
                    aria-hidden="true">
                    {typeIcon[v.type]}
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : v.id)}
                    className="card w-full text-left p-4 hover:shadow-card-hover transition-all"
                    aria-expanded={isOpen} aria-controls={`rec-${v.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`${typeBadge[v.type]} text-[10px]`}>
                            {v.type === 'ocr-upload' ? 'OCR' : v.type.charAt(0).toUpperCase() + v.type.slice(1)}
                          </span>
                          <span className="text-[10px] text-[#5F5E5A]">{v.date}</span>
                          <span className="text-[10px] text-[#5F5E5A]">{tierLabel[v.tier] ?? v.facility}</span>
                          {v.riskScore !== undefined && v.riskScore > 0 && (
                            <span className={`${riskBadge[v.riskLevel ?? 'low']} text-[10px]`}>Score {v.riskScore}</span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-[#2C2C2A]">{v.title}</p>
                        <p className="text-xs text-[#5F5E5A] mt-0.5">{v.worker}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {v.reportFile && (
                          <button onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                            aria-label={`Download ${v.reportFile}`} title={v.reportFile}>
                            <Download size={14} aria-hidden="true" />
                          </button>
                        )}
                        {isOpen ? <ChevronDown size={14} className="text-[#5F5E5A]" /> : <ChevronRight size={14} className="text-[#5F5E5A]" />}
                      </div>
                    </div>

                    {isOpen && (
                      <div id={`rec-${v.id}`} className="mt-3 pt-3 border-t border-[#D3D1C7] space-y-3">
                        <p className="text-sm text-[#5F5E5A] leading-relaxed">{v.detail}</p>
                        {v.vitals && (
                          <div className="flex gap-2 flex-wrap">
                            {v.vitals.bp    && <span className="badge-teal text-[10px]">BP {v.vitals.bp}</span>}
                            {v.vitals.temp  && <span className="badge-teal text-[10px]">Temp {v.vitals.temp}°F</span>}
                            {v.vitals.pulse && <span className="badge-teal text-[10px]">Pulse {v.vitals.pulse}</span>}
                            {v.vitals.weight && <span className="badge-teal text-[10px]">Wt {v.vitals.weight}</span>}
                            {v.vitals.hb    && <span className="badge-amber text-[10px]">Hb {v.vitals.hb} g/dL</span>}
                          </div>
                        )}
                        {v.reportFile && (
                          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                            <FileText size={12} aria-hidden="true" />
                            <span className="font-medium">{v.reportFile}</span>
                            <button className="ml-auto text-indigo-500 hover:text-indigo-700" aria-label={`Download ${v.reportFile}`}>
                              <Download size={12} aria-hidden="true" />
                            </button>
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
      )}

      {/* DISEASE HISTORY */}
      {tab === 'diseases' && (
        <div className="space-y-3 animate-fade-in">
          {meena.diseaseHistory.map((d, i) => (
            <motion.div key={d.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`card p-5 border-l-4 ${d.status === 'chronic' || d.status === 'active' ? 'border-l-coral-400' : 'border-l-teal-300'}`}>
              <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                <div>
                  <p className="font-semibold text-sm text-[#2C2C2A]">{d.name}</p>
                  {d.icd10 && <p className="text-[10px] font-mono text-[#5F5E5A]">ICD-10: {d.icd10}</p>}
                </div>
                <div className="flex gap-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize
                    ${d.status === 'chronic' ? 'bg-coral-50 text-coral-700 border-coral-200'
                      : d.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {d.status}
                  </span>
                  <span className="badge-teal text-[10px]">Since {d.since}</span>
                </div>
              </div>
              <p className="text-sm text-[#5F5E5A] leading-relaxed">{d.notes}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* MEDICATIONS */}
      {tab === 'medications' && (
        <div className="space-y-3 animate-fade-in">
          {/* Group by status */}
          {(['current', 'completed', 'discontinued'] as const).map(status => {
            const meds = meena.medications.filter(m => m.status === status)
            if (meds.length === 0) return null
            return (
              <section key={status} aria-labelledby={`med-section-${status}`}>
                <h2 id={`med-section-${status}`} className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-2 capitalize">
                  {status} medications ({meds.length})
                </h2>
                {meds.map((m, i) => (
                  <motion.div key={m.drug} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`card p-4 mb-2 flex items-start gap-3 ${m.status !== 'current' ? 'opacity-70' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${m.status === 'current' ? 'bg-teal-50' : 'bg-gray-50'}`}>
                      <Pill size={16} className={m.status === 'current' ? 'text-teal-500' : 'text-gray-400'} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-sm text-[#2C2C2A]">{m.drug} {m.dose}</p>
                        {m.source === 'ocr' && (
                          <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded-full">OCR extracted</span>
                        )}
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize
                          ${m.status === 'current' ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : m.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#5F5E5A]">{m.frequency} · Since {m.since}</p>
                      <p className="text-xs text-[#5F5E5A] mt-0.5">Prescribed by {m.prescribedBy}</p>
                    </div>
                  </motion.div>
                ))}
              </section>
            )
          })}

          {/* ASHA/Doctor note */}
          <div className="card p-4 bg-amber-50 border-amber-100">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Note for consultation:</strong> Amlodipine 5mg was prescribed at District Hospital (Feb 2026) but OCR suggests possible non-compliance. Verify adherence and consider dose adjustment for Stage 2 HTN.
            </p>
            <AIPill className="mt-2" />
          </div>
        </div>
      )}

      {/* REPORTS & UPLOADS */}
      {tab === 'reports' && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-[#5F5E5A]">{reportsOnly.length} documents on record — uploaded reports, lab PDFs, imaging, and OCR-extracted prescriptions.</p>
          {reportsOnly.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${v.type === 'lab' ? 'bg-indigo-50' : v.type === 'imaging' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                {typeIcon[v.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#2C2C2A] truncate">{v.reportFile}</p>
                <p className="text-xs text-[#5F5E5A] mt-0.5">{v.title} · {v.date}</p>
                <p className="text-xs text-[#5F5E5A]">{v.facility} · {v.worker}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`${typeBadge[v.type]} text-[10px]`}>
                  {v.type === 'ocr-upload' ? 'OCR' : v.type}
                </span>
                <button
                  className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 font-medium"
                  aria-label={`Download ${v.reportFile}`}>
                  <Download size={11} aria-hidden="true" /> Download
                </button>
              </div>
            </motion.div>
          ))}

          {/* Role-based context note */}
          {role === 'asha' && (
            <div className="card p-4 bg-teal-50 border-teal-100">
              <p className="text-xs text-teal-800 leading-relaxed">
                As ASHA, you can upload new documents using the <strong>Upload Docs (OCR)</strong> option in the sidebar. Uploaded files are automatically extracted and attached to this record.
              </p>
            </div>
          )}
          {role === 'doctor' && (
            <div className="card p-4 bg-indigo-50 border-indigo-100">
              <p className="text-xs text-indigo-800 leading-relaxed">
                All reports here are ABDM-linked and accessible across facilities. The lipid profile and ECHO support cardiovascular risk assessment for this hypertensive patient.
              </p>
              <AIPill className="mt-2" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
