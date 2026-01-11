import sqlite3
try:
    conn = sqlite3.connect('couple.db')
    c = conn.cursor()
    c.execute("PRAGMA table_info(users)")
    columns = c.fetchall()
    print("Columns in 'users' table:")
    for col in columns:
        print(col)
    conn.close()
except Exception as e:
    print(e)
