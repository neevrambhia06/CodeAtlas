import uuid
import logging
import re
from typing import List, Dict, Any, Set
from models.core import Finding, Evidence, JourneyFinding, JourneyStep

logger = logging.getLogger(__name__)

class JourneyReconstructor:
    def __init__(self):
        pass

    async def reconstruct(
        self, job_id: str, kg: dict, capabilities: List[Finding]
    ) -> List[JourneyFinding]:
        nodes = kg.get("nodes", [])
        edges = kg.get("edges", [])
        findings = []

        # Map node ID to entity data for O(1) lookup
        node_map = {n["id"]: n for n in nodes}
        
        # We need a robust target resolution for imports.
        # If a target ID is 'file:../../context/AuthContext', we want to find a node whose path matches.
        def resolve_node(target_id: str) -> str:
            if target_id in node_map:
                return target_id
            
            # Extract just the filename without extension
            clean_target = target_id.replace("file:", "").split("/")[-1].replace(".js", "").replace(".jsx", "")
            
            for node_id, node_data in node_map.items():
                if node_data.get("entity", {}).get("type") == "file":
                    path = node_data.get("entity", {}).get("path", "")
                    if clean_target and clean_target in path:
                        return node_id
            return None

        # Build directed adjacency list: src -> list of (tgt, rel_type)
        adj = {}
        for edge in edges:
            src = edge["source"]
            raw_tgt = edge["target"]
            typ = edge["type"]
            
            tgt = resolve_node(raw_tgt)
            if tgt:
                if src not in adj:
                    adj[src] = []
                # Don't add duplicate targets
                if not any(t == tgt for t, _ in adj[src]):
                    adj[src].append((tgt, typ))
                    
            # Since routes don't have outbound edges, but files EXPOSES routes,
            # Let's add a forward edge from File to Route so we can traverse to the route.
            if typ == "EXPOSES":
                if src not in adj:
                    adj[src] = []
                adj[src].append((raw_tgt, "EXPOSES_ROUTE"))

        # Keep track of journey names we've already created to prevent exact duplicates
        created_journeys = set()

        # For each capability, identify potential entry points
        for cap in capabilities:
            cap_name = cap.name if hasattr(cap, 'name') and cap.name else cap.get("name")
            if not cap_name:
                continue
                
            evidence_list = cap.evidence if hasattr(cap, 'evidence') else cap.get("evidence", [])
            
            # Find evidence items that look like entry points (pages, routes)
            entry_points = []
            for ev in evidence_list:
                ref = ev.reference if hasattr(ev, 'reference') else ev.get("reference", "")
                if not ref:
                    continue
                if "page" in ref.lower() or "route" in ref.lower() or "screen" in ref.lower() or "app" in ref.lower():
                    # Find the corresponding node
                    for nid, ndata in node_map.items():
                        if ref in ndata.get("entity", {}).get("path", ""):
                            entry_points.append(nid)
                            break
                            
            if not entry_points:
                continue
                
            # We will start a journey from the best entry point
            entry_points = list(set(entry_points))
            
            for entry_node in entry_points[:2]:
                steps: List[JourneyStep] = []
                visited = set()
                
                def traverse(node_id: str, depth: int = 0) -> List[str]:
                    if depth > 6:
                        return []
                    if node_id in visited:
                        return []
                    visited.add(node_id)
                    
                    n_data = node_map.get(node_id)
                    if not n_data:
                        return []
                        
                    n_ent = n_data.get("entity", {})
                    n_type = n_ent.get("type", "unknown")
                    n_name = n_ent.get("name", node_id.replace("file:", ""))
                    n_path = n_ent.get("path", "")
                    
                    step_type = "ACTION"
                    if n_type == "route" or n_type == "api":
                        step_type = "API"
                    elif n_type == "function":
                        step_type = "FUNCTION"
                    elif n_type == "database":
                        step_type = "DATABASE"
                    elif n_type == "external_service":
                        step_type = "EXTERNAL_SERVICE"
                    elif n_type == "file":
                        if "page" in n_path.lower() or "screen" in n_path.lower():
                            step_type = "ENTRY"
                        elif "context" in n_path.lower() or "service" in n_path.lower() or "lib" in n_path.lower():
                            step_type = "FUNCTION"
                        else:
                            step_type = "UI"
                            
                    children = adj.get(node_id, [])
                    next_step_ids = []
                    
                    call_targets = [tgt for tgt, typ in children if tgt not in visited]
                    
                    if len(call_targets) > 1:
                        decision_id = str(uuid.uuid4())
                        decision_next_steps = []
                        for tgt in call_targets:
                            decision_next_steps.extend(traverse(tgt, depth + 1))
                            
                        if decision_next_steps:
                            steps.append(JourneyStep(
                                id=decision_id,
                                label=f"Logic branch in {n_name}",
                                entityId=node_id,
                                stepType="DECISION",
                                evidence=[],
                                confidence="INFERRED",
                                nextSteps=decision_next_steps
                            ))
                            next_step_ids = [decision_id]
                    elif len(call_targets) == 1:
                        next_step_ids = traverse(call_targets[0], depth + 1)
                        
                    step_id = str(uuid.uuid4())
                    
                    evidence_obj = Evidence(
                        evidence_id=str(uuid.uuid4()),
                        source_type=n_type,
                        reference=n_path if n_path else n_name,
                        snippet_or_description=f"Execution involves {n_name}",
                        reasoning_type="DIRECT",
                        title=f"{step_type.capitalize()} Layer",
                        description=f"Journey reaches {n_type} node.",
                        why_it_matters="Critical stage in the business flow.",
                        strength="HIGH"
                    )
                    
                    steps.append(JourneyStep(
                        id=step_id,
                        label=n_name if n_name else "Unknown Step",
                        entityId=node_id,
                        stepType=step_type,
                        evidence=[evidence_obj],
                        confidence="VERIFIED",
                        nextSteps=next_step_ids
                    ))
                    
                    return [step_id]

                start_ids = traverse(entry_node)
                
                if len(steps) > 1:
                    has_terminal = any(s.stepType in ["DATABASE", "API", "SERVICE", "EXTERNAL_SERVICE"] for s in steps)
                    status = "COMPLETE_JOURNEY" if has_terminal else "PARTIAL_JOURNEY"
                    confidence = "HIGH" if has_terminal and len(steps) > 2 else "MEDIUM"
                    
                    journey_name = f"{cap_name} Journey"
                    
                    # Prevent duplicates
                    if journey_name not in created_journeys:
                        created_journeys.add(journey_name)
                        
                        findings.append(
                            JourneyFinding(
                                id=str(uuid.uuid4()),
                                name=journey_name,
                                description=f"Reconstructed flow for {cap_name} starting from {entry_node.replace('file:', '')}",
                                confidence=confidence,
                                status=status,
                                steps=steps,
                                category=f"Journey: {cap_name}"
                            )
                        )

        if not findings:
            findings.append(
                JourneyFinding(
                    id=str(uuid.uuid4()),
                    name="Journey Explorer",
                    description="Insufficient evidence to reconstruct full executable journeys from the codebase.",
                    confidence="LOW",
                    status="INSUFFICIENT_EVIDENCE",
                    steps=[],
                    category="Journey: None"
                )
            )

        return findings
