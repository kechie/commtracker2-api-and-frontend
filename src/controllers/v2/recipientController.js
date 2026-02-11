// src/controllers/v2/recipientController.js
const { Recipient } = require('../../db');
const { Op, where } = require('sequelize');
const { logRecipientActivity } = require('../../utils/activityLogger');

// @desc    Get recipients with pagination
// @route   GET /api/v2/recipients
// @access  Private
exports.getRecipients = async (req, res) => {
  try {
    // Get pagination and search parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return res.status(400).json({ error: 'Page and limit must be positive integers' });
    }

    const whereClause = {
      recipientCode: {
        [Op.lte]: 1000
      }
    };

    if (search) {
      whereClause[Op.or] = [
        { recipientName: { [Op.iLike]: `%${search}%` } },
        { initial: { [Op.iLike]: `%${search}%` } }
      ];
      
      // If search is a number, also search by recipientCode
      if (!isNaN(search)) {
        whereClause[Op.or].push({ recipientCode: parseInt(search) });
      }
    }

    // Fetch recipients with pagination
    const { count, rows } = await Recipient.findAndCountAll({
      where: whereClause,
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
    const { recipientCode, recipientName, initial } = req.body;
    const recipient = await Recipient.create({
      recipientCode,
      recipientName,
      initial,
    });

    // Log recipient creation
    await logRecipientActivity({
      userId: req.user?.id,
      action: 'CREATE',
      entityId: recipient.id,
      description: `Created recipient: ${recipientName}`,
      details: { recipientCode, initial },
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
    const { recipientCode, recipientName, initial } = req.body;
    const recipient = await Recipient.findByPk(id);
    if (recipient) {
      const oldValues = {
        recipientCode: recipient.recipientCode,
        recipientName: recipient.recipientName,
        initial: recipient.initial
      };

      recipient.recipientCode = recipientCode;
      recipient.recipientName = recipientName;
      recipient.initial = initial;
      await recipient.save();

      // Log recipient update
      await logRecipientActivity({
        userId: req.user?.id,
        action: 'UPDATE',
        entityId: recipient.id,
        description: `Updated recipient: ${recipientName}`,
        details: {
          old: oldValues,
          new: { recipientCode, recipientName, initial }
        },
        ipAddress: req.clientIp,
        userAgent: req.clientUserAgent,
        status: 'success'
      });

      res.json(recipient);
    } else {
      res.status(404).json({ error: 'Recipient not found' });
    }
  } catch (error) {
    console.error('Update recipient error:', error);

    await logRecipientActivity({
      userId: req.user?.id,
      action: 'UPDATE',
      entityId: req.params.id,
      description: `Failed to update recipient: ${error.message}`,
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'failure'
    });

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
      const recipientName = recipient.recipientName;
      await recipient.destroy();

      // Log recipient deletion
      await logRecipientActivity({
        userId: req.user?.id,
        action: 'DELETE',
        entityId: id,
        description: `Deleted recipient: ${recipientName}`,
        ipAddress: req.clientIp,
        userAgent: req.clientUserAgent,
        status: 'success'
      });

      res.json({ message: 'Recipient removed' });
    } else {
      res.status(404).json({ error: 'Recipient not found' });
    }
  } catch (error) {
    console.error('Delete recipient error:', error);

    await logRecipientActivity({
      userId: req.user?.id,
      action: 'DELETE',
      entityId: req.params.id,
      description: `Failed to delete recipient: ${error.message}`,
      ipAddress: req.clientIp,
      userAgent: req.clientUserAgent,
      status: 'failure'
    });

    res.status(500).json({ error: 'Internal server error' });
  }
};
