/**
 * ASHA — OCR Document Upload for Existing Patients
 * Upload medical records to existing patient profiles
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, Scan, Pill, User, X, Eye, Search, Loader, AlertCircle, Download, Zap } from 'lucide-react'
import axios from 'axios'
import jsPDF from 'jspdf'

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
      const response = await axios.get(`http://localhost:4000/patients/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSearchResults(response.data.patients || [])
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

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    setUploadedFiles(prev => [...prev, ...fileArray])
    setStep('processing')
    setProcessing(true)

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
        newResults.push({
          raw_text: 'OCR extraction failed - document will need manual review',
          document_type: 'unknown',
          summary: 'Automatic processing was unsuccessful. Please review this document manually and enter relevant details.',
          medicines: [],
          test_values: [],
          dates_found: [],
          needs_review: true
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

    for (let i = 0; i < ocrResults.length; i++) {
      const result = ocrResults[i]
      try {
        await axios.post(`http://localhost:4000/api/patients/${selectedPatient.id}/records`, {
          documentType: result.document_type,
          rawText: result.raw_text,
          summary: result.summary,
          medicines: result.medicines,
          testValues: result.test_values,
          datesFound: result.dates_found,
          imageUrl: null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Upload medical records</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">
          Add previous prescriptions, lab reports, or discharge summaries to patient records
        </p>
      </div>

      {/* Selected Patient Banner */}
      {selectedPatient && step !== 'done' && (
        <div className="card p-4 bg-teal-50 border-teal-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-semibold">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C2C2A]">{selectedPatient.name}</p>
                <p className="text-xs text-[#5F5E5A]">{selectedPatient.age}Y {selectedPatient.gender} • {selectedPatient.healthId}</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedPatient(null); setStep('search') }}
              className="text-xs text-teal-700 hover:text-teal-900 font-medium"
            >
              Change patient
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Patient Search or Quick Scan */}
        {step === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Quick Scan Option */}
            <div className="card p-5 bg-gradient-to-br from-indigo-50 to-teal-50 border-indigo-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                  <Zap size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#2C2C2A] mb-1">Quick Scan Mode</h3>
                  <p className="text-xs text-[#5F5E5A] mb-3">
                    Upload any medical report and get an instant AI summary to print and take to your doctor appointment. 
                    No patient account needed.
                  </p>
                  <button
                    onClick={startQuickScan}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    <Zap size={14} />
                    Start Quick Scan
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#D3D1C7]" />
              <span className="text-xs text-[#5F5E5A] font-medium">OR</span>
              <div className="flex-1 h-px bg-[#D3D1C7]" />
            </div>

            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
                  Search for patient to add records to their profile
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter name or Health ID..."
                    className="input-field flex-1"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="btn-primary px-6"
                  >
                    {searching ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#5F5E5A] uppercase">Search Results</p>
                  {searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => selectPatient(patient)}
                      className="w-full text-left p-3 border border-[#D3D1C7] rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-[#2C2C2A]">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#2C2C2A]">{patient.name}</p>
                          <p className="text-xs text-[#5F5E5A]">
                            {patient.age}Y {patient.gender} • {patient.village} • {patient.healthId}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="text-center py-8 text-sm text-[#5F5E5A]">
                  <AlertCircle size={32} className="mx-auto mb-2 text-amber-500" />
                  No patients found matching "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Upload Files */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#D3D1C7] rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
              <input
                type="file"
                id="records-upload"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <label htmlFor="records-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
                  <Upload size={28} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2A]">Click to upload medical documents</p>
                  <p className="text-xs text-[#5F5E5A] mt-1">Photos of prescriptions, lab reports, discharge summaries</p>
                </div>
              </label>
            </div>

            <div className="card p-4 bg-indigo-50 border-indigo-100">
              <p className="text-xs text-indigo-700">
                💡 AI will automatically extract medicines, test results, and create a summary for the doctor to review
              </p>
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
            className="flex flex-col items-center justify-center py-16 space-y-5"
          >
            <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Scan size={36} className="text-teal-500 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[#2C2C2A]">Processing documents...</p>
              <p className="text-sm text-[#5F5E5A] mt-1">Extracting text and structuring data</p>
            </div>
            <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
                className="h-full bg-teal-500 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* STEP 4: Review Extracted Data */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle size={16} /> {ocrResults.length} document(s) processed successfully
            </div>

            {quickScanMode && (
              <div className="card p-4 bg-indigo-50 border-indigo-200">
                <div className="flex items-start gap-3">
                  <Zap size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2A] mb-1">Quick Scan Mode Active</p>
                    <p className="text-xs text-[#5F5E5A]">
                      Click "Download Summary PDF" below to get a formatted summary you can print and take to your doctor. 
                      This summary includes all extracted information in an easy-to-read format.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Uploaded Files with OCR Results */}
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="card p-4">
                  <div className="flex items-start gap-3">
                    <FileText size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2C2C2A] truncate">{file.name}</p>
                      {ocrResults[index] && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded font-medium capitalize">
                              {ocrResults[index].document_type}
                            </span>
                            {ocrResults[index].medicines.length > 0 && (
                              <span className="text-[#5F5E5A]">• {ocrResults[index].medicines.length} medicine(s)</span>
                            )}
                            {ocrResults[index].test_values.length > 0 && (
                              <span className="text-[#5F5E5A]">• {ocrResults[index].test_values.length} test(s)</span>
                            )}
                          </div>
                          <p className="text-xs text-[#5F5E5A] line-clamp-2">{ocrResults[index].summary}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowPreview(index)}
                        className="p-2 text-[#5F5E5A] hover:text-teal-600 transition-colors rounded"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-2 text-[#5F5E5A] hover:text-red-600 transition-colors rounded"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {quickScanMode ? (
                <>
                  <button
                    onClick={exportQuickScanPDF}
                    disabled={ocrResults.length === 0}
                    className="btn-primary flex-1 justify-center"
                  >
                    <Download size={18} />
                    Download Summary PDF
                  </button>
                  <button
                    onClick={() => setStep('upload')}
                    className="btn-secondary px-6"
                  >
                    Scan more
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveRecords}
                    disabled={saving || ocrResults.length === 0}
                    className="btn-primary flex-1 justify-center"
                  >
                    {saving ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Save to patient record
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep('upload')}
                    className="btn-secondary px-6"
                  >
                    Add more
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
            className="flex flex-col items-center justify-center py-12 space-y-5 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#2C2C2A]">Records saved successfully!</h2>
              <p className="text-sm text-[#5F5E5A] mt-2">
                {savedCount} document{savedCount !== 1 ? 's' : ''} added to {selectedPatient?.name}'s medical history
              </p>
            </div>

            <div className="card p-4 bg-teal-50 border-teal-200 max-w-md">
              <p className="text-sm text-teal-800">
                ✓ Doctors can now view these records along with prescriptions and consultations in the unified patient summary
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="btn-primary justify-center px-6">
                Upload for another patient
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OCR Preview Modal */}
      <AnimatePresence>
        {showPreview !== null && ocrResults[showPreview] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(null)}
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
                  <h3 className="text-lg font-semibold text-[#2C2C2A]">Extracted Data</h3>
                  <p className="text-sm text-[#5F5E5A] mt-0.5">{uploadedFiles[showPreview]?.name}</p>
                </div>
                <button
                  onClick={() => setShowPreview(null)}
                  className="p-1 text-[#5F5E5A] hover:text-[#2C2C2A] transition-colors rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Document Type & Summary */}
                <div>
                  <p className="text-xs font-semibold text-[#5F5E5A] mb-1">Document Type</p>
                  <p className="text-sm text-[#2C2C2A] capitalize">{ocrResults[showPreview].document_type}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#5F5E5A] mb-1">Summary</p>
                  <p className="text-sm text-[#2C2C2A]">{ocrResults[showPreview].summary}</p>
                </div>

                {/* Medicines */}
                {ocrResults[showPreview].medicines.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#5F5E5A] mb-2">Medicines</p>
                    <div className="space-y-2">
                      {ocrResults[showPreview].medicines.map((med, i) => (
                        <div key={i} className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-[#2C2C2A]">{med.name}</p>
                          <div className="text-xs text-[#5F5E5A] mt-1 space-y-0.5">
                            {med.dosage && <p>Dosage: {med.dosage}</p>}
                            {med.frequency && <p>Frequency: {med.frequency}</p>}
                            <p className="text-teal-700">Confidence: {(med.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Values */}
                {ocrResults[showPreview].test_values.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#5F5E5A] mb-2">Lab Results</p>
                    <div className="space-y-2">
                      {ocrResults[showPreview].test_values.map((test, i) => (
                        <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-[#2C2C2A]">{test.test_name}</p>
                          <div className="text-xs text-[#5F5E5A] mt-1">
                            {test.value && <p>Value: {test.value} {test.unit || ''}</p>}
                            {test.is_abnormal && <p className="text-red-600 font-semibold">⚠ Abnormal</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Text */}
                <div>
                  <p className="text-xs font-semibold text-[#5F5E5A] mb-1">Raw Text</p>
                  <div className="bg-gray-50 border border-[#D3D1C7] rounded-lg p-3 text-xs text-[#2C2C2A] whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
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
