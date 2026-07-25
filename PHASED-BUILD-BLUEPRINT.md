# The Marauder's Ledger — Phased Build Blueprint

> **Total Build Time:** 30 Hours
> **Pre-Hackathon Work Done:** ML model trained, sample CSVs generated
> **Remaining Work:** Full-stack app, DB, integrations, CI/CD, demo
> **Goal:** Upload CSV → detect anomalies → visualize on Marauder's Map → narrate via Gemini → voice via ElevenLabs

---

## Build Progress (Updated: Phase 4 — COMPLETE ✅)

| Phase | Status | Hours Used | Notes |
|-------|--------|------------|-------|
| Phase 0 — Scaffolding | ✅ Done | 2 | Backend + Frontend scaffolded, in-memory DB |
| Phase 1 — Backend Core | ✅ Done | 4 | CSV upload, ML inference, all endpoints working |
| Phase 2 — Frontend Core | ✅ Done | 3 | Landing page, upload, AnomalyCard, FilterTabs |
| Phase 3 — Marauder's Map SVG | ✅ Done | 4 | Full SVG map with zoom, ink wipe, footprint trails |
| Phase 4 — Anomaly Detail Panel | ✅ Done | 2 | Gauges, narrative, audio, tethered txns, Mark Valid/Confirm |
| Phase 5 — Stitch Prototypes (NEW) | ✅ Done | 3 | MischiefList, Vault, Pensieve, OwlPost, Profile + SidebarNav |
| Phase 6 — Narrative & TTS | ✅ Done | 1 | Gemini fallback narratives, ElevenLabs 501 handling, AudioPlayer error state |
| Phase 7 — Celery/Docker | ✅ Done | 1 | Dockerfiles for backend + frontend, docker-compose, nginx reverse proxy |
| Phase 8 — CI/CD | ✅ Done | 0.5 | GitHub Actions workflow (backend lint+test, frontend tsc+build) |
| Phase 9 — Testing & Bug Fixes | ✅ Done | 1 | 6/6 E2E tests passing, toast notifications, page transitions |
| Phase 10 — Final Polish | ✅ Done | 1 | Toast system, AudioPlayer error states, AnimatePresence |
| **TOTAL** | | **23.5/30** | |

### Stitch Prototype Features Implemented (All 20)
1. ✅ Header — Logo, profile, notifications, wax-seal
2. ✅ Footer — Ministry of Magic stamp, parchment-edge
3. ✅ SidebarNav — Great Hall navigation (7 routes)
4. ✅ ScoreGauge — SVG ring gauge with color + description
5. ✅ AnomalyCard — Moony/Wormtail/Padfoot/Prongs tabs, location pins, impact values
6. ✅ FilterTabs — Category + severity dropdowns
7. ✅ UploadZone — Drag-drop CSV with parchment border, loading state
8. ✅ MaraudersMap — Zoom controls, animated footprint trails, ink wipe "Mischief Managed"
9. ✅ SpendChart — Recharts with tooltip, legend, ink/gold colors
10. ✅ NarrativeCard — Typewriter effect, parchment divination report styling
11. ✅ AudioPlayer — Static waveform bars, playback controls
12. ✅ SeverityBadge — Dementor/Boggart/Peeves with pulsing dot
13. ✅ MischiefList — Historical data table with search/filter, severity filter, pagination
14. ✅ Vault — Gringotts account summary, balance, stats, transaction table
15. ✅ Pensieve — Deep analysis with spending categories, risk breakdown, time filters
16. ✅ OwlPost — Notifications with read/unread, mark all read, severity icons
17. ✅ Profile — Wizard's dossier, skills bars, recent cases, stats grid
18. ✅ AnomalyDetail — Mark Valid, Confirm Mischief, tethered transactions
19. ✅ Landing — Compass rose spin, upload card, investigation cards
20. ✅ Full CSS Design System — All animations, parchment-edge, wax-seal, shimmer
21. ✅ Toast Notification System — Success/error toasts on upload
22. ✅ Page Transitions — AnimatePresence for smooth route changes
23. ✅ AudioPlayer Error State — Graceful fallback when TTS unavailable
24. ✅ E2E Test Suite — 6 tests covering full API flow

---

## Pre-Build Checklist (Already Done ✅)

| Item | Status | Files |
|------|--------|-------|
| ML model trained (RF + GB + IF + LOF + OCSVM) | ✅ | `models/*.pkl` |
| Inference code ready | ✅ | `inference.py` |
| Test suite passing | ✅ | `test_model.py` |
| Sample CSVs generated | ✅ | `data/normal.csv`, `data/compromised.csv`, `data/mixed.csv` |
| Training/test data | ✅ | `data/training_data.csv`, `data/test_data.csv` |
| Model metadata | ✅ | `models/model_metadata.json`, `models/fit_stats.json` |

