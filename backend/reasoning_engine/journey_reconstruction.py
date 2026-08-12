import uuid
import logging
import json
from typing import List, Dict, Any, Set
from models.core import Finding, Evidence, JourneyFinding, JourneyStep
from .llm_provider import LLMProvider

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

        if not nodes:
            return self._empty_findings()

        # Map node ID to entity data for O(1) lookup
        node_map = {}
        for n in nodes:
            # handle flat format or nested format
            if "entity" in n:
                # Merge entity data into flat structure for easy access
                ent = n["entity"]
                flat = {**n, **ent}
                node_map[n["id"]] = flat
            else:
                node_map[n["id"]] = n

        # Adjacency list
        def resolve_node(target_id: str) -> str:
            if target_id in node_map:
                return target_id
            clean_target = (
                target_id.replace("file:", "")
                .split("/")[-1]
                .replace(".js", "")
                .replace(".jsx", "")
                .replace(".ts", "")
                .replace(".tsx", "")
            )
            for node_id, node_data in node_map.items():
                node_type = node_data.get("type", "")
                path = node_data.get("file_path", "") or node_data.get("path", "")
                if node_type.upper() == "FILE":
                    if clean_target and clean_target in path:
                        return node_id
            return None

        adj = {}
        for edge in edges:
            src = edge["source"]
            raw_tgt = edge["target"]
            typ = edge["type"]

            tgt = resolve_node(raw_tgt)
            if tgt:
                if src not in adj:
                    adj[src] = []
                if not any(t == tgt for t, _ in adj[src]):
                    adj[src].append((tgt, typ))

            if typ == "EXPOSES":
                if src not in adj:
                    adj[src] = []
                adj[src].append((raw_tgt, "EXPOSES_ROUTE"))

        # 1. Identify all potential entry points
        entry_points = []
        for nid, ndata in node_map.items():
            n_type = ndata.get("type", "").upper()
            n_path = (ndata.get("file_path", "") or ndata.get("path", "")).lower()
            n_name = ndata.get("name", "").lower()

            is_entry = False
            if n_type in [
                "ROUTE",
                "API",
                "CLI",
                "EVENT_HANDLER",
                "CONSUMER",
                "ENTRY",
                "PAGE",
            ]:
                is_entry = True
            elif n_type in ["FILE", "UI_COMPONENT", "COMPONENT"] and (
                "page" in n_path or "screen" in n_path or "app" in n_path
            ):
                is_entry = True
            elif "route" in n_path or "controller" in n_path or "endpoint" in n_path:
                is_entry = True

            if is_entry:
                entry_points.append(nid)

        # 2. Extract linear paths from entry points via DFS
        paths = []

        def dfs(current_node: str, current_path: List[str], visited: set):
            if len(current_path) > 7:
                paths.append(list(current_path))
                return

            children = adj.get(current_node, [])
            valid_children = [tgt for tgt, typ in children if tgt not in visited]

            if not valid_children:
                if len(current_path) > 1:
                    paths.append(list(current_path))
                return

            for tgt in valid_children:
                visited.add(tgt)
                current_path.append(tgt)
                dfs(tgt, current_path, visited)
                current_path.pop()
                visited.remove(tgt)

        for ep in entry_points:
            dfs(ep, [ep], set([ep]))

        if not paths:
            return self._empty_findings()

        # Deduplicate paths (subpaths of larger paths are fine, but identical paths shouldn't be sent)
        unique_paths = []
        seen_paths = set()
        for p in paths:
            t = tuple(p)
            if t not in seen_paths:
                seen_paths.add(t)
                unique_paths.append(p)

        # To avoid massive token usage, cap unique paths (take longest ones first if needed)
        unique_paths.sort(key=len, reverse=True)
        unique_paths = unique_paths[:100]

        # 3. Format paths for LLM
        path_strings = []
        path_map = {}
        for idx, path_nodes in enumerate(unique_paths):
            path_id = f"p{idx}"
            path_map[path_id] = path_nodes

            parts = []
            for nid in path_nodes:
                ndata = node_map[nid]
                ntype = ndata.get("type", "UNKNOWN")
                nname = ndata.get("name", nid)
                parts.append(f"{ntype}: {nname}")
            path_strings.append(f"Path {path_id}: " + " -> ".join(parts))

        paths_text = "\n".join(path_strings)

        # 4. LLM to group and name semantic journeys
        prompt = (
            "You are an expert software architect analyzing execution paths from a codebase.\n"
            "Group these connected execution paths into semantic business journeys.\n\n"
            "CORE PRINCIPLES:\n"
            "1. NO FABRICATION: Do NOT invent journeys that aren't represented in the paths provided.\n"
            "2. SEMANTIC NAMES: Use meaningful names (e.g., 'User Authentication Journey', 'Checkout Flow', 'Data Import Journey').\n"
            "3. GROUPING: Multiple paths handling similar behavior (e.g., login, logout, password reset) should be grouped under one journey.\n"
            "4. PARTIAL JOURNEYS: If a path doesn't hit a database or external service, mark it as 'PARTIAL_JOURNEY'. Otherwise, 'COMPLETE_JOURNEY'.\n"
            "5. USEFUL DESCRIPTIONS: If a journey is partial, explicitly explain what is missing. Example: 'Journey partially reconstructed — entry point and service were identified, but no downstream database operation was found.'\n\n"
            f"EXECUTION PATHS:\n{paths_text}\n"
        )

        schema_instructions = """
        {
            "journeys": [
                {
                    "name": "String (Semantic name)",
                    "description": "String (Explain the flow, and what is missing if partial)",
                    "status": "COMPLETE_JOURNEY | PARTIAL_JOURNEY",
                    "path_ids": ["p1", "p3"]
                }
            ]
        }
        """

        try:
            llm_response = await LLMProvider.call_llm(
                prompt,
                {"nodes": [], "edges": []},
                schema_instructions=schema_instructions,
            )
            journeys_data = llm_response.get("journeys", [])
        except Exception as e:
            logger.error(f"LLM Journey extraction failed: {e}")
            journeys_data = []

        # Fallback if LLM fails or returns empty
        if not journeys_data:
            # Group by entry point
            for pid, pnodes in path_map.items():
                ep_data = node_map[pnodes[0]]
                journeys_data.append(
                    {
                        "name": f"{ep_data.get('name', 'Unknown')} Journey",
                        "description": "Execution flow traced from entry point.",
                        "status": "PARTIAL_JOURNEY",
                        "path_ids": [pid],
                    }
                )

        # 5. Build JourneyFindings and JourneySteps
        for j_data in journeys_data:
            j_name = j_data.get("name", "Unknown Journey")
            j_desc = j_data.get("description", "Reconstructed execution flow.")
            j_status = j_data.get("status", "PARTIAL_JOURNEY")
            j_path_ids = j_data.get("path_ids", [])

            if not j_path_ids:
                continue

            steps: List[JourneyStep] = []
            # We want to merge the paths into a step-by-step DAG/Tree for the UI
            # We can just iterate through each path and add missing steps.
            # For simplicity, we just add all unique nodes involved across the selected paths,
            # and link them using nextSteps.

            added_nodes = {}  # node_id -> JourneyStep

            for pid in j_path_ids:
                if pid not in path_map:
                    continue
                pnodes = path_map[pid]

                # Create steps for this path
                for i in range(len(pnodes)):
                    nid = pnodes[i]
                    if nid not in added_nodes:
                        ndata = node_map[nid]
                        n_type = ndata.get("type", "UNKNOWN")
                        n_type_upper = n_type.upper()
                        n_name = ndata.get("name", nid)
                        n_path = ndata.get("file_path", "") or ndata.get("path", "")

                        step_type = "ACTION"
                        if n_type_upper in ["ROUTE", "API"]:
                            step_type = "API"
                        elif n_type_upper in ["DATABASE", "DB_TABLE", "MODEL"]:
                            step_type = "DATABASE"
                        elif n_type_upper == "EXTERNAL_SERVICE":
                            step_type = "EXTERNAL_SERVICE"
                        elif n_type_upper == "SERVICE":
                            step_type = "FUNCTION"
                        elif n_type_upper in ["FILE", "UI_COMPONENT", "COMPONENT"]:
                            if "page" in n_path.lower() or "screen" in n_path.lower():
                                step_type = "ENTRY"
                            else:
                                step_type = "UI"
                        elif n_type_upper == "FUNCTION":
                            step_type = "FUNCTION"
                        else:
                            step_type = "ACTION"

                        # Find relationship type from edge
                        rel_type = "CALLS"
                        if i > 0:
                            prev_nid = pnodes[i - 1]
                            for tgt, typ in adj.get(prev_nid, []):
                                if tgt == nid:
                                    rel_type = typ
                                    break

                        evidence_obj = Evidence(
                            evidence_id=str(uuid.uuid4()),
                            source_type=n_type,
                            reference=n_path if n_path else n_name,
                            snippet_or_description=f"Relationship: {rel_type} from previous step",
                            reasoning_type="DIRECT",
                            title=f"{step_type.capitalize()} Node",
                            description=f"Execution reaches {n_type} node.",
                            why_it_matters="Verified execution path.",
                            strength="HIGH",
                        )

                        js = JourneyStep(
                            id=str(uuid.uuid4()),
                            label=n_name if n_name else "Unknown Step",
                            entityId=nid,
                            stepType=step_type,
                            evidence=[evidence_obj],
                            confidence="VERIFIED",
                            nextSteps=[],
                        )
                        added_nodes[nid] = js
                        steps.append(js)

                    # Link next steps
                    if i < len(pnodes) - 1:
                        next_nid = pnodes[i + 1]
                        current_js = added_nodes[nid]
                        # We don't have the next step's JourneyStep ID yet, so we use the entity node_id as a placeholder
                        # and resolve it after all paths are processed.
                        if next_nid not in current_js.nextSteps:
                            current_js.nextSteps.append(next_nid)

            # Resolve nextSteps entity IDs to JourneyStep IDs
            node_id_to_step_id = {nid: step.id for nid, step in added_nodes.items()}
            for step in steps:
                resolved_next_steps = []
                for n_tgt in step.nextSteps:
                    if n_tgt in node_id_to_step_id:
                        resolved_next_steps.append(node_id_to_step_id[n_tgt])
                step.nextSteps = list(set(resolved_next_steps))

            confidence = "HIGH" if j_status == "COMPLETE_JOURNEY" else "MEDIUM"

            findings.append(
                JourneyFinding(
                    id=str(uuid.uuid4()),
                    name=j_name,
                    description=j_desc,
                    confidence=confidence,
                    status=j_status,
                    steps=steps,
                    category=f"Journey: {j_name}",
                )
            )

        if not findings:
            return self._empty_findings()

        return findings

    def _empty_findings(self):
        return [
            JourneyFinding(
                id=str(uuid.uuid4()),
                name="Journey Explorer",
                description="Insufficient evidence to reconstruct full executable journeys from the codebase.",
                confidence="LOW",
                status="INSUFFICIENT_EVIDENCE",
                steps=[],
                category="Journey: None",
            )
        ]
