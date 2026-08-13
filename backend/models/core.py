from pydantic import BaseModel, Field, model_validator
from typing import List, Literal, Optional, Dict, Any


class Evidence(BaseModel):
    evidence_id: str
    source_type: str
    reference: str
    snippet_or_description: str
    reasoning_type: Literal["DIRECT", "INFERRED", "HEURISTIC", "LLM_INFERRED"] = (
        "DIRECT"
    )

    # New optional fields for enhanced reasoning
    title: Optional[str] = None
    file_path: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    symbol: Optional[str] = None
    description: Optional[str] = None
    why_it_matters: Optional[str] = None
    strength: Optional[str] = None

    @classmethod
    def parse_llm_output(cls, ev: any) -> "Evidence":
        import uuid

        if isinstance(ev, dict):
            return cls(
                evidence_id=ev.get("evidence_id", str(uuid.uuid4())),
                source_type=ev.get("source_type", "UNKNOWN"),
                reference=ev.get("reference", "Unknown"),
                snippet_or_description=ev.get("snippet_or_description", str(ev)),
                reasoning_type=ev.get("reasoning_type", "LLM_INFERRED"),
            )
        return cls(
            evidence_id=str(uuid.uuid4()),
            source_type="UNKNOWN",
            reference="Unknown",
            snippet_or_description=str(ev),
            reasoning_type="LLM_INFERRED",
        )


class Relationship(BaseModel):
    source_id: str
    target_id: str
    type: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: List[Evidence] = []


class Entity(BaseModel):
    id: str
    type: str
    name: str
    path: Optional[str] = None
    symbol: Optional[str] = None
    language: Optional[str] = None
    metadata: Dict[str, Any] = {}
    evidence: List[Evidence] = []


class Finding(BaseModel):
    finding_id: str
    category: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    reasoning_summary: str
    evidence: List[Evidence]
    status: Literal[
        "Confirmed", "High-Confidence", "Low-Confidence", "Insufficient-Evidence", "Partially Implemented"
    ]

    @model_validator(mode="after")
    def validate_never_guess_rule(self) -> "Finding":
        if self.confidence_score > 0 and not self.evidence:
            raise ValueError(
                "NEVER-GUESS RULE VIOLATION: confidence_score > 0 but no evidence provided. "
                "Must emit status='Insufficient-Evidence' with confidence_score=0."
            )
        return self


class CapabilityFinding(BaseModel):
    id: str
    name: str
    description: str
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    evidence: List[Evidence]
    relatedEntities: List[str] = []
    entryPoints: List[str] = []
    dependencies: List[str] = []
    implementationStatus: Literal[
        "CONFIRMED",
        "PARTIALLY_IMPLEMENTED",
        "INFERRED",
        "INSUFFICIENT_EVIDENCE",
        "NOT_DETECTED",
    ]
    confidence_explanation: str = ""

    # Keeping old properties as properties or fields just in case job_runner uses them
    @property
    def finding_id(self):
        return self.id

    @property
    def status(self):
        return self.implementationStatus

    @property
    def category(self):
        return f"Capability: {self.name}"

    @property
    def confidence_score(self):
        if self.confidence == "HIGH":
            return 0.9
        if self.confidence == "MEDIUM":
            return 0.6
        return 0.3


class JourneyStep(BaseModel):
    id: str
    label: str
    entityId: Optional[str] = None
    stepType: Literal[
        "ENTRY",
        "UI",
        "ACTION",
        "FUNCTION",
        "API",
        "DATABASE",
        "EXTERNAL_SERVICE",
        "REDIRECT",
        "DECISION",
        "EXIT",
    ]
    evidence: List[Evidence] = []
    confidence: Literal["VERIFIED", "INFERRED"]
    nextSteps: List[str] = []  # Allows branching logic


class GapFinding(BaseModel):
    id: str
    title: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    category: Literal[
        "SECURITY",
        "ARCHITECTURE",
        "DATA",
        "API",
        "AUTHENTICATION",
        "AUTHORIZATION",
        "ERROR_HANDLING",
        "VALIDATION",
        "PERFORMANCE",
        "MAINTAINABILITY",
        "FUNCTIONAL",
    ]
    description: str
    impact: str = ""
    recommendation: str = ""
    affectedComponents: List[str] = []
    evidenceTraces: List[Evidence] = []
    checkedAreas: List[str] = []
    reasoning: str = ""
    confidence: Literal["HIGH", "MEDIUM", "LOW"]

    # Backwards compatibility properties (UI and job_runner)
    @property
    def finding_id(self):
        return self.id

    @property
    def status(self):
        return "Confirmed" if self.confidence == "HIGH" else "Low-Confidence"

    @property
    def confidence_score(self):
        if self.confidence == "HIGH":
            return 0.9
        if self.confidence == "MEDIUM":
            return 0.6
        return 0.3

    @property
    def evidence(self):
        return self.evidenceTraces

    @property
    def checkedLocations(self):
        return self.checkedAreas

    @property
    def rationale(self):
        return self.impact

    @property
    def remediation(self):
        return self.recommendation

    @property
    def reasoning_summary(self):
        return self.reasoning


class JourneyFinding(BaseModel):
    id: str
    name: str
    description: str
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    status: Literal["COMPLETE_JOURNEY", "PARTIAL_JOURNEY", "INSUFFICIENT_EVIDENCE"]
    steps: List[JourneyStep] = []

    # Keeping old properties for job_runner fallback
    @property
    def finding_id(self):
        return self.id

    @property
    def category(self):
        return f"Journey: {self.name}"

    @property
    def confidence_score(self):
        if self.confidence == "HIGH":
            return 0.9
        if self.confidence == "MEDIUM":
            return 0.6
        return 0.3

    @property
    def evidence(self):
        # job_runner checks length of evidence, we can return the steps as a proxy or extract inner evidence
        all_ev = []
        for s in self.steps:
            all_ev.extend(s.evidence)
        return all_ev


class ArchitectureRelationship(BaseModel):
    target_id: str
    type: Literal[
        "depends_on",
        "calls",
        "reads_from",
        "writes_to",
        "exposes",
        "imports",
        "publishes",
        "consumes",
        "integrates_with",
    ]


class ArchitectureNode(BaseModel):
    id: str
    name: str
    type: Literal[
        "PROJECT",
        "APPLICATION",
        "FRONTEND",
        "BACKEND",
        "MODULE",
        "PACKAGE",
        "DOMAIN",
        "SERVICE",
        "API",
        "DATABASE",
        "EXTERNAL_SERVICE",
        "QUEUE",
        "EVENT",
        "STORAGE",
        "FRAMEWORK",
        "OTHER",
    ]
    description: str
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    evidence: List[Evidence] = []
    children: List[str] = []  # IDs of child nodes
    dependencies: List[str] = []  # Fallback backward-compat
    relationships: List[ArchitectureRelationship] = []  # specific relationships

    # Optional enrichments (added post-inference)
    relatedCapabilities: List[str] = []
    relatedJourneys: List[str] = []
    relatedGaps: List[str] = []

    # Keeping old properties for job_runner fallback if needed
    @property
    def finding_id(self):
        return self.id

    @property
    def category(self):
        return f"ArchitectureNode: {self.name}"

    @property
    def status(self):
        return "Confirmed" if self.confidence == "HIGH" else "Low-Confidence"

    @property
    def confidence_score(self):
        if self.confidence == "HIGH":
            return 0.9
        if self.confidence == "MEDIUM":
            return 0.6
        return 0.3
