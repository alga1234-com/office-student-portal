import bcrypt

password = b"mypassword123"
hashed = bcrypt.hashpw(password, bcrypt.gensalt())

print("Hashed password:", hashed.decode('utf-8'))
