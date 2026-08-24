// ASHA — Follow-up board (Module 8, frontline view)
// Mirrors the Meena scenario from report §14
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, Phone, ChevronDown, Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AIPill } from '../../components/ui/AIPill'

type Status = 'overdue' | 'due-today' | 'upcoming' | 'done'

interface Case {
  id: string
  name: string
  age: number
  condition: string
  risk: 'high' | 'medium' | 'low'
  dueDate: string
  status: Status
  phone: string
  notes: string
  lastVisit: string
  nextStep: string
}

// Meena scenario + other cases from the report
const cases: Case[] = [
  {
    id: 'FU001', name: 'Meena Jadhav', age: 24,
    condition: 'High-risk pregnancy (32W) — BP borderline high',
    risk: 'high', dueDate: '21 Aug 2026', status: 'overdue',
    phone: '9876543210',
    notes: 'BP was 148/92 on last visit. Doctor prescribed methyldopa via teleconsult. Specialist visit at district hospital in 2 days — confirm transport.',
    lastVisit: '14 Aug 2026',
    nextStep: 'Check BP today + confirm hospital appointment for 25 Aug',
  },
  {
    id: 'FU002', name: 'Rekha Pawar', age: 19,
    condition: 'First pregnancy (20W) — anaemia',
    risk: 'medium', dueDate: '23 Aug 2026', status: 'due-today',
    phone: '9823456789',
    notes: 'Hb 9.8 on last check. Iron supplements dispensed. Check compliance today.',
    lastVisit: '16 Aug 2026',
    nextStep: 'Verify iron tablet compliance, re-check Hb',
  },
  {
    id: 'FU003', name: 'Ganesh Wagh', age: 48,
    condition: 'TB treatment — Week 8 (DOTS)',
    risk: 'medium', dueDate: '23 Aug 2026', status: 'due-today',
    phone: '9765432109',
    notes: 'DOTS observation required today. Missed 3 doses last week. Critical to verify.',
    lastVisit: '20 Aug 2026',
    nextStep: 'Observe DOTS dose today, record compliance',
  },
  {
    id: 'FU004', name: 'Sunita Bai', age: 67,
    condition: 'Hypertension (long-term)',
    risk: 'low', dueDate: '27 Aug 2026', status: 'upcoming',
    phone: '9854321098',
    notes: 'BP controlled on current medication. Monthly check-in.',
    lastVisit: '20 Aug 2026',
    nextStep: 'Routine BP check and medicine refill',
  },
  {
    id: 'FU005', name: 'Lata Kale', age: 8,
    condition: 'Malnutrition — Grade II',
    risk: 'high', dueDate: '20 Aug 2026', status: 'overdue',
    phone: '9812345678',
    notes: 'Weight 14 kg (expected 20 kg for age). Referred to NRC. Confirm if admitted.',
    lastVisit: '12 Aug 2026',
    nextStep: 'Confirm NRC admission / home visit',
  },
]

const statusStyle: Record<Status, string> = {
  overdue:    'bg-red-50 border-l-4 border-l-red-500',
  'due-today':'bg-amber-50 border-l-4 border-l-amber-400',
  upcoming:   'bg-white border-l-4 border-l-teal-300',
  done:       'bg-gray-50 border-l-4 border-l-gray-300 opacity-60',
}

const riskBadge: Record<string, string> = {
  high: 'badge-red', medium: 'badge-amber', low: 'badge-green',
}

