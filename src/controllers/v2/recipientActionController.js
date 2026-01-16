// src/controllers/v2/recipientActionController.js
const { RecipientAction, Tracker, Recipient, sequelize } = require('../../db');
const { Op } = require('sequelize');

// @desc    Get all recipient actions for a tracker
// @route   GET /api/v2/trackers/:trackerId/recipient-actions
// @access  Private
exports.getTrackerRecipientActions = async (req, res) => {
  try {
    const { trackerId } = req.params;

    const actions = await RecipientAction.findAll({
      where: { trackerId },
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    console.error('Error fetching recipient actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipient actions',
      error: error.message
    });
  }
};

// @desc    Get recipient action by ID
// @route   GET /api/v2/recipient-actions/:actionId
// @access  Private
exports.getRecipientActionById = async (req, res) => {
  try {
    const { actionId } = req.params;

    const action = await RecipientAction.findByPk(actionId, {
      include: [
        {
          model: Tracker,
          as: 'tracker',
          attributes: ['id', 'serialNumber', 'documentTitle', 'fromName']
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ]
    });

    if (!action) {
      return res.status(404).json({
        success: false,
        message: 'Recipient action not found'
      });
    }

    res.json({
      success: true,
      data: action
    });
  } catch (error) {
    console.error('Error fetching recipient action:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipient action',
      error: error.message
    });
  }
};

// @desc    Create or update recipient action
// @route   POST /api/v2/trackers/:trackerId/recipients/:recipientId/action
// @access  Private
exports.upsertRecipientAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { trackerId, recipientId } = req.params;
    const { status, action, remarks } = req.body;

    // Verify tracker and recipient exist
    const tracker = await Tracker.findByPk(trackerId, { transaction });
    const recipient = await Recipient.findByPk(recipientId, { transaction });

    if (!tracker || !recipient) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tracker or recipient not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (status) {
      updateData.status = status;

      // Set timestamp based on status
      if (status === 'seen') {
        updateData.seenAt = new Date();
      } else if (status === 'read') {
        updateData.readAt = new Date();
        if (!updateData.seenAt) updateData.seenAt = new Date();
      } else if (status === 'acknowledged') {
        updateData.acknowledgedAt = new Date();
      } else if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (action !== undefined) updateData.action = action;
    if (remarks !== undefined) updateData.remarks = remarks;

    // Find or create recipient action
    const [recipientAction, created] = await RecipientAction.findOrCreate({
      where: {
        trackerId,
        recipientId
      },
      defaults: {
        trackerId,
        recipientId,
        status: status || 'pending',
        action: action || null,
        remarks: remarks || null
      },
      transaction
    });

    // If not created, update it
    if (!created) {
      await recipientAction.update(updateData, { transaction });
    }

    await transaction.commit();

    const updatedAction = await RecipientAction.findByPk(recipientAction.id, {
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ]
    });

    res.status(created ? 201 : 200).json({
      success: true,
      data: updatedAction,
      message: created ? 'Recipient action created' : 'Recipient action updated'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error upserting recipient action:', error);
    res.status(500).json({
      success: false,
      message: 'Error upserting recipient action',
      error: error.message
    });
  }
};

// @desc    Update recipient action status
// @route   PATCH /api/v2/recipient-actions/:actionId/status
// @access  Private
exports.updateRecipientActionStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { actionId } = req.params;
    const { status, remarks } = req.body;

    const recipientAction = await RecipientAction.findByPk(actionId, { transaction });

    if (!recipientAction) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Recipient action not found'
      });
    }

    const updateData = { status };

    // Set timestamp based on status
    const now = new Date();
    if (status === 'seen') {
      updateData.seenAt = now;
    } else if (status === 'read') {
      updateData.readAt = now;
      if (!recipientAction.seenAt) {
        updateData.seenAt = now;
      }
    } else if (status === 'acknowledged') {
      updateData.acknowledgedAt = now;
    } else if (status === 'completed') {
      updateData.completedAt = now;
    }

    if (remarks !== undefined) updateData.remarks = remarks;

    await recipientAction.update(updateData, { transaction });
    await transaction.commit();

    const updatedAction = await RecipientAction.findByPk(actionId, {
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedAction,
      message: 'Status updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating recipient action status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating recipient action status',
      error: error.message
    });
  }
};

// @desc    Bulk update recipient actions for a tracker
// @route   POST /api/v2/trackers/:trackerId/recipient-actions/bulk-update
// @access  Private
exports.bulkUpdateRecipientActions = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { trackerId } = req.params;
    const { status, action } = req.body;

    const tracker = await Tracker.findByPk(trackerId, { transaction });
    if (!tracker) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tracker not found'
      });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;

      const now = new Date();
      if (status === 'seen') {
        updateData.seenAt = now;
      } else if (status === 'read') {
        updateData.readAt = now;
      } else if (status === 'acknowledged') {
        updateData.acknowledgedAt = now;
      } else if (status === 'completed') {
        updateData.completedAt = now;
      }
    }
    if (action) updateData.action = action;

    const [updatedCount] = await RecipientAction.update(updateData, {
      where: { trackerId },
      transaction
    });

    await transaction.commit();

    const updatedActions = await RecipientAction.findAll({
      where: { trackerId },
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'recipientName', 'recipientCode', 'initial']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedActions,
      message: `Updated ${updatedCount} recipient actions`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error bulk updating recipient actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating recipient actions',
      error: error.message
    });
  }
};

// @desc    Delete recipient action
// @route   DELETE /api/v2/recipient-actions/:actionId
// @access  Private (Admin only)
exports.deleteRecipientAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { actionId } = req.params;

    const recipientAction = await RecipientAction.findByPk(actionId, { transaction });

    if (!recipientAction) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Recipient action not found'
      });
    }

    await recipientAction.destroy({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: 'Recipient action deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting recipient action:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting recipient action',
      error: error.message
    });
  }
};
