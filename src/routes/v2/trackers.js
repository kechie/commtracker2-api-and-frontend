// src/routes/v2/trackers.js
const express = require('express');
const router = express.Router();
const {
  createTracker,
  getTrackers,
  getTrackerById,
  updateTracker,
  deleteTracker,
} = require('../../controllers/v2/trackerController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All routes in this file are protected and require a role of 'receiving', 'admin', or 'superadmin'
router.use(verifyToken, requireRole(['receiving', 'admin', 'superadmin']));

router.route('/').post(createTracker).get(getTrackers);
router
  .route('/:id')
  .get(getTrackerById)
  .put(updateTracker)
  .delete(deleteTracker);

module.exports = router;