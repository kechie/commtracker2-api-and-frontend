// src/controllers/v2/recipientController.js
const { Recipient } = require('../../db');

// @desc    Get all recipients
// @route   GET /api/v2/recipients
// @access  Private
exports.getRecipients = async (req, res) => {
  try {
    const recipients = await Recipient.findAll({
      order: [['recipientName', 'ASC']],
    });
    res.json(recipients);
  } catch (error) {
    console.error('Get recipients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
