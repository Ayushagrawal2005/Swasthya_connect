import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Calendar, FileText, Pill, Video, ChevronRight, Heart, Thermometer, Activity, Loader2, Bell, ArrowRight, RefreshCw, MapPin } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { patientsApi, appointmentsApi, referralsApi, type PatientRecord, type Appointment, type Referral } from '../../services/api'
import { useApp } from '../../context/AppContext'

const quickActions = [
  { label: 'Check Symptoms',   icon: <ClipboardList size={22} />, path: '/patient/triage',       color: 'bg-orange-50 text-[#FF9933]' },
  { label: 'Book Appointment', icon: <Calendar size={22} />,      path: '/patient/appointments', color: 'bg-green-50 text-[#138808]' },
  { label: 'Health Records',   icon: <FileText size={22} />,      path: '/patient/records',      color: 'bg-amber-50 text-amber-600' },
  { label: 'My Medicines',     icon: <Pill size={22} />,          path: '/patient/medicines',    color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Video Consult',    icon: <Video size={22} />,         path: '/patient/teleconsult',  color: 'bg-red-50 text-red-500' },
]

const urgencyBadge: Record<string, string>  = { routine: 'badge-teal', urgent: 'badge-amber', emergency: 'badge-red' }
const urgencyBorder: Record<string, string> = { emergency: 'border-l-4 border-l-red-500', urgent: 'border-l-4 border-l-amber-400', routine: '' }

export function PatientHome() {
  const navigate = useNavigate()
  const { patientId, userName } = useApp()

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

  const upcomingAppt = appointments.find(a => a.status === 'scheduled')
  const activeReferrals = referrals.filter(r => r.status !== 'treated')

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#2C2C2A]">Good morning, {userName?.split(' ')[0] ?? 'Priya'} 👋</h1>
            <p className="text-sm text-[#5F5E5A] mt-0.5">
              {patient ? `${patient.conditions?.[0] ?? 'General'}` : 'Loading your health summary…'}
            </p>
            {lastUpdated && (
              <p className="text-[10px] text-[#9E9C94] mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Live · updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button onClick={() => { setLoading(true); fetchAll() }}
            className="p-2 rounded-lg text-[#5F5E5A] hover:text-[#FF9933] hover:bg-orange-50 transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.div>

      {/* Upcoming appointment */}
      <section>
        {upcomingAppt ? (
          <div className="card p-5 border-l-4 border-l-[#FF9933]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#FF9933] font-medium uppercase tracking-wide mb-1">Upcoming Appointment</p>
                <p className="font-semibold text-[#2C2C2A]">{upcomingAppt.type === 'teleconsult' ? 'Teleconsultation' : 'In-person visit'}</p>
                <p className="text-sm text-[#5F5E5A] mt-0.5">Token {upcomingAppt.token}</p>
                <p className="text-sm font-medium text-[#FF9933] mt-1">{upcomingAppt.date} · {upcomingAppt.time}</p>
              </div>
              {upcomingAppt.type === 'teleconsult' && (
                <button onClick={() => navigate('/patient/teleconsult')} className="btn-primary text-xs px-4 py-2 flex-shrink-0">
                  <Video size={14} /> Join call
                </button>
              )}
            </div>
          </div>
        ) : !loading && (
          <div className="card p-4 text-sm text-[#5F5E5A] text-center">
            No upcoming appointments. <button onClick={() => navigate('/patient/appointments')} className="text-[#FF9933] underline">Book one now</button>
          </div>
        )}
      </section>

      {/* Active referrals */}
      {(loading || activeReferrals.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-header mb-0 flex items-center gap-2">
              My Referrals
              {activeReferrals.length > 0 && <span className="badge-amber text-[10px]">{activeReferrals.length} active</span>}
            </h2>
            <button onClick={() => navigate('/patient/referrals')} className="text-xs text-[#FF9933] hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#FF9933]" /></div>
          ) : (
            <div className="space-y-2">
              {activeReferrals.slice(0, 2).map(r => (
                <button key={r.id} onClick={() => navigate('/patient/referrals')}
                  className={`card-hover w-full p-4 flex items-center gap-3 text-left ${urgencyBorder[r.urgency] || ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm text-[#2C2C2A]">{r.toFacilityName}</p>
                      <span className={`${urgencyBadge[r.urgency] || 'badge-teal'} text-[10px]`}>{r.urgency}</span>
                    </div>
                    <p className="text-xs text-[#5F5E5A] truncate">{r.reason}</p>
                    <p className="text-[10px] text-[#5F5E5A] mt-0.5 flex items-center gap-1">
                      <MapPin size={9} /> Status: <span className="font-medium capitalize">{r.status}</span>
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-[#5F5E5A]" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="section-header">Quick actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 p-3.5 rounded-card bg-white border border-[#D3D1C7] hover:border-[#FF9933] hover:shadow-card-hover transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${a.color}`}>{a.icon}</div>
              <span className="text-[11px] font-medium text-[#5F5E5A] text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Vitals */}
      <section>
        <h2 className="section-header flex items-center gap-2">Latest Vitals <AIPill className="text-[10px]" /></h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', status: 'normal', icon: <Activity size={18} />, ok: true },
            { label: 'Hemoglobin',     value: '11.2',   unit: 'g/dL', status: 'low',    icon: <Heart size={18} />,   ok: false },
            { label: 'Temperature',    value: '98.4',   unit: '°F',   status: 'normal', icon: <Thermometer size={18} />, ok: true },
          ].map(v => (
            <div key={v.label} className="card p-4 flex flex-col gap-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${v.ok ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>{v.icon}</div>
              <p className="text-lg font-semibold text-[#2C2C2A] tabular-nums mt-1">{v.value}</p>
              <p className="text-[10px] text-[#5F5E5A]">{v.unit}</p>
              <p className="text-[10px] text-[#5F5E5A]">{v.label}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit capitalize ${v.ok ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>{v.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Health tip */}
      <section>
        <div className="card p-5 bg-gradient-to-r from-orange-50 to-green-50 border-orange-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-[#FF9933]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#E67300] mb-1">Health Tip · Today</p>
              <p className="text-sm text-[#2C2C2A] leading-relaxed">
                Iron-rich foods like spinach, lentils, and fortified cereals can help manage low hemoglobin. Take your daily iron supplement with vitamin C for better absorption.
              </p>
              <AIPill className="mt-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Recent records */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-header mb-0">Recent activity</h2>
          <button onClick={() => navigate('/patient/records')} className="text-sm text-[#FF9933] hover:underline flex items-center gap-1">
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {[
            { type: 'Visit',        title: 'ANC Check-up',       facility: 'PHC Beed', date: '20 Aug 2026' },
            { type: 'Lab',          title: 'CBC Report',          facility: 'PHC Beed', date: '18 Aug 2026' },
            { type: 'Prescription', title: 'Iron + Folic Acid',   facility: 'PHC Beed', date: '15 Aug 2026' },
          ].map(r => (
            <button key={r.title} onClick={() => navigate('/patient/records')}
              className="card-hover w-full p-4 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-[#FF9933]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#2C2C2A] truncate">{r.title}</p>
                <p className="text-xs text-[#5F5E5A]">{r.facility} · {r.date}</p>
              </div>
              <span className="badge-teal text-[10px]">{r.type}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
