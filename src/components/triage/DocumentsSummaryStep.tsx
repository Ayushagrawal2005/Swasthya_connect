/**
 * Documents & Summary Step
 * Step 6: Document upload and AI-generated summary review
 */

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, CheckCircle2, Upload, FileText } from 'lucide-react'
import { triageSessionsApi } from '../../services/triageSessionsApi'
import type { AllergyEntry, MedicationEntry, PatientHistory } from '../../types/teleconsult'

interface Props {
  sessionId: string
  documentIds: string[]
  setDocumentIds: (ids: string[]) => void
  chiefComplaint: string
  selectedConditions: string[]
  history: PatientHistory
  allergies: AllergyEntry[]
  medications: MedicationEntry[]
  onSubmit: () => void
  loading: boolean
}

export function DocumentsSummaryStep({
  sessionId,
  documentIds,
  setDocumentIds,
  chiefComplaint,
  selectedConditions,
  history,
  allergies,
  medications,
  onSubmit,
  loading
}: Props) {
  const [summary, setSummary] = useState('')
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [summaryGenerated, setSummaryGenerated] = useState(false)

  useEffect(() => {
    generateSummary()
  }, [])

  async function generateSummary() {
    setGeneratingSummary(true)
    try {
      const result = await triageSessionsApi.generateSummary(sessionId, true, 'en')
      setSummary(result.summary.summaryText)
      setSummaryGenerated(true)
    } catch (err) {
      console.error('Failed to generate summary:', err)
      // Fallback summary
      setSummary(
        `Chief Complaint: ${chiefComplaint}\n\n` +
        `Suspected Conditions: ${selectedConditions.join(', ') || 'Not specified'}\n\n` +
        `Medical History: ${history.medical?.length ? history.medical.join(', ') : 'None reported'}\n\n` +
        `Allergies: ${allergies.length ? allergies.map(a => a.name).join(', ') : 'No known allergies'}\n\n` +
        `Current Medications: ${medications.length ? medications.map(m => m.medicineName).join(', ') : 'None'}`
      )
      setSummaryGenerated(false)
    } finally {
      setGeneratingSummary(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Document Upload Section */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2A] mb-2">
            Upload Documents (Optional)
          </h2>
          <p className="text-sm text-[#5F5E5A]">
            Upload any relevant medical documents, prescriptions, or lab reports
          </p>
        </div>

        <div className="border-2 border-dashed border-[#D3D1C7] rounded-xl p-8 text-center hover:border-teal-300 transition-colors">
          <Upload size={32} className="mx-auto text-[#5F5E5A] mb-3" />
          <p className="text-sm text-[#2C2C2A] font-medium mb-1">
            Drag and drop files here
          </p>
          <p className="text-xs text-[#5F5E5A] mb-3">
            or click to browse (PDF, JPG, PNG - Max 10MB)
          </p>
          <button className="btn-secondary text-sm">
            <FileText size={16} />
            Choose Files
          </button>
        </div>

        {documentIds.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#2C2C2A]">
              Uploaded Documents ({documentIds.length})
            </p>
            {documentIds.map((docId, idx) => (
              <div key={docId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText size={16} className="text-teal-600" />
                <span className="text-sm flex-1">Document {idx + 1}</span>
                <CheckCircle2 size={16} className="text-green-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI-Generated Summary */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} className="text-purple-600" />
          <h2 className="text-xl font-semibold text-[#2C2C2A]">
            Clinical Summary
          </h2>
          {summaryGenerated && (
            <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              AI-Generated
            </span>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
          {generatingSummary ? (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 size={24} className="animate-spin text-purple-600" />
              <span className="text-sm text-purple-900">
                Generating AI summary from your responses...
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-purple-700 font-medium">
                This summary will be shared with the doctor:
              </p>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="input-field min-h-[200px] bg-white"
                placeholder="Summary will appear here..."
              />
              <p className="text-xs text-purple-700">
                ✏️ You can edit this summary before submitting
              </p>
            </div>
          )}
        </div>

        {summaryGenerated && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
            <p className="font-medium mb-1">⚠️ AI-Assisted Summary</p>
            <p>
              This summary was generated using AI to help the doctor understand your condition quickly.
              It is not a diagnosis. The doctor will review all your information during the consultation.
            </p>
          </div>
        )}
      </div>

      {/* Quick Summary Stats */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-[#2C2C2A] mb-4">
          Assessment Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-teal-50 rounded-lg">
            <p className="text-2xl font-bold text-teal-600">
              {selectedConditions.length}
            </p>
            <p className="text-xs text-teal-700">Conditions</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {history.medical?.length || 0}
            </p>
            <p className="text-xs text-blue-700">Medical History</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {allergies.length}
            </p>
            <p className="text-xs text-red-700">Allergies</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {medications.length}
            </p>
            <p className="text-xs text-purple-700">Medications</p>
          </div>
        </div>
      </div>

      {/* Confirmation & Submit */}
      <div className="card p-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-[#2C2C2A] leading-relaxed group-hover:text-teal-600 transition-colors">
            I confirm that the information provided is accurate and complete to the best of my knowledge.
            I understand this information will be shared with the doctor for my consultation.
          </span>
        </label>

        <button
          onClick={onSubmit}
          disabled={!confirmed || loading || generatingSummary}
          className="btn-primary w-full justify-center text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              Submit & Join Teleconsult Queue
            </>
          )}
        </button>

        <p className="text-xs text-center text-[#5F5E5A]">
          After submission, you'll be added to the teleconsultation queue based on your urgency level
        </p>
      </div>
    </div>
  )
}
