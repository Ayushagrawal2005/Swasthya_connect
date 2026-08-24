import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, FlaskConical, Pill, Stethoscope, Download, Search, ChevronDown, Shield } from 'lucide-react'
import { patientsApi, type VisitRecord } from '../../services/api'
import { useApp } from '../../context/AppContext'

type RecordType = 'visit' | 'lab' | 'prescription' | 'diagnosis' | 'referral' | 'ocr-upload' | 'imaging'

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  visit:        { icon: <Stethoscope size={15} />, color: 'bg-teal-50 text-teal-600 border-teal-200',     label: 'Visit' },
  lab:          { icon: <FlaskConical size={15} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', label: 'Lab' },
  prescription: { icon: <Pill size={15} />,         color: 'bg-green-50 text-green-600 border-green-200',   label: 'Rx' },
  diagnosis:    { icon: <FileText size={15} />,      color: 'bg-amber-50 text-amber-600 border-amber-200',   label: 'Diagnosis' },
  referral:     { icon: <FileText size={15} />,      color: 'bg-coral-50 text-coral-600 border-coral-200',   label: 'Referral' },
  'ocr-upload': { icon: <FileText size={15} />,      color: 'bg-purple-50 text-purple-600 border-purple-200',label: 'OCR Upload' },
  imaging:      { icon: <FileText size={15} />,      color: 'bg-blue-50 text-blue-600 border-blue-200',      label: 'Imaging' },
}

export function HealthRecordsPage() {
  const { patientId } = useApp()
  const [records, setRecords] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RecordType | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const pid = patientId || 'P-PRIYA-002'
    patientsApi.getRecords(pid, filter !== 'all' ? filter : undefined, query || undefined)
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId, filter, query])

  const filtered = records

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Health Records</h1>
        <div className="flex items-center gap-2 mt-1">
          <Shield size={12} className="text-teal-500" />
          <p className="text-xs text-[#5F5E5A]">ABDM-compliant · End-to-end encrypted</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A]" />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search records…" className="input-field pl-9 text-sm" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'visit', 'lab', 'prescription', 'diagnosis'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize
              ${filter === f ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#5F5E5A] border-[#D3D1C7] hover:border-teal-300'}`}>
            {f === 'all' ? 'All records' : typeConfig[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Records list */}
      <div className="space-y-2" role="list">
        {loading ? (
          <div className="flex justify-center py-8 text-[#5F5E5A]">Loading…</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-center text-[#5F5E5A] py-8">No records found.</p>
        ) : filtered.map((rec, i) => {
          const cfg = typeConfig[rec.type] || typeConfig.visit
          const isOpen = expanded === rec.id
          return (
            <motion.div key={rec.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card overflow-hidden" role="listitem">
              <button onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="w-full p-4 flex items-start gap-3 text-left"
                aria-expanded={isOpen}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-medium text-sm text-[#2C2C2A]">{rec.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-[#5F5E5A]">{rec.facility} · {rec.date}</p>
                  {rec.worker && <p className="text-xs text-[#5F5E5A]">{rec.worker}</p>}
                </div>
                <ChevronDown size={14} className={`text-[#5F5E5A] transition-transform flex-shrink-0 mt-1 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#D3D1C7]/50">
                  <p className="text-sm text-[#5F5E5A] leading-relaxed mt-3">{rec.detail}</p>
                  {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {Object.entries(rec.vitals).map(([k, v]) => (
                        <span key={k} className="text-xs bg-gray-50 border border-[#D3D1C7] rounded-full px-2.5 py-1 font-mono">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  {rec.riskScore !== undefined && (
                    <p className="text-xs text-amber-600 mt-2">Risk score: {rec.riskScore}/100</p>
                  )}
                  <button className="flex items-center gap-1.5 text-xs text-teal-600 mt-3 hover:text-teal-700">
                    <Download size={12} /> Download record
                  </button>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
