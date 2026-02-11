const { Tracker, TrackerRecipient, Recipient } = require('../../db');

/**
 * @desc    Get routing/tracking slip for a tracker by serial number
 * @route   GET /api/v2/public/:serialNumber/routing-slip
 * @access  Public
 */
exports.getRoutingSlip = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    const tracker = await Tracker.findOne({
      where: { serialNumber },
      include: [
        {
          model: TrackerRecipient,
          as: 'trackerRecipients',
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: ['recipientName', 'recipientCode', 'initial']
            }
          ]
        }
      ],
      order: [
        [{ model: TrackerRecipient, as: 'trackerRecipients' }, 'createdAt', 'ASC']
      ]
    });

    if (!tracker) {
      return res.status(404).json({
        success: false,
        message: 'Tracker not found'
      });
    }

    // Filter sensitive information if needed, but the user requested a routing slip
    // which usually contains basic document info and current status of all recipients.
    
    res.json({
      success: true,
      data: {
        serialNumber: tracker.serialNumber,
        documentTitle: tracker.documentTitle,
        fromName: tracker.fromName,
        dateReceived: tracker.dateReceived,
        lceAction: tracker.lceAction,
        lceKeyedInAction: tracker.lceKeyedInAction,
        lceActionDate: tracker.lceActionDate,
        lceRemarks: tracker.lceRemarks,
        routing: tracker.trackerRecipients.map(tr => ({
          recipient: tr.recipient.recipientName,
          recipientCode: tr.recipient.recipientCode,
          initial: tr.recipient.initial,
          status: tr.status,
          isSeen: tr.isSeen,
          isRead: tr.isRead,
          seenAt: tr.seenAt,
          readAt: tr.readAt,
          acknowledgedAt: tr.acknowledgedAt,
          completedAt: tr.completedAt,
          remarks: tr.remarks,
          dueDate: tr.dueDate
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching public routing slip:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching routing slip',
      error: error.message
    });
  }
};
