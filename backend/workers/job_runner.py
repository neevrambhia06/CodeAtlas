import asyncio
import logging
from concurrent.futures import ProcessPoolExecutor
from parser.engine import ParserEngine
from knowledge_graph.builder import KnowledgeGraphBuilder
from reasoning_engine.domain_inference import DomainInferenceEngine
from reasoning_engine.architecture_inference import ArchitectureInferenceEngine
from reasoning_engine.capability_detection import CapabilityDetector
from reasoning_engine.journey_reconstruction import JourneyReconstructor
from reasoning_engine.logic_gap_detection import LogicGapDetector
from database.connection import SessionLocal
from database.models import AnalysisJob
from models.core import Finding
from typing import Any

logger = logging.getLogger(__name__)

# Max 2 concurrent heavy analysis jobs to prevent server exhaustion
job_semaphore = asyncio.Semaphore(2)

# Global process pool for CPU-bound tasks
process_pool = ProcessPoolExecutor(max_workers=2)


def run_parser_sync(extract_path: str):
    parser = ParserEngine(extract_path)
    return parser.parse_repository()


def run_kg_sync(job_id: str, metadata: dict):
    kg_builder = KnowledgeGraphBuilder()
    return kg_builder.build_graph_from_metadata(job_id, "mock_repo_id", metadata)


def validate_finding(finding: Any, graph_data: dict) -> bool:
    """
    Phase 7 Guardrails: Validate every analysis result against the canonical Knowledge Graph before returning it to the frontend.
    If validation fails (i.e. references hallucinated entities), discard the claim.
    """
    # 1. Build a fast lookup set of valid entities from the canonical graph
    valid_ids = set()
    valid_names_paths = set()

    for node in graph_data.get("nodes", []):
        valid_ids.add(str(node.get("id")))
        if "path" in node:
            valid_names_paths.add(str(node["path"]).lower())
        if "label" in node:
            valid_names_paths.add(str(node["label"]).lower())

    for edge in graph_data.get("edges", []):
        if "id" in edge:
            valid_ids.add(str(edge["id"]))

    def is_valid_ref(ref: str) -> bool:
        if not ref:
            return False
        ref_str = str(ref)
        if ref_str in valid_ids:
            return True
        ref_lower = ref_str.lower()
        for valid_val in valid_names_paths:
            if ref_lower in valid_val or valid_val in ref_lower:
                return True
        return False

    # Check for early exit states
    if getattr(finding, "status", None) in (
        "Insufficient-Evidence",
        "INSUFFICIENT_EVIDENCE",
    ):
        return True

    finding_category = getattr(finding, "category", type(finding).__name__)

    # 2. Evidence Validation (Phase 7 rule: evidence must correspond to actual entity)
    evidence_list = getattr(finding, "evidence", [])
    if not evidence_list or len(evidence_list) == 0:
        if hasattr(finding, "checkedLocations") and getattr(
            finding, "checkedLocations"
        ):
            pass  # Gap findings can have no evidence if they explicitly list checked locations
        elif type(finding).__name__ == "ArchitectureNode":
            pass  # Architecture Map nodes can be DERIVED from canonical entities
        else:
            logger.warning(
                f"Validation failed: Finding {finding_category} has no evidence."
            )
            return False

    valid_evidence = []
    for ev in evidence_list:
        if not ev.reference:
            logger.warning(
                f"Validation failed: Evidence in {finding_category} lacks a reference."
            )
            if type(finding).__name__ != "ArchitectureNode":
                return False
            continue
        # Skip strict ref checking for ABSENCE_CHECKs
        if getattr(ev, "source_type", None) == "ABSENCE_CHECK":
            valid_evidence.append(ev)
            continue
        if not is_valid_ref(ev.reference):
            logger.warning(
                f"Validation failed: Hallucinated evidence reference '{ev.reference}' in {finding_category}"
            )
            if type(finding).__name__ != "ArchitectureNode":
                return False
            continue
        valid_evidence.append(ev)

    if type(finding).__name__ == "ArchitectureNode" and len(valid_evidence) != len(
        evidence_list
    ):
        finding.evidence = valid_evidence

    # 3. Entity Consistency Validation (Phase 7 rule: referenced entities must exist)
    # Check relatedEntities, entryPoints, dependencies, children
    lists_to_check = ["relatedEntities", "entryPoints", "dependencies", "children"]
    for list_attr in lists_to_check:
        # Architecture nodes reference each other in children/dependencies, skip them here
        if type(finding).__name__ == "ArchitectureNode" and list_attr in [
            "children",
            "dependencies",
        ]:
            continue
        ref_list = getattr(finding, list_attr, [])
        for ref in ref_list:
            if not is_valid_ref(ref):
                logger.warning(
                    f"Validation failed: Hallucinated entity reference '{ref}' in {finding_category}.{list_attr}"
                )
                return False

    # For JourneyFinding, we also need to check its steps
    if hasattr(finding, "steps"):
        for step in finding.steps:
            if step.entityId and not is_valid_ref(step.entityId):
                logger.warning(
                    f"Validation failed: Hallucinated step entityId '{step.entityId}' in Journey"
                )
                return False
            for step_ev in getattr(step, "evidence", []):
                if step_ev.reference and not is_valid_ref(step_ev.reference):
                    logger.warning(
                        f"Validation failed: Hallucinated evidence reference '{step_ev.reference}' in Journey Step"
                    )
                    return False

    # 4. Confidence Score Validation
    conf = getattr(finding, "confidence_score", None)
    if conf is not None:
        if not (0.0 <= conf <= 1.0):
            logger.warning(
                f"Validation failed: Finding {finding_category} has invalid confidence {conf}."
            )
            return False

    return True


