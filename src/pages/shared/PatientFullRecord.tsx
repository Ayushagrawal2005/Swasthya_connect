/**
 * Shared — Full Longitudinal Patient Record
 * Accessible to ASHA worker and Doctor
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Shield, Pill, AlertTriangle, Clock,
  ChevronDown, Stethoscope, FlaskConical,
  FileText, ArrowRight, Download, DropletIcon, Loader2,
} from 'lucide-react'
import { patientsApi, type PatientRecord, type VisitRecord } from '../../services/api'
import { AIPill } from '../../components/ui/AIPill'
import { useApp } from '../../context/AppContext'

type Tab = 'overview' | 'history' | 'diseases' | 'medications' | 'reports'
type RecordType = 'visit' | 'lab' | 'prescription' | 'diagnosis' | 'referral' | 'ocr-upload' | 'imaging'

const typeIcon: Record<string, React.ReactNode> = {
  visit:        <Stethoscope size={14} className="text-teal-500" />,
  lab:          <FlaskConical size={14} className="text-indigo-500" />,
  prescription: <Pill size={14} className="text-green-500" />,
  diagnosis:    <FileText size={14} className="text-amber-500" />,
  referral:     <ArrowRight size={14} className="text-coral-500" />,
  'ocr-upload': <FileText size={14} className="text-purple-500" />,
  imaging:      <FileText size={14} className="text-blue-500" />,
}

const typeBadge: Record<string, string> = {
  visit:        'badge-teal',
  lab:          'bg-indigo-50 text-indigo-700 border-indigo-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
  prescription: 'badge-green',
  diagnosis:    'badge-amber',
  referral:     'badge-amber',
  'ocr-upload': 'bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
  imaging:      'bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
}

const riskBadge: Record<string, string> = {
  low: 'badge-green', medium: 'badge-amber', high: 'badge-red', emergency: 'badge-red',
}

export function PatientFullRecord() {
  const { role, patientId } = useApp()
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<RecordType | 'all'>('all')

  useEffect(() => {
    const pid = (role === 'patient' ? patientId : null) || 'P-MEENA-001'
    patientsApi.get(pid)
      .then(p => {
        setPatient(p)
        if (p.visits?.length) setExpanded(p.visits[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [role, patientId])

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-teal-400" size={28} /></div>
  }
  if (!patient) {
    return <p className="text-center text-sm text-[#5F5E5A] mt-12">Patient record not found.</p>
  }

  const filteredVisits = filterType === 'all'
    ? (patient.visits || [])
    : (patient.visits || []).filter(v => v.type === filterType)

  const reportsOnly = (patient.visits || []).filter(v => v.reportFile)
  const initials = patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview',    label: 'Overview' },
    { id: 'history',     label: 'Visit history',   count: patient.visits?.length },
    { id: 'diseases',    label: 'Disease history', count: patient.diseaseHistory?.length },
    { id: 'medications', label: 'Medications',     count: patient.medications?.length },
    { id: 'reports',     label: 'Reports & uploads', count: reportsOnly.length },
  ]

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in">

      {/* Identity card */}
      <div className="card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-lg font-semibold text-teal-700 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-semibold text-lg text-[#2C2C2A]">{patient.name}</h1>
              <span className="text-sm text-[#5F5E5A]">{patient.age}y · {patient.gender} · {patient.dob || '—'}</span>
            </div>
            <p className="text-xs text-[#5F5E5A] mb-1">{patient.village} · 📞 {patient.phone} · 🗣 {patient.language}</p>
            <p className="text-xs font-mono text-teal-600 mb-2">ABDM ID: {patient.healthId}</p>
            <div className="flex flex-wrap gap-1.5">
              {patient.bloodGroup && (
                <span className="badge-teal text-[10px] flex items-center gap-1">
                  <DropletIcon size={9} /> {patient.bloodGroup}
                </span>
              )}
              {patient.allergies?.map(a => (
                <span key={a} className="badge-red text-[10px]">⚠ {a}</span>
              ))}
              {patient.conditions?.map(c => (
                <span key={c} className="badge-amber text-[10px]">{c}</span>
              ))}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[#5F5E5A]">{patient.visits?.length ?? 0} visits</p>
            {patient.noShowCount > 0 && (
              <p className="text-xs text-amber-600 mt-0.5">{patient.noShowCount} missed</p>
            )}
            <AIPill className="mt-2" />
          </div>
        </div>
        {/* ABDM badge */}
        <div className="mt-3 flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
          <Shield size={12} /> ABDM/FHIR compliant · Accessible at all connected facilities
          {role === 'asha' && <span className="ml-auto text-[10px] bg-teal-100 px-2 py-0.5 rounded-full">ASHA view</span>}
          {role === 'doctor' && <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Doctor view</span>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#D3D1C7] overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5
              ${tab === t.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'}`}>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[10px] bg-gray-100 text-[#5F5E5A] px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {patient.noShowCount > 0 && (
                <div className="card p-4 flex items-start gap-3 border-l-4 border-l-amber-400">
                  <Clock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2A]">No-show risk</p>
                    <p className="text-xs text-[#5F5E5A]">Patient has {patient.noShowCount} missed visit(s) out of {patient.totalFollowUps} scheduled.</p>
                  </div>
                </div>
              )}
              {/* Latest vitals from most recent visit */}
              {patient.visits?.[0]?.vitals && Object.keys(patient.visits[0].vitals).length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-3">Latest vitals ({patient.visits[0].date})</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {Object.entries(patient.visits[0].vitals).map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-xs font-semibold text-[#2C2C2A] tabular-nums">{v}</p>
                        <p className="text-[10px] text-[#5F5E5A] uppercase mt-0.5">{k}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Risk score from latest triage */}
              {patient.visits?.[0]?.riskScore !== undefined && (
                <div className="card p-4 flex items-center gap-3">
                  <div>
                    <p className="text-xs text-[#5F5E5A] uppercase tracking-wide">Latest triage score</p>
                    <p className="text-2xl font-bold tabular-nums text-[#2C2C2A]">
                      {patient.visits[0].riskScore}<span className="text-sm font-normal">/100</span>
                    </p>
                  </div>
                  <span className={`${riskBadge[patient.visits[0].riskLevel ?? 'low']} ml-auto`}>
                    {patient.visits[0].riskLevel}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* VISIT HISTORY */}
          {tab === 'history' && (
            <div className="space-y-4">
              {/* Type filter */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'visit', 'lab', 'prescription', 'diagnosis'] as const).map(f => (
                  <button key={f} onClick={() => setFilterType(f)} aria-pressed={filterType === f}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize
                      ${filterType === f ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#5F5E5A] border-[#D3D1C7] hover:border-teal-300'}`}>
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>

              {filteredVisits.length === 0 && (
                <p className="text-sm text-[#5F5E5A] text-center py-8">No records found.</p>
              )}

              <div className="relative space-y-3">
                <div className="absolute left-[17px] top-4 bottom-0 w-0.5 bg-[#D3D1C7]" aria-hidden="true" />
                {filteredVisits.map((v, i) => {
                  const isOpen = expanded === v.id
                  return (
                    <div key={v.id} className="relative pl-10">
                      <div className="absolute left-0 top-3 w-9 h-9 rounded-full border border-[#D3D1C7] bg-white flex items-center justify-center">
                        {typeIcon[v.type] ?? <FileText size={14} className="text-gray-400" />}
                      </div>
                      <motion.button onClick={() => setExpanded(isOpen ? null : v.id)}
                        className="card w-full text-left p-4 hover:shadow-card-hover transition-all"
                        aria-expanded={isOpen} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className={`${typeBadge[v.type] || 'badge-teal'} text-[10px]`}>
                                {v.type.replace('-', ' ')}
                              </span>
                              <span className="text-[10px] text-[#5F5E5A]">{v.date}</span>
                              {v.riskScore !== undefined && (
                                <span className={`${riskBadge[v.riskLevel ?? 'low']} text-[10px]`}>Score {v.riskScore}</span>
                              )}
                            </div>
                            <p className="font-medium text-sm text-[#2C2C2A]">{v.title}</p>
                            <p className="text-[10px] text-[#5F5E5A] mt-0.5">{v.facility} · {v.worker}</p>
                          </div>
                          <ChevronDown size={14} className={`text-[#5F5E5A] flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-[#D3D1C7]/50 space-y-2">
                            <p className="text-sm text-[#5F5E5A] leading-relaxed">{v.detail}</p>
                            {v.vitals && Object.keys(v.vitals).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {Object.entries(v.vitals).map(([k, val]) => (
                                  <span key={k} className="text-xs bg-gray-50 border border-[#D3D1C7] rounded-full px-2.5 py-1 font-mono">
                                    {k}: {val}
                                  </span>
                                ))}
                              </div>
                            )}
                            {v.reportFile && (
                              <button className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 mt-1">
                                <Download size={12} /> Download {v.reportFile}
                              </button>
                            )}
                          </div>
                        )}
                      </motion.button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* DISEASE HISTORY */}
          {tab === 'diseases' && (
            <div className="space-y-3">
              {(patient.diseaseHistory || []).length === 0 && (
                <p className="text-sm text-center text-[#5F5E5A] py-8">No disease history recorded.</p>
              )}
              {(patient.diseaseHistory || []).map((d, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm text-[#2C2C2A]">{d.name}</p>
                        {d.icd10 && <span className="text-[10px] font-mono text-[#5F5E5A] bg-gray-50 px-1.5 py-0.5 rounded">{d.icd10}</span>}
                      </div>
                      <p className="text-xs text-[#5F5E5A]">Since {d.since}</p>
                      {d.notes && <p className="text-sm text-[#5F5E5A] mt-1 leading-relaxed">{d.notes}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-medium flex-shrink-0
                      ${d.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        d.status === 'chronic' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-green-50 text-green-700 border-green-200'}`}>
                      {d.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* MEDICATIONS */}
          {tab === 'medications' && (
            <div className="space-y-3">
              {(patient.medications || []).length === 0 && (
                <p className="text-sm text-center text-[#5F5E5A] py-8">No medications recorded.</p>
              )}
              {(patient.medications || []).map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Pill size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{m.drug} <span className="font-normal text-[#5F5E5A]">{m.dose}</span></p>
                    <p className="text-xs text-[#5F5E5A]">{m.frequency} · Since {m.since} · {m.prescribedBy}</p>
                    <p className="text-[10px] text-[#5F5E5A] capitalize">{m.source}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-medium flex-shrink-0
                    ${m.status === 'current' ? 'bg-green-50 text-green-700 border-green-200' :
                      m.status === 'discontinued' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {m.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* REPORTS */}
          {tab === 'reports' && (
            <div className="space-y-3">
              {reportsOnly.length === 0 && (
                <p className="text-sm text-center text-[#5F5E5A] py-8">No uploaded reports.</p>
              )}
              {reportsOnly.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{v.title}</p>
                    <p className="text-xs text-[#5F5E5A]">{v.date} · {v.facility}</p>
                    <p className="text-[10px] text-[#5F5E5A] mt-0.5">{v.reportFile}</p>
                  </div>
                  <button className="text-teal-600 hover:text-teal-700 flex-shrink-0" aria-label="Download report">
                    <Download size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
