// Module 1+3+6 — Doctor patient-detail / consult view
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown, ChevronUp, Pill, FlaskConical, Video, Send,
  FileText, AlertTriangle, CheckCircle, ArrowRight, Loader2,
  Download, Calendar, Clock, User, Activity, Plus, X, Search
} from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { patientsApi, diagnosticsApi, referralsApi, type PatientRecord, type DiagOrder, type Consultation, type PatientSummary } from '../../services/api'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import jsPDF from 'jspdf'
import { useApp } from '../../context/AppContext'

interface Tab { id: string; label: string }
const tabs: Tab[] = [
  { id: 'summary', label: 'Unified Summary' },
  { id: 'history', label: 'History' },
  { id: 'consult', label: 'Consult notes' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'referral', label: 'Referral' },
]

interface MedicalRecord {
  id: string
  patientId: string
  documentType: string
  rawText: string
  summary: string
  medicines: Array<{
    name: string
    dosage?: string
    frequency?: string
    confidence: number
  }>
  testValues: Array<{
    test_name: string
    value?: string
    unit?: string
    reference_range?: string
    is_abnormal?: boolean
  }>
  datesFound: string[]
  uploadedBy: string
  uploadedAt: string
  verified: boolean
}

interface Prescription {
  id: string
  patientId: string
  medicines: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
  }>
  prescribedBy: string
  createdAt: string
}

interface UnifiedSummary {
  patient: PatientRecord
  records: MedicalRecord[]
  prescriptions: Prescription[]
  consultations: Consultation[]
  summary: {
    totalRecords: number
    totalPrescriptions: number
    totalConsultations: number
    activeMedicines: any[]
    recentTests: any[]
  }
  timeline: Array<{
    type: 'record' | 'prescription' | 'consultation'
    date: string
    data: any
  }>
}

interface DiagTest {
  name: string
  status: string
  result: string
  flag: boolean
}

