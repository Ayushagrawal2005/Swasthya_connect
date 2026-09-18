import { useState, useEffect } from 'react'
import { Baby, Plus, Calendar, Heart, List } from 'lucide-react'
import { wellnessApi, PregnancyTracker as PT } from '../../services/api'

export default function PregnancyTracker() {
  const [trackers, setTrackers] = useState<PT[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'overview' | 'timeline'>('overview')
  const [form, setForm] = useState({
    lmp: '',
    edd: '',
  })

  useEffect(() => {
    loadTrackers()
  }, [])

  const loadTrackers = async () => {
    try {
      const data = await wellnessApi.pregnancyList()
      setTrackers(data)
    } catch (err: any) {
      if (err.message.includes('Access denied')) {
        alert('This feature is only available for female patients.')
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateWeeksPregnant = (lmpDate: string) => {
    const lmp = new Date(lmpDate)
    const now = new Date()
    const diffMs = now.getTime() - lmp.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    return Math.floor(diffDays / 7)
  }

  const calculateEDD = (lmpDate: string) => {
    // Naegele's rule: LMP + 280 days (40 weeks)
    const lmp = new Date(lmpDate)
    lmp.setDate(lmp.getDate() + 280)
    return lmp.toISOString().split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const currentWeek = calculateWeeksPregnant(form.lmp)
      const calculatedEDD = form.edd || calculateEDD(form.lmp)
      
      await wellnessApi.pregnancyAdd({
        lmp: form.lmp,
        edd: calculatedEDD,
        currentWeek,
      })
      setShowForm(false)
      setForm({ lmp: '', edd: '' })
      loadTrackers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleMarkDelivered = async (id: string) => {
    try {
      await wellnessApi.pregnancyUpdate(id, {
        status: 'delivered',
        deliveryDate: new Date().toISOString().split('T')[0],
      })
      loadTrackers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const renderTimeline = (tracker: PT) => {
    const totalWeeks = 40
    const currentWeek = calculateWeeksPregnant(tracker.lmp)
    const trimester1End = 13
    const trimester2End = 27

    const milestones = [
      { week: 4, label: 'Heartbeat begins', icon: '💓' },
      { week: 8, label: 'Organs forming', icon: '🌱' },
      { week: 12, label: 'First trimester complete', icon: '✨' },
      { week: 16, label: 'Gender can be seen', icon: '👶' },
      { week: 20, label: 'Movement felt', icon: '🤸' },
      { week: 24, label: 'Viability', icon: '💪' },
      { week: 28, label: 'Third trimester', icon: '🎯' },
      { week: 32, label: 'Brain development', icon: '🧠' },
      { week: 36, label: 'Full term approaching', icon: '🎊' },
      { week: 40, label: 'Due date', icon: '🎉' },
    ]

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-6">Pregnancy Timeline</h2>
        
        {/* Trimester Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-lg border-2 ${currentWeek <= trimester1End ? 'bg-pink-50 border-pink-300' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="font-semibold text-center mb-2">1st Trimester</h3>
            <p className="text-center text-sm text-gray-600">Weeks 1-13</p>
            {currentWeek <= trimester1End && (
              <p className="text-center text-lg font-bold text-pink-600 mt-2">Current</p>
            )}
          </div>
          <div className={`p-4 rounded-lg border-2 ${currentWeek > trimester1End && currentWeek <= trimester2End ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="font-semibold text-center mb-2">2nd Trimester</h3>
            <p className="text-center text-sm text-gray-600">Weeks 14-27</p>
            {currentWeek > trimester1End && currentWeek <= trimester2End && (
              <p className="text-center text-lg font-bold text-purple-600 mt-2">Current</p>
            )}
          </div>
          <div className={`p-4 rounded-lg border-2 ${currentWeek > trimester2End ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="font-semibold text-center mb-2">3rd Trimester</h3>
            <p className="text-center text-sm text-gray-600">Weeks 28-40</p>
            {currentWeek > trimester2End && (
              <p className="text-center text-lg font-bold text-blue-600 mt-2">Current</p>
            )}
          </div>
        </div>

        {/* Week Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Week {currentWeek} of 40</span>
            <span>{Math.round((currentWeek / totalWeeks) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 h-4 rounded-full transition-all"
              style={{ width: `${Math.min((currentWeek / totalWeeks) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-4">
          <h3 className="font-semibold mb-3">Key Milestones</h3>
          {milestones.map((milestone) => (
            <div
              key={milestone.week}
              className={`flex items-start gap-4 p-3 rounded-lg border ${
                currentWeek >= milestone.week
                  ? 'bg-green-50 border-green-300'
                  : currentWeek === milestone.week - 1
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span className="text-2xl">{milestone.icon}</span>
              <div className="flex-1">
                <p className="font-semibold">Week {milestone.week}</p>
                <p className="text-sm text-gray-600">{milestone.label}</p>
              </div>
              {currentWeek >= milestone.week && (
                <span className="text-green-600 font-semibold">✓</span>
              )}
              {currentWeek === milestone.week - 1 && (
                <span className="text-yellow-600 font-semibold">→</span>
              )}
            </div>
          ))}
        </div>

        {/* Countdown */}
        <div className="mt-8 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg text-center">
          <p className="text-sm text-gray-700 mb-1">Days until due date</p>
          <p className="text-3xl font-bold text-purple-600">
            {Math.max(0, Math.ceil((new Date(tracker.edd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  const activeTracker = trackers.find(t => t.status === 'active')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Baby className="text-purple-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-900">Pregnancy Tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          {activeTracker && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('overview')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded ${
                  viewMode === 'overview' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <List size={18} />
                Overview
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded ${
                  viewMode === 'timeline' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Calendar size={18} />
                Timeline
              </button>
            </div>
          )}
          {!activeTracker && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={20} />
              Start Tracking
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Start Pregnancy Tracking</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Last Menstrual Period (LMP)</label>
              <input
                type="date"
                required
                value={form.lmp}
                onChange={(e) => setForm({ ...form, lmp: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Delivery Date (EDD)</label>
              <input
                type="date"
                required
                value={form.edd}
                onChange={(e) => setForm({ ...form, edd: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Start Tracking
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

      {activeTracker && (
        <>
          {viewMode === 'timeline' ? (
            renderTimeline(activeTracker)
          ) : (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 mb-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="text-purple-600" size={28} />
                <h2 className="text-xl font-bold text-purple-900">Active Pregnancy</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Current Week</p>
                  <p className="text-3xl font-bold text-purple-600">{calculateWeeksPregnant(activeTracker.lmp)}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Last Menstrual Period</p>
                  <p className="text-lg font-semibold">
                    {new Date(activeTracker.lmp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Expected Delivery</p>
                  <p className="text-lg font-semibold">
                    {new Date(activeTracker.edd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {activeTracker.checkups.length > 0 && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-3">Checkup History</h3>
                  <div className="space-y-2">
                    {activeTracker.checkups.map((checkup, idx) => (
                      <div key={idx} className="border-l-2 border-purple-300 pl-3 py-1">
                        <p className="text-sm font-medium">
                          {new Date(checkup.date).toLocaleDateString('en-IN')} - {checkup.worker}
                        </p>
                        <p className="text-sm text-gray-600">{checkup.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTracker.complications.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-orange-900 mb-2">⚠️ Complications</h3>
                  <ul className="list-disc list-inside text-sm text-orange-800">
                    {activeTracker.complications.map((comp, idx) => (
                      <li key={idx}>{comp}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => handleMarkDelivered(activeTracker.id)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mark as Delivered
              </button>
            </div>
          )}
        </>
      )}

      {trackers.filter(t => t.status !== 'active').length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Past Pregnancies</h2>
          <div className="grid gap-4">
            {trackers
              .filter(t => t.status !== 'active')
              .map((tracker) => (
                <div key={tracker.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="text-gray-500" size={20} />
                    <h3 className="font-semibold">
                      {tracker.status === 'delivered' ? '✅ Delivered' : '❌ Terminated'}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <p>LMP: {new Date(tracker.lmp).toLocaleDateString('en-IN')}</p>
                    <p>EDD: {new Date(tracker.edd).toLocaleDateString('en-IN')}</p>
                    {tracker.deliveryDate && (
                      <p className="col-span-2">
                        Delivery: {new Date(tracker.deliveryDate).toLocaleDateString('en-IN')}
                      </p>
                    )}
                    {tracker.babyGender && <p>Baby Gender: {tracker.babyGender === 'M' ? 'Male' : 'Female'}</p>}
                    {tracker.babyWeight && <p>Baby Weight: {tracker.babyWeight}</p>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {trackers.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          <Baby size={48} className="mx-auto mb-3 text-gray-300" />
          <p>No pregnancy records yet.</p>
          <p className="text-sm mt-1">Click "Start Tracking" to begin.</p>
        </div>
      )}
    </div>
  )
}
