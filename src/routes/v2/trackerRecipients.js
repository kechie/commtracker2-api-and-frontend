// src/routes/v2/trackerRecipients.js
const express = require('express');
const router = express.Router();
const {
  getTrackerRecipients,
  getTrackerRecipientById,
  upsertTrackerRecipient,
  updateTrackerRecipientStatus,
  bulkUpdateTrackerRecipients,
  deleteTrackerRecipient
} = require('../../controllers/v2/trackerRecipientController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All routes in this file are protected and require a role of 'receiving', 'admin', or 'superadmin'
router.use(verifyToken, requireRole(['receiving', 'admin', 'superadmin']));

// Get all tracker-recipients for a specific tracker
router.get('/trackers/:trackerId/recipients', getTrackerRecipients);

// Bulk update tracker-recipients for a tracker
router.post('/trackers/:trackerId/recipients/bulk-update', bulkUpdateTrackerRecipients);

// Get specific tracker-recipient by ID
router.get('/:id', getTrackerRecipientById);

// Create or update tracker-recipient action for a tracker-recipient pair
router.post('/trackers/:trackerId/recipients/:recipientId/action', upsertTrackerRecipient);

// Update tracker-recipient status
router.patch('/:id/status', updateTrackerRecipientStatus);

// Delete tracker-recipient
router.delete('/:id', deleteTrackerRecipient);

module.exports = router;
