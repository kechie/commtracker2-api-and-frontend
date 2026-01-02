const db = require('../../db');
const { Tracker, Recipient } = db;

exports.createTracker = async (req, res) => {
  try {
    const payload = req.body || {};

    if (req.file) {
      // store filename only; clients access via STATIC_BASE_URL or nginx
      payload.attachment = req.file.filename;
      payload.attachmentMimeType = req.file.mimetype;
    }

    const tracker = await Tracker.create(payload);

    // attach public URL in response if STATIC_BASE_URL is configured
    const staticBase = process.env.STATIC_BASE_URL || null;
    const trackerJson = tracker.toJSON();
    if (trackerJson.attachment) {
      trackerJson.attachmentUrl = staticBase ? `${staticBase}/${trackerJson.attachment}` : null;
    }

    res.status(201).json({ message: 'Tracker created', tracker: trackerJson });
  } catch (error) {
    console.error('createTracker error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listTrackers = async (req, res) => {
  try {
    const trackers = await Tracker.findAll({ include: [{ model: Recipient, as: 'recipient' }] });
    res.json({ message: 'Trackers list', trackers });
  } catch (error) {
    console.error('listTrackers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTracker = async (req, res) => {
  try {
    const { id } = req.params;
    const tracker = await Tracker.findByPk(id, { include: [{ model: Recipient, as: 'recipient' }] });
    if (!tracker) return res.status(404).json({ error: 'Tracker not found' });
    res.json({ message: 'Tracker retrieved', tracker });
  } catch (error) {
    console.error('getTracker error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTracker = async (req, res) => {
  try {
    const { id } = req.params;
    const tracker = await Tracker.findByPk(id);
    if (!tracker) return res.status(404).json({ error: 'Tracker not found' });

    const payload = req.body || {};
    if (req.file) {
      payload.attachment = req.file.filename;
      payload.attachmentMimeType = req.file.mimetype;
    }

    await tracker.update(payload);
    const trackerJson = tracker.toJSON();
    const staticBase = process.env.STATIC_BASE_URL || null;
    if (trackerJson.attachment) {
      trackerJson.attachmentUrl = staticBase ? `${staticBase}/${trackerJson.attachment}` : null;
    }

    res.json({ message: 'Tracker updated', tracker: trackerJson });
  } catch (error) {
    console.error('updateTracker error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTracker = async (req, res) => {
  try {
    const { id } = req.params;
    const tracker = await Tracker.findByPk(id);
    if (!tracker) return res.status(404).json({ error: 'Tracker not found' });

    await tracker.destroy();
    res.json({ message: 'Tracker deleted' });
  } catch (error) {
    console.error('deleteTracker error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
