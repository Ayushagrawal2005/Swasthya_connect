import { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, Droplet, List } from 'lucide-react'
import { wellnessApi, MenstrualCycle } from '../../services/api'

export default function MenstrualTracker() {
  const [cycles, setCycles] = useState<MenstrualCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    flowIntensity: 'moderate' as const,
    symptoms: '',
    notes: '',
  })

  useEffect(() => {
    loadCycles()
  }, [])

  const loadCycles = async () => {
    try {
      const data = await wellnessApi.menstrualList()
      setCycles(data)
    } catch (err: any) {
      if (err.message.includes('Access denied')) {
        alert('This feature is only available for female patients.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Check if a cycle already exists in the same month as the start date
      const startDate = new Date(form.startDate)
      const startMonth = startDate.getMonth()
      const startYear = startDate.getFullYear()
      
      const existingCycleInMonth = cycles.some(cycle => {
        const cycleStart = new Date(cycle.startDate)
        return cycleStart.getMonth() === startMonth && cycleStart.getFullYear() === startYear
      })
      
      if (existingCycleInMonth) {
        alert(`⚠️ You already have a cycle logged for ${startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}. Only one cycle per month is allowed. Please delete the existing cycle first or choose a different month.`)
        return
      }

      const cycleLength = form.endDate
        ? Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : undefined

      await wellnessApi.menstrualAdd({
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        cycleLength,
        flowIntensity: form.flowIntensity,
        symptoms: form.symptoms ? form.symptoms.split(',').map(s => s.trim()) : [],
        notes: form.notes || undefined,
      })
      setShowForm(false)
      setForm({ startDate: '', endDate: '', flowIntensity: 'moderate', symptoms: '', notes: '' })
      loadCycles()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cycle record?')) return
    try {
      await wellnessApi.menstrualDelete(id)
      loadCycles()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const predictNextPeriod = () => {
    if (cycles.length < 2) return null
    const avgCycle = cycles
      .filter(c => c.cycleLength)
      .slice(0, 3)
      .reduce((sum, c) => sum + (c.cycleLength || 0), 0) / Math.min(3, cycles.filter(c => c.cycleLength).length)
    
    if (!avgCycle) return null
    const lastStart = new Date(cycles[0].startDate)
    const predicted = new Date(lastStart.getTime() + avgCycle * 24 * 60 * 60 * 1000)
    return predicted.toISOString().split('T')[0]
  }

  const predictOvulation = () => {
    if (cycles.length < 2) return null
    const avgCycle = cycles
      .filter(c => c.cycleLength)
      .slice(0, 3)
      .reduce((sum, c) => sum + (c.cycleLength || 0), 0) / Math.min(3, cycles.filter(c => c.cycleLength).length)
    
    if (!avgCycle) return null
    const lastStart = new Date(cycles[0].startDate)
    // Ovulation typically occurs 14 days before next period
    const nextPeriod = new Date(lastStart.getTime() + avgCycle * 24 * 60 * 60 * 1000)
    const ovulation = new Date(nextPeriod.getTime() - 14 * 24 * 60 * 60 * 1000)
    return ovulation.toISOString().split('T')[0]
  }

  const getFertileWindow = () => {
    const ovulationDate = predictOvulation()
    if (!ovulationDate) return []
    
    const ovulation = new Date(ovulationDate)
    const fertileWindow = []
    
    // Fertile window is typically 5 days before ovulation to 1 day after
    for (let i = -5; i <= 1; i++) {
      const date = new Date(ovulation.getTime() + i * 24 * 60 * 60 * 1000)
      fertileWindow.push(date.toISOString().split('T')[0])
    }
    
    return fertileWindow
  }

  const handleDateClick = async (dateStr: string) => {
    // Check if a cycle already exists in the same month
    const clickedDate = new Date(dateStr)
    const clickedMonth = clickedDate.getMonth()
    const clickedYear = clickedDate.getFullYear()
    
    const existingCycleInMonth = cycles.some(cycle => {
      const cycleStart = new Date(cycle.startDate)
      return cycleStart.getMonth() === clickedMonth && cycleStart.getFullYear() === clickedYear
    })
    
    if (existingCycleInMonth) {
      alert(`⚠️ You already have a cycle logged for ${clickedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}. Only one cycle per month is allowed. Please delete the existing cycle first or choose a different month.`)
      return
    }
    
    // Auto-create 5-day period when clicking a date
    const startDate = dateStr
    const endDate = new Date(new Date(dateStr).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    if (confirm(`Start a new 5-day cycle from ${clickedDate.toLocaleDateString('en-IN')}?`)) {
      try {
        await wellnessApi.menstrualAdd({
          startDate,
          endDate,
          cycleLength: undefined,
          flowIntensity: 'moderate',
          symptoms: [],
          notes: '',
        })
        loadCycles()
      } catch (err: any) {
        alert(err.message)
      }
    }
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()

    console.log('=== MENSTRUAL CALENDAR DEBUG ===')
    console.log('Cycles:', cycles.length)
    console.log('Cycles data:', cycles)

    // Generate predicted cycles for next 12 months
    const allPredictedPeriods: Array<{start: string, end: string}> = []
    
    if (cycles.length >= 2) {
      const validCycles = cycles.filter(c => c.cycleLength && c.cycleLength > 0)
      console.log('Valid cycles with cycleLength:', validCycles.length)
      
      if (validCycles.length >= 2) {
        const avgCycle = validCycles
          .slice(0, 3)
          .reduce((sum, c) => sum + (c.cycleLength || 0), 0) / Math.min(3, validCycles.length)
        
        console.log('Average cycle length:', avgCycle)
        
        const lastCycle = cycles[0]
        let nextDate = new Date(lastCycle.startDate)
        nextDate.setDate(nextDate.getDate() + Math.round(avgCycle))
        
        // Generate 12 predicted cycles
        for (let i = 0; i < 12; i++) {
          const startStr = nextDate.toISOString().split('T')[0]
          const endDate = new Date(nextDate.getTime() + 5 * 24 * 60 * 60 * 1000)
          const endStr = endDate.toISOString().split('T')[0]
          
          allPredictedPeriods.push({ start: startStr, end: endStr })
          
          nextDate = new Date(nextDate.getTime() + Math.round(avgCycle) * 24 * 60 * 60 * 1000)
        }
        
        console.log('Predicted periods:', allPredictedPeriods)
      }
    }

    // Generate ovulation dates (14 days before each predicted period)
    const allOvulationDates: string[] = []
    allPredictedPeriods.forEach(period => {
      const periodStart = new Date(period.start)
      const ovulation = new Date(periodStart.getTime() - 14 * 24 * 60 * 60 * 1000)
      allOvulationDates.push(ovulation.toISOString().split('T')[0])
    })
    console.log('Ovulation dates:', allOvulationDates)

    // Generate fertile windows (5 days before + 1 day after ovulation)
    const allFertileWindows: string[] = []
    allOvulationDates.forEach(ovDate => {
      const ov = new Date(ovDate)
      for (let i = -5; i <= 1; i++) {
        if (i !== 0) { // Skip ovulation day itself
          const date = new Date(ov.getTime() + i * 24 * 60 * 60 * 1000)
          allFertileWindows.push(date.toISOString().split('T')[0])
        }
      }
    })
    console.log('Fertile window dates:', allFertileWindows.length)

    const days = []
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      // Check if date falls in recorded cycles
      const isRecordedPeriod = cycles.some(c => {
        const start = new Date(c.startDate)
        const end = c.endDate ? new Date(c.endDate) : new Date(c.startDate)
        end.setHours(23, 59, 59, 999)
        const current = new Date(dateStr)
        return current >= start && current <= end
      })

      // Check if date falls in predicted cycles
      const isPredictedPeriod = allPredictedPeriods.some(period => {
        const start = new Date(period.start)
        const end = new Date(period.end)
        end.setHours(23, 59, 59, 999)
        const current = new Date(dateStr)
        return current >= start && current <= end
      })

      const isOvulation = allOvulationDates.includes(dateStr)
      const isFertile = allFertileWindows.includes(dateStr)

      let bgColor = 'bg-white hover:bg-gray-50'
      let borderColor = 'border-gray-200'
      let icon = null
      let textColor = 'text-gray-700'

      if (isRecordedPeriod) {
        bgColor = 'bg-pink-200 hover:bg-pink-300'
        borderColor = 'border-pink-400'
        textColor = 'text-pink-900'
        icon = <Droplet size={14} className="text-pink-700" />
      } else if (isPredictedPeriod) {
        bgColor = 'bg-pink-50 hover:bg-pink-100'
        borderColor = 'border-pink-300 border-dashed'
        textColor = 'text-pink-800'
        icon = <span className="text-xs text-pink-600">?</span>
      } else if (isOvulation) {
        bgColor = 'bg-purple-200 hover:bg-purple-300'
        borderColor = 'border-purple-400'
        textColor = 'text-purple-900'
        icon = <span className="text-xs text-purple-700 font-bold">OV</span>
      } else if (isFertile) {
        bgColor = 'bg-purple-50 hover:bg-purple-100'
        borderColor = 'border-purple-200'
        textColor = 'text-purple-700'
      }

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(dateStr)}
          className={`aspect-square border p-1 text-sm flex flex-col cursor-pointer transition ${bgColor} ${borderColor}`}
          title={`Click to start 5-day cycle from ${dateStr}`}
        >
          <span className={`${textColor} font-semibold`}>{day}</span>
          <div className="flex-1 flex items-end justify-center">
            {icon}
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
          >
            ← Prev
          </button>
          <h2 className="text-xl font-semibold">
            {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
          >
            Next →
          </button>
        </div>

        {cycles.length < 2 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ℹ️ Log at least 2 cycles to see predictions, ovulation, and fertile windows
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-sm font-bold text-gray-700 py-2 bg-gray-100 rounded">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">{days}</div>
        
        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-3 text-gray-700">Legend</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-pink-200 border-2 border-pink-400 rounded"></div>
              <span className="font-medium">Recorded period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-pink-50 border-2 border-pink-300 border-dashed rounded"></div>
              <span className="font-medium">Predicted period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-200 border-2 border-purple-400 rounded flex items-center justify-center text-xs font-bold text-purple-700">OV</div>
              <span className="font-medium">Ovulation day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-50 border-2 border-purple-200 rounded"></div>
              <span className="font-medium">Fertile window</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3 italic">
            💡 Click any date to quickly log a 5-day cycle starting from that date
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  const nextPeriod = predictNextPeriod()
  const ovulation = predictOvulation()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-pink-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-900">Menstrual Cycle Tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded ${
                viewMode === 'list' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <List size={18} />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded ${
                viewMode === 'calendar' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Calendar size={18} />
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            <Plus size={20} />
            Add Cycle
          </button>
        </div>
      </div>

      {(nextPeriod || ovulation) && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {nextPeriod && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <p className="text-sm font-medium text-pink-900 mb-1">📅 Predicted Next Period</p>
              <p className="text-2xl font-bold text-pink-700">
                {new Date(nextPeriod).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-pink-600 mt-1">
                {Math.ceil((new Date(nextPeriod).getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days from today
              </p>
            </div>
          )}
          {ovulation && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900 mb-1">🌸 Predicted Ovulation</p>
              <p className="text-2xl font-bold text-purple-700">
                {new Date(ovulation).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {Math.ceil((new Date(ovulation).getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days from today
              </p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Log Menstrual Cycle</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date (optional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Flow Intensity</label>
              <select
                value={form.flowIntensity}
                onChange={(e) => setForm({ ...form, flowIntensity: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Symptoms (comma separated)</label>
              <input
                type="text"
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g. Cramps, Headache"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                Log Cycle
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

      {viewMode === 'calendar' ? (
        renderCalendar()
      ) : (
        <div className="grid gap-4">
        {cycles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No cycles logged yet.</p>
            <p className="text-sm mt-1">Start tracking to predict your next period.</p>
          </div>
        ) : (
          cycles.map((cycle) => (
            <div key={cycle.id} className="bg-white rounded-lg shadow-md p-4 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-pink-100 p-3 rounded-full">
                  <Droplet className="text-pink-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {new Date(cycle.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {cycle.endDate && ` - ${new Date(cycle.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    {cycle.cycleLength && <span>Duration: {cycle.cycleLength} days</span>}
                    {cycle.flowIntensity && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{cycle.flowIntensity} flow</span>
                      </>
                    )}
                  </div>
                  {cycle.symptoms && cycle.symptoms.length > 0 && (
                    <div className="text-sm text-gray-700 mt-2">
                      <strong>Symptoms:</strong> {Array.isArray(cycle.symptoms) ? cycle.symptoms.join(', ') : cycle.symptoms}
                    </div>
                  )}
                  {cycle.notes && (
                    <div className="text-sm text-gray-600 mt-1 italic">{cycle.notes}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(cycle.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete cycle"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  )
}
