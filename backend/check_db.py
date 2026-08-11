import sqlite3
import json

conn = sqlite3.connect('codeatlas.db')
cursor = conn.cursor()

print("TABLES:")
print(cursor.execute('SELECT name FROM sqlite_master WHERE type="table";').fetchall())

print("\nJOBS:")
try:
    print(cursor.execute('SELECT id, project_name FROM repository_jobs ORDER BY created_at DESC LIMIT 1;').fetchall())
except Exception as e:
    print("Error:", e)
    
print("\nFINDINGS:")
try:
    job_id = cursor.execute('SELECT id FROM repository_jobs ORDER BY created_at DESC LIMIT 1;').fetchone()[0]
    caps = cursor.execute('SELECT id, category FROM findings WHERE job_id=? AND finding_type="Capability"', (job_id,)).fetchall()
    print("CAPS:", caps)
    
    gaps = cursor.execute('SELECT id, category FROM findings WHERE job_id=? AND finding_type="Logic Gap"', (job_id,)).fetchall()
    print("GAPS:", gaps)
except Exception as e:
    print("Error:", e)
