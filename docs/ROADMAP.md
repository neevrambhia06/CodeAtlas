# CodeAtlas Roadmap (Post-MVP)

This document outlines the strategic future direction for CodeAtlas beyond the v1.0 MVP release.

## A.1 Next Iteration (v1.5)
Focuses on expanding the core reasoning engine capabilities:
- Support for additional programming languages and web frameworks.
- Richer interactive visualizations for the Knowledge Graph Preview and Journey Reconstruction modules.
- Expansion of Domain Inference categories, strictly gated by the 4.5 benchmark process to ensure zero hallucinations for every new domain added.

## A.2 Infrastructure Scale-Up
**Trigger Condition:** To be executed *only* when real-world usage and load demand it.
This is a dedicated infrastructure-migration project designed to replace the MVP's monolithic architecture with enterprise-grade distributed systems:
- **Orchestration**: Kubernetes for multi-instance autoscaling.
- **Message Broker**: RabbitMQ to replace the in-process job runner with robust distributed task queues.
- **Caching**: Redis for session management, dashboard rendering, and report caching.
- **Storage**: MinIO/S3 to replace the local filesystem storage adapter (leveraging the abstraction interface established in Phase 0.2).
- **API Gateway**: Centralized authentication and rate-limiting as services split.
- **Observability**: Full OpenTelemetry, Prometheus, Grafana, and ELK stack implementation.

## A.3 Enterprise Expansion (v2.0)
Focuses on deep enterprise integration and advanced collaborative features:
- **Integrations**: IDE Plugins, Webhooks, Marketplace ecosystem, and continuous live repository monitoring.
- **Enterprise Features**: SSO, IT Governance, MFA, and Team Collaboration (collaborative commenting, multi-user sessions).
- **Advanced Architecture**: GraphQL APIs, gRPC services, Event-Driven Architecture, Multi-Region deployments.
- **AI Enhancements**: Vector DB integration, AI Copilot, AI Assistant sidebar.
- **Advanced UI**: Interactive architecture mapping, 3D repository visualization, and custom dashboard widgets.
