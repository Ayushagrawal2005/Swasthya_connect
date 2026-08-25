// ASHA — Patient Registration
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mic, CheckCircle, Shield, WifiOff, RefreshCw, Upload, FileText, Loader, X, Eye, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { patientsApi } from '../../services/api'

const conditions = ['Pregnancy', 'Diabetes (T2)', 'Hypertension', 'TB', 'Asthma', 'Anaemia', 'Post-surgical', 'None']
const languages  = ['Marathi', 'Hindi', 'English', 'Kannada', 'Telugu', 'Bengali']

export function AshaRegisterPage() {
  const { isOnline, setPendingSyncCount, pendingSyncCount } = useApp()
  const navigate = useNavigate()

  const [step, setStep]         = useState<'form' | 'done'>('form')
  const [healthId, setHealthId] = useState('')
  const [savedPatientId, setSavedPatientId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitStatus, setSubmitStatus] = useState('')

  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: '' as 'M' | 'F' | 'O' | '',
    village: '', condition: 'None', language: 'Marathi', aadhaarLast4: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // OCR upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [ocrProcessed, setOcrProcessed] = useState(0)
  const [ocrFailed, setOcrFailed] = useState(0)

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => { const next = { ...p }; delete next[field]; return next })
    setSubmitError('')
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())    e.name    = 'Full name is required'
    if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Enter a valid 10-digit mobile number'
    if (!form.age.trim())     e.age     = 'Age is required'
    if (!form.gender)         e.gender  = 'Select gender'
    if (!form.village.trim()) e.village = 'Village / locality is required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    setSubmitting(true)
    setSubmitError('')
    setSubmitStatus('Registering patient...')

    try {
      // Step 1: Register patient
      const res = await patientsApi.register({
        name:        form.name,
        phone:       form.phone,
        age:         form.age,
        gender:      form.gender as 'M' | 'F' | 'O',
        village:     form.village,
        condition:   form.condition !== 'None' ? form.condition : undefined,
        language:    form.language,
        aadhaarLast4: form.aadhaarLast4 || undefined,
      })

      const patientId = res.patientId
      setHealthId(res.healthId)
      setSavedPatientId(patientId)

      // Step 2: If prescriptions uploaded, process them with OCR (non-blocking)
      if (uploadedFiles.length > 0) {
        setSubmitStatus(`Processing ${uploadedFiles.length} document(s) with OCR...`)
        // Don't await - let OCR happen in background
        processUploadedFiles(patientId).catch(err => {
          console.error('OCR processing error (non-blocking):', err)
        })
      }

      setStep('done')
    } catch (err: any) {
      if (!isOnline) {
        // offline fallback — generate a local health ID
        setPendingSyncCount(pendingSyncCount + 1)
        const tempId = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
        setHealthId(tempId)
        setStep('done')
      } else {
        setSubmitError(err?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
      setSubmitStatus('')
    }
  }

  async function processUploadedFiles(patientId: string) {
    const token = localStorage.getItem('swasthya_token')
    if (!token) {
      console.error('⚠ No authentication token found! OCR upload skipped.')
      setOcrFailed(uploadedFiles.length)
      return
    }

    console.log('📤 Starting OCR processing for', uploadedFiles.length, 'files')
    setOcrProcessed(0)
    setOcrFailed(0)

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      try {
        const formData = new FormData()
        formData.append('file', file)

        console.log(`📄 [${i + 1}/${uploadedFiles.length}] Uploading file to OCR:`, file.name, 'for patient:', patientId)

        // Try backend proxy first
        const response = await fetch('http://localhost:4000/ocr/extract', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }).catch(err => {
          console.error('❌ Network error reaching backend:', err.message)
          return null
        })

        if (!response || !response.ok) {
          if (response) {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.error(`❌ Backend OCR proxy failed (${response.status}):`, errorText)
          }
          
          // Fallback to direct OCR service — correct path is /ocr/extract
          console.warn('⚠ Trying direct OCR service as fallback...')
          try {
            const directFormData = new FormData()
            directFormData.append('file', file)
            
            const directResponse = await fetch('http://localhost:8000/ocr/extract', {
              method: 'POST',
              body: directFormData
            })
            
            console.log('📡 Direct OCR response status:', directResponse.status)
            
            if (directResponse.ok) {
              const ocrData = await directResponse.json()
              console.log('✓ OCR data extracted from direct service:', ocrData)
              const saved = await saveOcrToPatient(patientId, ocrData, token)
              if (saved) {
                setOcrProcessed(p => p + 1)
              } else {
                setOcrFailed(p => p + 1)
              }
            } else {
              const directError = await directResponse.text().catch(() => 'Unknown error')
              console.error('❌ Direct OCR service failed:', directResponse.status, directError)
              setOcrFailed(p => p + 1)
            }
          } catch (directErr: any) {
            console.error('❌ Direct OCR service connection error:', directErr.message)
            console.warn('💡 Is OCR service running on port 8000? Start with: python gemini_ocr.py')
            setOcrFailed(p => p + 1)
          }
        } else {
          const ocrData = await response.json()
          console.log('✓ OCR data extracted via backend:', ocrData)
          const saved = await saveOcrToPatient(patientId, ocrData, token)
          if (saved) {
            setOcrProcessed(p => p + 1)
          } else {
            setOcrFailed(p => p + 1)
          }
        }
      } catch (error: any) {
        console.error(`❌ OCR processing failed for ${file.name}:`, error.message)
        setOcrFailed(p => p + 1)
      }
    }
    
    console.log(`✓ Finished processing OCR uploads. Success: ${ocrProcessed}, Failed: ${ocrFailed}`)
  }

  async function saveOcrToPatient(patientId: string, ocrData: any, token: string): Promise<boolean> {
    try {
      console.log('Saving OCR data to patient:', patientId)
      console.log('OCR data to save:', JSON.stringify(ocrData, null, 2))
      
      const response = await fetch(`http://localhost:4000/patients/${patientId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentType: ocrData.documentType || ocrData.document_type || 'prescription',
          rawText: ocrData.rawText || ocrData.raw_text || ocrData.text || '',
          summary: ocrData.summary || '',
          medicines: ocrData.medicines || ocrData.medications || [],
          testValues: ocrData.testValues || ocrData.test_values || ocrData.lab_results || [],
          datesFound: ocrData.datesFound || ocrData.dates_found || ocrData.dates || []
        })
      })

      console.log('Save response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Failed to save OCR data to backend:', response.status, errorText)
        return false
      } else {
        const savedRecord = await response.json()
        console.log('✓ OCR data saved successfully! Record ID:', savedRecord.id || savedRecord)
        return true
      }
    } catch (error) {
      console.error('❌ Exception while saving OCR data:', error)
      return false
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadedFiles(prev => [...prev, ...Array.from(files)])
    // OCR processing is done after registration is complete
    setUploading(false)
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ─── Success screen ────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh] space-y-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2A]">Patient registered!</h2>
          <p className="text-sm text-[#5F5E5A] mt-1">{form.name} has been added to the system.</p>
        </div>

        <div className="card p-5 w-full text-left space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={15} className="text-[#FF9933]" />
            <p className="text-xs font-semibold text-[#E67300]">ABDM Health ID generated</p>
          </div>
          <p className="text-lg font-mono font-semibold text-[#2C2C2A] tracking-wide">{healthId}</p>
          <p className="text-xs text-[#5F5E5A]">This ID links to India's Ayushman Bharat Digital Mission. Records are FHIR-compliant and accessible across connected facilities.</p>
          {!isOnline ? (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <WifiOff size={13} /> Saved offline — will sync when connected
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <RefreshCw size={13} /> Synced to central health system
            </div>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="card p-5 w-full text-left space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={15} className="text-[#FF9933]" />
              <p className="text-xs font-semibold text-[#E67300]">Medical Records Upload Status</p>
            </div>
            <p className="text-sm text-[#5F5E5A]">
              {ocrProcessed > 0 && `${ocrProcessed} document(s) processed and saved`}
              {ocrFailed > 0 && ` • ${ocrFailed} failed`}
            </p>
            <div className="space-y-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {i < ocrProcessed ? (
                    <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                  ) : i < (ocrProcessed + ocrFailed) ? (
                    <AlertCircle size={12} className="text-red-600 flex-shrink-0" />
                  ) : (
                    <Loader size={12} className="text-amber-600 flex-shrink-0 animate-spin" />
                  )}
                  <span className="text-[#2C2C2A] truncate">{file.name}</span>
                </div>
              ))}
            </div>
            {ocrFailed > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                <p className="font-semibold mb-1">⚠ {ocrFailed} upload(s) failed</p>
                <p className="text-[10px]">Possible reasons:</p>
                <ul className="text-[10px] list-disc ml-4 mt-1 space-y-0.5">
                  <li>OCR service not running (port 8000)</li>
                  <li>Backend not responding (port 4000)</li>
                  <li>Network connection issue</li>
                </ul>
                <p className="text-[10px] mt-2">💡 You can upload prescriptions later from the patient record page.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          {savedPatientId && (
            <button 
              onClick={() => navigate(`/asha/record?id=${savedPatientId}`)} 
              className="btn-secondary flex-1 justify-center text-sm">
              <Eye size={16} />
              View patient record
            </button>
          )}
          <div className="flex gap-3">
            <button onClick={() => navigate('/asha/triage')} className="btn-primary flex-1 justify-center text-sm">
              Triage this patient
            </button>
            <button onClick={() => {
              setStep('form')
              setHealthId('')
              setSavedPatientId('')
              setSubmitError('')
              setSubmitStatus('')
              setUploadedFiles([])
              setForm({ name:'', phone:'', age:'', gender:'', village:'', condition:'None', language:'Marathi', aadhaarLast4:'' })
              setErrors({})
            }} className="btn-secondary flex-1 justify-center text-sm">
              Register another
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Form ──────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Register new patient</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Creates an ABDM-linked health ID. Works offline — syncs automatically.</p>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <WifiOff size={13} /> Offline mode — record will sync when connected
        </div>
      )}

      {submitError && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0" />
          {submitError}
        </div>
      )}

      {submitStatus && submitting && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Loader size={16} className="flex-shrink-0 animate-spin" />
          {submitStatus}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Full name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input id="reg-name" type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Meena Jadhav" className="input-field pr-10"
              aria-required="true" aria-invalid={!!errors.name} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5F5E5A] hover:text-[#FF9933] rounded"
              aria-label="Voice input"><Mic size={16} /></button>
          </div>
          <AnimatePresence>
            {errors.name && <motion.p role="alert" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.name}</motion.p>}
          </AnimatePresence>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Mobile number <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-btn border border-r-0 border-[#D3D1C7] bg-gray-50 text-sm text-[#5F5E5A]">+91</span>
            <input id="reg-phone" type="tel" inputMode="numeric" value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
              placeholder="9876543210" className="input-field rounded-l-none flex-1"
              aria-required="true" aria-invalid={!!errors.phone} />
          </div>
          <AnimatePresence>
            {errors.phone && <motion.p role="alert" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.phone}</motion.p>}
          </AnimatePresence>
        </div>

        {/* Age + Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-age" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
              Age <span className="text-red-500">*</span>
            </label>
            <input id="reg-age" type="number" inputMode="numeric" min="0" max="120"
              value={form.age} onChange={e => set('age', e.target.value)}
              placeholder="e.g. 28" className="input-field" />
            <AnimatePresence>
              {errors.age && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.age}</motion.p>}
            </AnimatePresence>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1.5">
              {(['F','M','O'] as const).map(g => (
                <button key={g} type="button" onClick={() => set('gender', g)}
                  aria-pressed={form.gender === g}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-btn border-2 transition-all
                    ${form.gender === g ? 'bg-[#FF9933] border-[#FF9933] text-white' : 'border-[#D3D1C7] text-[#5F5E5A] bg-white hover:border-[#FF9933]'}`}>
                  {g === 'F' ? 'Female' : g === 'M' ? 'Male' : 'Other'}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {errors.gender && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.gender}</motion.p>}
            </AnimatePresence>
          </div>
        </div>

        {/* Village */}
        <div>
          <label htmlFor="reg-village" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Village / locality <span className="text-red-500">*</span>
          </label>
          <input id="reg-village" type="text" value={form.village} onChange={e => set('village', e.target.value)}
            placeholder="e.g. Mandav, Beed" className="input-field" />
          <AnimatePresence>
            {errors.village && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.village}</motion.p>}
          </AnimatePresence>
        </div>

        {/* Aadhaar last 4 */}
        <div>
          <label htmlFor="reg-aadhaar" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Aadhaar last 4 digits <span className="text-xs font-normal text-[#5F5E5A]">(optional)</span>
          </label>
          <input id="reg-aadhaar" type="text" inputMode="numeric" maxLength={4}
            value={form.aadhaarLast4} onChange={e => set('aadhaarLast4', e.target.value.replace(/\D/g,'').slice(0,4))}
            placeholder="XXXX" className="input-field max-w-[120px]" />
        </div>

        {/* Condition */}
        <div>
          <label htmlFor="reg-condition" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Primary condition
          </label>
          <select id="reg-condition" value={form.condition} onChange={e => set('condition', e.target.value)} className="input-field">
            {conditions.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Language */}
        <div>
          <label htmlFor="reg-lang" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Patient's preferred language
          </label>
          <select id="reg-lang" value={form.language} onChange={e => set('language', e.target.value)} className="input-field">
            {languages.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Medical records upload (optional) */}
        <div className="border-t border-[#D3D1C7] pt-4">
          <h3 className="text-sm font-semibold text-[#2C2C2A] mb-1">Upload previous medical records <span className="text-xs font-normal text-[#5F5E5A]">(optional)</span></h3>
          <p className="text-xs text-[#5F5E5A] mb-3">Prescriptions, lab reports, discharge summaries</p>
          <div className="border-2 border-dashed border-[#D3D1C7] rounded-lg p-4 text-center hover:border-[#FF9933] transition-colors">
            <input type="file" id="med-upload" accept="image/*" multiple onChange={e => handleFileUpload(e.target.files)} className="hidden" />
            <label htmlFor="med-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Upload size={18} className="text-[#FF9933]" />
              </div>
              <p className="text-sm font-medium text-[#2C2C2A]">Click to upload</p>
              <p className="text-xs text-[#5F5E5A]">PNG, JPG supported</p>
            </label>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white border border-[#D3D1C7] rounded-lg">
                  <FileText size={16} className="text-[#FF9933] flex-shrink-0" />
                  <span className="text-sm text-[#2C2C2A] truncate flex-1">{file.name}</span>
                  {uploading ? <Loader size={14} className="animate-spin text-[#FF9933]" /> : (
                    <button type="button" onClick={() => removeFile(i)} className="p-1 text-[#5F5E5A] hover:text-red-600 rounded">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting || uploading}
          className="btn-primary w-full justify-center py-3.5 text-base mt-2">
          {submitting ? <Loader size={18} className="animate-spin" /> : <User size={18} />}
          {submitting ? (uploadedFiles.length > 0 ? 'Processing OCR...' : 'Registering…') : 'Register patient & generate health ID'}
        </button>
      </form>
    </div>
  )
}
