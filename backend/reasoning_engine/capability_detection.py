import uuid
import logging
from typing import List, Dict, Any
from models.core import CapabilityFinding, Evidence, Finding
from .llm_provider import LLMProvider

logger = logging.getLogger(__name__)


class CapabilityDetector:
    def __init__(self):
        pass

    async def detect(
        self, job_id: str, kg: dict, domains: List[Finding]
    ) -> List[CapabilityFinding]:
        prompt = (
            "Analyze this Knowledge Graph and identify the core business and technical capabilities of the application.\n"
            "CORE PRINCIPLES:\n"
            "1. CAPABILITY CANDIDATES: Generate capabilities from combinations of UI entry points, routes, controllers, services, functions, database operations, models/schemas, and external integrations.\n"
            "2. DOMAIN ADAPTATION: The capability vocabulary MUST be dynamically generated based on the repository domain (e.g. 'Booking', 'Lexing', 'Billing'). Do not force a universal vocabulary.\n"
            "3. CLUSTER RELATED EVIDENCE: Group related evidence. For example, 'login UI', 'authentication service', and 'user lookup' -> 'Authentication'.\n"
            "4. DUPLICATE CONTROL: Prevent near-duplicate capabilities (e.g. 'Admin', 'Admin Management', 'Admin Portal'). Merge them into one unified capability.\n"
            "5. EVIDENCE-BASED: A capability is a meaningful piece of behavior supported by multiple pieces of evidence. Do NOT guess capabilities based only on a folder name, single keyword, or dependency.\n"
            "6. NEGATIVE EVIDENCE: If a capability is expected from context but no implementation evidence exists, mark status as 'NOT_DETECTED'. Do not fabricate evidence.\n"
            "7. EXPLANATION: The description should explain 'What does this part of the software actually do?', not just 'This project contains files related to X'.\n"
            "8. CONFIDENCE: Provide a clear confidence explanation based on the depth/quality of evidence.\n\n"
            "RULES:\n"
            "- You must NEVER be treated as the source of truth. Rely entirely on the provided Context Nodes.\n"
            "- Reject/Discard any entity that does not map back to a real node ID in the context.\n"
            "- Every evidence node ID MUST exactly match a real ID from the Context Nodes."
        )

        schema_instructions = """
        {
            "capabilities": [
                {
                    "name": "String (e.g. Authentication, Billing, Parsing)",
                    "description": "String (explain what it actually does in the system)",
                    "confidence": "HIGH | MEDIUM | LOW",
                    "confidence_explanation": "String (why you assigned this confidence)",
                    "status": "CONFIRMED | PARTIALLY_IMPLEMENTED | INSUFFICIENT_EVIDENCE | NOT_DETECTED",
                    "evidence_node_ids": ["node_id_1", "node_id_2"]
                }
            ]
        }
        """

        context_nodes = []
        node_map = {}
        for n in kg.get("nodes", []):
            entity = n.get("entity", {})
            if not entity:
                continue

            node_map[n.get("id")] = entity
            if entity.get("type") in [
                "route",
                "database",
                "external_service",
                "function",
                "class",
                "entry_point",
            ]:
                context_nodes.append(
                    {
                        "id": n.get("id"),
                        "name": entity.get("name", "Unknown"),
                        "type": entity.get("type", "Unknown"),
                        "path": entity.get("path", ""),
                    }
                )

        kg_context = {
            "nodes": [
                {
                    "id": n["id"],
                    "label": f"{n['name']} ({n['path']})",
                    "type": n["type"],
                }
                for n in context_nodes
            ],
            "edges": [],
        }

        llm_response = await LLMProvider.call_llm(
            prompt, kg_context, schema_instructions=schema_instructions
        )

        findings = []
        caps = llm_response.get("capabilities", [])

        for cap in caps:
            name = cap.get("name")
            desc = cap.get("description")
            conf = cap.get("confidence", "LOW")
            conf_exp = cap.get("confidence_explanation", "")
            status = cap.get("status", "INSUFFICIENT_EVIDENCE")
            node_ids = cap.get("evidence_node_ids", [])

            if not name:
                continue

            evidence_list = []
            related_entities = set()
            entry_points = set()
            dependencies = set()

            if status != "NOT_DETECTED":
                for nid in node_ids:
                    if nid in node_map:
                        entity = node_map[nid]
                        evidence_list.append(
                            Evidence(
                                evidence_id=str(uuid.uuid4()),
                                source_type=entity.get("type", "unknown"),
                                reference=entity.get("path", entity.get("name", "")),
                                snippet_or_description=f"Evidence for '{name}': {entity.get('type')} '{entity.get('name')}'",
                                reasoning_type="LLM_INFERRED",
                            )
                        )
                        related_entities.add(entity.get("name", ""))

                        if entity.get("type") in ["route", "entry_point"]:
                            entry_points.add(entity.get("path", ""))
                        elif entity.get("type") == "external_service":
                            dependencies.add(entity.get("name", ""))

                if not evidence_list:
                    status = "NOT_DETECTED"
                    conf = "LOW"
                    conf_exp = "No valid evidence found in repository."

            findings.append(
                CapabilityFinding(
                    id=str(uuid.uuid4()),
                    name=name,
                    description=desc,
                    confidence=conf,
                    confidence_explanation=conf_exp,
                    evidence=evidence_list,
                    relatedEntities=list(related_entities),
                    entryPoints=list(entry_points),
                    dependencies=list(dependencies),
                    implementationStatus=status,
                )
            )

        return findings
