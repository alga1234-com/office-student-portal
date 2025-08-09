const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  name: DataTypes.STRING,
});

module.exports = User;
