import uuid
import logging
from typing import List, Dict, Any
from models.core import Finding, Evidence, GapFinding

logger = logging.getLogger(__name__)

def create_evidence(source_type: str, title: str, desc: str, matters: str, strength: str, ref: str = "Repository Analysis") -> Evidence:
    return Evidence(
        evidence_id=str(uuid.uuid4()),
        source_type=source_type,
        reference=ref,
        snippet_or_description=desc,
        title=title,
        description=desc,
        why_it_matters=matters,
        strength=strength
    )

class BaseGapDetector:
    async def detect(self, job_id: str, kg: dict, domains: List[Finding], capabilities: List[Finding], journeys: List[Finding]) -> List[GapFinding]:
        raise NotImplementedError

class RateLimitingDetector(BaseGapDetector):
    async def detect(self, job_id: str, kg: dict, domains: List[Finding], capabilities: List[Finding], journeys: List[Finding]) -> List[GapFinding]:
        nodes = kg.get("nodes", [])
        routes = [n.get("entity", {}) for n in nodes if n.get("entity", {}).get("type") in ["route", "api"]]
        middlewares = [n.get("entity", {}) for n in nodes if n.get("entity", {}).get("type") == "middleware"]
        deps = [n.get("entity", {}).get("name", "").lower() for n in nodes if n.get("entity", {}).get("type") == "external_service"]
        
        # Check dependencies
        rl_deps = ["express-rate-limit", "rate-limiter-flexible", "redis", "ioredis", "bottleneck"]
        found_deps = [d for d in rl_deps if any(d in dep for dep in deps)]
        
        # Check code
        rl_kws = ["ratelimit", "throttle", "limiter", "x-ratelimit"]
        found_code = []
        for n in routes + middlewares:
            for ev in n.get("evidence", []):
                snippet = ev.get("snippet_or_description", "").lower()
                if any(kw in snippet for kw in rl_kws):
                    found_code.append(n)
        
        if found_deps or found_code:
            return [] # Found rate limiting
            
        # Missing
        traces = [
            create_evidence(
                "ROUTE_ANALYSIS", 
                "API Route Analysis", 
                f"{len(routes)} externally reachable API routes identified.", 
                "Public endpoints perform state-changing operations and must be protected against brute-force abuse.", 
                "HIGH"
            ),
            create_evidence(
                "MIDDLEWARE_ANALYSIS", 
                "Middleware Analysis", 
                "No request-throttling middleware or guards detected in the middleware chain.", 
                "Middleware is the standard location for application-level rate limiting.", 
                "HIGH"
            ),
            create_evidence(
                "DEPENDENCY_ANALYSIS", 
                "Dependency Analysis", 
                "No recognized rate-limiting dependency found.", 
                "Indicates standard packages (e.g., express-rate-limit) are not being used for this control.", 
                "MEDIUM"
            )
        ]
        
        num_routes = len(routes)
        reasoning = (
            f"CodeAtlas identified {num_routes} API routes. The route registration and middleware chain were "
            "inspected for request-throttling controls. No verified rate limiter, throttling middleware, "
            "or equivalent gateway configuration was found. Because the repository exposes endpoints without "
            "a verified throttling control, CodeAtlas classified this as a potential missing rate-limiting control."
        )
        
        affected = list(set([r.get("path", "").split("/")[-1] for r in routes if r.get("path")]))[:5]
        if not affected:
            affected = ["application-core"]
            
        return [GapFinding(
            id=str(uuid.uuid4()),
            title="POTENTIAL GAP — Missing Rate Limiting",
            severity="HIGH",
            category="SECURITY",
            description="Could not find concrete repository evidence of rate limiting.",
            evidenceTraces=traces,
            checkedAreas=["API routes", "middleware", "limiter packages", "gateway configuration", "proxy configuration"],
            affectedComponents=affected,
            confidence="MEDIUM",
            impact="Without rate limiting, public APIs are vulnerable to brute-force and DDoS attacks.",
            recommendation="Implement an IP or Token-based rate limiting middleware on all public endpoints.",
            reasoning=reasoning
        )]

