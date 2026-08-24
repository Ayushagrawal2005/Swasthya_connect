import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, ChevronDown, Phone, Loader2 } from 'lucide-react'
import { followupsApi, type FollowUp } from '../../services/api'

type BoardStatus = 'overdue' | 'due-today' | 'upcoming' | 'done'

const statusConfig: Record<BoardStatus, { color: string; label: string; icon: React.ReactNode }> = {
  overdue:    { color: 'bg-red-50 border-red-200',    label: 'Overdue',    icon: <AlertTriangle size={15} className="text-red-600" /> },
  'due-today':{ color: 'bg-amber-50 border-amber-200', label: 'Due today', icon: <Clock size={15} className="text-amber-600" /> },
  upcoming:   { color: 'bg-teal-50 border-teal-200',  label: 'Upcoming',  icon: <Clock size={15} className="text-teal-500" /> },
  done:       { color: 'bg-green-50 border-green-200', label: 'Done',     icon: <CheckCircle size={15} className="text-green-600" /> },
}

const columns: BoardStatus[] = ['overdue', 'due-today', 'upcoming', 'done']

export function FollowUpBoardPage() {
  const [board, setBoard] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())

  useEffect(() => {
    followupsApi.list()
      .then(setBoard)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function markDone(id: string) {
    followupsApi.markDone(id)
      .then(() => setDone(p => new Set([...p, id])))
      .catch(() => setDone(p => new Set([...p, id])))
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">High-risk follow-up board</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">
            {board.filter(b => b.status === 'overdue').length} overdue · {board.filter(b => b.status === 'due-today').length} due today
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>
      ) : (
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
                    <span className="ml-auto text-[10px] bg-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{items.length}</span>
                  </h2>
                </div>
                <div className="space-y-2">
                  {items.map((b, i) => {
                    const isOpen = expanded === b.id
                    const isDone = done.has(b.id)
                    return (
                      <motion.article key={b.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`card overflow-hidden ${isDone ? 'opacity-60' : ''}`}>
                        <button onClick={() => setExpanded(isOpen ? null : b.id)}
                          className="w-full p-3 flex items-start gap-2 text-left"
                          aria-expanded={isOpen}>
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-[#5F5E5A] flex-shrink-0">
                            {b.patientName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-[#2C2C2A] truncate">{b.patientName}</p>
                            <p className="text-[10px] text-[#5F5E5A] truncate">{b.condition}</p>
                            <p className="text-[10px] text-amber-600">{b.dueDate}</p>
                          </div>
                          <ChevronDown size={12} className={`text-[#5F5E5A] transition-transform flex-shrink-0 mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 border-t border-[#D3D1C7]/50 space-y-2">
                            <p className="text-xs text-[#5F5E5A] mt-2">{b.notes}</p>
                            <p className="text-[10px] text-[#5F5E5A]">Last visit: {b.lastVisit} · ASHA: {b.assignedTo.slice(0,6)}…</p>
                            <div className="flex gap-1.5 flex-wrap">
                              <a href={`tel:${b.phone}`}
                                className="flex items-center gap-1 text-[10px] bg-white border border-[#D3D1C7] text-[#2C2C2A] px-2 py-1.5 rounded-full hover:border-teal-300 transition-colors font-medium">
                                <Phone size={10} /> Call ASHA
                              </a>
                              {!isDone && (
                                <button onClick={() => { markDone(b.id); setExpanded(null) }}
                                  className="flex items-center gap-1 text-[10px] bg-green-50 border border-green-200 text-green-600 px-2 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium">
                                  <CheckCircle size={10} /> Done
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.article>
                    )
                  })}
                  {items.length === 0 && <p className="text-xs text-[#5F5E5A] text-center py-4">None</p>}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
