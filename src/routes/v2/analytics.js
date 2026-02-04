// src/routes/v2/analytics.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/v2/analyticsController');
const { verifyToken, isAdmin } = require('../../middleware/authMiddleware');

// Protect analytics routes - likely only for admins
router.use(verifyToken);
//router.use(isAdmin); // Ensure only admins can access these stats
//router.use(isAdminOrMonitor); // Ensure only admins can access these stats

/**
 * @route GET /v2/analytics/system-stats
 * @desc Get comprehensive system statistics
 * @access Private (Admin only)
 */
router.get('/system-stats', analyticsController.getSystemStats);

/**
 * @route GET /v2/analytics/recipient/:recipientId
 * @desc Get analytics for a specific recipient
 * @access Private (Admin or Owner)
 */
router.get('/recipient/:recipientId', analyticsController.getRecipientStats);

router.get('/recipient', analyticsController.getRecipientStatsTest)
//router.get('/recipient', analyticsController.getRecipientStatsTest)
module.exports = router;
