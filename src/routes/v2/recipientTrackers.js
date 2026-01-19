// src/routes/v2/recipientTrackers.js
const express = require('express');
const router = express.Router();
const {
  getReceivedTrackers,
  getAllReceivedTrackers,
  getReceivedTracker,
  updateReceivedTracker,
} = require('../../controllers/v2/recipientTrackerController');
const { verifyToken } = require('../../middleware/authMiddleware');

// All routes in this file are protected
router.use(verifyToken);

router.route('/recipients/:recipientId/trackers/all').get(getAllReceivedTrackers);
router.route('/recipients/:recipientId/trackers').get(getReceivedTrackers);

router
  .route('/recipients/:recipientId/trackers/:trackerId')
  .get(getReceivedTracker)
  .put(updateReceivedTracker);

module.exports = router;
