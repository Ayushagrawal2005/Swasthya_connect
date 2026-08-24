// ASHA / ANM Worker Dashboard — frontline entry point per SwasthyaConnect report §13
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  UserPlus, ClipboardList, AlertTriangle, ArrowRight,
  CheckCircle, Clock, Users, Siren, WifiOff,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

const quickActions = [
  { label: 'Register new patient',  icon: <UserPlus size={22} />,      path: '/asha/register',  color: 'bg-teal-50 text-teal-600',   desc: 'Create ABDM health ID' },
  { label: 'Triage a patient',      icon: <ClipboardList size={22} />, path: '/asha/triage',    color: 'bg-indigo-50 text-indigo-600', desc: 'Record vitals & symptoms' },
  { label: 'High-risk follow-ups',  icon: <AlertTriangle size={22} />, path: '/asha/followup',  color: 'bg-coral-50 text-coral-600',  desc: '2 overdue today' },
  { label: 'View referrals',        icon: <ArrowRight size={22} />,    path: '/asha/referrals', color: 'bg-amber-50 text-amber-600',  desc: '3 pending tracking' },
  { label: 'Emergency escalation',  icon: <Siren size={22} />,         path: '/asha/emergency', color: 'bg-red-50 text-red-600',      desc: 'One-tap urgent alert' },
]

// The Meena scenario from section 14 of the report
const activeCases = [
  {
    id: 'P001',
    name: 'Meena Jadhav',
    condition: 'High-risk pregnancy (32W)',
    riskLevel: 'high' as const,
    lastContact: '21 Aug 2026',
    nextAction: 'Check BP today — OVERDUE',
    overdue: true,
  },
  {
    id: 'P002',
    name: 'Lata Kale',
    condition: 'Type 2 Diabetes + Hypertension',
    riskLevel: 'medium' as const,
    lastContact: '22 Aug 2026',
    nextAction: 'Medicine refill due in 3 days',
    overdue: false,
  },
  {
    id: 'P003',
    name: 'Ganesh Wagh',
    condition: 'TB treatment — Week 8',
    riskLevel: 'medium' as const,
    lastContact: '20 Aug 2026',
    nextAction: 'DOT observation visit today',
    overdue: false,
  },
  {
    id: 'P004',
    name: 'Sunita Bai',
    condition: 'Post-cataract (7 days)',
    riskLevel: 'low' as const,
    lastContact: '23 Aug 2026',
    nextAction: 'Check eye drops compliance',
    overdue: false,
  },
]

const riskStyles = {
  high:   'border-l-coral-500',
  medium: 'border-l-amber-400',
  low:    'border-l-teal-400',
}

const riskBadge = {
  high:   'badge-red',
  medium: 'badge-amber',
  low:    'badge-green',
}

export function AshaDashboard() {
  const navigate = useNavigate()
  const { isOnline, pendingSyncCount } = useApp()

  const todayStats = [
    { label: 'Patients visited', value: '7',  icon: <Users size={16} /> },
    { label: 'Triages done',     value: '4',  icon: <ClipboardList size={16} /> },
    { label: 'Referrals made',   value: '2',  icon: <ArrowRight size={16} /> },
    { label: 'Overdue follow-ups', value: '2', icon: <Clock size={16} /> },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Good morning, Kavita 👋</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">ASHA Worker · Sub-centre Mandav · Monday, 23 Aug 2026</p>

        {/* Offline sync status — inline for ASHA workers who often work offline */}
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

      {/* Today's stats */}
      <section aria-label="Today's activity">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {todayStats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="stat-card">
              <dt className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                <span className="text-teal-500" aria-hidden="true">{s.icon}</span>
                {s.label}
              </dt>
              <dd className="text-2xl font-semibold text-[#2C2C2A] tabular-nums">{s.value}</dd>
            </motion.div>
          ))}
        </dl>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="section-header">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => navigate(action.path)}
              className="card-hover p-4 flex items-center gap-4 text-left"
              aria-label={action.label}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`} aria-hidden="true">
                {action.icon}
              </div>
              <div>
                <p className="font-semibold text-sm text-[#2C2C2A]">{action.label}</p>
                <p className="text-xs text-[#5F5E5A] mt-0.5">{action.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Active high-risk cases — Meena scenario per report §14 */}
      <section aria-labelledby="cases-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="cases-heading" className="section-header mb-0 flex items-center gap-2">
            My active cases
            <span className="badge-red text-[10px]">2 need attention</span>
          </h2>
        </div>
        <div className="space-y-2">
          {activeCases.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => navigate(`/asha/followup`)}
              className={`card-hover w-full p-4 flex items-center gap-4 text-left border-l-4 ${riskStyles[c.riskLevel]}`}
              aria-label={`Case: ${c.name} — ${c.condition}`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-[#5F5E5A] flex-shrink-0" aria-hidden="true">
                {c.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-semibold text-sm text-[#2C2C2A]">{c.name}</p>
                  <span className={`${riskBadge[c.riskLevel]} text-[10px]`}>
                    {c.riskLevel === 'high' ? 'High risk' : c.riskLevel === 'medium' ? 'Moderate' : 'Stable'}
                  </span>
                  {c.overdue && <span className="badge-red text-[10px]">Overdue</span>}
                </div>
                <p className="text-xs text-[#5F5E5A] truncate">{c.condition}</p>
                <p className={`text-xs mt-1 font-medium ${c.overdue ? 'text-red-600' : 'text-teal-600'}`}>{c.nextAction}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Helpful reminder */}
      <div className="card p-4 bg-gradient-to-r from-teal-50 to-green-50 border-teal-100">
        <p className="text-xs font-semibold text-teal-700 mb-1">📋 ABDM / FHIR note</p>
        <p className="text-xs text-[#5F5E5A] leading-relaxed">
          All patient records created in offline mode are ABDM-compliant and will automatically sync to the central health record system once you're back online. No data will be lost.
        </p>
      </div>
    </div>
  )
}
