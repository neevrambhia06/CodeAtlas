import asyncio
from reasoning_engine.logic_gap_detection import LogicGapDetector

async def test():
    kg = {
        "nodes": [
            {"id": "route1", "entity": {"type": "route", "name": "POST /login", "path": "routes/auth.py", "evidence": [{"snippet_or_description": "login logic here"}]}},
            {"id": "func1", "entity": {"type": "function", "name": "verify_creds", "path": "auth/service.py", "evidence": [{"snippet_or_description": "db check user"}]}},
        ]
    }
    detector = LogicGapDetector()
    gaps = await detector.detect("test_job", kg, [], [], [])
    for g in gaps:
        print(f"{g.title} [{g.severity}] - {g.confidence}")
        print(f"Checked: {g.checkedLocations}")
        print(f"Rationale: {g.rationale}")

if __name__ == "__main__":
    asyncio.run(test())
