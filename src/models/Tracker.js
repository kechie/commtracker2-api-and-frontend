module.exports = (sequelize, DataTypes) => {
  const Tracker = sequelize.define('Tracker', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serialNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'serial_number'
    },
    fromName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'from_name'
    },
    documentTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'document_title'
    },
    dateReceived: {
      type: DataTypes.DATE,
      field: 'date_received'
    },
    // stores filename only (e.g. <uuid>.pdf). Public URL is constructed from env `STATIC_BASE_URL` or served path.
    attachment: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'attachment'
    },
    attachmentMimeType: {
      type: DataTypes.STRING,
      field: 'attachment_mime_type'
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_archived'
    },
    isConfidential: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_confidential'
    },
    lceAction: {
      type: DataTypes.ENUM('pending', 'approved', 'disapproved', 'for your comments', 'for review', 'for dissemination', 'for compliance', 'pls facilitate', 'noted', 'check availability of fund', 'others'),
      allowNull: true,
      field: 'lce_action'
    },
    lceKeyedInAction: {
      type: DataTypes.STRING,
      field: 'lce_keyed_in_action'
    },
    lceActionDate: {
      type: DataTypes.DATE,
      field: 'lce_action_date'
    },
    lceRemarks: {
      type: DataTypes.STRING,
      field: 'lce_remarks'
    },
    lceReply: {
      type: DataTypes.ENUM('pending', 'approved', 'disapproved', 'others'),
      allowNull: true,
      field: 'lce_reply'
    },
    lceKeyedInReply: {
      type: DataTypes.STRING,
      field: 'lce_keyed_in_reply'
    },
    lceReplyDate: {
      type: DataTypes.DATE,
      field: 'lce_reply_date'
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'recipient_id',
      references: {
        model: 'recipients',
        key: 'recipient_code'
      },
      onUpdate: 'CASCADE',  // Ensure updates cascade
      onDelete: 'CASCADE' // Ensure deletions cascade
    }
  }, {
    tableName: 'trackers',
    timestamps: true,
    underscored: true,
    paranoid: true
  });

  Tracker.associate = (models) => {
    Tracker.belongsTo(models.Recipient, {
      foreignKey: 'recipientId',
      as: 'recipient'
    });
  };

  return Tracker;
};
