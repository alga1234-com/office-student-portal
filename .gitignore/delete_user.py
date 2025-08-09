import sqlite3

conn = sqlite3.connect('users.db')
c = conn.cursor()

username = "admin"
c.execute('DELETE FROM users WHERE username = ?', (username,))
conn.commit()

print(f"🗑️ Deleted user '{username}'.")

conn.close()
