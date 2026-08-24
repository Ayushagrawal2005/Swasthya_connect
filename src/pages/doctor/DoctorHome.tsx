// Module 4 — Doctor Queue View — referrals sorted by urgency score
// Meena's referral sits at top (score 52, Stage 2 HTN) above routine cases
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Video, Clock, AlertTriangle, ChevronRight, User,
  Activity, Stethoscope, Phone, TrendingUp,
} from 'lucide-react'
import { meena } from '../../data/meenaPatient'
import { AIPill } from '../../components/ui/AIPill'

type RiskLevel = 'high' | 'medium' | 'low'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  chief: string
  risk: RiskLevel
  score: number   // 0-100 urgency score — determines queue order
  wait: string
  type: 'in-person' | 'teleconsult'
  referred?: boolean
  trendFlag?: string
}

// Queue sorted by score DESC — Meena is top despite arriving same time as others
const queue: Patient[] = ([
  {
    id: 'P001', name: meena.name, age: meena.age, gender: 'F',
    chief: 'Headache + dizziness · BP 168/104 · HTN worsening (152→158→168)',
    risk: 'high', score: 52, wait: '5 min', type: 'in-person', referred: true,
    trendFlag: 'Hypertension — Worsening ↑',
  },
  { id: 'P002', name: 'Ramesh Jadhav', age: 54, gender: 'M', chief: 'Chest pain + shortness of breath', risk: 'high', score: 68, wait: '0 min', type: 'teleconsult' },
  { id: 'P003', name: 'Sunita Bai',   age: 67, gender: 'F', chief: 'Hypertension follow-up',           risk: 'low',  score: 18, wait: '12 min', type: 'in-person' },
  { id: 'P004', name: 'Arjun Patil',  age: 8,  gender: 'M', chief: 'Fever + rash for 3 days',          risk: 'medium', score: 30, wait: '18 min', type: 'in-person', referred: true },
  { id: 'P005', name: 'Lata Kale',    age: 34, gender: 'F', chief: 'Routine skin rash — mild',         risk: 'low',  score: 8,  wait: '25 min', type: 'in-person' },
] as Patient[]).sort((a, b) => b.score - a.score)

const riskStyles: Record<RiskLevel, string> = {
  high: 'badge-red',
  medium: 'badge-amber',
  low: 'badge-green',
}

const riskLabels: Record<RiskLevel, string> = {
  high: 'High risk',
  medium: 'Moderate',
  low: 'Low risk',
}

const stats = [
  { label: 'Patients today', value: '12', icon: <User size={16} />, sub: '3 remaining' },
  { label: 'Avg wait time', value: '8m', icon: <Clock size={16} />, sub: '↓ from 14m' },
  { label: 'Teleconsults', value: '4', icon: <Video size={16} />, sub: '1 live now' },
  { label: 'Referrals sent', value: '2', icon: <Activity size={16} />, sub: 'District Hosp.' },
]

export function DoctorHome() {
  const navigate = useNavigate()

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Good morning, Dr. Patil</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">PHC Beed · Monday, 23 Aug 2026</p>
        </div>
        <span className="badge-green">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-dot-live" aria-hidden="true" />
          On duty
        </span>
      </div>

      {/* Stats */}
      <section aria-label="Today's statistics">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <dt className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                <span className="text-teal-500" aria-hidden="true">{s.icon}</span>
                {s.label}
              </dt>
              <dd className="text-2xl font-semibold text-[#2C2C2A] tabular-nums">{s.value}</dd>
              <p className="text-xs text-[#5F5E5A]">{s.sub}</p>
            </div>
          ))}
        </dl>
      </section>

      {/* Queue */}
      <section aria-labelledby="queue-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="queue-heading" className="section-header mb-0">
            Patient queue
            <span className="ml-2 text-xs font-normal text-[#5F5E5A]">({queue.length} waiting · sorted by urgency score)</span>
          </h2>
          <button className="text-sm text-teal-500 hover:text-teal-600 flex items-center gap-1" aria-label="View all patients">
            View all <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2" role="list" aria-label="Patient queue">
          {queue.map((patient, i) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              role="listitem"
            >
              <button
                onClick={() => navigate('/doctor/patient')}
                className="card-hover w-full p-4 flex items-center gap-4 text-left"
                aria-label={`Patient ${patient.name}, score ${patient.score}, waiting ${patient.wait}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-[#5F5E5A]" aria-hidden="true">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {patient.risk === 'high' && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center" aria-hidden="true">
                      <AlertTriangle size={9} className="text-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#2C2C2A]">{patient.name}</span>
                    <span className="text-xs text-[#5F5E5A]">{patient.age}{patient.gender} · #{patient.id}</span>
                    {patient.referred && <span className="badge-teal text-[10px]">Referred</span>}
                  </div>
                  <p className="text-xs text-[#5F5E5A] mt-0.5 truncate">{patient.chief}</p>
                  {patient.trendFlag && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-coral-600 font-medium">
                      <TrendingUp size={10} aria-hidden="true" /> {patient.trendFlag}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`${riskStyles[patient.risk]} text-[10px]`}>{riskLabels[patient.risk]}</span>
                    <span className="text-[10px] font-bold tabular-nums text-[#2C2C2A] bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {patient.score}pts
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {patient.type === 'teleconsult' ? (
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/patient/teleconsult') }}
                        className="flex items-center gap-1 text-[10px] bg-teal-500 text-white px-2 py-1 rounded-full hover:bg-teal-600 transition-colors"
                        aria-label={`Join teleconsult with ${patient.name}`}
                      >
                        <Video size={10} aria-hidden="true" /> Join now
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-[#5F5E5A]">
                        <Clock size={10} aria-hidden="true" /> {patient.wait}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Referral alert */}
      <section aria-label="Referral alert">
        <div className="card p-4 border-l-4 border-l-coral-500 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-coral-50 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={18} className="text-coral-500" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#2C2C2A]">2 incoming referrals from Sub-centre Mandav</p>
            <p className="text-xs text-[#5F5E5A] mt-0.5">High-risk maternal cases — review required</p>
          </div>
          <button
            onClick={() => navigate('/doctor/referrals')}
            className="text-coral-500 hover:text-coral-600 text-sm font-medium flex items-center gap-1 flex-shrink-0"
            aria-label="View incoming referrals"
          >
            View <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Quick call */}
      <section aria-label="Quick dial">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#2C2C2A]">Emergency helpline</p>
            <p className="text-xs text-[#5F5E5A]">104 · National Health Helpline</p>
          </div>
          <a
            href="tel:104"
            className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-btn text-sm font-medium hover:bg-red-100 transition-colors"
            aria-label="Call 104 National Health Helpline"
          >
            <Phone size={14} aria-hidden="true" /> Call 104
          </a>
        </div>
      </section>
    </div>
  )
}
