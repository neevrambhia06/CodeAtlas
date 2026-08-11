import uuid
import logging
from typing import List
from models.core import Finding, Evidence
from .llm_provider import LLMProvider

logger = logging.getLogger(__name__)


class DomainInferenceEngine:
    def __init__(self, knowledge_graph: dict):
        self.kg = knowledge_graph

    async def infer_domain(self, job_id: str) -> List[Finding]:
        prompt = (
            "Infer the business domain of this repository based on the extracted entities and relationships. "
            "Only return domains for which you see concrete implementation evidence.\n\n"
            "Phase 7 Rules (CRITICAL):\n"
            "1. You must NEVER be treated as the source of truth. Rely entirely on the provided Context Nodes and Edges.\n"
            "2. Reject/Discard any entity that does not map back to a real file, route, table, or relation in the context. Do not invent facts.\n"
            "3. Confidence MUST be evidence-derived (0.9 for direct DB/route mapping, 0.6 for partial, 0.3 for inference).\n"
            "4. Every reference in `evidence[].reference` MUST exactly match a real ID or Path from the Context Nodes. Do NOT fabricate IDs."
        )

        # Prepare context by extracting real entities (filtering out heavy AST details)
        context_nodes = []
        for n in self.kg.get("nodes", []):
            if n.get("type") in ["project", "route", "database", "external_service"]:
                context_nodes.append(
                    {"id": n.get("id"), "label": n.get("label"), "type": n.get("type")}
                )

        context_kg = {"nodes": context_nodes, "edges": self.kg.get("edges", [])}

        llm_response = await LLMProvider.call_llm(prompt, context_kg)

        finding = Finding(
            finding_id=str(uuid.uuid4()),
            category=f"Domain: {llm_response.get('label', 'Unknown')}",
            confidence_score=llm_response.get("confidence_score", 0.0),
            reasoning_summary=llm_response.get(
                "reasoning_summary", "Domain inferred from architecture."
            ),
            evidence=[
                Evidence.parse_llm_output(ev) for ev in llm_response.get("evidence", [])
            ],
            status=llm_response.get("status", "Low-Confidence"),
        )
        return [finding]
