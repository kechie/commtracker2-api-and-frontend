// models/Recipient.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {  // ← MUST accept BOTH parameters
  const Recipient = sequelize.define('Recipient', {
    recipientCode: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      primaryKey: true,
      field: 'recipient_code',
      validate: {
        min: 1
      }
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
    }
  }, {
    tableName: 'recipients',
    timestamps: true,
    underscored: true,
    paranoid: true
  });

  Recipient.associate = (models) => {
    Recipient.hasMany(models.User, {
      foreignKey: 'recipientId',     // Matches the attribute name in User model
      as: 'users',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Recipient.hasMany(models.Tracker, {
      foreignKey: 'recipientId',
      as: 'trackers',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Recipient;
};