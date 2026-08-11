import asyncio
from reasoning_engine.architecture_inference import ArchitectureInferenceEngine


async def test():
    kg = {
        "nodes": [
            {"id": "auth1", "type": "module", "name": "Auth Module"},
            {"id": "db1", "type": "database", "name": "Postgres DB"},
        ],
        "edges": [{"source": "auth1", "target": "db1", "type": "DEPENDS_ON"}],
    }
    detector = ArchitectureInferenceEngine(kg)
    nodes = await detector.infer_architecture("test_job")
    for g in nodes:
        print(f"{g.name} [{g.type}] - {g.confidence}")
        print(f"Children: {g.children}")
        print(f"Dependencies: {g.dependencies}")


if __name__ == "__main__":
    asyncio.run(test())