---

## Phase 0 — Project Scaffolding & Infrastructure (Hours 0-2)

**Goal:** Empty app running, DB connected, API keys ready

### 0.1 — Folder Structure (15 min)

```
marauders-ledger/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── assets/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + routes
│   │   ├── database.py          # Actian DB connection
│   │   ├── inference.py         # ML inference (copy from root)
│   │   ├── schemas.py           # Pydantic models
│   │   ├── gemini.py            # Gemini narrative gen
│   │   ├── tts.py               # ElevenLabs TTS
│   │   └── celery_app.py        # Celery config
│   ├── models/                  # .pkl files (copy from root)
│   │   ├── rf_model.pkl
│   │   ├── gb_model.pkl
│   │   ├── anomaly_model.pkl
│   │   ├── lof_model.pkl
│   │   ├── ocsvm_model.pkl
│   │   ├── scaler.pkl
│   │   ├── feature_columns.pkl
│   │   ├── fit_stats.json
│   │   └── model_metadata.json
│   ├── scripts/                 # Superplane scripts
│   │   ├── parse_csv.py
│   │   ├── features.py
│   │   └── detect.py
│   ├── requirements.txt
│   └── Dockerfile
├── superplane/
│   └── canvas.yaml              # Orchestration workflow
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions
├── data/                        # Sample CSVs
│   ├── normal.csv
│   ├── compromised.csv
│   └── mixed.csv
├── docker-compose.yml           # Backend + Redis + Celery
├── .env.example
├── .gitignore
└── README.md
```

**Action items:**
- [ ] Create directory structure
- [ ] Move model files to `backend/models/`
- [ ] Copy `inference.py` to `backend/app/`
- [ ] Create `.gitignore` (node_modules, .env, __pycache__, *.pkl)
- [ ] Initialize git repo (if not already)

### 0.2 — Backend Setup (30 min)

**Action items:**
- [ ] Create `backend/requirements.txt`:
  ```
  fastapi==0.111.0
  uvicorn[standard]==0.30.1
  python-multipart==0.0.9
  pandas>=2.0
  numpy>=1.24
  scikit-learn>=1.3
  joblib>=1.3
  httpx>=0.27
  google-generativeai>=0.5
  celery[redis]>=5.4
  redis>=5.0
  pyodbc>=4.0
  python-dotenv>=1.0
  ```
- [ ] Create `backend/app/__init__.py`
- [ ] Create `backend/app/main.py` with FastAPI app skeleton:
  - `POST /api/upload` — accept CSV
  - `POST /api/analyze` — run inference
  - `GET /api/anomalies` — fetch anomalies for user
  - `GET /api/narratives/{id}` — get narrative text
  - `GET /api/narratives/{id}/audio` — get TTS audio
  - `GET /api/health` — health check
- [ ] Create `backend/app/schemas.py` with Pydantic models
- [ ] Verify: `uvicorn app.main:app --reload` starts

### 0.3 — Frontend Setup (30 min)

**Action items:**
- [ ] Scaffold: `npm create vite@latest frontend -- --template react-ts`
- [ ] Install deps:
  ```bash
  npm install tailwindcss @tailwindcss/vite framer-motion recharts react-dropzone axios tanstack-react-query react-router-dom
  ```
- [ ] Configure Tailwind with parchment palette:
  ```ts
  // tailwind.config.ts
  colors: {
    parchment: '#f5e6c8',
    ink: '#2c1810',
    gold: '#d4af37',
    blood: '#dc2626',
    emerald: '#2d6a4f',
  }
  ```
- [ ] Add Google Fonts: Cinzel Decorative + Crimson Pro (in `index.html`)
- [ ] Set up `react-router-dom` with routes:
  - `/` — Landing + Upload
  - `/dashboard` — Map + Sidebar
  - `/anomaly/:id` — Detail panel
- [ ] Verify: `npm run dev` shows parchment background

### 0.4 — API Keys & External Services (30 min)

**Action items:**
- [ ] Create `.env` file:
  ```
  GEMINI_API_KEY=your_key_here
  ELEVENLABS_API_KEY=your_key_here
  ACTIAN_HOST=your_host
  ACTIAN_PORT=your_port
  ACTIAN_DATABASE=your_db
  ACTIAN_USER=your_user
  ACTIAN_PASSWORD=your_password
  REDIS_URL=redis://localhost:6379/0
  ```
- [ ] Test Gemini API:
  ```bash
  curl -H "Content-Type: application/json" \
       -H "x-goog-api-key: $GEMINI_API_KEY" \
       -d '{"contents":[{"parts":[{"text":"Say hello as the Marauders Map"}]}]}' \
       "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
  ```
