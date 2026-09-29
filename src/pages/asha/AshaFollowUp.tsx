// ASHA — Follow-up board (Module 8, frontline view)
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, Phone, ChevronDown, Video, Loader2, ArrowUpCircle, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AIPill } from '../../components/ui/AIPill'
import { followupsApi, type FollowUp } from '../../services/api'
import { useApp, useT } from '../../context/AppContext'
import { createLocalizer } from '../../lib/localize'

type Status = 'overdue' | 'due-today' | 'upcoming' | 'completed'

interface Case {
  id: string
  name: string
  patientName: string
  age: number
  condition: string
  risk: string
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
    id: 'FU001', name: 'Meena Jadhav', patientName: 'Meena Jadhav', age: 24,
    condition: 'High-risk pregnancy (32W) — BP borderline high',
    risk: 'high', dueDate: '21 Aug 2026', status: 'overdue',
    phone: '9876543210',
    notes: 'BP was 148/92 on last visit. Doctor prescribed methyldopa via teleconsult. Specialist visit at district hospital in 2 days — confirm transport.',
    lastVisit: '14 Aug 2026',
    nextStep: 'Check BP today + confirm hospital appointment for 25 Aug',
  },
  {
    id: 'FU002', name: 'Rekha Pawar', patientName: 'Rekha Pawar', age: 19,
    condition: 'First pregnancy (20W) — anaemia',
    risk: 'medium', dueDate: '23 Aug 2026', status: 'due-today',
    phone: '9823456789',
    notes: 'Hb 9.8 on last check. Iron supplements dispensed. Check compliance today.',
    lastVisit: '16 Aug 2026',
    nextStep: 'Verify iron tablet compliance, re-check Hb',
  },
  {
    id: 'FU003', name: 'Ganesh Wagh', patientName: 'Ganesh Wagh', age: 48,
    condition: 'TB treatment — Week 8 (DOTS)',
    risk: 'medium', dueDate: '23 Aug 2026', status: 'due-today',
    phone: '9765432109',
    notes: 'DOTS observation required today. Missed 3 doses last week. Critical to verify.',
    lastVisit: '20 Aug 2026',
    nextStep: 'Observe DOTS dose today, record compliance',
  },
  {
    id: 'FU004', name: 'Sunita Bai', patientName: 'Sunita Bai', age: 67,
    condition: 'Hypertension (long-term)',
    risk: 'low', dueDate: '27 Aug 2026', status: 'upcoming',
    phone: '9854321098',
    notes: 'BP controlled on current medication. Monthly check-in.',
    lastVisit: '20 Aug 2026',
    nextStep: 'Routine BP check and medicine refill',
  },
  {
    id: 'FU005', name: 'Lata Kale', patientName: 'Lata Kale', age: 8,
    condition: 'Malnutrition — Grade II',
    risk: 'high', dueDate: '20 Aug 2026', status: 'overdue',
    phone: '9812345678',
    notes: 'Weight 14 kg (expected 20 kg for age). Referred to NRC. Confirm if admitted.',
    lastVisit: '12 Aug 2026',
    nextStep: 'Confirm NRC admission / home visit',
  },
]

const statusStyle: Record<string, string> = {
  overdue:    'bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500',
  'due-today':'bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-l-[#E85D04]',
  upcoming:   'bg-white border-l-4 border-l-[#123B6D]',
  completed:  'bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-l-gray-300 opacity-60',
}

const riskBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border border-red-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  low: 'bg-green-100 text-green-700 border border-green-200',
  emergency: 'bg-red-100 text-red-700 border border-red-200',
}

