// src/controllers/v2/trackerController.js
const fs = require('fs').promises;
const path = require('path');
const { Tracker, Recipient, TrackerRecipient, sequelize } = require('../../db'); // Import sequelize for transactions
const { Op, fn, col, literal } = require('sequelize'); // Import Op for operators
const { body, validationResult } = require('express-validator'); // ← add this dependency
const { logTrackerActivity } = require('../../utils/activityLogger');

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

// Helper function to delete file from disk
const deleteFile = async (filename) => {
  if (!filename) return;
  try {
    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.unlink(filePath);
    console.log(`Deleted file: ${filename}`);
  } catch (error) {
    // Log error but don't throw - file may already be deleted
    console.error(`Failed to delete file ${filename}:`, error.message);
  }
};

// Helper function to validate file
const validateFile = (file) => {
  if (!file) return { valid: true };

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  return { valid: true };
};

// Helper function to generate serial number
const generateSerialNumberx = async (transaction) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // MM format (01-12)
  const prefix = `${currentYear}-${currentMonth}-DTS2-`;

  // Find the highest serial number for the current year and month
  const lastTracker = await Tracker.findOne({
    where: {
      serialNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [
      [sequelize.literal(`CAST(SUBSTRING("serial_number", LENGTH('${prefix}') + 1) AS INTEGER)`), 'DESC'],
    ],
    transaction, // Ensure this query is part of the transaction
    lock: transaction.LOCK.UPDATE, // row-level lock (postgresql)
    paranoid: false, // Consider soft-deleted records since serial numbers must be unique
  });

  let nextSequence = 1;
  if (lastTracker && lastTracker.serialNumber) {
    const lastSequence = parseInt(lastTracker.serialNumber.substring(prefix.length), 10);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(8, '0')}`;
};

const generateSerialNumber = async (transaction) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${currentYear}-${currentMonth}-DTS2-`;

  // Lock to prevent race conditions
  await sequelize.query('SELECT pg_advisory_xact_lock(123456789)', { transaction });

  const lastTracker = await Tracker.findOne({
    where: {
      serialNumber: {  // ← this is fine, Sequelize maps it to serial_number
        [Op.like]: `${prefix}%`,
      },
    },
    attributes: ['id', 'serialNumber'], // ← good (maps correctly)
    order: [
      [
        // Fix is here ↓↓↓ use snake_case column name inside literal
        literal(`CAST(SUBSTRING("serial_number", ${prefix.length + 1}) AS INTEGER)`),
        'DESC'
      ]
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,     // stronger row lock
    paranoid: false,                   // usually better to consider soft-deleted for continuity
  });

  let nextSequence = 1;
  if (lastTracker && lastTracker.serialNumber) {
    const lastSeqStr = lastTracker.serialNumber.substring(prefix.length);
    const lastSequence = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(8, '0')}`;
};

// Validation chain (you can export and reuse)
const trackerValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('dateReceived').optional().isISO8601().toDate(),
  body('recipientIds').optional().isArray().withMessage('recipientIds must be an array'),
  body('recipientIds.*').isUUID(4).withMessage('Invalid recipient ID'),
  // add more fields as needed: description, priority, etc.
];
// @desc    Create a tracker
// @route   POST /api/v2/trackers
// @access  Private (receiving role)
exports.createTracker = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start a transaction
  try {
    const { recipientIds, serialNumber: incomingSerialNumber, ...trackerData } = req.body;

    // Validate file if provided
    if (req.file) {
      const fileValidation = validateFile(req.file);
      if (!fileValidation.valid) {
        await transaction.rollback();
        // Clean up uploaded file
        await deleteFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: fileValidation.error
        });
      }
    }

    let finalSerialNumber = incomingSerialNumber;
    if (!finalSerialNumber) {
      finalSerialNumber = await generateSerialNumber(transaction);
    }

    // Handle file upload
    if (req.file) {
      trackerData.attachment = req.file.filename;
      trackerData.attachmentMimeType = req.file.mimetype;
    }

    // Create the tracker within the transaction
    const tracker = await Tracker.create({
      ...trackerData,
      serialNumber: finalSerialNumber,
    }, { transaction });

    // Set recipients if provided
    if (recipientIds && recipientIds.length > 0) {
      await tracker.setRecipients(recipientIds, { transaction });
    }

    await transaction.commit(); // Commit the transaction

    // Reload the tracker with nested trackerRecipients (includes recipients and their actions)
    const result = await Tracker.findByPk(tracker.id, {
      include: [
        {
          association: 'trackerRecipients',
          include: [
            {
              association: 'recipient',
              attributes: ['id', 'recipientName', 'recipientCode', 'initial']
            }
          ]
        }
      ],
    });

    // Log tracker creation
    await logTrackerActivity({
      userId: req.user?.id,
      action: 'CREATE',
      entityId: tracker.id,
      description: `Created tracker: ${trackerData.documentTitle || 'Untitled'}`,
      details: {
        serialNumber: finalSerialNumber,
        recipients: recipientIds,
        documentTitle: trackerData.documentTitle
      },
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'success'
    });

    res.status(201).json(result);
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error('Create tracker error:', error);

    // Clean up file on error
    if (req.file) {
      await deleteFile(req.file.filename);
    }

    // Log failed tracker creation
    await logTrackerActivity({
      userId: req.user?.id,
      action: 'CREATE',
      description: `Failed to create tracker: ${error.message}`,
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'failure'
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// @desc    Get trackers with pagination
// @route   GET /api/v2/trackers?page=1&limit=10&sortBy=dateReceived&sortOrder=DESC
// @access  Private (receiving role)
exports.getTrackers = async (req, res) => {
  try {
    // Get pagination parameters from query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 10 : limitParam)); // Max 100 per page, default 10
    const sortBy = req.query.sortBy || 'dateReceived';
    const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();

    // Validate sortOrder
    if (!['ASC', 'DESC'].includes(sortOrder)) {
      return res.status(400).json({ error: 'Invalid sortOrder. Must be ASC or DESC' });
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count and paginated results
    // Use distinct: true to count unique trackers, not joined rows
    const { count, rows } = await Tracker.findAndCountAll({
      distinct: true,
      col: 'id',
      include: [
        {
          association: 'trackerRecipients',
          include: [
            {
              association: 'recipient',
              attributes: ['id', 'recipientName', 'recipientCode', 'initial']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Get trackers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Get all trackers without pagination (use with caution for large datasets)
// @route   GET /api/v2/trackers/all
// @access  Private (receiving role)
exports.getAllTrackers = async (req, res) => {
  try {
    const trackers = await Tracker.findAll({
      include: [
        {
          association: 'trackerRecipients',
          include: [
            {
              association: 'recipient',
              attributes: ['id', 'recipientName', 'recipientCode', 'initial']
            }
          ]
        }
      ],
      order: [['dateReceived', 'DESC']],
    });
    res.json({
      data: trackers,
      total: trackers.length
    });
  } catch (error) {
    console.error('Get all trackers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Get a single tracker by ID
// @route   GET /api/v2/trackers/:id
// @access  Private (receiving role)
exports.getTrackerById = async (req, res) => {
  try {
    const tracker = await Tracker.findByPk(req.params.id, {
      include: [
        {
          association: 'trackerRecipients',
          include: [
            {
              association: 'recipient',
              attributes: ['id', 'recipientName', 'recipientCode', 'initial']
            }
          ]
        }
      ],
    });
    if (!tracker) {
      return res.status(404).json({ error: 'Tracker not found' });
    }
    res.json(tracker);
  } catch (error) {
    console.error('Get tracker by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Update a tracker
// @route   PUT /api/v2/trackers/:id
// @access  Private (receiving role)
exports.updateTracker = async (req, res) => {
  try {
    const tracker = await Tracker.findByPk(req.params.id);
    if (!tracker) {
      // Clean up uploaded file if tracker not found
      if (req.file) {
        await deleteFile(req.file.filename);
      }
      return res.status(404).json({
        success: false,
        error: 'Tracker not found'
      });
    }

    // Validate file if provided
    if (req.file) {
      const fileValidation = validateFile(req.file);
      if (!fileValidation.valid) {
        // Clean up uploaded file
        await deleteFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: fileValidation.error
        });
      }
    }

    const { recipientIds, ...trackerData } = req.body;

    // serialNumber should not be updated after creation, unless specifically allowed by logic
    if (trackerData.serialNumber) {
      delete trackerData.serialNumber;
    }

    // Handle file update - delete old file if new one is being uploaded
    if (req.file) {
      const oldFileName = tracker.attachment;
      trackerData.attachment = req.file.filename;
      trackerData.attachmentMimeType = req.file.mimetype;
      // Delete old file asynchronously (don't wait for it)
      if (oldFileName) {
        deleteFile(oldFileName);
      }
    }

    // Update tracker's own fields
    await tracker.update(trackerData);

    // Update recipients if provided
    if (recipientIds) {
      await tracker.setRecipients(recipientIds);
    }

    // Reload the tracker with nested trackerRecipients
    const result = await Tracker.findByPk(tracker.id, {
      include: [
        {
          association: 'trackerRecipients',
          include: [
            {
              association: 'recipient',
              attributes: ['id', 'recipientName', 'recipientCode', 'initial']
            }
          ]
        }
      ],
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Update tracker error:', error);
    // Clean up file on error
    if (req.file) {
      await deleteFile(req.file.filename);
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// @desc    Delete a tracker
// @route   DELETE /api/v2/trackers/:id
// @access  Private (receiving role)
exports.deleteTracker = async (req, res) => {
  try {
    const tracker = await Tracker.findByPk(req.params.id);
    if (!tracker) {
      return res.status(404).json({
        success: false,
        error: 'Tracker not found'
      });
    }

    // Delete associated file before deleting tracker
    const fileName = tracker.attachment;

    await tracker.destroy();

    // Delete file asynchronously (don't wait for it)
    if (fileName) {
      deleteFile(fileName);
    }

    // Log tracker deletion
    await logTrackerActivity({
      userId: req.user?.id,
      action: 'DELETE',
      entityId: tracker.id,
      description: `Deleted tracker: ${tracker.documentTitle || tracker.serialNumber}`,
      details: { serialNumber: tracker.serialNumber },
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Tracker deleted successfully'
    });
  } catch (error) {
    console.error('Delete tracker error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

exports.serveAttachment = async (req, res) => {
  try {
    const tracker = await Tracker.findByPk(req.params.id);
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