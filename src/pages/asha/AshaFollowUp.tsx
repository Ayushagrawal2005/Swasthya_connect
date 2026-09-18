// ASHA — Follow-up board (Module 8, frontline view)
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, Phone, ChevronDown, Video, Loader2, ArrowUpCircle } from 'lucide-react'
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
  overdue:    'bg-red-50 border-l-4 border-l-red-500',
  'due-today':'bg-amber-50 border-l-4 border-l-amber-400',
  upcoming:   'bg-white border-l-4 border-l-teal-300',
  completed:  'bg-gray-50 border-l-4 border-l-gray-300 opacity-60',
}

const riskBadge: Record<string, string> = {
  high: 'badge-red', medium: 'badge-amber', low: 'badge-green', emergency: 'badge-red',
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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">{t('followUpBoard')}</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">
            {overdueCount > 0 && <span className="text-red-600 font-medium">{overdueCount} {t('colOverdue')} · </span>}
            {dueTodayCount > 0 && <span className="text-amber-600 font-medium">{dueTodayCount} {t('colDueToday')}</span>}
          </p>
        </div>
        <AIPill />
      </div>

      {loading && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>}

      {!loading && error && (
        <div className="card p-4 flex items-center gap-3 border-l-4 border-l-red-400 bg-red-50">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && cases.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <CheckCircle size={36} className="mx-auto text-teal-300" />
          <p className="text-sm font-medium text-[#2C2C2A]">All caught up!</p>
          <p className="text-xs text-[#5F5E5A]">No follow-up cases assigned to you right now.</p>
        </div>
      )}

      {/* Overdue */}
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
          doctor: { label: 'Doctor', color: 'bg-blue-100 text-blue-700' },
          asha: { label: 'ASHA', color: 'bg-green-100 text-green-700' },
          referral: { label: 'Referral', color: 'bg-purple-100 text-purple-700' },
          appointment: { label: 'Appointment', color: 'bg-amber-100 text-amber-700' },
          teleconsultation: { label: 'Teleconsult', color: 'bg-indigo-100 text-indigo-700' },
          system: { label: 'System', color: 'bg-gray-100 text-gray-600' },
        }

        return (
          <section key={status} aria-labelledby={`section-${status}`}>
            <h2 id={`section-${status}`} className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-2">
              {labels[status]} ({list.length})
            </h2>
            <div className="space-y-2">
              {list.map((c, i) => {
                const isOpen = expanded === c.id
                const isCompleting = completing.has(c.id)
                const localName      = L.name(c.patientName)
                const localCondition = L.condition(c.condition)
                const sourceInfo = sourceLabels[c.sourcePortal] || sourceLabels.system
                return (
                  <motion.article key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`rounded-card border overflow-hidden ${statusStyle[c.status]}`}>
                    <button onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="w-full p-4 flex items-start gap-3 text-left"
                      aria-expanded={isOpen} aria-controls={`detail-${c.id}`}>
                      <div className="w-10 h-10 rounded-full bg-white border border-[#D3D1C7] flex items-center justify-center text-sm font-semibold text-[#5F5E5A] flex-shrink-0" aria-hidden="true">
                        {localName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-sm text-[#2C2C2A]">{localName}</p>
                          <span className="text-[10px] text-[#5F5E5A]">{c.age}{t('patientAge')}</span>
                          <span className={`${riskBadge[c.risk]} text-[10px]`}>
                            {c.risk === 'high' ? t('highRisk') : c.risk === 'medium' ? t('mediumRisk') : t('stable')}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${sourceInfo.color}`}>
                            {sourceInfo.label}
                          </span>
                          {c.status === 'overdue' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
                              <AlertTriangle size={10} /> {t('colOverdue')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5F5E5A] truncate">{localCondition}</p>
                        <p className={`text-xs mt-0.5 font-medium ${c.status === 'overdue' ? 'text-red-600' : 'text-teal-600'}`}>
                          → {c.nextStep}
                        </p>
                        {c.createdByName && (
                          <p className="text-[10px] text-[#5F5E5A] mt-1">Created by {c.createdByName}</p>
                        )}
                      </div>
                      <ChevronDown size={14} className={`text-[#5F5E5A] transition-transform flex-shrink-0 mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div id={`detail-${c.id}`} className="px-4 pb-4 space-y-3 border-t border-[#D3D1C7]/50">
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded-lg p-2.5">
                            <p className="text-[#5F5E5A]">{t('lastVisit')}</p>
                            <p className="font-medium text-[#2C2C2A]">{c.lastVisit}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5">
                            <p className="text-[#5F5E5A]">{t('due')}</p>
                            <p className={`font-medium ${c.status === 'overdue' ? 'text-red-600' : 'text-[#2C2C2A]'}`}>
                              {c.dueDate}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-[#5F5E5A] leading-relaxed bg-white rounded-xl px-3 py-2">{c.notes}</p>

                        <div className="flex gap-2 flex-wrap">
                          <a href={`tel:${c.phone}`}
                            className="flex items-center gap-1.5 text-xs bg-white border border-[#D3D1C7] text-[#2C2C2A] px-3 py-2 rounded-full hover:border-teal-300 hover:text-teal-600 transition-colors font-medium"
                            aria-label={`Call ${localName}`}>
                            <Phone size={12} /> {t('phone')}
                          </a>
                          {c.risk !== 'low' && (
                            <button onClick={() => navigate('/asha/triage')}
                              className="flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-2 rounded-full hover:bg-indigo-100 transition-colors font-medium">
                              <Video size={12} /> {t('teleconsult')}
                            </button>
                          )}
                          {c.status !== 'completed' && (
                            <>
                              <button onClick={() => { markDone(c.id); setExpanded(null) }}
                                disabled={isCompleting}
                                className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-full hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
                                aria-label={`Mark ${localName} follow-up done`}>
                                <CheckCircle size={12} /> {isCompleting ? 'Completing...' : t('markDone')}
                              </button>
                              {(c.risk === 'high' || c.risk === 'emergency') && (
                                <button onClick={() => setEscalating(c.id)}
                                  className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-full hover:bg-red-100 transition-colors font-medium">
                                  <ArrowUpCircle size={12} /> Escalate to Doctor
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#5F5E5A]">
                          <Clock size={10} /> {t('lastVisit')}: {c.lastVisit}
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

