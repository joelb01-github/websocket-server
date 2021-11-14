const M = require('moment');

module.exports = (sequelize, DataTypes) => {
  const Charger = sequelize.define('charger', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      get() {
        return M(this.getDataValue('createdAt'), 'DD/MM/YYYY h:mm:ss').unix();
      },
    },
    updatedAt: {
      type: DataTypes.DATE,
      get() {
        return M(this.getDataValue('updatedAt'), 'DD/MM/YYYY h:mm:ss').unix();
      },
    },
  }, {
    tableName: 'chargers',
  });

  return Charger;
};
