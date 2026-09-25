/**
 * Geolocation Service for Emergency "Bachao Bachao" Feature
 * Provides live location tracking with continuous updates
 */

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  address?: string
}

export interface LocationError {
  code: number
  message: string
}

export type LocationCallback = (location: LocationData) => void
export type ErrorCallback = (error: LocationError) => void

class GeolocationService {
  private watchId: number | null = null
  private currentLocation: LocationData | null = null
  private isTracking: boolean = false

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator
  }

  /**
   * Get current location (one-time)
   */
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject({ code: 0, message: 'Geolocation not supported' })
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }
          this.currentLocation = location
          resolve(location)
        },
        (error) => {
          reject({
            code: error.code,
            message: this.getErrorMessage(error.code),
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  /**
   * Start continuous location tracking
   */
  startTracking(
    onUpdate: LocationCallback,
    onError?: ErrorCallback
  ): void {
    if (!this.isSupported()) {
      onError?.({ code: 0, message: 'Geolocation not supported' })
      return
    }

    if (this.isTracking) {
      console.warn('Location tracking already active')
      return
    }

    this.isTracking = true

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }
        this.currentLocation = location
        onUpdate(location)
      },
      (error) => {
        onError?.({
          code: error.code,
          message: this.getErrorMessage(error.code),
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
      this.isTracking = false
    }
  }

  /**
   * Get last known location
   */
  getLastLocation(): LocationData | null {
    return this.currentLocation
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Format location for display
   */
  formatLocation(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
  }

  /**
   * Get Google Maps URL for location
   */
  getGoogleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`
  }

  /**
   * Get accuracy status
   */
  getAccuracyStatus(accuracy: number): {
    level: 'excellent' | 'good' | 'fair' | 'poor'
    color: string
    message: string
  } {
    if (accuracy <= 10) {
      return {
        level: 'excellent',
        color: 'text-green-600',
        message: 'Excellent accuracy',
      }
    } else if (accuracy <= 50) {
      return {
        level: 'good',
        color: 'text-teal-600',
        message: 'Good accuracy',
      }
    } else if (accuracy <= 100) {
      return {
        level: 'fair',
        color: 'text-amber-600',
        message: 'Fair accuracy',
      }
    } else {
      return {
        level: 'poor',
        color: 'text-red-600',
        message: 'Poor accuracy',
      }
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location permission denied. Please enable location access.'
      case 2:
        return 'Location unavailable. Please check your device settings.'
      case 3:
        return 'Location request timed out. Please try again.'
      default:
        return 'Unknown location error occurred.'
    }
  }
}

// Singleton instance
export const geolocationService = new GeolocationService()
