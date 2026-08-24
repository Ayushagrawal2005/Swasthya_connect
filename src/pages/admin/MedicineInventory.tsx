// Module 7 — Medicine Inventory (admin/facility view)
import { useState } from 'react'
import { AlertTriangle, Package, Search, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react'

interface StockItem {
  name: string
  category: string
  current: number
  threshold: number
  unit: string
  lastRestocked: string
  critical: boolean
}

const inventory: StockItem[] = [
  { name: 'Iron + Folic Acid Tab', category: 'Maternal', current: 120, threshold: 200, unit: 'strips', lastRestocked: '15 Aug', critical: false },
  { name: 'Oxytocin Injection', category: 'Maternal', current: 8, threshold: 30, unit: 'vials', lastRestocked: '10 Aug', critical: true },
  { name: 'ORS Sachets', category: 'General', current: 45, threshold: 100, unit: 'packs', lastRestocked: '12 Aug', critical: false },
  { name: 'Paracetamol Syrup', category: 'Paediatric', current: 12, threshold: 50, unit: 'bottles', lastRestocked: '8 Aug', critical: true },
  { name: 'Metformin 500mg', category: 'Chronic', current: 320, threshold: 150, unit: 'tabs', lastRestocked: '20 Aug', critical: false },
  { name: 'Amlodipine 5mg', category: 'Chronic', current: 180, threshold: 100, unit: 'tabs', lastRestocked: '18 Aug', critical: false },
  { name: 'Albendazole 400mg', category: 'General', current: 15, threshold: 80, unit: 'tabs', lastRestocked: '5 Aug', critical: true },
  { name: 'Calcium Carbonate Tab', category: 'Maternal', current: 95, threshold: 120, unit: 'strips', lastRestocked: '17 Aug', critical: false },
]

export function MedicineInventoryPage() {
  const [query, setQuery] = useState('')
  const [reorderSent, setReorderSent] = useState<Set<string>>(new Set())

  const filtered = inventory.filter(i =>
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    i.category.toLowerCase().includes(query.toLowerCase())
  )

  const criticalCount = inventory.filter(i => i.critical).length
  const lowCount = inventory.filter(i => !i.critical && i.current < i.threshold).length

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Medicine inventory</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">PHC Beed · {inventory.length} medicines tracked</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {criticalCount > 0 && (
            <span className="badge-red">{criticalCount} critical</span>
          )}
          {lowCount > 0 && (
            <span className="badge-amber">{lowCount} low stock</span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A]" aria-hidden="true" />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search medicines…" className="input-field pl-9 text-sm" aria-label="Search medicines" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Medicine stock table">
            <thead>
              <tr className="border-b border-[#D3D1C7] bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Medicine</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Category</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Stock</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide hidden sm:table-cell">Level</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const pct = Math.min(100, Math.round((item.current / item.threshold) * 100))
                const status = item.current >= item.threshold ? 'ok' : item.critical ? 'critical' : 'low'
                const ordered = reorderSent.has(item.name)
                return (
                  <tr key={item.name} className={`border-b border-[#D3D1C7]/60 hover:bg-gray-50 transition-colors ${item.critical && !ordered ? 'bg-red-50/30' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package size={14} className={item.critical ? 'text-red-500' : 'text-teal-500'} aria-hidden="true" />
                        <span className="font-medium text-[#2C2C2A]">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5F5E5A] text-xs">{item.category}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span className={`font-semibold ${status === 'critical' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-green-600'}`}>
                        {item.current}
                      </span>
                      <span className="text-[#5F5E5A] text-xs"> / {item.threshold} {item.unit}</span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="w-24">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"
                          role="progressbar" aria-valuenow={item.current} aria-valuemin={0} aria-valuemax={item.threshold}
                          aria-label={`${item.name}: ${pct}% of threshold`}>
                          <div className={`h-full rounded-full ${status === 'critical' ? 'bg-red-500' : status === 'low' ? 'bg-amber-400' : 'bg-teal-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-[#5F5E5A] mt-0.5 tabular-nums">{pct}%</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {status === 'critical' ? <span className="badge-red text-[10px]"><AlertTriangle size={9} /> Critical</span>
                        : status === 'low' ? <span className="badge-amber text-[10px]"><ArrowDown size={9} /> Low</span>
                        : <span className="badge-green text-[10px]"><ArrowUp size={9} /> OK</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setReorderSent(p => new Set([...p, item.name]))}
                        disabled={ordered || status === 'ok'}
                        className={`text-[10px] font-medium px-2.5 py-1.5 rounded-full border transition-all
                          ${ordered ? 'bg-green-50 text-green-600 border-green-200 cursor-default'
                            : status === 'ok' ? 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-200 text-[#5F5E5A]'
                            : 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100 cursor-pointer'}`}
                        aria-label={`Reorder ${item.name}`}
                      >
                        {ordered ? <><CheckCircle size={9} className="inline mr-0.5" />Ordered</> : 'Reorder'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <button className="btn-coral text-sm py-2.5 px-5">
        <Package size={15} aria-hidden="true" /> Bulk reorder all critical items
      </button>
    </div>
  )
}
