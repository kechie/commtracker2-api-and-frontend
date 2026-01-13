// models/Recipient.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {  // ← MUST accept BOTH parameters
  const Recipient = sequelize.define('Recipient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    recipientCode: {          // optional business identifier
      type: DataTypes.STRING(50),  // ← or UUID if you really want
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
    Recipient.belongsToMany(models.Tracker, {
      through: 'TrackerRecipients', // Junction table
      foreignKey: 'recipientId',
      as: 'trackers'
    });
  };

  return Recipient;
};