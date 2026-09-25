/**
 * Patient Government Scheme Checker - ULTRA SIMPLIFIED
 * 
 * Direct Groq AI-based scheme checking - No database required
 */

import { useState } from 'react'
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh'
]

interface SchemeResult {
  schemeName: string
  description: string
  eligibility: string
  benefits: string[]
  howToApply: string
  documents: string[]
}

export default function SchemeChecker() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<SchemeResult[]>([])

  // Simplified form with only 3 main questions
  const [age, setAge] = useState<number | undefined>(undefined)
  const [state, setState] = useState<string>('')
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])

  // Available conditions as checkboxes
  const CONDITIONS = [
    { id: 'pregnancy', label: 'गर्भवती / Pregnant' },
    { id: 'senior', label: '60+ वर्ष / Senior Citizen' },
    { id: 'disability', label: 'विकलांगता / Disability' },
    { id: 'bpl', label: 'गरीबी रेखा के नीचे / Below Poverty Line (BPL)' },
    { id: 'rural', label: 'ग्रामीण क्षेत्र / Rural Area' },
    { id: 'farmer', label: 'किसान / Farmer' },
  ]

  const toggleCondition = (conditionId: string) => {
    setSelectedConditions(prev =>
      prev.includes(conditionId)
        ? prev.filter(c => c !== conditionId)
        : [...prev, conditionId]
    )
  }

  const handleSubmit = async () => {
    // Validation
    if (!age || !state) {
      setError('कृपया अपनी उम्र और राज्य दर्ज करें / Please enter your age and state')
      return
    }

    try {
      setError('')
      setLoading(true)

      // Build description of user for AI
      const conditionLabels = selectedConditions.map(id => 
        CONDITIONS.find(c => c.id === id)?.label || id
      )

      // Get JWT token from localStorage
      const token = localStorage.getItem('swasthya_token')

      // Call simple AI endpoint
      const response = await axios.post(
        `${API_URL}/schemes/ai-check`,
        {
          age,
          state,
          conditions: conditionLabels,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      setResults(response.data.schemes || [])
    } catch (err: any) {
      console.error('Scheme check error:', err)
      setError(
        err.response?.data?.error || 
        'योजना जांचने में त्रुटि / Failed to check schemes. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setAge(undefined)
    setState('')
    setSelectedConditions([])
    setResults([])
    setError('')
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="text-[#FF9933]" size={28} />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">सरकारी योजना चेकर / Government Scheme Checker</h1>
        </div>
        <p className="text-sm text-[#6B6B6B]">
          AI से अपनी पात्रता जांचें / Check your eligibility with AI
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Form or Results */}
      {results.length === 0 ? (
        <div className="bg-white border-2 border-[#D4D4D4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6">
            केवल 3 सवाल / Just 3 Questions
          </h2>

          <div className="space-y-6">
            {/* Question 1: Age */}
            <div>
              <label className="block text-base font-medium text-[#1A1A1A] mb-3">
                1️⃣ आपकी उम्र क्या है? / What is your age? *
              </label>
              <input
                type="number"
                value={age || ''}
                onChange={e => setAge(parseInt(e.target.value) || undefined)}
                className="input-field text-lg"
                placeholder="उम्र दर्ज करें / Enter age"
                min="0"
                max="120"
              />
            </div>

            {/* Question 2: State */}
            <div>
              <label className="block text-base font-medium text-[#1A1A1A] mb-3">
                2️⃣ आप किस राज्य से हैं? / Which state are you from? *
              </label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="input-field text-lg"
              >
                <option value="">राज्य चुनें / Select state</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Question 3: Conditions (Checkboxes) */}
            <div>
              <label className="block text-base font-medium text-[#1A1A1A] mb-3">
                3️⃣ निम्नलिखित में से जो लागू हो उसे चुनें / Select all that apply:
              </label>
              <div className="space-y-3">
                {CONDITIONS.map(condition => (
                  <label
                    key={condition.id}
                    className="flex items-start gap-3 p-4 border-2 border-[#D4D4D4] rounded-lg cursor-pointer hover:bg-[#FFF5EB] transition-colors"
                    style={{
                      borderColor: selectedConditions.includes(condition.id) ? '#FF9933' : '#D4D4D4',
                      backgroundColor: selectedConditions.includes(condition.id) ? '#FFF5EB' : 'white',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(condition.id)}
                      onChange={() => toggleCondition(condition.id)}
                      className="mt-1 w-5 h-5 text-[#FF9933] border-gray-300 rounded focus:ring-[#FF9933]"
                    />
                    <span className="text-base text-[#1A1A1A] font-medium flex-1">
                      {condition.label}
                    </span>
                    {selectedConditions.includes(condition.id) && (
                      <CheckCircle className="text-[#FF9933] flex-shrink-0" size={20} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading || !age || !state}
                className="btn-primary w-full text-lg py-4 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    AI से जांच रहे हैं... / Checking with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    AI से पात्रता जांचें / Check with AI
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-[#FFF5EB] border border-[#FFD4A3] rounded-lg">
              <p className="text-xs text-[#1A1A1A]">
                <strong>ध्यान दें / Note:</strong> यह AI-आधारित प्रारंभिक जांच है। अंतिम पात्रता सरकारी अधिकारियों द्वारा तय की जाएगी। / 
                This is an AI-powered preliminary check. Final eligibility will be determined by government authorities.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-[#D4D4D4] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                <Sparkles className="inline mr-2" size={20} />
                AI द्वारा मिली योजनाएं / Schemes Found by AI
              </h2>
              <button onClick={handleReset} className="btn-secondary text-sm">
                फिर से जांचें / Check Again
              </button>
            </div>
            <p className="text-sm text-[#6B6B6B]">
              कुल {results.length} योजनाएं मिलीं / Found {results.length} schemes
            </p>
          </div>

          {/* Scheme Results */}
          {results.map((scheme, index) => (
            <div
              key={index}
              className="bg-white border-2 border-green-300 rounded-lg p-6"
            >
              {/* Scheme Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#1A1A1A]">
                    {scheme.schemeName}
                  </h3>
                  <p className="text-sm text-[#6B6B6B] mt-1">{scheme.description}</p>
                </div>
                <div className="ml-4 px-3 py-1 rounded-full border bg-green-100 text-green-800 border-green-200 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <span className="text-xs font-medium">पात्र / Eligible</span>
                </div>
              </div>

              {/* Eligibility */}
              <div className="mb-3">
                <p className="text-sm font-medium text-[#1A1A1A] mb-2">पात्रता / Eligibility:</p>
                <p className="text-sm text-[#6B6B6B]">{scheme.eligibility}</p>
              </div>

              {/* Benefits */}
              {scheme.benefits && scheme.benefits.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-[#1A1A1A] mb-2">लाभ / Benefits:</p>
                  <ul className="text-sm text-[#6B6B6B] space-y-1 ml-4 list-disc">
                    {scheme.benefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* How to Apply */}
              <div className="mb-3">
                <p className="text-sm font-medium text-[#1A1A1A] mb-2">आवेदन कैसे करें / How to Apply:</p>
                <p className="text-sm text-[#6B6B6B]">{scheme.howToApply}</p>
              </div>

              {/* Required Documents */}
              {scheme.documents && scheme.documents.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-[#1A1A1A] mb-2">आवश्यक दस्तावेज / Required Documents:</p>
                  <ul className="text-sm text-[#6B6B6B] space-y-1 ml-4 list-disc">
                    {scheme.documents.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
