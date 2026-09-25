import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, MapPin, Clock, Activity, Phone, Navigation } from 'lucide-react'
import { geolocationService } from '../../services/geolocation'
import { emergencyService } from '../../services/emergencyService'
import EmergencyMap from '../../components/emergency/EmergencyMap'

interface Facility {
  id: string
  name: string
  type: string
  address: string
  phone: string
  location: {
    lat: number
    lng: number
  }
  distance?: number
  eta?: string
  bedsAvailable?: number
}

interface EmergencyAlert {
  id: string
  patientName: string
  patientId: string
  patientLocation: {
    lat: number
    lng: number
    accuracy: number
  }
  nearestFacility: Facility
  status: 'active' | 'acknowledged' | 'en-route' | 'arrived' | 'resolved'
  triggeredAt: string
  bedReserved?: boolean
}

export default function BachaoBachaoEmergency() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0)
  const [nearestFacilities, setNearestFacilities] = useState<Facility[]>([])
  const [activeEmergency, setActiveEmergency] = useState<EmergencyAlert | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [isTracking, setIsTracking] = useState(false)

  // Get current location on mount
  useEffect(() => {
    getCurrentPosition()
  }, [])

  // Start live tracking when emergency is active
  useEffect(() => {
    if (activeEmergency && !isTracking) {
      startLiveTracking()
    }
    return () => {
      if (isTracking) {
        geolocationService.stopTracking()
      }
    }
  }, [activeEmergency])

  const getCurrentPosition = async () => {
    try {
      setLocationError('')
      const position = await geolocationService.getCurrentLocation()
      setCurrentLocation({ lat: position.latitude, lng: position.longitude })
      setLocationAccuracy(position.accuracy)
      
      // Fetch nearest facilities
      await fetchNearestFacilities(position.latitude, position.longitude)
    } catch (error: any) {
      console.error('Location error:', error)
      setLocationError(error.message || 'Unable to get location')
    }
  }

  const fetchNearestFacilities = async (lat: number, lng: number) => {
    try {
      console.log('Fetching nearest facilities for:', { lat, lng })
      const facilities = await emergencyService.findNearestFacilities(lat, lng, 50)
      console.log('Facilities found:', facilities)
      
      if (facilities && facilities.length > 0) {
        setNearestFacilities(facilities.slice(0, 5)) // Show top 5
      } else {
        console.warn('No facilities returned, will show empty state')
        setNearestFacilities([])
      }
    } catch (error) {
      console.error('Failed to fetch facilities:', error)
      // Even on error, the service should return mock data
      setNearestFacilities([])
    }
  }

  const startLiveTracking = () => {
    if (!activeEmergency) return

    const stopTracking = geolocationService.startTracking(
      async (position) => {
        // Update location in backend
        try {
          await emergencyService.updateEmergencyLocation(
            activeEmergency.id,
            {
              lat: position.latitude,
              lng: position.longitude,
              accuracy: position.accuracy,
              timestamp: new Date().toISOString()
            }
          )
          setCurrentLocation({ lat: position.latitude, lng: position.longitude })
          setLocationAccuracy(position.accuracy)
        } catch (error) {
          console.error('Failed to update location:', error)
        }
      },
      (error) => {
        console.error('Tracking error:', error)
        setLocationError(error.message)
      }
    )

    setIsTracking(true)
  }

  const handleTriggerEmergency = async () => {
    if (!currentLocation) {
      alert('Please wait for location to be determined')
      return
    }

    if (nearestFacilities.length === 0) {
      alert('No facilities found nearby. Please try again.')
      return
    }

    setIsLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      const emergencyAlert = await emergencyService.triggerEmergency({
        patientName: user.name || 'Emergency Patient',
        patientId: user.patientId || `TEMP-${Date.now()}`,
        patientPhone: user.phone || '',
        location: {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          accuracy: locationAccuracy
        },
        severity: 'critical',
        notes: 'Emergency triggered via Bachao Bachao feature',
        triggeredBy: user.username || 'asha_worker'
      })

      setActiveEmergency(emergencyAlert)
      alert(`Emergency Alert Sent! Bed Reserved at ${emergencyAlert.nearestFacility.name}`)
    } catch (error: any) {
      console.error('Failed to trigger emergency:', error)
      alert('Failed to send emergency alert. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEmergency = async () => {
    if (!activeEmergency) return

    if (confirm('Are you sure you want to cancel this emergency alert?')) {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'
        await fetch(`${API_BASE}/api/emergency/${activeEmergency.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: 'resolved', notes: 'Cancelled by user' })
        })
        setActiveEmergency(null)
        setIsTracking(false)
        geolocationService.stopTracking()
      } catch (error) {
        console.error('Failed to cancel emergency:', error)
        alert('Failed to cancel emergency')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50'
      case 'acknowledged': return 'text-yellow-600 bg-yellow-50'
      case 'en-route': return 'text-blue-600 bg-blue-50'
      case 'arrived': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-red-600 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8" />
                बचाओ बचाओ (Bachao Bachao)
              </h1>
              <p className="text-gray-600 mt-1">Emergency Alert System with Live Location Tracking</p>
            </div>
            <button
              onClick={() => navigate('/asha')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Active Emergency Alert */}
        {activeEmergency && (
          <div className="bg-red-600 text-white rounded-xl shadow-xl p-6 mb-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">🚨 EMERGENCY ACTIVE</h2>
                <p className="text-red-100">Patient: {activeEmergency.patientName}</p>
                <p className="text-red-100">Facility: {activeEmergency.nearestFacility.name}</p>
                <p className="text-red-100">Status: {activeEmergency.status.toUpperCase()}</p>
                {activeEmergency.bedReserved && (
                  <p className="text-green-300 font-semibold mt-2">✓ Bed Reserved & Ambulance Dispatched</p>
                )}
              </div>
              <button
                onClick={handleCancelEmergency}
                className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 rounded-lg font-semibold transition"
              >
                Cancel Emergency
              </button>
            </div>
          </div>
        )}

        {/* Location Error */}
        {locationError && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">{locationError}</p>
              <button
                onClick={getCurrentPosition}
                className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Current Location Info */}
        {currentLocation && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Your Current Location
              </h2>
              <button
                onClick={getCurrentPosition}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Refresh Location
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Latitude</p>
                <p className="text-lg font-bold text-blue-600">{currentLocation.lat.toFixed(6)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Longitude</p>
                <p className="text-lg font-bold text-blue-600">{currentLocation.lng.toFixed(6)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-lg font-bold text-blue-600">{locationAccuracy.toFixed(0)}m</p>
              </div>
            </div>
          </div>
        )}

        {/* Big Red Emergency Button */}
        {!activeEmergency && currentLocation && (
          <div className="bg-white rounded-xl shadow-2xl p-12 mb-6 text-center">
            <button
              onClick={handleTriggerEmergency}
              disabled={isLoading}
              className={`w-full max-w-md mx-auto h-64 rounded-full text-white text-5xl font-bold shadow-2xl transform transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-red-500 to-red-700 hover:scale-105 hover:shadow-3xl active:scale-95'
              }`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Activity className="w-16 h-16 animate-spin" />
                  <span className="text-2xl">Sending Alert...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <AlertTriangle className="w-24 h-24" />
                  <span>EMERGENCY</span>
                  <span className="text-3xl">बचाओ बचाओ</span>
                </div>
              )}
            </button>
            <p className="text-gray-600 mt-6 text-lg">
              Press to send emergency alert to nearest facility with live location tracking
            </p>
          </div>
        )}

        {/* Interactive Map */}
        {currentLocation && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" />
              Live Location & Nearest Facilities Map
            </h2>
            <div className="h-[500px] rounded-lg overflow-hidden border-4 border-green-200">
              <EmergencyMap
                patientLocation={currentLocation}
                facilities={nearestFacilities}
                accuracy={locationAccuracy}
              />
            </div>
          </div>
        )}

        {/* Nearest Facilities List */}
        {nearestFacilities.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-600" />
              Nearest Facilities ({nearestFacilities.length})
            </h2>
            <div className="space-y-4">
              {nearestFacilities.map((facility, index) => (
                <div
                  key={facility.id}
                  className={`border-2 rounded-lg p-4 transition ${
                    index === 0
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {index === 0 && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                            NEAREST
                          </span>
                        )}
                        <h3 className="text-lg font-bold">{facility.name}</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{facility.type}</p>
                      <p className="text-gray-700">{facility.address}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1 text-blue-600">
                          <MapPin className="w-4 h-4" />
                          <span className="font-semibold">{facility.distance?.toFixed(2)} km</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">ETA: {facility.eta}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <Activity className="w-4 h-4" />
                          <span className="font-semibold">{facility.bedsAvailable || 0} beds available</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={`tel:${facility.phone}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