class JobRunner:
    @staticmethod
    async def run_pipeline(job_id: str, extract_path: str = None):
        async with job_semaphore:
            try:
                logger.info(f"Job {job_id}: Starting pipeline")
                await JobRunner._update_job_status(job_id, "Uploaded")

                # Stage 1: Processing
                await JobRunner._update_job_status(job_id, "Processing")

                # Stage 2: Parsing (CPU Bound - Run in ProcessPool)
                await JobRunner._update_job_status(job_id, "Parsing")
                metadata = {
                    "frameworks": [],
                    "languages": [],
                    "api_routes": [],
                    "partial_failure": False,
                }

                loop = asyncio.get_running_loop()
                if extract_path:
                    metadata = await loop.run_in_executor(
                        process_pool, run_parser_sync, extract_path
                    )

                await JobRunner._update_job_status(job_id, "Parsed")

                # Stage 2b: Knowledge Graph (CPU Bound - Run in ProcessPool)
                graph_data = await loop.run_in_executor(
                    process_pool, run_kg_sync, job_id, metadata
                )
                logger.info(f"Job {job_id}: Knowledge Graph built.")

                # Stage 3: Reasoning (I/O Bound - Async)
                await JobRunner._update_job_status(job_id, "Reasoning")

                domain_engine = DomainInferenceEngine(graph_data)
                domain_inferences = await domain_engine.infer_domain(job_id)

                arch_engine = ArchitectureInferenceEngine(graph_data)
                architecture_nodes = await arch_engine.infer_architecture(job_id)

                cap_detector = CapabilityDetector()
                capabilities = await cap_detector.detect(
                    job_id, graph_data, domain_inferences
                )

                journey_recon = JourneyReconstructor()
                journeys = await journey_recon.reconstruct(
                    job_id, graph_data, capabilities
                )

                gap_detector = LogicGapDetector()
                gaps = await gap_detector.detect(
                    job_id, graph_data, domain_inferences, capabilities, journeys
                )

                # Validate findings (discard invalid ones)
                valid_domains = [
                    d for d in domain_inferences if validate_finding(d, graph_data)
                ]
                valid_arch = [
                    a for a in architecture_nodes if validate_finding(a, graph_data)
                ]
                valid_caps = [
                    c for c in capabilities if validate_finding(c, graph_data)
                ]
                valid_journeys = [
                    j for j in journeys if validate_finding(j, graph_data)
                ]
                valid_gaps = [g for g in gaps if validate_finding(g, graph_data)]

                # Persist findings to DB
                try:
                    db = SessionLocal()
                    job = (
                        db.query(AnalysisJob)
                        .filter(AnalysisJob.job_id == job_id)
                        .first()
                    )
                    if job:
                        job.findings = {
                            "domains": [d.model_dump() for d in valid_domains],
                            "architecture": [a.model_dump() for a in valid_arch],
                            "capabilities": [c.model_dump() for c in valid_caps],
                            "journeys": [j.model_dump() for j in valid_journeys],
                            "gaps": [g.model_dump() for g in valid_gaps],
                        }
                        job.graph_preview = graph_data
                        db.commit()
                finally:
                    db.close()

                # Stage 4: Completed
                await JobRunner._update_job_status(job_id, "Completed")
                logger.info(f"Job {job_id}: Pipeline completed successfully")

            except Exception as e:
                logger.error(f"Job {job_id}: Pipeline failed with error: {str(e)}")
                await JobRunner._update_job_status(job_id, "Failed", error_msg=str(e))

    @staticmethod
    async def _update_job_status(job_id: str, status: str, error_msg: str = None):
        try:
            db = SessionLocal()
            job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
            if job:
                job.status = status
                if error_msg:
                    job.error = error_msg
                db.commit()
        except Exception as e:
            logger.error(f"Failed to update job status: {e}")
        finally:
            db.close()
        logger.info(f"Job {job_id} Status Update -> {status}")


def enqueue_job(job_id: str, background_tasks, extract_path: str = None):
    background_tasks.add_task(JobRunner.run_pipeline, job_id, extract_path)
    return {"message": "Job enqueued", "job_id": job_id}
