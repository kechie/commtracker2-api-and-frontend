module.exports = (sequelize, DataTypes) => {
  const RecipientAction = sequelize.define('RecipientAction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trackerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tracker_id'
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'recipient_id'
    },
    status: {
      type: DataTypes.ENUM('pending', 'seen', 'read', 'acknowledged', 'action_required', 'completed'),
      defaultValue: 'pending',
      allowNull: false,
      field: 'status'
    },
    seenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'seen_at'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'acknowledged_at'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'action'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'remarks'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    }
  }, {
    tableName: 'recipient_actions',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        fields: ['tracker_id', 'recipient_id'],
        unique: true,
        name: 'unique_tracker_recipient_action'
      },
      {
        fields: ['tracker_id']
      },
      {
        fields: ['recipient_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  RecipientAction.associate = (models) => {
    RecipientAction.belongsTo(models.Tracker, {
      foreignKey: 'trackerId',
      as: 'tracker',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    RecipientAction.belongsTo(models.Recipient, {
      foreignKey: 'recipientId',
      as: 'recipient',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return RecipientAction;
};
