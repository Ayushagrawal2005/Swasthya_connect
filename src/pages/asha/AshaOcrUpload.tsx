/**
 * ASHA — OCR Document Upload (Step 5 of Meena's journey)
 * Simulates Cloud Vision OCR: worker photographs old prescription →
 * structured data extracted → appended to patient record
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, Scan, Pill, Calendar, User } from 'lucide-react'
import { ocrExtractedMed } from '../../data/meenaPatient'
import { AIPill } from '../../components/ui/AIPill'

type OcrState = 'idle' | 'scanning' | 'done'

export function AshaOcrUploadPage() {
  const [state, setState] = useState<OcrState>('idle')
  const [saved, setSaved]   = useState(false)

  function simulateScan() {
    setState('scanning')
    // Simulate OCR processing time
    setTimeout(() => setState('done'), 2200)
  }

  function saveToRecord() {
    setSaved(true)
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Upload old prescription</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">
          Photograph a paper prescription — OCR extracts the medication automatically.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Idle: upload area ── */}
        {state === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {/* Drag-and-drop / camera area */}
            <button
              onClick={simulateScan}
              className="w-full border-2 border-dashed border-[#D3D1C7] rounded-card p-10 flex flex-col items-center gap-4 hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
              aria-label="Tap to photograph or upload a prescription document">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                <Upload size={28} className="text-teal-500" aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#2C2C2A] text-sm">Tap to photograph or upload</p>
                <p className="text-xs text-[#5F5E5A] mt-1">Supports photos of paper prescriptions, discharge summaries, or reports</p>
              </div>
            </button>

            {/* Demo shortcut */}
            <div className="card p-4 bg-indigo-50 border-indigo-100 text-center">
              <p className="text-xs text-indigo-700 mb-2">Demo: Click above to simulate OCR of Meena's old prescription from District Hospital (Feb 2026)</p>
              <AIPill />
            </div>
          </motion.div>
        )}

        {/* ── Scanning: progress ── */}
        {state === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 space-y-5">
            <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Scan size={36} className="text-teal-500 animate-pulse" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[#2C2C2A]">Scanning document…</p>
              <p className="text-sm text-[#5F5E5A] mt-1">Cloud Vision OCR extracting text</p>
            </div>
            <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.0, ease: 'easeInOut' }}
                className="h-full bg-teal-500 rounded-full" />
            </div>
            <div className="text-xs text-[#5F5E5A] space-y-1 text-left w-full max-w-xs">
              {['Detecting document edges…', 'Extracting text…', 'Structuring medication data…'].map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.7 }}
                  className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-teal-500" aria-hidden="true" /> {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Done: structured result ── */}
        {state === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle size={16} /> OCR complete — text extracted and structured
            </div>

            {/* Raw OCR output */}
            <div className="card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={15} className="text-[#5F5E5A]" aria-hidden="true" />
                <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Raw OCR text</p>
              </div>
              <p className="text-sm text-[#2C2C2A] font-mono bg-gray-50 rounded-lg px-3 py-3 leading-relaxed border border-[#D3D1C7]">
                {ocrExtractedMed.raw}
              </p>
            </div>

            {/* Structured extraction */}
            <div className="card p-5 space-y-3 border-l-4 border-l-teal-500">
              <div className="flex items-center gap-2 mb-1">
                <Pill size={16} className="text-teal-500" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#2C2C2A]">Extracted medication</p>
                <AIPill />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Drug', value: ocrExtractedMed.structured.drug, highlight: true },
                  { label: 'Dose', value: ocrExtractedMed.structured.dose },
                  { label: 'Frequency', value: ocrExtractedMed.structured.frequency },
                  { label: 'Date prescribed', value: ocrExtractedMed.structured.date },
                ].map(f => (
                  <div key={f.label} className={`rounded-xl p-3 ${f.highlight ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50'}`}>
                    <p className="text-[10px] text-[#5F5E5A] uppercase tracking-wide">{f.label}</p>
                    <p className={`font-semibold mt-0.5 ${f.highlight ? 'text-teal-700' : 'text-[#2C2C2A]'}`}>{f.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-xs text-[#5F5E5A] bg-gray-50 rounded-xl px-3 py-2">
                <User size={11} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>Prescribed by <strong className="text-[#2C2C2A]">{ocrExtractedMed.structured.prescribedBy}</strong> at {ocrExtractedMed.structured.prescribedAt}</span>
              </div>

              <div className="flex items-start gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                <Calendar size={11} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>This gives the PHC doctor critical context: Meena was already prescribed Amlodipine 5mg for hypertension 6 months ago — they can assess compliance and adjust treatment accordingly.</span>
              </div>
            </div>

            {/* Save action */}
            {!saved ? (
              <button onClick={saveToRecord} className="btn-primary w-full justify-center text-sm py-3">
                <FileText size={15} aria-hidden="true" /> Attach to Meena's health record
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle size={16} />
                <span>Amlodipine 5mg added to Meena's medication history. PHC doctor will see this during consultation.</span>
              </div>
            )}

            <button onClick={() => setState('idle')} className="btn-secondary w-full justify-center text-sm">
              Upload another document
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
