import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
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
  const { patientId: ctxPatientId } = useApp()
  const [searchParams] = useSearchParams()
  const [records, setRecords] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RecordType | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const pid = searchParams.get('id') || ctxPatientId
    if (!pid) { setLoading(false); return }
    setLoading(true)
    patientsApi.getRecords(pid, filter !== 'all' ? filter : undefined, query || undefined)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [ctxPatientId, searchParams, filter, query])

  const filtered = records

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Health Records</h1>
              <div className="flex items-center gap-2 mt-1">
                <Shield size={16} className="text-green-300" />
                <p className="text-sm text-blue-100">ABDM-compliant · End-to-end encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search records by diagnosis, medicine, or doctor..." 
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#123B6D] focus:ring-2 focus:ring-[#123B6D]/20 bg-white shadow-lg transition-all text-base" />
        </div>

        {/* Filter */}
        <div className="flex gap-3 flex-wrap">
        {(['all', 'visit', 'lab', 'prescription', 'diagnosis'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all capitalize shadow-md
              ${filter === f ? 'bg-[#123B6D] text-white border-[#123B6D]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#E85D04] hover:text-[#E85D04]'}`}>
            {f === 'all' ? 'All Records' : typeConfig[f]?.label ?? f}
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
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-base text-[#123B6D]">{rec.title}</p>
                    <span className={`text-xs px-3 py-1 rounded-full border-2 font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">{rec.facility} · {rec.date}</p>
                  {rec.worker && <p className="text-sm text-gray-500 mt-1">{rec.worker}</p>}
                </div>
                <ChevronDown size={20} className={`text-[#123B6D] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 border-t-2 border-gray-100 bg-gradient-to-br from-blue-50/30 to-orange-50/30">
                  <p className="text-sm text-gray-700 leading-relaxed mt-4">{rec.detail}</p>
                  {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {Object.entries(rec.vitals).map(([k, v]) => (
                        <span key={k} className="text-sm bg-white border-2 border-[#123B6D]/20 rounded-lg px-4 py-2 font-semibold text-[#123B6D]">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  {rec.riskScore !== undefined && (
                    <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                      <p className="text-sm text-amber-800 font-medium">Risk score: {rec.riskScore}/100</p>
                    </div>
                  )}
                  <button className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-[#E85D04] to-[#d94f03] px-6 py-2.5 rounded-lg mt-4 hover:shadow-lg transition-all duration-200">
                    <Download size={16} /> Download Record
                  </button>
                </div>
              )}
            </motion.div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
