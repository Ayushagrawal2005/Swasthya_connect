// Module 5 — Referral Management (patient view)
import { CheckCircle, Circle, Clock, MapPin, ArrowRight, AlertTriangle } from 'lucide-react'

type ReferralStatus = 'referred' | 'reached' | 'treated'

interface Referral {
  id: string
  from: string
  to: string
  reason: string
  urgency: 'routine' | 'urgent' | 'emergency'
  status: ReferralStatus
  date: string
  updatedAt: string
}

const referrals: Referral[] = [
  {
    id: 'REF001',
    from: 'PHC Beed',
    to: 'Rural Hospital Beed',
    reason: 'CBC showed low haemoglobin (11.2 g/dL) — specialist consult for iron-deficiency anaemia in pregnancy',
    urgency: 'urgent',
    status: 'reached',
    date: '20 Aug 2026',
    updatedAt: '22 Aug 2026',
  },
  {
    id: 'REF002',
    from: 'Sub-centre Mandav',
    to: 'PHC Beed',
    reason: 'Routine ANC — referral for OB/GYN assessment at 24 weeks',
    urgency: 'routine',
    status: 'treated',
    date: '1 Jul 2026',
    updatedAt: '3 Jul 2026',
  },
]

const steps: { key: ReferralStatus; label: string; desc: string }[] = [
  { key: 'referred', label: 'Referred', desc: 'Referral created and sent' },
  { key: 'reached', label: 'Reached facility', desc: 'Patient arrived at destination' },
  { key: 'treated', label: 'Treated', desc: 'Care completed, record updated' },
]

const urgencyBadge: Record<string, string> = {
  routine: 'badge-teal',
  urgent: 'badge-amber',
  emergency: 'badge-red',
}

const stepOrder = steps.map(s => s.key)

export function ReferralTrackerPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="text-xl font-semibold text-[#2C2C2A]">Referral tracker</h1>

      {referrals.map(ref => {
        const currentIdx = stepOrder.indexOf(ref.status)
        return (
          <article key={ref.id} className="card p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-[#5F5E5A]">#{ref.id}</span>
                  <span className={`${urgencyBadge[ref.urgency]} text-[10px] capitalize`}>{ref.urgency}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[#2C2C2A] font-medium flex-wrap">
                  <MapPin size={13} className="text-teal-500 flex-shrink-0" />
                  {ref.from}
                  <ArrowRight size={13} className="text-[#5F5E5A]" />
                  {ref.to}
                </div>
              </div>
              <span className="text-xs text-[#5F5E5A] flex-shrink-0">{ref.date}</span>
            </div>

            {/* Reason */}
            <p className="text-sm text-[#5F5E5A] leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
              {ref.reason}
            </p>

            {/* Status stepper */}
            <div role="list" aria-label="Referral status steps">
              <ol className="relative space-y-3">
                {steps.map((s, i) => {
                  const done = i <= currentIdx
                  const active = i === currentIdx
                  return (
                    <li key={s.key} className="flex items-start gap-3" role="listitem">
                      <div className="relative flex-shrink-0 mt-0.5">
                        {done ? (
                          <CheckCircle size={20} className="text-teal-500" aria-label="Completed" />
                        ) : (
                          <Circle size={20} className="text-[#D3D1C7]" aria-label="Pending" />
                        )}
                        {i < steps.length - 1 && (
                          <div className={`absolute left-[9px] top-6 w-0.5 h-4 ${done ? 'bg-teal-300' : 'bg-[#D3D1C7]'}`} aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${active ? 'text-teal-600' : done ? 'text-[#2C2C2A]' : 'text-[#5F5E5A]'}`}>
                          {s.label}
                          {active && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-teal-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 status-dot-live" aria-hidden="true" />
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[#5F5E5A]">{s.desc}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Emergency note */}
            {ref.urgency === 'emergency' && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle size={13} />
                Emergency escalation — higher-tier facility has been notified
              </div>
            )}

            <p className="text-[10px] text-[#5F5E5A] flex items-center gap-1">
              <Clock size={10} /> Last updated: {ref.updatedAt}
            </p>
          </article>
        )
      })}
    </div>
  )
}