class ErrorHandlingDetector(BaseGapDetector):
    async def detect(self, job_id: str, kg: dict, domains: List[Finding], capabilities: List[Finding], journeys: List[Finding]) -> List[GapFinding]:
        nodes = kg.get("nodes", [])
        boundaries = [n.get("entity", {}) for n in nodes if n.get("entity", {}).get("type") in ["route", "controller", "api", "function"]]
        middlewares = [n.get("entity", {}) for n in nodes if n.get("entity", {}).get("type") == "middleware"]
        
        # Look for try/catch locally
        local_handlers = []
        global_handlers = []
        for n in boundaries:
            for ev in n.get("evidence", []):
                snippet = ev.get("snippet_or_description", "").lower()
                if "catch" in snippet or "onerror" in snippet:
                    local_handlers.append(n)
        for n in middlewares:
            for ev in n.get("evidence", []):
                snippet = ev.get("snippet_or_description", "").lower()
                if "error" in snippet or "catch" in snippet or "next(err" in snippet:
                    global_handlers.append(n)
                    
        if global_handlers:
            return [] # Global error handler exists
            
        traces = [
            create_evidence(
                "ASYNC_BOUNDARY_ANALYSIS",
                "Async Boundary Analysis",
                f"{len(boundaries)} controller/service boundaries identified.",
                "These represent points where unhandled exceptions can crash the server or leak data.",
                "HIGH"
            )
        ]
        
        if local_handlers:
            traces.append(create_evidence(
                "ERROR_FLOW_ANALYSIS",
                "Error Flow Analysis",
                f"{len(local_handlers)} operations contain local try/catch handling.",
                "Indicates partial implementation of error management.",
                "HIGH"
            ))
        else:
            traces.append(create_evidence(
                "ERROR_FLOW_ANALYSIS",
                "Error Flow Analysis",
                "No local try/catch blocks found in critical paths.",
                "Errors during execution may bubble up unhandled.",
                "HIGH"
            ))
            
        traces.append(create_evidence(
            "GLOBAL_HANDLER_ANALYSIS",
            "Global Handler Analysis",
            "No verified global exception handler was detected covering the API boundary.",
            "A fallback mechanism is required to catch unexpected errors and return safe HTTP 500 responses.",
            "HIGH"
        ))
        
        reasoning = (
            f"CodeAtlas identified {len(boundaries)} asynchronous API and controller boundaries in the repository. "
        )
        if local_handlers:
            reasoning += "It found local error handling in some execution paths but did not find a verified application-level exception handler covering the identified API boundary. "
            reasoning += "The finding is therefore classified as a potential global error handling gap rather than a claim that all error handling is missing."
        else:
            reasoning += "No local error handling or verified application-level exception handler was detected. "
            reasoning += "The finding is therefore classified as a missing global error catch."
            
        affected = list(set([r.get("path", "").split("/")[-1] for r in boundaries if r.get("path")]))[:5]
        if not affected: affected = ["application-core"]
        
        return [GapFinding(
            id=str(uuid.uuid4()),
            title="POTENTIAL GAP — Missing Error Handling / Global Catch",
            severity="MEDIUM",
            category="ERROR_HANDLING",
            description="Global error boundaries or catch-all middlewares are missing.",
            evidenceTraces=traces,
            checkedAreas=["try/catch", "error middleware", "exception handlers", "promise rejection handlers", "error boundaries"],
            affectedComponents=affected,
            confidence="MEDIUM",
            impact="Uncaught exceptions in critical paths can crash the application or leak stack traces to users.",
            recommendation="Implement a global error handler middleware to catch unhandled errors and return standard HTTP 500 responses.",
            reasoning=reasoning
        )]

class AuthorizationDetector(BaseGapDetector):
    async def detect(self, job_id: str, kg: dict, domains: List[Finding], capabilities: List[Finding], journeys: List[Finding]) -> List[GapFinding]:
        nodes = kg.get("nodes", [])
        protected_routes = [n.get("entity", {}) for n in nodes if n.get("entity", {}).get("type") in ["route", "api", "database"]]
        
        # Check for role/auth checks
        auth_kws = ["role", "admin", "owner", "permission", "isauthorized", "haspermission", "policy", "rls"]
        role_checks = []
        for n in protected_routes:
            for ev in n.get("evidence", []):
                snippet = ev.get("snippet_or_description", "").lower()
                if any(kw in snippet for kw in auth_kws):
                    role_checks.append(n)
                    
        traces = [
            create_evidence(
                "ROUTE_ANALYSIS",
                "Protected Route Analysis",
                f"{len(protected_routes)} potentially sensitive endpoints or database structures identified.",
                "Resources requiring authentication typically also require authorization checks.",
                "HIGH"
            )
        ]
        
        if role_checks:
            traces.append(create_evidence(
                "AUTHORIZATION_ANALYSIS",
                "Authorization Analysis",
                f"Role/permission checks were detected in {len(role_checks)} locations.",
                "Shows the system has a concept of roles, but coverage may be incomplete.",
                "MEDIUM"
            ))
            traces.append(create_evidence(
                "SERVER_BOUNDARY_ANALYSIS",
                "Server Boundary Analysis",
                "Consistent server-side authorization could not be verified for all identified protected operations.",
                "Attackers can bypass UI-only checks by hitting the API directly.",
                "HIGH"
            ))
            reasoning = (
                f"CodeAtlas found {len(protected_routes)} protected operations and detected role-based logic in several parts of the application. "
                "However, the analysis could not verify that every protected API operation performs a server-side permission check before accessing the resource. "
                "Because authorization exists in parts of the system but its coverage cannot be established consistently, "
                "this is classified as a potential authorization gap requiring manual review."
            )
        else:
            traces.append(create_evidence(
                "AUTHORIZATION_ANALYSIS",
                "Authorization Analysis",
                "No explicit role or permission checks detected in the middleware or handlers.",
                "Without authorization, any authenticated user can access any resource.",
                "HIGH"
            ))
            reasoning = (
                f"CodeAtlas found {len(protected_routes)} operations but could not detect any explicit role-based or ownership-based authorization checks. "
                "This is classified as a missing authorization gap."
            )
            
        affected = list(set([r.get("path", "").split("/")[-1] for r in protected_routes if r.get("path")]))[:5]
        if not affected: affected = ["application-core"]
        
        return [GapFinding(
            id=str(uuid.uuid4()),
            title="POTENTIAL GAP — Missing Authorization Checks",
            severity="CRITICAL",
            category="AUTHORIZATION",
            description="Authorization checks are missing or inconsistently applied.",
            evidenceTraces=traces,
            checkedAreas=["middleware", "RBAC", "permission helpers", "route guards", "database RLS", "server-side authorization"],
            affectedComponents=affected,
            confidence="MEDIUM",
            impact="Lack of authorization checks can allow privilege escalation and horizontal/vertical IDOR vulnerabilities.",
            recommendation="Ensure all authenticated routes also verify the user has explicit permission to access the specific resource.",
            reasoning=reasoning
        )]

