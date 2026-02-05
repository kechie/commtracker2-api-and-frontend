// src/controllers/v2/trackerRecipientController.js
const { TrackerRecipient, Tracker, Recipient, sequelize } = require('../../db');
const { Op } = require('sequelize');
const { logRecipientTrackerActivity } = require('../../utils/activityLogger');

// ───────────────────────────────────────────────
//  NEW: List all trackers assigned to a specific recipient
//  GET /api/v2/recipient-trackers
//  Query params supported:
//    ?status=pending,approved,completed,...
//    ?search=keyword (searches documentTitle + fromName + remarks)
//    ?sort=createdAt,dateReceived,updatedAt,status
//    ?order=ASC,DESC
//    ?page=1
//    ?limit=10
// ───────────────────────────────────────────────
// src/controllers/v2/trackerRecipientController.js
// ... (other imports)

exports.getRecipientTrackers = async (req, res) => {
  try {
    const { user } = req; // assuming middleware attaches user
    const recipientId = user?.recipientId;

    if (!recipientId) {
      return res.status(403).json({
        success: false,
        message: 'Recipient ID not found in user context',
      });
    }

    // Query parameters
    const {
      status,
      search,
      sort = 'createdAt',
      order = 'DESC',
      page = 1,
      limit = 10,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // WHERE conditions
    const where = { recipientId };

    if (status) {
      where.status = status;
    }

    if (search) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { '$tracker.documentTitle$': { [Op.iLike]: searchTerm } },
        { '$tracker.fromName$': { [Op.iLike]: searchTerm } },
        { remarks: { [Op.iLike]: searchTerm } },
      ];
    }

    // Date range filter on Tracker.dateReceived
    if (dateFrom || dateTo) {
      where['$tracker.dateReceived$'] = {};
      if (dateFrom) {
        where['$tracker.dateReceived$'][Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        where['$tracker.dateReceived$'][Op.lte] = new Date(`${dateTo}T23:59:59.999Z`);
      }
    }

    // Sorting
    const allowedSortFields = [
      'createdAt', 'updatedAt', 'status', 'seenAt', 'readAt', 'acknowledgedAt', 'completedAt', // TrackerRecipient fields
      'dateReceived', // Tracker fields
    ];

    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let orderClause;
    if (sortField === 'dateReceived') {
      orderClause = [[{ model: Tracker, as: 'tracker' }, sortField, sortDirection]];
    } else {
      orderClause = [[sortField, sortDirection]];
    }

    // Query
    const { count, rows } = await TrackerRecipient.findAndCountAll({
      where,
      include: [
        {
          model: Tracker,
          as: 'tracker',
          attributes: [
            'id',
            'serialNumber',
            'documentTitle',
            'fromName',
            'dateReceived',
          ],
          required: true,
        },
      ],
      attributes: [
        'id',
        'status',
        'remarks',
        'action',
        'seenAt',
        'readAt',
        'acknowledgedAt',
        'dueDate',
        'completedAt',
        'createdAt',
        'updatedAt',
      ],
      order: orderClause,
      limit: limitNum,
      offset,
    });

    const totalPages = Math.ceil(count / limitNum);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching recipient trackers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trackers',
      error: error.message,
    });
  }
};

// @desc    Get all tracker-recipient actions for a specific tracker
// @route   GET /api/v2/trackers/:trackerId/recipients
// @access  Private
exports.getTrackerRecipients = async (req, res) => {
  try {
    const { trackerId } = req.params;

    const trackerRecipients = await TrackerRecipient.findAll({
      where: { trackerId },
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: trackerRecipients
    });
  } catch (error) {
    console.error('Error fetching tracker recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracker recipients',
      error: error.message
    });
  }
};

// @desc    Get specific tracker-recipient by ID
// @route   GET /api/v2/tracker-recipients/:id
// @access  Private
exports.getTrackerRecipientById = async (req, res) => {
  try {
    const { id } = req.params;

    const trackerRecipient = await TrackerRecipient.findByPk(id, {
      include: [
        {
          model: Tracker,
          as: 'tracker',
          attributes: ['id', 'serialNumber', 'documentTitle', 'fromName']
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ]
    });

    if (!trackerRecipient) {
      return res.status(404).json({
        success: false,
        message: 'Tracker-recipient record not found'
      });
    }

    res.json({
      success: true,
      data: trackerRecipient
    });
  } catch (error) {
    console.error('Error fetching tracker-recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracker-recipient',
      error: error.message
    });
  }
};

