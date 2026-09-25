import express from 'express';
import { authenticateFacilityUser, requireFacilityRole } from '../middleware/facilityAuth';
import { db, admin } from '../firebase-admin';
import { logAudit } from '../services/auditLog';
import { setUserCustomClaims } from '../services/customClaims';

const router = express.Router();

// Get all staff for a facility
router.get(
  '/:facilityId/staff',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin']),
  async (req, res) => {
    try {
      const { facilityId } = req.params;

      const snapshot = await db.collection(`facilities/${facilityId}/staff`).get();
      const staff = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  }
);

// Add new staff member
router.post(
  '/:facilityId/staff',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin']),
  async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { name, email, phone, role, active } = req.body;

      // Validation
      if (!name || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user already exists in Firebase Auth
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(email);
      } catch (error: any) {
        // User doesn't exist, create them
        if (error.code === 'auth/user-not-found') {
          firebaseUser = await admin.auth().createUser({
            email,
            displayName: name,
            password: Math.random().toString(36).slice(-10), // Temporary password
          });

          // TODO: Send password reset email
        } else {
          throw error;
        }
      }

      // Set custom claims for this user
      await setUserCustomClaims(firebaseUser.uid, {
        role,
        facilityId,
        districtId: null // Set if needed
      });

      // Create staff record in Firestore
      const staffData = {
        name,
        email,
        phone: phone || '',
        role,
        active: active !== undefined ? active : true,
        onDutyToday: false,
        lastLogin: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: req.user!.uid
      };

      const staffRef = await db.collection(`facilities/${facilityId}/staff`).add(staffData);

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'staff.created',
        entityType: 'staff',
        entityId: staffRef.id,
        before: null,
        after: staffData,
        metadata: {
          staffName: name,
          role
        }
      });

      const newStaffDoc = await staffRef.get();
      res.status(201).json({
        id: newStaffDoc.id,
        ...newStaffDoc.data()
      });
    } catch (error: any) {
      console.error('Error adding staff:', error);
      res.status(500).json({ error: error.message || 'Failed to add staff' });
    }
  }
);

// Update staff member
router.patch(
  '/:facilityId/staff/:staffId',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, staffId } = req.params;
      const { name, email, phone, role, active } = req.body;

      const staffRef = db.doc(`facilities/${facilityId}/staff/${staffId}`);
      const staffDoc = await staffRef.get();

      if (!staffDoc.exists) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      const staffData = staffDoc.data();
      const updateData: any = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (role) updateData.role = role;
      if (active !== undefined) updateData.active = active;
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      await staffRef.update(updateData);

      // Update Firebase Auth custom claims if role changed
      if (role && role !== staffData?.role) {
        // Find Firebase user by email
        try {
          const firebaseUser = await admin.auth().getUserByEmail(staffData?.email);
          await setUserCustomClaims(firebaseUser.uid, {
            role,
            facilityId,
            districtId: null
          });
        } catch (error) {
          console.error('Error updating custom claims:', error);
        }
      }

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'staff.updated',
        entityType: 'staff',
        entityId: staffId,
        before: staffData,
        after: { ...staffData, ...updateData },
        metadata: {
          staffName: name || staffData?.name
        }
      });

      const updatedDoc = await staffRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      res.status(500).json({ error: 'Failed to update staff' });
    }
  }
);

// Delete staff member
router.delete(
  '/:facilityId/staff/:staffId',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin']),
  async (req, res) => {
    try {
      const { facilityId, staffId } = req.params;

      const staffRef = db.doc(`facilities/${facilityId}/staff/${staffId}`);
      const staffDoc = await staffRef.get();

      if (!staffDoc.exists) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      const staffData = staffDoc.data();

      // Instead of deleting, mark as inactive
      await staffRef.update({
        active: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: req.user!.uid
      });

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'staff.deleted',
        entityType: 'staff',
        entityId: staffId,
        before: staffData,
        after: { ...staffData, active: false },
        metadata: {
          staffName: staffData?.name
        }
      });

      res.json({ message: 'Staff member deactivated successfully' });
    } catch (error) {
      console.error('Error deleting staff:', error);
      res.status(500).json({ error: 'Failed to delete staff' });
    }
  }
);

// Toggle duty status
router.patch(
  '/:facilityId/staff/:staffId/duty-status',
  authenticateFacilityUser,
  requireFacilityRole(['facility_admin', 'queue_desk']),
  async (req, res) => {
    try {
      const { facilityId, staffId } = req.params;
      const { onDutyToday } = req.body;

      const staffRef = db.doc(`facilities/${facilityId}/staff/${staffId}`);
      const staffDoc = await staffRef.get();

      if (!staffDoc.exists) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      const staffData = staffDoc.data();

      await staffRef.update({
        onDutyToday: onDutyToday !== undefined ? onDutyToday : !staffData?.onDutyToday,
        dutyStatusUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Audit log
      await logAudit({
        facilityId,
        userId: req.user!.uid,
        action: 'staff.duty_status_changed',
        entityType: 'staff',
        entityId: staffId,
        before: staffData,
        after: { ...staffData, onDutyToday },
        metadata: {
          staffName: staffData?.name,
          newStatus: onDutyToday ? 'on-duty' : 'off-duty'
        }
      });

      const updatedDoc = await staffRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error updating duty status:', error);
      res.status(500).json({ error: 'Failed to update duty status' });
    }
  }
);

export default router;
