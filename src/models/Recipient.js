// models/Recipient.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {  // ← MUST accept BOTH parameters
  const Recipient = sequelize.define('Recipient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    recipientCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'recipient_code'
    },
    recipientName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'recipient_name'
    },
    initial: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mongo_id: {
      type: DataTypes.STRING(24),
      allowNull: true,
      unique: true,
      field: 'mongo_id'
    }
  }, {
    tableName: 'recipients',
    timestamps: true,
    underscored: true,
    paranoid: true
  });

  Recipient.associate = (models) => {
    Recipient.hasMany(models.User, {
      foreignKey: 'recipientId',
      as: 'users',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Recipient.hasMany(models.TrackerRecipient, {
      foreignKey: 'recipientId',
      as: 'trackerRecipients',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Recipient.belongsToMany(models.Tracker, {
      through: models.TrackerRecipient,
      foreignKey: 'recipientId',
      otherKey: 'trackerId',
      as: 'trackers'
    });
  };

  return Recipient;
};