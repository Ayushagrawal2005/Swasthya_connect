import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, TrendingUp, AlertTriangle, Package, CheckCircle,
  Activity, ArrowUp, ArrowDown, Clock, Loader2, Map,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { adminApi, type AdminOverview } from '../../services/api'

const footfallData = [
  { day: 'Mon', patients: 142, referrals: 12 },
  { day: 'Tue', patients: 168, referrals: 18 },
  { day: 'Wed', patients: 155, referrals: 14 },
  { day: 'Thu', patients: 192, referrals: 22 },
  { day: 'Fri', patients: 177, referrals: 19 },
  { day: 'Sat', patients: 213, referrals: 27 },
  { day: 'Sun', patients: 89, referrals: 8 },
]

const referralFlow = [
  { name: 'Sub-centre', value: 38, color: '#5DCAA5' },
  { name: 'PHC', value: 45, color: '#0F6E56' },
  { name: 'Rural Hosp.', value: 12, color: '#3C3489' },
  { name: 'District', value: 5, color: '#D85A30' },
]

const kpis = [
  {
    label: 'Patient footfall',
    value: '1,136',
    change: '+8.4%',
    up: true,
    icon: <Users size={18} />,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  {
    label: 'Referral completion',
    value: '94.2%',
    change: '+2.1%',
    up: true,
    icon: <TrendingUp size={18} />,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    label: 'High-risk follow-ups',
    value: '23',
    change: '5 overdue',
    up: false,
    icon: <AlertTriangle size={18} />,
    color: 'text-coral-500',
    bg: 'bg-coral-50',
  },
  {
    label: 'Medicine alerts',
    value: '7',
    change: 'Low stock',
    up: false,
    icon: <Package size={18} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    label: 'Avg consult time',
    value: '6.2 min',
    change: '↓ 1.4 min',
    up: true,
    icon: <Clock size={18} />,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  {
    label: 'ASHA reports',
    value: '312',
    change: '+44 this week',
    up: true,
    icon: <CheckCircle size={18} />,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
]

const stockAlerts = [
  { name: 'Iron + Folic Acid Tabs', current: 120, threshold: 200, unit: 'strips', critical: false },
  { name: 'Oxytocin Injection', current: 8, threshold: 30, unit: 'vials', critical: true },
  { name: 'ORS Sachets', current: 45, threshold: 100, unit: 'packs', critical: false },
  { name: 'Paracetamol Syrup', current: 12, threshold: 50, unit: 'bottles', critical: true },
]

const followUpBoard = [
  { name: 'Meena Jadhav', condition: 'High-risk pregnancy', due: 'Overdue 2 days', status: 'overdue' as const, asha: 'Kavita S.' },
  { name: 'Ramkumar Singh', condition: 'T2 Diabetes', due: 'Due today', status: 'due' as const, asha: 'Priya M.' },
  { name: 'Anita Pawar', condition: 'TB treatment (wk 8)', due: 'Due tomorrow', status: 'upcoming' as const, asha: 'Sunita D.' },
  { name: 'Ganesh Wagh', condition: 'Post-surgery follow-up', due: 'Overdue 5 days', status: 'overdue' as const, asha: 'Rekha K.' },
]

const followUpColors: Record<string, string> = {
  overdue: 'bg-red-50 border-red-200 text-red-700',
  due: 'bg-amber-50 border-amber-200 text-amber-700',
  upcoming: 'bg-teal-50 border-teal-200 text-teal-700',
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#D3D1C7] rounded-xl p-3 shadow-card text-xs">
      <p className="font-medium text-[#2C2C2A] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export function AdminOverview() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.overview()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const footfallData = data?.footfallData || []
  const referralFlow = data?.referralDistribution || []
  const stockAlerts  = data?.stockAlerts || []
  const followUpBoard = data?.followUpBoard || []

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-teal-400" size={32} /></div>

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Facility Overview</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">PHC Beed, Maharashtra · Week of 18–24 Aug 2026</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input-field text-xs py-2 px-3 w-auto"
            aria-label="Select time range"
          >
            <option>This week</option>
            <option>This month</option>
            <option>Last 3 months</option>
          </select>
          <button className="btn-primary text-xs py-2 px-4">
            Export report
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <section aria-label="Key performance indicators">
        <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="stat-card"
            >
              <dt className="flex items-center gap-1.5 text-xs text-[#5F5E5A] mb-1">
                <span className={`${kpi.color}`} aria-hidden="true">{kpi.icon}</span>
                {kpi.label}
              </dt>
              <dd className="text-xl font-semibold text-[#2C2C2A] tabular-nums">{kpi.value}</dd>
              <p className={`text-xs flex items-center gap-0.5 ${kpi.up ? 'text-green-600' : 'text-coral-500'}`}>
                {kpi.up ? <ArrowUp size={10} aria-hidden="true" /> : <ArrowDown size={10} aria-hidden="true" />}
                {kpi.change}
              </p>
            </motion.div>
          ))}
        </dl>
      </section>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Footfall chart */}
        <section className="card p-5 lg:col-span-2" aria-labelledby="footfall-heading">
          <h2 id="footfall-heading" className="section-header">Patient Footfall & Referrals</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={footfallData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0F6E56" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D85A30" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D85A30" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5F5E5A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5F5E5A' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="patients" name="Patients" stroke="#0F6E56" strokeWidth={2} fill="url(#patGrad)" dot={false} />
                <Area type="monotone" dataKey="referrals" name="Referrals" stroke="#D85A30" strokeWidth={2} fill="url(#refGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Accessibility table alternative */}
          <details className="mt-2">
            <summary className="text-xs text-[#5F5E5A] cursor-pointer hover:text-teal-500">View as table</summary>
            <table className="mt-2 w-full text-xs border-collapse" aria-label="Footfall data table">
              <thead>
                <tr className="border-b border-[#D3D1C7]">
                  <th className="text-left py-1 font-medium text-[#5F5E5A]">Day</th>
                  <th className="text-right py-1 font-medium text-[#5F5E5A]">Patients</th>
                  <th className="text-right py-1 font-medium text-[#5F5E5A]">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {footfallData.map(d => (
                  <tr key={d.day} className="border-b border-[#D3D1C7]/50">
                    <td className="py-1 text-[#2C2C2A]">{d.day}</td>
                    <td className="py-1 text-right tabular-nums text-[#2C2C2A]">{d.patients}</td>
                    <td className="py-1 text-right tabular-nums text-[#2C2C2A]">{d.referrals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        {/* Referral distribution */}
        <section className="card p-5" aria-labelledby="referral-dist-heading">
          <h2 id="referral-dist-heading" className="section-header">Referral Distribution</h2>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={referralFlow}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  aria-label="Referral distribution pie chart"
                >
                  {referralFlow.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {referralFlow.map(f => (
              <div key={f.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} aria-hidden="true" />
                  <span className="text-[#5F5E5A]">{f.name}</span>
                </div>
                <span className="font-semibold text-[#2C2C2A] tabular-nums">{f.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Stock alerts + Follow-up board */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Medicine stock alerts */}
        <section className="card p-5" aria-labelledby="stock-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="stock-heading" className="section-header mb-0">Medicine Stock Alerts</h2>
            <button className="text-sm text-teal-500 hover:text-teal-600">Manage inventory</button>
          </div>
          <div className="space-y-3">
            {stockAlerts.map(item => {
              const pct = Math.round((item.current / item.threshold) * 100)
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2C2C2A]">{item.name}</span>
                    <span className={`tabular-nums ${item.critical ? 'text-red-600 font-semibold' : 'text-amber-600'}`}>
                      {item.current} / {item.threshold} {item.unit}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={item.current}
                    aria-valuemin={0}
                    aria-valuemax={item.threshold}
                    aria-label={`${item.name}: ${item.current} of ${item.threshold} ${item.unit}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${item.critical ? 'bg-red-500' : 'bg-amber-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <button className="btn-coral text-xs py-2 px-4 mt-4 w-full justify-center">
            <Package size={14} aria-hidden="true" /> Initiate reorder
          </button>
        </section>

        {/* High-risk follow-up board */}
        <section className="card p-5" aria-labelledby="followup-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="followup-heading" className="section-header mb-0 flex items-center gap-2">
              High-risk Follow-ups
              <span className="badge-red text-[10px]">5 overdue</span>
            </h2>
            <button className="text-sm text-teal-500 hover:text-teal-600">Full board</button>
          </div>
          <div className="space-y-2">
            {followUpBoard.map(p => (
              <div
                key={p.name}
                className={`flex items-center gap-3 p-3 rounded-xl border ${followUpColors[p.status]}`}
              >
                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-xs font-semibold flex-shrink-0" aria-hidden="true">
                  {p.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs opacity-80">{p.condition}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold">{p.due}</p>
                  <p className="text-[10px] opacity-70">ASHA: {p.asha}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Referral network map placeholder */}
      <section className="card p-5" aria-labelledby="map-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="map-heading" className="section-header mb-0 flex items-center gap-2">
            <Map size={16} className="text-indigo-500" aria-hidden="true" />
            Referral Network — Beed District
          </h2>
          <button className="text-sm text-teal-500 hover:text-teal-600">Full map view</button>
        </div>
        {/* Network visualization */}
        <div className="relative bg-gradient-to-br from-teal-50/50 to-indigo-50/50 rounded-xl p-6 h-52 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 400 200" aria-label="Referral network diagram" role="img">
              {/* Connection lines */}
              <line x1="60" y1="100" x2="160" y2="100" stroke="#5DCAA5" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="160" y1="100" x2="260" y2="100" stroke="#0F6E56" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="260" y1="100" x2="350" y2="100" stroke="#3C3489" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="60" y1="100" x2="160" y2="50" stroke="#5DCAA5" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
              <line x1="60" y1="100" x2="160" y2="150" stroke="#5DCAA5" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
              {/* Nodes */}
              {[
                { cx: 60, cy: 100, r: 20, color: '#5DCAA5', label: 'Sub-centre', count: '8' },
                { cx: 160, cy: 100, r: 26, color: '#0F6E56', label: 'PHC', count: '3' },
                { cx: 260, cy: 100, r: 22, color: '#3C3489', label: 'Rural Hosp.', count: '2' },
                { cx: 350, cy: 100, r: 18, color: '#D85A30', label: 'District', count: '1' },
              ].map((node) => (
                <g key={node.label}>
                  <circle cx={node.cx} cy={node.cy} r={node.r} fill={node.color} opacity={0.9} />
                  <text x={node.cx} y={node.cy + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{node.count}</text>
                  <text x={node.cx} y={node.cy + node.r + 14} textAnchor="middle" fill="#5F5E5A" fontSize="10">{node.label}</text>
                </g>
              ))}
            </svg>
          </div>
          <div className="absolute bottom-2 left-3 text-[10px] text-[#5F5E5A]">
            <Activity size={10} className="inline mr-1" aria-hidden="true" />
            120 referrals this week · 94.2% completion
          </div>
        </div>
      </section>
    </div>
  )
}
