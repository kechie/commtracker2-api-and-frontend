// src/routes/v2/analytics.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/v2/analyticsController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Protect analytics routes - only for admins and monitors
router.use(verifyToken);

/**
 * @route GET /v2/analytics/system-stats
 * @desc Get comprehensive system statistics
 * @access Private (Admin and Monitor only)
 */
router.get('/system-stats', requireRole(['admin', 'superadmin', 'monitor']), analyticsController.getSystemStats);

/**
 * @route GET /v2/analytics/recipient/:recipientId
 * @desc Get analytics for a specific recipient
 * @access Private (Admin or Owner)
 */
router.get('/recipient/:recipientId', requireRole(['admin', 'superadmin', 'monitor', 'recipient', 'lce', 'lcestaff']), analyticsController.getRecipientStats);

router.get('/recipient', requireRole(['admin', 'superadmin', 'monitor', 'recipient', 'lce', 'lcestaff']), analyticsController.getRecipientStatsTest)

module.exports = router;
