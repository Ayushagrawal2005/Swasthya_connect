import { useState, useEffect } from 'react'
import { Plus, Trash2, User, Users } from 'lucide-react'
import { wellnessApi, FamilyMember } from '../../services/api'

export default function FamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    relationship: 'child' as const,
    gender: 'M' as const,
    dob: '',
    age: 0,
    bloodGroup: '',
    allergies: '',
  })

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const data = await wellnessApi.familyList()
      setMembers(data)
    } catch (err) {
      console.error('Failed to load family members', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await wellnessApi.familyAdd({
        name: form.name,
        relationship: form.relationship,
        gender: form.gender,
        dob: form.dob,
        age: form.age,
        bloodGroup: form.bloodGroup || undefined,
        allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()) : [],
      })
      setShowForm(false)
      setForm({ name: '', relationship: 'child', gender: 'M', dob: '', age: 0, bloodGroup: '', allergies: '' })
      loadMembers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this family member?')) return
    try {
      await wellnessApi.familyDelete(id)
      loadMembers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-900">Family Members</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Family Member</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relationship</label>
              <select
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="child">Child</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                required
                min="0"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blood Group</label>
              <input
                type="text"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Allergies (comma separated)</label>
              <input
                type="text"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g. Peanuts, Penicillin"
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Member
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

      <div className="grid gap-4">
        {members.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No family members added yet.</p>
            <p className="text-sm mt-1">Click "Add Member" to get started.</p>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span className="capitalize">{member.relationship}</span>
                    <span>•</span>
                    <span>{member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : 'Other'}</span>
                    <span>•</span>
                    <span>{member.age} years</span>
                    {member.bloodGroup && (
                      <>
                        <span>•</span>
                        <span>Blood: {member.bloodGroup}</span>
                      </>
                    )}
                  </div>
                  {member.allergies.length > 0 && (
                    <div className="text-sm text-orange-600 mt-1">
                      Allergies: {member.allergies.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(member.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete member"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
