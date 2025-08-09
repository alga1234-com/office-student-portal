import sqlite3
import bcrypt

conn = sqlite3.connect('users.db')
c = conn.cursor()

username = "superadmin1"
raw_password = "supersecure123"
hashed_password = bcrypt.hashpw(raw_password.encode(), bcrypt.gensalt()).decode()

is_superuser = 1  # mark as superuser

try:
    c.execute('INSERT INTO users (username, password_hash, is_superuser) VALUES (?, ?, ?)',
              (username, hashed_password, is_superuser))
    conn.commit()
    print(f"✅ Superuser '{username}' created.")
except sqlite3.IntegrityError:
    print(f"⚠️ User '{username}' already exists.")

conn.close()
