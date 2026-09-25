/**
 * Firebase Custom Claims Service
 * Manages role and facility assignments for facility staff
 */

import { auth } from '../firebase-admin'
import { FacilityRole } from '../types/facility'

export interface CustomClaims {
  role: FacilityRole
  facilityId?: string
  districtId?: string
  name?: string
}

/**
 * Set custom claims for a user
 */
export async function setCustomClaims(
  uid: string, 
  claims: CustomClaims
): Promise<void> {
  try {
    await auth.setCustomUserClaims(uid, claims)
    console.log(`✓ Custom claims set for user ${uid}:`, claims)
  } catch (error: any) {
    console.error(`❌ Failed to set custom claims for ${uid}:`, error.message)
    throw new Error(`Failed to set custom claims: ${error.message}`)
  }
}

/**
 * Get custom claims for a user
 */
export async function getCustomClaims(uid: string): Promise<CustomClaims | null> {
  try {
    const user = await auth.getUser(uid)
    return (user.customClaims as CustomClaims) || null
  } catch (error: any) {
    console.error(`❌ Failed to get custom claims for ${uid}:`, error.message)
    return null
  }
}

/**
 * Remove custom claims for a user
 */
export async function removeCustomClaims(uid: string): Promise<void> {
  try {
    await auth.setCustomUserClaims(uid, {})
    console.log(`✓ Custom claims removed for user ${uid}`)
  } catch (error: any) {
    console.error(`❌ Failed to remove custom claims for ${uid}:`, error.message)
    throw new Error(`Failed to remove custom claims: ${error.message}`)
  }
}

/**
 * Create a facility staff user with custom claims
 */
export async function createFacilityStaff(
  email: string,
  password: string,
  name: string,
  role: FacilityRole,
  facilityId: string,
  districtId?: string
): Promise<string> {
  try {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    })

    // Set custom claims
    await setCustomClaims(userRecord.uid, {
      role,
      facilityId: role !== 'district_officer' ? facilityId : undefined,
      districtId: role === 'district_officer' ? districtId : undefined,
      name,
    })

    console.log(`✓ Created facility staff user: ${email} (${role}) - UID: ${userRecord.uid}`)
    return userRecord.uid
  } catch (error: any) {
    console.error(`❌ Failed to create facility staff user ${email}:`, error.message)
    throw new Error(`Failed to create user: ${error.message}`)
  }
}

/**
 * Update role for a staff member
 */
export async function updateStaffRole(
  uid: string,
  newRole: FacilityRole,
  facilityId?: string,
  districtId?: string
): Promise<void> {
  try {
    const user = await auth.getUser(uid)
    const currentClaims = (user.customClaims || {}) as CustomClaims

    const updatedClaims: CustomClaims = {
      ...currentClaims,
      role: newRole,
      facilityId: newRole !== 'district_officer' ? facilityId || currentClaims.facilityId : undefined,
      districtId: newRole === 'district_officer' ? districtId || currentClaims.districtId : undefined,
    }

    await setCustomClaims(uid, updatedClaims)
    console.log(`✓ Updated role for user ${uid}: ${newRole}`)
  } catch (error: any) {
    console.error(`❌ Failed to update role for ${uid}:`, error.message)
    throw new Error(`Failed to update role: ${error.message}`)
  }
}

/**
 * Disable a staff member (soft delete)
 */
export async function disableStaff(uid: string): Promise<void> {
  try {
    await auth.updateUser(uid, { disabled: true })
    console.log(`✓ Disabled user ${uid}`)
  } catch (error: any) {
    console.error(`❌ Failed to disable user ${uid}:`, error.message)
    throw new Error(`Failed to disable user: ${error.message}`)
  }
}

/**
 * Enable a staff member
 */
export async function enableStaff(uid: string): Promise<void> {
  try {
    await auth.updateUser(uid, { disabled: false })
    console.log(`✓ Enabled user ${uid}`)
  } catch (error: any) {
    console.error(`❌ Failed to enable user ${uid}:`, error.message)
    throw new Error(`Failed to enable user: ${error.message}`)
  }
}

/**
 * Generate a random temporary password
 */
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Reset password for a user (generate temp password)
 */
export async function resetUserPassword(uid: string): Promise<string> {
  try {
    const tempPassword = generateTempPassword()
    await auth.updateUser(uid, { password: tempPassword })
    console.log(`✓ Password reset for user ${uid}`)
    return tempPassword
  } catch (error: any) {
    console.error(`❌ Failed to reset password for ${uid}:`, error.message)
    throw new Error(`Failed to reset password: ${error.message}`)
  }
}

/**
 * Force password change on next login
 * (Firebase doesn't have a direct API for this, so we use a custom field)
 */
export async function forcePasswordReset(uid: string): Promise<void> {
  try {
    const currentClaims = await getCustomClaims(uid)
    await setCustomClaims(uid, {
      ...currentClaims!,
      mustResetPassword: true as any,
    })
    console.log(`✓ Force password reset flag set for user ${uid}`)
  } catch (error: any) {
    console.error(`❌ Failed to set force password reset for ${uid}:`, error.message)
    throw new Error(`Failed to set force password reset: ${error.message}`)
  }
}
