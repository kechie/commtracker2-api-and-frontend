// src/controllers/v2/recipientController.js
const { Recipient } = require('../../db');
const { Op, where } = require('sequelize');
const { logRecipientActivity } = require('../../utils/activityLogger');

// @desc    Get recipients with pagination
// @route   GET /api/v2/recipients
// @access  Private
exports.getRecipients = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return res.status(400).json({ error: 'Page and limit must be positive integers' });
    }

    // Fetch recipients with pagination, excluding codes greater than 1000
    const { count, rows } = await Recipient.findAndCountAll({
      where: {
        recipientCode: {
          [Op.lte]: 1000
        }
      },
      limit,
      offset,
      order: [['recipientCode', 'ASC']],
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'v2 Recipients retrieved',
      recipients: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      },
      version: 'v2'
    });
  } catch (error) {
    console.error('Get recipients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Use with caution - returns all recipients without pagination
// @desc    Get all recipients
// @route   GET /api/v2/recipients/all
// @access  Private
exports.getAllRecipients = async (req, res) => {
  try {
    const recipients = await Recipient.findAll({
      where: {
        recipientCode: {
          [Op.lte]: 1000
        }
      },
      order: [['recipientCode', 'ASC']],
    });
    res.json({ recipients });
  } catch (error) {
    console.error('Get all recipients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// @desc    Create a recipient
// @route   POST /api/v2/recipients
// @access  Private
exports.createRecipient = async (req, res) => {
  try {
    const { recipient_name, address, contactPerson, contactEmail, contactPhone } = req.body;
    const recipient = await Recipient.create({
      recipient_name,
      address,
      contactPerson,
      contactEmail,
      contactPhone,
    });

    // Log recipient creation
    await logRecipientActivity({
      userId: req.user?.id,
      action: 'CREATE',
      entityId: recipient.id,
      description: `Created recipient: ${recipient_name}`,
      details: { contactPerson, contactEmail, contactPhone },
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'success'
    });

    res.status(201).json(recipient);
  } catch (error) {
    console.error('Create recipient error:', error);
    
    await logRecipientActivity({
      userId: req.user?.id,
      action: 'CREATE',
      description: `Failed to create recipient: ${error.message}`,
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'failure'
    });

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
