# CodeAtlas Architecture

## Overview
CodeAtlas is an AI Software Reasoning Engine designed to map the business architecture of software repositories without requiring human intervention. It extracts a deterministic Knowledge Graph from source ASTs and applies domain-aware LLM reasoning to detect business capabilities, user journeys, and logic gaps.

## Components
1. **Frontend (Next.js App Router)**: Client-side rendered UI utilizing Tailwind CSS, ReactFlow for Knowledge Graph visualization, and GSAP/Framer-inspired CSS animations.
2. **Backend (FastAPI)**: High-performance async Python backend managing orchestration.
3. **Reasoning Engine (`reasoning_engine/`)**: 
   - **Parser**: AST extraction.
   - **Knowledge Graph Builder**: Neo4j persistence.
   - **Domain Inference**: LLM-backed categorization with `never-guess` constraints.
   - **Capability & Journey Detection**: Evidence-backed mapping.
   - **Logic Gap Detection**: Domain-aware vulnerability checks (e.g., missing refunds in E-commerce).
4. **Database**: Neo4j for the Knowledge Graph, simulated in-memory datastores for MVP users/jobs.

## Pipeline Flow
`Upload → Parse → Knowledge Graph (Neo4j) → Domain Inference → Capability Detection → Journey Reconstruction → Logic Gap Detection → Dashboard`
