// src/routes/v2/recipientTrackers.js
const express = require('express');
const router = express.Router();
const {
  getReceivedTrackers,
  getAllReceivedTrackers,
  getReceivedTracker,
  updateReceivedTracker,
  serveAttachment,
} = require('../../controllers/v2/recipientTrackerController');
const { verifyToken } = require('../../middleware/authMiddleware');

// All routes in this file are protected
router.use(verifyToken);

router.route('/recipients/:recipientId/trackers/all').get(getAllReceivedTrackers);
router.route('/recipients/:recipientId/trackers').get(getReceivedTrackers);

// Get attachment file
router.route('/recipients/:recipientId/trackers/:trackerId/attachment').get(serveAttachment);

router
  .route('/recipients/:recipientId/trackers/:trackerId')
  .get(getReceivedTracker)
  .put(updateReceivedTracker);

module.exports = router;
