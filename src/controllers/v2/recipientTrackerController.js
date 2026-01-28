// src/controllers/v2/recipientTrackerController.js
const { TrackerRecipient, Tracker, Recipient, sequelize } = require('../../db');
const fs = require('fs').promises;
const path = require('path');
// File configuration
const UPLOADS_DIR = path.join(__dirname, '../../..', 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
];

/**
 * @desc    Get paginated list of trackers received by a specific recipient
 * @route   GET /api/v2/recipients/:recipientId/trackers
 * @access  Private
 */
exports.getReceivedTrackers = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: receivedTrackers } = await TrackerRecipient.findAndCountAll({
      where: { recipientId },
      include: [
        {
          model: Tracker,
          as: 'tracker',
        },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    res.json({
      success: true,
      data: receivedTrackers,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching received trackers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching received trackers',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all trackers received by a specific recipient without pagination
 * @route   GET /api/v2/recipients/:recipientId/trackers/all
 * @access  Private
 */
exports.getAllReceivedTrackers = async (req, res) => {
  try {
    const { recipientId } = req.params;

    const receivedTrackers = await TrackerRecipient.findAll({
      where: { recipientId },
      include: [
        {
          model: Tracker,
          as: 'tracker',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: receivedTrackers,
    });
  } catch (error) {
    console.error('Error fetching all received trackers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all received trackers',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a specific tracker received by a recipient
 * @route   GET /api/v2/recipients/:recipientId/trackers/:trackerId
 * @access  Private
 */
exports.getReceivedTracker = async (req, res) => {
  try {
    const { recipientId, trackerId } = req.params;

    const receivedTracker = await TrackerRecipient.findOne({
      where: { recipientId, trackerId },
      include: [
        {
          model: Tracker,
          as: 'tracker',
        },
        {
          model: Recipient,
          as: 'recipient',
        },
      ],
    });

    if (!receivedTracker) {
      return res.status(404).json({
        success: false,
        message: 'Received tracker not found',
      });
    }

    res.json({
      success: true,
      data: receivedTracker,
    });
  } catch (error) {
    console.error('Error fetching received tracker:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching received tracker',
      error: error.message,
    });
  }
};

/**
 * @desc    Update the status of a received tracker
 * @route   PUT /api/v2/recipients/:recipientId/trackers/:trackerId
 * @access  Private
 */
exports.updateReceivedTracker = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { recipientId, trackerId } = req.params;
    const { status, remarks } = req.body;

    const trackerRecipient = await TrackerRecipient.findOne({
      where: { recipientId, trackerId },
      transaction,
    });

    if (!trackerRecipient) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tracker-recipient record not found',
      });
    }

    const updateData = {};
    const now = new Date();

    // If only updating timestamps, retain status
    if (status === 'seen') {
      updateData.seenAt = now;
      updateData.isSeen = true;
    } else if (status === 'read') {
      updateData.readAt = now;
      updateData.isRead = true;
      if (!trackerRecipient.seenAt) {
        updateData.seenAt = now;
      }
      if (!trackerRecipient.isSeen) {
        updateData.isSeen = true;
      }
    } else {
      // For all other statuses, update the status and set corresponding timestamp
      updateData.status = status;
      if (status === 'acknowledged') {
        updateData.acknowledgedAt = now;
      } else if (status === 'completed') {
        updateData.completedAt = now;
      }
    }

    if (remarks !== undefined) updateData.remarks = remarks;

    await trackerRecipient.update(updateData, { transaction });
    await transaction.commit();

    const updatedRecord = await TrackerRecipient.findOne({
      where: { recipientId, trackerId },
      include: [
        {
          model: Tracker,
          as: 'tracker',
        },
        {
          model: Recipient,
          as: 'recipient',
        },
      ],
    });

    res.json({
      success: true,
      data: updatedRecord,
      message: 'Status updated successfully',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating tracker-recipient status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tracker-recipient status',
      error: error.message,
    });
  }
};
exports.downloadAttachment = async (req, res) => {
  try {
    const { recipientId, trackerId } = req.params;

    const trackerRecipient = await TrackerRecipient.findOne({
      where: { recipientId, trackerId },
      include: [
        {
          model: Tracker,
          as: 'tracker',
        },
      ],
    });

    if (!trackerRecipient || !trackerRecipient.tracker.attachmentPath) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    const filePath = trackerRecipient.tracker.attachmentPath;
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading attachment',
      error: error.message,
    });
  }
};

exports.serveAttachment = async (req, res) => {
  try {
    const tracker = await Tracker.findByPk(req.params.trackerId);
    if (!tracker || !tracker.attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const filePath = path.join(UPLOADS_DIR, tracker.attachment);
    res.download(filePath, tracker.attachment, (err) => {
      if (err) {
        console.error('File download error:', err);
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Serve attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
