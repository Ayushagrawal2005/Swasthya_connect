/**
 * Emergency Service for "Bachao Bachao" Feature
 * Handles emergency escalation, nearest facility finding, and live tracking
 */

import { geolocationService, type LocationData } from './geolocation'

export interface EmergencyFacility {
  id: string
  name: string
  type: 'phc' | 'chc' | 'dh'
  latitude: number
  longitude: number
  distance: number // in km
  hasAmbulance: boolean
  bedsAvailable: number
  contactNumber: string
  estimatedArrivalTime: string // in minutes
}

export interface EmergencyAlert {
  id: string
  patientName: string
  patientId?: string
  reason: string
  severity: 'critical' | 'high' | 'medium'
  location: LocationData
  nearestFacilities: EmergencyFacility[]
  targetFacility?: EmergencyFacility
  status: 'active' | 'acknowledged' | 'ambulance_dispatched' | 'arrived' | 'resolved'
  triggeredBy: string
  triggeredByRole: 'asha' | 'doctor' | 'patient'
  createdAt: string
  updates: EmergencyUpdate[]
}

export interface EmergencyUpdate {
  timestamp: string
  location: LocationData
  status: string
  note?: string
}

interface CreateEmergencyRequest {
  patientName: string
  patientId?: string
  reason: string
  severity: 'critical' | 'high' | 'medium'
  location: LocationData
  triggeredBy: string
  triggeredByRole: 'asha' | 'doctor' | 'patient'
}

class EmergencyService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  private activeEmergencyId: string | null = null
  private locationUpdateInterval: number | null = null

  /**
   * Find nearest facilities from current location
   */
  async findNearestFacilities(
    latitude: number,
    longitude: number,
    radius: number = 50 // km
  ): Promise<EmergencyFacility[]> {
    try {
      console.log(`Fetching facilities from API: lat=${latitude}, lng=${longitude}, radius=${radius}`)
      const response = await fetch(
        `${this.baseUrl}/api/emergency/nearest-facilities?lat=${latitude}&lng=${longitude}&radius=${radius}`
      )

      console.log('API Response status:', response.status)

      if (!response.ok) {
        console.warn('API returned non-OK status, falling back to mock data')
        return this.getMockNearestFacilities(latitude, longitude)
      }

      const facilities: EmergencyFacility[] = await response.json()
      console.log('Facilities from API:', facilities)

      // Sort by distance
      return facilities.sort((a, b) => a.distance - b.distance)
    } catch (error) {
      console.error('Error finding nearest facilities:', error)
      // Return mock data as fallback
      console.log('Using mock facilities as fallback')
      return this.getMockNearestFacilities(latitude, longitude)
    }
  }

  /**
   * Trigger "Bachao Bachao" emergency alert
   */
  async triggerEmergency(request: CreateEmergencyRequest): Promise<EmergencyAlert> {
    try {
      const nearestFacilities = await this.findNearestFacilities(
        request.location.latitude,
        request.location.longitude
      )

      // Select target facility (nearest with available beds)
      const targetFacility = nearestFacilities.find(f => f.bedsAvailable > 0) || nearestFacilities[0]

      const response = await fetch(`${this.baseUrl}/api/emergency/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...request,
          nearestFacilities,
          targetFacilityId: targetFacility?.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger emergency')
      }

      const alert: EmergencyAlert = await response.json()
      this.activeEmergencyId = alert.id

      // Start live location tracking
      this.startLiveTracking(alert.id)

      return alert
    } catch (error) {
      console.error('Error triggering emergency:', error)
      throw error
    }
  }

  /**
   * Update emergency location (for live tracking)
   */
  async updateEmergencyLocation(
    emergencyId: string,
    location: LocationData
  ): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/emergency/${emergencyId}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ location }),
      })
    } catch (error) {
      console.error('Error updating emergency location:', error)
    }
  }

  /**
   * Get emergency status
   */
  async getEmergencyStatus(emergencyId: string): Promise<EmergencyAlert> {
    const response = await fetch(`${this.baseUrl}/api/emergency/${emergencyId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get emergency status')
    }

    return response.json()
  }

  /**
   * Start live location tracking for active emergency
   */
  startLiveTracking(emergencyId: string): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval)
    }

    geolocationService.startTracking(
      (location) => {
        // Update location every 10 seconds
        this.updateEmergencyLocation(emergencyId, location)
      },
      (error) => {
        console.error('Location tracking error:', error)
      }
    )

    // Also send updates periodically
    this.locationUpdateInterval = window.setInterval(() => {
      const location = geolocationService.getLastLocation()
      if (location) {
        this.updateEmergencyLocation(emergencyId, location)
      }
    }, 10000) // Every 10 seconds
  }

  /**
   * Stop live tracking
   */
  stopLiveTracking(): void {
    geolocationService.stopTracking()
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval)
      this.locationUpdateInterval = null
    }
    this.activeEmergencyId = null
  }

  /**
   * Acknowledge emergency (facility response)
   */
  async acknowledgeEmergency(
    emergencyId: string,
    data: {
      bedReserved: boolean
      bedNumber?: string
      ambulanceDispatched: boolean
      ambulanceETA?: number
    }
  ): Promise<EmergencyAlert> {
    const response = await fetch(`${this.baseUrl}/api/emergency/${emergencyId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to acknowledge emergency')
    }

    return response.json()
  }

  /**
   * Get mock nearest facilities (fallback)
   */
  private getMockNearestFacilities(lat: number, lng: number): EmergencyFacility[] {
    const facilities = [
      {
        id: 'fac_001',
        name: 'PHC Beed',
        type: 'phc' as const,
        latitude: 18.9894,
        longitude: 75.7585,
        hasAmbulance: true,
        bedsAvailable: 5,
        contactNumber: '+91-02442-222101',
      },
      {
        id: 'fac_002',
        name: 'Rural Hospital Beed',
        type: 'chc' as const,
        latitude: 18.9920,
        longitude: 75.7650,
        hasAmbulance: true,
        bedsAvailable: 12,
        contactNumber: '+91-02442-222202',
      },
      {
        id: 'fac_003',
        name: 'District Hospital Beed',
        type: 'dh' as const,
        latitude: 19.0000,
        longitude: 75.7700,
        hasAmbulance: true,
        bedsAvailable: 25,
        contactNumber: '+91-02442-222303',
      },
    ]

    return facilities.map(facility => {
      const distance = geolocationService.calculateDistance(
        lat,
        lng,
        facility.latitude,
        facility.longitude
      )

      // Estimate arrival time: 30 km/h average speed + 5 min prep time
      const travelTime = (distance / 30) * 60 // minutes
      const estimatedTime = Math.round(travelTime + 5)

      return {
        ...facility,
        distance: Number(distance.toFixed(2)),
        estimatedArrivalTime: `${estimatedTime} mins`,
      }
    })
  }
}

export const emergencyService = new EmergencyService()
