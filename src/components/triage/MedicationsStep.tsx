/**
 * Medications Step
 * Step 5: Current medication collection
 */

import { useState } from 'react'
import { Plus, X, Pill } from 'lucide-react'
import type { MedicationEntry } from '../../types/teleconsult'

interface Props {
  medications: MedicationEntry[]
  setMedications: (medications: MedicationEntry[]) => void
}

export function MedicationsStep({ medications, setMedications }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [newMed, setNewMed] = useState({
    medicineName: '',
    dose: '',
    frequency: '',
    type: 'tablet' as 'tablet' | 'capsule' | 'syrup' | 'injection' | 'other',
    durationValue: 0,
    durationType: 'ongoing' as 'days' | 'weeks' | 'months' | 'ongoing',
    notes: ''
  })

  function addMedication() {
    if (!newMed.medicineName.trim()) return

    const medication: MedicationEntry = {
      id: Date.now().toString(),
      medicineName: newMed.medicineName,
      dose: newMed.dose,
      frequency: newMed.frequency,
      type: newMed.type,
      durationValue: newMed.durationValue,
      durationType: newMed.durationType,
      notes: newMed.notes,
      addedAt: new Date().toISOString()
    }

    setMedications([...medications, medication])
    
    // Reset form
    setNewMed({
      medicineName: '',
      dose: '',
      frequency: '',
      type: 'tablet',
      durationValue: 0,
      durationType: 'ongoing',
      notes: ''
    })
    setShowForm(false)
  }

  function removeMedication(id: string) {
    setMedications(medications.filter(m => m.id !== id))
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2C2C2A] mb-2">
          Current Medications
        </h2>
        <p className="text-sm text-[#5F5E5A]">
          List all medications you're currently taking (including over-the-counter)
        </p>
      </div>

      {/* Existing Medications List */}
      {medications.length > 0 && (
        <div className="space-y-3">
          {medications.map((med) => (
            <div
              key={med.id}
              className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <Pill size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-blue-900">{med.medicineName}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-blue-700">
                      {med.dose && <span>Dose: {med.dose}</span>}
                      {med.frequency && <span>Frequency: {med.frequency}</span>}
                      <span className="capitalize">Type: {med.type}</span>
                      {med.durationType === 'ongoing' ? (
                        <span className="font-medium">Ongoing</span>
                      ) : (
                        <span>For: {med.durationValue} {med.durationType}</span>
                      )}
                    </div>
                    {med.notes && (
                      <p className="text-xs text-blue-600 mt-1">{med.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeMedication(med.id)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    aria-label="Remove medication"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Medications Message */}
      {medications.length === 0 && !showForm && (
        <div className="text-center py-8 text-[#5F5E5A]">
          <p className="mb-4">No current medications</p>
        </div>
      )}

      {/* Add Medication Form */}
      {showForm ? (
        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border-2 border-teal-300">
          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newMed.medicineName}
              onChange={(e) => setNewMed({ ...newMed, medicineName: e.target.value })}
              placeholder="e.g., Metformin, Amlodipine..."
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
                Dose
              </label>
              <input
                type="text"
                value={newMed.dose}
                onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                placeholder="e.g., 500mg, 5ml..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
                Frequency
              </label>
              <input
                type="text"
                value={newMed.frequency}
                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                placeholder="e.g., Twice daily, OD..."
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {['tablet', 'capsule', 'syrup', 'injection', 'other'].map((type) => (
                <button
                  key={type}
                  onClick={() => setNewMed({ ...newMed, type: type as any })}
                  className={`
                    py-2 rounded-lg border-2 text-xs font-medium transition-all capitalize
                    ${newMed.type === type
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : 'border-[#D3D1C7] hover:border-teal-300'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={newMed.durationValue}
                onChange={(e) => setNewMed({ ...newMed, durationValue: Number(e.target.value) })}
                disabled={newMed.durationType === 'ongoing'}
                placeholder="0"
                className="input-field w-24"
                min="0"
              />
              <select
                value={newMed.durationType}
                onChange={(e) => setNewMed({ ...newMed, durationType: e.target.value as any })}
                className="input-field flex-1"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={newMed.notes}
              onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
              placeholder="Any special instructions..."
              className="input-field"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false)
                setNewMed({
                  medicineName: '',
                  dose: '',
                  frequency: '',
                  type: 'tablet',
                  durationValue: 0,
                  durationType: 'ongoing',
                  notes: ''
                })
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={addMedication}
              disabled={!newMed.medicineName.trim()}
              className="btn-primary flex-1"
            >
              Add Medication
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="btn-secondary w-full justify-center"
        >
          <Plus size={18} />
          Add Medication
        </button>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-medium mb-1">💊 Why we ask</p>
        <p className="text-xs leading-relaxed">
          Knowing your current medications helps prevent drug interactions and ensures the doctor
          prescribes safe and effective treatment. Include vitamins and supplements if applicable.
        </p>
      </div>
    </div>
  )
}
