// src/controllers/v2/trackerController.js
const { Tracker, Recipient, TrackerRecipient, sequelize } = require('../../db'); // Import sequelize for transactions
const { Op } = require('sequelize'); // Import Op for operators

// Helper function to generate serial number
const generateSerialNumber = async (transaction) => {
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
    paranoid: true, // Consider soft-deleted records since serial numbers must be unique
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

// @desc    Get all trackers
// @route   GET /api/v2/trackers
// @access  Private (receiving role)
exports.getTrackers = async (req, res) => {
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
    res.json(trackers);
  } catch (error) {
    console.error('Get trackers error:', error);
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