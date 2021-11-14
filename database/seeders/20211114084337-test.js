module.exports = {
  up: (queryInterface) => queryInterface.sequelize.transaction((t) => Promise.all([
    queryInterface.bulkInsert(
      'chargers',
      [
        {
          id: 'c1234',
        },
        {
          id: 'c5678',
        },
      ],
      { transaction: t },
    ),
    queryInterface.bulkInsert(
      'widgets',
      [
        {
          id: 'wABCD',
          chargerId: 'c1234',
        },
        {
          id: 'wEFGH',
          chargerId: 'c5678',
        },
      ],
      { transaction: t },
    ),
  ])),

  down: (queryInterface) => queryInterface.sequelize.transaction((t) => Promise.all([
    queryInterface.bulkDelete('chargers', null, { transaction: t }),
    queryInterface.bulkDelete('widgets', null, { transaction: t }),
  ])),
};
