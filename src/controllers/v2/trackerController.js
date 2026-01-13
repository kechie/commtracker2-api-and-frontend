// src/controllers/v2/trackerController.js
const { Tracker, Recipient } = require('../../db');

// @desc    Create a tracker
// @route   POST /api/v2/trackers
// @access  Private (receiving role)
exports.createTracker = async (req, res) => {
  try {
    const { recipientIds, ...trackerData } = req.body;

    // Create the tracker
    const tracker = await Tracker.create(trackerData);

    // Set recipients if provided
    if (recipientIds && recipientIds.length > 0) {
      await tracker.setRecipients(recipientIds);
    }

    // Reload the tracker with recipients to return in the response
    const result = await Tracker.findByPk(tracker.id, {
      include: 'recipients',
    });

    res.status(201).json(result);
  } catch (error) {
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
      include: 'recipients', // Eager-load recipients
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
      include: 'recipients',
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

    // Update tracker's own fields
    await tracker.update(trackerData);

    // Update recipients if provided
    if (recipientIds) {
      await tracker.setRecipients(recipientIds);
    }
    
    // Reload the tracker with recipients
    const result = await Tracker.findByPk(tracker.id, {
      include: 'recipients',
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