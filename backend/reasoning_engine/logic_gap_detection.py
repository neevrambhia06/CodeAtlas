import uuid
import logging
from typing import List, Dict, Any
from models.core import Finding, Evidence, GapFinding
from .llm_provider import LLMProvider

logger = logging.getLogger(__name__)


class LogicGapDetector:
    def __init__(self):
        pass

    async def detect(
        self,
        job_id: str,
        kg: dict,
        domains: List[Finding],
        capabilities: List[Finding],
        journeys: List[Finding],
    ) -> List[GapFinding]:
        logger.info(f"LogicGapDetector running for job {job_id}")

        prompt = (
            "Analyze the following repository Knowledge Graph to detect architectural, security, or data flow Logic Gaps.\n\n"
            "CORE PRINCIPLES (CRITICAL):\n"
            "1. REPOSITORY-SPECIFIC: Every gap must have its own unique reasoning chain and evidence based strictly on the provided context nodes. DO NOT fabricate generic security findings.\n"
            "2. NEVER USE GENERIC EVIDENCE: Avoid generic evidence like 'package.json'. You MUST point to specific files, functions, routes, or configurations.\n"
            "3. UNIQUE REASONING: Two different gaps must not have identical reasoning, evidence, or affected components.\n"
            "4. FALSE POSITIVE CONTROL: Before claiming a High/Critical severity, consider if there's middleware, framework defaults, decorators, or shared utilities that might handle it.\n"
            "5. DISTINGUISH ABSENCE FROM UNKNOWN: Use 'CONFIRMED ABSENCE' if relevant locations were checked and lacking, vs 'UNVERIFIED' if parser coverage prevents reliable conclusion.\n"
            "6. DON'T HALLUCINATE: If the repository doesn't have a database or routes, don't invent gaps about them.\n\n"
            "For every candidate gap, you must explain:\n"
            "- WHAT WAS EXPECTED\n"
            "- WHAT WAS CHECKED\n"
            "- WHAT WAS FOUND\n"
            "- WHY IT MATTERS\n\n"
            "And you must provide Evidence Traces detailing: Evidence Type, File, Symbol, Relationship, and Why it supports the finding."
        )

        schema_instructions = """
        {
            "gaps": [
                {
                    "title": "String (e.g., Missing Resource Ownership Check)",
                    "category": "SECURITY | ARCHITECTURE | DATA | API | ERROR_HANDLING | VALIDATION | AUTHORIZATION",
                    "severity": "CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL",
                    "what_was_expected": "String",
                    "what_was_checked": ["List of strings representing exact routes/files checked"],
                    "what_was_found": "String (e.g., '6 update endpoints were found without ownership validation...')",
                    "why_it_matters": "String",
                    "confidence_status": "CONFIRMED ABSENCE | UNVERIFIED",
                    "confidence_score": "HIGH | MEDIUM | LOW",
                    "recommendation": "String (How to fix)",
                    "affected_components": ["Exact file path or route name 1", "Exact file path 2"],
                    "evidence_traces": [
                        {
                            "type": "MISSING_IMPLEMENTATION | CALL_CHAIN | ROUTE_ANALYSIS | CONTROL_FLOW | DIRECT_REFERENCE",
                            "file": "String (e.g., 'server/routes/bookings.ts')",
                            "symbol": "String (e.g., 'updateBooking')",
                            "relationship": "String (e.g., 'Handler for PUT /bookings')",
                            "why_it_supports": "String (e.g., 'Route allows modification without ownership verification.')"
                        }
                    ]
                }
            ]
        }
        """

        context_nodes = []
        node_map = {}
        for n in kg.get("nodes", []):
            # Accommodate both flat schema and nested entity schema
            entity = n.get("entity", {})
            flat_node = {**n, **entity}
            
            node_map[flat_node.get("id")] = flat_node
            
            n_type = flat_node.get("type", "Unknown").lower()
            if n_type in ["route", "middleware", "api", "function", "external_service", "database", "controller", "model"]:
                snippet = flat_node.get("content", "") or ""
                for ev in flat_node.get("evidence", []):
                    if hasattr(ev, "snippet_or_description"):
                        snippet += ev.snippet_or_description + " "
                    elif isinstance(ev, dict):
                        snippet += ev.get("snippet_or_description", "") + " "
                        
                context_nodes.append({
                    "id": flat_node.get("id"),
                    "name": flat_node.get("name", "Unknown"),
                    "type": flat_node.get("type", "Unknown"),
                    "path": flat_node.get("file_path", flat_node.get("path", "")),
                    "snippet": snippet[:200].strip() # keep short for token limit
                })
                
        kg_context = {
            "nodes": [
                {"id": n["id"], "label": f"{n['name']} ({n['path']})", "type": n["type"], "context": n["snippet"]}
                for n in context_nodes
            ],
            "edges": kg.get("edges", []) # Include edges so LLM sees relationships
        }

        try:
            llm_response = await LLMProvider.call_llm(prompt, kg_context, schema_instructions=schema_instructions)
            gaps = llm_response.get("gaps", [])
        except Exception as e:
            logger.error(f"Logic Gap LLM generation failed: {e}")
            gaps = []

        findings = []
        for gap in gaps:
            title = gap.get("title")
            if not title:
                continue
                
            # Compile reasoning format
            expected = gap.get("what_was_expected", "")
            checked = ", ".join(gap.get("what_was_checked", []))
            found = gap.get("what_was_found", "")
            matters = gap.get("why_it_matters", "")
            conf_stat = gap.get("confidence_status", "UNVERIFIED")
            
            reasoning = (
                f"WHAT WAS EXPECTED:\n{expected}\n\n"
                f"WHAT WAS CHECKED:\n{checked}\n\n"
                f"WHAT WAS FOUND:\n{found}\n\n"
                f"WHY IT MATTERS:\n{matters}\n\n"
                f"CONFIDENCE:\n{conf_stat}"
            )
            
            traces = []
            for ev_trace in gap.get("evidence_traces", []):
                traces.append(
                    Evidence(
                        evidence_id=str(uuid.uuid4()),
                        source_type=ev_trace.get("type", "ABSENCE_CHECK"),
                        reference=ev_trace.get("file", "Unknown File"),
                        symbol=ev_trace.get("symbol", ""),
                        description=ev_trace.get("relationship", ""),
                        why_it_matters=ev_trace.get("why_it_supports", ""),
                        snippet_or_description=ev_trace.get("why_it_supports", ""),
                        title=f"{ev_trace.get('type', 'EVIDENCE')} in {ev_trace.get('file', '')}",
                        strength="HIGH",
                        reasoning_type="LLM_INFERRED"
                    )
                )

            # Enforce severity allowed values
            sev = gap.get("severity", "MEDIUM")
            if sev == "INFORMATIONAL":
                sev = "LOW" # Pydantic schema only allows CRITICAL, HIGH, MEDIUM, LOW

            affected = gap.get("affected_components", [])
            if not affected:
                affected = ["application-core"]
                
            findings.append(
                GapFinding(
                    id=str(uuid.uuid4()),
                    title=title,
                    severity=sev,
                    category=gap.get("category", "ARCHITECTURE"),
                    description=found, # Use found for top level description
                    evidenceTraces=traces,
                    checkedAreas=gap.get("what_was_checked", []),
                    affectedComponents=affected,
                    confidence=gap.get("confidence_score", "LOW"),
                    impact=matters,
                    recommendation=gap.get("recommendation", ""),
                    reasoning=reasoning
                )
            )

        return findings
