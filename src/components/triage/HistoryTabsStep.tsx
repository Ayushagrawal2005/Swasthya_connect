/**
 * History Tabs Step
 * Step 3: Medical, Personal, and Family history collection
 */

import { useState } from 'react'
import { Activity, User, Users } from 'lucide-react'
import type { PatientHistory } from '../../types/teleconsult'

interface Props {
  history: PatientHistory
  setHistory: (history: PatientHistory) => void
}

const medicalConditions = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Tuberculosis',
  'Kidney Disease', 'Liver Disease', 'Thyroid Disorder', 'Cancer',
  'Mental Illness', 'Surgery History', 'Obstetric/Gynecology'
]

const personalFactors = [
  'Smoking', 'Alcohol', 'Tobacco', 'Drug Use', 'Diet Issues',
  'Physical Inactivity', 'Occupational Hazard', 'Stress'
]

const familyConditions = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Cancer', 'Asthma',
  'Mental Illness', 'Stroke', 'Kidney Disease', 'Genetic Disorders'
]

export function HistoryTabsStep({ history, setHistory }: Props) {
  const [activeTab, setActiveTab] = useState<'medical' | 'personal' | 'family'>('medical')

  function toggleMedical(condition: string) {
    const current = history.medical || []
    if (current.includes(condition)) {
      setHistory({ ...history, medical: current.filter(c => c !== condition) })
    } else {
      setHistory({ ...history, medical: [...current, condition] })
    }
  }

  function togglePersonal(factor: string) {
    const current = history.personal || []
    if (current.includes(factor)) {
      setHistory({ ...history, personal: current.filter(f => f !== factor) })
    } else {
      setHistory({ ...history, personal: [...current, factor] })
    }
  }

  function toggleFamily(condition: string) {
    const current = history.family || []
    if (current.includes(condition)) {
      setHistory({ ...history, family: current.filter(c => c !== condition) })
    } else {
      setHistory({ ...history, family: [...current, condition] })
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2C2C2A] mb-2">
          Health History
        </h2>
        <p className="text-sm text-[#5F5E5A]">
          This information helps the doctor understand your complete health picture
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#D3D1C7]">
        <button
          onClick={() => setActiveTab('medical')}
          className={`
            flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
            ${activeTab === 'medical'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
            }
          `}
        >
          <Activity size={18} />
          Medical
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`
            flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
            ${activeTab === 'personal'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
            }
          `}
        >
          <User size={18} />
          Personal
        </button>
        <button
          onClick={() => setActiveTab('family')}
          className={`
            flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
            ${activeTab === 'family'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
            }
          `}
        >
          <Users size={18} />
          Family
        </button>
      </div>

      {/* Medical History Tab */}
      {activeTab === 'medical' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-3">
              Select any conditions you have or had:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {medicalConditions.map((condition) => (
                <button
                  key={condition}
                  onClick={() => toggleMedical(condition)}
                  className={`
                    px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all
                    ${history.medical?.includes(condition)
                      ? 'border-teal-500 bg-teal-50 text-teal-900'
                      : 'border-[#D3D1C7] hover:border-teal-300 text-[#2C2C2A]'
                    }
                  `}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Additional Medical History
            </label>
            <textarea
              value={history.medicalNotes || ''}
              onChange={(e) => setHistory({ ...history, medicalNotes: e.target.value })}
              placeholder="Any other medical conditions, surgeries, hospitalizations..."
              className="input-field min-h-[100px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-[#5F5E5A] mt-1">
              {(history.medicalNotes || '').length}/1000
            </p>
          </div>
        </div>
      )}

      {/* Personal History Tab */}
      {activeTab === 'personal' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-3">
              Lifestyle and Personal Factors:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {personalFactors.map((factor) => (
                <button
                  key={factor}
                  onClick={() => togglePersonal(factor)}
                  className={`
                    px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all
                    ${history.personal?.includes(factor)
                      ? 'border-teal-500 bg-teal-50 text-teal-900'
                      : 'border-[#D3D1C7] hover:border-teal-300 text-[#2C2C2A]'
                    }
                  `}
                >
                  {factor}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Additional Personal History
            </label>
            <textarea
              value={history.personalNotes || ''}
              onChange={(e) => setHistory({ ...history, personalNotes: e.target.value })}
              placeholder="Diet habits, exercise routine, work environment, sleep patterns..."
              className="input-field min-h-[100px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-[#5F5E5A] mt-1">
              {(history.personalNotes || '').length}/1000
            </p>
          </div>
        </div>
      )}

      {/* Family History Tab */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-3">
              Conditions that run in your family:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {familyConditions.map((condition) => (
                <button
                  key={condition}
                  onClick={() => toggleFamily(condition)}
                  className={`
                    px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all
                    ${history.family?.includes(condition)
                      ? 'border-teal-500 bg-teal-50 text-teal-900'
                      : 'border-[#D3D1C7] hover:border-teal-300 text-[#2C2C2A]'
                    }
                  `}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Additional Family History
            </label>
            <textarea
              value={history.familyNotes || ''}
              onChange={(e) => setHistory({ ...history, familyNotes: e.target.value })}
              placeholder="Any hereditary conditions, family medical history..."
              className="input-field min-h-[100px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-[#5F5E5A] mt-1">
              {(history.familyNotes || '').length}/1000
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-medium mb-1">💡 Why we collect this</p>
        <p className="text-xs leading-relaxed">
          Family and personal history helps identify risk factors and genetic predispositions.
          This information is kept confidential and only shared with your healthcare providers.
        </p>
      </div>
    </div>
  )
}
