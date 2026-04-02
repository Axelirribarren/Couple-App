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
        cursor.execute("""
            CREATE TABLE daily_journal (
                id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                date_str VARCHAR NOT NULL,
                answer TEXT NOT NULL,
                created_at DATETIME,
                PRIMARY KEY (id),
                FOREIGN KEY(user_id) REFERENCES users (id)
            );
        """)
        cursor.execute("CREATE INDEX ix_daily_journal_date_str ON daily_journal (date_str);")
        cursor.execute("CREATE INDEX ix_daily_journal_id ON daily_journal (id);")
        print("Created daily_journal table")
    except sqlite3.OperationalError as e:
        print(f"Table might already exist: {e}")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
