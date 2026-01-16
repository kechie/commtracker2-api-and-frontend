// src/routes/v2/recipientActions.js
const express = require('express');
const router = express.Router();
const {
  getTrackerRecipientActions,
  getRecipientActionById,
  upsertRecipientAction,
  updateRecipientActionStatus,
  bulkUpdateRecipientActions,
  deleteRecipientAction
} = require('../../controllers/v2/recipientActionController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All routes in this file are protected and require a role of 'receiving', 'admin', or 'superadmin'
router.use(verifyToken, requireRole(['receiving', 'admin', 'superadmin']));

// Get all recipient actions for a specific tracker
router.get('/trackers/:trackerId/recipient-actions', getTrackerRecipientActions);

// Bulk update recipient actions for a tracker
router.post('/trackers/:trackerId/recipient-actions/bulk-update', bulkUpdateRecipientActions);

// Get specific recipient action by ID
router.get('/:actionId', getRecipientActionById);

// Create or update recipient action for a tracker-recipient pair
router.post('/trackers/:trackerId/recipients/:recipientId/action', upsertRecipientAction);

// Update recipient action status
router.patch('/:actionId/status', updateRecipientActionStatus);

// Delete recipient action
router.delete('/:actionId', deleteRecipientAction);

module.exports = router;
