import express from 'express';
import { authenticateFacilityUser, requireFacilityRole } from '../middleware/facilityAuth';
import { db, admin } from '../firebase-admin';
import { logAudit } from '../services/auditLog';

const router = express.Router();

// Get all diagnostics for a facility
router.get(
  '/:facilityId/diagnostics',
  authenticateFacilityUser,
  requireFacilityRole(['lab_technician', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { status, priority, testType } = req.query;

      let query = db.collection(`facilities/${facilityId}/diagnostics`).orderBy('orderedAt', 'desc');

      if (status) {
        query = query.where('status', '==', status) as any;
      }
      if (priority) {
        query = query.where('priority', '==', priority) as any;
      }
      if (testType) {
        query = query.where('testType', '==', testType) as any;
      }

      const snapshot = await query.get();
      const tests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(tests);
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      res.status(500).json({ error: 'Failed to fetch diagnostics' });
    }
  }
);

// Get single diagnostic test
router.get(
  '/:facilityId/diagnostics/:testId',
  authenticateFacilityUser,
  requireFacilityRole(['lab_technician', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, testId } = req.params;

      const testDoc = await db.doc(`facilities/${facilityId}/diagnostics/${testId}`).get();

      if (!testDoc.exists) {
        return res.status(404).json({ error: 'Test not found' });
      }

      res.json({
        id: testDoc.id,
        ...testDoc.data()
      });
    } catch (error) {
      console.error('Error fetching diagnostic test:', error);
      res.status(500).json({ error: 'Failed to fetch diagnostic test' });
    }
  }
);

// Collect sample for a test
router.patch(
  '/:facilityId/diagnostics/:testId/collect-sample',
  authenticateFacilityUser,
  requireFacilityRole(['lab_technician', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, testId } = req.params;
      const { collectedBy, collectedByName } = req.body;
      const testRef = db.doc(`facilities/${facilityId}/diagnostics/${testId}`);

      const testDoc = await testRef.get();
      if (!testDoc.exists) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const testData = testDoc.data();
      if (testData?.status !== 'pending') {
        return res.status(400).json({ error: 'Test is not in pending status' });
      }

      const updateData = {
        status: 'sample-collected',
        sampleCollectedAt: admin.firestore.FieldValue.serverTimestamp(),
        sampleCollectedBy: collectedBy,
        sampleCollectedByName: collectedByName
      };

      await testRef.update(updateData);

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'diagnostics.sample_collected',
        entityType: 'diagnostic',
        entityId: testId,
        before: testData,
        after: { ...testData, ...updateData },
        metadata: {
          testName: testData?.testName,
          patientName: testData?.patientName
        }
      });

      const updatedDoc = await testRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error collecting sample:', error);
      res.status(500).json({ error: 'Failed to collect sample' });
    }
  }
);

// Start test (mark as in-progress)
router.patch(
  '/:facilityId/diagnostics/:testId/start',
  authenticateFacilityUser,
  requireFacilityRole(['lab_technician', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, testId } = req.params;
      const { technician, technicianName } = req.body;
      const testRef = db.doc(`facilities/${facilityId}/diagnostics/${testId}`);

      const testDoc = await testRef.get();
      if (!testDoc.exists) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const testData = testDoc.data();
      if (testData?.status !== 'sample-collected') {
        return res.status(400).json({ error: 'Sample not collected yet' });
      }

      const updateData = {
        status: 'in-progress',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        assignedTo: technician,
        assignedToName: technicianName
      };

      await testRef.update(updateData);

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'diagnostics.test_started',
        entityType: 'diagnostic',
        entityId: testId,
        before: testData,
        after: { ...testData, ...updateData },
        metadata: {
          testName: testData?.testName,
          patientName: testData?.patientName
        }
      });

      const updatedDoc = await testRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error starting test:', error);
      res.status(500).json({ error: 'Failed to start test' });
    }
  }
);