export function AshaFollowUpPage() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string | null>('FU001') // Meena expanded by default
  const [done, setDone] = useState<Set<string>>(new Set())

  const grouped: Record<Status, Case[]> = {
    overdue:     cases.filter(c => !done.has(c.id) && c.status === 'overdue'),
    'due-today': cases.filter(c => !done.has(c.id) && c.status === 'due-today'),
    upcoming:    cases.filter(c => !done.has(c.id) && c.status === 'upcoming'),
    done:        cases.filter(c => done.has(c.id)),
  }

  const overdueCount = grouped.overdue.length
  const dueTodayCount = grouped['due-today'].length

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">My follow-up cases</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">
            {overdueCount > 0 && <span className="text-red-600 font-medium">{overdueCount} overdue · </span>}
            {dueTodayCount > 0 && <span className="text-amber-600 font-medium">{dueTodayCount} due today</span>}
          </p>
        </div>
        <AIPill />
      </div>

      {/* Overdue */}
      {(['overdue', 'due-today', 'upcoming', 'done'] as Status[]).map(status => {
        const list = grouped[status]
        if (list.length === 0) return null
        const labels: Record<Status, string> = {
          overdue: '⚠️ Overdue', 'due-today': '📅 Due today', upcoming: '🗓 Upcoming', done: '✅ Done'
        }
        return (
          <section key={status} aria-labelledby={`section-${status}`}>
            <h2 id={`section-${status}`} className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-2">
              {labels[status]} ({list.length})
            </h2>
            <div className="space-y-2">
              {list.map((c, i) => {
                const isOpen = expanded === c.id
                const isDone = done.has(c.id)
                return (
                  <motion.article key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`rounded-card border overflow-hidden ${statusStyle[isDone ? 'done' : c.status]}`}>
                    <button onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="w-full p-4 flex items-start gap-3 text-left"
                      aria-expanded={isOpen} aria-controls={`detail-${c.id}`}>
                      <div className="w-10 h-10 rounded-full bg-white border border-[#D3D1C7] flex items-center justify-center text-sm font-semibold text-[#5F5E5A] flex-shrink-0" aria-hidden="true">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-sm text-[#2C2C2A]">{c.name}</p>
                          <span className="text-[10px] text-[#5F5E5A]">{c.age}y</span>
                          <span className={`${riskBadge[c.risk]} text-[10px]`}>
                            {c.risk === 'high' ? 'High risk' : c.risk === 'medium' ? 'Moderate' : 'Stable'}
                          </span>
                          {c.status === 'overdue' && !isDone && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
                              <AlertTriangle size={10} /> Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5F5E5A] truncate">{c.condition}</p>
                        <p className={`text-xs mt-0.5 font-medium ${c.status === 'overdue' && !isDone ? 'text-red-600' : 'text-teal-600'}`}>
                          → {c.nextStep}
                        </p>
                      </div>
                      <ChevronDown size={14} className={`text-[#5F5E5A] transition-transform flex-shrink-0 mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div id={`detail-${c.id}`} className="px-4 pb-4 space-y-3 border-t border-[#D3D1C7]/50">
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded-lg p-2.5">
                            <p className="text-[#5F5E5A]">Last visit</p>
                            <p className="font-medium text-[#2C2C2A]">{c.lastVisit}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5">
                            <p className="text-[#5F5E5A]">Due date</p>
                            <p className={`font-medium ${c.status === 'overdue' ? 'text-red-600' : 'text-[#2C2C2A]'}`}>
                              {c.dueDate}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-[#5F5E5A] leading-relaxed bg-white rounded-xl px-3 py-2">{c.notes}</p>

                        <div className="flex gap-2 flex-wrap">
                          <a href={`tel:${c.phone}`}
                            className="flex items-center gap-1.5 text-xs bg-white border border-[#D3D1C7] text-[#2C2C2A] px-3 py-2 rounded-full hover:border-teal-300 hover:text-teal-600 transition-colors font-medium"
                            aria-label={`Call ${c.name}`}>
                            <Phone size={12} /> Call patient
                          </a>
                          {c.risk !== 'low' && (
                            <button onClick={() => navigate('/asha/triage')}
                              className="flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-2 rounded-full hover:bg-indigo-100 transition-colors font-medium">
                              <Video size={12} /> Start teleconsult
                            </button>
                          )}
                          {c.risk === 'high' && c.status === 'overdue' && (
                            <button onClick={() => navigate('/asha/emergency')}
                              className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-full hover:bg-red-100 transition-colors font-medium">
                              <AlertTriangle size={12} /> Escalate
                            </button>
                          )}
                          {!isDone && (
                            <button onClick={() => { setDone(p => new Set([...p, c.id])); setExpanded(null) }}
                              className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-full hover:bg-green-100 transition-colors font-medium"
                              aria-label={`Mark ${c.name} follow-up done`}>
                              <CheckCircle size={12} /> Mark done
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#5F5E5A]">
                          <Clock size={10} /> Last visit: {c.lastVisit}
                        </div>
                      </div>
                    )}
                  </motion.article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
