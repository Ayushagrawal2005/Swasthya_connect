import express from 'express';
import { authenticateFacilityUser, requireFacilityRole } from '../middleware/facilityAuth';
import { db, admin } from '../firebase-admin';
import { logAudit } from '../services/auditLog';

const router = express.Router();

// Get emergencies for a facility
router.get(
  '/:facilityId/emergencies',
  authenticateFacilityUser,
  requireFacilityRole(['ambulance_coordinator', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { status } = req.query;

      let query = db.collection('emergencies')
        .where('destinationFacilityId', '==', facilityId)
        .orderBy('receivedAt', 'desc');

      if (status && status !== 'all') {
        if (status === 'active') {
          // Active means not handed-over or cancelled
          query = query.where('status', 'in', [
            'pending-confirmation', 
            'confirmed', 
            'dispatched', 
            'en-route', 
            'arrived-at-patient', 
            'transporting'
          ]) as any;
        } else {
          query = query.where('status', '==', status) as any;
        }
      }

      const snapshot = await query.get();
      const emergencies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(emergencies);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      res.status(500).json({ error: 'Failed to fetch emergencies' });
    }
  }
);

// Get ambulances for a facility
router.get(
  '/:facilityId/ambulances',
  authenticateFacilityUser,
  requireFacilityRole(['ambulance_coordinator', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId } = req.params;

      const snapshot = await db.collection(`facilities/${facilityId}/ambulances`).get();
      const ambulances = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(ambulances);
    } catch (error) {
      console.error('Error fetching ambulances:', error);
      res.status(500).json({ error: 'Failed to fetch ambulances' });
    }
  }
);

// Confirm emergency (human verification of AI-generated emergency)
router.patch(
  '/:facilityId/emergencies/:emergencyId/confirm',
  authenticateFacilityUser,
  requireFacilityRole(['ambulance_coordinator', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, emergencyId } = req.params;
      const { confirmedBy, confirmedByName } = req.body;

      const emergencyRef = db.doc(`emergencies/${emergencyId}`);
      const emergencyDoc = await emergencyRef.get();

      if (!emergencyDoc.exists) {
        return res.status(404).json({ error: 'Emergency not found' });
      }

      const emergencyData = emergencyDoc.data();

      if (emergencyData?.destinationFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Emergency not destined for this facility' });
      }

      if (emergencyData?.status !== 'pending-confirmation') {
        return res.status(400).json({ error: 'Emergency not in pending-confirmation status' });
      }

      const updateData = {
        status: 'confirmed',
        confirmedByHuman: true,
        confirmedBy,
        confirmedByName,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        timeline: admin.firestore.FieldValue.arrayUnion({
          status: 'confirmed',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          userId: confirmedBy
        })
      };

      await emergencyRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'emergency.confirmed',
        entityType: 'emergency',
        entityId: emergencyId,
        before: emergencyData,
        after: { ...emergencyData, ...updateData },
        metadata: {
          patientName: emergencyData?.patientName,
          chiefComplaint: emergencyData?.chiefComplaint
        }
      });

      const updatedDoc = await emergencyRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error confirming emergency:', error);
      res.status(500).json({ error: 'Failed to confirm emergency' });
    }
  }
);

// Downgrade emergency
router.patch(
  '/:facilityId/emergencies/:emergencyId/downgrade',
  authenticateFacilityUser,
  requireFacilityRole(['ambulance_coordinator', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, emergencyId } = req.params;
      const { reason, downgradeBy, downgradeByName } = req.body;

      const emergencyRef = db.doc(`emergencies/${emergencyId}`);
      const emergencyDoc = await emergencyRef.get();

      if (!emergencyDoc.exists) {
        return res.status(404).json({ error: 'Emergency not found' });
      }

      const emergencyData = emergencyDoc.data();

      if (emergencyData?.destinationFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Emergency not destined for this facility' });
      }

      const updateData = {
        downgraded: true,
        downgradeReason: reason,
        downgradeBy,
        downgradeByName,
        downgradeAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'cancelled',
        timeline: admin.firestore.FieldValue.arrayUnion({
          status: 'downgraded',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          userId: downgradeBy
        })
      };

      await emergencyRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'emergency.downgraded',
        entityType: 'emergency',
        entityId: emergencyId,
        before: emergencyData,
        after: { ...emergencyData, ...updateData },
        metadata: {
          patientName: emergencyData?.patientName,
          reason
        }
      });

      const updatedDoc = await emergencyRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error downgrading emergency:', error);
      res.status(500).json({ error: 'Failed to downgrade emergency' });
    }
  }
);

