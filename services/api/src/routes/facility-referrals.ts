import express from 'express';
import { authenticateFacilityUser, requireFacilityRole } from '../middleware/facilityAuth';
import { db, admin } from '../firebase-admin';
import { logAudit } from '../services/auditLog';

const router = express.Router();

// Get referrals for a facility (inbound or outbound)
router.get(
  '/:facilityId/referrals',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'ambulance_coordinator', 'doctor']),
  async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { direction } = req.query; // 'inbound' or 'outbound'

      let query;
      if (direction === 'inbound') {
        query = db.collection('referrals')
          .where('toFacilityId', '==', facilityId)
          .orderBy('createdAt', 'desc');
      } else if (direction === 'outbound') {
        query = db.collection('referrals')
          .where('fromFacilityId', '==', facilityId)
          .orderBy('createdAt', 'desc');
      } else {
        // Both inbound and outbound
        query = db.collection('referrals')
          .where('toFacilityId', '==', facilityId)
          .orderBy('createdAt', 'desc');
      }

      const snapshot = await query.get();
      const referrals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  }
);

// Accept referral
router.patch(
  '/:facilityId/referrals/:referralId/accept',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'ambulance_coordinator', 'doctor']),
  async (req, res) => {
    try {
      const { facilityId, referralId } = req.params;
      const { acceptedBy, acceptedByName } = req.body;

      const referralRef = db.doc(`referrals/${referralId}`);
      const referralDoc = await referralRef.get();

      if (!referralDoc.exists) {
        return res.status(404).json({ error: 'Referral not found' });
      }

      const referralData = referralDoc.data();

      if (referralData?.toFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Referral not for this facility' });
      }

      if (referralData?.status !== 'created') {
        return res.status(400).json({ error: 'Referral cannot be accepted in current status' });
      }

      const updateData = {
        status: 'accepted',
        acceptedBy,
        acceptedByName,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await referralRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'referral.accepted',
        entityType: 'referral',
        entityId: referralId,
        before: referralData,
        after: { ...referralData, ...updateData },
        metadata: {
          patientName: referralData?.patientName,
          fromFacility: referralData?.fromFacilityName
        }
      });

      const updatedDoc = await referralRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error accepting referral:', error);
      res.status(500).json({ error: 'Failed to accept referral' });
    }
  }
);

// Reject referral
router.patch(
  '/:facilityId/referrals/:referralId/reject',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'ambulance_coordinator', 'doctor']),
  async (req, res) => {
    try {
      const { facilityId, referralId } = req.params;
      const { rejectionCategory, rejectionReason, alternativeFacilities, rejectedBy, rejectedByName } = req.body;

      const referralRef = db.doc(`referrals/${referralId}`);
      const referralDoc = await referralRef.get();

      if (!referralDoc.exists) {
        return res.status(404).json({ error: 'Referral not found' });
      }

      const referralData = referralDoc.data();

      if (referralData?.toFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Referral not for this facility' });
      }

      if (referralData?.status !== 'created') {
        return res.status(400).json({ error: 'Referral cannot be rejected in current status' });
      }

      const updateData = {
        status: 'rejected',
        rejectionCategory,
        rejectionReason,
        alternativeFacilities: alternativeFacilities || null,
        rejectedBy,
        rejectedByName,
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await referralRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'referral.rejected',
        entityType: 'referral',
        entityId: referralId,
        before: referralData,
        after: { ...referralData, ...updateData },
        metadata: {
          patientName: referralData?.patientName,
          fromFacility: referralData?.fromFacilityName,
          reason: rejectionReason
        }
      });

      const updatedDoc = await referralRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error rejecting referral:', error);
      res.status(500).json({ error: 'Failed to reject referral' });
    }
  }
);

// Mark patient as arrived
router.patch(
  '/:facilityId/referrals/:referralId/patient-arrived',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'queue_desk', 'doctor']),
  async (req, res) => {
    try {
      const { facilityId, referralId } = req.params;
      const { arrivedBy, arrivedByName } = req.body;

      const referralRef = db.doc(`referrals/${referralId}`);
      const referralDoc = await referralRef.get();

      if (!referralDoc.exists) {
        return res.status(404).json({ error: 'Referral not found' });
      }

      const referralData = referralDoc.data();

      if (referralData?.toFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Referral not for this facility' });
      }

      if (referralData?.status !== 'accepted') {
        return res.status(400).json({ error: 'Referral must be accepted first' });
      }

      const updateData = {
        status: 'patient-arrived',
        patientArrivedAt: admin.firestore.FieldValue.serverTimestamp(),
        patientArrivedBy: arrivedBy,
        patientArrivedByName: arrivedByName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await referralRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'referral.patient_arrived',
        entityType: 'referral',
        entityId: referralId,
        before: referralData,
        after: { ...referralData, ...updateData },
        metadata: {
          patientName: referralData?.patientName
        }
      });

      const updatedDoc = await referralRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error marking patient arrival:', error);
      res.status(500).json({ error: 'Failed to mark patient arrival' });
    }
  }
);

