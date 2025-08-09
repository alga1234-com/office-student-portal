const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('office-student-portal.db');
db.run(`
  CREATE TABLE IF NOT EXISTS User_Table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    Username TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    RegNo TEXT,
    StudentNo TEXT,
    UserRole TEXT NOT NULL,
    Contact TEXT
  );
`, (err) => {
  if (err) throw err;
  console.log("✅ Table created (if it didn't exist).");
  db.close();
});