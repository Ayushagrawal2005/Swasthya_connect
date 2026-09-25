/**
 * Referral Management API Routes
 * Complete referral workflow with notifications and facility mapping
 */

import express from 'express'
import { requireAuth } from '../middleware/auth'

const router = express.Router()

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA STORE (Replace with real database)
// ═══════════════════════════════════════════════════════════════════════════════

const referrals: any[] = []
const notifications: any[] = []
const facilities: any[] = [
  {
    id: 'fac_001',
    name: 'PHC Beed',
    type: 'phc',
    address: 'Near Bus Stand, Beed',
    district: 'Beed',
    state: 'Maharashtra',
    pincode: '431122',
    contactNumber: '+91-02442-222101',
    services: ['General Medicine', 'Pediatrics', 'OB/GYN', 'OPD'],
    bedCapacity: 30,
    bedsAvailable: 18,
    hasAmbulance: true,
    isOperational: true,
    latitude: 18.9894,
    longitude: 75.7585
  },
  {
    id: 'fac_002',
    name: 'Rural Hospital Beed',
    type: 'chc',
    address: 'Station Road, Beed',
    district: 'Beed',
    state: 'Maharashtra',
    pincode: '431122',
    contactNumber: '+91-02442-222202',
    services: ['General Medicine', 'Surgery', 'Obstetrics', 'Pediatrics', 'ICU', 'X-Ray'],
    bedCapacity: 100,
    bedsAvailable: 45,
    hasAmbulance: true,
    isOperational: true,
    latitude: 18.9920,
    longitude: 75.7650
  },
  {
    id: 'fac_003',
    name: 'District Hospital Beed',
    type: 'dh',
    address: 'Civil Hospital Road, Beed',
    district: 'Beed',
    state: 'Maharashtra',
    pincode: '431122',
    contactNumber: '+91-02442-222303',
    services: ['All Specialties', 'Emergency', 'ICU', 'Surgery', 'Cardiology', 'Neurology', 'Orthopedics'],
    bedCapacity: 500,
    bedsAvailable: 120,
    hasAmbulance: true,
    isOperational: true,
    latitude: 19.0000,
    longitude: 75.7700
  }
]

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function generateReferralNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `REF-${year}-${random}`
}

