import sqlite3
import bcrypt

# Connect or create the SQLite database
conn = sqlite3.connect('users.db')
c = conn.cursor()

# Create users table (run once)
c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
''')

# User details
username = "admini"
raw_password = "admin123"
hashed_password = bcrypt.hashpw(raw_password.encode(), bcrypt.gensalt()).decode()

# Insert user
try:
    c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, hashed_password))
    conn.commit()
    print(f"✅ User '{username}' created successfully.")
except sqlite3.IntegrityError:
    print(f"⚠️ User '{username}' already exists.")

conn.close()