- [ ] Test ElevenLabs API:
  ```bash
  curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
       -H "xi-api-key: $ELEVENLABS_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{"text":"Mischief managed.","voice_settings":{"stability":0.3,"similarity_boost":0.7}}' \
       --output test.mp3
  ```
- [ ] Verify both return valid responses

### 0.5 — Actian DB Setup (15 min)

**Action items:**
- [ ] Connect to Actian Data Platform
- [ ] Run schema creation SQL (from spec section 5):
  - `users` table
  - `transactions` table
  - `transaction_features` table
  - `anomalies` table
  - `narratives` table
  - `upload_batches` table
  - `daily_user_summary` materialized view
- [ ] Verify connection: `SELECT 1`
- [ ] Create `backend/app/database.py` with connection helper

**Phase 0 Deliverables:**
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Actian DB connected
- [ ] API keys working
- [ ] All 3 services responding

---

## Phase 1 — Backend Core: CSV Upload & ML Pipeline (Hours 2-6)

**Goal:** Upload CSV → store in Actian → detect anomalies → return results

### 1.1 — CSV Parser & Upload Endpoint (1.5 hr)

**Action items:**
- [ ] Implement `POST /api/upload`:
  - Accept `multipart/form-data` with CSV file
  - Parse CSV with Pandas
  - Validate columns: `amount`, `category`, `merchant`, `hour`, `day`
  - Insert rows into `transactions` table in Actian
  - Create `upload_batches` record with status `processing`
  - Return `batch_id`
- [ ] Create `backend/app/schemas.py`:
  ```python
  class Transaction(BaseModel):
      amount: float
      category: str
      merchant: str
      hour: int
      day: int
      timestamp: Optional[datetime]

  class AnomalyResult(BaseModel):
      txn_id: str
      amount: float
      category: str
      merchant: str
      hour: int
      isolation_score: float
      rule_score: float
      final_score: float
      is_anomaly: bool
      severity: str
      triggered_rules: List[str]

  class BatchResponse(BaseModel):
      batch_id: str
      status: str
      txn_count: int
  ```
- [ ] Test with `curl`:
  ```bash
  curl -X POST -F "file=@data/compromised.csv" http://localhost:8000/api/upload
  ```

### 1.2 — Analysis Endpoint (1.5 hr)

**Action items:**
- [ ] Implement `POST /api/analyze`:
  - Accept `batch_id` parameter
  - Load transactions from Actian for this batch
  - Call `detect_anomalies()` from `inference.py`
  - Store results in `anomalies` table
  - Update `upload_batches` status to `completed`
  - Return anomaly count + summary
- [ ] Load ML models at startup (in `main.py`):
  ```python
  from inference import load_models
  load_models("backend/models")
  ```
- [ ] Test end-to-end:
  ```bash
  # Upload
  curl -X POST -F "file=@data/compromised.csv" http://localhost:8000/api/upload
  # Returns: {"batch_id": "abc123", "status": "processing", "txn_count": 50}

  # Analyze
  curl -X POST "http://localhost:8000/api/analyze?batch_id=abc123"
  # Returns: {"anomalies_found": 3, "total_txns": 50, "status": "completed"}
  ```

### 1.3 — Anomaly Fetch Endpoints (1 hr)

**Action items:**
- [ ] Implement `GET /api/anomalies?user_id=xxx`:
  - Query anomalies table
  - Return list of anomalies with scores, severity, triggered rules
  - Support filtering by severity
- [ ] Implement `GET /api/anomalies/{anomaly_id}`:
  - Return single anomaly detail
- [ ] Implement `GET /api/transactions?user_id=xxx`:
  - Return all transactions for map visualization
- [ ] Test each endpoint returns correct data

### 1.4 — Database Helpers (1 hr)

**Action items:**
- [ ] Complete `backend/app/database.py`:
  ```python
  async def get_connection():
      # Actian DB connection via pyodbc or actian connector

  async def insert_transactions(txns: List[dict], user_id: str):
      # INSERT INTO transactions ...

  async def insert_anomalies(anomalies: List[dict], user_id: str):
      # INSERT INTO anomalies ...

  async def get_user_transactions(user_id: str):
      # SELECT * FROM transactions WHERE user_id = ?

  async def get_user_anomalies(user_id: str):
      # SELECT * FROM anomalies WHERE user_id = ? AND is_anomaly = TRUE

  async def get_batch_status(batch_id: str):
      # SELECT status FROM upload_batches WHERE batch_id = ?
  ```
- [ ] Test each DB function independently

**Phase 1 Deliverables:**
- [ ] CSV upload works → data in Actian DB
- [ ] Analysis endpoint runs ML → anomalies detected and stored
- [ ] Fetch endpoints return correct data
- [ ] Full pipeline: upload → analyze → fetch works

---

## Phase 2 — Frontend Core: Landing & Upload (Hours 6-9)

