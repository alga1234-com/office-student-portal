import sqlite3
import bcrypt

# Connect to the database
conn = sqlite3.connect('users.db')
c = conn.cursor()

# Get login input
username = input("Enter username: ").strip()
password = input("Enter password: ").strip().encode()

# Lookup the user
c.execute('SELECT password_hash FROM users WHERE username = ?', (username,))
row = c.fetchone()

if row:
    stored_hash = row[0].encode()
    if bcrypt.checkpw(password, stored_hash):
        print("✅ Login successful!")
    else:
        print("❌ Incorrect password.")
else:
    print("❌ User not found.")

conn.close()
