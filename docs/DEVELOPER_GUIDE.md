# CodeAtlas Developer Guide

## Prerequisites
- Docker & Docker Compose
- Python 3.10+
- Node.js 18+

## Local Setup (docker-compose)
1. **Clone the repository.**
2. **Start Neo4j**:
   ```bash
   docker-compose up -d neo4j
   ```
3. **Environment Variables**:
   Copy `.env.example` to `.env` and set:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=local_dev_password
   JWT_SECRET=local_dev_jwt_secret
   LLM_API_KEY=your_api_key
   ```
4. **Start Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```
5. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Testing
Run the test suite to validate the reasoning engine against the benchmark fixtures:
```bash
python tests/run_test_suite.py
```