// Upload test result
router.post(
  '/:facilityId/diagnostics/:testId/upload-result',
  authenticateFacilityUser,
  requireFacilityRole(['lab_technician', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, testId } = req.params;
      // In a real app, process file upload from multipart/form-data
      // For now, accept resultUrl and notes from body
      const { resultUrl, resultNotes } = req.body;

      const testRef = db.doc(`facilities/${facilityId}/diagnostics/${testId}`);
      const testDoc = await testRef.get();

      if (!testDoc.exists) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const testData = testDoc.data();
      if (testData?.status !== 'in-progress') {
        return res.status(400).json({ error: 'Test not in progress' });
      }

      const updateData = {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        resultUrl: resultUrl || `https://storage.googleapis.com/facility-results/${testId}.pdf`, // Placeholder
        resultNotes: resultNotes || '',
        completedBy: req.user!.uid,
        completedByName: req.user!.displayName || req.user!.email
      };

      await testRef.update(updateData);

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'diagnostics.result_uploaded',
        entityType: 'diagnostic',
        entityId: testId,
        before: testData,
        after: { ...testData, ...updateData },
        metadata: {
          testName: testData?.testName,
          patientName: testData?.patientName
        }
      });

      const updatedDoc = await testRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error uploading result:', error);
      res.status(500).json({ error: 'Failed to upload result' });
    }
  }
);

// Cancel test
router.patch(
  '/:facilityId/diagnostics/:testId/cancel',
  authenticateFacilityUser,
  requireFacilityRole(['lab_technician', 'facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, testId } = req.params;
      const { reason } = req.body;

      const testRef = db.doc(`facilities/${facilityId}/diagnostics/${testId}`);
      const testDoc = await testRef.get();

      if (!testDoc.exists) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const testData = testDoc.data();
      if (testData?.status === 'completed' || testData?.status === 'cancelled') {
        return res.status(400).json({ error: 'Cannot cancel completed or already cancelled test' });
      }

      const updateData = {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelledBy: req.user!.uid,
        cancelledByName: req.user!.displayName || req.user!.email,
        cancelReason: reason
      };

      await testRef.update(updateData);

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'diagnostics.cancelled',
        entityType: 'diagnostic',
        entityId: testId,
        before: testData,
        after: { ...testData, ...updateData },
        metadata: {
          testName: testData?.testName,
          patientName: testData?.patientName,
          reason
        }
      });

      const updatedDoc = await testRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error cancelling test:', error);
      res.status(500).json({ error: 'Failed to cancel test' });
    }
  }
);

// Create new diagnostic test order (typically called by doctors/ASHAs)
router.post(
  '/:facilityId/diagnostics',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'lab_technician']), // In real app, also allow doctors
  async (req, res) => {
    try {
      const { facilityId } = req.params;
      const {
        patientId,
        patientName,
        patientAge,
        patientGender,
        testType,
        testName,
        priority,
        orderedBy,
        orderedByName
      } = req.body;

      // Validation
      if (!patientId || !testName || !testType || !priority) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const testData = {
        patientId,
        patientName,
        patientAge,
        patientGender,
        testType,
        testName,
        priority,
        status: 'pending',
        orderedBy: orderedBy || req.user!.uid,
        orderedByName: orderedByName || req.user!.displayName || req.user!.email,
        orderedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const testRef = await db.collection(`facilities/${facilityId}/diagnostics`).add(testData);

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'diagnostics.created',
        entityType: 'diagnostic',
        entityId: testRef.id,
        before: null,
        after: testData,
        metadata: {
          testName,
          patientName,
          priority
        }
      });

      const newTestDoc = await testRef.get();
      res.status(201).json({
        id: newTestDoc.id,
        ...newTestDoc.data()
      });
    } catch (error) {
      console.error('Error creating diagnostic test:', error);
      res.status(500).json({ error: 'Failed to create diagnostic test' });
    }
  }
);

export default router;
