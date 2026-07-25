# 1 — The Marauder's Ledger

> **Track:** AI / ML  
> **Tagline:** *"I solemnly swear I am up to no good" — and your bank account agrees.*
> **Database:** Actian Data Platform (mandatory)
> **LLM:** Gemini API
> **TTS:** ElevenLabs
> **Orchestration:** Superplane
> **CI/CD:** GitHub Actions

---

## 1. Problem Statement

Financial fraud and wasteful spending cost individuals billions annually. Existing bank alerts are generic (fixed thresholds), late (post-facto SMS), and unintelligible (raw data, no narrative). For students and young professionals, small unnoticed leaks accumulate into serious losses.

---

## 2. Solution

An AI-powered financial anomaly detection dashboard styled as the Marauder's Map. Users upload CSV transaction history. The system runs an Isolation Forest + rule-based hybrid anomaly detector, visualizes spending clusters on an interactive SVG map, narrates findings via Gemini, and reads them aloud via ElevenLabs. All data persists in Actian DB.

---

## 3. Architecture

```
CLIENT (React + Vite)
  ├─ Upload CSV / Connect
  ├─ Marauder's Map (SVG + Framer Motion)
  └─ Anomaly Detail Panel + Voice Playback
         │
         ▼
BACKEND (FastAPI + Celery)
  ├─ /upload ─ CSV parser + feature engineering (Pandas)
  ├─ /analyze ─ Isolation Forest + rule-based scoring (scikit-learn)
  ├─ /narrate ─ Gemini 1.5 Flash → plain English anomaly explanation
  └─ /tts ─── ElevenLabs → MP3 audio stream
         │
         ▼
ACTIAN DATA PLATFORM (Primary Database)
  ├─ Users, transactions, features, anomalies, narratives, batches
  └─ Materialized views for dashboard aggregates
         │
         ▼
SUPERPLANE (Orchestration)
  └─ Workflows: CSV ingest → feature compute → detect → narrate → TTS

EXTERNAL SERVICES
  ├─ Gemini API (narrative generation)
  ├─ ElevenLabs API (text-to-speech)
  └─ GitHub API (CI/CD, issue alerts)
```

---

## 4. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite + TypeScript | Fast dev, component ecosystem |
| Map | SVG + Framer Motion | Animated parchment map |
| Styling | Tailwind CSS + parchment theme | Rapid theming |
| Backend | Python 3.11 + FastAPI | Async, fast, ML-friendly |
| ML | scikit-learn Isolation Forest | Lightweight, no GPU needed |
| Feature Eng | Pandas + NumPy | Transaction math |
| NLG | Gemini 1.5 Flash (Google AI SDK) | Fast, cheap narrative generation |
| TTS | ElevenLabs API | Ultra-realistic voice narration |
| Database | **Actian Data Platform** | Scalable hybrid cloud data warehouse, SQL + Python UDFs, columnar |
| Async Tasks | Celery + Redis | Background ML pipelines |
| Orchestration | **Superplane** | Durable execution, event-driven ML workflows |
| CI/CD | **GitHub Actions** | Automated test + deploy |
| Auth | Supabase Auth | Quick social login |

---

## 5. Actian DB Schema

