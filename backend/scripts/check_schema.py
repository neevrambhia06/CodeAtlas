import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(url)
cur = conn.cursor()

try:
    cur.execute(
        "ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'email';"
    )
    conn.commit()
    print("Successfully added auth_provider to users table.")
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()

cur.execute(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'"
)
print("Public Users Columns:", cur.fetchall())
