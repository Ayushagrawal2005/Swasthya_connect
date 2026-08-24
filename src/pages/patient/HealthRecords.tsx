// Module 1 — Patient Identity & Record
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, FlaskConical, Pill, Stethoscope, Download,
  Search, ChevronDown, ChevronRight, Shield, User,
} from 'lucide-react'

type RecordType = 'visit' | 'lab' | 'prescription' | 'diagnosis'

interface Record {
  id: string
  date: string
  type: RecordType
  title: string
  facility: string
  doctor: string
  detail: string
}

const records: Record[] = [
  { id: 'R001', date: '20 Aug 2026', type: 'visit', title: 'ANC Check-up (28W)', facility: 'PHC Beed', doctor: 'Dr. Patil', detail: 'BP: 118/76 · Fetal heart rate: 142 bpm · Weight: 62 kg. Advised iron supplementation and rest.' },
  { id: 'R002', date: '18 Aug 2026', type: 'lab', title: 'CBC (Complete Blood Count)', facility: 'PHC Beed', doctor: 'Dr. Patil', detail: 'Hb: 11.2 g/dL (low) · WBC: 8,400 · Platelets: 2.1 lac. Mild anaemia noted.' },
  { id: 'R003', date: '15 Aug 2026', type: 'prescription', title: 'Iron + Folic Acid', facility: 'PHC Beed', doctor: 'Dr. Patil', detail: 'Tab Iron + Folic Acid — 1 tab daily after food for 90 days. Tab Calcium — 1 tab at night.' },
  { id: 'R004', date: '1 Aug 2026', type: 'visit', title: 'ANC Check-up (26W)', facility: 'Sub-centre Mandav', doctor: 'ASHA Kavita', detail: 'Routine check. Fundal height: 26 cm. Referred to PHC for CBC.' },
  { id: 'R005', date: '10 Jul 2026', type: 'diagnosis', title: 'Gestational Diabetes — Borderline', facility: 'PHC Beed', doctor: 'Dr. Patil', detail: 'OGTT: 140 mg/dL (borderline). Diet management recommended. Review in 4 weeks.' },
]

const typeConfig: { [K in RecordType]: { icon: React.ReactNode; color: string; label: string } } = {
  visit:        { icon: <Stethoscope size={15} />, color: 'bg-teal-50 text-teal-600 border-teal-200',  label: 'Visit' },
  lab:          { icon: <FlaskConical size={15} />,  color: 'bg-indigo-50 text-indigo-600 border-indigo-200', label: 'Lab' },
  prescription: { icon: <Pill size={15} />,          color: 'bg-green-50 text-green-600 border-green-200', label: 'Rx' },
  diagnosis:    { icon: <FileText size={15} />,       color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Diagnosis' },
}

export function HealthRecordsPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RecordType | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = records.filter(r =>
    (filter === 'all' || r.type === filter) &&
    (r.title.toLowerCase().includes(query.toLowerCase()) || r.facility.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Patient ID card */}
      <div className="card p-4 flex items-center gap-3 border-l-4 border-l-teal-500">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
          <User size={20} className="text-teal-600" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#2C2C2A] text-sm">Priya Sharma</p>
          <p className="text-xs text-[#5F5E5A]">ABHA ID: 91-3412-5678-1234 · F · 28 yrs</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 border border-teal-200 px-2 py-1 rounded-full">
          <Shield size={10} aria-hidden="true" /> ABDM linked
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A]" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search records…"
            className="input-field pl-9 py-2 text-sm"
            aria-label="Search health records"
          />
        </div>
        <div className="flex gap-1 flex-wrap" role="group" aria-label="Filter by type">
          {(['all', 'visit', 'lab', 'prescription', 'diagnosis'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize
                ${filter === t ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#5F5E5A] border-[#D3D1C7] hover:border-teal-300'}`}
              aria-pressed={filter === t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <section aria-label="Health record timeline">
        <div className="relative space-y-3">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-[#D3D1C7]" aria-hidden="true" />

          {filtered.length === 0 && (
            <p className="text-sm text-[#5F5E5A] text-center py-8">No records match your search.</p>
          )}

          {filtered.map((r, i) => {
            const cfg = typeConfig[r.type]
            const isOpen = expanded === r.id
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-10"
              >
                {/* Dot */}
                <div className={`absolute left-0 top-3 w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${cfg.color}`} aria-hidden="true">
                  {cfg.icon}
                </div>

                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="card w-full text-left p-4 hover:shadow-card-hover transition-all"
                  aria-expanded={isOpen}
                  aria-controls={`record-${r.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-[#5F5E5A]">{r.date}</span>
                      </div>
                      <p className="font-semibold text-sm text-[#2C2C2A]">{r.title}</p>
                      <p className="text-xs text-[#5F5E5A] mt-0.5">{r.facility} · {r.doctor}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-[#5F5E5A] hover:bg-teal-50 hover:text-teal-600 transition-colors"
                        aria-label={`Download ${r.title}`}
                      >
                        <Download size={14} aria-hidden="true" />
                      </button>
                      {isOpen ? <ChevronDown size={14} className="text-[#5F5E5A]" /> : <ChevronRight size={14} className="text-[#5F5E5A]" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div id={`record-${r.id}`} className="mt-3 pt-3 border-t border-[#D3D1C7]">
                      <p className="text-sm text-[#5F5E5A] leading-relaxed">{r.detail}</p>
                    </div>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
