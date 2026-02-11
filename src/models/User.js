// models/User.js
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('superadmin', 'admin', 'receiving', 'recipient', 'viewer', 'monitor', 'staff', 'lcestaff', 'lce'),
      allowNull: false,
      defaultValue: 'recipient'
    },
    // Updated foreign key to reference Recipient
    recipientId: {
      type: DataTypes.UUID,
      allowNull: true, // e.g., superadmin may not belong to any recipient
      field: 'recipient_id', // Maps to underscored column name in DB
      references: {
        model: 'recipients',      // New table name
        key: 'id'      // References the natural primary key
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 11);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 11);
        }
      }
    }
  });

  // Association with Recipient
  User.associate = (models) => {
    User.belongsTo(models.Recipient, {
      foreignKey: 'recipientId',
      as: 'recipient'  // Access via await user.getRecipient() or include: { model: Recipient, as: 'recipient' }
    });
    User.hasMany(models.PushSubscription, {
      foreignKey: 'userId',
      as: 'pushSubscriptions'
    });
  };

  return User;
};