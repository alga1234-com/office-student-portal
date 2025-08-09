import sequelize from '../config/database.js';
import User from './user.js';

const initDb = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database synced');
  } catch (error) {
    console.error('❌ DB connection error:', error);
  }
};

export { sequelize, User, initDb };
