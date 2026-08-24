// Module 7 — Medicine Availability (patient view)
import { CheckCircle, XCircle, Clock, AlertTriangle, Pill, MapPin } from 'lucide-react'

interface Medicine {
  name: string
  dose: string
  frequency: string
  duration: string
  inStock: boolean
  facility: string
  nextDue: string
  daysLeft: number
}

const medicines: Medicine[] = [
  {
    name: 'Iron + Folic Acid Tablet',
    dose: '1 tab',
    frequency: 'Once daily after food',
    duration: '90 days',
    inStock: true,
    facility: 'PHC Beed',
    nextDue: 'Tonight, 8:00 PM',
    daysLeft: 62,
  },
  {
    name: 'Calcium Tablet',
    dose: '1 tab',
    frequency: 'Once at night',
    duration: '60 days',
    inStock: true,
    facility: 'PHC Beed',
    nextDue: 'Tonight, 10:00 PM',
    daysLeft: 45,
  },
  {
    name: 'Albendazole Tablet',
    dose: '400 mg',
    frequency: 'Single dose (given)',
    duration: 'Single dose',
    inStock: false,
    facility: 'Sub-centre Mandav',
    nextDue: '—',
    daysLeft: 0,
  },
]

export function MedicineTrackerPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="text-xl font-semibold text-[#2C2C2A]">My medicines</h1>

      {/* Low stock alert */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Refill due in 7 days</p>
          <p className="text-xs mt-0.5">Iron + Folic Acid has 62 days remaining — plan your next PHC visit by 30 Aug.</p>
        </div>
      </div>

      {/* Medicine cards */}
      <div className="space-y-3">
        {medicines.map(m => (
          <article key={m.name} className="card p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Pill size={18} className="text-green-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-[#2C2C2A]">{m.name}</p>
                  {m.inStock ? (
                    <span className="badge-green text-[10px] flex-shrink-0">
                      <CheckCircle size={10} /> In stock
                    </span>
                  ) : (
                    <span className="badge-red text-[10px] flex-shrink-0">
                      <XCircle size={10} /> Out of stock
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5F5E5A] mt-0.5">{m.dose} · {m.frequency}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-[#5F5E5A]">Next dose</p>
                <p className="font-medium text-[#2C2C2A] mt-0.5 flex items-center gap-1">
                  <Clock size={11} className="text-teal-500" /> {m.nextDue}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-[#5F5E5A]">Available at</p>
                <p className="font-medium text-[#2C2C2A] mt-0.5 flex items-center gap-1">
                  <MapPin size={11} className="text-teal-500" /> {m.facility}
                </p>
              </div>
            </div>

            {/* Stock indicator */}
            {m.daysLeft > 0 && (
              <div>
                <div className="flex justify-between text-[10px] text-[#5F5E5A] mb-1">
                  <span>Supply remaining</span>
                  <span className="tabular-nums font-medium text-[#2C2C2A]">{m.daysLeft} days</span>
                </div>
                <div
                  className="h-1.5 bg-gray-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={m.daysLeft}
                  aria-valuemin={0}
                  aria-valuemax={90}
                  aria-label={`${m.name} supply: ${m.daysLeft} days remaining`}
                >
                  <div
                    className={`h-full rounded-full ${m.daysLeft < 14 ? 'bg-amber-400' : 'bg-teal-500'}`}
                    style={{ width: `${Math.min(100, (m.daysLeft / 90) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {!m.inStock && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                Not available at {m.facility}. Nearest facility with stock: <strong>Rural Hospital Beed (8.1 km)</strong>.
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
