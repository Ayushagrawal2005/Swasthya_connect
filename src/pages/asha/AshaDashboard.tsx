import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, ClipboardList, AlertTriangle, ArrowRight, CheckCircle, Clock, Users, Siren, WifiOff, Loader2, RefreshCw } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { adminApi, referralsApi, followupsApi, type AshaDashboardData, type Referral, type FollowUp } from '../../services/api'

const quickActions = [
  { label: 'Register new patient', icon: <UserPlus size={22} />,      path: '/asha/register',      color: 'bg-orange-50 text-[#FF9933]',  desc: 'Create ABDM health ID' },
  { label: 'Triage a patient',     icon: <ClipboardList size={22} />, path: '/asha/triage',        color: 'bg-green-50 text-[#138808]',   desc: 'Record vitals & symptoms' },
  { label: 'High-risk follow-ups', icon: <AlertTriangle size={22} />, path: '/asha/followup',      color: 'bg-red-50 text-red-600',       desc: 'Overdue cases' },
  { label: 'View referrals',       icon: <ArrowRight size={22} />,    path: '/asha/referrals',     color: 'bg-amber-50 text-amber-600',   desc: 'Pending tracking' },
  { label: 'Emergency escalation', icon: <Siren size={22} />,         path: '/asha/emergency',     color: 'bg-red-50 text-red-700',       desc: 'One-tap urgent alert' },
]

const riskBorder: Record<string, string> = { high: 'border-l-red-500', medium: 'border-l-amber-400', low: 'border-l-green-400', emergency: 'border-l-red-700' }
const riskBadge:  Record<string, string> = { high: 'badge-red', medium: 'badge-amber', low: 'badge-green', emergency: 'badge-red' }
const urgencyBadge: Record<string, string> = { routine: 'badge-teal', urgent: 'badge-amber', emergency: 'badge-red' }

export function AshaDashboard() {
  const navigate = useNavigate()
  const { isOnline, pendingSyncCount, userName } = useApp()

  const [data, setData]           = useState<AshaDashboardData | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [followups, setFollowups] = useState<FollowUp[]>([])
  const [loading, setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(() => {
    return Promise.all([
      adminApi.dashboard().catch(() => null),
      referralsApi.list().catch(() => [] as Referral[]),
      followupsApi.list().catch(() => [] as FollowUp[]),
    ]).then(([dash, refs, fups]) => {
      if (dash) setData(dash)
      setReferrals(refs as Referral[])
      setFollowups(fups as FollowUp[])
      setLastUpdated(new Date())
    }).finally(() => setLoading(false))
  }, [])

  // Initial load + 30s polling
  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  const stats = data?.todayStats
  const cases = data?.activeCases || []
  const pendingRefs  = referrals.filter(r => r.status === 'pending')
  const overdueFollowups = followups.filter(f => f.status !== 'completed')

  const statCards = [
    { label: 'Patients visited',   value: stats?.visited          ?? '—', icon: <Users size={16} /> },
    { label: 'Triages done',       value: stats?.triages          ?? '—', icon: <ClipboardList size={16} /> },
    { label: 'Referrals made',     value: stats?.referrals        ?? '—', icon: <ArrowRight size={16} /> },
    { label: 'Overdue follow-ups', value: overdueFollowups.length ?? '—', icon: <Clock size={16} />, alert: overdueFollowups.length > 0 },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#2C2C2A]">Good morning, {userName?.split(' ')[0] ?? 'Kavita'} 👋</h1>
            <p className="text-sm text-[#5F5E5A] mt-0.5">ASHA Worker · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>
          <button onClick={() => { setLoading(true); fetchAll() }}
            className="p-2 rounded-lg text-[#5F5E5A] hover:text-[#FF9933] hover:bg-orange-50 transition-colors" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        {lastUpdated && (
          <p className="text-[10px] text-[#9E9C94] mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Live · updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {!isOnline && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <WifiOff size={13} /> Offline — {pendingSyncCount > 0 ? `${pendingSyncCount} record(s) pending sync` : 'records saved locally'}
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <section>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`stat-card ${s.alert ? 'border-red-200 bg-red-50' : ''}`}>
              <dt className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                <span className={s.alert ? 'text-red-500' : 'text-[#FF9933]'}>{s.icon}</span>{s.label}
              </dt>
              <dd className={`text-2xl font-semibold tabular-nums ${s.alert ? 'text-red-600' : 'text-[#2C2C2A]'}`}>
                {loading ? <Loader2 size={18} className="animate-spin text-[#FF9933] mt-1" /> : s.value}
              </dd>
            </motion.div>
          ))}
        </dl>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="section-header">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((a, i) => (
            <motion.button key={a.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => navigate(a.path)} className="card-hover p-4 flex items-center gap-4 text-left">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>{a.icon}</div>
              <div>
                <p className="font-semibold text-sm text-[#2C2C2A]">{a.label}</p>
                <p className="text-xs text-[#5F5E5A] mt-0.5">{a.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Pending referrals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-header mb-0 flex items-center gap-2">
            Pending Referrals
            {pendingRefs.length > 0 && <span className="badge-amber text-[10px]">{pendingRefs.length}</span>}
          </h2>
          <button onClick={() => navigate('/asha/referrals')} className="text-xs text-[#FF9933] hover:underline">View all</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-[#FF9933]" size={20} /></div>
        ) : pendingRefs.length === 0 ? (
          <p className="text-sm text-[#5F5E5A] text-center py-4 card">No pending referrals.</p>
        ) : (
          <div className="space-y-2">
            {pendingRefs.slice(0, 3).map((r, i) => (
              <motion.button key={r.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/asha/referrals')}
                className="card-hover w-full p-3 flex items-center gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{r.patientName}</p>
                    <span className={`${urgencyBadge[r.urgency] || 'badge-teal'} text-[10px]`}>{r.urgency}</span>
                  </div>
                  <p className="text-xs text-[#5F5E5A] truncate mt-0.5">{r.toFacilityName} · {r.reason?.slice(0, 50)}…</p>
                </div>
                <ArrowRight size={14} className="text-[#FF9933] flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Active cases */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-header mb-0 flex items-center gap-2">
            Active cases
            {cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'emergency').length > 0 && (
              <span className="badge-red text-[10px]">{cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'emergency').length} need attention</span>
            )}
          </h2>
          <button onClick={() => navigate('/asha/followup')} className="text-xs text-[#FF9933] hover:underline">View all</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#FF9933]" /></div>
        ) : cases.length === 0 ? (
          <p className="text-sm text-[#5F5E5A] text-center py-6 card">No active cases.</p>
        ) : (
          <div className="space-y-2">
            {cases.map((c, i) => (
              <motion.button key={c.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => navigate('/asha/followup')}
                className={`card-hover w-full p-4 flex items-center gap-4 text-left border-l-4 ${riskBorder[c.riskLevel] || 'border-l-gray-200'}`}>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-[#5F5E5A] flex-shrink-0">
                  {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{c.name}</p>
                    <span className={`${riskBadge[c.riskLevel] || 'badge-green'} text-[10px]`}>{c.riskLevel}</span>
                  </div>
                  <p className="text-xs text-[#5F5E5A] truncate">{c.condition}</p>
                  <p className="text-xs mt-1 font-medium text-[#FF9933]">Last seen: {c.lastSeen}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
