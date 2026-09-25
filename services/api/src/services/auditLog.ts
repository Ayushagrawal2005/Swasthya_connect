/**
 * Audit Logging Service
 * Records sensitive operations for compliance and security tracking
 */

import { db } from '../firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export type AuditEventType =
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'CONSENT_EXPIRED'
  | 'PATIENT_DATA_ACCESSED'
  | 'SCHEME_CHECK_STARTED'
  | 'SCHEME_CHECK_COMPLETED'
  | 'AI_EXPLANATION_REQUESTED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'

export interface AuditLogEntry {
  id?: string
  eventType: AuditEventType
  actorId: string
  actorRole: string
  actorName?: string
  patientId?: string
  resourceId?: string
  resourceType?: string
  action: string
  purpose?: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp?: any
  createdAt?: any
}

export const auditLogService = {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<string> {
    try {
      const sanitizedMetadata = this.sanitizeMetadata(entry.metadata)
      
      const auditDoc = {
        eventType: entry.eventType,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        actorName: entry.actorName || null,
        patientId: entry.patientId || null,
        resourceId: entry.resourceId || null,
        resourceType: entry.resourceType || null,
        action: entry.action,
        purpose: entry.purpose || null,
        success: entry.success,
        errorMessage: entry.errorMessage || null,
        metadata: sanitizedMetadata,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      }

      const ref = await db.collection('auditLogs').add(auditDoc)
      return ref.id
    } catch (error) {
      // Never let audit logging break the main flow
      console.error('Failed to write audit log:', error)
      return ''
    }
  },

  /**
   * Remove sensitive data from metadata before logging
   */
  sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | null {
    if (!metadata) return null

    const sanitized = { ...metadata }
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'aadhaar',
      'aadhaarNumber',
      'fullAddress',
      'medicalRecords',
      'creditCard',
      'ssn',
    ]

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field]
      }
    }

    return sanitized
  },

  /**
   * Query audit logs for a specific patient
   */
  async getPatientAuditLogs(patientId: string, limit = 50): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await db
        .collection('auditLogs')
        .where('patientId', '==', patientId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get()

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as AuditLogEntry))
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }
  },

  /**
   * Query audit logs for a specific actor (user)
   */
  async getActorAuditLogs(actorId: string, limit = 50): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await db
        .collection('auditLogs')
        .where('actorId', '==', actorId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get()

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as AuditLogEntry))
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }
  },

  /**
   * Query audit logs by event type
   */
  async getLogsByEventType(eventType: AuditEventType, limit = 100): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await db
        .collection('auditLogs')
        .where('eventType', '==', eventType)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get()

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as AuditLogEntry))
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }
  },
}

export default auditLogService
