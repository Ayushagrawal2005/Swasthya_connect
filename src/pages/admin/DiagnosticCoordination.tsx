// Module 6 — Diagnostic Coordination (admin view)
import { useState } from 'react'
import { FlaskConical, AlertTriangle, CheckCircle, Clock, MapPin, Search } from 'lucide-react'

type DiagStatus = 'ordered' | 'sample-done' | 'result-ready' | 'reviewed' | 'not-available'

interface DiagOrder {
  id: string
  patient: string
  test: string
  orderedBy: string
  facility: string
  date: string
  status: DiagStatus
  available: boolean
  nearestAvailable?: string
  result?: string
  flagged?: boolean
}

const orders: DiagOrder[] = [
  { id: 'DX001', patient: 'Priya Sharma', test: 'CBC', orderedBy: 'Dr. Patil', facility: 'PHC Beed', date: '20 Aug', status: 'reviewed', available: true, result: 'Hb 11.2 g/dL — Low', flagged: true },
  { id: 'DX002', patient: 'Meena Jadhav', test: 'Urine Routine + Microscopy', orderedBy: 'Dr. Patil', facility: 'PHC Beed', date: '22 Aug', status: 'sample-done', available: true },
  { id: 'DX003', patient: 'Priya Sharma', test: 'Obstetric Ultrasound', orderedBy: 'Dr. Patil', facility: 'PHC Beed', date: '22 Aug', status: 'not-available', available: false, nearestAvailable: 'Rural Hospital Beed (8.1 km)' },
  { id: 'DX004', patient: 'Ramesh Jadhav', test: 'ECG', orderedBy: 'Dr. Patil', facility: 'PHC Beed', date: '19 Aug', status: 'result-ready', available: true, result: 'ST elevation in V1–V4 — Urgent review' , flagged: true },
  { id: 'DX005', patient: 'Lata Desai', test: 'HbA1c', orderedBy: 'Dr. More', facility: 'PHC Beed', date: '23 Aug', status: 'ordered', available: true },
  { id: 'DX006', patient: 'Ganesh Wagh', test: 'Sputum AFB', orderedBy: 'ASHA Kavita', facility: 'PHC Beed', date: '21 Aug', status: 'sample-done', available: true },
]

const statusStyle: Record<DiagStatus, string> = {
  ordered: 'badge-teal',
  'sample-done': 'badge-amber',
  'result-ready': 'badge-green',
  reviewed: 'badge-teal',
  'not-available': 'badge-red',
}

const statusLabel: Record<DiagStatus, string> = {
  ordered: 'Ordered',
  'sample-done': 'Sample done',
  'result-ready': 'Result ready',
  reviewed: 'Reviewed',
  'not-available': 'Not available',
}

const statusOrder: DiagStatus[] = ['ordered', 'sample-done', 'result-ready', 'reviewed']

export function DiagnosticCoordinationPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DiagStatus | 'all'>('all')

  const filtered = orders.filter(o =>
    (statusFilter === 'all' || o.status === statusFilter) &&
    (o.patient.toLowerCase().includes(query.toLowerCase()) || o.test.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Diagnostic coordination</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">{orders.filter(o => o.flagged).length} flagged results need review</p>
        </div>
        <span className="badge-red">
          <AlertTriangle size={11} />
          {orders.filter(o => o.status === 'not-available').length} tests unavailable here
        </span>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A]" aria-hidden="true" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search patient or test…" className="input-field pl-9 py-2 text-sm" />
        </div>
        <div className="flex gap-1 flex-wrap" role="group" aria-label="Filter by status">
          {(['all', ...statusOrder, 'not-available'] as const).map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all capitalize
                ${statusFilter === s ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#5F5E5A] border-[#D3D1C7] hover:border-teal-300'}`}
              aria-pressed={statusFilter === s}>
              {s === 'all' ? 'All' : statusLabel[s as DiagStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3" role="list">
        {filtered.map(order => (
          <article key={order.id} role="listitem"
            className={`card p-4 ${order.flagged ? 'border-l-4 border-l-amber-400' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                ${order.status === 'not-available' ? 'bg-red-50' : 'bg-indigo-50'}`}>
                <FlaskConical size={16} className={order.status === 'not-available' ? 'text-red-500' : 'text-indigo-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-0.5">
                  <p className="font-semibold text-sm text-[#2C2C2A]">{order.test}</p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {order.flagged && <AlertTriangle size={14} className="text-amber-500" aria-label="Flagged" />}
                    <span className={`${statusStyle[order.status]} text-[10px]`}>{statusLabel[order.status]}</span>
                  </div>
                </div>
                <p className="text-xs text-[#5F5E5A]">{order.patient} · {order.orderedBy} · {order.date}</p>

                {order.result && (
                  <p className={`text-xs mt-1.5 font-medium ${order.flagged ? 'text-amber-700' : 'text-teal-700'}`}>
                    Result: {order.result}
                  </p>
                )}

                {order.status === 'not-available' && order.nearestAvailable && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                    <MapPin size={11} /> Not available at PHC Beed. Nearest: <strong>{order.nearestAvailable}</strong>
                  </div>
                )}

                {/* Mini progress */}
                {order.available && order.status !== 'not-available' && (
                  <div className="flex items-center gap-1 mt-2">
                    {statusOrder.map((s, i) => {
                      const done = statusOrder.indexOf(order.status) >= i
                      return (
                        <div key={s} className="flex items-center gap-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-teal-500' : 'bg-gray-100'}`}>
                            {done ? <CheckCircle size={11} className="text-white" /> : <Clock size={9} className="text-gray-400" />}
                          </div>
                          {i < statusOrder.length - 1 && <div className={`w-4 h-0.5 ${done ? 'bg-teal-300' : 'bg-gray-200'}`} />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-center text-[#5F5E5A] py-8">No diagnostics match your filter.</p>
        )}
      </div>
    </div>
  )
}
