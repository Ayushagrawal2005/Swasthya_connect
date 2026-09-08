import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, Clock, ChevronRight, User, Activity, Loader2, ArrowRight, RefreshCw, GitMerge } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { appointmentsApi, referralsApi, type Appointment, type Referral } from '../../services/api'
import { useApp } from '../../context/AppContext'

const urgencyBorder: Record<string, string> = { routine: '', urgent: 'border-l-4 border-l-amber-400', emergency: 'border-l-4 border-l-red-500' }
const urgencyBadge:  Record<string, string> = { routine: 'badge-teal', urgent: 'badge-amber', emergency: 'badge-red' }

export function DoctorHome() {
  const navigate = useNavigate()
  const { userName } = useApp()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [acceptedReferrals, setAcceptedReferrals] = useState<Referral[]>([])
  const [pendingReferrals, setPendingReferrals]   = useState<Referral[]>([])
  const [loading, setLoading]   = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const fetchAll = useCallback(() => {
    return Promise.all([
      appointmentsApi.list({ date: today }).catch(() => [] as Appointment[]),
      referralsApi.incoming().catch(() => [] as Referral[]),
    ]).then(([appts, refs]) => {
      setAppointments(appts as Appointment[])
      setAcceptedReferrals((refs as Referral[]).filter(r => r.status === 'accepted'))
      setPendingReferrals((refs as Referral[]).filter(r => r.status === 'pending'))
      setLastUpdated(new Date())
    }).finally(() => setLoading(false))
  }, [today])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  // Combined queue: scheduled appointments + accepted referrals
  const queue = [
    ...appointments.map(a => ({ ...a, _type: 'appointment' as const })),
    ...acceptedReferrals.map(r => ({
      id: r.id,
      patientName: r.patientName,
      time: '—',
      token: 'REF',
      estimatedWait: 0,
      type: 'referral',
      status: 'accepted',
      urgency: r.urgency,
      reason: r.reason,
      _type: 'referral' as const,
    })),
  ]

  const stats = [
    { label: 'Patients today',   value: appointments.length,                                          icon: <User size={16} />,     sub: `${appointments.filter(a => a.status === 'scheduled').length} remaining` },
    { label: 'Avg wait time',    value: '8m',                                                          icon: <Clock size={16} />,    sub: 'Estimated' },
    { label: 'Teleconsults',     value: appointments.filter(a => a.type === 'teleconsult').length,     icon: <Video size={16} />,    sub: 'Today' },
    { label: 'Referrals (in)',   value: pendingReferrals.length + acceptedReferrals.length,            icon: <GitMerge size={16} />, sub: `${pendingReferrals.length} pending`, alert: pendingReferrals.length > 0 },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Good morning, {userName ?? 'Doctor'} 👋</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
          {lastUpdated && (
            <p className="text-[10px] text-[#9E9C94] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Live · updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setLoading(true); fetchAll() }}
            className="p-2 rounded-lg text-[#5F5E5A] hover:text-[#138808] hover:bg-green-50 transition-colors" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <span className="badge-green"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1" />On duty</span>
        </div>
      </div>

      {/* Stats */}
      <section>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`stat-card ${s.alert ? 'border-amber-200 bg-amber-50' : ''}`}>
              <dt className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                <span className={s.alert ? 'text-amber-500' : 'text-[#138808]'}>{s.icon}</span>{s.label}
              </dt>
              <dd className={`text-2xl font-semibold tabular-nums ${s.alert ? 'text-amber-700' : 'text-[#2C2C2A]'}`}>
                {loading ? <Loader2 size={16} className="animate-spin text-[#138808] mt-1" /> : s.value}
              </dd>
              <p className="text-xs text-[#5F5E5A]">{s.sub}</p>
            </div>
          ))}
        </dl>
      </section>

      {/* Pending referrals alert */}
      {!loading && pendingReferrals.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <ArrowRight size={15} />
            <span className="font-medium">{pendingReferrals.length} incoming referral{pendingReferrals.length > 1 ? 's' : ''} waiting for review</span>
          </div>
          <button onClick={() => navigate('/doctor/referrals')}
            className="text-xs text-amber-700 font-semibold hover:underline">Review →</button>
        </div>
      )}

      {/* Queue: appointments + accepted referrals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-header mb-0">
            Patient queue
            <span className="ml-2 text-xs font-normal text-[#5F5E5A]">({queue.length} total)</span>
          </h2>
          <button onClick={() => navigate('/doctor/referrals')} className="text-sm text-[#138808] hover:underline flex items-center gap-1">
            Referrals <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#138808]" /></div>
        ) : queue.length === 0 ? (
          <p className="text-sm text-[#5F5E5A] text-center py-8 card">No patients in queue today.</p>
        ) : (
        <div className="space-y-2">
            {queue.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => {
                  const pid = (item as any).patientId || null
                  navigate('/doctor/patient', { state: { patientId: pid, patientName: item.patientName } })
                }}
                className={`card-hover p-4 flex items-center gap-4 cursor-pointer ${item._type === 'referral' ? urgencyBorder[(item as any).urgency] || '' : ''}`}>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
                  ${item._type === 'referral' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {item._type === 'referral'
                    ? <ArrowRight size={16} />
                    : item.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{item.patientName}</p>
                    {item._type === 'referral' ? (
                      <>
                        <span className="badge-amber text-[10px]">Referral</span>
                        <span className={`${urgencyBadge[(item as any).urgency] || 'badge-teal'} text-[10px]`}>{(item as any).urgency}</span>
                      </>
                    ) : (
                      <span className={`${item.type === 'teleconsult' ? 'badge-teal' : 'badge-green'} text-[10px]`}>{item.type}</span>
                    )}
                  </div>
                  {item._type === 'referral' ? (
                    <p className="text-xs text-[#5F5E5A] truncate">{(item as any).reason}</p>
                  ) : (
                    <p className="text-xs text-[#5F5E5A]">{item.time} · Token {item.token} · Wait ~{item.estimatedWait}m</p>
                  )}
                  {/* Patient ID — click opens search */}
                  {(item as any).patientId && (
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/doctor/patients') }}
                      className="text-[10px] font-mono text-teal-600 hover:underline mt-0.5 block">
                      ID: {(item as any).patientId.slice(0, 12)}… · Search records →
                    </button>
                  )}
                </div>
                <ChevronRight size={16} className="text-[#5F5E5A]" />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => navigate('/doctor/patients')}  className="btn-primary text-sm py-2.5 px-4">Find patient</button>
        <button onClick={() => navigate('/doctor/referrals')} className="btn-secondary text-sm py-2.5 px-4">Referral inbox</button>
        <button onClick={() => navigate('/doctor/followup')}  className="btn-secondary text-sm py-2.5 px-4">Follow-up board</button>
        <button onClick={() => navigate('/doctor/emergency')} className="btn-coral text-sm py-2.5 px-4">Emergency escalation</button>
      </div>

      <AIPill />
    </div>
  )
}
