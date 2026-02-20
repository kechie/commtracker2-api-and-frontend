// src/controllers/v2/trackerController.js
const fs = require('fs').promises;
const path = require('path');
const { Tracker, Recipient, TrackerRecipient, sequelize } = require('../../db'); // Import sequelize for transactions
const { Op, fn, col, literal } = require('sequelize'); // Import Op for operators
const { body, validationResult } = require('express-validator'); // ← add this dependency
const { logTrackerActivity } = require('../../utils/activityLogger');
const { notifyRecipients } = require('../../utils/push');

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
exports.trackerValidation = [
  body('documentTitle').trim().notEmpty().withMessage('Document Title is required'),
  body('fromName').trim().notEmpty().withMessage('From Name is required'),
  body('dateReceived').optional().isISO8601().toDate(),
  body('recipientIds').optional().isArray().withMessage('Recipient IDs must be an array'),
  body('recipientIds.*').optional().isUUID(4).withMessage('Invalid recipient ID'),
];
// @desc    Create a tracker
// @route   POST /api/v2/trackers
// @access  Private (receiving role)
exports.createTracker = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const transaction = await sequelize.transaction(); // Start a transaction
  try {
    const { recipientIds, serialNumber: incomingSerialNumber, ...trackerData } = req.body;

    // Validate files if provided
    const files = req.files || {};
    const attachmentFile = files.attachment ? files.attachment[0] : null;
    const replySlipFile = files.replySlipAttachment ? files.replySlipAttachment[0] : null;

    if (attachmentFile) {
      const fileValidation = validateFile(attachmentFile);
      if (!fileValidation.valid) {
        await transaction.rollback();
        await deleteFile(attachmentFile.filename);
        if (replySlipFile) await deleteFile(replySlipFile.filename);
        return res.status(400).json({ success: false, message: `Attachment: ${fileValidation.error}` });
      }
      trackerData.attachment = attachmentFile.filename;
      trackerData.attachmentMimeType = attachmentFile.mimetype;
    }

    if (replySlipFile) {
      const fileValidation = validateFile(replySlipFile);
      if (!fileValidation.valid) {
        await transaction.rollback();
        await deleteFile(replySlipFile.filename);
        if (attachmentFile) await deleteFile(attachmentFile.filename);
        return res.status(400).json({ success: false, message: `Reply Slip: ${fileValidation.error}` });
      }
      trackerData.replySlipAttachment = replySlipFile.filename;
      trackerData.replySlipAttachmentMimeType = replySlipFile.mimetype;
    }

    let finalSerialNumber = incomingSerialNumber;
    if (!finalSerialNumber) {
      finalSerialNumber = await generateSerialNumber(transaction);
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

    // Notify recipients after commit
    if (recipientIds && recipientIds.length > 0) {
      notifyRecipients(tracker, recipientIds, 'CREATE', req.user?.id).catch(err => 
        console.error('Failed to notify recipients on create:', err)
      );

      // Also notify staff and LCE users on tracker creation
      const { notifyRoles } = require('../../utils/push');
      notifyRoles(
        ['staff', 'lce', 'lcestaff'], 
        'New Document Tracker Created',
        `${tracker.serialNumber}: ${tracker.documentTitle}`,
        `/trackers/${tracker.id}`,
        req.user?.id
      ).catch(err => console.error('Failed to notify roles on create:', err));
    }

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

    // Clean up files on error
    if (req.files) {
      if (req.files.attachment) await deleteFile(req.files.attachment[0].filename);
      if (req.files.replySlipAttachment) await deleteFile(req.files.replySlipAttachment[0].filename);
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
// @route   GET /api/v2/trackers?page=1&limit=10&sortBy=dateReceived&sortOrder=DESC&search=query
// @access  Private (receiving role)
exports.getTrackers = async (req, res) => {
  try {
    // Get pagination parameters from query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 10 : limitParam)); // Max 100 per page, default 10
    const sortBy = req.query.sortBy || 'dateReceived';
    const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();
    const search = req.query.search || '';

    // Validate sortOrder
    if (!['ASC', 'DESC'].includes(sortOrder)) {
      return res.status(400).json({ error: 'Invalid sortOrder. Must be ASC or DESC' });
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where clause for search
    const where = {};
    if (search) {
      const escapedSearch = search.replace(/'/g, "''");
      where[Op.or] = [
        { serialNumber: { [Op.iLike]: `%${search}%` } },
        { fromName: { [Op.iLike]: `%${search}%` } },
        { documentTitle: { [Op.iLike]: `%${search}%` } },
        { lceKeyedInAction: { [Op.iLike]: `%${search}%` } },
        { lceRemarks: { [Op.iLike]: `%${search}%` } },
        // Use a subquery for recipient search to allow Sequelize to use subqueries for pagination
        {
          id: {
            [Op.in]: sequelize.literal(`(
              SELECT tracker_id FROM tracker_recipients tr
              JOIN recipients r ON tr.recipient_id = r.id
              WHERE r.recipient_name ILIKE '%${escapedSearch}%' 
              OR r.initial ILIKE '%${escapedSearch}%'
            )`)
          }
        }
      ];
    }

    // Get total count and paginated results
    // Use distinct: true to count unique trackers, not joined rows
    const { count, rows } = await Tracker.findAndCountAll({
      where,
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const tracker = await Tracker.findByPk(req.params.id);
    if (!tracker) {
      // Clean up uploaded files if tracker not found
      if (req.files) {
        if (req.files.attachment) await deleteFile(req.files.attachment[0].filename);
        if (req.files.replySlipAttachment) await deleteFile(req.files.replySlipAttachment[0].filename);
      }
      return res.status(404).json({
        success: false,
        error: 'Tracker not found'
      });
    }

    const files = req.files || {};
    const attachmentFile = files.attachment ? files.attachment[0] : null;
    const replySlipFile = files.replySlipAttachment ? files.replySlipAttachment[0] : null;

    const { recipientIds, ...trackerData } = req.body;

    // Validate files if provided
    if (attachmentFile) {
      const fileValidation = validateFile(attachmentFile);
      if (!fileValidation.valid) {
        await deleteFile(attachmentFile.filename);
        return res.status(400).json({ success: false, message: `Attachment: ${fileValidation.error}` });
      }
      const oldFileName = tracker.attachment;
      trackerData.attachment = attachmentFile.filename;
      trackerData.attachmentMimeType = attachmentFile.mimetype;
      if (oldFileName) deleteFile(oldFileName);
    }

    if (replySlipFile) {
      const fileValidation = validateFile(replySlipFile);
      if (!fileValidation.valid) {
        await deleteFile(replySlipFile.filename);
        return res.status(400).json({ success: false, message: `Reply Slip: ${fileValidation.error}` });
      }
      const oldFileName = tracker.replySlipAttachment;
      trackerData.replySlipAttachment = replySlipFile.filename;
      trackerData.replySlipAttachmentMimeType = replySlipFile.mimetype;
      if (oldFileName) deleteFile(oldFileName);
    }

    // serialNumber should not be updated after creation, unless specifically allowed by logic
    if (trackerData.serialNumber) {
      delete trackerData.serialNumber;
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

    // Notify current recipients after update
    if (result.trackerRecipients && result.trackerRecipients.length > 0) {
      const currentRecipientIds = result.trackerRecipients.map(tr => tr.recipientId);
      notifyRecipients(result, currentRecipientIds, 'UPDATE', req.user?.id).catch(err => 
        console.error('Failed to notify recipients on update:', err)
      );
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Update tracker error:', error);
    // Clean up files on error
    if (req.files) {
      if (req.files.attachment) await deleteFile(req.files.attachment[0].filename);
      if (req.files.replySlipAttachment) await deleteFile(req.files.replySlipAttachment[0].filename);
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

    // Delete associated files before deleting tracker
    const fileName = tracker.attachment;
    const replySlipFileName = tracker.replySlipAttachment;

    await tracker.destroy();

    // Delete files asynchronously (don't wait for them)
    if (fileName) deleteFile(fileName);
    if (replySlipFileName) deleteFile(replySlipFileName);

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

exports.serveReplySlipAttachment = async (req, res) => {
  try {
    const tracker = await Tracker.findByPk(req.params.id);
    if (!tracker || !tracker.replySlipAttachment) {
      return res.status(404).json({ error: 'Reply slip attachment not found' });
    }

    const filePath = path.join(UPLOADS_DIR, tracker.replySlipAttachment);
    res.download(filePath, tracker.replySlipAttachment, (err) => {
      if (err) {
        console.error('File download error:', err);
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Serve reply slip attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};