```sql
CREATE TABLE users (
    user_id     VARCHAR(64) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    avatar_url  VARCHAR(512),
    preferences JSONB,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    txn_id      VARCHAR(64) PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL REFERENCES users(user_id),
    raw_desc    VARCHAR(512),
    amount      DECIMAL(12,2) NOT NULL,
    category    VARCHAR(128),
    merchant    VARCHAR(256),
    txn_date    DATE NOT NULL,
    txn_time    TIME,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction_features (
    feature_id      VARCHAR(64) PRIMARY KEY,
    txn_id          VARCHAR(64) NOT NULL REFERENCES transactions(txn_id),
    user_id         VARCHAR(64) NOT NULL REFERENCES users(user_id),
    amount_zscore   DECIMAL(10,6),
    amount_cat_ratio DECIMAL(10,6),
    merchant_freq   INTEGER,
    rolling_7d_avg  DECIMAL(12,2),
    rolling_7d_std  DECIMAL(12,2),
    days_since_last_cat INTEGER,
    is_weekend      BOOLEAN,
    is_unusual_hour BOOLEAN
);

CREATE TABLE anomalies (
    anomaly_id      VARCHAR(64) PRIMARY KEY,
    txn_id          VARCHAR(64) NOT NULL REFERENCES transactions(txn_id),
    user_id         VARCHAR(64) NOT NULL REFERENCES users(user_id),
    isolation_score DECIMAL(10,6),
    rule_score      DECIMAL(10,6),
    final_score     DECIMAL(10,6),
    is_anomaly      BOOLEAN DEFAULT FALSE,
    anomaly_type    VARCHAR(64),
    triggered_rules JSONB
);

CREATE TABLE narratives (
    narrative_id    VARCHAR(64) PRIMARY KEY,
    anomaly_id      VARCHAR(64) NOT NULL REFERENCES anomalies(anomaly_id),
    user_id         VARCHAR(64) NOT NULL REFERENCES users(user_id),
    raw_text        TEXT NOT NULL,
    tts_audio_url   VARCHAR(512),
    model_used      VARCHAR(64),
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE upload_batches (
    batch_id     VARCHAR(64) PRIMARY KEY,
    user_id      VARCHAR(64) NOT NULL REFERENCES users(user_id),
    filename     VARCHAR(255),
    txn_count    INTEGER,
    status       VARCHAR(32) DEFAULT 'pending',
    error_msg    TEXT,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE MATERIALIZED VIEW daily_user_summary AS
SELECT u.user_id, DATE(t.txn_date) as day,
       COUNT(*) as txn_count, SUM(t.amount) as total_spend,
       COUNT(a.anomaly_id) as anomaly_count
FROM users u
JOIN transactions t ON u.user_id = t.user_id
LEFT JOIN anomalies a ON t.txn_id = a.txn_id AND a.is_anomaly = TRUE
GROUP BY u.user_id, DATE(t.txn_date);
```

**Actian-specific advantages:** columnar storage for fast aggregates on millions of txns, SQL UDFs for Z-score/rolling averages, Python UDFs for inference inside DB.

---

## 6. ML Pipeline

### Features per Transaction

```python
features = {
    "amount_zscore":         Z-score within user history,
    "amount_category_ratio": Amount / avg spend in same category,
    "hour_of_day":           0-23 (2-5 AM flagged),
    "day_of_week":           Weekend vs weekday deviation,
    "merchant_frequency":    How often merchant appears (rare = suspicious),
    "rolling_7d_avg":        7-day rolling avg of daily spend,
    "days_since_last_cat":   Gap since last txn in same category,
    "amount_log":            Log-transformed amount (handles skew),
}
```

### Scoring

```python
final_score = 0.6 * isolation_forest_score + 0.4 * rule_based_score

# Rule triggers
- Amount > 3x category average        → +0.30
- Transaction between 2-5 AM          → +0.20
- New merchant never seen before       → +0.15
- Amount exceeds 7d rolling avg by 2σ → +0.25
- Duplicate amount within 24h         → +0.10
```

**Threshold:** `final_score > 0.55` → flagged.

### Superplane Pipeline

```yaml
# canvas.yaml
workflows:
  ingest_and_analyze:
    triggers:
      - webhook: /webhook/csv-uploaded
    steps:
      - id: parse_csv
        component: python/script
        params: { script: scripts/parse.py }
      - id: store_raw
        component: actian/insert-batch
        params: { table: transactions }
      - id: compute_features
        component: python/script
        params: { script: scripts/features.py }
      - id: detect_anomalies
        component: python/script
        params: { script: scripts/detect.py }
      - id: store_anomalies
        component: actian/insert-batch
        params: { table: anomalies }
      - id: generate_narrative
        component: http/request
        params:
          url: "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
          headers: { Authorization: "Bearer ${{ secrets.GEMINI_API_KEY }}" }
          body: ${{ format_narrative_prompt(...) }}
      - id: generate_tts
        component: http/request
        params:
          url: "https://api.elevenlabs.io/v1/text-to-speech/${{ voices.voice_id }}"
          headers: { xi-api-key: "${{ secrets.ELEVENLABS_API_KEY }}" }
          body: { text: ${{ previous_step.output.text }}, voice_settings: { stability: 0.35 } }
```

