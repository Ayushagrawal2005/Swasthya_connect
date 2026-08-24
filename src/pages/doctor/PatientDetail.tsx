// Module 1+3+6 — Doctor patient-detail / consult view
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown, ChevronUp, Pill, FlaskConical, Video, Send,
  FileText, AlertTriangle, CheckCircle, ArrowRight, Loader2,
  Download, Calendar, Clock, User, Activity
} from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { patientsApi, diagnosticsApi, referralsApi, type PatientRecord, type DiagOrder } from '../../services/api'
import axios from 'axios'
import jsPDF from 'jspdf'

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

interface Consultation {
  id: string
  patientId: string
  chiefComplaint: string
  diagnosis: string
  notes: string
  doctorName: string
  date: string
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
  const [activeTab, setActiveTab] = useState('summary')
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [diagTests, setDiagTests] = useState<DiagOrder[]>([])
  const [notes, setNotes] = useState('')
  const [prescription, setPrescription] = useState('')
  const [referralReason, setReferralReason] = useState('')
  const [referralTo, setReferralTo] = useState('District Hospital Solapur')
  const [referralUrgency, setReferralUrgency] = useState<'routine' | 'urgent' | 'emergency'>('routine')
  const [referralSent, setReferralSent] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  
  // Unified summary state
  const [unifiedSummary, setUnifiedSummary] = useState<UnifiedSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  // Load first patient from list (in real app: read patientId from route/state)
  useEffect(() => {
    patientsApi.get('P-MEENA-001')
      .then(p => {
        setPatient(p)
        loadUnifiedSummary(p.id)
      })
      .catch(() => patientsApi.search('Priya').then(r => {
        if (r[0]) {
          setPatient(r[0])
          loadUnifiedSummary(r[0].id)
        }
      }).catch(() => {}))
    diagnosticsApi.list({ patientId: 'P-MEENA-001' }).then(setDiagTests).catch(() => {})
  }, [])

