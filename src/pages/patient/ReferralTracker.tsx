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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">My Referrals</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Track the status of referrals made by your doctor</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-400" /></div>
      ) : referrals.length === 0 ? (
        <p className="text-sm text-center text-[#5F5E5A] py-8">No referrals found.</p>
      ) : (
        <div className="space-y-4">
          {referrals.map((ref, i) => {
            const stepIdx = stepKeys.indexOf(ref.status === 'accepted' ? 'pending' : ref.status)
            return (
              <div key={ref.id} className={`card p-5 space-y-4 ${ref.urgency === 'emergency' ? 'border-l-4 border-l-red-500' : ref.urgency === 'urgent' ? 'border-l-4 border-l-amber-400' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm text-[#2C2C2A]">{ref.toFacilityName}</p>
                      <span className={`${urgencyBadge[ref.urgency]} text-[10px]`}>{ref.urgency}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                      <MapPin size={11} className="text-teal-500" /> Sub-centre
                      <ArrowRight size={11} /> {ref.toFacilityName}
                    </div>
                  </div>
                  <p className="text-xs text-[#5F5E5A]">{new Date(ref.createdAt).toLocaleDateString('en-IN')}</p>
                </div>

                <p className="text-sm text-[#5F5E5A] leading-relaxed">{ref.reason}</p>

                {/* Progress stepper */}
                <div className="flex items-center gap-0">
                  {['Referred', 'Reached', 'Treated'].map((label, si) => {
                    const done = si <= stepIdx
                    return (
                      <div key={label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          {done
                            ? <CheckCircle size={18} className="text-teal-500" />
                            : <Circle size={18} className="text-[#D3D1C7]" />
                          }
                          <span className={`text-[10px] font-medium ${done ? 'text-teal-600' : 'text-[#5F5E5A]'}`}>{label}</span>
                        </div>
                        {si < 2 && <div className={`flex-1 h-0.5 mb-4 mx-1 ${si < stepIdx ? 'bg-teal-400' : 'bg-[#D3D1C7]'}`} />}
                      </div>
                    )
                  })}
                </div>

                {ref.status === 'pending' && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Clock size={12} /> Waiting for confirmation from {ref.toFacilityName}
                  </div>
                )}
                {ref.urgency === 'emergency' && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} /> Emergency referral — please travel to the facility immediately
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
