import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Calendar, FileText, Pill, Video, ChevronRight, Heart, Thermometer, Activity, Loader2, Bell, ArrowRight, RefreshCw, MapPin } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { patientsApi, appointmentsApi, referralsApi, type PatientRecord, type Appointment, type Referral } from '../../services/api'
import { useApp, useT } from '../../context/AppContext'

const urgencyBadge: Record<string, string>  = { 
  routine: 'bg-teal-50 text-teal-600', 
  urgent: 'bg-amber-50 text-amber-600', 
  emergency: 'bg-red-50 text-red-600' 
}
const urgencyBorder: Record<string, string> = { 
  emergency: 'border-l-4 border-l-red-500', 
  urgent: 'border-l-4 border-l-amber-400', 
  routine: 'border-l-4 border-l-teal-400' 
}

export function PatientHome() {
  const navigate = useNavigate()
  const { patientId, userName } = useApp()
  const t = useT()

  const [patient,      setPatient]      = useState<PatientRecord | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [referrals,    setReferrals]    = useState<Referral[]>([])
  const [loading,      setLoading]      = useState(true)
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null)

  const fetchAll = useCallback(() => {
    const pid = patientId || 'P-PRIYA-002'
    return Promise.all([
      patientsApi.get(pid).catch(() => null),
      appointmentsApi.list({ patientId: pid }).catch(() => [] as Appointment[]),
      patientsApi.getReferrals(pid).catch(() => [] as Referral[]),
    ]).then(([p, appts, refs]) => {
      setPatient(p)
      setAppointments(appts as Appointment[])
      setReferrals(refs as Referral[])
      setLastUpdated(new Date())
    }).finally(() => setLoading(false))
  }, [patientId])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  const upcomingAppt    = appointments.find(a => a.status === 'scheduled')
  const activeReferrals = referrals.filter(r => r.status !== 'treated')

  const quickActions = [
    { labelKey: 'checkSymptoms',   icon: <ClipboardList className="w-6 h-6" />, path: '/patient/triage',       color: 'from-[#E85D04] to-[#d94f03]' },
    { labelKey: 'bookAppointment', icon: <Calendar className="w-6 h-6" />,      path: '/patient/appointments', color: 'from-emerald-500 to-emerald-600' },
    { labelKey: 'healthRecords',   icon: <FileText className="w-6 h-6" />,      path: '/patient/records',      color: 'from-amber-500 to-amber-600' },
    { labelKey: 'myMedicines',     icon: <Pill className="w-6 h-6" />,          path: '/patient/medicines',    color: 'from-purple-500 to-purple-600' },
    { labelKey: 'videoConsult',    icon: <Video className="w-6 h-6" />,         path: '/patient/teleconsult',  color: 'from-[#123B6D] to-[#1a5490]' },
  ] as const

  const vitals = [
    { labelKey: 'bloodPressure', value: '118/76', unit: 'mmHg', statusKey: 'normal', icon: <Activity className="w-5 h-5" />, ok: true },
    { labelKey: 'hemoglobin',    value: '11.2',   unit: 'g/dL', statusKey: 'low',    icon: <Heart className="w-5 h-5" />,   ok: false },
    { labelKey: 'temperature',   value: '98.4',   unit: '°F',   statusKey: 'normal', icon: <Thermometer className="w-5 h-5" />, ok: true },
  ] as const

  const recentRecords = [
    { typeKey: 'visit',        title: 'ANC Check-up',     facility: 'PHC Beed', date: '20 Aug 2026' },
    { typeKey: 'lab',          title: 'CBC Report',        facility: 'PHC Beed', date: '18 Aug 2026' },
    { typeKey: 'prescription', title: 'Iron + Folic Acid', facility: 'PHC Beed', date: '15 Aug 2026' },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Greeting Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#123B6D] mb-1">
                {t('goodMorning')}, {userName?.split(' ')[0] ?? 'Priya'} 👋
              </h1>
              <p className="text-base text-gray-600">
                {patient ? `${patient.conditions?.[0] ?? 'General'}` : '…'}
              </p>
              {lastUpdated && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {t('live')}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span>{t('updated')} {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => { setLoading(true); fetchAll() }}
              className="p-3 rounded-xl text-gray-600 hover:text-[#E85D04] hover:bg-[#E85D04]/10 transition-all border border-gray-200 hover:border-[#E85D04]"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Upcoming Appointment */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {upcomingAppt ? (
            <div className="bg-gradient-to-r from-[#E85D04] to-[#d94f03] rounded-2xl shadow-lg p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wide mb-2 opacity-90">
                    {t('upcomingAppointment')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold mb-1">
                    {upcomingAppt.type === 'teleconsult' ? t('teleconsultation') : t('inPersonVisit')}
                  </p>
                  <p className="text-sm opacity-90">{t('token')} {upcomingAppt.token}</p>
                  <p className="text-lg font-semibold mt-2">{upcomingAppt.date} · {upcomingAppt.time}</p>
                </div>
                {upcomingAppt.type === 'teleconsult' && (
                  <button 
                    onClick={() => navigate('/patient/teleconsult')} 
                    className="bg-white text-[#E85D04] px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <Video className="w-5 h-5" /> {t('joinCall')}
                  </button>
                )}
              </div>
            </div>
          ) : !loading && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center">
              <p className="text-gray-600">
                {t('noUpcomingAppointments')}{' '}
                <button onClick={() => navigate('/patient/appointments')} className="text-[#E85D04] font-semibold hover:underline">
                  {t('bookOneNow')}
                </button>
              </p>
            </div>
          )}
        </motion.section>

        {/* Quick Actions Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-[#123B6D] mb-4">{t('quickActions')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.labelKey}
                onClick={() => navigate(action.path)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <span className="text-sm font-semibold text-gray-700 block">{t(action.labelKey)}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Active Referrals */}
        {(loading || activeReferrals.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#123B6D] flex items-center gap-2">
                {t('myReferrals')}
                {activeReferrals.length > 0 && (
                  <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-semibold">
                    {activeReferrals.length} {t('active')}
                  </span>
                )}
              </h2>
              <button 
                onClick={() => navigate('/patient/referrals')} 
                className="text-sm text-[#E85D04] font-semibold hover:underline flex items-center gap-1"
              >
                {t('viewAll')} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#E85D04]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeReferrals.slice(0, 2).map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => navigate('/patient/referrals')}
                    className={`bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-xl transition-all text-left group ${urgencyBorder[r.urgency] || ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-[#123B6D]">{r.toFacilityName}</p>
                          <span className={`${urgencyBadge[r.urgency]} px-2 py-0.5 rounded-full text-xs font-semibold`}>
                            {t(r.urgency as any) || r.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{r.reason}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> 
                          {t('status')}: <span className="font-semibold capitalize">{r.status}</span>
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Vitals */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-[#123B6D]">{t('latestVitals')}</h2>
            <AIPill className="text-xs" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {vitals.map(v => (
              <div key={v.labelKey} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${v.ok ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                  {v.icon}
                </div>
                <p className="text-3xl font-bold text-[#123B6D] tabular-nums mb-1">{v.value}</p>
                <p className="text-sm text-gray-500 mb-2">{v.unit}</p>
                <p className="text-sm font-medium text-gray-700 mb-3">{t(v.labelKey)}</p>
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full capitalize ${v.ok ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                  {t(v.statusKey)}
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Health Tip */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 rounded-2xl shadow-md border border-orange-100 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E85D04] to-[#d94f03] flex items-center justify-center flex-shrink-0 text-white">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#E85D04] mb-2">{t('healthTip')} · {t('today')}</p>
                <p className="text-base text-gray-700 leading-relaxed mb-3">
                  Iron-rich foods like spinach, lentils, and fortified cereals can help manage low hemoglobin. Take your daily iron supplement with vitamin C for better absorption.
                </p>
                <AIPill />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#123B6D]">{t('recentActivity')}</h2>
            <button 
              onClick={() => navigate('/patient/records')} 
              className="text-sm text-[#E85D04] font-semibold hover:underline flex items-center gap-1"
            >
              {t('viewAll')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentRecords.map(r => (
              <button 
                key={r.title} 
                onClick={() => navigate('/patient/records')}
                className="w-full bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-xl transition-all flex items-center gap-4 text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E85D04] to-[#d94f03] flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#123B6D] mb-1">{r.title}</p>
                  <p className="text-sm text-gray-600">{r.facility} · {r.date}</p>
                </div>
                <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                  {r.typeKey}
                </span>
              </button>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
