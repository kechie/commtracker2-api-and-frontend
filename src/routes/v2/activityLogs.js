// routes/v2/activityLogs.js
const express = require('express');
const router = express.Router();
const activityLogController = require('../../controllers/v2/activityLogController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);
// Restrict to specific roles
router.use(requireRole(['admin', 'superadmin', 'monitor']));

/**
 * @route GET /v2/activity-logs
 * @desc Get all activity logs with optional filters
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20)
 * @query userId - Filter by user ID
 * @query action - Filter by action type
 * @query entityType - Filter by entity type
 * @query status - Filter by status (success/failure)
 * @query sortBy - Sort field (default: createdAt)
 * @query sortOrder - Sort order (default: DESC)
 * @access Private
 */
router.get('/', activityLogController.getAllActivityLogs);

/**
 * @route GET /v2/activity-logs/user/:userId
 * @desc Get activity logs for a specific user
 * @param userId - User ID
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20)
 * @query sortBy - Sort field (default: createdAt)
 * @query sortOrder - Sort order (default: DESC)
 * @access Private
 */
router.get('/user/:userId', activityLogController.getUserActivityLogs);

/**
 * @route GET /v2/activity-logs/entity/:entityType/:entityId
 * @desc Get activity logs for a specific entity
 * @param entityType - Type of entity (e.g., Tracker, User, Recipient)
 * @param entityId - ID of the entity
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20)
 * @query sortBy - Sort field (default: createdAt)
 * @query sortOrder - Sort order (default: DESC)
 * @access Private
 */
router.get('/entity/:entityType/:entityId', activityLogController.getEntityActivityLogs);

/**
 * @route GET /v2/activity-logs/:logId
 * @desc Get a specific activity log
 * @param logId - Activity log ID
 * @access Private
 */
router.get('/:logId', activityLogController.getActivityLog);

/**
 * @route GET /v2/activity-logs/summary/statistics
 * @desc Get activity summary and statistics
 * @query startDate - Start date (ISO format)
 * @query endDate - End date (ISO format)
 * @query entityType - Filter by entity type
 * @access Private
 */
router.get('/summary/statistics', activityLogController.getActivitySummary);

/**
 * @route DELETE /v2/activity-logs/cleanup/old
 * @desc Delete activity logs older than specified days
 * @body daysOld - Number of days (default: 90)
 * @access Private (Admin only recommended)
 */
router.delete('/cleanup/old', activityLogController.deleteOldActivityLogs);

module.exports = router;
