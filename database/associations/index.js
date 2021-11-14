const ChargerWidget = require('./charger_widget');
/**
 * This file is called when instantiating the DB
 * Will go through all the db models and create associations
 */

module.exports = {
  setupAssociations: (db) => {
    ChargerWidget(db);
  },
};
