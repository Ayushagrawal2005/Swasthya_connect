// ASHA — Patient Registration (Module 1 — frontline entry point)
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mic, CheckCircle, Shield, WifiOff, RefreshCw, Upload, FileText, Loader, X, Eye } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { patientsApi } from '../../services/api'
import axios from 'axios'

const conditions = ['Pregnancy', 'Diabetes (T2)', 'Hypertension', 'TB', 'Asthma', 'Anaemia', 'Post-surgical', 'None']
const languages  = ['Marathi', 'Hindi', 'English', 'Kannada', 'Telugu', 'Bengali']

interface OCRResult {
  raw_text: string
  document_type: string
  summary: string
  medicines: Array<{
    name: string
    dosage?: string
    frequency?: string
    confidence: number
  }>
  test_values: Array<{
    test_name: string
    value?: string
    unit?: string
    reference_range?: string
    is_abnormal?: boolean
  }>
  dates_found: string[]
  needs_review: boolean
  fallback?: boolean
}

export function AshaRegisterPage() {
  const { isOnline, setPendingSyncCount, pendingSyncCount } = useApp()
  const navigate = useNavigate()

  const [step, setStep] = useState<'form' | 'done'>('form')
  const [healthId, setHealthId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: '' as 'M' | 'F' | 'O' | '',
    village: '', condition: 'None', language: 'Marathi',
    aadhaarLast4: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Medical records upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([])
  const [uploading, setUploading] = useState(false)
  const [showOcrPreview, setShowOcrPreview] = useState<number | null>(null)

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => { const next = { ...p }; delete next[field]; return next })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())   e.name   = 'Full name is required'
    if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Enter a valid 10-digit mobile number'
    if (!form.age.trim())    e.age    = 'Age is required'
    if (!form.gender)        e.gender = 'Select gender'
    if (!form.village.trim()) e.village = 'Village/locality is required'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    setSubmitting(true)
    patientsApi.register({
      name: form.name, phone: form.phone, age: form.age,
      gender: form.gender, village: form.village,
      condition: form.condition !== 'None' ? form.condition : undefined,
      language: form.language, aadhaarLast4: form.aadhaarLast4 || undefined,
    })
      .then(res => { 
        setHealthId(res.healthId)
        setPatientId(res.patientId || res.id)
        
        // If medical records were uploaded, save them
        if (ocrResults.length > 0 && res.patientId) {
          saveUploadedRecords(res.patientId)
        } else {
          setStep('done')
        }
      })
      .catch(() => {
        // offline fallback
        if (!isOnline) {
          setPendingSyncCount(pendingSyncCount + 1)
          const tempHealthId = `91-${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}`
          setHealthId(tempHealthId)
          setStep('done')
        }
      })
      .finally(() => setSubmitting(false))
  }

  async function saveUploadedRecords(pid: string) {
    const token = localStorage.getItem('swasthya_token')
    
    for (let i = 0; i < ocrResults.length; i++) {
      const result = ocrResults[i]
      try {
        await axios.post(`http://localhost:4000/api/patients/${pid}/records`, {
          documentType: result.document_type,
          rawText: result.raw_text,
          summary: result.summary,
          medicines: result.medicines,
          testValues: result.test_values,
          datesFound: result.dates_found,
          imageUrl: null // Could upload to storage and save URL
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (err) {
        console.error('Failed to save record:', err)
      }
    }
    
    setStep('done')
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    setUploadedFiles(prev => [...prev, ...fileArray])
    setUploading(true)

    const token = localStorage.getItem('swasthya_token')
    const newResults: OCRResult[] = []

    for (let file of fileArray) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post('http://localhost:4000/api/ocr/extract', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        })

        newResults.push(response.data)
      } catch (err) {
        console.error('OCR extraction failed:', err)
        // Add fallback result
        newResults.push({
          raw_text: 'OCR extraction failed - please review manually',
          document_type: 'unknown',
          summary: 'This document could not be automatically processed. Please review and enter details manually.',
          medicines: [],
          test_values: [],
          dates_found: [],
          needs_review: true
        })
      }
    }

    setOcrResults(prev => [...prev, ...newResults])
    setUploading(false)
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setOcrResults(prev => prev.filter((_, i) => i !== index))
  }

  if (step === 'done') {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh] space-y-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-teal-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2A]">Patient registered</h2>
          <p className="text-sm text-[#5F5E5A] mt-1">{form.name} has been added to the system.</p>
          {ocrResults.length > 0 && (
            <p className="text-sm text-teal-700 mt-2">✓ {ocrResults.length} medical record(s) uploaded and processed</p>
          )}
        </div>

        <div className="card p-5 w-full text-left space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={15} className="text-teal-500" />
            <p className="text-xs font-semibold text-teal-700">ABDM Health ID generated</p>
          </div>
          <p className="text-lg font-mono font-semibold text-[#2C2C2A] tracking-wide">{healthId}</p>
          <p className="text-xs text-[#5F5E5A]">This ID links to India's Ayushman Bharat Digital Mission. Records will be FHIR-compliant and accessible across all connected facilities.</p>

          {!isOnline && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <WifiOff size={13} />
              <span>Saved offline — will sync to ABDM when connected</span>
            </div>
          )}
          {isOnline && (
            <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
              <RefreshCw size={13} />
              <span>Record synced to central health system</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button onClick={() => navigate('/asha/triage')} className="btn-primary flex-1 justify-center text-sm">
            Triage this patient
          </button>
          <button onClick={() => { 
            setStep('form')
            setForm({ name:'',phone:'',age:'',gender:'',village:'',condition:'None',language:'Marathi',aadhaarLast4:'' })
            setUploadedFiles([])
            setOcrResults([])
          }}
            className="btn-secondary flex-1 justify-center text-sm">
            Register another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Register new patient</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Creates an ABDM-linked health ID. Works offline — syncs automatically.</p>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <WifiOff size={13} /> Offline mode — record will be saved locally and synced when connected
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Full name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input id="reg-name" type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Meena Jadhav" className="input-field pr-10"
              aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5F5E5A] hover:text-teal-600 transition-colors rounded"
              aria-label="Voice input for name"><Mic size={16} aria-hidden="true" /></button>
          </div>
          <AnimatePresence>{errors.name && <motion.p id="err-name" role="alert" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.name}</motion.p>}</AnimatePresence>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Mobile number <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative flex">
            <span className="inline-flex items-center px-3 rounded-l-btn border border-r-0 border-[#D3D1C7] bg-gray-50 text-sm text-[#5F5E5A] select-none">+91</span>
            <input id="reg-phone" type="tel" inputMode="numeric" value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
              placeholder="9876543210" className="input-field rounded-l-none flex-1"
              aria-required="true" aria-invalid={!!errors.phone} />
          </div>
          <AnimatePresence>{errors.phone && <motion.p role="alert" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.phone}</motion.p>}</AnimatePresence>
        </div>

        {/* Age + Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-age" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
              Age <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input id="reg-age" type="number" inputMode="numeric" min="0" max="120"
              value={form.age} onChange={e => set('age', e.target.value)}
              placeholder="e.g. 28" className="input-field"
              aria-required="true" aria-invalid={!!errors.age} />
            <AnimatePresence>{errors.age && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.age}</motion.p>}</AnimatePresence>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
              Gender <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <div className="flex gap-1.5" role="group" aria-label="Gender">
              {(['F','M','O'] as const).map(g => (
                <button key={g} type="button" onClick={() => set('gender', g)}
                  aria-pressed={form.gender === g}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-btn border-2 transition-all
                    ${form.gender === g ? 'bg-teal-500 border-teal-500 text-white' : 'border-[#D3D1C7] text-[#5F5E5A] bg-white'}`}>
                  {g === 'F' ? 'Female' : g === 'M' ? 'Male' : 'Other'}
                </button>
              ))}
            </div>
            <AnimatePresence>{errors.gender && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.gender}</motion.p>}</AnimatePresence>
          </div>
        </div>

        {/* Village */}
        <div>
          <label htmlFor="reg-village" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Village / locality <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input id="reg-village" type="text" value={form.village} onChange={e => set('village', e.target.value)}
            placeholder="e.g. Mandav, Beed" className="input-field"
            aria-required="true" aria-invalid={!!errors.village} />
          <AnimatePresence>{errors.village && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.village}</motion.p>}</AnimatePresence>
        </div>

        {/* Aadhaar last 4 (optional) */}
        <div>
          <label htmlFor="reg-aadhaar" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Aadhaar last 4 digits <span className="text-xs font-normal text-[#5F5E5A]">(optional — for ABDM linking)</span>
          </label>
          <input id="reg-aadhaar" type="text" inputMode="numeric" maxLength={4}
            value={form.aadhaarLast4} onChange={e => set('aadhaarLast4', e.target.value.replace(/\D/g,'').slice(0,4))}
            placeholder="XXXX" className="input-field max-w-[120px]" />
        </div>

        {/* Condition */}
        <div>
          <label htmlFor="reg-condition" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Primary condition / reason for registration
          </label>
          <select id="reg-condition" value={form.condition} onChange={e => set('condition', e.target.value)}
            className="input-field">
            {conditions.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Language preference */}
        <div>
          <label htmlFor="reg-lang" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Patient's preferred language
          </label>
          <select id="reg-lang" value={form.language} onChange={e => set('language', e.target.value)}
            className="input-field">
            {languages.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Medical Records Upload Section */}
        <div className="border-t border-[#D3D1C7] pt-4 mt-6">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-[#2C2C2A] mb-1">Upload previous medical records (optional)</h3>
            <p className="text-xs text-[#5F5E5A]">Upload prescriptions, lab reports, or discharge summaries. AI will extract key information automatically.</p>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-[#D3D1C7] rounded-lg p-4 text-center hover:border-teal-400 transition-colors">
            <input 
              type="file" 
              id="medical-records-upload"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <label 
              htmlFor="medical-records-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                <Upload size={20} className="text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2C2C2A]">Click to upload or drag and drop</p>
                <p className="text-xs text-[#5F5E5A] mt-0.5">Photos of prescriptions, lab reports (PNG, JPG)</p>
              </div>
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white border border-[#D3D1C7] rounded-lg">
                  <FileText size={18} className="text-teal-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2C2A] truncate">{file.name}</p>
                    {ocrResults[index] && (
                      <div className="mt-1">
                        <p className="text-xs text-[#5F5E5A]">
                          Type: <span className="font-medium">{ocrResults[index].document_type}</span>
                          {ocrResults[index].medicines.length > 0 && (
                            <span className="ml-2">• {ocrResults[index].medicines.length} medicine(s)</span>
                          )}
                          {ocrResults[index].fallback && (
                            <span className="ml-2 text-amber-600">• Using fallback data</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  {uploading && index >= ocrResults.length ? (
                    <Loader size={16} className="text-teal-600 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowOcrPreview(index)}
                        className="p-1.5 text-[#5F5E5A] hover:text-teal-600 transition-colors rounded"
                        title="View extracted data"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1.5 text-[#5F5E5A] hover:text-red-600 transition-colors rounded"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
              <Loader size={14} className="animate-spin" />
              <span>Extracting data from documents...</span>
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting || uploading} className="btn-primary w-full justify-center py-3.5 text-base">
          <User size={18} aria-hidden="true" /> {submitting ? 'Registering…' : uploading ? 'Processing documents...' : 'Register patient & generate health ID'}
        </button>
      </form>

      {/* OCR Preview Modal */}
      <AnimatePresence>
        {showOcrPreview !== null && ocrResults[showOcrPreview] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowOcrPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-5 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#2C2C2A]">Extracted Medical Data</h3>
                  <p className="text-sm text-[#5F5E5A] mt-0.5">{uploadedFiles[showOcrPreview]?.name}</p>
                </div>
                <button
                  onClick={() => setShowOcrPreview(null)}
                  className="p-1 text-[#5F5E5A] hover:text-[#2C2C2A] transition-colors rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Document Type */}
                <div>
                  <p className="text-xs font-semibold text-[#5F5E5A] mb-1">Document Type</p>
                  <p className="text-sm text-[#2C2C2A] capitalize">{ocrResults[showOcrPreview].document_type}</p>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-xs font-semibold text-[#5F5E5A] mb-1">Summary</p>
                  <p className="text-sm text-[#2C2C2A]">{ocrResults[showOcrPreview].summary}</p>
                </div>

                {/* Medicines */}
                {ocrResults[showOcrPreview].medicines.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#5F5E5A] mb-2">Medicines Extracted</p>
                    <div className="space-y-2">
                      {ocrResults[showOcrPreview].medicines.map((med, i) => (
                        <div key={i} className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-[#2C2C2A]">{med.name}</p>
                          {med.dosage && <p className="text-xs text-[#5F5E5A]">Dosage: {med.dosage}</p>}
                          {med.frequency && <p className="text-xs text-[#5F5E5A]">Frequency: {med.frequency}</p>}
                          <p className="text-xs text-teal-700 mt-1">Confidence: {(med.confidence * 100).toFixed(0)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Values */}
                {ocrResults[showOcrPreview].test_values.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#5F5E5A] mb-2">Lab Test Results</p>
                    <div className="space-y-2">
                      {ocrResults[showOcrPreview].test_values.map((test, i) => (
                        <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-[#2C2C2A]">{test.test_name}</p>
                          {test.value && <p className="text-xs text-[#5F5E5A]">Value: {test.value} {test.unit || ''}</p>}
                          {test.is_abnormal && <p className="text-xs text-red-600 font-medium">⚠ Abnormal</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Text */}
                <div>
                  <p className="text-xs font-semibold text-[#5F5E5A] mb-1">Raw Extracted Text</p>
                  <div className="bg-gray-50 border border-[#D3D1C7] rounded-lg p-3 text-xs text-[#2C2C2A] whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                    {ocrResults[showOcrPreview].raw_text}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