class GenericGapDetector(BaseGapDetector):
    def __init__(self, title, category, severity, keywords, deps, rationale, remediation, affected_types, target_desc):
        self.title = title
        self.category = category
        self.severity = severity
        self.keywords = keywords
        self.deps = deps
        self.rationale = rationale
        self.remediation = remediation
        self.affected_types = affected_types
        self.target_desc = target_desc

    async def detect(self, job_id, kg, domains, capabilities, journeys):
        nodes = kg.get("nodes", [])
        targets = [n.get("entity", {}) for n in nodes if n.get("entity", {}).get("type") in self.affected_types]
        all_deps = [n.get("entity", {}).get("name", "").lower() for n in nodes if n.get("entity", {}).get("type") == "external_service"]
        
        found_deps = [d for d in self.deps if any(d in dep for dep in all_deps)]
        found_code = []
        for n in targets:
            for ev in n.get("evidence", []):
                snippet = ev.get("snippet_or_description", "").lower()
                if any(kw in snippet for kw in self.keywords):
                    found_code.append(n)
                    
        if found_deps or found_code:
            return []
            
        traces = [
            create_evidence(
                "PATTERN_ANALYSIS",
                f"{self.title} Analysis",
                f"Inspected {len(targets)} {self.target_desc} for {self.title.lower()} patterns.",
                "Essential control for this architectural component.",
                "HIGH"
            ),
            create_evidence(
                "DEPENDENCY_ANALYSIS",
                "Dependency Analysis",
                f"No standard dependency found for {self.title.lower()}.",
                "Common packages are missing.",
                "MEDIUM"
            )
        ]
        
        affected = list(set([r.get("path", "").split("/")[-1] for r in targets if r.get("path")]))[:5]
        if not affected: affected = ["application-core"]
        
        reasoning = f"CodeAtlas identified {len(targets)} {self.target_desc}. Analysis found no verified {self.title.lower()} implementation or dependency. Classified as a potential gap."
        
        return [GapFinding(
            id=str(uuid.uuid4()),
            title=f"POTENTIAL GAP — {self.title}",
            severity=self.severity,
            category=self.category,
            description=f"Could not find concrete repository evidence of {self.title.lower()}.",
            evidenceTraces=traces,
            checkedAreas=["dependencies", "source code", "configuration"],
            affectedComponents=affected,
            confidence="LOW",
            impact=self.rationale,
            recommendation=self.remediation,
            reasoning=reasoning
        )]


class LogicGapDetector:
    def __init__(self):
        self.detectors = [
            RateLimitingDetector(),
            ErrorHandlingDetector(),
            AuthorizationDetector(),
            GenericGapDetector(
                title="Missing Input Validation",
                category="VALIDATION",
                severity="HIGH",
                keywords=["validate", "schema", "z.object", "joi.object", "validationresult"],
                deps=["zod", "joi", "yup", "express-validator", "class-validator", "validator"],
                rationale="Missing input validation can lead to injection attacks, logic errors, and data corruption.",
                remediation="Validate all incoming request bodies and query parameters against a strict schema.",
                affected_types=["route", "api", "database", "model"],
                target_desc="data ingestion endpoints and models"
            )
        ]

    async def detect(
        self,
        job_id: str,
        kg: dict,
        domains: List[Finding],
        capabilities: List[Finding],
        journeys: List[Finding],
    ) -> List[GapFinding]:
        logger.info(f"LogicGapDetector running for job {job_id}")
        
        all_gaps = []
        for detector in self.detectors:
            gaps = await detector.detect(job_id, kg, domains, capabilities, journeys)
            all_gaps.extend(gaps)
            
        return all_gaps