export function AshaFollowUpPage() {
  const navigate = useNavigate()
  const { language } = useApp()
  const t = useT()
  const L = createLocalizer(language)
  const [cases, setCases] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [completing, setCompleting] = useState<Set<string>>(new Set())
  const [escalating, setEscalating] = useState<string | null>(null)

  // Normalize a follow-up record from the backend into the shape the UI expects
  function normalise(f: any): FollowUp {
    const today = new Date().toISOString().split('T')[0]
    const due   = f.dueDate || f.due_date || ''

    // Use backend status if it's one of the new enum values
    let status: Status = 'upcoming'
    const stored = (f.status || '').toLowerCase()
    if (stored === 'completed') {
      status = 'completed'
    } else if (stored === 'overdue' || (due && due < today)) {
      status = 'overdue'
    } else if (stored === 'due-today' || due === today) {
      status = 'due-today'
    } else {
      status = 'upcoming'
    }

    // Normalise risk: "moderate" → "medium"
    const rawRisk = (f.risk || f.riskLevel || 'low').toLowerCase()
    const risk = rawRisk === 'moderate' ? 'medium' : rawRisk

    return {
      ...f,
      id:          f.id,
      patientId:   f.patientId   || '',
      patientName: f.patientName || f.name || 'Unknown',
      age:         f.age         || 0,
      condition:   f.condition   || '',
      risk,
      dueDate:     due,
      status,
      phone:       f.phone       || '',
      notes:       f.notes       || '',
      lastVisit:   f.lastVisit   || f.last_visit || '—',
      nextStep:    f.nextStep    || f.next_step  || '',
      assignedTo:  f.assignedTo  || '',
      sourcePortal: f.sourcePortal || 'system',
      createdByName: f.createdByName || '',
    }
  }

  useEffect(() => {
    setLoading(true)
    followupsApi.list()
      .then(data => {
        const normalised = (data as any[]).map(normalise)
        setCases(normalised)
        if (normalised.length > 0) setExpanded(normalised[0].id)
      })
      .catch(err => {
        console.error('Follow-ups load error:', err)
        setError('Could not load follow-ups. Please check your connection.')
      })
      .finally(() => setLoading(false))
  }, [])

  async function markDone(id: string) {
    setCompleting(prev => new Set([...prev, id]))
    try {
      await followupsApi.complete(id)
      setCases(prev => prev.map(c => c.id === id ? { ...c, status: 'completed' as Status } : c))
    } catch (err) {
      console.error('Complete error:', err)
    } finally {
      setCompleting(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleEscalate(id: string, doctorId: string) {
    try {
      await followupsApi.escalate(id, doctorId, 'ASHA requesting doctor review')
      setCases(prev => prev.map(c => c.id === id ? { ...c, status: 'completed' as Status } : c))
      setEscalating(null)
    } catch (err) {
      console.error('Escalate error:', err)
    }
  }

  const grouped: Record<Status, FollowUp[]> = {
    overdue:     cases.filter(c => c.status === 'overdue'),
    'due-today': cases.filter(c => c.status === 'due-today'),
    upcoming:    cases.filter(c => c.status === 'upcoming'),
    completed:   cases.filter(c => c.status === 'completed'),
  }

  const overdueCount   = grouped.overdue.length
  const dueTodayCount  = grouped['due-today'].length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#123B6D] mb-2">{t('followUpBoard')}</h1>
              <div className="flex flex-wrap items-center gap-3">
                {overdueCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span className="text-sm font-semibold text-red-700">{overdueCount} {t('colOverdue')}</span>
                  </div>
                )}
                {dueTodayCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <Calendar size={14} className="text-[#E85D04]" />
                    <span className="text-sm font-semibold text-[#E85D04]">{dueTodayCount} {t('colDueToday')}</span>
                  </div>
                )}
                {overdueCount === 0 && dueTodayCount === 0 && (
                  <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                    <CheckCircle size={14} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700">All up to date</span>
                  </div>
                )}
              </div>
            </div>
            <AIPill />
          </div>
        </motion.div>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-12"
        >
          <Loader2 className="w-8 h-8 animate-spin text-[#E85D04]" />
        </motion.div>
      )}

      {!loading && error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {!loading && !error && cases.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <p className="text-lg font-semibold text-[#123B6D] mb-2">All caught up!</p>
          <p className="text-sm text-gray-600">No follow-up cases assigned to you right now.</p>
        </motion.div>
      )}

      {/* Status Sections */}
      {!loading && (['overdue', 'due-today', 'upcoming', 'completed'] as Status[]).map(status => {
        const list = grouped[status]
        if (list.length === 0) return null
        const labels: Record<Status, string> = {
          overdue:    `⚠️ ${t('colOverdue')}`,
          'due-today':`📅 ${t('colDueToday')}`,
          upcoming:   `🗓 ${t('colUpcoming')}`,
          completed:  `✅ ${t('colDone')}`,
        }

        const sourceLabels: Record<string, { label: string; color: string }> = {
          doctor: { label: 'Doctor', color: 'bg-blue-100 text-blue-700 border-blue-200' },
          asha: { label: 'ASHA', color: 'bg-green-100 text-green-700 border-green-200' },
          referral: { label: 'Referral', color: 'bg-purple-100 text-purple-700 border-purple-200' },
          appointment: { label: 'Appointment', color: 'bg-amber-100 text-amber-700 border-amber-200' },
          teleconsultation: { label: 'Teleconsult', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
          system: { label: 'System', color: 'bg-gray-100 text-gray-600 border-gray-200' },
        }

        return (
          <section key={status} aria-labelledby={`section-${status}`}>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-3 border-2 border-gray-100">
              <h2 id={`section-${status}`} className="text-sm font-bold text-[#123B6D] uppercase tracking-wide">
                {labels[status]} <span className="text-[#E85D04]">({list.length})</span>
              </h2>
            </div>
            <div className="space-y-3">
              {list.map((c, i) => {
                const isOpen = expanded === c.id
                const isCompleting = completing.has(c.id)
                const localName      = L.name(c.patientName)
                const localCondition = L.condition(c.condition)
                const sourceInfo = sourceLabels[c.sourcePortal] || sourceLabels.system
                return (
                  <motion.article 
                    key={c.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl border-2 overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${statusStyle[c.status]}`}
                  >
                    <button 
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="w-full p-5 flex items-start gap-4 text-left hover:bg-white/50 transition-colors"
                      aria-expanded={isOpen} 
                      aria-controls={`detail-${c.id}`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-md" aria-hidden="true">
                        {localName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-base text-[#123B6D]">{localName}</p>
                          <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600 border border-gray-200">
                            {c.age}{t('patientAge')}
                          </span>
                          <span className={`${riskBadge[c.risk]} text-xs px-2 py-0.5 rounded-full font-semibold`}>
                            {c.risk === 'high' ? t('highRisk') : c.risk === 'medium' ? t('mediumRisk') : t('stable')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${sourceInfo.color}`}>
                            {sourceInfo.label}
                          </span>
                          {c.status === 'overdue' && (
                            <span className="inline-flex items-center gap-1 text-xs text-white bg-red-500 px-2 py-0.5 rounded-full font-bold">
                              <AlertTriangle size={12} /> {t('colOverdue')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-1">{localCondition}</p>
                        <div className="flex items-start gap-1.5 bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <span className="text-[#E85D04] font-bold text-sm">→</span>
                          <p className="text-xs font-medium text-[#123B6D] flex-1">{c.nextStep}</p>
                        </div>
                        {c.createdByName && (
                          <p className="text-xs text-gray-600 mt-2">Created by <span className="font-medium">{c.createdByName}</span></p>
                        )}
                      </div>
                      <ChevronDown 
                        size={18} 
                        className={`text-[#123B6D] transition-transform flex-shrink-0 mt-1 ${isOpen ? 'rotate-180' : ''}`} 
                      />
                    </button>

                    {isOpen && (
                      <div id={`detail-${c.id}`} className="px-5 pb-5 space-y-4 bg-white/70 backdrop-blur-sm">
                        <div className="pt-4 grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-600 mb-1 font-medium">{t('lastVisit')}</p>
                            <p className="font-bold text-sm text-[#123B6D] flex items-center gap-1.5">
                              <Clock size={14} className="text-[#E85D04]" />
                              {c.lastVisit}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-600 mb-1 font-medium">{t('due')}</p>
                            <p className={`font-bold text-sm flex items-center gap-1.5 ${c.status === 'overdue' ? 'text-red-600' : 'text-[#123B6D]'}`}>
                              <Calendar size={14} className={c.status === 'overdue' ? 'text-red-600' : 'text-[#E85D04]'} />
                              {c.dueDate}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
                          <p className="text-xs font-bold text-[#123B6D] mb-2">Clinical Notes</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{c.notes}</p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <a 
                            href={`tel:${c.phone}`}
                            className="flex items-center gap-2 text-sm bg-white border-2 border-[#123B6D] text-[#123B6D] px-4 py-2.5 rounded-xl hover:bg-[#123B6D] hover:text-white transition-all font-semibold shadow-sm hover:shadow-md"
                            aria-label={`Call ${localName}`}
                          >
                            <Phone size={16} /> {t('phone')}
                          </a>
                          {c.risk !== 'low' && (
                            <button 
                              onClick={() => navigate('/asha/triage')}
                              className="flex items-center gap-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold shadow-sm hover:shadow-md"
                            >
                              <Video size={16} /> {t('teleconsult')}
                            </button>
                          )}
                          {c.status !== 'completed' && (
                            <>
                              <button 
                                onClick={() => { markDone(c.id); setExpanded(null) }}
                                disabled={isCompleting}
                                className="flex items-center gap-2 text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Mark ${localName} follow-up done`}
                              >
                                {isCompleting ? (
                                  <>
                                    <Loader2 size={16} className="animate-spin" /> Completing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={16} /> {t('markDone')}
                                  </>
                                )}
                              </button>
                              {(c.risk === 'high' || c.risk === 'emergency') && (
                                <button 
                                  onClick={() => setEscalating(c.id)}
                                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#E85D04] to-red-500 text-white px-4 py-2.5 rounded-xl hover:from-[#d94f03] hover:to-red-600 transition-all font-semibold shadow-sm hover:shadow-md"
                                >
                                  <ArrowUpCircle size={16} /> Escalate to Doctor
                                </button>
                              )}
                            </>
                          )}
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
    </div>
  )
}

