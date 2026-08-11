import uuid
import logging
from typing import List
from models.core import ArchitectureNode, Evidence
from .llm_provider import LLMProvider

logger = logging.getLogger(__name__)


class ArchitectureInferenceEngine:
    def __init__(self, knowledge_graph: dict):
        self.kg = knowledge_graph

    async def infer_architecture(self, job_id: str) -> List[ArchitectureNode]:
        prompt = """
        Analyze the repository entities and extract a high-level, hierarchical, semantic Architecture Map.
        
        DO NOT recreate the giant repository Knowledge Graph showing every file.
        Use semantic architectural entities.
        
        Preferred hierarchy:
        PROJECT
        ↓
        APPLICATION / FRONTEND / BACKEND
        ↓
        MODULE / DOMAIN
        ↓
        SERVICE / API
        ↓
        DATABASE / EXTERNAL SERVICE
        
        The exact entities must be inferred from repository evidence provided in the context.
        Architecture relationships must be evidence-backed.
        
        Phase 7 Rules (CRITICAL):
        1. You must NEVER be treated as the source of truth. Rely entirely on the provided Context Nodes and Edges.
        2. Reject/Discard any entity that does not map back to a real file, route, table, or relation in the context. Do not invent facts.
        3. Confidence MUST be evidence-derived.
           - Direct mapping to a known path/module + explicit edges -> HIGH
           - Partial implementation evidence -> MEDIUM
           - General structural inference without explicit edges -> LOW
        4. Every reference in `evidence[].reference`, `children[]`, and `dependencies[]` MUST exactly match a real ID or Path from the Context Nodes. Do NOT fabricate IDs.
        
        Output Requirements:
        1. Limit to approximately 10–25 semantic nodes maximum.
        2. Provide the nodes as an array of JSON objects.
        3. Each node MUST have:
           - "id": a unique string ID
           - "name": Semantic name (e.g., "Frontend", "Auth Service", "Payments DB")
           - "type": One of ["PROJECT", "APPLICATION", "FRONTEND", "BACKEND", "MODULE", "DOMAIN", "SERVICE", "API", "DATABASE", "EXTERNAL_SERVICE", "OTHER"]
           - "description": A concise description of the node's purpose.
           - "confidence": "HIGH", "MEDIUM", or "LOW"
           - "evidence": An array of evidence objects (with "source_type", "reference", "snippet_or_description")
           - "children": An array of IDs of nodes that this node contains (e.g., FRONTEND might contain MODULE_1).
           - "dependencies": An array of IDs of nodes that this node depends on (e.g., API might depend on DATABASE).
        """

        # Prepare context by extracting real entities (filtering out heavy AST details)
        # We only pass top-level interesting nodes to avoid overloading LLM.
        context_nodes = []
        for n in self.kg.get("nodes", []):
            if n.get("type") in [
                "project",
                "route",
                "database",
                "external_service",
                "module",
                "component",
                "service",
            ]:
                context_nodes.append(
                    {
                        "id": n.get("id"),
                        "label": n.get("label", n.get("name")),
                        "type": n.get("type"),
                        "path": n.get("path", ""),
                    }
                )

        context_kg = {"nodes": context_nodes, "edges": self.kg.get("edges", [])}

        try:
            llm_response = await LLMProvider.call_llm(prompt, context_kg)
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

            nodes.append(
                ArchitectureNode(
                    id=rn.get("id", str(uuid.uuid4())),
                    name=rn.get("name", "Unknown Node"),
                    type=rn.get("type", "OTHER"),
                    description=rn.get("description", ""),
                    confidence=rn.get("confidence", "MEDIUM"),
                    evidence=evidence_list,
                    children=rn.get("children", []),
                    dependencies=rn.get("dependencies", []),
                )
            )

        return nodes
