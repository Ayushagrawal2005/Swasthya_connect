// Admin — Staff management: doctors grouped by hospital
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ChevronDown, ChevronRight, CheckCircle, XCircle, Phone, Stethoscope, Building2 } from 'lucide-react'
import { facilities, tierLabel, tierColor } from '../../data/facilityData'

export function StaffManagementPage() {
  const [expanded, setExpanded] = useState<string | null>('PHC001')
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all')

  const totalDoctors   = facilities.flatMap(f => f.doctors).length
  const available      = facilities.flatMap(f => f.doctors).filter(d => d.available).length
  const unavailable    = totalDoctors - available

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Staff & Doctors</h1>
          <p className="text-sm text-[#5F5E5A] mt-0.5">Doctors grouped by hospital · Beed District</p>
        </div>
        <div className="flex gap-2">
          <span className="badge-green">{available} available</span>
          <span className="badge-red">{unavailable} unavailable</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2" role="group" aria-label="Filter doctors">
        {(['all', 'available', 'unavailable'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize
              ${filter === f ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#5F5E5A] border-[#D3D1C7] hover:border-teal-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {facilities.filter(f => f.tier !== 'sub-centre').map(f => (
          <div key={f.id} className="stat-card">
            <dt className="text-xs text-[#5F5E5A] flex items-center gap-1.5 mb-1">
              <Building2 size={13} className="text-teal-500" aria-hidden="true" />
              <span className="truncate">{f.name}</span>
            </dt>
            <dd className="text-2xl font-semibold text-[#2C2C2A] tabular-nums">{f.doctors.filter(d => d.available).length}<span className="text-sm text-[#5F5E5A] font-normal">/{f.doctors.length}</span></dd>
            <p className="text-xs text-[#5F5E5A]">doctors available</p>
          </div>
        ))}
      </dl>

      {/* Grouped by hospital */}
      <div className="space-y-4">
        {facilities.filter(f => f.tier !== 'sub-centre').map((f, fi) => {
          const isOpen = expanded === f.id
          const filteredDoctors = f.doctors.filter(d =>
            filter === 'all' ? true : filter === 'available' ? d.available : !d.available
          )
          return (
            <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: fi * 0.08 }} className="card overflow-hidden">
              {/* Hospital header */}
              <button onClick={() => setExpanded(isOpen ? null : f.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                aria-expanded={isOpen} aria-controls={`staff-${f.id}`}>
                <div className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border ${tierColor[f.tier]}`}>
                  {tierLabel[f.tier]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2C2C2A]">{f.name}</p>
                  <p className="text-xs text-[#5F5E5A] mt-0.5">{f.address} · {f.phone}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-3">
                  <p className="text-sm font-semibold text-teal-600 tabular-nums">
                    {f.doctors.filter(d => d.available).length}/{f.doctors.length}
                  </p>
                  <p className="text-[10px] text-[#5F5E5A]">available</p>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-[#5F5E5A] flex-shrink-0" /> : <ChevronRight size={16} className="text-[#5F5E5A] flex-shrink-0" />}
              </button>

              {/* Doctors list */}
              {isOpen && (
                <div id={`staff-${f.id}`} className="border-t border-[#D3D1C7]">
                  {filteredDoctors.length === 0 ? (
                    <p className="text-xs text-[#5F5E5A] text-center py-5">No doctors match this filter.</p>
                  ) : (
                    <table className="w-full text-sm" aria-label={`Doctors at ${f.name}`}>
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#D3D1C7]">
                          <th className="text-left py-2.5 px-5 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Doctor</th>
                          <th className="text-left py-2.5 px-5 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Specialty</th>
                          <th className="text-center py-2.5 px-5 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Slots today</th>
                          <th className="text-center py-2.5 px-5 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Status</th>
                          <th className="py-2.5 px-5 text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctors.map((d, i) => (
                          <tr key={d.id} className={`border-b border-[#D3D1C7]/50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-semibold text-indigo-600 flex-shrink-0">
                                  {d.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                                </div>
                                <span className="font-medium text-[#2C2C2A]">{d.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-5 text-[#5F5E5A]">
                              <div className="flex items-center gap-1.5">
                                <Stethoscope size={12} className="text-teal-500" aria-hidden="true" />
                                {d.specialty}
                              </div>
                            </td>
                            <td className="py-3 px-5 text-center tabular-nums font-medium text-[#2C2C2A]">
                              {d.slotsToday > 0 ? d.slotsToday : '—'}
                            </td>
                            <td className="py-3 px-5 text-center">
                              {d.available
                                ? <span className="badge-green text-[10px] inline-flex items-center gap-1"><CheckCircle size={10} /> On duty</span>
                                : <span className="badge-red text-[10px] inline-flex items-center gap-1"><XCircle size={10} /> Off duty</span>}
                            </td>
                            <td className="py-3 px-5">
                              <a href={`tel:${f.phone}`}
                                className="flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-700 transition-colors"
                                aria-label={`Call ${f.name}`}>
                                <Phone size={11} /> {f.phone}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
