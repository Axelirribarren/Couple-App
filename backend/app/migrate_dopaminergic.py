import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "couple.db")

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. It might be newly created.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0;")
        print("Added streak_count to users")
    except sqlite3.OperationalError as e:
        print(f"streak_count check: {e}")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_active DATETIME;")
        print("Added last_active to users")
    except sqlite3.OperationalError as e:
        print(f"last_active check: {e}")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN sync_token VARCHAR;")
        print("Added sync_token to users")
    except sqlite3.OperationalError as e:
        print(f"sync_token check: {e}")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
