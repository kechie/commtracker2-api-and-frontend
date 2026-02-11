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
  serveAttachment,
  serveReplySlipAttachment,
  trackerValidation,
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

// Routes accessible by all authorized roles
router.use(verifyToken);

// Serve attachment files
router.get('/attachment/:id', requireRole(['receiving', 'admin', 'superadmin', 'recipient', 'monitor']), serveAttachment);
router.get('/reply-slip-attachment/:id', requireRole(['receiving', 'admin', 'superadmin', 'recipient', 'monitor']), serveReplySlipAttachment);

// All other routes in this file require 'receiving', 'admin', or 'superadmin'
router.use(requireRole(['receiving', 'admin', 'superadmin']));

// Get all trackers without pagination (use with caution)
router.get('/all', getAllTrackers);
// Serve attachment files
router.get('/attachment/:id', serveAttachment);
router.get('/reply-slip-attachment/:id', serveReplySlipAttachment);

// Get paginated trackers and create new tracker
router.route('/').post(upload.fields([{ name: 'attachment', maxCount: 1 }, { name: 'replySlipAttachment', maxCount: 1 }]), trackerValidation, createTracker).get(getTrackers);

// Get, update, delete specific tracker
router
  .route('/:id')
  .get(getTrackerById)
  .put(upload.fields([{ name: 'attachment', maxCount: 1 }, { name: 'replySlipAttachment', maxCount: 1 }]), trackerValidation, updateTracker)
  .delete(deleteTracker);

module.exports = router;