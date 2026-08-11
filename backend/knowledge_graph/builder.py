import os
import math
import logging
from neo4j import GraphDatabase

logger = logging.getLogger(__name__)


class KnowledgeGraphBuilder:
    def __init__(self, uri=None, user=None, password=None):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD")
        if not self.password:
            logger.warning(
                "NEO4J_PASSWORD is not set. Graph persistence will likely fail if a password is required."
            )
        self.driver = None

    def connect(self):
        try:
            self.driver = GraphDatabase.driver(
                self.uri, auth=(self.user, self.password)
            )
            self.driver.verify_connectivity()
            logger.info("Connected to Neo4j successfully.")
            return True
        except Exception as e:
            logger.warning(f"Failed to connect to Neo4j (mocking for MVP): {e}")
            self.driver = None
            return False

    def close(self):
        if self.driver:
            self.driver.close()

    def build_graph_from_metadata(
        self, job_id: str, repo_id: str, metadata: dict
    ) -> dict:
        is_connected = self.connect()

        # The new parser provides entities and relationships
        entities = metadata.get("entities", [])
        relationships = metadata.get("relationships", [])

        nodes = []
        edges = []

        # Convert entities to graph nodes
        for entity in entities:
            # Layout positions for React Flow will be calculated later
            nodes.append({
                "id": entity["id"],
                "label": entity["name"],
                "type": entity["type"],
                "entity": entity  # Store full entity data for reasoning
            })

        for rel in relationships:
            edges.append({
                "source": rel["source_id"],
                "target": rel["target_id"],
                "type": rel["type"],
                "confidence": rel.get("confidence", 1.0)
            })

        # Framework and language nodes as metadata links
        for fw in metadata.get("frameworks", []):
            f_id = f"FW_{fw}"
            nodes.append({"id": f_id, "label": fw, "type": "framework"})
            edges.append({"source": "project_root", "target": f_id, "type": "USES"})

        for lang in metadata.get("languages", []):
            l_id = f"LANG_{lang}"
            nodes.append({"id": l_id, "label": lang, "type": "language"})
            edges.append({"source": "project_root", "target": l_id, "type": "WRITTEN_IN"})

        # Layout positions for React Flow (circle layout for MVP)
        center_x, center_y = 400, 300
        count = len(nodes)
        
        # Scale radius dynamically to prevent overlapping
        # Assuming ~80px minimum circumference spacing per node
        radius = max(250, (count * 80) / (2 * math.pi))

        for i, node in enumerate(nodes):
            if node["id"] == "project_root":
                node["position"] = {"x": center_x, "y": center_y}
            else:
                angle = (i / max(count, 1)) * 2 * math.pi
                node["position"] = {
                    "x": center_x + radius * math.cos(angle),
                    "y": center_y + radius * math.sin(angle),
                }

        # Store in Neo4j if connected
        if is_connected and self.driver:
            try:
                with self.driver.session() as session:
                    session.run(
                        "MATCH (n:JobData {job_id: $job_id}) DETACH DELETE n",
                        job_id=job_id,
                    )
                    for n in nodes:
                        session.run(
                            """
                        CREATE (n:Node:JobData {id: $id, label: $label, type: $type, job_id: $job_id})
                        """,
                            id=n["id"],
                            label=n["label"],
                            type=n["type"],
                            job_id=job_id,
                        )
                    for e in edges:
                        session.run(
                            """
                        MATCH (a:Node {id: $source, job_id: $job_id})
                        MATCH (b:Node {id: $target, job_id: $job_id})
                        CREATE (a)-[:REL {type: $rel_type}]->(b)
                        """,
                            source=e["source"],
                            target=e["target"],
                            rel_type=e["type"],
                            job_id=job_id,
                        )
            except Exception as e:
                logger.error(f"Failed to persist graph to Neo4j: {e}")
            finally:
                self.close()

        return {"nodes": nodes, "edges": edges}
