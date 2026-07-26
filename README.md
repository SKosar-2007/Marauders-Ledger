# OmniLedger

OmniLedger is an AI-powered financial anomaly investigation platform built around Actian VectorAI. Users upload transaction histories, receive ML-based anomaly detection, explore findings in a dashboard, and search transactions or anomalies with semantic, filtered, and hybrid retrieval.

## What it does

- Uploads CSV transaction data and runs an anomaly detection pipeline.
- Highlights suspicious transactions with severity, context, and AI-generated narratives.
- Lets users investigate anomalies through a visual dashboard and voice chat experience.
- Uses Actian VectorAI for intelligent search over transactions, anomalies, and narratives.

## Why we built it

The goal was to turn raw financial data into an interactive investigation experience while showing how modern vector search can power retrieval over structured financial records. The project combines anomaly detection with retrieval features that are directly relevant to the Actian track.

## How Actian VectorAI is used

- Stores and retrieves transaction, anomaly, and narrative embeddings.
- Supports named vectors for different search modes, including semantic and numerical representations.
- Powers filtered vector search for structured filters like category, merchant, amount, severity, status, and batch.
- Enables hybrid fusion that combines semantic similarity with keyword-style matching for stronger ranking.

## Demo

A working demo can be launched locally with Docker:

```bash
docker compose up --build
```

Then open the app at http://localhost:8000 (or the deployed judge URL if using the production setup).

## Production Deployment

For a simple production deployment, use a DigitalOcean droplet with Docker Compose and expose the FastAPI backend directly on port 8000.

```bash
ssh root@<droplet-ip>
apt update && apt install -y docker.io docker-compose-v2

git clone <your-repo-url> /opt/marauders-ledger
cd /opt/marauders-ledger
cp .env.example .env
# update the values in .env, then start the stack
docker compose up -d
```

Recommended runtime environment values:

```env
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
VECTORAI_HOST=vectorai
VECTORAI_PORT=6574
ACTIAN_VECTORAI_ACCEPT_EULA=YES
```

The judge URL should be http://<droplet-ip>:8000 (or http://<droplet-ip>.sslip.io:8000 if you want a friendlier domain name).

## Actian Track Submission Requirements

- Public GitHub repository with a README: Yes
- Working demo (video, Loom, or live link): Add your demo link or recording in the submission notes
- Brief write-up: What it does, why it was built, and how VectorAI DB is used: Covered below

## Eligibility for the Actian Track

This project is eligible because it implements the following Actian-style capabilities:

- Hybrid Fusion — implemented through the hybrid search endpoint, combining semantic vector similarity with keyword-style matching.
- Filtered Search — implemented through transaction and anomaly search endpoints that combine vector search with structured filters such as category, merchant, amount, severity, status, and batch.
- Named Vectors — supported in the backend vector store configuration using named vector setups for semantic and numerical search.

Bonus: local deployment is also supported through Docker Compose.

## Architecture

```text
React + Vite Frontend
  ↓
FastAPI Backend
  ↓
ML Anomaly Detection
  ↓
Actian VectorAI / SQLite fallback
  ↓
Gemini + ElevenLabs AI narration
```

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: FastAPI, Python
- ML: scikit-learn, XGBoost, LightGBM, and ensemble anomaly detection
- AI: Gemini for narratives, ElevenLabs for audio
- Data/Search: Actian VectorAI with vector search, filters, and hybrid ranking

## Quick Start

### Local Development

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker compose up --build
```

## Environment Variables

- GEMINI_API_KEY: Optional, used for AI narrative generation
- ELEVENLABS_API_KEY: Optional, used for voice narration
- VECTORAI_HOST: VectorAI host for deployment
- VECTORAI_PORT: VectorAI port for deployment

## Sample Data

- data/normal.csv
- data/compromised.csv
- data/mixed.csv

## License

MIT
