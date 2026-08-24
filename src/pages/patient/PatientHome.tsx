import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Calendar, FileText, Pill, Video, ChevronRight, Heart, Thermometer, Activity, Loader2, Bell } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { patientsApi, appointmentsApi, type PatientRecord, type Appointment } from '../../services/api'
import { useApp } from '../../context/AppContext'

const quickActions = [
  { label: 'Check Symptoms', icon: <ClipboardList size={22} />, path: '/patient/triage', color: 'bg-teal-50 text-teal-600' },
  { label: 'Book Appointment', icon: <Calendar size={22} />, path: '/patient/appointments', color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Health Records', icon: <FileText size={22} />, path: '/patient/records', color: 'bg-amber-50 text-amber-600' },
  { label: 'My Medicines', icon: <Pill size={22} />, path: '/patient/medicines', color: 'bg-green-50 text-green-600' },
  { label: 'Video Consult', icon: <Video size={22} />, path: '/patient/teleconsult', color: 'bg-coral-50 text-coral-600' },
]

const vitals = [
  { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', status: 'normal' as const, icon: <Activity size={18} /> },
  { label: 'Hemoglobin', value: '11.2', unit: 'g/dL', status: 'low' as const, icon: <Heart size={18} /> },
  { label: 'Temperature', value: '98.4', unit: '°F', status: 'normal' as const, icon: <Thermometer size={18} /> },
]

const statusClasses = {
  normal: 'text-green-600 bg-green-50',
  low: 'text-amber-600 bg-amber-50',
  high: 'text-red-600 bg-red-50',
}

export function PatientHome() {
  const navigate = useNavigate()
  const { patientId, userName } = useApp()
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pid = patientId || 'P-PRIYA-002'
    Promise.all([
      patientsApi.get(pid).catch(() => null),
      appointmentsApi.list({ patientId: pid }).catch(() => []),
    ]).then(([p, appts]) => {
      setPatient(p)
      setAppointments(appts as Appointment[])
    }).finally(() => setLoading(false))
  }, [patientId])

  const upcomingAppt = appointments.find(a => a.status === 'scheduled')
  const latestVisit  = patient?.visits?.[0]

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Good morning, {userName?.split(' ')[0] ?? 'Priya'} 👋</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">
          {patient ? `${patient.conditions[0] ?? 'General'} · Last visit: ${latestVisit?.date ?? '—'}` : 'Loading your health summary…'}
        </p>
      </motion.div>

      <section aria-label="Upcoming appointment">
        {upcomingAppt ? (
        <div className="card p-5 border-l-4 border-l-teal-500">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-teal-600 font-medium uppercase tracking-wide mb-1">Upcoming Appointment</p>
              <p className="font-semibold text-[#2C2C2A]">{upcomingAppt.type === 'teleconsult' ? 'Teleconsultation' : 'In-person visit'}</p>
              <p className="text-sm text-[#5F5E5A] mt-0.5">Token {upcomingAppt.token}</p>
              <p className="text-sm font-medium text-teal-600 mt-1">{upcomingAppt.date} · {upcomingAppt.time}</p>
            </div>
            <button onClick={() => navigate('/patient/teleconsult')} className="btn-primary text-xs px-4 py-2 flex-shrink-0">
              <Video size={14} /> Join call
            </button>
          </div>
        </div>
        ) : !loading && (
          <div className="card p-4 text-sm text-[#5F5E5A] text-center">No upcoming appointments. <button onClick={() => navigate('/patient/appointments')} className="text-teal-600 underline">Book one now</button></div>
        )}
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="section-header">Quick actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3.5 rounded-card bg-white border border-[#D3D1C7] hover:border-teal-200 hover:shadow-card-hover transition-all duration-150 cursor-pointer"
              aria-label={action.label}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`} aria-hidden="true">
                {action.icon}
              </div>
              <span className="text-[11px] font-medium text-[#5F5E5A] text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Vitals */}
      <section aria-labelledby="vitals-heading">
        <h2 id="vitals-heading" className="section-header flex items-center gap-2">
          Latest Vitals
          <AIPill className="text-[10px]" />
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {vitals.map(v => (
            <div key={v.label} className="card p-4 flex flex-col gap-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${statusClasses[v.status]}`} aria-hidden="true">
                {v.icon}
              </div>
              <p className="text-lg font-semibold text-[#2C2C2A] tabular-nums mt-1">{v.value}</p>
              <p className="text-[10px] text-[#5F5E5A]">{v.unit}</p>
              <p className="text-[10px] text-[#5F5E5A]">{v.label}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit capitalize ${statusClasses[v.status]}`}>
                {v.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Health tip */}
      <section aria-label="Health tip of the day">
        <div className="card p-5 bg-gradient-to-r from-teal-50 to-green-50 border-teal-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-teal-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-700 mb-1">Health Tip · Week 28</p>
              <p className="text-sm text-[#2C2C2A] leading-relaxed">
                Iron-rich foods like spinach, lentils, and fortified cereals can help manage low hemoglobin during pregnancy. Take your daily iron supplement with vitamin C for better absorption.
              </p>
              <AIPill className="mt-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Recent records */}
      <section aria-labelledby="records-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="records-heading" className="section-header mb-0">Recent activity</h2>
          <button
            onClick={() => navigate('/patient/records')}
            className="text-sm text-teal-500 hover:text-teal-600 flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-teal-500 rounded"
          >
            View all <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-2">
          {[
            { type: 'Visit', title: 'ANC Check-up', facility: 'PHC Beed', date: '20 Aug 2026', badge: 'badge-green' },
            { type: 'Lab', title: 'CBC Report', facility: 'PHC Beed', date: '18 Aug 2026', badge: 'badge-teal' },
            { type: 'Prescription', title: 'Iron + Folic Acid', facility: 'PHC Beed', date: '15 Aug 2026', badge: 'badge-teal' },
          ].map(r => (
            <button
              key={r.title}
              onClick={() => navigate('/patient/records')}
              className="card-hover w-full p-4 flex items-center gap-3 text-left"
              aria-label={`${r.type}: ${r.title} from ${r.facility} on ${r.date}`}
            >
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-teal-500" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#2C2C2A] truncate">{r.title}</p>
                <p className="text-xs text-[#5F5E5A]">{r.facility} · {r.date}</p>
              </div>
              <span className={r.badge + ' text-[10px]'}>{r.type}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
