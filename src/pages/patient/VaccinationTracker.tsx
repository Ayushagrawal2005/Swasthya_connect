import { useState, useEffect } from 'react'
import { Syringe, Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { wellnessApi, Vaccination, FamilyMember } from '../../services/api'

export default function VaccinationTracker() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    vaccineName: '',
    scheduledDate: '',
    dueDate: '',
    familyMemberId: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [vaxData, familyData] = await Promise.all([
        wellnessApi.vaccinationsList(),
        wellnessApi.familyList(),
      ])
      setVaccinations(vaxData)
      setFamilyMembers(familyData)
    } catch (err) {
      console.error('Failed to load vaccinations', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await wellnessApi.vaccinationsAdd({
        vaccineName: form.vaccineName,
        scheduledDate: form.scheduledDate,
        dueDate: form.dueDate,
        familyMemberId: form.familyMemberId || undefined,
        status: 'upcoming',
        notes: form.notes || undefined,
      })
      setShowForm(false)
      setForm({ vaccineName: '', scheduledDate: '', dueDate: '', familyMemberId: '', notes: '' })
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleMarkCompleted = async (id: string) => {
    try {
      await wellnessApi.vaccinationsUpdate(id, {
        status: 'completed',
        administeredDate: new Date().toISOString().split('T')[0],
      })
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />
      case 'overdue':
        return <AlertCircle className="text-red-600" size={20} />
      case 'due':
        return <AlertCircle className="text-orange-600" size={20} />
      default:
        return <Clock className="text-blue-600" size={20} />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      due: 'bg-orange-100 text-orange-800',
      upcoming: 'bg-blue-100 text-blue-800',
      skipped: 'bg-gray-100 text-gray-800',
    }
    return `px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] || colors.upcoming}`
  }

  const getMemberName = (vax: Vaccination) => {
    if (vax.familyMemberId) {
      const member = familyMembers.find(m => m.id === vax.familyMemberId)
      return member?.name || 'Family Member'
    }
    return 'Self'
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  const upcoming = vaccinations.filter(v => v.status === 'upcoming' || v.status === 'due')
  const completed = vaccinations.filter(v => v.status === 'completed')
  const overdue = vaccinations.filter(v => v.status === 'overdue')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Syringe className="text-teal-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-900">Vaccination Tracker</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={20} />
          Add Vaccination
        </button>
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-red-600" size={20} />
            <p className="font-semibold text-red-900">⚠️ {overdue.length} Overdue Vaccination(s)</p>
          </div>
          <p className="text-sm text-red-700">Please schedule appointments for overdue vaccinations.</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Vaccination</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vaccine Name</label>
              <input
                type="text"
                required
                value={form.vaccineName}
                onChange={(e) => setForm({ ...form, vaccineName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g. COVID-19 Booster"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">For</label>
              <select
                value={form.familyMemberId}
                onChange={(e) => setForm({ ...form, familyMemberId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Self</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name} ({member.relationship})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="Optional notes"
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Add Vaccination
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {upcoming.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">📅 Upcoming & Due</h2>
            <div className="grid gap-3">
              {upcoming.map((vax) => (
                <div key={vax.id} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(vax.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{vax.vaccineName}</h3>
                        <span className={getStatusBadge(vax.status)}>{vax.status}</span>
                        <span className="text-sm text-gray-600">• {getMemberName(vax)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Due: {new Date(vax.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {vax.notes && <p className="text-sm text-gray-500 mt-1">{vax.notes}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkCompleted(vax.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Mark Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">✅ Completed</h2>
            <div className="grid gap-3">
              {completed.map((vax) => (
                <div key={vax.id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                  {getStatusIcon(vax.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-700">{vax.vaccineName}</h3>
                      <span className="text-sm text-gray-600">• {getMemberName(vax)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Administered: {vax.administeredDate ? new Date(vax.administeredDate).toLocaleDateString('en-IN') : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vaccinations.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <Syringe size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No vaccinations tracked yet.</p>
            <p className="text-sm mt-1">Click "Add Vaccination" to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
