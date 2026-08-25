import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, AlertTriangle, Package, CheckCircle, Activity, ArrowUp, ArrowDown, Clock, Loader2, RefreshCw, ArrowRight } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { adminApi, referralsApi, followupsApi, inventoryApi, type AdminOverview, type Referral, type FollowUp, type StockItem } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const statusColors: Record<string, string> = { overdue: 'bg-red-50 border-red-200 text-red-700', due: 'bg-amber-50 border-amber-200 text-amber-700', upcoming: 'bg-green-50 border-green-200 text-green-700' }
const urgencyBadge: Record<string, string>  = { routine: 'badge-teal', urgent: 'badge-amber', emergency: 'badge-red' }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#D3D1C7] rounded-xl p-3 shadow-lg text-xs">
      <p className="font-medium text-[#2C2C2A] mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  )
}

export function AdminOverview() {
  const navigate = useNavigate()
  const [overview, setOverview]   = useState<AdminOverview | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [followups, setFollowups] = useState<FollowUp[]>([])
  const [stock, setStock]         = useState<StockItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(() => {
    return Promise.all([
      adminApi.overview().catch(() => null),
      referralsApi.list().catch(() => [] as Referral[]),
      followupsApi.list().catch(() => [] as FollowUp[]),
      inventoryApi.list().catch(() => [] as StockItem[]),
    ]).then(([ov, refs, fups, inv]) => {
      if (ov) setOverview(ov)
      setReferrals(refs as Referral[])
      setFollowups(fups as FollowUp[])
      setStock(inv as StockItem[])
      setLastUpdated(new Date())
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  const today = new Date().toISOString().split('T')[0]
  const pendingRefs  = referrals.filter(r => r.status === 'pending')
  const overdueFollowups = followups.filter(f => f.status !== 'completed' && f.dueDate <= today)
  const criticalStock = stock.filter(s => s.critical || s.current <= s.threshold * 0.4)

  const kpis = [
    { label: 'Total patients',     value: (overview?.kpis?.find(k => k.label === 'Total patients')?.value)    ?? '—', change: 'All time',                         up: true,  icon: <Users size={18} />,         color: 'text-[#FF9933]', bg: 'bg-orange-50' },
    { label: 'Today\'s visits',    value: (overview?.kpis?.find(k => k.label === "Today's visits")?.value)    ?? '—', change: 'Today',                            up: true,  icon: <Activity size={18} />,      color: 'text-[#138808]', bg: 'bg-green-50' },
    { label: 'Pending referrals',  value: pendingRefs.length,                change: `${pendingRefs.length} need review`, up: false, icon: <ArrowRight size={18} />,    color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue follow-ups', value: overdueFollowups.length,           change: `${overdueFollowups.length} overdue`,up: false, icon: <Clock size={18} />,         color: 'text-red-500',   bg: 'bg-red-50' },
    { label: 'Stock alerts',       value: criticalStock.length,              change: 'Low stock items',                  up: false, icon: <Package size={18} />,       color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total referrals',    value: referrals.length,                  change: 'All time',                         up: true,  icon: <TrendingUp size={18} />,    color: 'text-[#000080]', bg: 'bg-indigo-50' },
  ]

  const footfallData = overview?.footfallData || [
    { day: 'Mon', patients: 142, referrals: 12 }, { day: 'Tue', patients: 168, referrals: 18 },
    { day: 'Wed', patients: 155, referrals: 14 }, { day: 'Thu', patients: 192, referrals: 22 },
    { day: 'Fri', patients: 177, referrals: 19 }, { day: 'Sat', patients: 213, referrals: 27 },
    { day: 'Sun', patients: 89,  referrals: 8 },
  ]
  const referralDist = overview?.referralDistribution || [
    { name: 'Sub-centre', value: 38, color: '#FF9933' },
    { name: 'PHC',        value: 45, color: '#138808' },
    { name: 'Rural Hosp', value: 12, color: '#000080' },
    { name: 'District',   value: 5,  color: '#D85A30' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Facility Overview</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">PHC Beed, Maharashtra</p>
          {lastUpdated && (
            <p className="text-[10px] text-[#9E9C94] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Live · updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button onClick={() => { setLoading(true); fetchAll() }}
          className="p-2 rounded-lg text-[#5F5E5A] hover:text-[#FF9933] hover:bg-orange-50 transition-colors" title="Refresh">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPIs */}
      <section>
        <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
              <dt className="flex items-center gap-1.5 text-xs text-[#5F5E5A] mb-1">
                <span className={k.color}>{k.icon}</span>{k.label}
              </dt>
              <dd className="text-xl font-semibold text-[#2C2C2A] tabular-nums">
                {loading ? <Loader2 size={16} className="animate-spin text-[#FF9933] mt-1" /> : k.value}
              </dd>
              <p className={`text-xs flex items-center gap-0.5 ${k.up ? 'text-green-600' : 'text-red-500'}`}>
                {k.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{k.change}
              </p>
            </motion.div>
          ))}
        </dl>
      </section>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="section-header">Patient Footfall & Referrals (This Week)</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={footfallData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9933" stopOpacity={0.2} /><stop offset="95%" stopColor="#FF9933" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#138808" stopOpacity={0.2} /><stop offset="95%" stopColor="#138808" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5F5E5A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5F5E5A' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="patients"  name="Patients"  stroke="#FF9933" strokeWidth={2} fill="url(#patGrad)" dot={false} />
                <Area type="monotone" dataKey="referrals" name="Referrals" stroke="#138808" strokeWidth={2} fill="url(#refGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-header">Referral Distribution</h2>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={referralDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {referralDist.map((e: any, idx: number) => <Cell key={idx} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {referralDist.map((f: any) => (
              <div key={f.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                  <span className="text-[#5F5E5A]">{f.name}</span>
                </div>
                <span className="font-semibold text-[#2C2C2A]">{f.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Referrals + stock + followups */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Pending referrals */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header mb-0 flex items-center gap-2">
              Pending Referrals
              {pendingRefs.length > 0 && <span className="badge-amber text-[10px]">{pendingRefs.length}</span>}
            </h2>
            <button onClick={() => navigate('/admin')} className="text-xs text-[#FF9933] hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {loading ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#FF9933]" /></div>
            : pendingRefs.length === 0 ? <p className="text-xs text-[#5F5E5A] text-center py-4">No pending referrals.</p>
            : pendingRefs.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                <span className={`${urgencyBadge[r.urgency] || 'badge-teal'} text-[10px] flex-shrink-0 mt-0.5`}>{r.urgency}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#2C2C2A] truncate">{r.patientName}</p>
                  <p className="text-[10px] text-[#5F5E5A] truncate">{r.toFacilityName}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Medicine stock */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header mb-0 flex items-center gap-2">
              Stock Alerts
              {criticalStock.length > 0 && <span className="badge-red text-[10px]">{criticalStock.length}</span>}
            </h2>
            <button onClick={() => navigate('/admin/inventory')} className="text-xs text-[#FF9933] hover:underline">Manage</button>
          </div>
          <div className="space-y-3">
            {loading ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#FF9933]" /></div>
            : criticalStock.length === 0 ? <p className="text-xs text-[#5F5E5A] text-center py-4">All stock levels OK.</p>
            : criticalStock.slice(0, 4).map(item => {
              const pct = Math.min(100, Math.round((item.current / item.threshold) * 100))
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2C2C2A] truncate flex-1 mr-2">{item.name}</span>
                    <span className={`tabular-nums ${item.critical ? 'text-red-600 font-semibold' : 'text-amber-600'}`}>{item.current}/{item.threshold}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.critical ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Overdue follow-ups */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header mb-0 flex items-center gap-2">
              Overdue Follow-ups
              {overdueFollowups.length > 0 && <span className="badge-red text-[10px]">{overdueFollowups.length}</span>}
            </h2>
            <button className="text-xs text-[#FF9933] hover:underline">Full board</button>
          </div>
          <div className="space-y-2">
            {loading ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[#FF9933]" /></div>
            : overdueFollowups.length === 0 ? <p className="text-xs text-[#5F5E5A] text-center py-4">No overdue follow-ups.</p>
            : overdueFollowups.slice(0, 4).map(f => (
              <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-semibold text-red-700 flex-shrink-0">
                  {f.patientName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#2C2C2A] truncate">{f.patientName}</p>
                  <p className="text-[10px] text-[#5F5E5A] truncate">{f.condition} · Due {f.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
