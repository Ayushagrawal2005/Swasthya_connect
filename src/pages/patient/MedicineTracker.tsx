import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle, Pill, Loader2 } from 'lucide-react'
import { patientsApi, type MedicationEntry } from '../../services/api'
import { useApp } from '../../context/AppContext'

export function MedicineTrackerPage() {
  const { patientId } = useApp()
  const [medicines, setMedicines] = useState<MedicationEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pid = patientId || 'P-PRIYA-002'
    patientsApi.getMedicines(pid)
      .then(setMedicines)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  const statusIcon: Record<string, React.ReactNode> = {
    current:      <CheckCircle size={15} className="text-green-500" />,
    discontinued: <XCircle size={15} className="text-red-400" />,
    completed:    <CheckCircle size={15} className="text-gray-400" />,
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">My Medicines</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Current prescriptions and availability status</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>
      ) : medicines.length === 0 ? (
        <p className="text-sm text-center text-[#5F5E5A] py-8">No medicines found.</p>
      ) : (
        <div className="space-y-3">
          {medicines.map((med, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Pill size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2C2C2A] text-sm">{med.drug}</p>
                    <p className="text-xs text-[#5F5E5A] mt-0.5">{med.dose} · {med.frequency}</p>
                    <p className="text-xs text-[#5F5E5A]">Since {med.since} · {med.prescribedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {statusIcon[med.status] ?? <Clock size={15} className="text-amber-500" />}
                  <span className="text-xs font-medium capitalize text-[#5F5E5A]">{med.status}</span>
                </div>
              </div>
              {med.status === 'current' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                  <CheckCircle size={12} /> Available at PHC Beed — pick up at your next visit
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 bg-amber-50 border-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">Always take medicines as prescribed. Do not stop without consulting your doctor.</p>
        </div>
      </div>
    </div>
  )
}
