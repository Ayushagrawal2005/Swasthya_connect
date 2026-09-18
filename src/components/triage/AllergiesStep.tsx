/**
 * Allergies Step
 * Step 4: Allergy collection and management
 */

import { useState } from 'react'
import { Plus, X, AlertTriangle } from 'lucide-react'
import type { AllergyEntry } from '../../types/teleconsult'

interface Props {
  allergies: AllergyEntry[]
  setAllergies: (allergies: AllergyEntry[]) => void
}

export function AllergiesStep({ allergies, setAllergies }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [newAllergy, setNewAllergy] = useState({
    name: '',
    severity: 'mild' as 'mild' | 'moderate' | 'severe',
    duration: '',
    stillExists: true,
    notes: ''
  })

  function addAllergy() {
    if (!newAllergy.name.trim()) return

    const allergyEntry: AllergyEntry = {
      id: Date.now().toString(),
      name: newAllergy.name,
      severity: newAllergy.severity,
      duration: newAllergy.duration,
      stillExists: newAllergy.stillExists,
      notes: newAllergy.notes,
      addedAt: new Date().toISOString()
    }

    setAllergies([...allergies, allergyEntry])
    
    // Reset form
    setNewAllergy({
      name: '',
      severity: 'mild',
      duration: '',
      stillExists: true,
      notes: ''
    })
    setShowForm(false)
  }

  function removeAllergy(id: string) {
    setAllergies(allergies.filter(a => a.id !== id))
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2C2C2A] mb-2">
          Allergies
        </h2>
        <p className="text-sm text-[#5F5E5A]">
          List any known allergies to medications, foods, or other substances
        </p>
      </div>

      {/* Existing Allergies List */}
      {allergies.length > 0 && (
        <div className="space-y-3">
          {allergies.map((allergy) => (
            <div
              key={allergy.id}
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-red-900">{allergy.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs">
                      <span className={`
                        px-2 py-0.5 rounded-full
                        ${allergy.severity === 'severe' ? 'bg-red-200 text-red-900' :
                          allergy.severity === 'moderate' ? 'bg-orange-200 text-orange-900' :
                          'bg-yellow-200 text-yellow-900'}
                      `}>
                        {allergy.severity}
                      </span>
                      {allergy.duration && (
                        <span className="text-red-700">Since: {allergy.duration}</span>
                      )}
                      {!allergy.stillExists && (
                        <span className="text-red-700">(Resolved)</span>
                      )}
                    </div>
                    {allergy.notes && (
                      <p className="text-xs text-red-700 mt-1">{allergy.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeAllergy(allergy.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    aria-label="Remove allergy"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Allergies Message */}
      {allergies.length === 0 && !showForm && (
        <div className="text-center py-8 text-[#5F5E5A]">
          <p className="mb-4">No allergies recorded</p>
        </div>
      )}

      {/* Add Allergy Form */}
      {showForm ? (
        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border-2 border-teal-300">
          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Allergy Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newAllergy.name}
              onChange={(e) => setNewAllergy({ ...newAllergy, name: e.target.value })}
              placeholder="e.g., Penicillin, Peanuts, Dust..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Severity
            </label>
            <div className="flex gap-2">
              {['mild', 'moderate', 'severe'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setNewAllergy({ ...newAllergy, severity: sev as any })}
                  className={`
                    flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all capitalize
                    ${newAllergy.severity === sev
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : 'border-[#D3D1C7] hover:border-teal-300'
                    }
                  `}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
                Duration
              </label>
              <input
                type="text"
                value={newAllergy.duration}
                onChange={(e) => setNewAllergy({ ...newAllergy, duration: e.target.value })}
                placeholder="e.g., Since childhood"
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAllergy.stillExists}
                  onChange={(e) => setNewAllergy({ ...newAllergy, stillExists: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                Still exists
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Additional Notes
            </label>
            <textarea
              value={newAllergy.notes}
              onChange={(e) => setNewAllergy({ ...newAllergy, notes: e.target.value })}
              placeholder="Reaction symptoms, severity details..."
              className="input-field min-h-[60px] resize-none"
              maxLength={200}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false)
                setNewAllergy({
                  name: '',
                  severity: 'mild',
                  duration: '',
                  stillExists: true,
                  notes: ''
                })
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={addAllergy}
              disabled={!newAllergy.name.trim()}
              className="btn-primary flex-1"
            >
              Add Allergy
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn-secondary w-full justify-center"
        >
          <Plus size={18} />
          Add Allergy
        </button>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">⚠️ Important</p>
        <p className="text-xs leading-relaxed">
          Please list all known allergies. This information helps prevent potentially dangerous
          medication reactions. If you're not sure, select "No known allergies" and discuss with the doctor.
        </p>
      </div>

      {/* No Known Allergies Button */}
      {allergies.length === 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-full justify-center text-base py-3"
        >
          <Plus size={18} />
          Add Allergy Information
        </button>
      )}
    </div>
  )
}
