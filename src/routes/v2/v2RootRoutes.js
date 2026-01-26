// file: src/routes/v2/v2RootRoutes.js
const express = require('express');
const router = express.Router();

/**
 * @desc    API Root for v2
 * @route   GET /v2/
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the CommTracker API v2',
    availableEndpoints: {
      auth: '/auth',
      users: '/users',
      trackers: '/trackers',
      recipients: '/recipients',
      trackerRecipients: '/tracker-recipients',
      recipientTrackers: '/recipient-trackers',
      activityLogs: '/activity-logs',
    },
  });
});
/**
 * @desc    API Root for v2
 * @route   GET /v2/health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date(),
  });
});

module.exports = router;