---

## 7. Gemini Integration

```python
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_narrative(anomaly_details, user_patterns):
    prompt = f"""You are the Marauder's Map. Speak mischievously.
Given this anomalous financial data, explain in 2-3 sentences.
Amounts, merchants, timing. Do NOT give financial advice.

Data: {anomaly_details}
Context: {user_patterns}"""
    response = model.generate_content(prompt)
    return response.text
```

---

## 8. ElevenLabs Integration

```python
async def generate_tts(narrative_text: str) -> bytes:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
            headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]},
            json={
                "text": narrative_text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {"stability": 0.35, "similarity_boost": 0.75}
            }
        )
        return resp.content
```

Frontend plays the returned MP3 blob. voice_id varies by severity (Rachel for low, Michael for medium, Domi for high).

---

## 9. GitHub Integration

- **GitHub Actions:** CI/CD — run ML tests, lint, deploy on push
- **GitHub Issues (optional):** Auto-create issue when high-severity anomaly detected (via Superplane → GitHub create-issue component)

---

## 10. Theme Integration

| Element | Wizarding World |
|---------|----------------|
| Background | Aged parchment texture (#f5e6c8 sepia) |
| Map | SVG campus with spending cluster "locations" |
| Normal txns | Animated footprint dots |
| Anomalies | Glowing red footprints + "Mischief Managed" |
| Sidebar | Scroll-styled panel |
| Filters | "Moony, Wormtail, Padfoot, Prongs" tabs |
| Empty state | "The map is blank — tap it with your wand" |
| Voice | "The Map speaks..." — ElevenLabs narration |
| Fonts | Cinzel Decorative (headings) + Crimson Pro (body) |

---

## 11. Google Stitch Prompt

```
Build the frontend for "The Marauder's Ledger" — a Harry Potter themed financial
anomaly detection dashboard. Use React 18 + TypeScript + Vite + Tailwind CSS.

DESIGN: Aged parchment background (#f5e6c8 sepia + CSS noise). Fonts: Cinzel Decorative
(headings), Crimson Pro (body). Colors: sepia (#f5e6c8), ink (#2c1810), gold (#d4af37),
anomaly red (#dc2626). All animations via Framer Motion.

PAGES:
1. / — Landing page with UploadZone + "tap with your wand" empty state
2. /dashboard — SVG Marauder's Map + sidebar + anomaly list
3. /anomaly/:id — Detail with narrative + voice playback

COMPONENTS:
- UploadZone: drag-drop CSV, ink-spreading progress, "Load sample" button
- MaraudersMap: pannable/zoomable SVG, spending cluster locations, footprint dots animate
  between them, anomalies pulse red glow, click opens detail panel
- MessrsTabs: filter by "Moony"(Food), "Wormtail"(Shopping), "Padfoot"(Bills), "Prongs"(All)
- AnomalyPanel: slide-in right panel with merchant/amount/time/severity + scroll narrative
- NarrativeCard: styled as aged scroll, typewriter text animation on load
- VoiceNarration: play/pause button with waveform, loading spinner during TTS gen
- SeverityBadge: "Peeves"(green), "Boggart"(amber), "Dementor"(red) with icons
- SpendTrendChart (Recharts): line chart, anomaly points as red dots, tooltips
- LoadingInk: ink blob spreading animation (Framer Motion path draw)
- EmptyMap: blank parchment, "tap with your wand" text, wand cursor

DATA FLOW:
- Upload: POST /api/upload (FormData) → batch_id
- Poll GET /api/batches/:batch_id until status=completed
- Load: GET /api/anomalies?user_id=xxx
- GET /api/narratives/:anomaly_id for text
- GET /api/narratives/:anomaly_id/audio returns MP3 blob

STATE: React Context for session, TanStack Query for API caching, WebSocket for
real-time progress. Mobile: map with bottom sheet. Desktop: full map + right sidebar.
Lazy load SVG map, virtualized txn list, cache audio in IndexedDB.
```

---

## 12. Sprint Plan

### Pre-Hackathon
- [ ] GitHub repo, folder structure, Actian DB instance provisioned
- [ ] Design SVG map layout (Figma)
- [ ] Prepare 2-3 sample CSV datasets
- [ ] Get Gemini + ElevenLabs API keys
- [ ] Deploy Superplane (Docker compose)

### Day 1 — 10 Hours (Foundation)
| Hour | Task |
|------|------|
| 0-1 | Repo + deps + Actian DB connection verified |
| 1-3 | Backend: CSV parser + Actian insert endpoint |
| 1-3 | Frontend: Parchment layout + SVG map skeleton |
| 3-5 | Backend: Feature engineering + Isolation Forest pipeline |
| 3-5 | Frontend: Map with hardcoded sample clusters |
| 5-7 | Integration: Upload CSV → analyze → display on map |
| 7-8 | Backend: Gemini narrative endpoint |
| 8-9 | Frontend: Anomaly panel + NarrativeCard + typewriter |
| 9-10 | Testing: Full pipeline end-to-end |

**Day 1 Goal:** Upload CSV → anomalies on map → read narrative

### Day 2 — 17 Hours
| Hour | Task |
|------|------|
| 10-12 | Footprint animations + anomaly glow (Framer Motion) |
| 10-12 | Actian DB materialized views + dashboard aggregates |
| 12-14 | ElevenLabs TTS + audio playback UI |
| 12-14 | Superplane workflow: daily audit pipeline |
| 14-16 | "Messrs" filter tabs |
| 16-18 | Spend trend chart (Recharts) with anomaly markers |
| 18-20 | GitHub Actions CI/CD setup |
| 20-22 | Edge cases: empty CSV, malformed data |
| 22-25 | Buffer + bug fixes |

### Day 3 — 18 Hours (Demo Prep)
| Hour | Task |
|------|------|
| 25-28 | Seed compelling demo data |
| 28-31 | Walkthrough rehearsal 3x |
| 31-33 | Pitch deck: 5 slides |
| 33-35 | Backup demo video |
| 35-38 | Final UI polish: transitions, voice playback |
| 38-40 | README + submission |
| 40-45 | Contingency + final rehearsal |

---

## 13. Pitch Script (90s)

```
[15s] "Every year, individuals lose thousands to unnoticed fraud and subscription
drains. Banks send a text. We give you the Marauder's Map."

[15s] "The Marauder's Ledger analyzes transactions using ML — Isolation Forest + rules —
and explains anomalies in plain English via Gemini AI. Then reads them aloud
via ElevenLabs. All stored in Actian DB."

[40s DEMO] "I'll upload my UPI statement..." [Map populates, anomalies glow red]
"Three charges at 3 AM from an unknown merchant totaling ₹4,800." [Click → Gemini
narrative appears → ElevenLabs reads it aloud] "Caught in under 2 seconds."

[10s] "Actian DB for storage, scikit-learn for detection, Gemini for narrative,
ElevenLabs for voice, Superplane for orchestration, GitHub Actions for CI/CD."

[10s] "Financial anomaly detection is a multi-billion dollar industry. We made it
accessible, understandable, and magical."
```

---

## 14. Judging Criteria

| Criteria | Delivery |
|----------|----------|
| Innovation | ML anomaly detection + LLM narrative + TTS voice |
| Complexity | Full ML pipeline + Gemini + ElevenLabs + Superplane + Actian |
| Theme | Deep Marauder's Map integration at every level |
| Working Demo | Upload → detect → narrate → speak in <10s |
| Real-World Impact | Financial fraud detection for students |
| Prerequisites | Actian DB ✅ Superplane ✅ GitHub ✅ Gemini ✅ ElevenLabs ✅ |