// @desc    Create or update tracker-recipient action
// @route   POST /api/v2/trackers/:trackerId/recipients/:recipientId/action
// @access  Private
exports.upsertTrackerRecipient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { trackerId, recipientId } = req.params;
    const { status, action, remarks, dueDate } = req.body;

    // Verify tracker and recipient exist
    const tracker = await Tracker.findByPk(trackerId, { transaction });
    const recipient = await Recipient.findByPk(recipientId, { transaction });

    if (!tracker || !recipient) {
      await transaction.rollback();
      await logRecipientTrackerActivity({
        userId: req.user?.id,
        action: 'UPDATE',
        entityId: `${trackerId}-${recipientId}`,
        description: `Failed to update tracker-recipient: tracker or recipient not found`,
        ipAddress: req.clientIp,
        userAgent: req.clientUserAgent,
        status: 'failure'
      });
      return res.status(404).json({
        success: false,
        message: 'Tracker or recipient not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (status) {
      updateData.status = status;

      // Set timestamp based on status
      const now = new Date();
      if (status === 'seen') {
        updateData.seenAt = now;
      } else if (status === 'read') {
        updateData.readAt = now;
        if (!updateData.seenAt) updateData.seenAt = now;
      } else if (status === 'acknowledged') {
        updateData.acknowledgedAt = now;
      } else if (status === 'completed') {
        updateData.completedAt = now;
      }
    }
    if (action !== undefined) updateData.action = action;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    // Find or create tracker-recipient
    const [trackerRecipient, created] = await TrackerRecipient.findOrCreate({
      where: {
        trackerId,
        recipientId
      },
      defaults: {
        trackerId,
        recipientId,
        status: status || 'pending',
        action: action || null,
        remarks: remarks || null,
        dueDate: dueDate || null
      },
      transaction
    });

    // If not created, update it
    if (!created) {
      await trackerRecipient.update(updateData, { transaction });
    }

    await transaction.commit();

    // Log the activity
    await logRecipientTrackerActivity({
      userId: req.user?.id,
      action: created ? 'CREATE' : 'UPDATE',
      entityId: `${trackerId}-${recipientId}`,
      description: `${created ? 'Created' : 'Updated'} tracker-recipient: tracker ${tracker.serialNumber || trackerId}`,
      details: { 
        trackerId, 
        recipientId, 
        status, 
        action, 
        remarks 
      },
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'success'
    });

    const updatedRecord = await TrackerRecipient.findByPk(trackerRecipient.id, {
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ]
    });

    res.status(created ? 201 : 200).json({
      success: true,
      data: updatedRecord,
      message: created ? 'Tracker-recipient created' : 'Tracker-recipient updated'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error upserting tracker-recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Error upserting tracker-recipient',
      error: error.message
    });
  }
};

// @desc    Update tracker-recipient status
// @route   PATCH /api/v2/tracker-recipients/:id/status
// @access  Private
exports.updateTrackerRecipientStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, remarks, dueDate } = req.body;

    const trackerRecipient = await TrackerRecipient.findByPk(id, { transaction });

    if (!trackerRecipient) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tracker-recipient record not found'
      });
    }

    const updateData = { status };

    // Set timestamp based on status
    const now = new Date();
    if (status === 'seen') {
      updateData.seenAt = now;
    } else if (status === 'read') {
      updateData.readAt = now;
      if (!trackerRecipient.seenAt) {
        updateData.seenAt = now;
      }
    } else if (status === 'acknowledged') {
      updateData.acknowledgedAt = now;
    } else if (status === 'completed') {
      updateData.completedAt = now;
    }

    if (remarks !== undefined) updateData.remarks = remarks;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    await trackerRecipient.update(updateData, { transaction });
    await transaction.commit();

    const updatedRecord = await TrackerRecipient.findByPk(id, {
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedRecord,
      message: 'Status updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating tracker-recipient status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tracker-recipient status',
      error: error.message
    });
  }
};

// @desc    Bulk update tracker-recipients for a tracker
// @route   POST /api/v2/trackers/:trackerId/recipients/bulk-update
// @access  Private
exports.bulkUpdateTrackerRecipients = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { trackerId } = req.params;
    const { status, action } = req.body;

    const tracker = await Tracker.findByPk(trackerId, { transaction });
    if (!tracker) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tracker not found'
      });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;

      const now = new Date();
      if (status === 'seen') {
        updateData.seenAt = now;
      } else if (status === 'read') {
        updateData.readAt = now;
      } else if (status === 'acknowledged') {
        updateData.acknowledgedAt = now;
      } else if (status === 'completed') {
        updateData.completedAt = now;
      }
    }
    if (action) updateData.action = action;

    const [updatedCount] = await TrackerRecipient.update(updateData, {
      where: { trackerId },
      transaction
    });

    await transaction.commit();

    const updatedRecords = await TrackerRecipient.findAll({
      where: { trackerId },
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedRecords,
      message: `Updated ${updatedCount} tracker-recipients`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error bulk updating tracker-recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating tracker-recipients',
      error: error.message
    });
  }
};

// @desc    Delete tracker-recipient
// @route   DELETE /api/v2/tracker-recipients/:id
// @access  Private (Admin only)
exports.deleteTrackerRecipient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const trackerRecipient = await TrackerRecipient.findByPk(id, { transaction });

    if (!trackerRecipient) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tracker-recipient record not found'
      });
    }

    await trackerRecipient.destroy({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: 'Tracker-recipient deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting tracker-recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tracker-recipient',
      error: error.message
    });
  }
};