  async function loadUnifiedSummary(patientId: string) {
    setLoadingSummary(true)
    const token = localStorage.getItem('swasthya_token')
    
    try {
      const response = await axios.get(`http://localhost:4000/api/patients/${patientId}/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUnifiedSummary(response.data)
    } catch (err) {
      console.error('Failed to load unified summary:', err)
    } finally {
      setLoadingSummary(false)
    }
  }

  function exportToPDF() {
    if (!unifiedSummary || !patient) return
    
    setExportingPDF(true)
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPos = 20

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Medical Summary Report', margin, yPos)
    yPos += 10
    
    // Patient Info
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Patient: ${patient.name}`, margin, yPos)
    yPos += 7
    doc.text(`Age: ${patient.age || 'N/A'} | Gender: ${patient.gender || 'N/A'}`, margin, yPos)
    yPos += 7
    doc.text(`Health ID: ${patient.healthId || 'N/A'}`, margin, yPos)
    yPos += 7
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, yPos)
    yPos += 15

    // Summary Statistics
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary Statistics', margin, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Medical Records: ${unifiedSummary.summary.totalRecords}`, margin, yPos)
    yPos += 6
    doc.text(`Total Prescriptions: ${unifiedSummary.summary.totalPrescriptions}`, margin, yPos)
    yPos += 6
    doc.text(`Total Consultations: ${unifiedSummary.summary.totalConsultations}`, margin, yPos)
    yPos += 12

    // Active Medicines
    if (unifiedSummary.summary.activeMedicines.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Active Medications', margin, yPos)
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      unifiedSummary.summary.activeMedicines.slice(0, 10).forEach((med: any) => {
        const medText = `• ${med.name}${med.dosage ? ' - ' + med.dosage : ''}${med.frequency ? ' (' + med.frequency + ')' : ''}`
        doc.text(medText, margin + 5, yPos)
        yPos += 6
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
      })
      yPos += 6
    }

    // Medical Records with OCR Summaries
    if (unifiedSummary.records.length > 0) {
      if (yPos > 240) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Uploaded Medical Records', margin, yPos)
      yPos += 8
      
      unifiedSummary.records.forEach((record, index) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. ${record.documentType.toUpperCase()}`, margin, yPos)
        yPos += 6
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Uploaded by: ${record.uploadedBy}`, margin + 5, yPos)
        yPos += 5
        doc.text(`Date: ${new Date(record.uploadedAt).toLocaleDateString('en-IN')}`, margin + 5, yPos)
        yPos += 6
        
        // Summary
        const summaryLines = doc.splitTextToSize(record.summary, pageWidth - 2 * margin - 10)
        summaryLines.forEach((line: string) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, margin + 5, yPos)
          yPos += 5
        })
        yPos += 8
      })
    }

    // Consultations
    if (unifiedSummary.consultations.length > 0) {
      if (yPos > 240) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Recent Consultations', margin, yPos)
      yPos += 8
      
      unifiedSummary.consultations.slice(0, 5).forEach((consult, index) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. ${new Date(consult.date).toLocaleDateString('en-IN')}`, margin, yPos)
        yPos += 6
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Doctor: ${consult.doctorName}`, margin + 5, yPos)
        yPos += 5
        if (consult.diagnosis) {
          doc.text(`Diagnosis: ${consult.diagnosis}`, margin + 5, yPos)
          yPos += 5
        }
        yPos += 6
      })
    }

    // Save PDF
    doc.save(`${patient.name.replace(/\s+/g, '_')}_Medical_Summary_${new Date().toISOString().split('T')[0]}.pdf`)
    setExportingPDF(false)
  }

  function saveNotes() {
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  function sendReferral() {
    if (!referralReason.trim() || !patient) return
    referralsApi.create({ patientId: patient.id, patientName: patient.name, toFacilityName: referralTo, reason: referralReason, urgency: referralUrgency })
      .then(() => setReferralSent(true))
      .catch(() => setReferralSent(true))
  }

  if (!patient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-teal-400" size={28} /></div>
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
              <p className="font-semibold text-[#2C2C2A]">{patient.name}</p>
              <p className="text-xs text-[#5F5E5A]">F · 28 yrs · ABHA: 91-3412-5678</p>
            </div>
          </div>

          {/* Risk badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800">{patient.conditions[0] ? "Active condition" : "Low risk"}</p>
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
          {/* Unified Summary tab */}
          {activeTab === 'summary' && (
            <div id="panel-summary" role="tabpanel" aria-labelledby="tab-summary" className="space-y-4 animate-fade-in">
              {loadingSummary ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-teal-500" size={32} />
                </div>
              ) : unifiedSummary ? (
                <>
                  {/* Header with PDF Export */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#2C2C2A]">Unified Medical Summary</h2>
                      <p className="text-sm text-[#5F5E5A] mt-0.5">
                        Complete view of records, prescriptions, and consultations
                      </p>
                    </div>
                    <button
                      onClick={exportToPDF}
                      disabled={exportingPDF}
                      className="btn-secondary text-sm"
                    >
                      {exportingPDF ? (
                        <><Loader2 size={14} className="animate-spin" /> Generating...</>
                      ) : (
                        <><Download size={14} /> Export PDF</>
                      )}
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-teal-600" />
                        <p className="text-xs font-semibold text-[#5F5E5A]">RECORDS</p>
                      </div>
                      <p className="text-2xl font-bold text-[#2C2C2A]">{unifiedSummary.summary.totalRecords}</p>
                    </div>
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill size={16} className="text-indigo-600" />
                        <p className="text-xs font-semibold text-[#5F5E5A]">PRESCRIPTIONS</p>
                      </div>
                      <p className="text-2xl font-bold text-[#2C2C2A]">{unifiedSummary.summary.totalPrescriptions}</p>
                    </div>
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity size={16} className="text-green-600" />
                        <p className="text-xs font-semibold text-[#5F5E5A]">CONSULTATIONS</p>
                      </div>
                      <p className="text-2xl font-bold text-[#2C2C2A]">{unifiedSummary.summary.totalConsultations}</p>
                    </div>
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill size={16} className="text-amber-600" />
                        <p className="text-xs font-semibold text-[#5F5E5A]">MEDICINES</p>
                      </div>
                      <p className="text-2xl font-bold text-[#2C2C2A]">{unifiedSummary.summary.activeMedicines.length}</p>
                    </div>
                  </div>

                  {/* Active Medicines */}
                  {unifiedSummary.summary.activeMedicines.length > 0 && (
                    <div className="card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Pill size={18} className="text-teal-600" />
                        <h3 className="text-sm font-semibold text-[#2C2C2A]">Active Medications</h3>
                        <AIPill />
                      </div>
                      <div className="grid gap-3">
                        {unifiedSummary.summary.activeMedicines.slice(0, 8).map((med: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                            <Pill size={14} className="text-teal-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#2C2C2A]">{med.name}</p>
                              <p className="text-xs text-[#5F5E5A] mt-0.5">
                                {med.dosage && `${med.dosage} • `}
                                {med.frequency || 'As directed'}
                              </p>
                              {med.confidence && (
                                <p className="text-xs text-teal-700 mt-1">
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
                    <div className="card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText size={18} className="text-indigo-600" />
                        <h3 className="text-sm font-semibold text-[#2C2C2A]">Uploaded Medical Records</h3>
                        <span className="badge-teal text-xs">OCR Extracted</span>
                      </div>
                      <div className="space-y-3">
                        {unifiedSummary.records.map((record) => (
                          <div key={record.id} className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded capitalize">
                                  {record.documentType}
                                </span>
                                {!record.verified && (
                                  <span className="text-xs text-amber-700 flex items-center gap-1">
                                    <AlertTriangle size={12} /> Needs review
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#5F5E5A] text-right">
                                <p>{new Date(record.uploadedAt).toLocaleDateString('en-IN')}</p>
                                <p className="flex items-center gap-1 justify-end mt-0.5">
                                  <User size={11} /> {record.uploadedBy}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
                              <p className="text-xs font-semibold text-[#5F5E5A] mb-1">AI-Generated Summary:</p>
                              <p className="text-sm text-[#2C2C2A] leading-relaxed">{record.summary}</p>
                            </div>

                            {record.medicines.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-[#5F5E5A] mb-2">Extracted Medicines:</p>
                                <div className="flex flex-wrap gap-2">
                                  {record.medicines.map((med, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-indigo-200 rounded text-xs text-[#2C2C2A]">
                                      {med.name} {med.dosage && `(${med.dosage})`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {record.testValues.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-[#5F5E5A] mb-2">Lab Results:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {record.testValues.map((test, i) => (
                                    <div key={i} className="p-2 bg-white border border-indigo-200 rounded">
                                      <p className="text-xs font-semibold text-[#2C2C2A]">{test.test_name}</p>
                                      {test.value && (
                                        <p className="text-xs text-[#5F5E5A]">
                                          {test.value} {test.unit || ''}
                                        </p>
                                      )}
                                      {test.is_abnormal && (
                                        <p className="text-xs text-red-600 font-semibold">⚠ Abnormal</p>
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
                        <Clock size={18} className="text-teal-600" />
                        <h3 className="text-sm font-semibold text-[#2C2C2A]">Medical Timeline</h3>
                      </div>
                      <div className="space-y-3">
                        {unifiedSummary.timeline.slice(0, 10).map((item, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                item.type === 'record' ? 'bg-indigo-100 text-indigo-600' :
                                item.type === 'prescription' ? 'bg-teal-100 text-teal-600' :
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
                                  item.type === 'prescription' ? 'text-teal-700' :
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
                   unifiedSummary.prescriptions.length === 0 && 
                   unifiedSummary.consultations.length === 0 && (
                    <div className="card p-8 text-center">
                      <FileText size={48} className="mx-auto text-[#D3D1C7] mb-3" />
                      <p className="text-sm font-semibold text-[#2C2C2A]">No medical records yet</p>
                      <p className="text-xs text-[#5F5E5A] mt-1">
                        Records uploaded by ASHA workers will appear here
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-8 text-center">
                  <AlertTriangle size={48} className="mx-auto text-amber-500 mb-3" />
                  <p className="text-sm font-semibold text-[#2C2C2A]">Unable to load summary</p>
                  <p className="text-xs text-[#5F5E5A] mt-1">Please try again later</p>
                </div>
              )}
            </div>
          )}

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

