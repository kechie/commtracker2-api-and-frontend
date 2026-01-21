// models/ActivityLog.js
module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.'
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'entity_type',
      comment: 'e.g., Tracker, User, Recipient, etc.'
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'entity_id',
      comment: 'ID of the entity being acted upon'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description of the activity'
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional details about the activity (old values, new values, etc.)'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ip_address',
      comment: 'IP address from which the action was performed'
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'user_agent',
      comment: 'User-Agent header from the request'
    },
    status: {
      type: DataTypes.ENUM('success', 'failure'),
      allowNull: false,
      defaultValue: 'success'
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    paranoid: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return ActivityLog;
};
