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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Medicines</h1>
              <p className="text-blue-100 mt-1">
                Current prescriptions and availability status
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#123B6D] w-12 h-12" />
        </div>
      ) : medicines.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Pill size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No medicines found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {medicines.map((med, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Pill size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-[#123B6D]">{med.drug}</p>
                    <p className="text-sm text-gray-600 mt-1">{med.dose} · {med.frequency}</p>
                    <p className="text-sm text-gray-500 mt-1">Since {med.since} · {med.prescribedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 bg-gray-50 rounded-lg">
                  {statusIcon[med.status] ?? <Clock size={16} className="text-amber-500" />}
                  <span className="text-sm font-semibold capitalize text-[#123B6D]">{med.status}</span>
                </div>
              </div>
              {med.status === 'current' && (
                <div className="mt-4 flex items-center gap-3 text-sm text-green-700 bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle size={18} className="flex-shrink-0" />
                  <span className="font-semibold">Available at PHC Beed — pick up at your next visit</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            Always take medicines as prescribed. Do not stop without consulting your doctor.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
