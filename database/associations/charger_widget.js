module.exports = (db) => {
  const {
    Charger,
    Widget,
  } = db;

  Charger.Widgets = Charger.hasOne(Widget);

  Widget.Charger = Widget.belongsTo(Charger);
};
