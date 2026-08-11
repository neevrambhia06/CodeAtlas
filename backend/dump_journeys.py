import sqlite3
import json

conn = sqlite3.connect("D:\\Projects\\hackathons\\buildathon\\backend\\test.db")
cursor = conn.cursor()
cursor.execute("SELECT findings FROM analysis_jobs WHERE status='Completed' LIMIT 1")
row = cursor.fetchone()
if row and row[0]:
    findings = json.loads(row[0])
    journeys = findings.get("journeys", [])
    print(json.dumps(journeys[:2], indent=2))
else:
    print("No findings")
