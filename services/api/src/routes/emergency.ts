/**
 * Emergency "Bachao Bachao" API Routes
 * Handles emergency alerts, live location tracking, and facility coordination
 */

import express from 'express'
import { requireAuth } from '../middleware/auth'
import db from '../services/db'

const router = express.Router()

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function generateEmergencyNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `EMERG-${year}-${random}`
}

// Mock facilities data (replace with Firestore query)
const facilities = [
  {
    id: 'fac_001',
    name: 'PHC Beed',
    type: 'phc',
    latitude: 18.9894,
    longitude: 75.7585,
    contactNumber: '+91-02442-222101',
    hasAmbulance: true,
    bedsAvailable: 5,
    bedCapacity: 30,
  },
  {
    id: 'fac_002',
    name: 'Rural Hospital Beed',
    type: 'chc',
    latitude: 18.9920,
    longitude: 75.7650,
    contactNumber: '+91-02442-222202',
    hasAmbulance: true,
    bedsAvailable: 12,
    bedCapacity: 100,
  },
  {
    id: 'fac_003',
    name: 'District Hospital Beed',
    type: 'dh',
    latitude: 19.0000,
    longitude: 75.7700,
    contactNumber: '+91-02442-222303',
    hasAmbulance: true,
    bedsAvailable: 25,
    bedCapacity: 500,
  },
]

// In-memory storage (replace with Firestore)
const emergencies: any[] = []
const emergencyNotifications: any[] = []

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/emergency/nearest-facilities
 * Find nearest facilities from current location
 */
router.get('/nearest-facilities', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' })
    }

    const latitude = parseFloat(lat as string)
    const longitude = parseFloat(lng as string)
    const maxRadius = parseFloat(radius as string)

    // Calculate distances and filter
    const nearbyFacilities = facilities
      .map(facility => {
        const distance = calculateDistance(
          latitude,
          longitude,
          facility.latitude,
          facility.longitude
        )

        // Calculate ETA (30 km/h average speed + 5 min prep)
        const travelTime = (distance / 30) * 60 // minutes
        const estimatedTime = Math.round(travelTime + 5)

        return {
          ...facility,
          distance: Number(distance.toFixed(2)),
          estimatedArrivalTime: `${estimatedTime} mins`,
        }
      })
      .filter(f => f.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)

    res.json(nearbyFacilities)
  } catch (error) {
    console.error('Error finding nearest facilities:', error)
    res.status(500).json({ error: 'Failed to find nearest facilities' })
  }
})

/**
 * POST /api/emergency/trigger
 * Trigger emergency "Bachao Bachao" alert
 */
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const {
      patientName,
      patientId,
      reason,
      severity,
      location,
      nearestFacilities,
      targetFacilityId,
    } = req.body

    if (!patientName || !reason || !severity || !location) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const emergencyNumber = generateEmergencyNumber()
    const targetFacility = nearestFacilities?.find((f: any) => f.id === targetFacilityId) || nearestFacilities?.[0]

    const emergency = {
      id: `emerg_${Date.now()}`,
      emergencyNumber,
      patientName,
      patientId,
      reason,
      severity, // 'critical' | 'high' | 'medium'
      currentLocation: location,
      locationHistory: [
        {
          ...location,
          timestamp: new Date().toISOString(),
        },
      ],
      nearestFacilities,
      targetFacility,
      bedReserved: false,
      bedNumber: null,
      ambulanceDispatched: false,
      ambulanceETA: null,
      status: 'active', // 'active' | 'acknowledged' | 'ambulance_dispatched' | 'arrived' | 'resolved'
      triggeredBy: user.name,
      triggeredByRole: user.role,
      triggeredById: user.userId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      updates: [],
    }

    // Save to storage (Firestore in production)
    emergencies.push(emergency)

    // Create notification for target facility
    const notification = {
      id: `notif_${Date.now()}`,
      type: 'EMERGENCY_INCOMING',
      emergencyId: emergency.id,
      facilityId: targetFacility?.id,
      message: `🚨 EMERGENCY: ${patientName} - ${reason}`,
      severity,
      location,
      distance: targetFacility?.distance,
      eta: targetFacility?.estimatedArrivalTime,
      read: false,
      createdAt: new Date().toISOString(),
    }

    emergencyNotifications.push(notification)

    // In production: Send SMS, email, push notification
    console.log(`🚨 EMERGENCY ALERT: ${emergencyNumber}`)
    console.log(`Patient: ${patientName}`)
    console.log(`Severity: ${severity}`)
    console.log(`Target: ${targetFacility?.name}`)

    res.status(201).json(emergency)
  } catch (error) {
    console.error('Error triggering emergency:', error)
    res.status(500).json({ error: 'Failed to trigger emergency' })
  }
})

