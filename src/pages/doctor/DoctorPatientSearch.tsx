/**
 * Doctor — Patient Search & Record Access
 * Search any patient by name, phone, or health ID
 * View their complete records: visits, OCR uploads, medicines, referrals
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, User, FileText, Pill, FlaskConical, ArrowRight,
  ChevronDown, ChevronRight, Loader2, AlertCircle, Stethoscope,
  Calendar, Phone, MapPin, Activity, CheckCircle2
} from 'lucide-react'
import { patientsApi, type PatientRecord } from '../../services/api'
import axios from 'axios'

interface MedRecord {
  id: string
  type: string
  title: string
  date: string
  detail: string
  facility: string
  worker: string
  documentType?: string
  summary?: string
  medicines?: Array<{ name: string; dosage?: string; frequency?: string }>
  testValues?: Array<{ test_name: string; value?: string; unit?: string; is_abnormal?: boolean }>
  vitals?: Record<string, string>
}

const typeIcon: Record<string, React.ReactNode> = {
  visit:       <Stethoscope size={14} className="text-green-600" />,
  lab:         <FlaskConical size={14} className="text-indigo-500" />,
  prescription:<Pill size={14} className="text-green-500" />,
  'ocr-upload':<FileText size={14} className="text-amber-600" />,
  diagnosis:   <FileText size={14} className="text-blue-500" />,
  default:     <FileText size={14} className="text-gray-400" />,
}

const typeBg: Record<string, string> = {
  visit:       'bg-green-50 text-green-700 border-green-200',
  lab:         'bg-indigo-50 text-indigo-700 border-indigo-200',
  prescription:'bg-emerald-50 text-emerald-700 border-emerald-200',
  'ocr-upload':'bg-amber-50 text-amber-700 border-amber-200',
  default:     'bg-gray-50 text-gray-600 border-gray-200',
}

export function DoctorPatientSearch() {
  const navigate = useNavigate()
  const [query, setQuery]         = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults]     = useState<PatientRecord[]>([])
  const [searched, setSearched]   = useState(false)
  const [patient, setPatient]     = useState<PatientRecord | null>(null)
  const [records, setRecords]     = useState<MedRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'records' | 'medicines' | 'referrals'>('records')
  const [referrals, setReferrals] = useState<any[]>([])
  const [medicines, setMedicines] = useState<any[]>([])

  async function doSearch() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearched(false)
    setPatient(null)
    setResults([])
    try {
      const res = await patientsApi.search(q)
      setResults(res)
      setSearched(true)
    } catch {
      setResults([])
      setSearched(true)
    } finally {
      setSearching(false)
    }
  }

  async function selectPatient(p: PatientRecord) {
    setPatient(p)
    setLoadingRecords(true)
    setRecords([])
    setReferrals([])
    setMedicines([])
    setExpanded(null)
    setActiveTab('records')

    const token = localStorage.getItem('swasthya_token')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      const [recs, refs, meds] = await Promise.all([
        axios.get(`http://localhost:4000/patients/${p.id}/records`, { headers })
          .then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
        axios.get(`http://localhost:4000/patients/${p.id}/referrals`, { headers })
          .then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
        axios.get(`http://localhost:4000/patients/${p.id}/medicines`, { headers })
          .then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
      ])
      setRecords(recs)
      setReferrals(refs)
      setMedicines(meds)
    } finally {
      setLoadingRecords(false)
    }
  }

  const urgencyBadge: Record<string, string> = { routine: 'badge-teal', urgent: 'badge-amber', emergency: 'badge-red' }
  const statusBadge:  Record<string, string> = { pending: 'badge-amber', accepted: 'badge-green', treated: 'badge-teal', redirected: 'badge-amber' }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Patient records</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Search by name, mobile number, or Health ID</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A]" />
          <input
            type="search" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Meena Patil, 9876543240, 91-XXXX…"
            className="input-field pl-9 text-sm"
          />
        </div>
        <button onClick={doSearch} disabled={!query.trim() || searching}
          className="btn-primary px-5 flex items-center gap-2">
          {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </div>

      {/* Search results list */}
      {searched && !patient && (
        <AnimatePresence>
          {results.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-sm text-[#5F5E5A] p-4 card">
              <AlertCircle size={16} className="text-amber-500" />
              No patients found for "{query}".
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <p className="text-xs text-[#5F5E5A] font-medium">{results.length} patient{results.length > 1 ? 's' : ''} found</p>
              {results.map(p => (
                <button key={p.id} onClick={() => selectPatient(p)}
                  className="card-hover w-full p-4 flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700 flex-shrink-0">
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{p.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-[#5F5E5A]">
                      <span>{p.age}y · {p.gender}</span>
                      <span className="flex items-center gap-1"><MapPin size={10} />{p.village}</span>
                      <span className="flex items-center gap-1"><Phone size={10} />{p.phone}</span>
                    </div>
                    <p className="text-[10px] text-[#9E9C94] mt-0.5 font-mono">{p.healthId}</p>
                  </div>
                  {p.conditions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 flex-shrink-0 max-w-[120px]">
                      {p.conditions.slice(0, 2).map(c => (
                        <span key={c} className="badge-amber text-[10px]">{c}</span>
                      ))}
                    </div>
                  )}
                  <ChevronRight size={14} className="text-[#5F5E5A] flex-shrink-0" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Patient detail view */}
      {patient && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Patient card */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-lg font-semibold text-green-700 flex-shrink-0">
                {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-[#2C2C2A]">{patient.name}</h2>
                  <span className="text-xs text-[#5F5E5A]">{patient.age}y · {patient.gender}</span>
                  {patient.bloodGroup && <span className="badge-teal text-[10px]">{patient.bloodGroup}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#5F5E5A]">
                  <span className="flex items-center gap-1"><MapPin size={10} />{patient.village}</span>
                  <span className="flex items-center gap-1"><Phone size={10} />{patient.phone}</span>
                </div>
                <p className="text-[10px] text-[#9E9C94] mt-0.5 font-mono">ABDM: {patient.healthId}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patient.conditions?.map(c => (
                    <span key={c} className="badge-amber text-[10px]">{c}</span>
                  ))}
                  {patient.allergies?.map(a => (
                    <span key={a} className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => { setPatient(null); setResults([]); setSearched(false) }}
                className="text-xs text-[#FF9933] hover:underline flex-shrink-0">
                Change patient
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#D3D1C7]">
            {([
              { id: 'records',   label: `Records (${records.length})` },
              { id: 'medicines', label: `Medicines (${medicines.length})` },
              { id: 'referrals', label: `Referrals (${referrals.length})` },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.id
                    ? 'border-[#138808] text-[#138808]'
                    : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {loadingRecords ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#138808]" size={28} />
            </div>
          ) : (
            <>
              {/* Records tab */}
              {activeTab === 'records' && (
                <div className="space-y-2">
                  {records.length === 0 ? (
                    <p className="text-sm text-[#5F5E5A] text-center py-8 card">No records found for this patient.</p>
                  ) : records.map((rec, i) => {
                    const icon = typeIcon[rec.type] || typeIcon.default
                    const bg   = typeBg[rec.type]  || typeBg.default
                    const isOpen = expanded === rec.id
                    return (
                      <motion.div key={rec.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}>
                        <button onClick={() => setExpanded(isOpen ? null : rec.id)}
                          className="card-hover w-full p-4 flex items-start gap-3 text-left">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 mt-0.5 ${bg}`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="font-semibold text-sm text-[#2C2C2A]">{rec.title}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${bg}`}>
                                {rec.type === 'ocr-upload' ? 'OCR Upload' : rec.type}
                              </span>
                            </div>
                            <p className="text-xs text-[#5F5E5A]">
                              {rec.facility && `${rec.facility} · `}
                              {rec.worker && `${rec.worker} · `}
                              {rec.date ? new Date(rec.date).toLocaleDateString('en-IN') : '—'}
                            </p>
                            {rec.detail && !isOpen && (
                              <p className="text-xs text-[#5F5E5A] mt-1 line-clamp-1">{rec.detail}</p>
                            )}
                          </div>
                          {isOpen ? <ChevronDown size={14} className="text-[#5F5E5A] flex-shrink-0 mt-1" />
                                  : <ChevronRight size={14} className="text-[#5F5E5A] flex-shrink-0 mt-1" />}
                        </button>

                        {/* Expanded detail */}
                        {isOpen && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            className="mx-2 mb-2 p-4 bg-gray-50 rounded-b-xl border border-t-0 border-[#D3D1C7] space-y-3 overflow-hidden">
                            {rec.detail && <p className="text-sm text-[#2C2C2A] leading-relaxed">{rec.detail}</p>}
                            {rec.summary && rec.summary !== rec.detail && (
                              <p className="text-sm text-[#2C2C2A] leading-relaxed">{rec.summary}</p>
                            )}
                            {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {rec.vitals.bp    && <span className="badge-teal text-xs">BP {rec.vitals.bp}</span>}
                                {rec.vitals.temp  && <span className="badge-teal text-xs">Temp {rec.vitals.temp}°F</span>}
                                {rec.vitals.pulse && <span className="badge-teal text-xs">Pulse {rec.vitals.pulse}</span>}
                                {rec.vitals.spo2  && <span className="badge-teal text-xs">SpO2 {rec.vitals.spo2}%</span>}
                              </div>
                            )}
                            {rec.medicines && rec.medicines.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-[#5F5E5A] mb-1.5">Medicines extracted:</p>
                                <div className="space-y-1">
                                  {rec.medicines.map((m, mi) => (
                                    <div key={mi} className="text-xs text-[#2C2C2A] bg-white border border-[#D3D1C7] rounded-lg px-3 py-2">
                                      <span className="font-medium">{m.name}</span>
                                      {m.dosage && <span className="text-[#5F5E5A]"> · {m.dosage}</span>}
                                      {m.frequency && <span className="text-[#5F5E5A]"> · {m.frequency}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {rec.testValues && rec.testValues.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-[#5F5E5A] mb-1.5">Lab results:</p>
                                <div className="space-y-1">
                                  {rec.testValues.map((t, ti) => (
                                    <div key={ti} className={`text-xs rounded-lg px-3 py-2 border ${t.is_abnormal ? 'bg-red-50 border-red-200' : 'bg-white border-[#D3D1C7]'}`}>
                                      <span className="font-medium text-[#2C2C2A]">{t.test_name}</span>
                                      {t.value && <span className="text-[#5F5E5A]"> : {t.value} {t.unit || ''}</span>}
                                      {t.is_abnormal && <span className="text-red-600 font-semibold ml-2">⚠ Abnormal</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Medicines tab */}
              {activeTab === 'medicines' && (
                <div className="space-y-2">
                  {medicines.length === 0 ? (
                    <p className="text-sm text-[#5F5E5A] text-center py-8 card">No medicines on record.</p>
                  ) : medicines.map((m: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="card p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Pill size={16} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#2C2C2A]">{m.drug || m.name}</p>
                        <p className="text-xs text-[#5F5E5A]">
                          {m.dose || m.dosage}{m.frequency ? ` · ${m.frequency}` : ''}{m.prescribedBy ? ` · ${m.prescribedBy}` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        m.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>{m.status || 'active'}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Referrals tab */}
              {activeTab === 'referrals' && (
                <div className="space-y-2">
                  {referrals.length === 0 ? (
                    <p className="text-sm text-[#5F5E5A] text-center py-8 card">No referrals for this patient.</p>
                  ) : referrals.map((r: any, i: number) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`card p-4 space-y-2 ${r.urgency === 'emergency' ? 'border-l-4 border-l-red-500' : r.urgency === 'urgent' ? 'border-l-4 border-l-amber-400' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="font-semibold text-sm text-[#2C2C2A]">{r.toFacilityName}</p>
                            <span className={`${urgencyBadge[r.urgency] || 'badge-teal'} text-[10px]`}>{r.urgency}</span>
                            <span className={`${statusBadge[r.status] || 'badge-amber'} text-[10px]`}>{r.status}</span>
                          </div>
                          <p className="text-xs text-[#5F5E5A]">By {r.createdBy} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#5F5E5A]">{r.reason}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}
