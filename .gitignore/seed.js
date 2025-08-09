// seed.js
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'student_results.db'
});

// Define a sample User model
const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: DataTypes.STRING
});

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Drops and recreates tables

    await User.bulkCreate([
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Smith', email: 'bob@example.com' }
    ]);

    console.log('✅ Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
