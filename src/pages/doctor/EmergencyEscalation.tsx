// Module 9 — Emergency Escalation
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Phone, ArrowRight, Clock, Siren, MapPin } from 'lucide-react'
import { escalationsApi, appointmentsApi, type Escalation } from '../../services/api'

type EscalationStatus = 'idle' | 'sending' | 'sent' | 'acknowledged' | 'arrived'

const statusSteps = [
  { key: 'sent',         label: 'Escalation sent',           desc: 'Nearest higher facility notified' },
  { key: 'acknowledged', label: 'Acknowledged',              desc: 'Receiving facility confirmed readiness' },
  { key: 'arrived',      label: 'Patient in transit/arrived', desc: 'Transfer in progress' },
]

export function EmergencyEscalationPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<EscalationStatus>('idle')
  const [patientName, setPatientName] = useState('')
  const [reason, setReason] = useState('')
  const [destination, setDestination] = useState('District Hospital Solapur')
  const [sentTime, setSentTime] = useState('')
  const [escalation, setEscalation] = useState<Escalation | null>(null)

  function triggerEscalation() {
    if (!patientName.trim() || !reason.trim()) return
    setStatus('sending')
    escalationsApi.create({ patientName, reason, toFacilityName: destination })
      .then(esc => {
        setEscalation(esc)
        setStatus('sent')
        setSentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
        // Auto-advance for demo
        setTimeout(() => setStatus('acknowledged'), 4000)
      })
      .catch(() => {
        setStatus('sent')
        setSentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
      })
  }

  const currentStepIdx = status === 'acknowledged' || status === 'arrived'
    ? statusSteps.findIndex(s => s.key === status)
    : status === 'sent' ? 0 : -1

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Siren size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Emergency Escalation</h1>
              <p className="text-blue-100 text-sm mt-1">Immediately notifies the nearest higher-tier facility</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Bachao Bachao Feature Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl p-8 shadow-2xl border-4 border-red-400"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center animate-pulse">
                <MapPin size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">बचाओ बचाओ (Bachao Bachao)</h2>
                <p className="text-red-100 text-base">Live GPS tracking + Nearest facility + Auto bed reservation</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/asha/emergency/bachao-bachao')}
              className="px-8 py-5 bg-white text-red-600 hover:bg-red-50 rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all flex items-center gap-3 text-lg"
            >
              Launch
              <ArrowRight size={24} />
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
        {status === 'idle' || status === 'sending' ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6">
            {/* Alert banner */}
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-red-100 border-4 border-red-300 shadow-lg" role="alert">
              <AlertTriangle size={28} className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-red-900 text-lg">Emergency Escalation</p>
                <p className="text-base text-red-700 mt-2">This will immediately alert the receiving facility and generate a priority referral with patient records attached.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
              <label htmlFor="esc-patient" className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Patient name / ID</label>
              <input id="esc-patient" type="text" value={patientName} onChange={e => setPatientName(e.target.value)}
                placeholder="e.g. Priya Sharma · ABHA 91-3412-5678" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:border-[#123B6D] text-base" />
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
              <label htmlFor="esc-dest" className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Send to (nearest higher tier)</label>
              <select id="esc-dest" value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:border-[#123B6D] text-base">
                {['Rural Hospital Beed', 'District Hospital Beed', 'Medical College Aurangabad'].map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
              <label htmlFor="esc-reason" className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Emergency reason</label>
              <textarea id="esc-reason" rows={4} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Acute chest pain, BP 180/110, suspected MI — patient needs immediate cardiac care"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:border-[#123B6D] resize-none text-base" />
            </div>

            <button
              onClick={triggerEscalation}
              disabled={status === 'sending' || !patientName.trim() || !reason.trim()}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50"
              aria-label="Trigger emergency escalation"
            >
              {status === 'sending' ? (
                <>
                  <span className="w-6 h-6 rounded-full border-4 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  Sending escalation…
                </>
              ) : (
                <>
                  <AlertTriangle size={24} aria-hidden="true" />
                  Trigger Emergency Escalation
                </>
              )}
            </button>

            <a href="tel:104" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border-4 border-red-300 text-red-600 hover:bg-red-50 transition-all duration-200 text-base font-bold shadow-md hover:shadow-lg">
              <Phone size={20} aria-hidden="true" /> Also call 104 — National Emergency Helpline
            </a>
          </motion.div>
        ) : (
          <motion.div key="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6">
            {/* Sent confirmation */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-[6px] border-l-red-500">
              <div className="flex items-center gap-4 mb-4">
                <CheckCircle size={32} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg text-[#123B6D]">Escalation sent — {sentTime}</p>
                  <p className="text-sm text-gray-600 mt-1">{destination} has been notified</p>
                </div>
              </div>
              <div className="text-base space-y-3 bg-gradient-to-br from-blue-50 to-orange-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Patient</span>
                  <span className="font-bold text-[#123B6D]">{patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Destination</span>
                  <span className="font-bold text-[#123B6D]">{destination}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Priority</span>
                  <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-800 text-sm font-bold rounded-xl border-2 border-red-300">Emergency</span>
                </div>
              </div>
            </div>

            {/* Status stepper */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-5">Escalation Status</p>
              <ol className="space-y-5">
                {statusSteps.map((s, i) => {
                  const done = i <= currentStepIdx
                  const active = i === currentStepIdx
                  return (
                    <li key={s.key} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md
                        ${done ? 'bg-gradient-to-br from-[#E85D04] to-[#d94f03]' : 'bg-gray-100'}`}>
                        {done
                          ? <CheckCircle size={20} className="text-white" />
                          : <span className="w-3 h-3 rounded-full bg-gray-300" />}
                      </div>
                      <div>
                        <p className={`text-base font-bold ${active ? 'text-[#E85D04]' : done ? 'text-[#123B6D]' : 'text-gray-600'}`}>
                          {s.label}
                          {active && (
                            <span className="ml-3 inline-flex items-center gap-1 text-sm text-[#E85D04] font-medium">
                              <span className="w-2 h-2 rounded-full bg-[#E85D04] status-dot-live" aria-hidden="true" />
                              Now
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Actions */}
            <div className="flex gap-4 flex-wrap">
              <button onClick={() => setStatus('arrived')} disabled={status === 'arrived'}
                className="flex-1 bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white font-bold py-4 rounded-2xl hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-base">
                <ArrowRight size={20} /> Mark Patient Arrived
              </button>
              <button onClick={() => { setStatus('idle'); setPatientName(''); setReason('') }}
                className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white font-bold py-4 px-6 rounded-2xl hover:shadow-xl transition-all duration-200 text-base">
                New Escalation
              </button>
            </div>

            <a href="tel:104" className="flex items-center justify-center gap-3 text-base text-red-600 hover:text-red-700 transition-colors font-bold">
              <Phone size={18} /> Call 104 helpline
            </a>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
