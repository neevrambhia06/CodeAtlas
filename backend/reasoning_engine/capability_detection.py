import uuid
import logging
from typing import List, Dict, Any
from models.core import CapabilityFinding, Evidence, Finding

logger = logging.getLogger(__name__)


class CapabilityDetector:
    def __init__(self):
        # We define core architectural capabilities that require strong implementation evidence
        # This acts as our semantic deduplication dictionary as well.
        self.capability_signatures = {
            "Authentication": {
                "aliases": ["auth", "login", "register", "session", "jwt", "oauth", "password", "user authentication", "user auth"],
                "required_types": ["route", "function"]
            },
            "Payments": {
                "aliases": ["stripe", "checkout", "payment", "charge", "invoice", "subscription", "paypal"],
                "required_types": ["external_service", "function"]
            },
            "Database": {
                "aliases": ["db", "schema", "pg", "typeorm", "prisma", "sequelize", "sql", "storage"],
                "required_types": ["database"]
            },
            "Booking": {
                "aliases": ["book", "reservation", "schedule", "calendar", "appointment"],
                "required_types": ["route", "database"]
            }
        }

    async def detect(
        self, job_id: str, kg: dict, domains: List[Finding]
    ) -> List[CapabilityFinding]:
        nodes = kg.get("nodes", [])
        edges = kg.get("edges", [])
        findings = []
        
        # Build an index of node relations to find dependencies
        adj = {}
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            if src not in adj:
                adj[src] = []
            adj[src].append(tgt)

        # Helper to find canonical capability name
        def get_canonical_name(name: str) -> str:
            name_lower = name.lower()
            for cap, sig in self.capability_signatures.items():
                if name_lower == cap.lower() or any(alias in name_lower for alias in sig["aliases"]):
                    return cap
            return name.capitalize()

        # Group all evidence by canonical capability name
        capability_groups: Dict[str, Dict[str, Any]] = {}

        for node in nodes:
            entity = node.get("entity", {})
            if not entity:
                continue

            name = entity.get("name", "").lower()
            path = entity.get("path", "").lower()
            
            # Identify which capabilities this entity belongs to
            matched_caps = set()
            for cap_name, sig in self.capability_signatures.items():
                if any(kw in name or kw in path for kw in sig["aliases"]):
                    matched_caps.add(cap_name)

            # If it's a route, also group by path segment
            if entity.get("type") == "route":
                parts = path.split("/")
                for part in parts:
                    if part not in ["api", "v1", "routes", "src", "app", "pages", ""] and len(part) > 2:
                        matched_caps.add(get_canonical_name(part))
                        break
            
            for cap in matched_caps:
                if cap not in capability_groups:
                    capability_groups[cap] = {
                        "matched_nodes": [],
                        "types_found": set()
                    }
                capability_groups[cap]["matched_nodes"].append(entity)
                capability_groups[cap]["types_found"].add(entity.get("type"))

        # Process grouped evidence into CapabilityFindings
        for cap_name, data in capability_groups.items():
            matched_nodes = data["matched_nodes"]
            types_found = data["types_found"]
            
            evidence_list = []
            related_entities = []
            entry_points = []
            dependencies = []
            
            if not matched_nodes:
                continue

            # Cap at 10 pieces of evidence
            for entity in matched_nodes[:10]:
                evidence_list.append(
                    Evidence(
                        evidence_id=str(uuid.uuid4()),
                        source_type=entity.get("type", "unknown"),
                        reference=entity.get("path", entity.get("name", "")),
                        snippet_or_description=f"Found {entity.get('type')} named '{entity.get('name')}' matching capability '{cap_name}'",
                        reasoning_type="DIRECT"
                    )
                )
                related_entities.append(entity.get("name", ""))
                
                if entity.get("type") == "route":
                    entry_points.append(entity.get("path", ""))
                elif entity.get("type") == "external_service":
                    dependencies.append(entity.get("name", ""))

            # Retrieve signature if it's a core capability
            sig = self.capability_signatures.get(cap_name)
            
            confidence = "LOW"
            status = "INSUFFICIENT_EVIDENCE"
            summary = f"Insufficient evidence for {cap_name}."

            if sig:
                has_all_reqs = all(rt in types_found for rt in sig["required_types"])
                
                if has_all_reqs and len(matched_nodes) >= 3:
                    confidence = "HIGH"
                    status = "CONFIRMED"
                    summary = f"Strong evidence for {cap_name} found across {len(matched_nodes)} entities including required implementations."
                elif len(types_found.intersection(sig["required_types"])) > 0:
                    confidence = "MEDIUM"
                    status = "PARTIALLY_IMPLEMENTED"
                    summary = f"Partial evidence for {cap_name} found. Missing complete implementation flow."
                else:
                    confidence = "LOW"
                    status = "PARTIALLY_IMPLEMENTED"  # if we found something but not the required types
                    summary = f"Weak evidence for {cap_name}. Found naming matches but missing direct implementation components."
            else:
                # Dynamic capability logic
                if len(matched_nodes) >= 3 and "route" in types_found and "function" in types_found:
                    confidence = "HIGH"
                    status = "CONFIRMED"
                    summary = f"Detected robust {cap_name} capability based on {len(matched_nodes)} related files and routes."
                elif len(matched_nodes) >= 1:
                    confidence = "MEDIUM"
                    status = "PARTIALLY_IMPLEMENTED"
                    summary = f"Detected {cap_name} capability based on {len(matched_nodes)} references."

            # Ensure we only return findings with actual evidence
            if not evidence_list:
                status = "INSUFFICIENT_EVIDENCE"
                confidence = "LOW"

            findings.append(
                CapabilityFinding(
                    id=str(uuid.uuid4()),
                    name=cap_name,
                    description=summary,
                    confidence=confidence,
                    evidence=evidence_list,
                    relatedEntities=list(set(related_entities)),
                    entryPoints=list(set(entry_points)),
                    dependencies=list(set(dependencies)),
                    implementationStatus=status
                )
            )

        return findings
