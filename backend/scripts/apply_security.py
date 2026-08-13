import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(url)
cur = conn.cursor()

try:
    with open("../supabase/migrations/00002_harden_security.sql", "r") as f:
        sql = f.read()
    cur.execute(sql)
    conn.commit()
    print("Successfully applied RLS hardening policies.")
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