// Dispatch ambulance
router.patch(
  '/:facilityId/emergencies/:emergencyId/dispatch',
  authenticateFacilityUser,
  requireFacilityRole(['ambulance_coordinator', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, emergencyId } = req.params;
      const { vehicleId, dispatchedBy, dispatchedByName } = req.body;

      // Get emergency
      const emergencyRef = db.doc(`emergencies/${emergencyId}`);
      const emergencyDoc = await emergencyRef.get();

      if (!emergencyDoc.exists) {
        return res.status(404).json({ error: 'Emergency not found' });
      }

      const emergencyData = emergencyDoc.data();

      if (emergencyData?.destinationFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Emergency not destined for this facility' });
      }

      if (emergencyData?.status !== 'confirmed') {
        return res.status(400).json({ error: 'Emergency not confirmed yet' });
      }

      // Get ambulance
      const ambulanceRef = db.doc(`facilities/${facilityId}/ambulances/${vehicleId}`);
      const ambulanceDoc = await ambulanceRef.get();

      if (!ambulanceDoc.exists) {
        return res.status(404).json({ error: 'Ambulance not found' });
      }

      const ambulanceData = ambulanceDoc.data();

      if (ambulanceData?.status !== 'available') {
        return res.status(400).json({ error: 'Ambulance not available' });
      }

      // Update emergency
      const emergencyUpdateData = {
        status: 'dispatched',
        assignedVehicleId: vehicleId,
        assignedVehicleNumber: ambulanceData?.vehicleNumber,
        dispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
        dispatchedBy,
        dispatchedByName,
        timeline: admin.firestore.FieldValue.arrayUnion({
          status: 'dispatched',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          userId: dispatchedBy
        })
      };

      await emergencyRef.update(emergencyUpdateData);

      // Update ambulance
      const ambulanceUpdateData = {
        status: 'dispatched',
        currentEmergencyId: emergencyId
      };

      await ambulanceRef.update(ambulanceUpdateData);

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'emergency.dispatched',
        entityType: 'emergency',
        entityId: emergencyId,
        before: emergencyData,
        after: { ...emergencyData, ...emergencyUpdateData },
        metadata: {
          patientName: emergencyData?.patientName,
          vehicleNumber: ambulanceData?.vehicleNumber
        }
      });

      const updatedDoc = await emergencyRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error dispatching ambulance:', error);
      res.status(500).json({ error: 'Failed to dispatch ambulance' });
    }
  }
);

// Update emergency status (en-route, arrived, transporting, handed-over)
router.patch(
  '/:facilityId/emergencies/:emergencyId/status',
  authenticateFacilityUser,
  requireFacilityRole(['ambulance_coordinator', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, emergencyId } = req.params;
      const { status, userId, userName } = req.body;

      const emergencyRef = db.doc(`emergencies/${emergencyId}`);
      const emergencyDoc = await emergencyRef.get();

      if (!emergencyDoc.exists) {
        return res.status(404).json({ error: 'Emergency not found' });
      }

      const emergencyData = emergencyDoc.data();

      if (emergencyData?.destinationFacilityId !== facilityId) {
        return res.status(403).json({ error: 'Emergency not destined for this facility' });
      }

      const updateData: any = {
        status,
        timeline: admin.firestore.FieldValue.arrayUnion({
          status,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          userId
        })
      };

      // Set specific timestamps
      if (status === 'arrived-at-patient') {
        updateData.arrivedAt = admin.firestore.FieldValue.serverTimestamp();
      } else if (status === 'handed-over') {
        updateData.handedOverAt = admin.firestore.FieldValue.serverTimestamp();
        
        // Calculate response time
        if (emergencyData?.receivedAt && emergencyData?.dispatchedAt) {
          const responseTimeMs = Date.now() - emergencyData.receivedAt.toMillis();
          updateData.responseTimeMinutes = Math.floor(responseTimeMs / 60000);
        }

        // Free up ambulance
        if (emergencyData?.assignedVehicleId) {
          const ambulanceRef = db.doc(`facilities/${facilityId}/ambulances/${emergencyData.assignedVehicleId}`);
          await ambulanceRef.update({
            status: 'available',
            currentEmergencyId: null
          });
        }
      }

      await emergencyRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: `emergency.${status}`,
        entityType: 'emergency',
        entityId: emergencyId,
        before: emergencyData,
        after: { ...emergencyData, ...updateData },
        metadata: {
          patientName: emergencyData?.patientName,
          status
        }
      });

      const updatedDoc = await emergencyRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error updating emergency status:', error);
      res.status(500).json({ error: 'Failed to update emergency status' });
    }
  }
);

// Update ambulance location (for GPS tracking)
router.patch(
  '/:facilityId/ambulances/:vehicleId/location',
  authenticateFacilityUser,
  requireFacilityRole(['ambulance_coordinator', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, vehicleId } = req.params;
      const { lat, lng } = req.body;

      const ambulanceRef = db.doc(`facilities/${facilityId}/ambulances/${vehicleId}`);
      const ambulanceDoc = await ambulanceRef.get();

      if (!ambulanceDoc.exists) {
        return res.status(404).json({ error: 'Ambulance not found' });
      }

      await ambulanceRef.update({
        lastLocation: {
          lat,
          lng,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });

      const updatedDoc = await ambulanceRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error updating ambulance location:', error);
      res.status(500).json({ error: 'Failed to update ambulance location' });
    }
  }
);

// Update ambulance status (available, out-of-service)
router.patch(
  '/:facilityId/ambulances/:vehicleId/status',
  authenticateFacilityUser,
  requireFacilityRole(['ambulance_coordinator', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, vehicleId } = req.params;
      const { status } = req.body;

      const ambulanceRef = db.doc(`facilities/${facilityId}/ambulances/${vehicleId}`);
      const ambulanceDoc = await ambulanceRef.get();

      if (!ambulanceDoc.exists) {
        return res.status(404).json({ error: 'Ambulance not found' });
      }

      const ambulanceData = ambulanceDoc.data();

      const updateData: any = { status };

      // If marking as available, clear emergency assignment
      if (status === 'available') {
        updateData.currentEmergencyId = null;
      }

      await ambulanceRef.update(updateData);

      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'ambulance.status_changed',
        entityType: 'ambulance',
        entityId: vehicleId,
        before: ambulanceData,
        after: { ...ambulanceData, ...updateData },
        metadata: {
          vehicleNumber: ambulanceData?.vehicleNumber,
          newStatus: status
        }
      });

      const updatedDoc = await ambulanceRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error updating ambulance status:', error);
      res.status(500).json({ error: 'Failed to update ambulance status' });
    }
  }
);

export default router;
