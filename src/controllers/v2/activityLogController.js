// controllers/v2/activityLogController.js
const { ActivityLog, User, sequelize, Sequelize } = require('../../db');
const Op = Sequelize.Op;

// Get all activity logs (with optional filters)
exports.getAllActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action, entityType, status, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * pageLimit;

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (status) where.status = status;

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullname']
        }
      ],
      limit: pageLimit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      subQuery: false
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: pageLimit,
        totalPages: Math.ceil(count / pageLimit)
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

// Get activity logs for a specific user
exports.getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * pageLimit;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { userId },
      limit: pageLimit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: pageLimit,
        totalPages: Math.ceil(count / pageLimit)
      }
    });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity logs' });
  }
};

// Get activity logs for a specific entity
exports.getEntityActivityLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * pageLimit;

    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { entityType, entityId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullname']
        }
      ],
      limit: pageLimit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: pageLimit,
        totalPages: Math.ceil(count / pageLimit)
      }
    });
  } catch (error) {
    console.error('Get entity activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch entity activity logs' });
  }
};

// Get activity log details
exports.getActivityLog = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await ActivityLog.findByPk(logId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullname']
        }
      ]
    });

    if (!log) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
};

// Get activity summary/statistics
exports.getActivitySummary = async (req, res) => {
  try {
    const { startDate, endDate, entityType } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }
    if (entityType) where.entityType = entityType;

    // Get action counts
    const actionCounts = await ActivityLog.findAll({
      where,
      attributes: ['action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['action'],
      raw: true
    });

    // Get status counts
    const statusCounts = await ActivityLog.findAll({
      where,
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    // Get entity type counts
    const entityCounts = await ActivityLog.findAll({
      where,
      attributes: ['entity_type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['entity_type'],
      raw: true
    });

    res.json({
      summary: {
        totalActivities: await ActivityLog.count({ where }),
        byAction: actionCounts,
        byStatus: statusCounts,
        byEntityType: entityCounts
      }
    });
  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({ error: 'Failed to fetch activity summary' });
  }
};

// Delete old activity logs (cleanup)
exports.deleteOldActivityLogs = async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await ActivityLog.destroy({
      where: {
        createdAt: {
          [require('sequelize').Op.lt]: cutoffDate
        }
      }
    });

    res.json({
      message: `Deleted ${result} activity logs older than ${daysOld} days`,
      deletedCount: result
    });
  } catch (error) {
    console.error('Delete activity logs error:', error);
    res.status(500).json({ error: 'Failed to delete activity logs' });
  }
};
