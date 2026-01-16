// src/routes/v2/trackers.js
const express = require('express');
const router = express.Router();
const {
  createTracker,
  getTrackers,
  getAllTrackers,
  getTrackerById,
  updateTracker,
  deleteTracker,
} = require('../../controllers/v2/trackerController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All routes in this file are protected and require a role of 'receiving', 'admin', or 'superadmin'
router.use(verifyToken, requireRole(['receiving', 'admin', 'superadmin']));

// Get all trackers without pagination (use with caution)
router.get('/all', getAllTrackers);

// Get paginated trackers and create new tracker
router.route('/').post(createTracker).get(getTrackers);

// Get, update, delete specific tracker
router
  .route('/:id')
  .get(getTrackerById)
  .put(updateTracker)
  .delete(deleteTracker);

module.exports = router;