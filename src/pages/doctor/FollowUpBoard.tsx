import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, ChevronDown, Phone, Loader2 } from 'lucide-react'
import { followupsApi, type FollowUp } from '../../services/api'

type BoardStatus = 'overdue' | 'due-today' | 'upcoming' | 'completed'

const statusConfig: Record<BoardStatus, { color: string; label: string; icon: React.ReactNode }> = {
  overdue:    { color: 'bg-red-50 border-red-200',    label: 'Overdue',    icon: <AlertTriangle size={15} className="text-red-600" /> },
  'due-today':{ color: 'bg-amber-50 border-amber-200', label: 'Due today', icon: <Clock size={15} className="text-amber-600" /> },
  upcoming:   { color: 'bg-orange-50 border-[#E85D04]',  label: 'Upcoming',  icon: <Clock size={15} className="text-[#E85D04]" /> },
  completed:  { color: 'bg-green-50 border-green-200', label: 'Done',     icon: <CheckCircle size={15} className="text-green-600" /> },
}

const columns: BoardStatus[] = ['overdue', 'due-today', 'upcoming', 'completed']

export function FollowUpBoardPage() {
  const [board, setBoard] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    followupsApi.list()
      .then(setBoard)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">High-Risk Follow-Up Board</h1>
              <p className="text-blue-100 mt-1">
                {board.filter(b => b.status === 'overdue').length} overdue · {board.filter(b => b.status === 'due-today').length} due today · {board.filter(b => b.status === 'upcoming').length} upcoming
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#123B6D] w-12 h-12" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {columns.map(col => {
            const items = board.filter(b => b.status === col)
            const cfg = statusConfig[col]
            return (
              <section key={col} aria-labelledby={`col-${col}`} className="space-y-3">
                <div className={`rounded-2xl shadow-lg p-4 border-2 ${cfg.color}`}>
                  <h2 id={`col-${col}`} className="text-sm font-bold text-[#2C2C2A] flex items-center gap-2">
                    {cfg.icon} {cfg.label}
                    <span className="ml-auto text-xs bg-white rounded-full px-2.5 py-1 font-bold shadow-sm">{items.length}</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {items.map((b, i) => {
                    const isOpen = expanded === b.id
                    return (
                      <motion.article key={b.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-200">
                        <button onClick={() => setExpanded(isOpen ? null : b.id)}
                          className="w-full p-4 flex items-start gap-3 text-left"
                          aria-expanded={isOpen}>
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
                            {b.patientName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-[#123B6D] truncate">{b.patientName}</p>
                            <p className="text-xs text-gray-600 truncate mt-0.5">{b.condition}</p>
                            <p className="text-xs text-amber-600 font-semibold mt-1">{b.dueDate}</p>
                          </div>
                          <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-700 mt-3 leading-relaxed">{b.notes}</p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                              <span>Last visit: {b.lastVisit}</span>
                              <span>·</span>
                              <span>ASHA: {b.ashaName || b.assignedTo}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <a href={`tel:${b.phone}`}
                                className="flex items-center gap-2 text-xs bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 font-semibold">
                                <Phone size={14} /> Call ASHA
                              </a>
                            </div>
                          </div>
                        )}
                      </motion.article>
                    )
                  })}
                  {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8 bg-white rounded-2xl shadow-md">No follow-ups</p>}
                </div>
              </section>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
