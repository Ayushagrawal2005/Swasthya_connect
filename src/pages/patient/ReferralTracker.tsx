import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Clock, MapPin, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react'
import { patientsApi, type Referral } from '../../services/api'
import { useApp } from '../../context/AppContext'

const urgencyBadge: Record<string, string> = { routine: 'badge-teal', urgent: 'badge-amber', emergency: 'badge-red' }
const stepKeys = ['pending', 'reached', 'treated']

export function ReferralTrackerPage() {
  const { patientId } = useApp()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pid = patientId || 'P-PRIYA-002'
    patientsApi.getReferrals(pid)
      .then(setReferrals)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <ArrowRight className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Referrals</h1>
              <p className="text-blue-100 mt-1">
                Track the status of referrals made by your doctor
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
      ) : referrals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowRight size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No referrals found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((ref, i) => {
            const stepIdx = stepKeys.indexOf(ref.status === 'accepted' ? 'pending' : ref.status)
            return (
              <div key={ref.id} className={`bg-white rounded-2xl shadow-xl p-6 space-y-4 border hover:shadow-2xl transition-all duration-200 ${ref.urgency === 'emergency' ? 'border-l-4 border-l-red-500' : ref.urgency === 'urgent' ? 'border-l-4 border-l-amber-400' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <p className="font-bold text-base text-[#123B6D]">{ref.toFacilityName}</p>
                      <span className={`${urgencyBadge[ref.urgency]} text-xs px-2.5 py-1 rounded-full font-semibold`}>{ref.urgency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="text-[#E85D04]" />
                      <span>Sub-centre</span>
                      <ArrowRight size={14} />
                      <span>{ref.toFacilityName}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{new Date(ref.createdAt).toLocaleDateString('en-IN')}</p>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">{ref.reason}</p>

                {/* Progress stepper */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-0">
                    {['Referred', 'Reached', 'Treated'].map((label, si) => {
                      const done = si <= stepIdx
                      return (
                        <div key={label} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center gap-2">
                            {done
                              ? <CheckCircle size={24} className="text-green-500" />
                              : <Circle size={24} className="text-gray-300" />
                            }
                            <span className={`text-xs font-semibold ${done ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
                          </div>
                          {si < 2 && <div className={`flex-1 h-1 mb-6 mx-2 rounded-full ${si < stepIdx ? 'bg-green-500' : 'bg-gray-300'}`} />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {ref.status === 'pending' && (
                  <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3">
                    <Clock size={18} className="flex-shrink-0" />
                    <span className="font-semibold">Waiting for confirmation from {ref.toFacilityName}</span>
                  </div>
                )}
                {ref.urgency === 'emergency' && (
                  <div className="flex items-center gap-3 text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <span className="font-semibold">Emergency referral — please travel to the facility immediately</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
