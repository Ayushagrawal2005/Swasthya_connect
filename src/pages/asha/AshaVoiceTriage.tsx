import { useEffect } from 'react'

export function AshaVoiceTriage() {
  useEffect(() => {
    // Redirect to the standalone voice triage HTML
    window.location.href = '/voice-triage.html'
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Voice Triage System...</p>
      </div>
    </div>
  )
}
