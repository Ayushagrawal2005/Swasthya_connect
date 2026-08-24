// Module 1+3+6 — Doctor patient-detail / consult view
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown, ChevronUp, Pill, FlaskConical, Video, Send,
  FileText, AlertTriangle, CheckCircle, ArrowRight,
} from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'

interface Tab { id: string; label: string }
const tabs: Tab[] = [
  { id: 'history', label: 'History' },
  { id: 'consult', label: 'Consult notes' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'referral', label: 'Referral' },
]

const diagTests = [
  { name: 'CBC (Complete Blood Count)', status: 'result-ready' as const, result: 'Hb 11.2 g/dL — Low', flag: true },
  { name: 'Urine Routine', status: 'ordered' as const, result: '', flag: false },
  { name: 'Obstetric Ultrasound', status: 'not-available' as const, result: '', flag: false },
]

const diagStatusStyle: Record<string, string> = {
  'result-ready': 'badge-green',
  ordered: 'badge-teal',
  'sample-done': 'badge-amber',
  'not-available': 'badge-red',
}
const diagStatusLabel: Record<string, string> = {
  'result-ready': 'Result ready',
  ordered: 'Ordered',
  'sample-done': 'Sample done',
  'not-available': 'Not available here',
}

export function PatientDetailPage() {
  const [activeTab, setActiveTab] = useState('history')
  const [notes, setNotes] = useState('')
  const [prescription, setPrescription] = useState('')
  const [referralReason, setReferralReason] = useState('')
  const [referralTo, setReferralTo] = useState('Rural Hospital Beed')
  const [referralUrgency, setReferralUrgency] = useState<'routine' | 'urgent' | 'emergency'>('routine')
  const [referralSent, setReferralSent] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  function saveNotes() {
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  function sendReferral() {
    if (!referralReason.trim()) return
    setReferralSent(true)
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left: Patient summary ── */}
      <aside className="w-full lg:w-72 lg:flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#D3D1C7] overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700 flex-shrink-0">
              PS
            </div>
            <div>
              <p className="font-semibold text-[#2C2C2A]">Priya Sharma</p>
              <p className="text-xs text-[#5F5E5A]">F · 28 yrs · ABHA: 91-3412-5678</p>
            </div>
          </div>

          {/* Risk badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Moderate risk</p>
              <p className="text-[10px] text-amber-700">28W pregnant · Low Hb</p>
            </div>
          </div>
          <AIPill />

          {/* Vitals */}
          <div>
            <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-2">Latest vitals</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'BP', value: '118/76' },
                { label: 'Temp', value: '98.4°F' },
                { label: 'Hb', value: '11.2 g/dL' },
                { label: 'Weight', value: '62 kg' },
              ].map(v => (
                <div key={v.label} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[#5F5E5A]">{v.label}</p>
                  <p className="font-semibold text-[#2C2C2A] tabular-nums">{v.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active conditions */}
          <div>
            <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-2">Active conditions</p>
            <div className="space-y-1 text-xs">
              {['Pregnancy (28W)', 'Iron-deficiency anaemia', 'Borderline GDM'].map(c => (
                <div key={c} className="flex items-center gap-2 text-[#2C2C2A]">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" aria-hidden="true" />
                  {c}
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary w-full justify-center text-sm py-2.5">
            <Video size={15} aria-hidden="true" /> Start teleconsult
          </button>
        </div>
      </aside>

      {/* ── Right: Tabs ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#D3D1C7] bg-white px-4 overflow-x-auto" role="tablist" aria-label="Patient detail tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === t.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* History tab */}
          {activeTab === 'history' && (
            <div id="panel-history" role="tabpanel" aria-labelledby="tab-history" className="space-y-3 animate-fade-in">
              {[
                { date: '20 Aug 2026', title: 'ANC Check-up (28W)', detail: 'BP 118/76. FHR 142 bpm. Advised iron supplementation.', type: 'Visit' },
                { date: '18 Aug 2026', title: 'CBC Report', detail: 'Hb: 11.2 g/dL (Low). Mild anaemia noted.', type: 'Lab' },
                { date: '15 Aug 2026', title: 'Iron + Folic Acid Rx', detail: 'Tab Iron+FA × 90d. Tab Calcium × 60d.', type: 'Prescription' },
              ].map(r => (
                <div key={r.date} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{r.title}</p>
                    <span className="badge-teal text-[10px] flex-shrink-0">{r.type}</span>
                  </div>
                  <p className="text-xs text-[#5F5E5A]">{r.date}</p>
                  <p className="text-sm text-[#5F5E5A] mt-1 leading-relaxed">{r.detail}</p>
                </div>
              ))}
            </div>
          )}

          {/* Consult notes tab */}
          {activeTab === 'consult' && (
            <div id="panel-consult" role="tabpanel" aria-labelledby="tab-consult" className="space-y-4 animate-fade-in">
              <div>
                <label htmlFor="consult-notes" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
                  Consultation notes
                </label>
                <textarea
                  id="consult-notes"
                  rows={5}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter examination findings, assessment, and plan…"
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label htmlFor="prescription" className="block text-sm font-medium text-[#2C2C2A] mb-1.5 flex items-center gap-2">
                  <Pill size={15} className="text-teal-500" aria-hidden="true" /> Prescription
                </label>
                <textarea
                  id="prescription"
                  rows={3}
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  placeholder="e.g. Tab Iron+FA 1×OD after food × 30 days"
                  className="input-field resize-none"
                />
              </div>
              <button onClick={saveNotes} className="btn-primary text-sm py-2.5 px-5">
                {notesSaved ? <><CheckCircle size={14} /> Saved to record</> : <><Send size={14} /> Save to patient record</>}
              </button>
            </div>
          )}

          {/* Diagnostics tab — Module 6 */}
          {activeTab === 'diagnostics' && (
            <div id="panel-diagnostics" role="tabpanel" aria-labelledby="tab-diagnostics" className="space-y-3 animate-fade-in">
              <p className="text-sm text-[#5F5E5A]">Track test orders and results tied to this patient's record.</p>
              {diagTests.map(d => (
                <div key={d.name} className="card p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FlaskConical size={16} className="text-indigo-500" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm text-[#2C2C2A]">{d.name}</p>
                      {d.flag && <AlertTriangle size={13} className="text-amber-500" aria-label="Flagged result" />}
                    </div>
                    {d.result && <p className="text-xs text-amber-700 font-medium">{d.result}</p>}
                    {d.status === 'not-available' && (
                      <p className="text-xs text-red-600 mt-1">
                        Not available at PHC Beed. Nearest: <strong>Rural Hospital Beed (8.1 km)</strong>
                      </p>
                    )}
                  </div>
                  <span className={`${diagStatusStyle[d.status]} text-[10px] flex-shrink-0`}>
                    {diagStatusLabel[d.status]}
                  </span>
                </div>
              ))}
              <button className="btn-secondary text-sm py-2.5 w-full justify-center">
                <FlaskConical size={14} aria-hidden="true" /> Order new test
              </button>
            </div>
          )}

          {/* Referral tab — Module 5 */}
          {activeTab === 'referral' && (
            <div id="panel-referral" role="tabpanel" aria-labelledby="tab-referral" className="space-y-4 animate-fade-in">
              {referralSent ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center py-8 text-center gap-3">
                  <CheckCircle size={36} className="text-green-500" />
                  <p className="font-semibold text-[#2C2C2A]">Referral sent</p>
                  <p className="text-sm text-[#5F5E5A]">{referralTo} has been notified with patient record.</p>
                  <button onClick={() => setReferralSent(false)} className="btn-secondary text-sm mt-2">Create another</button>
                </motion.div>
              ) : (
                <>
                  <div>
                    <label htmlFor="referral-to" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Refer to</label>
                    <select id="referral-to" value={referralTo} onChange={e => setReferralTo(e.target.value)} className="input-field">
                      {['Rural Hospital Beed', 'District Hospital Beed', 'Medical College Aurangabad'].map(f => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Urgency</label>
                    <div className="flex gap-2" role="group" aria-label="Referral urgency">
                      {(['routine', 'urgent', 'emergency'] as const).map(u => (
                        <button key={u}
                          onClick={() => setReferralUrgency(u)}
                          aria-pressed={referralUrgency === u}
                          className={`flex-1 py-2.5 text-xs font-semibold rounded-btn border-2 capitalize transition-all
                            ${referralUrgency === u
                              ? u === 'emergency' ? 'bg-red-500 border-red-500 text-white'
                                : u === 'urgent' ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-teal-500 border-teal-500 text-white'
                              : 'border-[#D3D1C7] text-[#5F5E5A] bg-white'}`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ref-reason" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Reason for referral</label>
                    <textarea id="ref-reason" rows={3} value={referralReason} onChange={e => setReferralReason(e.target.value)}
                      placeholder="Describe the clinical indication for referral…"
                      className="input-field resize-none" />
                  </div>
                  <button onClick={sendReferral} disabled={!referralReason.trim()} className="btn-primary w-full justify-center text-sm">
                    <ArrowRight size={15} aria-hidden="true" /> Send referral with record
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
