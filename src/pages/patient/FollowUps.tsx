import { useState, useEffect } from 'react'
import { Calendar, Clock, User, CheckCircle, AlertTriangle } from 'lucide-react'
import { followupsApi } from '../../services/api'
import { useApp } from '../../context/AppContext'

interface FollowUp {
  id: string
  patientId: string
  patientName: string
  ashaId: string
  ashaName: string
  dueDate: string
  reason: string
  notes: string
  status: string
  sourcePortal: string
  createdByName?: string
  completedAt?: string
  completionNotes?: string
}

export default function PatientFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const { patientId } = useApp()

  useEffect(() => {
    loadFollowUps()
  }, [])

  const loadFollowUps = async () => {
    try {
      const data = await followupsApi.list({ patientId })
      setFollowUps(data)
    } catch (err) {
      console.error('Failed to load follow-ups', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'due-today': 'bg-orange-100 text-orange-800',
      overdue: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
    }
    return `px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] || colors.pending}`
  }

  const getSourceBadge = (source: string) => {
    const colors = {
      doctor: 'bg-blue-100 text-blue-800',
      asha: 'bg-orange-100 text-orange-800',
      referral: 'bg-purple-100 text-purple-800',
      appointment: 'bg-teal-100 text-teal-800',
      triage: 'bg-pink-100 text-pink-800',
    }
    return `px-2 py-1 rounded text-xs font-medium ${colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  const pending = followUps.filter(f => f.status !== 'completed')
  const completed = followUps.filter(f => f.status === 'completed')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="text-blue-600" size={32} />
        <h1 className="text-2xl font-bold text-gray-900">My Follow-ups</h1>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">📋 Pending Follow-ups</h2>
          <div className="grid gap-4 mb-8">
            {pending.map((followup) => (
              <div key={followup.id} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{followup.reason}</h3>
                      <span className={getStatusBadge(followup.status)}>{followup.status}</span>
                      <span className={getSourceBadge(followup.sourcePortal)}>
                        from {followup.sourcePortal}
                      </span>
                    </div>
                    {followup.notes && (
                      <p className="text-sm text-gray-600 mb-2">{followup.notes}</p>
                    )}
                    {followup.createdByName && (
                      <p className="text-sm text-gray-500">Created by: {followup.createdByName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600 border-t pt-3 mt-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Due: {new Date(followup.dueDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>ASHA: {followup.ashaName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">✅ Completed Follow-ups</h2>
          <div className="grid gap-3">
            {completed.map((followup) => (
              <div key={followup.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <CheckCircle className="text-green-600" size={20} />
                      <h3 className="font-semibold">{followup.reason}</h3>
                      <span className={getSourceBadge(followup.sourcePortal)}>
                        {followup.sourcePortal}
                      </span>
                    </div>
                    {followup.completionNotes && (
                      <p className="text-sm text-gray-600 ml-8 mt-1">{followup.completionNotes}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-8 mt-1">
                      Completed: {followup.completedAt ? new Date(followup.completedAt).toLocaleDateString('en-IN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {followUps.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
          <p>No follow-ups scheduled.</p>
          <p className="text-sm mt-1">Follow-ups from your healthcare visits will appear here.</p>
        </div>
      )}
    </div>
  )
}
