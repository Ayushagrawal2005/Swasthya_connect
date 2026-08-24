import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, Clock, ChevronRight, User, Activity, Loader2 } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { appointmentsApi, type Appointment } from '../../services/api'
import { useApp } from '../../context/AppContext'

export function DoctorHome() {
  const navigate = useNavigate()
  const { userName } = useApp()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    appointmentsApi.list({ date: today })
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [today])

  const stats = [
    { label: 'Patients today', value: appointments.length, icon: <User size={16} />, sub: `${appointments.filter(a => a.status === 'scheduled').length} remaining` },
    { label: 'Avg wait time',  value: '8m',                icon: <Clock size={16} />, sub: 'Estimated' },
    { label: 'Teleconsults',   value: appointments.filter(a => a.type === 'teleconsult').length, icon: <Video size={16} />, sub: '' },
    { label: 'Referrals sent', value: '—',                  icon: <Activity size={16} />, sub: '' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Good morning, {userName ?? 'Doctor'} 👋</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <span className="badge-green"><span className="w-1.5 h-1.5 rounded-full bg-green-500 status-dot-live" />On duty</span>
      </div>

      <section aria-label="Today's statistics">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <dt className="flex items-center gap-1.5 text-xs text-[#5F5E5A]"><span className="text-teal-500">{s.icon}</span>{s.label}</dt>
              <dd className="text-2xl font-semibold text-[#2C2C2A] tabular-nums">
                {loading ? <Loader2 size={16} className="animate-spin text-teal-400 mt-1" /> : s.value}
              </dd>
              <p className="text-xs text-[#5F5E5A]">{s.sub}</p>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="queue-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="queue-heading" className="section-header mb-0">
            Patient queue
            <span className="ml-2 text-xs font-normal text-[#5F5E5A]">({appointments.length} today)</span>
          </h2>
          <button onClick={() => navigate('/doctor/referrals')} className="text-sm text-teal-500 hover:text-teal-600 flex items-center gap-1">
            Referrals <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>
        ) : (
          <div className="space-y-2" role="list">
            {appointments.map((appt, i) => (
              <motion.div key={appt.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                role="listitem" onClick={() => navigate('/doctor/patient')}
                className="card-hover p-4 flex items-center gap-4 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700 flex-shrink-0">
                  {appt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{appt.patientName}</p>
                    <span className={`${appt.type === 'teleconsult' ? 'badge-teal' : 'badge-green'} text-[10px]`}>{appt.type}</span>
                  </div>
                  <p className="text-xs text-[#5F5E5A]">{appt.time} · Token {appt.token} · Wait ~{appt.estimatedWait}m</p>
                </div>
                <ChevronRight size={16} className="text-[#5F5E5A]" />
              </motion.div>
            ))}
            {appointments.length === 0 && (
              <p className="text-sm text-[#5F5E5A] text-center py-8">No appointments scheduled today.</p>
            )}
          </div>
        )}
      </section>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => navigate('/doctor/referrals')} className="btn-secondary text-sm py-2.5 px-4">Referral inbox</button>
        <button onClick={() => navigate('/doctor/followup')} className="btn-secondary text-sm py-2.5 px-4">Follow-up board</button>
        <button onClick={() => navigate('/doctor/emergency')} className="btn-coral text-sm py-2.5 px-4">Emergency escalation</button>
      </div>

      <AIPill />
    </div>
  )
}