// Mark as consulted
router.patch(
  '/:facilityId/referrals/:referralId/consulted',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'doctor']),
  async (req, res) => {
    try {
      const { facilityId, referralId } = req.params;
      const { consultedBy, consultedByName } = req.body;

      const referralRef = db.doc(`referrals/${referralId}`);
      const referralDoc = await referralRef.get();

      if (!referralDoc.exists) {
        return res.status(404).json({ error: 'Referral not found' });
      }

      const referralData = referralDoc.data();

      if (referralData?.toFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Referral not for this facility' });
      }

      if (referralData?.status !== 'patient-arrived') {
        return res.status(400).json({ error: 'Patient must arrive first' });
      }

      const updateData = {
        status: 'consulted',
        consultedAt: admin.firestore.FieldValue.serverTimestamp(),
        consultedBy,
        consultedByName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await referralRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'referral.consulted',
        entityType: 'referral',
        entityId: referralId,
        before: referralData,
        after: { ...referralData, ...updateData },
        metadata: {
          patientName: referralData?.patientName
        }
      });

      const updatedDoc = await referralRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error marking as consulted:', error);
      res.status(500).json({ error: 'Failed to mark as consulted' });
    }
  }
);

// Record outcome
router.patch(
  '/:facilityId/referrals/:referralId/outcome',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'doctor']),
  async (req, res) => {
    try {
      const { facilityId, referralId } = req.params;
      const { diagnosis, treatmentGiven, followUpPlan, recordedBy, recordedByName } = req.body;

      const referralRef = db.doc(`referrals/${referralId}`);
      const referralDoc = await referralRef.get();

      if (!referralDoc.exists) {
        return res.status(404).json({ error: 'Referral not found' });
      }

      const referralData = referralDoc.data();

      if (referralData?.toFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Referral not for this facility' });
      }

      if (referralData?.status !== 'consulted') {
        return res.status(400).json({ error: 'Patient must be consulted first' });
      }

      const outcome = {
        diagnosis,
        treatmentGiven,
        followUpPlan,
        recordedBy,
        recordedByName,
        recordedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const updateData = {
        status: 'outcome',
        outcome,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await referralRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'referral.outcome_recorded',
        entityType: 'referral',
        entityId: referralId,
        before: referralData,
        after: { ...referralData, ...updateData },
        metadata: {
          patientName: referralData?.patientName,
          diagnosis
        }
      });

      const updatedDoc = await referralRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error recording outcome:', error);
      res.status(500).json({ error: 'Failed to record outcome' });
    }
  }
);

// Mark stalled referrals (background job - typically)
router.post(
  '/:facilityId/referrals/:referralId/mark-stalled',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, referralId } = req.params;
      const { stalledReason } = req.body;

      const referralRef = db.doc(`referrals/${referralId}`);
      const referralDoc = await referralRef.get();

      if (!referralDoc.exists) {
        return res.status(404).json({ error: 'Referral not found' });
      }

      const referralData = referralDoc.data();

      const updateData = {
        stalled: true,
        stalledAt: admin.firestore.FieldValue.serverTimestamp(),
        stalledReason: stalledReason || 'Patient has not arrived within expected timeframe',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await referralRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'referral.marked_stalled',
        entityType: 'referral',
        entityId: referralId,
        before: referralData,
        after: { ...referralData, ...updateData },
        metadata: {
          patientName: referralData?.patientName,
          reason: stalledReason
        }
      });

      const updatedDoc = await referralRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error marking referral as stalled:', error);
      res.status(500).json({ error: 'Failed to mark referral as stalled' });
    }
  }
);

// Create new referral (typically called by referring facility/doctor)
router.post(
  '/:facilityId/referrals',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'doctor']),
  async (req, res) => {
    try {
      const { facilityId } = req.params;
      const {
        toFacilityId,
        toFacilityName,
        patientId,
        patientName,
        patientAge,
        patientGender,
        reason,
        clinicalSummary,
        urgency,
        transportRequired
      } = req.body;

      // Get facility name
      const facilityDoc = await db.doc(`facilities/${facilityId}`).get();
      const fromFacilityName = facilityDoc.data()?.name || 'Unknown Facility';

      // Calculate acceptance deadline (24 hours for routine, 4 hours for urgent, 1 hour for emergency)
      let acceptanceDeadlineHours = 24;
      if (urgency === 'urgent') acceptanceDeadlineHours = 4;
      if (urgency === 'emergency') acceptanceDeadlineHours = 1;

      const acceptanceDeadline = new Date();
      acceptanceDeadline.setHours(acceptanceDeadline.getHours() + acceptanceDeadlineHours);

      const referralData = {
        fromFacilityId: facilityId,
        fromFacilityName,
        toFacilityId,
        toFacilityName,
        patientId,
        patientName,
        patientAge,
        patientGender,
        reason,
        clinicalSummary,
        urgency,
        status: 'created',
        transportRequired: transportRequired || false,
        stalled: false,
        createdBy: req.user!.uid,
        createdByName: req.user!.displayName || req.user!.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        acceptanceDeadline: admin.firestore.Timestamp.fromDate(acceptanceDeadline),
        stallThreshold: acceptanceDeadlineHours * 2 // Hours before marking as stalled
      };

      const referralRef = await db.collection('referrals').add(referralData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'referral.created',
        entityType: 'referral',
        entityId: referralRef.id,
        before: null,
        after: referralData,
        metadata: {
          patientName,
          toFacility: toFacilityName,
          urgency
        }
      });

      const newReferralDoc = await referralRef.get();
      res.status(201).json({
        id: newReferralDoc.id,
        ...newReferralDoc.data()
      });
    } catch (error) {
      console.error('Error creating referral:', error);
      res.status(500).json({ error: 'Failed to create referral' });
    }
  }
);

export default router;
