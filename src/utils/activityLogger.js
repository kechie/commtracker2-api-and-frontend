// utils/activityLogger.js
const { ActivityLog } = require('../db');

/**
 * Log activity to the database
 * @param {Object} options - Activity log options
 * @param {string} options.userId - ID of the user performing the action
 * @param {string} options.action - Action type (CREATE, READ, UPDATE, DELETE, etc.)
 * @param {string} options.entityType - Type of entity (Tracker, User, Recipient, etc.)
 * @param {string} options.entityId - ID of the entity
 * @param {string} options.description - Human-readable description
 * @param {Object} options.details - Additional details (old values, new values, etc.)
 * @param {string} options.ipAddress - IP address of the request
 * @param {string} options.userAgent - User-Agent header
 * @param {string} options.status - Status (success or failure)
 * @returns {Promise<ActivityLog>}
 */
async function logActivity(options) {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      description,
      details,
      ipAddress,
      userAgent,
      status = 'success'
    } = options;

    // Validate required fields
    if (!action || !entityType) {
      console.warn('Activity logging: Missing required fields', { action, entityType });
      return null;
    }

    const log = await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      description,
      details,
      ipAddress,
      userAgent,
      status
    });

    return log;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging should not break main application flow
    return null;
  }
}

/**
 * Get IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Create activity logging middleware
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function createActivityLoggerMiddleware(options = {}) {
  return (req, res, next) => {
    // Store IP and User-Agent in request for later use
    req.clientIp = getClientIp(req);
    req.clientUserAgent = req.headers['user-agent'];

    next();
  };
}

/**
 * Log tracker activity
 */
async function logTrackerActivity(options) {
  return logActivity({
    entityType: 'Tracker',
    ...options
  });
}

/**
 * Log user activity
 */
async function logUserActivity(options) {
  return logActivity({
    entityType: 'User',
    ...options
  });
}

/**
 * Log recipient activity
 */
async function logRecipientActivity(options) {
  return logActivity({
    entityType: 'Recipient',
    ...options
  });
}

/**
 * Log recipient tracker activity
 */
async function logRecipientTrackerActivity(options) {
  return logActivity({
    entityType: 'RecipientTracker',
    ...options
  });
}

/**
 * Log authentication activity
 */
async function logAuthActivity(options) {
  return logActivity({
    entityType: 'Auth',
    ...options
  });
}

module.exports = {
  logActivity,
  logTrackerActivity,
  logUserActivity,
  logRecipientActivity,
  logRecipientTrackerActivity,
  logAuthActivity,
  getClientIp,
  createActivityLoggerMiddleware
};
