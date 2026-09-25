/**
 * Facility Portal Authentication Routes
 */

import { Router } from 'express'
import { auth as adminAuth } from '../firebase-admin'
import { requireFacilityAuth, requireRole } from '../middleware/facilityAuth'
import { setCustomClaims, createFacilityStaff, generateTempPassword, resetUserPassword } from '../services/customClaims'
import { FacilityRole } from '../types/facility'

const router = Router()

/**
 * POST /facility/auth/login
 * Same as regular login, but returns custom claims
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: 'idToken required (get from Firebase client SDK)' })
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Get user info
    const userRecord = await adminAuth.getUser(decodedToken.uid)
    
    // Extract custom claims
    const claims = userRecord.customClaims || {}
    const role = claims.role as FacilityRole
    const facilityId = claims.facilityId as string
    const districtId = claims.districtId as string
    
    if (!role) {
      return res.status(403).json({ error: 'No facility role assigned to this account' })
    }

    res.json({
      token: idToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || claims.name || 'Unknown',
        role,
        facilityId,
        districtId,
      },
    })
  } catch (error: any) {
    console.error('❌ Facility login error:', error.message)
    res.status(401).json({ error: 'Authentication failed' })
  }
})

/**
 * POST /facility/auth/set-claims
 * Set custom claims for a user (admin only)
 */
router.post('/set-claims', requireFacilityAuth, requireRole('facility_admin'), async (req, res) => {
  try {
    const { userId, role, facilityId, districtId } = req.body

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role required' })
    }

    // Validate role
    const validRoles: FacilityRole[] = ['facility_admin', 'queue_desk', 'lab_technician', 'pharmacist', 'ambulance_coordinator', 'district_officer']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    await setCustomClaims(userId, { role, facilityId, districtId })

    res.json({ success: true, message: 'Custom claims set successfully' })
  } catch (error: any) {
    console.error('❌ Set claims error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /facility/auth/create-staff
 * Create a new staff member with custom claims (admin only)
 */
router.post('/create-staff', requireFacilityAuth, requireRole('facility_admin'), async (req, res) => {
  try {
    const { email, name, role, phone, facilityId, districtId } = req.body

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'email, name, and role required' })
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()

    // Create user with custom claims
    const uid = await createFacilityStaff(
      email,
      tempPassword,
      name,
      role,
      facilityId || req.facilityUser!.facilityId,
      districtId
    )

    res.json({
      success: true,
      uid,
      tempPassword,
      message: 'Staff member created successfully. Share the temporary password securely.',
    })
  } catch (error: any) {
    console.error('❌ Create staff error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /facility/auth/reset-password
 * Reset password for a staff member (admin only)
 */
router.post('/reset-password', requireFacilityAuth, requireRole('facility_admin'), async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    const tempPassword = await resetUserPassword(userId)

    res.json({
      success: true,
      tempPassword,
      message: 'Password reset successfully. Share the temporary password securely.',
    })
  } catch (error: any) {
    console.error('❌ Reset password error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /facility/auth/me
 * Get current user's facility info
 */
router.get('/me', requireFacilityAuth, (req, res) => {
  res.json({ user: req.facilityUser })
})

export default router
