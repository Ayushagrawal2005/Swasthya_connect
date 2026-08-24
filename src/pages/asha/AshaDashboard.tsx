import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, ClipboardList, AlertTriangle, ArrowRight, CheckCircle, Clock, Users, Siren, WifiOff, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { adminApi, type AshaDashboardData } from '../../services/api'

const quickActions = [
  { label: 'Register new patient',  icon: <UserPlus size={22} />,      path: '/asha/register',  color: 'bg-teal-50 text-teal-600',    desc: 'Create ABDM health ID' },
  { label: 'Triage a patient',      icon: <ClipboardList size={22} />, path: '/asha/triage',    color: 'bg-indigo-50 text-indigo-600', desc: 'Record vitals & symptoms' },
  { label: 'High-risk follow-ups',  icon: <AlertTriangle size={22} />, path: '/asha/followup',  color: 'bg-coral-50 text-coral-600',   desc: 'Overdue cases' },
  { label: 'View referrals',        icon: <ArrowRight size={22} />,    path: '/asha/referrals', color: 'bg-amber-50 text-amber-600',   desc: 'Pending tracking' },
  { label: 'Emergency escalation',  icon: <Siren size={22} />,         path: '/asha/emergency', color: 'bg-red-50 text-red-600',       desc: 'One-tap urgent alert' },
]

const riskStyles: Record<string, string> = {
  high: 'border-l-coral-500', medium: 'border-l-amber-400', low: 'border-l-teal-400', emergency: 'border-l-red-600',
}
const riskBadge: Record<string, string> = {
  high: 'badge-red', medium: 'badge-amber', low: 'badge-green', emergency: 'badge-red',
}

export function AshaDashboard() {
  const navigate = useNavigate()
  const { isOnline, pendingSyncCount, userName } = useApp()
  const [data, setData] = useState<AshaDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.dashboard()
      .then(setData)
      .catch(() => {/* use fallback below */})
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.todayStats
  const cases = data?.activeCases || []

  const todayStatCards = [
    { label: 'Patients visited',    value: stats?.visited          ?? '—', icon: <Users size={16} /> },
    { label: 'Triages done',        value: stats?.triages          ?? '—', icon: <ClipboardList size={16} /> },
    { label: 'Referrals made',      value: stats?.referrals        ?? '—', icon: <ArrowRight size={16} /> },
    { label: 'Overdue follow-ups',  value: stats?.overdueFollowUps ?? '—', icon: <Clock size={16} /> },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Good morning, {userName?.split(' ')[0] ?? 'Kavita'} 👋</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">ASHA Worker · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
        {!isOnline && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <WifiOff size={13} />
            <span>Offline mode — {pendingSyncCount > 0 ? `${pendingSyncCount} record${pendingSyncCount > 1 ? 's' : ''} will sync when connected` : 'records saved locally'}</span>
          </div>
        )}
        {isOnline && pendingSyncCount > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
            <CheckCircle size={13} />
            <span>Back online — syncing {pendingSyncCount} queued record{pendingSyncCount > 1 ? 's' : ''}…</span>
          </div>
        )}
      </motion.div>

      <section aria-label="Today's activity">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {todayStatCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
              <dt className="flex items-center gap-1.5 text-xs text-[#5F5E5A]"><span className="text-teal-500" aria-hidden="true">{s.icon}</span>{s.label}</dt>
              <dd className="text-2xl font-semibold text-[#2C2C2A] tabular-nums">
                {loading ? <Loader2 size={18} className="animate-spin text-teal-400 mt-1" /> : s.value}
              </dd>
            </motion.div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="section-header">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <motion.button key={action.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => navigate(action.path)} className="card-hover p-4 flex items-center gap-4 text-left" aria-label={action.label}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`} aria-hidden="true">{action.icon}</div>
              <div><p className="font-semibold text-sm text-[#2C2C2A]">{action.label}</p><p className="text-xs text-[#5F5E5A] mt-0.5">{action.desc}</p></div>
            </motion.button>
          ))}
        </div>
      </section>

      <section aria-labelledby="cases-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="cases-heading" className="section-header mb-0 flex items-center gap-2">
            Active cases
            {cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'emergency').length > 0 && (
              <span className="badge-red text-[10px]">{cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'emergency').length} need attention</span>
            )}
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>
        ) : (
          <div className="space-y-2">
            {cases.map((c, i) => (
              <motion.button key={c.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => navigate('/asha/followup')}
                className={`card-hover w-full p-4 flex items-center gap-4 text-left border-l-4 ${riskStyles[c.riskLevel] || 'border-l-gray-200'}`}>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-[#5F5E5A] flex-shrink-0">
                  {c.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{c.name}</p>
                    <span className={`${riskBadge[c.riskLevel] || 'badge-green'} text-[10px]`}>{c.riskLevel}</span>
                  </div>
                  <p className="text-xs text-[#5F5E5A] truncate">{c.condition}</p>
                  <p className="text-xs mt-1 font-medium text-teal-600">Last seen: {c.lastSeen}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <div className="card p-4 bg-gradient-to-r from-teal-50 to-green-50 border-teal-100">
        <p className="text-xs font-semibold text-teal-700 mb-1">📋 ABDM / FHIR note</p>
        <p className="text-xs text-[#5F5E5A] leading-relaxed">All patient records created offline are ABDM-compliant and will automatically sync to the central health record system once you're back online.</p>
      </div>
    </div>
  )
}
