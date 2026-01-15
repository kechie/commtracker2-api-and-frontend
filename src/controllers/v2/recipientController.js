// src/controllers/v2/recipientController.js
const { Recipient } = require('../../db');

// @desc    Get all recipients
// @route   GET /api/v2/recipients
// @access  Private
exports.getRecipients = async (req, res) => {
  try {
    const recipients = await Recipient.findAll({
      order: [['recipient_name', 'ASC']],
    });
    res.json({ recipients });
  } catch (error) {
    console.error('Get recipients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Create a recipient
// @route   POST /api/v2/recipients
// @access  Private
exports.createRecipient = async (req, res) => {
  try {
    const { name, address, contactPerson, contactEmail, contactPhone } = req.body;
    const recipient = await Recipient.create({
      name,
      address,
      contactPerson,
      contactEmail,
      contactPhone,
    });
    res.status(201).json(recipient);
  } catch (error) {
    console.error('Create recipient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Update a recipient
// @route   PUT /api/v2/recipients/:id
// @access  Private
exports.updateRecipient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contactPerson, contactEmail, contactPhone } = req.body;
    const recipient = await Recipient.findByPk(id);
    if (recipient) {
      recipient.name = name;
      recipient.address = address;
      recipient.contactPerson = contactPerson;
      recipient.contactEmail = contactEmail;
      recipient.contactPhone = contactPhone;
      await recipient.save();
      res.json(recipient);
    } else {
      res.status(404).json({ error: 'Recipient not found' });
    }
  } catch (error) {
    console.error('Update recipient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Delete a recipient
// @route   DELETE /api/v2/recipients/:id
// @access  Private
exports.deleteRecipient = async (req, res) => {
  try {
    const { id } = req.params;
    const recipient = await Recipient.findByPk(id);
    if (recipient) {
      await recipient.destroy();
      res.json({ message: 'Recipient removed' });
    } else {
      res.status(404).json({ error: 'Recipient not found' });
    }
  } catch (error) {
    console.error('Delete recipient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
