// src/routes/v2/trackerRecipients.js
const express = require('express');
const router = express.Router();
const {
  getTrackerRecipients,
  getTrackerRecipientById,
  upsertTrackerRecipient,
  updateTrackerRecipientStatus,
  bulkUpdateTrackerRecipients,
  deleteTrackerRecipient,
  getRecipientTrackers,
  serveAttachment,
} = require('../../controllers/v2/trackerRecipientController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Auth and role middleware
router.use(verifyToken);

// Role groups
const readRoles = ['receiving', 'admin', 'superadmin', 'monitor', 'lcestaff', 'lce'];
const writeRoles = ['receiving', 'admin', 'superadmin'];
const deleteRoles = ['admin', 'superadmin'];

// Get all tracker-recipients for a specific tracker
router.get('/trackers/:trackerId/recipients', requireRole(readRoles), getTrackerRecipients);
router.get('/trackers/:trackerId/trackers', requireRole(readRoles), getRecipientTrackers);

// Bulk update tracker-recipients for a tracker
router.post('/trackers/:trackerId/recipients/bulk-update', requireRole(writeRoles), bulkUpdateTrackerRecipients);

// Get specific tracker-recipient by ID
router.get('/:id', requireRole(readRoles), getTrackerRecipientById);

// Create or update tracker-recipient action for a tracker-recipient pair
router.post('/trackers/:trackerId/recipients/:recipientId/action', requireRole(writeRoles), upsertTrackerRecipient);

// Update tracker-recipient status
router.patch('/:id/status', requireRole(writeRoles), updateTrackerRecipientStatus);

// Delete tracker-recipient
router.delete('/:id', requireRole(deleteRoles), deleteTrackerRecipient);

module.exports = router;
