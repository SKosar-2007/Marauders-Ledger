# The Marauder's Ledger

> *"I solemnly swear that I am up to no good."*

An AI-powered financial anomaly detection system with a Harry Potter theme. Upload your bank statements and watch the Marauder's Map reveal where mischief is afoot in your finances.

## Live Demo

1. Open [http://localhost:5173](http://localhost:5173)
2. Drag & drop `data/compromised.csv` onto the upload zone
3. Watch the Marauder's Map populate with detected anomalies
4. Click any footprint to investigate — get AI narration + voice

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React 19  │────▶│  FastAPI     │────▶│  ML Models  │
│   + Vite    │     │  Python 3.9  │     │  (Ensemble) │
│   + Tailwind│     │              │     │  RF+GB+IF+  │
└─────────────┘     └─────────────┘     │  LOF+OCSVM  │
                                        └─────────────┘
                                              │
                        ┌─────────────┐       │
                        │  In-Memory  │◀──────┘
                        │  Database   │
                        └─────────────┘
                               │
                  ┌────────────┼────────────┐
                  ▼            ▼            ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │  Gemini  │ │ ElevenLabs│ │ Fallback │
            │  (NLG)   │ │  (TTS)   │ │ Narratives│
            └──────────┘ └──────────┘ └──────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| State | TanStack Query, React Context |
| Backend | Python 3.9, FastAPI |
| ML | scikit-learn, XGBoost, LightGBM |
| AI Narratives | Gemini 2.0 Flash (with fallback) |
| Voice | ElevenLabs TTS (with fallback) |

## ML Model

Ensemble of 7 anomaly detection models:
- **Isolation Forest** — Unsupervised outlier detection
- **Local Outlier Factor** — Density-based anomalies
- **One-Class SVM** — Boundary learning
- **Random Forest** — Supervised classification
- **Gradient Boosting** — Supervised classification
- **XGBoost** — High-performance gradient boosting
- **LightGBM** — Fast gradient boosting

**Performance:** F1 = 0.873 on test set

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing — upload CSV or load sample data |
| `/dashboard` | Marauder's Map with anomaly footprints |
| `/anomaly/:id` | Detail — gauges, narrative, audio, tethered txns |
| `/ledger` | Historical data table with search/filter |
| `/vault` | Gringotts bank statement overview |
| `/pensieve` | Deep analysis — spending categories, risk breakdown |
| `/owl-post` | Notifications with read/unread states |
| `/profile` | Wizard's dossier with stats and skills |

## Quick Start

### Local Development

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Docker

```bash
cp .env.example .env  # Add your API keys (optional)
docker compose up --build
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Gemini AI for narrative generation (fallback provided) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs for voice narration (returns 501 if unset) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload CSV file |
| POST | `/api/analyze?batch_id=` | Run ML inference |
| GET | `/api/anomalies` | List all anomalies |
| GET | `/api/anomalies/:id` | Get single anomaly |
| GET | `/api/narratives/:id` | Get AI narrative |
| GET | `/api/narratives/:id/audio` | Get voice narration |

## Sample Data

- `data/normal.csv` — 50 clean transactions
- `data/compromised.csv` — 50 transactions with 6 anomalies
- `data/mixed.csv` — Mixed dataset for testing

## License

MIT
