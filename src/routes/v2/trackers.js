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
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// All routes in this file are protected and require a role of 'receiving', 'admin', or 'superadmin'
router.use(verifyToken, requireRole(['receiving', 'admin', 'superadmin']));

// Get all trackers without pagination (use with caution)
router.get('/all', getAllTrackers);

// Get paginated trackers and create new tracker
router.route('/').post(upload.single('attachment'), createTracker).get(getTrackers);

// Get, update, delete specific tracker
router
  .route('/:id')
  .get(getTrackerById)
  .put(updateTracker)
  .delete(deleteTracker);

module.exports = router;