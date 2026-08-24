// Module 9 — Emergency Escalation
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Phone, ArrowRight, Clock, Siren } from 'lucide-react'

type EscalationStatus = 'idle' | 'sending' | 'sent' | 'acknowledged' | 'arrived'

const statusSteps = [
  { key: 'sent',         label: 'Escalation sent',           desc: 'Nearest higher facility notified' },
  { key: 'acknowledged', label: 'Acknowledged',              desc: 'Receiving facility confirmed readiness' },
  { key: 'arrived',      label: 'Patient in transit/arrived', desc: 'Transfer in progress' },
]

export function EmergencyEscalationPage() {
  const [status, setStatus] = useState<EscalationStatus>('idle')
  const [patientName, setPatientName] = useState('')
  const [reason, setReason] = useState('')
  const [destination, setDestination] = useState('Rural Hospital Beed')
  const [sentTime, setSentTime] = useState('')

  function triggerEscalation() {
    if (!patientName.trim() || !reason.trim()) return
    setStatus('sending')
    setTimeout(() => {
      setStatus('sent')
      setSentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    }, 1200)
    // Auto-advance steps for demo
    setTimeout(() => setStatus('acknowledged'), 4000)
  }

  const currentStepIdx = status === 'acknowledged' || status === 'arrived'
    ? statusSteps.findIndex(s => s.key === status)
    : status === 'sent' ? 0 : -1

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <Siren size={20} className="text-red-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Emergency escalation</h1>
          <p className="text-sm text-[#5F5E5A]">Immediately notifies the nearest higher-tier facility</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'sending' ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {/* Alert banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-300" role="alert">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Emergency escalation</p>
                <p className="text-xs text-red-700 mt-0.5">This will immediately alert the receiving facility and generate a priority referral with patient records attached.</p>
              </div>
            </div>

            <div>
              <label htmlFor="esc-patient" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Patient name / ID</label>
              <input id="esc-patient" type="text" value={patientName} onChange={e => setPatientName(e.target.value)}
                placeholder="e.g. Priya Sharma · ABHA 91-3412-5678" className="input-field" />
            </div>

            <div>
              <label htmlFor="esc-dest" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Send to (nearest higher tier)</label>
              <select id="esc-dest" value={destination} onChange={e => setDestination(e.target.value)} className="input-field">
                {['Rural Hospital Beed', 'District Hospital Beed', 'Medical College Aurangabad'].map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="esc-reason" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Emergency reason</label>
              <textarea id="esc-reason" rows={3} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Acute chest pain, BP 180/110, suspected MI — patient needs immediate cardiac care"
                className="input-field resize-none" />
            </div>

            <button
              onClick={triggerEscalation}
              disabled={status === 'sending' || !patientName.trim() || !reason.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-btn bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
              aria-label="Trigger emergency escalation"
            >
              {status === 'sending' ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  Sending escalation…
                </>
              ) : (
                <>
                  <AlertTriangle size={17} aria-hidden="true" />
                  Trigger emergency escalation
                </>
              )}
            </button>

            <a href="tel:104" className="flex items-center justify-center gap-2 w-full py-3 rounded-btn border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium">
              <Phone size={16} aria-hidden="true" /> Also call 104 — National Emergency Helpline
            </a>
          </motion.div>
        ) : (
          <motion.div key="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-5">
            {/* Sent confirmation */}
            <div className="card p-5 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle size={22} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#2C2C2A]">Escalation sent — {sentTime}</p>
                  <p className="text-xs text-[#5F5E5A]">{destination} has been notified</p>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#5F5E5A]">Patient</span>
                  <span className="font-medium text-[#2C2C2A]">{patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F5E5A]">Destination</span>
                  <span className="font-medium text-[#2C2C2A]">{destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F5E5A]">Priority</span>
                  <span className="badge-red text-[10px]">Emergency</span>
                </div>
              </div>
            </div>

            {/* Status stepper */}
            <div className="card p-5">
              <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-4">Escalation status</p>
              <ol className="space-y-4">
                {statusSteps.map((s, i) => {
                  const done = i <= currentStepIdx
                  const active = i === currentStepIdx
                  return (
                    <li key={s.key} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                        ${done ? 'bg-teal-500' : 'bg-gray-100'}`}>
                        {done
                          ? <CheckCircle size={14} className="text-white" />
                          : <span className="w-2 h-2 rounded-full bg-gray-300" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${active ? 'text-teal-600' : done ? 'text-[#2C2C2A]' : 'text-[#5F5E5A]'}`}>
                          {s.label}
                          {active && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-teal-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 status-dot-live" aria-hidden="true" />
                              Now
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

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setStatus('arrived')} disabled={status === 'arrived'}
                className="btn-primary flex-1 justify-center text-sm py-2.5 disabled:opacity-50">
                <ArrowRight size={14} /> Mark patient arrived
              </button>
              <button onClick={() => { setStatus('idle'); setPatientName(''); setReason('') }}
                className="btn-secondary text-sm py-2.5 px-4">
                New escalation
              </button>
            </div>

            <a href="tel:104" className="flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors">
              <Phone size={14} /> Call 104 helpline
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
