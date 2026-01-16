// src/controllers/v2/trackerController.js
const { Tracker, Recipient, TrackerRecipient, sequelize } = require('../../db'); // Import sequelize for transactions
const { Op, fn, col, literal } = require('sequelize'); // Import Op for operators
const { body, validationResult } = require('express-validator'); // ← add this dependency

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

    res.status(201).json(result);
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error('Create tracker error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      return res.status(404).json({ error: 'Tracker not found' });
    }

    const { recipientIds, ...trackerData } = req.body;

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

    res.json(result);
  } catch (error) {
    console.error('Update tracker error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Delete a tracker
// @route   DELETE /api/v2/trackers/:id
// @access  Private (receiving role)
exports.deleteTracker = async (req, res) => {
  try {
    const tracker = await Tracker.findByPk(req.params.id);
    if (!tracker) {
      return res.status(404).json({ error: 'Tracker not found' });
    }

    await tracker.destroy();
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Delete tracker error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};