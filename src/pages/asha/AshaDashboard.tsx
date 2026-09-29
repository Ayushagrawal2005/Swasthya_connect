import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, ClipboardList, AlertTriangle, ArrowRight, Clock, Users, Siren, WifiOff, Loader2, RefreshCw } from 'lucide-react'
import { useApp, useT } from '../../context/AppContext'
import { adminApi, referralsApi, followupsApi, type AshaDashboardData, type Referral, type FollowUp } from '../../services/api'

const riskBorder: Record<string, string> = { high: 'border-l-4 border-l-red-500', medium: 'border-l-4 border-l-amber-400', low: 'border-l-4 border-l-green-400', emergency: 'border-l-4 border-l-red-700' }
const riskBadge:  Record<string, string> = { high: 'bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium', medium: 'bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium', low: 'bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium', emergency: 'bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium' }
const urgencyBadge: Record<string, string> = { routine: 'bg-orange-100 text-[#E85D04] px-2.5 py-1 rounded-full text-xs font-medium', urgent: 'bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium', emergency: 'bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium' }

export function AshaDashboard() {
  const navigate = useNavigate()
  const { isOnline, pendingSyncCount, userName } = useApp()
  const t = useT()

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

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  const stats = data?.todayStats
  const cases = data?.activeCases || []
  const pendingRefs      = referrals.filter(r => r.status === 'pending')
  const overdueFollowups = followups.filter(f => f.status !== 'completed')

  const quickActions = [
    { labelKey: 'registerNewPatient', icon: <UserPlus size={24} />,      path: '/asha/register',  gradient: 'from-[#E85D04] to-[#d94f03]', descKey: 'createAbdmId' },
    { labelKey: 'triageAPatient',     icon: <ClipboardList size={24} />, path: '/asha/triage',    gradient: 'from-[#123B6D] to-[#1a5490]',  descKey: 'recordVitalsSymptoms' },
    { labelKey: 'highRiskFollowUps',  icon: <AlertTriangle size={24} />, path: '/asha/followup',  gradient: 'from-red-500 to-red-600',      descKey: 'overdueCases' },
    { labelKey: 'viewReferrals',      icon: <ArrowRight size={24} />,    path: '/asha/referrals', gradient: 'from-amber-500 to-amber-600',  descKey: 'pendingTracking' },
    { labelKey: 'emergencyEscalation',icon: <Siren size={24} />,         path: '/asha/emergency', gradient: 'from-red-600 to-red-700',      descKey: 'oneTapUrgentAlert' },
  ] as const

  const statCards: { labelKey: string; value: number | string; icon: React.ReactNode; alert?: boolean }[] = [
    { labelKey: 'patientsVisited',  value: stats?.visited          ?? '—', icon: <Users size={20} /> },
    { labelKey: 'triagesDone',      value: stats?.triages          ?? '—', icon: <ClipboardList size={20} /> },
    { labelKey: 'referralsMade',    value: stats?.referrals        ?? '—', icon: <ArrowRight size={20} /> },
    { labelKey: 'overdueFollowups', value: overdueFollowups.length ?? '—', icon: <Clock size={20} />, alert: overdueFollowups.length > 0 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#123B6D] to-[#1a5490] bg-clip-text text-transparent">
                {t('goodMorning')}, {userName?.split(' ')[0] ?? 'Kavita'} 👋
              </h1>
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#E85D04] text-white px-3 py-1 rounded-full text-xs font-medium">
                  {t('ashaWorker')}
                </span>
                <span>·</span>
                <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
              </p>
            </div>
            <button 
              onClick={() => { setLoading(true); fetchAll() }}
              className="p-3 rounded-xl bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white hover:shadow-lg transition-all duration-200 hover:scale-105" 
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {lastUpdated && (
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-medium">{t('live')}</span>
              <span>·</span>
              <span>{t('updated')} {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          
          {!isOnline && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 flex items-center gap-3 text-sm text-amber-800 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl px-4 py-3"
            >
              <WifiOff size={18} className="flex-shrink-0" />
              <span className="font-medium">
                {pendingSyncCount > 0
                  ? `${pendingSyncCount} ${t('syncPending')}`
                  : t('offlineMsg')}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div 
                key={s.labelKey} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all duration-200 hover:shadow-xl ${
                  s.alert 
                    ? 'border-red-300 bg-gradient-to-br from-red-50 to-white' 
                    : 'border-gray-100 hover:border-[#E85D04]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-xl ${s.alert ? 'bg-red-100 text-red-600' : 'bg-gradient-to-br from-[#E85D04] to-[#d94f03] text-white'}`}>
                    {s.icon}
                  </div>
                </div>
                <dt className="text-sm text-gray-600 font-medium mb-1">
                  {t(s.labelKey as any)}
                </dt>
                <dd className={`text-3xl font-bold ${s.alert ? 'text-red-600' : 'text-[#123B6D]'}`}>
                  {loading ? <Loader2 size={24} className="animate-spin text-[#E85D04]" /> : s.value}
                </dd>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-xl font-bold text-[#123B6D] mb-4 flex items-center gap-2">
            {t('quickActions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((a, i) => (
              <motion.button 
                key={a.labelKey} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(a.path)} 
                className="bg-white rounded-2xl shadow-lg p-6 flex items-start gap-4 text-left border-2 border-gray-100 hover:border-[#E85D04] hover:shadow-xl transition-all duration-200 hover:scale-105 group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform duration-200`}>
                  {a.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#123B6D] text-base mb-1">{t(a.labelKey)}</p>
                  <p className="text-sm text-gray-600">{t(a.descKey)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Pending referrals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#123B6D] flex items-center gap-2">
              {t('pendingReferrals')}
              {pendingRefs.length > 0 && (
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {pendingRefs.length}
                </span>
              )}
            </h2>
            <button 
              onClick={() => navigate('/asha/referrals')} 
              className="text-sm font-semibold text-[#E85D04] hover:text-[#d94f03] transition-colors"
            >
              {t('viewAll')} →
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8 bg-white rounded-2xl shadow-lg">
              <Loader2 className="animate-spin text-[#E85D04]" size={32} />
            </div>
          ) : pendingRefs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-100">
              <p className="text-gray-600">{t('noPendingReferrals')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRefs.slice(0, 3).map((r, i) => (
                <motion.button 
                  key={r.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate('/asha/referrals')}
                  className="bg-white rounded-2xl shadow-lg w-full p-5 flex items-center gap-4 text-left border-2 border-gray-100 hover:border-[#E85D04] hover:shadow-xl transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <p className="font-bold text-[#123B6D] text-base">{r.patientName}</p>
                      <span className={urgencyBadge[r.urgency] || 'bg-orange-100 text-[#E85D04] px-2.5 py-1 rounded-full text-xs font-medium'}>
                        {t(r.urgency as any) || r.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{r.toFacilityName} · {r.reason?.slice(0, 50)}…</p>
                  </div>
                  <ArrowRight size={20} className="text-[#E85D04] flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              ))}
            </div>
          )}
        </section>

        {/* Active cases */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#123B6D] flex items-center gap-2">
              {t('activeCases')}
              {cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'emergency').length > 0 && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'emergency').length} {t('needAttention')}
                </span>
              )}
            </h2>
            <button 
              onClick={() => navigate('/asha/followup')} 
              className="text-sm font-semibold text-[#E85D04] hover:text-[#d94f03] transition-colors"
            >
              {t('viewAll')} →
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12 bg-white rounded-2xl shadow-lg">
              <Loader2 className="animate-spin text-[#E85D04]" size={32} />
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-100">
              <p className="text-gray-600">{t('noActiveCases')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c, i) => (
                <motion.button 
                  key={c.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate('/asha/followup')}
                  className={`bg-white rounded-2xl shadow-lg w-full p-5 flex items-center gap-4 text-left border-2 hover:shadow-xl transition-all duration-200 group ${riskBorder[c.riskLevel] || 'border-l-4 border-l-gray-300'} border-gray-100 hover:border-[#E85D04]`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#123B6D] to-[#1a5490] flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                    {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-[#123B6D] text-base">{c.name}</p>
                      <span className={riskBadge[c.riskLevel] || 'bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium'}>
                        {c.riskLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1">{c.condition}</p>
                    <p className="text-xs font-semibold text-[#E85D04]">{t('lastSeen')}: {c.lastSeen}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
