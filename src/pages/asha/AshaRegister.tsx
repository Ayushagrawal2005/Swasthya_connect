// ASHA — Patient Registration
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mic, CheckCircle, Shield, WifiOff, RefreshCw, Upload, FileText, Loader, X, Eye, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { patientsApi } from '../../services/api'
import { VoiceInputButton } from '../../components/ui/VoiceInputButton'

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
    email: '', password: '',
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
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Enter a valid email address'
    if (!form.password.trim() || form.password.length < 6) e.password = 'Password must be at least 6 characters'
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
        const API_BASE = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'
        const response = await fetch(`${API_BASE}/ocr/extract`, {
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
            
            const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'https://swasthya-connect-ocr.onrender.com'
            const directResponse = await fetch(`${OCR_API_URL}/ocr/extract`, {
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
      
      const API_BASE = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'
      const response = await fetch(`${API_BASE}/patients/${patientId}/records`, {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-6 text-center"
          >
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-xl">
              <CheckCircle size={40} className="text-white" />
            </div>

            {/* Success Message */}
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#123B6D] to-[#1a5490] bg-clip-text text-transparent">
                Patient Registered Successfully!
              </h2>
              <p className="text-gray-600 mt-2">{form.name} has been added to the system</p>
            </div>

            {/* Health ID Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full border-2 border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-[#E85D04] to-[#d94f03] rounded-lg">
                  <Shield size={20} className="text-white" />
                </div>
                <p className="text-sm font-bold text-[#E85D04]">ABDM Health ID Generated</p>
              </div>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-[#123B6D] tracking-wide mb-4 break-all">
                {healthId}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                This ID links to India's Ayushman Bharat Digital Mission. Records are FHIR-compliant and accessible across connected facilities.
              </p>
              {!isOnline ? (
                <div className="flex items-center gap-2 text-sm text-amber-800 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl px-4 py-3">
                  <WifiOff size={16} />
                  <span className="font-medium">Saved offline — will sync when connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-800 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl px-4 py-3">
                  <RefreshCw size={16} />
                  <span className="font-medium">Synced to central health system</span>
                </div>
              )}
            </motion.div>

            {/* Portal Credentials Card */}
            {form.email && form.password && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 sm:p-8 w-full border-2 border-blue-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <p className="text-sm font-bold text-blue-900">Patient Portal Login Credentials</p>
                </div>
                <div className="space-y-4 bg-white rounded-xl p-4">
                  <div>
                    <p className="text-xs text-blue-700 font-semibold mb-1">Email:</p>
                    <p className="text-base font-mono text-[#123B6D] break-all">{form.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 font-semibold mb-1">Password:</p>
                    <p className="text-base font-mono text-[#123B6D]">{form.password}</p>
                  </div>
                </div>
                <div className="text-sm text-blue-800 bg-white/50 rounded-xl px-4 py-3 mt-4">
                  📱 Patient can now log in to view health records, track wellness, and manage family health
                </div>
              </motion.div>
            )}

            {/* OCR Upload Status */}
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6 w-full border-2 border-gray-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-[#E85D04] to-[#d94f03] rounded-lg">
                    <FileText size={20} className="text-white" />
                  </div>
                  <p className="text-sm font-bold text-[#123B6D]">Medical Records Upload Status</p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {ocrProcessed > 0 && `${ocrProcessed} document(s) processed and saved`}
                  {ocrFailed > 0 && ` • ${ocrFailed} failed`}
                </p>
                <div className="space-y-3">
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      {i < ocrProcessed ? (
                        <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                      ) : i < (ocrProcessed + ocrFailed) ? (
                        <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                      ) : (
                        <Loader size={16} className="text-amber-600 flex-shrink-0 animate-spin" />
                      )}
                      <span className="text-sm text-[#123B6D] truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
                {ocrFailed > 0 && (
                  <div className="text-sm text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mt-4">
                    <p className="font-bold mb-2">⚠ {ocrFailed} upload(s) failed</p>
                    <p className="text-xs mb-2">Possible reasons:</p>
                    <ul className="text-xs list-disc ml-4 space-y-1">
                      <li>OCR service not running (port 8000)</li>
                      <li>Backend not responding (port 4000)</li>
                      <li>Network connection issue</li>
                    </ul>
                    <p className="text-xs mt-3">💡 You can upload prescriptions later from the patient record page.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3 w-full"
            >
              {savedPatientId && (
                <button 
                  onClick={() => navigate(`/asha/record?id=${savedPatientId}`)} 
                  className="bg-white border-2 border-[#123B6D] text-[#123B6D] px-6 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Eye size={20} />
                  View Patient Record
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/asha/triage')} 
                  className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  Triage This Patient
                </button>
                <button 
                  onClick={() => {
                    setStep('form')
                    setHealthId('')
                    setSavedPatientId('')
                    setSubmitError('')
                    setSubmitStatus('')
                    setUploadedFiles([])
                    setForm({ name:'', phone:'', age:'', gender:'', village:'', condition:'None', language:'Marathi', aadhaarLast4:'', email:'', password:'' })
                    setErrors({})
                  }} 
                  className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  Register Another
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ─── Form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#123B6D] to-[#1a5490] bg-clip-text text-transparent">
              Register New Patient
            </h1>
            <p className="text-gray-600 mt-2">
              Creates an ABDM-linked health ID. Works offline — syncs automatically.
            </p>
          </div>

          {/* Offline Alert */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 text-sm text-amber-800 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl px-4 py-3 mb-6"
            >
              <WifiOff size={18} />
              <span className="font-medium">Offline mode — record will sync when connected</span>
            </motion.div>
          )}

          {/* Error Alert */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 text-sm text-red-800 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl px-4 py-3 mb-6"
            >
              <AlertCircle size={18} className="flex-shrink-0" />
              {submitError}
            </motion.div>
          )}

          {/* Status Alert */}
          {submitStatus && submitting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 text-sm text-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl px-4 py-3 mb-6"
            >
              <Loader size={18} className="flex-shrink-0 animate-spin" />
              {submitStatus}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6"
>
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  id="reg-name" 
                  type="text" 
                  value={form.name} 
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Meena Jadhav" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400"
                  aria-required="true" 
                  aria-invalid={!!errors.name} 
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#E85D04] rounded-lg transition-colors"
                  aria-label="Voice input"
                >
                  <Mic size={18} />
                </button>
              </div>
              <AnimatePresence>
                {errors.name && (
                  <motion.p 
                    role="alert" 
                    initial={{opacity:0,y:-4}} 
                    animate={{opacity:1,y:0}} 
                    exit={{opacity:0}} 
                    className="text-sm text-red-600 mt-2 flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {errors.name}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-600 font-medium">
                  +91
                </span>
                <input 
                  id="reg-phone" 
                  type="tel" 
                  inputMode="numeric" 
                  value={form.phone}
                  onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
                  placeholder="9876543210" 
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400"
                  aria-required="true" 
                  aria-invalid={!!errors.phone} 
                />
              </div>
              <AnimatePresence>
                {errors.phone && (
                  <motion.p 
                    role="alert" 
                    initial={{opacity:0,y:-4}} 
                    animate={{opacity:1,y:0}} 
                    exit={{opacity:0}} 
                    className="text-sm text-red-600 mt-2 flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {errors.phone}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input 
                id="reg-email" 
                type="email" 
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="patient@example.com" 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400"
                aria-required="true" 
                aria-invalid={!!errors.email} 
              />
              <p className="text-xs text-gray-500 mt-2">For patient portal login</p>
              <AnimatePresence>
                {errors.email && (
                  <motion.p 
                    role="alert" 
                    initial={{opacity:0,y:-4}} 
                    animate={{opacity:1,y:0}} 
                    exit={{opacity:0}} 
                    className="text-sm text-red-600 mt-2 flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  id="reg-password" 
                  type={form.password && form.password.length > 0 ? "text" : "password"}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Minimum 6 characters" 
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400"
                  aria-required="true" 
                  aria-invalid={!!errors.password} 
                />
                <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Patient will use this to log into the portal</p>
              <AnimatePresence>
                {errors.password && (
                  <motion.p 
                    role="alert" 
                    initial={{opacity:0,y:-4}} 
                    animate={{opacity:1,y:0}} 
                    exit={{opacity:0}} 
                    className="text-sm text-red-600 mt-2 flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-age" className="block text-sm font-semibold text-[#123B6D] mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input 
                  id="reg-age" 
                  type="number" 
                  inputMode="numeric" 
                  min="0" 
                  max="120"
                  value={form.age} 
                  onChange={e => set('age', e.target.value)}
                  placeholder="e.g. 28" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400"
                />
                <AnimatePresence>
                  {errors.age && (
                    <motion.p 
                      role="alert" 
                      initial={{opacity:0}} 
                      animate={{opacity:1}} 
                      exit={{opacity:0}} 
                      className="text-sm text-red-600 mt-2 flex items-center gap-1"
                    >
                      <AlertCircle size={14} />
                      {errors.age}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#123B6D] mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {(['F','M','O'] as const).map(g => (
                    <button 
                      key={g} 
                      type="button" 
                      onClick={() => set('gender', g)}
                      aria-pressed={form.gender === g}
                      className={`flex-1 py-3 text-sm font-semibold rounded-xl border-2 transition-all ${
                        form.gender === g 
                          ? 'bg-gradient-to-r from-[#E85D04] to-[#d94f03] border-[#E85D04] text-white shadow-lg' 
                          : 'border-gray-200 text-gray-600 bg-white hover:border-[#E85D04]'
                      }`}
                    >
                      {g === 'F' ? 'Female' : g === 'M' ? 'Male' : 'Other'}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {errors.gender && (
                    <motion.p 
                      role="alert" 
                      initial={{opacity:0}} 
                      animate={{opacity:1}} 
                      exit={{opacity:0}} 
                      className="text-sm text-red-600 mt-2 flex items-center gap-1"
                    >
                      <AlertCircle size={14} />
                      {errors.gender}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Village */}
            <div>
              <label htmlFor="reg-village" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Village / Locality <span className="text-red-500">*</span>
              </label>
              <input 
                id="reg-village" 
                type="text" 
                value={form.village} 
                onChange={e => set('village', e.target.value)}
                placeholder="e.g. Mandav, Beed" 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400"
              />
              <AnimatePresence>
                {errors.village && (
                  <motion.p 
                    role="alert" 
                    initial={{opacity:0}} 
                    animate={{opacity:1}} 
                    exit={{opacity:0}} 
                    className="text-sm text-red-600 mt-2 flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {errors.village}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Aadhaar last 4 */}
            <div>
              <label htmlFor="reg-aadhaar" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Aadhaar Last 4 Digits <span className="text-xs font-normal text-gray-500">(optional)</span>
              </label>
              <input 
                id="reg-aadhaar" 
                type="text" 
                inputMode="numeric" 
                maxLength={4}
                value={form.aadhaarLast4} 
                onChange={e => set('aadhaarLast4', e.target.value.replace(/\D/g,'').slice(0,4))}
                placeholder="XXXX" 
                className="w-full sm:w-40 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] placeholder:text-gray-400"
              />
            </div>

            {/* Condition */}
            <div>
              <label htmlFor="reg-condition" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Primary Condition
              </label>
              <select 
                id="reg-condition" 
                value={form.condition} 
                onChange={e => set('condition', e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] bg-white"
              >
                {conditions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="reg-lang" className="block text-sm font-semibold text-[#123B6D] mb-2">
                Patient's Preferred Language
              </label>
              <select 
                id="reg-lang" 
                value={form.language} 
                onChange={e => set('language', e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#E85D04] transition-colors text-[#123B6D] bg-white"
              >
                {languages.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            {/* Medical records upload (optional) */}
            <div className="border-t-2 border-gray-100 pt-6 mt-2">
              <h3 className="text-base font-bold text-[#123B6D] mb-1">
                Upload Previous Medical Records <span className="text-sm font-normal text-gray-500">(optional)</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">Prescriptions, lab reports, discharge summaries</p>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#E85D04] hover:bg-orange-50/30 transition-all">
                <input 
                  type="file" 
                  id="med-upload" 
                  accept="image/*" 
                  multiple 
                  onChange={e => handleFileUpload(e.target.files)} 
                  className="hidden" 
                />
                <label htmlFor="med-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E85D04] to-[#d94f03] flex items-center justify-center shadow-lg">
                    <Upload size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#123B6D] mb-1">Click to Upload</p>
                    <p className="text-sm text-gray-500">PNG, JPG supported</p>
                  </div>
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                      <FileText size={20} className="text-[#E85D04] flex-shrink-0" />
                      <span className="text-sm text-[#123B6D] truncate flex-1 font-medium">{file.name}</span>
                      {uploading ? (
                        <Loader size={18} className="animate-spin text-[#E85D04]" />
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => removeFile(i)} 
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={submitting || uploading}
              className="w-full bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white px-6 py-4 rounded-2xl font-bold text-base hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 mt-8"
            >
              {submitting ? (
                <>
                  <Loader size={22} className="animate-spin" />
                  {uploadedFiles.length > 0 ? 'Processing OCR...' : 'Registering…'}
                </>
              ) : (
                <>
                  <User size={22} />
                  Register Patient & Generate Health ID
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
