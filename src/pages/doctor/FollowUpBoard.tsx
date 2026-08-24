// Module 8 — High-risk patient follow-up board
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, ChevronDown, Phone } from 'lucide-react'

type BoardStatus = 'overdue' | 'due-today' | 'upcoming' | 'done'

interface FollowUp {
  id: string
  patient: string
  age: number
  condition: string
  dueDate: string
  status: BoardStatus
  asha: string
  phone: string
  lastVisit: string
  notes: string
}

const board: FollowUp[] = [
  { id: 'FU001', patient: 'Meena Jadhav', age: 24, condition: 'High-risk pregnancy (32W)', dueDate: '21 Aug 2026', status: 'overdue', asha: 'Kavita Shinde', phone: '9876543210', lastVisit: '14 Aug 2026', notes: 'BP elevated at last visit. Must check today.' },
  { id: 'FU002', patient: 'Ganesh Wagh', age: 48, condition: 'Tuberculosis (Week 8)', dueDate: '21 Aug 2026', status: 'overdue', asha: 'Rekha Kulkarni', phone: '9823456789', lastVisit: '10 Aug 2026', notes: 'DOT compliance check — 5 days missed.' },
  { id: 'FU003', patient: 'Lata Desai', age: 62, condition: 'Hypertension + Diabetes', dueDate: '23 Aug 2026', status: 'due-today', asha: 'Priya More', phone: '9765432109', lastVisit: '16 Aug 2026', notes: 'HbA1c due today.' },
  { id: 'FU004', patient: 'Sunita Bai', age: 67, condition: 'Post-cataract surgery', dueDate: '25 Aug 2026', status: 'upcoming', asha: 'Sunita Devi', phone: '9854321098', lastVisit: '18 Aug 2026', notes: 'Eye drops compliance check.' },
  { id: 'FU005', patient: 'Ramkumar Singh', age: 55, condition: 'Chronic kidney disease', dueDate: '27 Aug 2026', status: 'upcoming', asha: 'Anita Pawar', phone: '9812345678', lastVisit: '20 Aug 2026', notes: 'Creatinine follow-up.' },
  { id: 'FU006', patient: 'Priya Sharma', age: 28, condition: 'Pregnancy ANC (28W)', dueDate: '20 Aug 2026', status: 'done', asha: 'Kavita Shinde', phone: '9876543210', lastVisit: '20 Aug 2026', notes: 'Completed.' },
]

const statusConfig: Record<BoardStatus, { color: string; label: string; icon: React.ReactNode }> = {
  overdue:    { color: 'bg-red-50 border-red-200',   label: 'Overdue',    icon: <AlertTriangle size={15} className="text-red-600" /> },
  'due-today':{ color: 'bg-amber-50 border-amber-200', label: 'Due today', icon: <Clock size={15} className="text-amber-600" /> },
  upcoming:   { color: 'bg-teal-50 border-teal-200',  label: 'Upcoming',  icon: <Clock size={15} className="text-teal-500" /> },
  done:       { color: 'bg-green-50 border-green-200', label: 'Done',     icon: <CheckCircle size={15} className="text-green-600" /> },
}

const columns: BoardStatus[] = ['overdue', 'due-today', 'upcoming', 'done']

export function FollowUpBoardPage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">High-risk follow-up board</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">{board.filter(b => b.status === 'overdue').length} overdue · {board.filter(b => b.status === 'due-today').length} due today</p>
        </div>
        <span className="badge-red">
          <AlertTriangle size={11} /> {board.filter(b => b.status === 'overdue').length} overdue
        </span>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => {
          const items = board.filter(b =>
            done.has(b.id) ? col === 'done' : b.status === col
          )
          const cfg = statusConfig[col]
          return (
            <section key={col} aria-labelledby={`col-${col}`}>
              <div className={`rounded-xl p-3 border-2 ${cfg.color} mb-3`}>
                <h2 id={`col-${col}`} className="text-xs font-semibold text-[#2C2C2A] flex items-center gap-1.5">
                  {cfg.icon} {cfg.label}
                  <span className="ml-auto text-[10px] bg-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {items.length}
                  </span>
                </h2>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const isExpanded = expanded === item.id
                  const isDone = done.has(item.id) || item.status === 'done'
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className={`card p-3 ${isDone ? 'opacity-60' : ''}`}>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                        className="w-full text-left"
                        aria-expanded={isExpanded}
                        aria-controls={`fu-${item.id}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[#2C2C2A] truncate">{item.patient}</p>
                            <p className="text-[10px] text-[#5F5E5A]">{item.condition}</p>
                          </div>
                          <ChevronDown size={13} className={`text-[#5F5E5A] transition-transform flex-shrink-0 mt-0.5 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#5F5E5A]">
                          <Clock size={10} /> {item.dueDate}
                          <span className="ml-auto">ASHA: {item.asha.split(' ')[0]}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div id={`fu-${item.id}`} className="mt-3 pt-3 border-t border-[#D3D1C7] space-y-2">
                          <p className="text-xs text-[#5F5E5A] leading-relaxed">{item.notes}</p>
                          <p className="text-[10px] text-[#5F5E5A]">Last visit: {item.lastVisit}</p>
                          <div className="flex gap-1.5">
                            <a href={`tel:${item.phone}`}
                              className="flex items-center gap-1 text-[10px] bg-teal-50 text-teal-600 border border-teal-200 px-2.5 py-1.5 rounded-full hover:bg-teal-100 transition-colors"
                              aria-label={`Call ${item.patient}`}>
                              <Phone size={10} /> Call ASHA
                            </a>
                            {!isDone && (
                              <button
                                onClick={() => setDone(p => new Set([...p, item.id]))}
                                className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 border border-green-200 px-2.5 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                                aria-label={`Mark ${item.patient} follow-up as done`}>
                                <CheckCircle size={10} /> Mark done
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
                {items.length === 0 && (
                  <p className="text-xs text-center text-[#5F5E5A] py-4">No patients here</p>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
