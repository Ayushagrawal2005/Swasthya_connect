/**
 * Facility Portal RBAC Middleware
 * Enforces role + facility access control on API routes
 */

import { Request, Response, NextFunction } from 'express'
import { auth } from '../firebase-admin'
import { FacilityRole } from '../types/facility'

export interface FacilityUser {
  uid: string
  email?: string
  role: FacilityRole
  facilityId: string
  districtId?: string
  name?: string
}

declare global {
  namespace Express {
    interface Request {
      facilityUser?: FacilityUser
      user?: FacilityUser  // Alias for backward compatibility
    }
  }
}

/**
 * Verify Firebase token and extract custom claims
 * Alias: authenticateFacilityUser (for backward compatibility)
 */
export async function requireFacilityAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' })
      return
    }

    const token = authHeader.slice(7)
    const decodedToken = await auth.verifyIdToken(token)

    // Extract custom claims
    const role = decodedToken.role as FacilityRole
    const facilityId = decodedToken.facilityId as string
    const districtId = decodedToken.districtId as string | undefined

    if (!role || !isFacilityRole(role)) {
      res.status(403).json({ error: 'Invalid or missing role claim' })
      return
    }

    // For non-district-officer roles, facilityId is required
    if (role !== 'district_officer' && !facilityId) {
      res.status(403).json({ error: 'Missing facilityId claim' })
      return
    }

    // Attach facility user to request
    req.facilityUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
      facilityId,
      districtId,
      name: decodedToken.name,
    }
    req.user = req.facilityUser  // Alias for backward compatibility

    next()
  } catch (error: any) {
    console.error('❌ Facility auth error:', error.message)
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({ error: 'Token expired' })
    } else {
      res.status(401).json({ error: 'Authentication failed' })
    }
  }
}

// Alias for backward compatibility
export const authenticateFacilityUser = requireFacilityAuth

/**
 * Require one of the specified roles
 * Alias: requireFacilityRole (for backward compatibility)
 */
export function requireRole(...roles: FacilityRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.facilityUser) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    if (!roles.includes(req.facilityUser.role)) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: `Required role: ${roles.join(' or ')}. Your role: ${req.facilityUser.role}` 
      })
      return
    }

    next()
  }
}

// Alias for backward compatibility
export const requireFacilityRole = requireRole

/**
 * Require access to a specific facility (enforces facilityId match)
 */
export function requireFacilityAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.facilityUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  // District officers can access all facilities in their district
  if (req.facilityUser.role === 'district_officer') {
    next()
    return
  }

  // Extract facilityId from route params or query
  const facilityId = req.params.facilityId || req.query.facilityId as string

  if (!facilityId) {
    res.status(400).json({ error: 'facilityId required in route or query' })
    return
  }

  if (req.facilityUser.facilityId !== facilityId) {
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have access to this facility' 
    })
    return
  }

  next()
}

/**
 * Require district access (for district_officer role)
 */
export function requireDistrictAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.facilityUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  if (req.facilityUser.role !== 'district_officer') {
    res.status(403).json({ error: 'District officer role required' })
    return
  }

  const districtId = req.params.districtId || req.query.districtId as string

  if (!districtId) {
    res.status(400).json({ error: 'districtId required in route or query' })
    return
  }

  if (req.facilityUser.districtId !== districtId) {
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have access to this district' 
    })
    return
  }

  next()
}

/**
 * Type guard for FacilityRole
 */
function isFacilityRole(role: string): role is FacilityRole {
  return ['facility_admin', 'queue_desk', 'lab_technician', 'pharmacist', 'ambulance_coordinator', 'district_officer'].includes(role)
}

/**
 * Helper: Check if a role can perform an action
 */
export function canPerformAction(role: FacilityRole, action: string): boolean {
  const permissions: Record<FacilityRole, string[]> = {
    facility_admin: ['*'],  // All actions
    queue_desk: ['queue:*'],
    lab_technician: ['diagnostics:*'],
    pharmacist: ['medicine:*'],
    ambulance_coordinator: ['emergency:*', 'ambulance:*'],
    district_officer: ['district:read'],  // Read-only
  }

  const rolePermissions = permissions[role] || []
  
  // Check for wildcard
  if (rolePermissions.includes('*')) return true
  
  // Check for exact match
  if (rolePermissions.includes(action)) return true
  
  // Check for prefix match (e.g., queue:* matches queue:create)
  return rolePermissions.some(perm => {
    if (perm.endsWith(':*')) {
      const prefix = perm.slice(0, -2)
      return action.startsWith(prefix)
    }
    return false
  })
}
