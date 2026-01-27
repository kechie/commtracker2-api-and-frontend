// controllers/v2/v2RootRoutes.js
//const express = require('express'); // actually not needed here
const { logUserActivity } = require('../../utils/activityLogger');
// You can remove express require — not used

exports.getHealth = async (req, res) => {
  res.json({
    status: 'OK',
    version: 'v2',
    timestamp: new Date().toISOString(), // more standard
    uptime: process.uptime()             // optional but nice
  });
};
/**
 * @desc    API Root for v2
 * @route   GET /v2/
 * @access  Public
 */
// router.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Welcome to the CommTracker API v2',
//     availableEndpoints: {
//       auth: '/auth',
//       users: '/users',
//       trackers: '/trackers',
//       recipients: '/recipients',
//       trackerRecipients: '/tracker-recipients',
//       recipientTrackers: '/recipient-trackers',
//       activityLogs: '/activity-logs',
//     },
//   });
// });
exports.getRoot = async (req, res) => {   // ← renamed to getRoot (more conventional)
  res.json({
    message: 'Welcome to CommTracker API v2',
    version: 'v2',
    //docs: '/v2/docs',                   // optional
    health: '/v2/health'
  });
};

// Alternative modern style (many people prefer this):
/*
module.exports = {
  getHealth,
  getRoot,
};
*/