/**
 * PATCH /api/emergency/:id/location
 * Update emergency location (for live tracking)
 */
router.patch('/:id/location', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { location } = req.body

    if (!location) {
      return res.status(400).json({ error: 'Location data required' })
    }

    const emergency = emergencies.find(e => e.id === id)

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' })
    }

    // Update location
    emergency.currentLocation = location
    emergency.locationHistory.push({
      ...location,
      timestamp: new Date().toISOString(),
    })
    emergency.lastUpdated = new Date().toISOString()

    // Recalculate distance to target facility
    if (emergency.targetFacility) {
      const newDistance = calculateDistance(
        location.latitude,
        location.longitude,
        emergency.targetFacility.latitude,
        emergency.targetFacility.longitude
      )

      emergency.targetFacility.distance = Number(newDistance.toFixed(2))

      // Update ETA
      const travelTime = (newDistance / 30) * 60
      const estimatedTime = Math.round(travelTime + 5)
      emergency.targetFacility.estimatedArrivalTime = `${estimatedTime} mins`
    }

    res.json({ success: true, emergency })
  } catch (error) {
    console.error('Error updating emergency location:', error)
    res.status(500).json({ error: 'Failed to update location' })
  }
})

/**
 * GET /api/emergency/:id
 * Get emergency details
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const emergency = emergencies.find(e => e.id === id)

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' })
    }

    res.json(emergency)
  } catch (error) {
    console.error('Error fetching emergency:', error)
    res.status(500).json({ error: 'Failed to fetch emergency' })
  }
})

/**
 * GET /api/emergency
 * List emergencies (filtered by facility or status)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { facilityId, status } = req.query

    let filtered = [...emergencies]

    if (facilityId) {
      filtered = filtered.filter(e => e.targetFacility?.id === facilityId)
    }

    if (status) {
      filtered = filtered.filter(e => e.status === status)
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json(filtered)
  } catch (error) {
    console.error('Error listing emergencies:', error)
    res.status(500).json({ error: 'Failed to list emergencies' })
  }
})

/**
 * POST /api/emergency/:id/acknowledge
 * Acknowledge emergency and reserve bed (facility response)
 */
router.post('/:id/acknowledge', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    const {
      bedReserved,
      bedNumber,
      ambulanceDispatched,
      ambulanceETA,
    } = req.body

    const emergency = emergencies.find(e => e.id === id)

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' })
    }

    // Update emergency status
    emergency.status = 'acknowledged'
    emergency.bedReserved = bedReserved
    emergency.bedNumber = bedNumber
    emergency.ambulanceDispatched = ambulanceDispatched
    emergency.ambulanceETA = ambulanceETA
    emergency.acknowledgedBy = user.name
    emergency.acknowledgedAt = new Date().toISOString()
    emergency.lastUpdated = new Date().toISOString()

    // Add update to history
    emergency.updates.push({
      timestamp: new Date().toISOString(),
      status: 'acknowledged',
      note: `Facility acknowledged. Bed ${bedNumber} reserved.${ambulanceDispatched ? ' Ambulance dispatched.' : ''}`,
      updatedBy: user.name,
    })

    // Update bed count at facility
    if (bedReserved && emergency.targetFacility) {
      const facility = facilities.find(f => f.id === emergency.targetFacility.id)
      if (facility && facility.bedsAvailable > 0) {
        facility.bedsAvailable -= 1
      }
    }

    // Create notification for ASHA/patient
    const notification = {
      id: `notif_${Date.now()}`,
      type: 'EMERGENCY_ACKNOWLEDGED',
      emergencyId: emergency.id,
      userId: emergency.triggeredById,
      message: `✅ Emergency acknowledged! Bed ${bedNumber} reserved at ${emergency.targetFacility?.name}`,
      createdAt: new Date().toISOString(),
    }

    emergencyNotifications.push(notification)

    res.json(emergency)
  } catch (error) {
    console.error('Error acknowledging emergency:', error)
    res.status(500).json({ error: 'Failed to acknowledge emergency' })
  }
})

/**
 * PATCH /api/emergency/:id/status
 * Update emergency status
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, note } = req.body

    const emergency = emergencies.find(e => e.id === id)

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' })
    }

    emergency.status = status
    emergency.lastUpdated = new Date().toISOString()

    emergency.updates.push({
      timestamp: new Date().toISOString(),
      status,
      note,
    })

    res.json(emergency)
  } catch (error) {
    console.error('Error updating emergency status:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

/**
 * GET /api/emergency/notifications
 * Get emergency notifications for facility
 */
router.get('/notifications/list', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user
    const { facilityId } = req.query

    let filtered = [...emergencyNotifications]

    if (facilityId) {
      filtered = filtered.filter(n => n.facilityId === facilityId)
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json(filtered)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

export default router
