module.exports = (sequelize, DataTypes) => {
  const PushSubscription = sequelize.define('PushSubscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    p256dh: {
      type: DataTypes.STRING,
      allowNull: false
    },
    auth: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'push_subscriptions',
    timestamps: true,
    underscored: true
  });

  PushSubscription.associate = (models) => {
    PushSubscription.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return PushSubscription;
};
