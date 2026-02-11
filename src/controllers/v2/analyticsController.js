// src/controllers/v2/analyticsController.js
const {
  User,
  Tracker,
  Recipient,
  TrackerRecipient,
  sequelize,
  Sequelize,
} = require("../../db");
const Op = Sequelize.Op;

// Get comprehensive system statistics
exports.getSystemStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const totalUsers = await User.count();
    const totalTrackers = await Tracker.count();
    const totalRecipients = await Recipient.count();

    // 2. Users by Role
    const usersByRole = await User.findAll({
      attributes: [
        "role",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["role"],
      raw: true,
    });

    // 3. Trackers by Status (aggregated from TrackerRecipient)
    // This gives an idea of how many "movements" are in each state
    const trackersByStatus = await TrackerRecipient.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // 4. Recent Trackers (Last 6 months)
    // Group by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTrackers = await Tracker.findAll({
      attributes: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at")),
          "month",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        createdAt: {
          [Op.gte]: sixMonthsAgo,
        },
      },
      group: [sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at"))],
      order: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at")),
          "ASC",
        ],
      ],
      raw: true,
    });

    // 5. Top Recipients (Most loaded)
    const topRecipients = await TrackerRecipient.findAll({
      attributes: [
        "recipient_id",
        [sequelize.fn("COUNT", sequelize.col("TrackerRecipient.id")), "count"],
      ],
      group: [
        "TrackerRecipient.recipient_id",
        "recipient.id",
        "recipient.recipient_name",
        "recipient.recipient_code",
      ],
      order: [[sequelize.col("count"), "DESC"]],
      limit: 10,
      include: [
        {
          model: Recipient,
          as: "recipient",
          attributes: ["recipientName", "recipientCode"], // Adjust attributes based on model
        },
      ],
    });

    // Format top recipients for easier frontend consumption
    const formattedTopRecipients = topRecipients.map((t) => ({
      name: t.recipient ? t.recipient.recipientName : "Unknown",
      code: t.recipient ? t.recipient.recipientCode : "N/A",
      count: t.get("count"),
    }));

    // 6. Trackers by Action (aggregated from TrackerRecipient)
    const trackersByAction = await TrackerRecipient.findAll({
      attributes: [
        "action",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        action: {
          [Op.not]: null, // Exclude null actions
          [Op.ne]: "", // Exclude empty strings
        },
      },
      group: ["action"],
      order: [[sequelize.col("count"), "DESC"]],
      raw: true,
    });

    // 7. Average Stage Durations (Time Analysis)
    // Calculates the average time (in hours) spent in different stages
    // Notes:
    // - Pending: Time from Creation to Seen
    // - Processing: Time from Seen to Completion
    // - Total: Time from Creation to Completion
    const [durations] = await sequelize.query(`
      SELECT
        ROUND(CAST(AVG(EXTRACT(EPOCH FROM (seen_at - created_at))/3600) AS NUMERIC), 2) as "avgPendingHours",
        ROUND(CAST(AVG(EXTRACT(EPOCH FROM (completed_at - seen_at))/3600) AS NUMERIC), 2) as "avgProcessingHours",
        ROUND(CAST(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) AS NUMERIC), 2) as "avgTotalCompletionHours"
      FROM tracker_recipients
      WHERE deleted_at IS NULL
    `);

    res.json({
      counts: {
        users: totalUsers,
        trackers: totalTrackers,
        recipients: totalRecipients,
      },
      usersByRole,
      trackersByStatus,
      recentTrackers,
      topRecipients: formattedTopRecipients,
      trackersByAction,
      avgStageDurations: durations[0] || {},
    });
  } catch (error) {
    console.error("Get system analytics error:", error);
    res.status(500).json({ error: "Failed to fetch system analytics" });
  }
};

// Get analytics for a specific recipient
exports.getRecipientStats = async (req, res) => {
  try {
    const { recipientId } = req.params;
    console.log("Recipient ID:", recipientId)
    console.log(req.params)
    console.log(req.user.role)
    //console.log(req.user.recipientId)

    // Check if the user is authorized to view these stats
    // Assuming req.user is populated by middleware
    //   req.user.role !== "admin" &&
    //   req.user.role !== "superadmin" &&

    if (!['recipient', 'lcestaff', 'lce'].includes(req.user.role) && req.user.recipientId !== recipientId)
      {
        console.error("Reached access control error");
      return res
        .status(403)
        .json({ error: "Unauthorized to view these statistics" });
      }

    // 1. Counts by Status
    const trackersByStatus = await TrackerRecipient.findAll({
      where: { recipientId },
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // 2. Recent Activity (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentActivity = await TrackerRecipient.findAll({
      where: {
        recipientId,
        createdAt: { [Op.gte]: sixMonthsAgo },
      },
      attributes: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at")),
          "month",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: [sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at"))],
      order: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at")),
          "ASC",
        ],
      ],
      raw: true,
    });

    // 3. Average Response Time (Pending to Completed/Actioned)
    // We can approximate this by (completedAt - createdAt)
    const [avgDurations] = await sequelize.query(
      `
      SELECT
        ROUND(CAST(AVG(EXTRACT(EPOCH FROM (seen_at - created_at))/3600) AS NUMERIC), 2) as "avgTimeToSeen",
        ROUND(CAST(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) AS NUMERIC), 2) as "avgTimeToComplete"
      FROM tracker_recipients
      WHERE recipient_id = :recipientId AND deleted_at IS NULL
    `,
      {
        replacements: { recipientId },
      },
    );

    res.json({
      trackersByStatus,
      recentActivity,
      avgDurations: avgDurations[0] || {},
    });
  } catch (error) {
    console.error("Get recipient analytics error:", error);
    res.status(500).json({ error: "Failed to fetch recipient analytics" });
  }
};


//Test export for /analytics/recipient endpoint
exports.getRecipientStatsTest = async (req, res) => {
  try {
    const { recipientId } = req.params;
    console.log("Recipient ID:", recipientId)
    console.log(req.params)
    console.log(req.user.role)
    console.log(req.user.recipientId)
    if (!['superadmin', 'lcestaff', 'lce'].includes(req.user.role) && req.user.recipientId !== recipientId)
      {
        console.error("Reached access control error");
      return res
        .status(403)
        .json({ error: "Unauthorized to view these statistics" });
      }

    return res.json({
      "result": "Test OK"
    })
  } catch (error){
    console.log(req.user.recipientId, error)
    }
};