function createNotification(
  referralId: string,
  type: string,
  message: string,
  priority: string,
  recipientRole: string,
  facilityId?: string
) {
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    referralId,
    type,
    message,
    priority,
    recipientRole,
    facilityId,
    read: false,
    createdAt: new Date().toISOString()
  }
  notifications.push(notification)
  return notification
}

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

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CREATE REFERRAL ─────────────────────────────────────────────────────────
router.post('/', requireAuth, (req, res) => {
  try {
    const user = (req as any).user
    const { patientId, receivingFacilityId, reason, triageSessionId, vitals, ambulanceRequired, attachments } = req.body

    const referralNumber = generateReferralNumber()
    
    const referral = {
      id: `ref_${Date.now()}`,
      referralNumber,
      patientId,
      patientName: 'Patient Name', // Get from patient record
      age: 45,
      gender: 'F',
      referringFacilityId: user.facilityId || 'fac_001',
      referringFacilityName: 'PHC Gandhi Nagar',
      referredBy: user.name,
      referredById: user.id,
      referredByRole: user.role,
      referralDate: new Date().toISOString(),
      receivingFacilityId,
      receivingFacilityName: facilities.find(f => f.id === receivingFacilityId)?.name || 'Unknown Facility',
      reason,
      triageSessionId,
      vitals,
      attachments: attachments || [],
      status: 'pending',
      priority: reason.urgency,
      notes: [],
      lastUpdated: new Date().toISOString(),
      ambulanceRequired,
      bedReserved: false
    }

    referrals.push(referral)

    // Create notification for receiving facility
    createNotification(
      referral.id,
      'new_referral',
      `New ${reason.urgency} referral received from ${referral.referringFacilityName}`,
      reason.urgency === 'emergency' ? 'high' : 'normal',
      'doctor',
      receivingFacilityId
    )

    res.json(referral)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── GET REFERRALS ───────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  try {
    const { facilityId, patientId, status, priority, dateFrom, dateTo } = req.query

    let filtered = [...referrals]

    if (facilityId) {
      filtered = filtered.filter(r => 
        r.receivingFacilityId === facilityId || r.referringFacilityId === facilityId
      )
    }

    if (patientId) {
      filtered = filtered.filter(r => r.patientId === patientId)
    }

    if (status) {
      filtered = filtered.filter(r => r.status === status)
    }

    if (priority) {
      filtered = filtered.filter(r => r.priority === priority)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime())

    res.json(filtered)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── GET SINGLE REFERRAL ─────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  try {
    const referral = referrals.find(r => r.id === req.params.id)
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }
    res.json(referral)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── UPDATE STATUS ───────────────────────────────────────────────────────────
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status, note } = req.body
    const referral = referrals.find(r => r.id === req.params.id)
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    referral.status = status
    referral.lastUpdated = new Date().toISOString()
    
    if (note) {
      referral.notes.push({
        text: note,
        timestamp: new Date().toISOString(),
        addedBy: (req as any).user.name
      })
    }

    // Create notification for status change
    createNotification(
      referral.id,
      'status_update',
      `Referral ${referral.referralNumber} status updated to ${status}`,
      'normal',
      'doctor',
      referral.referringFacilityId
    )

    res.json(referral)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── ACCEPT REFERRAL ─────────────────────────────────────────────────────────
router.post('/:id/accept', requireAuth, (req, res) => {
  try {
    const { doctorId, bedReserved, bedNumber } = req.body
    const user = (req as any).user
    const referral = referrals.find(r => r.id === req.params.id)
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    referral.status = 'accepted'
    referral.acceptedDate = new Date().toISOString()
    referral.assignedDoctorId = doctorId
    referral.assignedDoctorName = user.name
    referral.bedReserved = bedReserved
    if (bedNumber) referral.bedNumber = bedNumber
    referral.lastUpdated = new Date().toISOString()

    // Notify referring facility
    createNotification(
      referral.id,
      'status_update',
      `Referral ${referral.referralNumber} accepted by Dr. ${user.name}`,
      'normal',
      'asha',
      referral.referringFacilityId
    )

    res.json(referral)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── REJECT REFERRAL ─────────────────────────────────────────────────────────
router.post('/:id/reject', requireAuth, (req, res) => {
  try {
    const { reason } = req.body
    const referral = referrals.find(r => r.id === req.params.id)
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    referral.status = 'rejected'
    referral.notes.push({
      text: `Rejected: ${reason}`,
      timestamp: new Date().toISOString(),
      addedBy: (req as any).user.name
    })
    referral.lastUpdated = new Date().toISOString()

    // Notify referring facility
    createNotification(
      referral.id,
      'status_update',
      `Referral ${referral.referralNumber} rejected: ${reason}`,
      'high',
      'asha',
      referral.referringFacilityId
    )

    res.json(referral)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── ADD NOTE ────────────────────────────────────────────────────────────────
router.post('/:id/notes', requireAuth, (req, res) => {
  try {
    const { note, isPrivate } = req.body
    const user = (req as any).user
    const referral = referrals.find(r => r.id === req.params.id)
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    referral.notes.push({
      text: note,
      timestamp: new Date().toISOString(),
      addedBy: user.name,
      isPrivate: isPrivate || false
    })
    referral.lastUpdated = new Date().toISOString()

    res.json(referral)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── REQUEST AMBULANCE ───────────────────────────────────────────────────────
router.post('/:id/ambulance', requireAuth, (req, res) => {
  try {
    const { pickupAddress, contactNumber } = req.body
    const referral = referrals.find(r => r.id === req.params.id)
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    const ambulanceId = `AMB_${Date.now()}`
    referral.ambulanceId = ambulanceId
    referral.ambulanceStatus = 'requested'
    referral.lastUpdated = new Date().toISOString()

    // Notify ambulance coordinator
    createNotification(
      referral.id,
      'urgent_action',
      `Ambulance requested for referral ${referral.referralNumber}`,
      'high',
      'ambulance_coordinator',
      referral.referringFacilityId
    )

    res.json({
      ambulanceId,
      estimatedArrival: '15-20 minutes'
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── COMPLETE REFERRAL ───────────────────────────────────────────────────────
router.post('/:id/complete', requireAuth, (req, res) => {
  try {
    const { outcome, dischargeSummary } = req.body
    const referral = referrals.find(r => r.id === req.params.id)
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    referral.status = 'completed'
    referral.completedDate = new Date().toISOString()
    referral.outcome = outcome
    referral.dischargeSummary = dischargeSummary
    referral.lastUpdated = new Date().toISOString()

    // Notify referring facility
    createNotification(
      referral.id,
      'completion',
      `Referral ${referral.referralNumber} completed`,
      'normal',
      'asha',
      referral.referringFacilityId
    )

    res.json(referral)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── GET STATISTICS ──────────────────────────────────────────────────────────
router.get('/stats', requireAuth, (req, res) => {
  try {
    const { facilityId } = req.query
    
    let filtered = referrals
    if (facilityId) {
      filtered = referrals.filter(r => 
        r.receivingFacilityId === facilityId || r.referringFacilityId === facilityId
      )
    }

    const stats = {
      total: filtered.length,
      pending: filtered.filter(r => r.status === 'pending').length,
      accepted: filtered.filter(r => r.status === 'accepted').length,
      inTransit: filtered.filter(r => r.status === 'in_transit').length,
      completed: filtered.filter(r => r.status === 'completed').length,
      avgResponseTime: 45, // minutes (mock)
      urgentCount: filtered.filter(r => r.priority === 'urgent' || r.priority === 'emergency').length
    }

    res.json(stats)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── TRACK REFERRAL ──────────────────────────────────────────────────────────
router.get('/track/:referralNumber', (req, res) => {
  try {
    const referral = referrals.find(r => r.referralNumber === req.params.referralNumber)
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' })
    }

    // Build timeline from notes
    const timeline = referral.notes.map((note: any) => ({
      status: referral.status,
      timestamp: note.timestamp,
      note: note.text
    }))

    res.json({ referral, timeline })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// FACILITY ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── SEARCH FACILITIES ───────────────────────────────────────────────────────
router.post('/facilities/search', requireAuth, (req, res) => {
  try {
    const { location, type, services, hasAmbulance, minBedsAvailable } = req.body
    
    let filtered = [...facilities]

    if (type) {
      filtered = filtered.filter(f => f.type === type)
    }

    if (hasAmbulance) {
      filtered = filtered.filter(f => f.hasAmbulance)
    }

    if (minBedsAvailable) {
      filtered = filtered.filter(f => f.bedsAvailable >= minBedsAvailable)
    }

    if (services && services.length > 0) {
      filtered = filtered.filter(f => 
        services.every((s: string) => f.services.includes(s))
      )
    }

    res.json(filtered)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── GET NEARBY FACILITIES ───────────────────────────────────────────────────
router.get('/facilities/nearby', requireAuth, (req, res) => {
  try {
    const { lat, lng, radius } = req.query
    const latitude = parseFloat(lat as string)
    const longitude = parseFloat(lng as string)
    const radiusKm = parseFloat(radius as string) || 50

    const nearby = facilities
      .map(f => {
        if (!f.latitude || !f.longitude) return null
        const distance = calculateDistance(latitude, longitude, f.latitude, f.longitude)
        return { ...f, distanceKm: Math.round(distance * 10) / 10 }
      })
      .filter(f => f && f.distanceKm <= radiusKm)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)

    res.json(nearby)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── GET FACILITY ────────────────────────────────────────────────────────────
router.get('/facilities/:id', requireAuth, (req, res) => {
  try {
    const facility = facilities.find(f => f.id === req.params.id)
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' })
    }
    res.json(facility)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET NOTIFICATIONS ───────────────────────────────────────────────────────
router.get('/notifications/referrals', requireAuth, (req, res) => {
  try {
    const user = (req as any).user
    const { unreadOnly, facilityId, type } = req.query

    let filtered = notifications.filter(n => 
      n.recipientRole === user.role || !n.recipientRole
    )

    if (facilityId) {
      filtered = filtered.filter(n => n.facilityId === facilityId)
    }

    if (type) {
      filtered = filtered.filter(n => n.type === type)
    }

    if (unreadOnly === 'true') {
      filtered = filtered.filter(n => !n.read)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json(filtered)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── MARK AS READ ────────────────────────────────────────────────────────────
router.patch('/notifications/:id/read', requireAuth, (req, res) => {
  try {
    const notification = notifications.find(n => n.id === req.params.id)
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    notification.read = true
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ─── GET UNREAD COUNT ────────────────────────────────────────────────────────
router.get('/notifications/unread-count', requireAuth, (req, res) => {
  try {
    const user = (req as any).user
    const count = notifications.filter(n => 
      !n.read && (n.recipientRole === user.role || !n.recipientRole)
    ).length
    res.json({ count })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router