**Goal:** User can upload CSV and see upload progress

### 2.1 — Layout & Theme (1 hr)

**Action items:**
- [ ] Create `src/App.tsx` with router
- [ ] Create `src/components/Layout.tsx`:
  - Parchment background (#f5e6c8)
  - Cinzel Decorative headings
  - Crimson Pro body text
  - Ink-colored (#2c1810) text
- [ ] Create `src/context/AppContext.tsx`:
  - Current user state
  - Upload batch state
  - Anomaly data state
- [ ] Set up TanStack Query provider

### 2.2 — Landing Page (1 hr)

**Action items:**
- [ ] Create `src/pages/Landing.tsx`:
  - Title: "The Marauder's Ledger"
  - Tagline: "I solemnly swear I am up to no good"
  - UploadZone component
  - Empty state: "The map is blank — tap it with your wand"
  - "Load Sample" button (loads compromised.csv)
- [ ] Create `src/components/UploadZone.tsx`:
  - Drag-drop CSV area
  - File validation (check .csv, check columns)
  - Loading state: ink blob spreading animation
  - Success state: redirect to dashboard

### 2.3 — Upload Integration (1 hr)

**Action items:**
- [ ] Wire UploadZone → `POST /api/upload`
- [ ] Show upload progress (ink-spreading animation)
- [ ] On success → redirect to `/dashboard?batch_id=xxx`
- [ ] Handle errors (wrong file type, missing columns)
- [ ] Create `src/services/api.ts`:
  ```typescript
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  export const uploadCSV = async (file: File) => { ... };
  export const analyzeBatch = async (batchId: string) => { ... };
  export const getAnomalies = async (userId: string) => { ... };
  export const getNarrative = async (anomalyId: string) => { ... };
  export const getAudio = async (anomalyId: string) => { ... };
  ```

### 2.4 — Loading & Empty States (1 hr)

**Action items:**
- [ ] Create `src/components/LoadingInk.tsx`:
  - Framer Motion ink blob animation
  - Progress text: "Analyzing your transactions..."
- [ ] Create `src/components/EmptyMap.tsx`:
  - Blank parchment SVG
  - "The map is blank — tap it with your wand"
  - Wand cursor icon
- [ ] Create `src/components/ErrorState.tsx`:
  - Styled error message
  - Retry button

**Phase 2 Deliverables:**
- [ ] Landing page renders with parchment theme
- [ ] CSV upload works end-to-end
- [ ] Loading states show during processing
- [ ] Redirects to dashboard after upload

---

## Phase 3 — Marauder's Map SVG (Hours 9-13)

**Goal:** Interactive SVG map showing spending clusters and anomalies

### 3.1 — SVG Map Design (2 hr)

**Action items:**
- [ ] Create `src/components/MaraudersMap.tsx`:
  - Pannable/zoomable SVG container
  - 5 location clusters (spending categories):
    - 🏰 Hogwarts (Food) — top center
    - 🧙 Hogsmeade (Shopping) — left
    - 🏦 Gringotts (Bills) — right
    - 🎭 Diagon Alley (Entertainment) — bottom left
    - 🚂 Platform 9¾ (Travel) — bottom right
  - Connecting paths between locations
  - Parchment texture background
- [ ] Create SVG assets:
  - `src/assets/map-bg.svg` — parchment background
  - Location icons for each cluster
- [ ] Implement pan/zoom with Framer Motion:
  ```tsx
  <motion.svg
    viewBox="0 0 1000 600"
    animate={{ scale, x, y }}
    transition={{ type: "spring" }}
  >
    {/* Map content */}
  </motion.svg>
  ```

### 3.2 — Transaction Footprints (1.5 hr)

**Action items:**
- [ ] Create `src/components/FootprintDot.tsx`:
  - Small animated dot on map
  - Position based on category + amount
  - Color: ink (#2c1810) for normal
  - Framer Motion entrance animation (fade in + scale)
- [ ] Animate footprints appearing:
  ```tsx
  <motion.circle
    cx={x} cy={y} r={4}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: index * 0.05 }}
  />
  ```
- [ ] Group footprints by category → show at correct location

### 3.3 — Anomaly Glow (1 hr)

**Action items:**
- [ ] Create `src/components/AnomalyMarker.tsx`:
  - Red glowing circle (#dc2626)
  - Pulse animation (Framer Motion)
  - Click handler → opens detail panel
  - Severity-based size (high = bigger)
  ```tsx
  <motion.circle
    cx={x} cy={y} r={8}
    fill="#dc2626"
    animate={{
      filter: ["drop-shadow(0 0 4px #dc2626)", "drop-shadow(0 0 12px #dc2626)", "drop-shadow(0 0 4px #dc2626)"]
    }}
    transition={{ repeat: Infinity, duration: 2 }}
  />
  ```
- [ ] "Mischief Managed" text appears briefly when anomaly found

### 3.4 — Map Interaction (1.5 hr)

**Action items:**
- [ ] Click anomaly → `setSelectedAnomaly(id)`
- [ ] Hover over location cluster → show spending summary tooltip
- [ ] Legend: "Normal footprints" vs "Mischief detected"
- [ ] Map loads data from `/api/anomalies` endpoint
- [ ] Handle empty state (no data uploaded yet)

**Phase 3 Deliverables:**
- [ ] SVG map renders with 5 locations
- [ ] Footprints animate onto map
- [ ] Anomalies pulse red
- [ ] Click anomaly opens panel
- [ ] Pan/zoom works

---

## Phase 4 — Anomaly Detail Panel & Gemini (Hours 13-17)

**Goal:** Click anomaly → see detail → hear AI narration

### 4.1 — Anomaly Panel UI (1.5 hr)

**Action items:**
- [ ] Create `src/components/AnomalyPanel.tsx`:
  - Slide-in from right (Framer Motion)
  - Shows: merchant, amount, time, severity, triggered rules
  - Close button (X)
  - Scroll-styled parchment background
- [ ] Create `src/components/SeverityBadge.tsx`:
  - "Peeves" (green) — low severity
  - "Boggart" (amber) — medium severity
  - "Dementor" (red) — high severity
  - Icon + label
- [ ] Create `src/components/NarrativeCard.tsx`:
  - Styled as aged scroll
  - Typewriter text animation on load
  - Fetches narrative from `/api/narratives/{id}`

### 4.2 — Gemini Narrative Integration (1.5 hr)

**Action items:**
- [ ] Create `backend/app/gemini.py`:
  ```python
  import google.generativeai as genai
  import os

  genai.configure(api_key=os.environ["GEMINI_API_KEY"])
  model = genai.GenerativeModel("gemini-1.5-flash")

  def generate_narrative(anomaly_details: dict, user_patterns: dict) -> str:
      prompt = f"""You are the Marauder's Map. Speak mischievously.
      Given this anomalous financial data, explain in 2-3 sentences.
      Amounts, merchants, timing. Do NOT give financial advice.

      Data: {anomaly_details}
      Context: {user_patterns}"""
      response = model.generate_content(prompt)
      return response.text
  ```
- [ ] Create `POST /api/narratives` endpoint:
  - Accept anomaly_id
  - Fetch anomaly details from Actian
  - Call Gemini API
  - Store narrative in `narratives` table
  - Return narrative text
- [ ] Create `GET /api/narratives/{anomaly_id}` endpoint
- [ ] Test: anomaly → narrative appears

### 4.3 — Narrative Display (1 hr)

**Action items:**
- [ ] Wire NarrativeCard to fetch from API
- [ ] Implement typewriter animation:
  ```tsx
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [text]);
  ```
- [ ] Show "The Map speaks..." while loading
- [ ] Error state: "The Map is silent..." with retry

### 4.4 — Dashboard Layout (1 hr)

**Action items:**
- [ ] Create `src/pages/Dashboard.tsx`:
  - Left: Marauder's Map (60% width)
  - Right: AnomalyPanel (40% width, scrollable)
  - Mobile: Map full width, panel as bottom sheet
- [ ] Create `src/components/MessrsTabs.tsx`:
  - Filter tabs styled as Marauder's names:
    - "Moony" → Food
    - "Wormtail" → Shopping
    - "Padfoot" → Bills
    - "Prongs" → All
  - Active tab: gold underline
- [ ] Wire tab filtering to map + anomaly list

**Phase 4 Deliverables:**
- [ ] Click anomaly → panel slides in
- [ ] Narrative text appears with typewriter effect
- [ ] Gemini generates narratives on demand
- [ ] Tabs filter by category
- [ ] Dashboard layout responsive

---

## Phase 5 — ElevenLabs TTS & Audio (Hours 17-19)

**Goal:** Play AI-narrated audio for each anomaly

### 5.1 — TTS Backend (1 hr)

**Action items:**
- [ ] Create `backend/app/tts.py`:
  ```python
  import httpx
  import os

  VOICES = {
      "low": "21m00Tcm4TlvDq8ikWAM",      # Rachel
      "medium": "pNInz6obpgDQGcFmaJgB",   # Adam
      "high": "ErXwobaYiN019PkySvjV",      # Antoni
  }

  async def generate_tts(text: str, severity: str) -> bytes:
      voice_id = VOICES.get(severity, VOICES["medium"])
      async with httpx.AsyncClient() as client:
          resp = await client.post(
              f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
              headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]},
              json={
                  "text": text,
                  "model_id": "eleven_monolingual_v1",
                  "voice_settings": {"stability": 0.35, "similarity_boost": 0.75}
              }
          )
          return resp.content
  ```
- [ ] Create `POST /api/tts` endpoint:
  - Accept narrative_id
  - Fetch narrative text from DB
  - Call ElevenLabs API
  - Return audio as MP3 stream
- [ ] Test: narrative → audio file

### 5.2 — Audio Playback UI (1 hr)

**Action items:**
- [ ] Create `src/components/VoiceNarration.tsx`:
  - Play/Pause button with waveform icon
  - Loading spinner during TTS generation
  - Audio player (HTML5 Audio element)
  - Waveform visualization (simple CSS bars)
  - "The Map speaks..." text while loading
- [ ] Wire to `/api/tts` endpoint
- [ ] Cache audio in IndexedDB for replay:
  ```typescript
  const cacheAudio = async (anomalyId: string, audioBlob: Blob) => {
    const db = await openDB('marauders-audio', 1, {
      upgrade(db) { db.createObjectStore('audio'); }
    });
    await db.put('audio', audioBlob, anomalyId);
  };
  ```
- [ ] Integrate into AnomalyPanel

**Phase 5 Deliverables:**
- [ ] TTS generates audio from narrative text
- [ ] Play/Pause button works
- [ ] Different voices for different severity levels
- [ ] Audio caches for replay

---

## Phase 6 — Spend Trend Chart & Polish (Hours 19-22)

**Goal:** Charts, filters, responsive design, UI polish

### 6.1 — Spend Trend Chart (1.5 hr)

**Action items:**
- [ ] Create `src/components/SpendTrendChart.tsx`:
  - Recharts line chart
  - X-axis: date, Y-axis: amount
  - Normal points: ink color
  - Anomaly points: red dots with pulse
  - Tooltips on hover
- [ ] Wire to transaction data
- [ ] Add to dashboard (below map or in sidebar)

### 6.2 — MessrsTabs Full Implementation (1 hr)

**Action items:**
- [ ] Complete 4 tabs: Moony, Wormtail, Padfoot, Prongs
- [ ] Filter logic:
  - Moony → Food transactions only
  - Wormtail → Shopping only
  - Padfoot → Bills only
  - Prongs → All categories
- [ ] Active tab: gold (#d4af37) underline + bold
- [ ] Filter updates map + anomaly list

### 6.3 — Responsive Design (1 hr)

**Action items:**
- [ ] Mobile (< 768px):
  - Map full width
  - AnomalyPanel as bottom sheet (drag up)
  - Tabs scroll horizontally
  - Upload zone full width
- [ ] Tablet (768-1024px):
  - Map 50%, Panel 50%
- [ ] Desktop (> 1024px):
  - Map 60%, Panel 40%
  - Full sidebar

### 6.4 — UI Polish (1.5 hr)

**Action items:**
- [ ] Framer Motion page transitions:
  ```tsx
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {children}
  </motion.div>
  ```
- [ ] Hover effects on all interactive elements
- [ ] Loading skeletons for data fetching
- [ ] Gold (#d4af37) accents on buttons, borders
- [ ] Scroll-styled panels (subtle parchment texture)
- [ ] Fix any visual bugs

**Phase 6 Deliverables:**
- [ ] Spend trend chart with anomaly markers
- [ ] Tab filtering works correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Animations smooth and polished

---

## Phase 7 — Celery, Superplane & Async Pipeline (Hours 22-24)

**Goal:** Background processing, orchestration

### 7.1 — Celery Setup (1 hr)

**Action items:**
- [ ] Create `backend/app/celery_app.py`:
  ```python
  from celery import Celery
  import os

  celery = Celery(
      "marauders",
      broker=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
      backend=os.environ.get("REDIS_URL", "redis://localhost:6379/0")
  )
  ```
- [ ] Create `backend/app/tasks.py`:
  ```python
  @celery.task
  def process_upload(batch_id: str, user_id: str):
      # 1. Parse CSV from upload_batches
      # 2. Insert into transactions
      # 3. Run detect_anomalies()
      # 4. Insert anomalies
      # 5. Generate narratives via Gemini
      # 6. Generate TTS via ElevenLabs
      # 7. Update batch status to completed
  ```
- [ ] Update `/api/upload` to dispatch Celery task
- [ ] Add polling endpoint: `GET /api/batches/{batch_id}`

### 7.2 — Docker Compose (0.5 hr)

**Action items:**
- [ ] Create `docker-compose.yml`:
  ```yaml
  services:
    backend:
      build: ./backend
      ports: ["8000:8000"]
      env_file: .env
      depends_on: [redis]
    redis:
      image: redis:7-alpine
      ports: ["6379:6379"]
    celery:
      build: ./backend
      command: celery -A app.celery_app worker
      depends_on: [redis, backend]
  ```
- [ ] Test: `docker-compose up`

### 7.3 — Superplane Workflow (0.5 hr)

**Action items:**
- [ ] Create `superplane/canvas.yaml`:
  ```yaml
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
        - id: generate_tts
          component: http/request
          params:
            url: "https://api.elevenlabs.io/v1/text-to-speech/${{ voices.voice_id }}"
            headers: { xi-api-key: "${{ secrets.ELEVENLABS_API_KEY }}" }
  ```
- [ ] Create `backend/scripts/parse_csv.py`, `features.py`, `detect.py`
- [ ] Verify Superplane dashboard loads

**Phase 7 Deliverables:**
- [ ] Celery processes uploads in background
- [ ] Docker Compose runs all services
- [ ] Superplane workflow defined
- [ ] Async pipeline: upload → parse → detect → narrate → TTS

---

## Phase 8 — CI/CD & GitHub Actions (Hours 24-25)

**Goal:** Automated testing and deployment

### 8.1 — GitHub Actions CI (1 hr)

**Action items:**
- [ ] Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    backend-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with: { python-version: '3.11' }
        - run: pip install -r backend/requirements.txt
        - run: cd backend && python -m pytest tests/ -v

    frontend-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - run: cd frontend && npm ci && npm run build

    lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with: { python-version: '3.11' }
        - run: pip install ruff
        - run: ruff check backend/
  ```
- [ ] Create basic backend tests in `backend/tests/`
- [ ] Push and verify CI passes

**Phase 8 Deliverables:**
- [ ] GitHub Actions runs on push
- [ ] Backend tests pass
- [ ] Frontend builds successfully
- [ ] Linting passes

---

## Phase 9 — Demo Data, Testing & Bug Fixes (Hours 25-28)

**Goal:** Working demo, edge cases handled, bugs fixed

### 9.1 — Seed Demo Data (1 hr)

**Action items:**
- [ ] Create demo user in Actian DB
- [ ] Upload `compromised.csv` as demo data
- [ ] Ensure 3 anomalies appear on map
- [ ] Verify narratives generate correctly
- [ ] Verify TTS audio plays

### 9.2 — Edge Cases (1 hr)

**Action items:**
- [ ] Empty CSV upload → graceful error
- [ ] Malformed CSV → validation error message
- [ ] No anomalies found → "No mischief detected" message
- [ ] API timeout → retry logic
- [ ] Large file (1000+ rows) → handle gracefully
- [ ] Special characters in merchant names

### 9.3 — End-to-End Testing (1 hr)

**Action items:**
- [ ] Test full flow 3x:
  1. Open app → see empty map
  2. Upload compromised.csv
  3. Map populates with footprints
  4. 3 anomalies pulse red
  5. Click anomaly → panel slides in
  6. Narrative appears with typewriter
  7. Click play → audio reads aloud
  8. Filter with tabs
  9. View spend trend chart
- [ ] Fix any bugs found

### 9.4 — Bug Fixes (1 hr)

**Action items:**
- [ ] Fix all P0 bugs (blocking demo)
- [ ] Fix all P1 bugs (visible during demo)
- [ ] Document P2 bugs (won't fix before demo)

**Phase 9 Deliverables:**
- [ ] Demo data seeded
- [ ] Edge cases handled
- [ ] Full flow works 3x without errors
- [ ] All blocking bugs fixed

---

## Phase 10 — Final Polish & Demo Prep (Hours 28-30)

**Goal:** Demo-ready, pitch deck, backup plan

### 10.1 — Final UI Polish (1 hr)

**Action items:**
- [ ] Smooth page transitions
- [ ] Consistent spacing and typography
- [ ] Gold accents on all interactive elements
- [ ] Loading states for every async operation
- [ ] Error states with retry buttons
- [ ] "Mischief Managed" toast on successful analysis
- [ ] Voice narration button prominent

### 10.2 — README & Documentation (0.5 hr)

**Action items:**
- [ ] Create `README.md`:
  - Project description
  - Architecture diagram
  - Setup instructions
  - API documentation
  - Demo screenshots
- [ ] Add `.env.example` with all required vars

### 10.3 — Demo Rehearsal (0.5 hr)

**Action items:**
- [ ] Run through demo flow 3x
- [ ] Time each step
- [ ] Identify any slowdowns
- [ ] Prepare talking points for each feature

### 10.4 — Backup Plan (0.5 hr)

**Action items:**
- [ ] If Actian DB fails → fallback to SQLite (same schema)
- [ ] If Gemini fails → pre-written template narratives
- [ ] If ElevenLabs fails → skip voice (still impressive)
- [ ] If Superplane fails → manual pipeline execution
- [ ] If everything fails → pre-recorded demo video

**Phase 10 Deliverables:**
- [ ] UI polished and consistent
- [ ] README complete
- [ ] Demo rehearsed 3x
- [ ] Backup plans documented

---

## Hour-by-Hour Summary

| Hour | Phase | Task | Deliverable |
|------|-------|------|-------------|
| 0-0.25 | 0.1 | Folder structure | Directory tree created |
| 0.25-0.75 | 0.2 | Backend setup | FastAPI starts |
| 0.75-1.25 | 0.3 | Frontend setup | React app starts |
| 1.25-1.75 | 0.4 | API keys | Gemini + ElevenLabs working |
| 1.75-2 | 0.5 | Actian DB | DB connected + schema |
| 2-3.5 | 1.1 | CSV parser | Upload endpoint works |
| 3.5-5 | 1.2 | Analysis endpoint | ML inference works |
| 5-6 | 1.3-1.4 | DB helpers | All endpoints working |
| 6-7 | 2.1-2.2 | Layout + Landing | Parchment theme renders |
| 7-8 | 2.3-2.4 | Upload integration | CSV upload works |
| 8-9 | 2.4 | Loading states | Loading/error states |
| 9-11 | 3.1-3.2 | SVG map | Map renders with locations |
| 11-12.5 | 3.2-3.3 | Footprints + glow | Anomalies pulse red |
| 12.5-13 | 3.4 | Map interaction | Click + pan/zoom |
| 13-14.5 | 4.1-4.2 | Anomaly panel | Panel slides in |
| 14.5-16 | 4.2-4.3 | Gemini narrative | AI text appears |
| 16-17 | 4.4 | Dashboard layout | Full layout responsive |
| 17-18 | 5.1 | TTS backend | Audio generates |
| 18-19 | 5.2 | Audio playback | Play/pause works |
| 19-20.5 | 6.1-6.2 | Chart + tabs | Recharts + filtering |
| 20.5-22 | 6.3-6.4 | Responsive + polish | Mobile/tablet/desktop |
| 22-23 | 7.1-7.2 | Celery + Docker | Background processing |
| 23-24 | 7.3 | Superplane | Orchestration workflow |
| 24-25 | 8.1 | CI/CD | GitHub Actions working |
| 25-26 | 9.1-9.2 | Demo data + edge cases | Demo data seeded |
| 26-27 | 9.3-9.4 | E2E testing | Full flow works 3x |
| 27-28 | 9.4 | Bug fixes | All P0 bugs fixed |
| 28-29 | 10.1-10.2 | Polish + README | UI polished |
| 29-29.5 | 10.3 | Demo rehearsal | Rehearsed 3x |
| 29.5-30 | 10.4 | Backup plan | Fallbacks ready |

---

## Technology Checklist

| Tech | Purpose | Setup Status |
|------|---------|-------------|
| React 19 + Vite 8 + TypeScript | Frontend | ✅ |
| Tailwind CSS v4 | Styling | ✅ |
| Framer Motion | Animations | ✅ |
| Recharts | Charts | ✅ |
| React Router v7 | Routing | ✅ |
| TanStack Query | API caching | ✅ |
| Python 3.9 + FastAPI | Backend | ✅ |
| scikit-learn | ML inference | ✅ |
| Pandas + NumPy | Data processing | ✅ |
| Celery + Redis | Async tasks | ☐ |
| In-memory DB (local dev) | Database | ✅ |
| Gemini 1.5 Flash | NLG narratives | ✅ (fallback ready) |
| ElevenLabs | TTS voice | ✅ (fallback ready) |
| Superplane | Orchestration | ☐ |
| GitHub Actions | CI/CD | ✅ |
| Docker Compose | Containerization | ✅ |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Actian DB connection issues | Medium | High | Fallback to SQLite with same schema |
| Gemini API rate limits | Low | Medium | Cache narratives, retry with backoff |
| ElevenLabs API downtime | Low | Medium | Pre-generate audio for demo data |
| ML model slow on large CSVs | Medium | Low | Limit to 1000 rows, async processing |
| SVG map rendering lag | Low | Low | Virtualize, limit footprint count |
| Frontend build errors | Medium | Medium | TypeScript strict mode, fix incrementally |
| Celery worker crashes | Low | Medium | Docker restart policy |
| Superplane setup complex | Medium | Low | Run pipeline manually via API |

---

## Definition of Done

The project is **demo-ready** when:

- [ ] User can upload CSV → see anomalies on map in < 10 seconds
- [ ] 3 anomalies visible with red pulse animation
- [ ] Click anomaly → panel shows details + narrative
- [ ] Play button → audio narrates anomaly
- [ ] Tabs filter by category
- [ ] Spend trend chart shows data
- [ ] Mobile responsive (bottom sheet panel)
- [ ] No console errors
- [ ] GitHub Actions CI passes
- [ ] Demo rehearsed 3x successfully
- [ ] Backup plan documented
