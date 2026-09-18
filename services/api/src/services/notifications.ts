/**
 * Notification Service
 * Handles creation and sending of notifications for followups and other events
 */
import { v4 as uuid } from 'uuid'
import { db, type Notification, type FollowUp } from '../store/index.js'

export function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  options?: {
    actionUrl?: string
    relatedId?: string
    relatedType?: Notification['relatedType']
  }
): Notification {
  const notification: Notification = {
    id: uuid(),
    userId,
    type,
    title,
    message,
    read: false,
    actionUrl: options?.actionUrl,
    relatedId: options?.relatedId,
    relatedType: options?.relatedType,
    createdAt: new Date().toISOString(),
  }
  db.notifications.push(notification)
  return notification
}

export function notifyFollowUpCreated(followUp: FollowUp): void {
  // Notify assigned ASHA/doctor
  createNotification(
    followUp.assignedTo,
    'followup-created',
    'New Follow-up Assigned',
    `${followUp.patientName} - ${followUp.condition}. Due: ${followUp.dueDate}`,
    {
      actionUrl: '/asha/followup',
      relatedId: followUp.id,
      relatedType: 'followup',
    }
  )

  // Notify patient
  createNotification(
    followUp.patientId,
    'followup-created',
    'Follow-up Scheduled',
    `Your ASHA worker will contact you on ${followUp.dueDate} for ${followUp.condition}`,
    {
      actionUrl: '/patient/followups',
      relatedId: followUp.id,
      relatedType: 'followup',
    }
  )
}

export function notifyFollowUpDueSoon(followUp: FollowUp): void {
  createNotification(
    followUp.assignedTo,
    'followup-due',
    'Follow-up Due Tomorrow',
    `${followUp.patientName} - ${followUp.condition}`,
    {
      actionUrl: '/asha/followup',
      relatedId: followUp.id,
      relatedType: 'followup',
    }
  )
}

export function notifyFollowUpOverdue(followUp: FollowUp): void {
  createNotification(
    followUp.assignedTo,
    'followup-overdue',
    '⚠️ Follow-up Overdue',
    `${followUp.patientName} - ${followUp.condition}. Was due: ${followUp.dueDate}`,
    {
      actionUrl: '/asha/followup',
      relatedId: followUp.id,
      relatedType: 'followup',
    }
  )

  // Escalate high-risk overdue to creator
  if (followUp.risk === 'high' || followUp.risk === 'emergency') {
    createNotification(
      followUp.createdBy,
      'followup-overdue',
      '🚨 High-Risk Follow-up Overdue',
      `${followUp.patientName} - ${followUp.condition}. Assigned to ${followUp.assignedToName}`,
      {
        actionUrl: '/doctor/followup',
        relatedId: followUp.id,
        relatedType: 'followup',
      }
    )
  }
}

export function notifyFollowUpCompleted(followUp: FollowUp): void {
  // Notify creator
  createNotification(
    followUp.createdBy,
    'followup-completed',
    'Follow-up Completed',
    `${followUp.patientName} - ${followUp.condition} completed by ${followUp.assignedToName}`,
    {
      actionUrl: '/doctor/followup',
      relatedId: followUp.id,
      relatedType: 'followup',
    }
  )
}

export function notifyFollowUpEscalated(followUp: FollowUp): void {
  if (!followUp.escalatedTo) return
  createNotification(
    followUp.escalatedTo,
    'followup-escalated',
    '🚨 Follow-up Escalated to You',
    `${followUp.patientName} - ${followUp.condition}. Reason: ${followUp.escalationReason}`,
    {
      actionUrl: '/doctor/followup',
      relatedId: followUp.id,
      relatedType: 'followup',
    }
  )
}