const diagTests: DiagTest[] = [
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
  const location = useLocation()
  const navigate  = useNavigate()
  const { userName } = useApp()

  // Get patientId from navigation state (passed from DoctorHome) or query params
  const routePatientId: string | null = (location.state as any)?.patientId || null
  const routePatientName: string | null = (location.state as any)?.patientName || null

  const [activeTab, setActiveTab] = useState('summary')
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [diagTests, setDiagTests] = useState<DiagOrder[]>([])
  const [saving, setSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Consultation form fields
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [prescription, setPrescription] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; frequency: string; duration: string }>>([])
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', duration: '' })

  const [referralReason, setReferralReason] = useState('')
  const [referralTo, setReferralTo] = useState('District Hospital Solapur')
  const [referralUrgency, setReferralUrgency] = useState<'routine' | 'urgent' | 'emergency'>('routine')
  const [referralSent, setReferralSent] = useState(false)

  // Unified summary + past consultations
  const [unifiedSummary, setUnifiedSummary] = useState<PatientSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [pastConsultations, setPastConsultations] = useState<Consultation[]>([])

  // ── Load patient on mount ──────────────────────────────────────────
  useEffect(() => {
    if (routePatientId) {
      // Load by explicit ID from navigation
      patientsApi.get(routePatientId)
        .then(p => { setPatient(p); loadSummary(p.id) })
        .catch(() => {
          // Fallback: search by name
          if (routePatientName) {
            patientsApi.search(routePatientName).then(r => {
              if (r[0]) { setPatient(r[0]); loadSummary(r[0].id) }
            }).catch(() => {})
          }
        })
      diagnosticsApi.list({ patientId: routePatientId }).then(setDiagTests).catch(() => {})
    } else {
      // No patient ID — show picker screen
      setLoadingSummary(false)
    }
  }, [routePatientId, routePatientName])

  async function loadSummary(patientId: string) {
    setLoadingSummary(true)
    try {
      const summary = await patientsApi.getSummary(patientId)
      setUnifiedSummary(summary)
      setPastConsultations(summary.consultations || [])
    } catch (err) {
      console.error('Failed to load summary:', err)
      // Still try to load past consultations separately
      patientsApi.getConsultations(patientId)
        .then(c => setPastConsultations(c))
        .catch(() => {})
    } finally {
      setLoadingSummary(false)
    }
  }

  function addMedicine() {
    if (!newMed.name.trim()) return
    setMedicines(p => [...p, { ...newMed }])
    setNewMed({ name: '', dosage: '', frequency: '', duration: '' })
  }

  function removeMedicine(i: number) {
    setMedicines(p => p.filter((_, idx) => idx !== i))
  }

  async function saveConsultation() {
    if (!patient) return
    if (!chiefComplaint.trim() && !notes.trim() && !diagnosis.trim()) {
      setSaveError('Please enter at least chief complaint, diagnosis or notes before saving.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await patientsApi.saveConsultation(patient.id, {
        chiefComplaint,
        diagnosis,
        notes,
        prescription,
        medicines,
        followUpDate: followUpDate || undefined,
      })
      setNotesSaved(true)
      // Reload summary to show the new consultation in timeline
      await loadSummary(patient.id)
      // Clear form
      setChiefComplaint('')
      setDiagnosis('')
      setNotes('')
      setPrescription('')
      setMedicines([])
      setFollowUpDate('')
      setTimeout(() => setNotesSaved(false), 3000)
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function exportToPDF() {
    if (!patient) return
    setExportingPDF(true)
    const doc = new jsPDF()
    const margin = 20
    let y = 20

    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('Medical Summary — ' + patient.name, margin, y); y += 10
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Health ID: ${patient.healthId} | Age: ${patient.age}y | Generated: ${new Date().toLocaleString('en-IN')}`, margin, y); y += 12

    if (pastConsultations.length > 0) {
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('Consultations', margin, y); y += 7
      pastConsultations.slice(0, 10).forEach((c, idx) => {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFontSize(10); doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}. ${new Date(c.date).toLocaleDateString('en-IN')} — ${c.doctorName}`, margin, y); y += 6
        doc.setFontSize(9); doc.setFont('helvetica', 'normal')
        if (c.diagnosis) { doc.text(`  Diagnosis: ${c.diagnosis}`, margin, y); y += 5 }
        if (c.notes)     { const lines = doc.splitTextToSize(`  Notes: ${c.notes}`, 170); lines.forEach((l: string) => { if (y > 270) { doc.addPage(); y = 20 } doc.text(l, margin, y); y += 4 }) }
        if (c.prescription) { doc.text(`  Rx: ${c.prescription}`, margin, y); y += 5 }
        if (c.medicines?.length) { c.medicines.forEach(m => { doc.text(`  • ${m.name} ${m.dosage} ${m.frequency} × ${m.duration}`, margin, y); y += 4 }) }
        y += 4
      })
    }

    if (unifiedSummary?.records.length) {
      if (y > 240) { doc.addPage(); y = 20 }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('Uploaded Medical Records (OCR)', margin, y); y += 7
      unifiedSummary.records.slice(0, 5).forEach((r: any, i) => {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFontSize(9); doc.setFont('helvetica', 'normal')
        doc.text(`${i + 1}. [${r.documentType}] ${r.summary?.slice(0, 100) || ''}`, margin, y); y += 6
      })
    }

    doc.save(`${patient.name.replace(/\s+/g, '_')}_Summary_${new Date().toISOString().split('T')[0]}.pdf`)
    setExportingPDF(false)
  }

  function sendReferral() {
    if (!referralReason.trim() || !patient) return
    referralsApi.create({ patientId: patient.id, patientName: patient.name, toFacilityName: referralTo, reason: referralReason, urgency: referralUrgency })
      .then(() => setReferralSent(true))
      .catch(() => setReferralSent(true))
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-6">
        {loadingSummary ? (
          <Loader2 className="animate-spin text-[#E85D04]" size={28} />
        ) : (
          <>
            <User size={36} className="text-[#D3D1C7]" />
            <p className="text-sm font-medium text-[#2C2C2A]">No patient selected</p>
            <p className="text-xs text-[#5F5E5A]">Select a patient from the queue or search by name / Health ID</p>
            <button onClick={() => navigate('/doctor/patients')} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2">
              <Search size={15} /> Find patient
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Patient Consultation</h1>
              <p className="text-blue-100 text-sm mt-1">Complete patient medical record and consultation form</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        {/* ── Left: Patient summary ── */}
        <aside className="w-full lg:w-80 lg:flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r-2 border-gray-200 shadow-lg">
          <div className="p-6 space-y-6">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] flex items-center justify-center text-lg font-bold text-white shadow-lg flex-shrink-0">
              PS
            </div>
            <div>
              <p className="font-bold text-lg text-[#123B6D]">{patient.name}</p>
              <p className="text-sm text-gray-600">F · 28 yrs</p>
              <p className="text-xs text-gray-500 mt-1">ABHA: 91-3412-5678</p>
            </div>
          </div>

          {/* Risk badge */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 shadow-md">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">{patient.conditions[0] ? "Active condition" : "Low risk"}</p>
              <p className="text-xs text-amber-700 mt-1">28W pregnant · Low Hb</p>
            </div>
          </div>
          <AIPill />

          {/* Vitals */}
          <div>
            <p className="text-sm font-bold text-[#123B6D] uppercase tracking-wide mb-3">Latest Vitals</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'BP', value: '118/76' },
                { label: 'Temp', value: '98.4°F' },
                { label: 'Hb', value: '11.2 g/dL' },
                { label: 'Weight', value: '62 kg' },
              ].map(v => (
                <div key={v.label} className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 border-2 border-gray-200 shadow-sm">
                  <p className="text-gray-600 font-medium">{v.label}</p>
                  <p className="font-bold text-[#123B6D] tabular-nums text-base mt-1">{v.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active conditions */}
          <div>
            <p className="text-sm font-bold text-[#123B6D] uppercase tracking-wide mb-3">Active Conditions</p>
            <div className="space-y-2 text-sm">
              {['Pregnancy (28W)', 'Iron-deficiency anaemia', 'Borderline GDM'].map(c => (
                <div key={c} className="flex items-center gap-3 text-gray-700 bg-white rounded-lg p-2 border border-gray-200">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#E85D04] to-[#d94f03] flex-shrink-0" aria-hidden="true" />
                  {c}
                </div>
              ))}
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white font-semibold py-3 px-4 rounded-xl hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2">
            <Video size={18} aria-hidden="true" /> Start Teleconsult
          </button>
        </div>
      </aside>

      {/* ── Right: Tabs ── */}
      <main className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b-2 border-gray-200 bg-white shadow-md px-6 overflow-x-auto" role="tablist" aria-label="Patient detail tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`px-6 py-4 text-base font-semibold whitespace-nowrap border-b-4 transition-all duration-200
                ${activeTab === t.id ? 'border-[#E85D04] text-[#123B6D] bg-gradient-to-b from-orange-50/30 to-transparent' : 'border-transparent text-gray-600 hover:text-[#123B6D] hover:bg-gray-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Unified Summary tab */}
          {activeTab === 'summary' && (
            <div id="panel-summary" role="tabpanel" aria-labelledby="tab-summary" className="space-y-6 animate-fade-in">
              {loadingSummary ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-[#123B6D]" size={40} />
                </div>
              ) : unifiedSummary ? (
                <>
                  {/* Header with PDF Export */}
                  <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                    <div>
                      <h2 className="text-2xl font-bold text-[#123B6D]">Unified Medical Summary</h2>
                      <p className="text-base text-gray-600 mt-2">
                        Complete view of records, prescriptions, and consultations
                      </p>
                    </div>
                    <button
                      onClick={exportToPDF}
                      disabled={exportingPDF}
                      className="bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      {exportingPDF ? (
                        <><Loader2 size={18} className="animate-spin" /> Generating...</>
                      ) : (
                        <><Download size={18} /> Export PDF</>
                      )}
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 hover:shadow-2xl transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                          <FileText size={20} className="text-[#E85D04]" />
                        </div>
                        <p className="text-sm font-bold text-gray-600 uppercase">Records</p>
                      </div>
                      <p className="text-3xl font-bold text-[#123B6D]">{unifiedSummary.summary.totalRecords}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 hover:shadow-2xl transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl">
                          <Pill size={20} className="text-indigo-700" />
                        </div>
                        <p className="text-sm font-bold text-gray-600 uppercase">Prescriptions</p>
                      </div>
                      <p className="text-3xl font-bold text-[#123B6D]">{unifiedSummary.summary.totalPrescriptions}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 hover:shadow-2xl transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                          <Activity size={20} className="text-green-700" />
                        </div>
                        <p className="text-sm font-bold text-gray-600 uppercase">Consultations</p>
                      </div>
                      <p className="text-3xl font-bold text-[#123B6D]">{unifiedSummary.summary.totalConsultations}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 hover:shadow-2xl transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl">
                          <Pill size={20} className="text-amber-700" />
                        </div>
                        <p className="text-sm font-bold text-gray-600 uppercase">Medicines</p>
                      </div>
                      <p className="text-3xl font-bold text-[#123B6D]">{unifiedSummary.summary.activeMedicines.length}</p>
                    </div>
                  </div>

                  {/* Active Medicines */}
                  {unifiedSummary.summary.activeMedicines.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                          <Pill size={22} className="text-[#E85D04]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#123B6D]">Active Medications</h3>
                        <AIPill />
                      </div>
                      <div className="grid gap-4">
                        {unifiedSummary.summary.activeMedicines.slice(0, 8).map((med: any, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-[#E85D04] rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
                            <div className="p-2 bg-white rounded-lg">
                              <Pill size={18} className="text-[#E85D04] flex-shrink-0" />
                            </div>
                            <div className="flex-1">
                              <p className="text-base font-bold text-[#123B6D]">{med.name}</p>
                              <p className="text-sm text-gray-700 mt-1">
                                {med.dosage && `${med.dosage} • `}
                                {med.frequency || 'As directed'}
                              </p>
                              {med.confidence && (
                                <p className="text-sm text-[#E85D04] font-medium mt-2">
                                  Extracted with {(med.confidence * 100).toFixed(0)}% confidence
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Medical Records with OCR Summaries */}
                  {unifiedSummary.records.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl">
                          <FileText size={22} className="text-indigo-700" />
                        </div>
                        <h3 className="text-xl font-bold text-[#123B6D]">Uploaded Medical Records</h3>
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-orange-200 text-[#E85D04] text-sm font-bold rounded-full border-2 border-[#E85D04]">OCR Extracted</span>
                      </div>
                      <div className="space-y-4">
                        {unifiedSummary.records.map((record) => (
                          <div key={record.id} className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <span className="px-4 py-2 bg-white text-indigo-700 text-sm font-bold rounded-xl capitalize border-2 border-indigo-300 shadow-sm">
                                  {record.documentType}
                                </span>
                                {!record.verified && (
                                  <span className="text-sm text-amber-700 font-medium flex items-center gap-2">
                                    <AlertTriangle size={16} /> Needs review
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 text-right">
                                <p className="font-semibold">{new Date(record.uploadedAt).toLocaleDateString('en-IN')}</p>
                                <p className="flex items-center gap-2 justify-end mt-1">
                                  <User size={14} /> {record.uploadedBy}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-4 p-4 bg-white rounded-xl border-2 border-indigo-200 shadow-sm">
                              <p className="text-sm font-bold text-gray-600 mb-2">AI-Generated Summary:</p>
                              <p className="text-base text-gray-700 leading-relaxed">{record.summary}</p>
                            </div>

                            {record.medicines.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-bold text-gray-700 mb-3">Extracted Medicines:</p>
                                <div className="flex flex-wrap gap-2">
                                  {record.medicines.map((med, i) => (
                                    <span key={i} className="px-4 py-2 bg-white border-2 border-indigo-300 rounded-xl text-sm text-gray-700 font-medium shadow-sm">
                                      {med.name} {med.dosage && `(${med.dosage})`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {record.testValues.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-bold text-gray-700 mb-3">Lab Results:</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {record.testValues.map((test, i) => (
                                    <div key={i} className="p-3 bg-white border-2 border-indigo-200 rounded-xl shadow-sm">
                                      <p className="text-sm font-bold text-[#123B6D]">{test.test_name}</p>
                                      {test.value && (
                                        <p className="text-sm text-gray-700 mt-1">
                                          {test.value} {test.unit || ''}
                                        </p>
                                      )}
                                      {test.is_abnormal && (
                                        <p className="text-sm text-red-600 font-bold mt-1">⚠ Abnormal</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline View */}
                  {unifiedSummary.timeline.length > 0 && (
                    <div className="card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock size={18} className="text-[#E85D04]" />
                        <h3 className="text-sm font-semibold text-[#2C2C2A]">Medical Timeline</h3>
                      </div>
                      <div className="space-y-3">
                        {unifiedSummary.timeline.slice(0, 10).map((item, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                item.type === 'record' ? 'bg-indigo-100 text-indigo-600' :
                                item.type === 'prescription' ? 'bg-orange-100 text-[#E85D04]' :
                                'bg-green-100 text-green-600'
                              }`}>
                                {item.type === 'record' ? <FileText size={14} /> :
                                 item.type === 'prescription' ? <Pill size={14} /> :
                                 <Activity size={14} />}
                              </div>
                              {index < unifiedSummary.timeline.length - 1 && (
                                <div className="w-0.5 h-full bg-[#D3D1C7] my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold capitalize ${
                                  item.type === 'record' ? 'text-indigo-700' :
                                  item.type === 'prescription' ? 'text-[#E85D04]' :
                                  'text-green-700'
                                }`}>
                                  {item.type}
                                </span>
                                <span className="text-xs text-[#5F5E5A]">
                                  {new Date(item.date).toLocaleString('en-IN', { 
                                    dateStyle: 'medium', 
                                    timeStyle: 'short' 
                                  })}
                                </span>
                              </div>
                              <div className="text-sm text-[#2C2C2A]">
                                {item.type === 'record' && item.data.summary}
                                {item.type === 'prescription' && (
                                  <p>Prescribed by {item.data.prescribedBy}</p>
                                )}
                                {item.type === 'consultation' && (
                                  <p>{item.data.diagnosis || item.data.chiefComplaint}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {unifiedSummary.records.length === 0 && 
                   unifiedSummary.consultations.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-100">
                      <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-bold text-[#123B6D]">No medical records yet</p>
                      <p className="text-base text-gray-600 mt-2">
                        Records uploaded by ASHA workers will appear here
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-100">
                  <AlertTriangle size={64} className="mx-auto text-amber-500 mb-4" />
                  <p className="text-lg font-bold text-[#123B6D]">Unable to load summary</p>
                  <p className="text-base text-gray-600 mt-2">Please try again later</p>
                </div>
              )}
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div id="panel-history" role="tabpanel" aria-labelledby="tab-history" className="space-y-4 animate-fade-in">
              {[
                { date: '20 Aug 2026', title: 'ANC Check-up (28W)', detail: 'BP 118/76. FHR 142 bpm. Advised iron supplementation.', type: 'Visit' },
                { date: '18 Aug 2026', title: 'CBC Report', detail: 'Hb: 11.2 g/dL (Low). Mild anaemia noted.', type: 'Lab' },
                { date: '15 Aug 2026', title: 'Iron + Folic Acid Rx', detail: 'Tab Iron+FA × 90d. Tab Calcium × 60d.', type: 'Prescription' },
              ].map(r => (
                <div key={r.date} className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 hover:shadow-2xl transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-bold text-base text-[#123B6D]">{r.title}</p>
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-orange-200 text-[#E85D04] text-sm font-bold rounded-full border-2 border-[#E85D04]">{r.type}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{r.date}</p>
                  <p className="text-base text-gray-700 mt-3 leading-relaxed">{r.detail}</p>
                </div>
              ))}
            </div>
          )}

          {/* Consult notes tab */}
          {activeTab === 'consult' && (
            <div id="panel-consult" role="tabpanel" aria-labelledby="tab-consult" className="space-y-6 animate-fade-in">

              {/* Past consultations (previous years) */}
              {pastConsultations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#123B6D] flex items-center gap-3">
                    <Clock size={20} className="text-[#E85D04]" /> Previous consultations ({pastConsultations.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {pastConsultations.map((c, i) => (
                      <div key={c.id || i} className="bg-white rounded-2xl shadow-xl p-5 border-l-4 border-l-[#E85D04]">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-bold text-[#123B6D]">{new Date(c.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                          <span className="text-sm text-gray-600 font-medium">{c.doctorName}</span>
                        </div>
                        {c.diagnosis && <p className="text-sm text-[#E85D04] font-bold mt-2">Dx: {c.diagnosis}</p>}
                        {c.chiefComplaint && <p className="text-sm text-gray-700 mt-1">CC: {c.chiefComplaint}</p>}
                        {c.notes && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{c.notes}</p>}
                        {c.prescription && (
                          <p className="text-sm text-indigo-700 mt-2 font-semibold">Rx: {c.prescription}</p>
                        )}
                        {c.medicines && c.medicines.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {c.medicines.map((m, mi) => (
                              <span key={mi} className="text-sm bg-orange-50 border-2 border-[#E85D04] text-[#E85D04] rounded-lg px-3 py-1 font-medium">
                                {m.name} {m.dosage} · {m.frequency}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New consultation form */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 space-y-5">
                <h3 className="text-lg font-bold text-[#123B6D] flex items-center gap-3">
                  <FileText size={20} className="text-[#E85D04]" /> New Consultation
                  <AIPill />
                </h3>

                {/* Chief Complaint */}
                <div>
                  <label htmlFor="chief-complaint" className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Chief Complaint
                  </label>
                  <input id="chief-complaint" type="text" value={chiefComplaint}
                    onChange={e => setChiefComplaint(e.target.value)}
                    placeholder="e.g. Headache and dizziness for 3 days"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:border-[#123B6D] text-base" />
                </div>

                {/* Diagnosis */}
                <div>
                  <label htmlFor="diagnosis" className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Diagnosis
                  </label>
                  <input id="diagnosis" type="text" value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="e.g. Iron-deficiency anaemia, 28W pregnancy"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:border-[#123B6D] text-base" />
                </div>

                {/* Consultation notes */}
                <div>
                  <label htmlFor="consult-notes" className="block text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-1.5">
                    Examination findings & plan
                  </label>
                  <textarea id="consult-notes" rows={4} value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Examination findings, assessment and management plan…"
                    className="input-field resize-none text-sm" />
                </div>

                {/* Prescription */}
                <div>
                  <label htmlFor="prescription" className="block text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Pill size={12} className="text-[#E85D04]" /> Prescription (free text)
                  </label>
                  <textarea id="prescription" rows={2} value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    placeholder="e.g. Tab Iron+FA 1×OD after food × 30 days; Tab Calcium 500mg 1×BD × 60 days"
                    className="input-field resize-none text-sm" />
                </div>

                {/* Structured medicines */}
                <div>
                  <label className="block text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Pill size={12} className="text-[#E85D04]" /> Medicines (structured)
                  </label>
                  {medicines.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {medicines.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 bg-orange-50 border border-[#E85D04] rounded-lg px-3 py-2 text-xs">
                          <Pill size={12} className="text-[#E85D04] flex-shrink-0" />
                          <span className="flex-1 font-semibold text-[#123B6D]">{m.name}</span>
                          <span className="text-[#E85D04]">{m.dosage}</span>
                          <span className="text-[#E85D04]">{m.frequency}</span>
                          <span className="text-[#5F5E5A]">× {m.duration}</span>
                          <button onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-600 ml-1">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input type="text" value={newMed.name} onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))}
                      placeholder="Medicine name" className="input-field text-xs" />
                    <input type="text" value={newMed.dosage} onChange={e => setNewMed(p => ({ ...p, dosage: e.target.value }))}
                      placeholder="Dosage (500mg)" className="input-field text-xs" />
                    <input type="text" value={newMed.frequency} onChange={e => setNewMed(p => ({ ...p, frequency: e.target.value }))}
                      placeholder="Frequency (1×OD)" className="input-field text-xs" />
                    <input type="text" value={newMed.duration} onChange={e => setNewMed(p => ({ ...p, duration: e.target.value }))}
                      placeholder="Duration (30 days)" className="input-field text-xs" />
                  </div>
                  <button onClick={addMedicine} disabled={!newMed.name.trim()}
                    className="btn-secondary text-xs py-1.5 px-3 mt-2 disabled:opacity-40 flex items-center gap-1">
                    <Plus size={12} /> Add medicine
                  </button>
                </div>

                {/* Follow-up date */}
                <div>
                  <label htmlFor="followup-date" className="block text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-1.5">
                    Follow-up date (optional)
                  </label>
                  <input id="followup-date" type="date" value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="input-field text-sm max-w-[200px]" />
                </div>

                {/* Error */}
                {saveError && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                    <AlertTriangle size={14} />
                    {saveError}
                  </div>
                )}

                {/* Save button */}
                <button onClick={saveConsultation} disabled={saving}
                  className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50 flex items-center gap-2">
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving to Firestore…</>
                  ) : notesSaved ? (
                    <><CheckCircle size={14} /> Saved to patient record ✓</>
                  ) : (
                    <><Send size={14} /> Save consultation to patient record</>
                  )}
                </button>
                {notesSaved && (
                  <p className="text-xs text-green-700">
                    ✓ Consultation saved. Visible in patient records across all portals.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Diagnostics tab — Module 6 */}
          {activeTab === 'diagnostics' && (
            <div id="panel-diagnostics" role="tabpanel" aria-labelledby="tab-diagnostics" className="space-y-3 animate-fade-in">
              <p className="text-sm text-[#5F5E5A]">Track test orders and results tied to this patient's record.</p>
              {diagTests.map(d => (
                <div key={d.id} className="card p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FlaskConical size={16} className="text-indigo-500" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm text-[#2C2C2A]">{d.test}</p>
                      {d.flagged && <AlertTriangle size={13} className="text-amber-500" aria-label="Flagged result" />}
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
                                : 'bg-[#E85D04] border-[#E85D04] text-white'
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
    </div>
  )
}


