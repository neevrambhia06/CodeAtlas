# CodeAtlas Deployment Guide (Phases 6.1 - 6.2)

## 1. Secrets Management
CodeAtlas absolutely requires secrets to be injected via environment variables at runtime. Plaintext fallbacks have been removed. 
Ensure the following are provisioned in your Platform's Secret Store (e.g., AWS Secrets Manager, GCP Secret Manager, or Kubernetes Secrets):
- `JWT_SECRET`: High-entropy string for signing auth tokens.
- `NEO4J_URI`: Target neo4j cluster (e.g. `bolt://neo4j-cluster:7687`).
- `NEO4J_USER`: Database username.
- `NEO4J_PASSWORD`: Database password.
- `LLM_API_KEY`: API key for the LLM reasoning provider.

## 2. CI/CD & Build
The frontend is a standard Next.js application that can be built into a standalone production server or static export depending on routing needs.
```bash
cd frontend
npm run build
npm start
```
The backend is served via Uvicorn/Gunicorn.
```bash
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## 3. Observability
- **Rate Limiting**: Configured natively via `slowapi`. Ensure your load balancer passes the `X-Forwarded-For` header so the rate limiter accurately tracks client IPs.
- **Audit Logging**: Application outputs structured JSON to `stdout`. Attach a log scraper (e.g., Fluent Bit, Promtail) to route `[AUDIT]` and `[ALERT]` tagged messages to your SIEM/alerting platform.
- **API Docs**: Available automatically at `/api/docs` and `/api/redoc` on the deployed FastAPI backend.
