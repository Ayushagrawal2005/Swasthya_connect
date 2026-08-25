// Chronic Care Tracker � tracks disease progression, auto-flags checkups, notifies workers
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, CheckCircle,
  ChevronDown, ChevronRight, Phone, Video, Bell, BellOff, Calendar,
  Activity, User, Pill, ArrowRight, Loader2,
} from "lucide-react"
import { chronicApi, type ChronicPatient } from "../../services/api"
import { AIPill } from "../../components/ui/AIPill"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { useNavigate } from "react-router-dom"

type AlertLevel = 'none' | 'reminder' | 'warning' | 'urgent'
type ProgressionStatus = 'stable' | 'improving' | 'worsening' | 'critical'

const alertConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  none:     { label: 'Stable',   color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  reminder: { label: 'Reminder', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  warning:  { label: 'Warning',  color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  urgent:   { label: 'Urgent',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-300' },
}

const progressionConfig: Record<string, { label: string; color: string; arrow: string }> = {
  stable:    { label: 'Stable',    color: 'text-teal-600',  arrow: '?' },
  improving: { label: 'Improving', color: 'text-green-600', arrow: '?' },
  worsening: { label: 'Worsening', color: 'text-red-600',   arrow: '?' },
  critical:  { label: 'Critical',  color: 'text-red-700',   arrow: '??' },
}

const conditionMetric: Record<string, string> = {
  hypertension: 'BP (mmHg)', diabetes: 'HbA1c (%)', tb: 'Compliance (%)',
  ckd: 'Creatinine (mg/dL)', copd: 'FEV1 (%)', 'heart-disease': 'BP (mmHg)', anaemia: 'Hb (g/dL)',
}

const conditionColors: Record<string, string> = {
  hypertension: "bg-red-50 text-red-700 border-red-200",
  diabetes: "bg-amber-50 text-amber-700 border-amber-200",
  tb: "bg-purple-50 text-purple-700 border-purple-200",
  ckd: "bg-indigo-50 text-indigo-700 border-indigo-200",
  copd: "bg-teal-50 text-teal-700 border-teal-200",
  "heart-disease": "bg-coral-50 text-coral-700 border-coral-200",
  anaemia: "bg-green-50 text-green-700 border-green-200",
}

const checkupIntervalDays: Record<string, number> = {
  hypertension: 30, diabetes: 90, tb: 7, ckd: 30, copd: 60, "heart-disease": 30, anaemia: 60,
}

const ProgressionIcon = ({ status }: { status: string }) => {
  const cfg = progressionConfig[status]
  if (status === "worsening" || status === "critical") return <TrendingUp size={14} className={cfg.color} />
  if (status === "improving") return <TrendingDown size={14} className={cfg.color} />
  return <Minus size={14} className={cfg.color} />
}

function PatientCard({ patient, onSelect, isSelected }: { patient: ChronicPatient; onSelect: () => void; isSelected: boolean }) {
  const alertCfg = alertConfig[patient.alertLevel]
  const progCfg  = progressionConfig[patient.progressionStatus]
  const urgentAlerts = patient.alerts.filter(a => !a.acknowledged)

  return (
    <button onClick={onSelect}
      className={`card w-full text-left p-4 transition-all hover:shadow-card-hover border-l-4 ${
        patient.alertLevel === "urgent" ? "border-l-red-500" :
        patient.alertLevel === "warning" ? "border-l-coral-500" :
        patient.alertLevel === "reminder" ? "border-l-amber-400" : "border-l-teal-300"
      } ${isSelected ? "ring-2 ring-teal-500/30" : ""}`}
      aria-pressed={isSelected}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-[#5F5E5A] flex-shrink-0">
          {patient.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-sm text-[#2C2C2A]">{patient.name}</p>
            <span className="text-xs text-[#5F5E5A]">{patient.age}y</span>
            {urgentAlerts.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                {urgentAlerts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${conditionColors[patient.condition] || "badge-teal"}`}>
              {patient.conditionLabel}
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-medium ${progCfg.color}`}>
              <ProgressionIcon status={patient.progressionStatus} />{progCfg.label}
            </span>
          </div>
          <p className="text-[10px] text-[#5F5E5A] mt-1">Next: {patient.nextCheckupDate} � {patient.worker}</p>
        </div>
        <div className="flex-shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${alertCfg.bg} ${alertCfg.color} ${alertCfg.border}`}>
            {alertCfg.label}
          </span>
        </div>
      </div>
    </button>
  )
}

function ProgressionChart({ patient }: { patient: ChronicPatient }) {
  const data = patient.readings.map((r, i) => ({
    name: `V${i + 1}`,
    value: r.numeric,
    date: r.date,
    label: r.value,
  }))

  const color = patient.progressionStatus === "worsening" ? "#D85A30"
    : patient.progressionStatus === "improving" ? "#0F6E56" : "#3C3489"

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#2C2C2A]">Disease progression</h3>
        <div className="flex items-center gap-1.5">
          <ProgressionIcon status={patient.progressionStatus} />
          <span className={`text-xs font-medium ${progressionConfig[patient.progressionStatus].color}`}>
            {progressionConfig[patient.progressionStatus].label}
          </span>
          <AIPill />
        </div>
      </div>
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#5F5E5A" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#5F5E5A" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #D3D1C7" }}
              formatter={(v: number) => [String(v), patient.conditionLabel]}
              
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-[#5F5E5A] mt-1 text-center">
        {conditionMetric[patient.condition]} over {patient.readings.length} readings
      </p>
    </div>
  )
}

export function ChronicCareTracker() {
  const navigate = useNavigate()
  const [patients, setPatients]     = useState<ChronicPatient[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<ChronicPatient | null>(null)
  const [filter, setFilter]         = useState<AlertLevel | "all">("all")
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set())
  const [smsSent, setSmsSent]       = useState<Set<string>>(new Set())
  const [expandedCheckup, setExpandedCheckup] = useState<string | null>(null)

  useEffect(() => {
    chronicApi.list(filter !== 'all' ? { alertLevel: filter } : undefined)
      .then(data => {
        setPatients(data)
        if (!selected && data.length > 0) setSelected(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  function acknowledgeAlert(patientId: string, alertId: string) {
    chronicApi.acknowledge(patientId, alertId)
      .then(() => setAcknowledged(p => new Set([...p, alertId])))
      .catch(() => setAcknowledged(p => new Set([...p, alertId])))
  }

  function sendSms(patientId: string) {
    chronicApi.sendSms(patientId)
      .then(() => setSmsSent(p => new Set([...p, patientId])))
      .catch(() => setSmsSent(p => new Set([...p, patientId])))
  }

  const [callLogged, setCallLogged] = useState<Set<string>>(new Set())

  function logCall(patientId: string) {
    setCallLogged(p => new Set([...p, patientId]))
  }

  const filtered = patients
  const urgentCount   = patients.filter(p => p.alertLevel === "urgent").length
  const warningCount  = patients.filter(p => p.alertLevel === "warning").length
  const reminderCount = patients.filter(p => p.alertLevel === "reminder").length

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {loading && <div className="flex justify-center items-center h-32"><Loader2 className="animate-spin text-teal-400" /></div>}
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#D3D1C7] bg-white flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#2C2C2A]">Chronic Care Tracker</h1>
            <p className="text-sm text-[#5F5E5A] mt-0.5">Disease progression � auto-flagging � proactive outreach</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {urgentCount > 0  && <span className="badge-red text-[10px]"><AlertTriangle size={10} /> {urgentCount} urgent</span>}
            {warningCount > 0 && <span className="badge-amber text-[10px]">{warningCount} warning</span>}
            {reminderCount > 0 && <span className="badge-teal text-[10px]">{reminderCount} reminder</span>}
          </div>
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 mt-3 flex-wrap" role="group" aria-label="Filter by alert level">
          {(["all", "urgent", "warning", "reminder", "none"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize
                ${filter === f ? "bg-teal-500 text-white border-teal-500" : "bg-white text-[#5F5E5A] border-[#D3D1C7] hover:border-teal-300"}`}>
              {f === "none" ? "Stable" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: patient list */}
        <div className="w-full sm:w-72 lg:w-80 flex-shrink-0 border-r border-[#D3D1C7] overflow-y-auto bg-white p-3 space-y-2">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <PatientCard patient={p} onSelect={() => setSelected(p)} isSelected={selected?.id === p.id} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-center text-[#5F5E5A] py-8">No patients match this filter.</p>
          )}
        </div>

        {/* Right: patient detail */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {selected && (
            <AnimatePresence mode="wait">
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }} className="space-y-5">

                {/* Identity */}
                <div className="card p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-lg font-semibold text-teal-700 flex-shrink-0">
                    {selected.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-semibold text-[#2C2C2A]">{selected.name}</h2>
                      <span className="text-sm text-[#5F5E5A]">{selected.age}y � {selected.gender}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${conditionColors[selected.condition]}`}>
                        {selected.conditionLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F5E5A]">{selected.village} � {selected.phone}</p>
                    <p className="text-xs text-[#5F5E5A] mt-0.5">Worker: {selected.worker} � Since: {selected.since}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`flex items-center gap-1 text-xs font-medium ${progressionConfig[selected.progressionStatus].color}`}>
                        <ProgressionIcon status={selected.progressionStatus} />
                        {progressionConfig[selected.progressionStatus].label}
                      </span>
                      <span className="text-[#5F5E5A] text-xs">�</span>
                      <span className={`text-xs font-medium ${alertConfig[selected.alertLevel].color}`}>
                        {alertConfig[selected.alertLevel].label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active alerts */}
                {selected.alerts.filter(a => !acknowledged.has(a.id)).length > 0 && (
                  <section aria-label="Active alerts">
                    <h3 className="section-header flex items-center gap-2">
                      <Bell size={15} className="text-coral-500" aria-hidden="true" /> Auto-flagged alerts
                      <AIPill />
                    </h3>
                    <div className="space-y-3">
                      {selected.alerts.filter(a => !acknowledged.has(a.id)).map(alert => {
                        const cfg = alertConfig[alert.level]
                        return (
                          <div key={alert.id} className={`rounded-xl border-2 p-4 ${cfg.bg} ${cfg.border}`}>
                            <div className="flex items-start gap-2 mb-2">
                              <AlertTriangle size={16} className={`${cfg.color} flex-shrink-0 mt-0.5`} aria-hidden="true" />
                              <div className="flex-1">
                                <p className={`text-sm font-semibold ${cfg.color}`}>{alert.message}</p>
                                <p className="text-xs text-[#5F5E5A] mt-0.5">Triggered by: {alert.triggeredBy}</p>
                              </div>
                            </div>
                            <div className={`text-xs ${cfg.color} bg-white/60 rounded-lg px-3 py-2 mb-3 font-medium`}>
                              Action required: {alert.action}
                            </div>
                            {/* Worker outreach actions */}
                            <div className="flex gap-2 flex-wrap">
                              <a href={`tel:${selected.phone}`}
                                className="flex items-center gap-1.5 text-xs bg-white border border-[#D3D1C7] text-[#2C2C2A] px-3 py-1.5 rounded-full hover:border-teal-400 hover:text-teal-600 transition-colors font-medium"
                                aria-label={`Call ${selected.name}`}>
                                <Phone size={11} /> Call patient
                              </a>
                              {!smsSent.has(selected.id) ? (
                                <button onClick={() => sendSms(selected.id)}
                                  className="flex items-center gap-1.5 text-xs bg-white border border-[#D3D1C7] text-[#2C2C2A] px-3 py-1.5 rounded-full hover:border-teal-400 hover:text-teal-600 transition-colors font-medium">
                                  Send SMS reminder
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                                  <CheckCircle size={11} /> SMS sent
                                </span>
                              )}
                              <button onClick={() => navigate("/asha/teleconsult")}
                                className="flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors font-medium">
                                <Video size={11} /> Start teleconsult
                              </button>
                              <button onClick={() => chronicApi.acknowledge(selected!.id, alert.id).then(() => setAcknowledged(p => new Set([...p, alert.id])))}
                                className="flex items-center gap-1.5 text-xs bg-gray-50 border border-[#D3D1C7] text-[#5F5E5A] px-3 py-1.5 rounded-full hover:border-gray-400 transition-colors font-medium ml-auto">
                                <BellOff size={11} /> Acknowledge
                              </button>
                            </div>
                            <p className="text-[10px] text-[#5F5E5A] mt-2 flex items-center gap-1">
                              <Clock size={9} /> Flagged: {alert.createdAt}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Progression chart */}
                <ProgressionChart patient={selected} />

                {/* Reading history */}
                <section aria-labelledby="readings-heading">
                  <h3 id="readings-heading" className="section-header">Reading history</h3>
                  <div className="card overflow-hidden">
                    <table className="w-full text-xs" aria-label="Vital readings history">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#D3D1C7]">
                          <th className="text-left py-2.5 px-4 font-semibold text-[#5F5E5A] uppercase tracking-wide">Date</th>
                          <th className="text-left py-2.5 px-4 font-semibold text-[#5F5E5A] uppercase tracking-wide">{conditionMetric[selected.condition]}</th>
                          <th className="text-left py-2.5 px-4 font-semibold text-[#5F5E5A] uppercase tracking-wide hidden sm:table-cell">Recorded by</th>
                          <th className="text-left py-2.5 px-4 font-semibold text-[#5F5E5A] uppercase tracking-wide hidden sm:table-cell">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...selected.readings].reverse().map((r, i) => {
                          const prev = selected.readings[selected.readings.length - 2 - i]
                          const trend = prev ? (r.numeric > prev.numeric ? "up" : r.numeric < prev.numeric ? "down" : "flat") : "flat"
                          return (
                            <tr key={r.date} className="border-b border-[#D3D1C7]/50 hover:bg-gray-50">
                              <td className="py-2.5 px-4 text-[#2C2C2A]">{r.date}</td>
                              <td className="py-2.5 px-4 font-semibold tabular-nums">
                                <div className="flex items-center gap-1.5">
                                  {trend === "up"   && <TrendingUp size={12} className="text-red-500" aria-label="Rising" />}
                                  {trend === "down"  && <TrendingDown size={12} className="text-green-500" aria-label="Falling" />}
                                  {trend === "flat"  && <Minus size={12} className="text-[#5F5E5A]" aria-label="Stable" />}
                                  <span className={trend === "up" ? "text-red-600" : trend === "down" ? "text-green-600" : "text-[#2C2C2A]"}>
                                    {r.value}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-[#5F5E5A] hidden sm:table-cell">{r.recordedBy}</td>
                              <td className="py-2.5 px-4 text-[#5F5E5A] hidden sm:table-cell">{r.note || "�"}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Checkup schedule */}
                <section aria-labelledby="checkup-heading">
                  <h3 id="checkup-heading" className="section-header flex items-center gap-2">
                    <Calendar size={15} className="text-teal-500" aria-hidden="true" /> Checkup schedule
                    <span className="text-xs font-normal text-[#5F5E5A]">every {checkupIntervalDays[selected.condition]} days</span>
                  </h3>
                  <div className="space-y-2">
                    {selected.checkups.map(c => {
                      const isOpen = expandedCheckup === c.id
                      const statusStyle = {
                        "due-today": "border-l-amber-400 bg-amber-50",
                        overdue:     "border-l-red-500 bg-red-50",
                        upcoming:    "border-l-teal-300 bg-white",
                        completed:   "border-l-green-400 bg-green-50 opacity-70",
                      }[c.status]

                      return (
                        <div key={c.id} className={`rounded-xl border border-[#D3D1C7] border-l-4 overflow-hidden ${statusStyle}`}>
                          <button onClick={() => setExpandedCheckup(isOpen ? null : c.id)}
                            className="w-full flex items-center gap-3 p-3 text-left"
                            aria-expanded={isOpen}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              c.status === "overdue" ? "bg-red-100" : c.status === "due-today" ? "bg-amber-100" : c.status === "completed" ? "bg-green-100" : "bg-teal-50"
                            }`}>
                              {c.status === "completed" ? <CheckCircle size={14} className="text-green-600" /> :
                               c.status === "overdue"   ? <AlertTriangle size={14} className="text-red-500" /> :
                               <Clock size={14} className="text-teal-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#2C2C2A]">{c.type}</p>
                              <p className="text-xs text-[#5F5E5A]">
                                {c.scheduledDate} � {c.status === "overdue" ? `${Math.abs(c.daysFromNow)} days overdue` : c.status === "due-today" ? "Due today" : `In ${c.daysFromNow} days`}
                              </p>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${
                              c.status === "overdue"   ? "bg-red-50 text-red-700 border-red-200" :
                              c.status === "due-today" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              c.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                                                         "bg-teal-50 text-teal-700 border-teal-200"
                            }`}>{c.status}</span>
                            {isOpen ? <ChevronDown size={13} className="text-[#5F5E5A]" /> : <ChevronRight size={13} className="text-[#5F5E5A]" />}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-3 space-y-2 border-t border-[#D3D1C7]/40">
                              {c.note && <p className="text-xs text-[#5F5E5A] mt-2">{c.note}</p>}
                              {c.result && <p className="text-xs font-medium text-teal-700">Result: {c.result}</p>}
                              {c.status !== "completed" && (
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => navigate("/asha/appointments")}
                                    className="flex items-center gap-1.5 text-xs btn-primary py-1.5 px-3 text-xs">
                                    <Calendar size={11} /> Book appointment
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* Medications */}
                <section aria-labelledby="meds-heading">
                  <h3 id="meds-heading" className="section-header flex items-center gap-2">
                    <Pill size={15} className="text-teal-500" aria-hidden="true" /> Current medications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.medications.map(m => (
                      <span key={m} className="badge-teal text-xs px-3 py-1.5">{m}</span>
                    ))}
                  </div>
                </section>

                {/* Compliance stat */}
                <div className="card p-4 flex items-center gap-4">
                  <div className="w-14 h-14 relative flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90" aria-hidden="true">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none"
                        stroke={selected.missedCheckups / selected.totalCheckups > 0.3 ? "#D85A30" : "#0F6E56"}
                        strokeWidth="3"
                        strokeDasharray={`${((selected.totalCheckups - selected.missedCheckups) / selected.totalCheckups) * 94} 94`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#2C2C2A]">
                      {Math.round(((selected.totalCheckups - selected.missedCheckups) / selected.totalCheckups) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#2C2C2A]">Checkup compliance</p>
                    <p className="text-xs text-[#5F5E5A] mt-0.5">
                      {selected.totalCheckups - selected.missedCheckups} of {selected.totalCheckups} completed � {selected.missedCheckups} missed
                    </p>
                    {selected.missedCheckups > 0 && (
                      <p className="text-xs text-amber-700 mt-1">Last contact: {selected.lastContactDate}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selected.notes && (
                  <div className="card p-4 bg-indigo-50 border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700 mb-1">Clinical notes</p>
                    <p className="text-sm text-indigo-800 leading-relaxed">{selected.notes}</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}


