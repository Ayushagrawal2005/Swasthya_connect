/**
 * ASHA — OCR Document Upload for Existing Patients
 * Upload medical records to existing patient profiles
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, Scan, Pill, User, X, Eye, Search, Loader, AlertCircle, Download, Zap, ArrowRight } from 'lucide-react'
import axios from 'axios'
import jsPDF from 'jspdf'
import { useNavigate } from 'react-router-dom'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  village: string
  healthId: string
}

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

export function AshaOcrUploadPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'search' | 'upload' | 'processing' | 'review' | 'done' | 'quick-scan'>('search')
  
  // Patient search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searching, setSearching] = useState(false)

  // File upload & OCR
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState<number | null>(null)
  
  // Save status
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  // Quick scan mode (no patient)
  const [quickScanMode, setQuickScanMode] = useState(false)

  async function handleSearch() {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    const token = localStorage.getItem('swasthya_token')
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'
      const response = await axios.get(
        `${API_BASE}/patients/search?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Backend returns a plain array (not { patients: [] })
      const results = Array.isArray(response.data) ? response.data : (response.data.patients || [])
      setSearchResults(results)
    } catch (err) {
      console.error('Search failed:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  function selectPatient(patient: Patient) {
    setSelectedPatient(patient)
    setStep('upload')
  }

  // OCR upload — calls backend which proxies to the OCR service on port 8000
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    setUploadedFiles(prev => [...prev, ...fileArray])
    setStep('processing')
    setProcessing(true)

    const token = localStorage.getItem('swasthya_token')
    const newResults: OCRResult[] = []

    for (const file of fileArray) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        if (selectedPatient) formData.append('patientId', selectedPatient.id)

        // Try backend proxy first (port 4000 → port 8000)
        let data: OCRResult | null = null
        try {
          const API_BASE = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'
          const response = await axios.post(`${API_BASE}/api/ocr/extract`, formData, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 40000
          })
          data = response.data
        } catch {
          // Backend proxy failed — try OCR service directly
          const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'https://swasthya-connect-ocr.onrender.com'
          const response = await axios.post(`${OCR_API_URL}/ocr/extract`, formData, {
            timeout: 40000
          })
          // OCR service returns the correct OCRResult shape directly
          data = response.data
        }

        if (data) {
          // Normalise: OCR service may return snake_case
          newResults.push({
            raw_text:      data.raw_text      || '',
            document_type: data.document_type || 'unknown',
            summary:       data.summary       || '',
            medicines:     data.medicines     || [],
            test_values:   data.test_values   || [],
            dates_found:   data.dates_found   || [],
            needs_review:  data.needs_review  ?? true,
          })
        }
      } catch (err) {
        console.error('OCR extraction failed for', file.name, err)
        newResults.push({
          raw_text: 'OCR extraction failed — document needs manual review',
          document_type: 'unknown',
          summary: 'Automatic processing was unsuccessful. Please review this document manually.',
          medicines: [],
          test_values: [],
          dates_found: [],
          needs_review: true,
          fallback: true,
        })
      }
    }

    setOcrResults(prev => [...prev, ...newResults])
    setProcessing(false)
    setStep('review')
  }

  async function saveRecords() {
    if (!selectedPatient) return
    
    setSaving(true)
    const token = localStorage.getItem('swasthya_token')
    let successCount = 0

    for (const result of ocrResults) {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'
        await axios.post(
          `${API_BASE}/patients/${selectedPatient.id}/records`,
          {
            documentType: result.document_type,
            rawText:      result.raw_text,
            summary:      result.summary,
            medicines:    result.medicines,
            testValues:   result.test_values,
            datesFound:   result.dates_found,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        successCount++
      } catch (err) {
        console.error('Failed to save record:', err)
      }
    }

    setSavedCount(successCount)
    setSaving(false)
    setStep('done')
  }

  function reset() {
    setStep('search')
    setSearchQuery('')
    setSearchResults([])
    setSelectedPatient(null)
    setUploadedFiles([])
    setOcrResults([])
    setSavedCount(0)
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setOcrResults(prev => prev.filter((_, i) => i !== index))
  }

  function startQuickScan() {
    setQuickScanMode(true)
    setStep('upload')
  }

  function exportQuickScanPDF() {
    if (ocrResults.length === 0) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPos = 20

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Medical Report Summary', margin, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, yPos)
    yPos += 7
    doc.text('SwasthyaConnect - AI-Powered Medical Records', margin, yPos)
    yPos += 15

    // Instructions
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Please show this summary to your doctor during your appointment.', margin, yPos)
    yPos += 5
    doc.text('This is an AI-generated summary - always bring original reports.', margin, yPos)
    yPos += 12
    doc.setTextColor(0, 0, 0)

    // Process each report
    ocrResults.forEach((result, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Document header
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`Document ${index + 1}: ${result.document_type.toUpperCase()}`, margin, yPos)
      yPos += 8

      // Summary section
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary:', margin, yPos)
      yPos += 6

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const summaryLines = doc.splitTextToSize(result.summary, pageWidth - 2 * margin)
      summaryLines.forEach((line: string) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, margin, yPos)
        yPos += 5
      })
      yPos += 5

      // Medicines
      if (result.medicines.length > 0) {
        if (yPos > 240) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Medicines:', margin, yPos)
        yPos += 6

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        result.medicines.forEach((med) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          const medText = `• ${med.name}${med.dosage ? ' - ' + med.dosage : ''}${med.frequency ? ' (' + med.frequency + ')' : ''}`
          doc.text(medText, margin + 5, yPos)
          yPos += 5
        })
        yPos += 5
      }

      // Lab Results
      if (result.test_values.length > 0) {
        if (yPos > 240) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Lab Results:', margin, yPos)
        yPos += 6

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        result.test_values.forEach((test) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          let testText = `• ${test.test_name}`
          if (test.value) testText += `: ${test.value} ${test.unit || ''}`
          if (test.is_abnormal) testText += ' (ABNORMAL)'
          doc.text(testText, margin + 5, yPos)
          yPos += 5
        })
        yPos += 5
      }

      // Dates
      if (result.dates_found.length > 0) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Dates mentioned: ${result.dates_found.join(', ')}`, margin, yPos)
        yPos += 5
        doc.setTextColor(0, 0, 0)
      }

      // Separator
      yPos += 5
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10
    })

    // Footer on last page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    yPos = doc.internal.pageSize.getHeight() - 20
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('This summary was generated by SwasthyaConnect AI. For medical advice, consult a qualified healthcare professional.', margin, yPos, { maxWidth: pageWidth - 2 * margin, align: 'center' })

    // Save PDF
    doc.save(`Medical_Summary_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Upload Medical Records</h1>
              <p className="text-blue-100 mt-1">
                Add previous prescriptions, lab reports, or discharge summaries to patient records
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Selected Patient Banner */}
        {selectedPatient && step !== 'done' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-5 border-l-4 border-l-[#123B6D]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] text-white flex items-center justify-center font-bold text-xl shadow-lg">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold text-[#123B6D]">{selectedPatient.name}</p>
                  <p className="text-sm text-gray-600">{selectedPatient.age}Y {selectedPatient.gender} • {selectedPatient.healthId}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedPatient(null); setStep('search') }}
                className="px-4 py-2 bg-gray-100 text-[#123B6D] rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Change Patient
              </button>
            </div>
          </motion.div>
        )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Patient Search or Quick Scan */}
        {step === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quick Scan Option */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-200">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Zap size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#123B6D] mb-2">Quick Scan Mode</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Upload any medical report and get an instant AI summary to print and take to your doctor appointment. 
                    No patient account needed.
                  </p>
                  <button
                    onClick={startQuickScan}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <Zap size={18} />
                    Start Quick Scan
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-sm text-gray-500 font-semibold px-4 py-2 bg-white rounded-full border-2 border-gray-200">OR</span>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
              <div>
                <label className="block text-lg font-bold text-[#123B6D] mb-3">
                  Search Patient by Name, Phone Number, or Health ID
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g. Meena Patil, 9876543210, 91-XXXX..."
                    className="flex-1 px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#123B6D] focus:ring-4 focus:ring-[#123B6D]/10 outline-none transition-all font-medium"
                    inputMode="text"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-6 py-3.5 bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center gap-2"
                  >
                    {searching ? <Loader size={20} className="animate-spin" /> : <Search size={20} />}
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Search by full/partial name, 10-digit mobile number, or Health ID</p>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#123B6D] uppercase tracking-wide">Search Results</p>
                  {searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => selectPatient(patient)}
                      className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-[#123B6D] hover:bg-blue-50 transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-bold text-[#123B6D] text-xl shadow-md">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-bold text-[#123B6D]">{patient.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {patient.age}Y {patient.gender} • {patient.village} • {patient.healthId}
                          </p>
                        </div>
                        <ArrowRight size={20} className="text-[#E85D04]" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[#123B6D] mb-2">No Patients Found</h3>
                  <p className="text-gray-600">No results matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Upload Files */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Upload Area */}
            <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-[#123B6D] hover:bg-blue-50 transition-all duration-200 bg-white shadow-xl">
              <input
                type="file"
                id="records-upload"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <label htmlFor="records-upload" className="cursor-pointer flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] flex items-center justify-center shadow-xl">
                  <Upload size={40} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#123B6D] mb-2">Click to Upload Medical Documents</p>
                  <p className="text-gray-600">Photos of prescriptions, lab reports, discharge summaries</p>
                  <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG • Multiple files allowed</p>
                </div>
              </label>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-5 border-2 border-indigo-200 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Scan size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-indigo-900 mb-1">AI-Powered Document Processing</p>
                  <p className="text-sm text-indigo-700">
                    Our AI will automatically extract medicines, test results, and create a summary for the doctor to review
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 space-y-6 bg-white rounded-2xl shadow-xl"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] flex items-center justify-center shadow-2xl">
                <Scan size={56} className="text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-3xl border-4 border-[#E85D04] animate-ping opacity-20"></div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#123B6D] mb-2">Processing Documents...</p>
              <p className="text-gray-600">Extracting text and structuring medical data</p>
            </div>
            <div className="w-full max-w-md bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-[#123B6D] via-[#E85D04] to-[#123B6D] rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* STEP 4: Review Extracted Data */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 bg-green-50 border-2 border-green-300 rounded-xl px-6 py-4 shadow-lg">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="font-bold text-green-800">Processing Complete</p>
                <p className="text-sm text-green-700">{ocrResults.length} document{ocrResults.length !== 1 ? 's' : ''} processed successfully</p>
              </div>
            </div>

            {quickScanMode && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#123B6D] mb-2">Quick Scan Mode Active</p>
                    <p className="text-gray-600 leading-relaxed">
                      Click "Download Summary PDF" below to get a formatted summary you can print and take to your doctor. 
                      This summary includes all extracted information in an easy-to-read format.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Uploaded Files with OCR Results */}
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 hover:border-[#123B6D] transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#E85D04] to-[#ff7518] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <FileText size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-[#123B6D] truncate mb-2">{file.name}</p>
                      {ocrResults[index] && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-lg text-xs font-bold uppercase">
                              {ocrResults[index].document_type}
                            </span>
                            {ocrResults[index].medicines.length > 0 && (
                              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold border border-green-300">
                                <Pill size={12} className="inline mr-1" />
                                {ocrResults[index].medicines.length} medicine{ocrResults[index].medicines.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {ocrResults[index].test_values.length > 0 && (
                              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-300">
                                <Activity size={12} className="inline mr-1" />
                                {ocrResults[index].test_values.length} test{ocrResults[index].test_values.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2 bg-gray-50 p-3 rounded-lg">{ocrResults[index].summary}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPreview(index)}
                        className="p-3 bg-blue-100 text-[#123B6D] hover:bg-blue-200 transition-all rounded-xl"
                        title="View details"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-3 bg-red-100 text-red-600 hover:bg-red-200 transition-all rounded-xl"
                        title="Remove"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {quickScanMode ? (
                <>
                  <button
                    onClick={exportQuickScanPDF}
                    disabled={ocrResults.length === 0}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center gap-2 text-lg"
                  >
                    <Download size={22} />
                    Download Summary PDF
                  </button>
                  <button
                    onClick={() => setStep('upload')}
                    className="px-8 py-4 bg-gradient-to-r from-[#E85D04] to-[#ff7518] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 text-lg"
                  >
                    Scan More
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveRecords}
                    disabled={saving || ocrResults.length === 0}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center gap-2 text-lg"
                  >
                    {saving ? (
                      <>
                        <Loader size={22} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={22} />
                        Save to Patient Record
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep('upload')}
                    className="px-8 py-4 bg-gradient-to-r from-[#E85D04] to-[#ff7518] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 text-lg"
                  >
                    Add More
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 5: Done */}
        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-16 space-y-6 text-center bg-white rounded-2xl shadow-xl"
          >
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl">
              <CheckCircle size={64} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#123B6D] mb-3">Records Saved Successfully!</h2>
              <p className="text-lg text-gray-600">
                {savedCount} document{savedCount !== 1 ? 's' : ''} added to {selectedPatient?.name}'s medical history
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 max-w-lg border-2 border-green-300 shadow-lg">
              <div className="flex items-start gap-3">
                <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                <p className="text-green-800 font-medium leading-relaxed text-left">
                  Doctors can now view these records along with prescriptions and consultations in the unified patient summary
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-md pt-4">
              {selectedPatient && (
                <button
                  onClick={() => navigate(`/asha/record?id=${selectedPatient.id}`)}
                  className="px-8 py-4 bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 inline-flex items-center justify-center gap-2 text-lg"
                >
                  <User size={22} />
                  View {selectedPatient.name}'s Full Record
                </button>
              )}
              <button 
                onClick={reset} 
                className="px-8 py-4 bg-gradient-to-r from-[#E85D04] to-[#ff7518] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 text-lg"
              >
                Upload for Another Patient
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* OCR Preview Modal */}
      <AnimatePresence>
        {showPreview !== null && ocrResults[showPreview] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-200">
                <div>
                  <h3 className="text-2xl font-bold text-[#123B6D]">Extracted Data</h3>
                  <p className="text-gray-600 mt-1">{uploadedFiles[showPreview]?.name}</p>
                </div>
                <button
                  onClick={() => setShowPreview(null)}
                  className="p-2 text-gray-400 hover:text-[#123B6D] hover:bg-gray-100 transition-all rounded-xl"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Document Type & Summary */}
                <div>
                  <p className="text-sm font-bold text-[#123B6D] mb-2 uppercase tracking-wide">Document Type</p>
                  <p className="text-base font-semibold text-gray-800 capitalize bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    {ocrResults[showPreview].document_type}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold text-[#123B6D] mb-2 uppercase tracking-wide">Summary</p>
                  <p className="text-base text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {ocrResults[showPreview].summary}
                  </p>
                </div>

                {/* Medicines */}
                {ocrResults[showPreview].medicines.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-[#123B6D] mb-3 uppercase tracking-wide flex items-center gap-2">
                      <Pill size={18} />
                      Medicines
                    </p>
                    <div className="space-y-3">
                      {ocrResults[showPreview].medicines.map((med, i) => (
                        <div key={i} className="bg-green-50 border-2 border-green-200 rounded-xl p-4 hover:border-green-300 transition-all">
                          <p className="text-base font-bold text-green-900">{med.name}</p>
                          <div className="text-sm text-green-700 mt-2 space-y-1">
                            {med.dosage && <p><span className="font-semibold">Dosage:</span> {med.dosage}</p>}
                            {med.frequency && <p><span className="font-semibold">Frequency:</span> {med.frequency}</p>}
                            <p className="text-green-600"><span className="font-semibold">Confidence:</span> {(med.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Values */}
                {ocrResults[showPreview].test_values.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-[#123B6D] mb-3 uppercase tracking-wide flex items-center gap-2">
                      <Activity size={18} />
                      Lab Results
                    </p>
                    <div className="space-y-3">
                      {ocrResults[showPreview].test_values.map((test, i) => (
                        <div key={i} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                          <p className="text-base font-bold text-blue-900">{test.test_name}</p>
                          <div className="text-sm text-blue-700 mt-2 space-y-1">
                            {test.value && <p><span className="font-semibold">Value:</span> {test.value} {test.unit || ''}</p>}
                            {test.is_abnormal && (
                              <div className="flex items-center gap-2 text-red-600 font-bold mt-2">
                                <AlertCircle size={16} />
                                <span>ABNORMAL</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Text */}
                <div>
                  <p className="text-sm font-bold text-[#123B6D] mb-2 uppercase tracking-wide">Raw Text</p>
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                    {ocrResults[showPreview].raw_text}
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
