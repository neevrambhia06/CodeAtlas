import uuid
import logging
from typing import List
from models.core import ArchitectureNode, Evidence, ArchitectureRelationship
from .llm_provider import LLMProvider

logger = logging.getLogger(__name__)


class ArchitectureInferenceEngine:
    def __init__(self, knowledge_graph: dict):
        self.kg = knowledge_graph

    async def infer_architecture(self, job_id: str) -> List[ArchitectureNode]:
        prompt = """
        Analyze the repository entities and extract an accurate, evidence-backed Semantic Architecture Map.

        CORE PRINCIPLE:
        Architecture must be inferred from structural evidence. Do not assume generic template structures.

        STEP 1 — DISCOVER ARCHITECTURAL LAYERS
        Identify actual applications, services, modules, packages, databases, external systems, APIs, queues/events, storage, frameworks, and major domains.
        - A frontend-only repository should NOT display Backend, Database, or External API layers unless explicitly proven in the code.
        - A CLI tool should not be forced into a web architecture.
        - Do not force a layer that does not exist.

        STEP 2 — SEMANTIC GROUPING
        Group low-level files into meaningful architectural entities (e.g., 50 booking-related files -> "Booking Domain"), but ONLY when relationships support that grouping.
        The default map should remain high-level and understandable. Prefer representing Domain/Module layers over rendering hundreds of files.

        STEP 3 — RELATIONSHIPS
        Show ONLY meaningful relationships: depends_on, calls, reads_from, writes_to, exposes, imports, publishes, consumes, integrates_with.
        Do NOT connect everything to everything. Only connect nodes where the codebase evidence supports it.

        STEP 4 — EVIDENCE & CONFIDENCE
        Every architectural node MUST have:
        1. Exact source files/paths supporting its existence.
        2. A confidence score based on the available structural evidence.
        If architecture cannot be confidently inferred, explain exactly what was found and why it remains uncertain in the description field.

        Phase 7 Rules (CRITICAL):
        1. You must NEVER be treated as the source of truth. Rely entirely on the provided Context Nodes and Edges.
        2. Every reference in `evidence[].reference` and `children[]` MUST exactly match a real ID or Path from the Context Nodes. Do NOT fabricate IDs.
        """

        # Prepare context by extracting real entities (filtering out heavy AST details)
        context_nodes = []
        for n in self.kg.get("nodes", []):
            entity = n.get("entity", {})
            flat_node = {**n, **entity}
            
            t = flat_node.get("type", "").lower()
            if t in ["project", "route", "database", "external_service", "module", "component", "service", "api", "controller", "model"]:
                context_nodes.append(
                    {
                        "id": flat_node.get("id"),
                        "label": flat_node.get("label", flat_node.get("name")),
                        "type": flat_node.get("type"),
                        "path": flat_node.get("file_path", flat_node.get("path", "")),
                    }
                )

        context_kg = {"nodes": context_nodes, "edges": self.kg.get("edges", [])}

        schema_instructions = """
        {
            "nodes": [
                {
                    "id": "String (Unique ID)",
                    "name": "String (Semantic Name, e.g., 'Booking Domain')",
                    "type": "PROJECT | APPLICATION | FRONTEND | BACKEND | MODULE | PACKAGE | DOMAIN | SERVICE | API | DATABASE | EXTERNAL_SERVICE | QUEUE | EVENT | STORAGE | FRAMEWORK | OTHER",
                    "description": "String (Concise purpose. If low evidence, explain exactly what was detected and why architecture is uncertain.)",
                    "confidence": "HIGH | MEDIUM | LOW",
                    "evidence": [
                        {
                            "source_type": "String",
                            "reference": "String (Must be real file/path)",
                            "snippet_or_description": "String"
                        }
                    ],
                    "children": ["String (IDs of child entities for drill-down)"],
                    "relationships": [
                        {
                            "target_id": "String (ID of the target node)",
                            "type": "depends_on | calls | reads_from | writes_to | exposes | imports | publishes | consumes | integrates_with"
                        }
                    ]
                }
            ]
        }
        """

        try:
            llm_response = await LLMProvider.call_llm(prompt, context_kg, schema_instructions=schema_instructions)
        except Exception as e:
            logger.error(f"Error inferring architecture: {e}")
            return []

        nodes = []
        # LLM might return the array directly or inside a key
        raw_nodes = []
        if isinstance(llm_response, list):
            raw_nodes = llm_response
        elif isinstance(llm_response, dict):
            raw_nodes = llm_response.get("nodes", llm_response.get("architecture", []))

        for rn in raw_nodes:
            evidence_list = []
            for ev in rn.get("evidence", []):
                evidence_list.append(
                    Evidence(
                        evidence_id=str(uuid.uuid4()),
                        source_type=ev.get("source_type", "UNKNOWN"),
                        reference=ev.get("reference", "Unknown"),
                        snippet_or_description=ev.get("snippet_or_description", ""),
                        reasoning_type="LLM_INFERRED",
                    )
                )

            # Map relationships back to dependencies to support backwards compatibility
            # while also preserving the specific relationship models
            relationships = rn.get("relationships", [])
            parsed_relationships = []
            deps = []
            
            for rel in relationships:
                tid = rel.get("target_id")
                rtype = rel.get("type", "depends_on")
                if tid:
                    deps.append(tid)
                    try:
                        parsed_relationships.append(ArchitectureRelationship(target_id=tid, type=rtype))
                    except:
                        pass # Ignore if enum is slightly off

            nodes.append(
                ArchitectureNode(
                    id=rn.get("id", str(uuid.uuid4())),
                    name=rn.get("name", "Unknown Node"),
                    type=rn.get("type", "OTHER"),
                    description=rn.get("description", ""),
                    confidence=rn.get("confidence", "MEDIUM"),
                    evidence=evidence_list,
                    children=rn.get("children", []),
                    dependencies=list(set(deps)),
                    relationships=parsed_relationships
                )
            )

        return nodes
