const path = require('path');
require('dotenv').config();

const storagePath = process.env.DB_STORAGE
  ? path.resolve(process.env.DB_STORAGE)
  : path.resolve(__dirname, 'dms.db'); // fallback

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false,
});
