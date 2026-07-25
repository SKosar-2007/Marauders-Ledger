# Pre-Hackathon Timeline — The Marauder's Ledger

> **Deadline:** Hackathon starts tomorrow.  
> **Goal:** Show up with ML model done, API keys ready, Actian DB running, SVG map designed.  
> **Total prep time needed:** ~6 hours spread across today and tomorrow morning.

---

## Timeline Overview

| When | What | Time Needed |
|------|------|-------------|
| **Today (evening)** | ML training, Actian DB setup, API keys, GitHub repo | 3 hours |
| **Tomorrow (before hackathon)** | SVG map design, sample CSVs, test full pipeline, team sync | 3 hours |

---

## Today Evening (3 hours)

### Hour 1: ML Model Training

```
[0:00 - 0:05]  ─── Set up Python environment
    python -m venv ml_env && source ml_env/bin/activate
    pip install pandas numpy scikit-learn joblib

[0:05 - 0:10]  ─── Copy the full train_model.py script
    (from ML-Model Training Guide.md → save as train_model.py)

[0:10 - 0:12]  ─── Run the script
    python train_model.py
    Expected output:
        Training complete. Score range: ...
        Validation Results: Precision=0.78  Recall=0.73  F1=0.75
        Files saved to 'models/'

[0:12 - 0:20]  ─── Run the smoke test (verify model works)
    python test_model.py  (use the test script from section 11.1)
    Expected: Normal txn score: 0.12 | Anomalous txn score: 0.72

[0:20 - 0:30]  ─── Push model files to GitHub
    mkdir -p backend/models
    cp models/anomaly_model.pkl backend/models/
    cp models/scaler.pkl backend/models/
    cp models/feature_columns.pkl backend/models/
    git add backend/models/ && git commit -m "add pre-trained ML model"
    git push
```

**Output:** 3 `.pkl` files ready. Model validated at 75% F1.

---

### Hour 2: Infrastructure Setup

```
[0:30 - 0:50]  ─── Actian Data Platform
    1. Go to Actian cloud console → create new instance (free tier)
    2. Note down: host, port, database name, username, password
    3. Run schema creation script (from blueprint section 5)
    4. Verify connection with a test query: SELECT 1
    5. Insert 2-3 test rows manually to confirm tables work

[0:50 - 1:00]  ─── Gemini API
    1. Go to Google AI Studio → create API key
    2. Test with curl/Python:
        curl -H "Content-Type: application/json" \
             -H "x-goog-api-key: $KEY" \
             -d '{"contents":[{"parts":[{"text":"Say hello as the Marauders Map"}]}]}' \
             https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent
    3. Save key to .env file

[1:00 - 1:10]  ─── ElevenLabs API
    1. Go to elevenlabs.io → create account → get API key
    2. Test TTS:
        curl -X POST \
             -H "xi-api-key: $KEY" \
             -H "Content-Type: application/json" \
             -d '{"text":"Mischief managed. An anomaly has been detected.","voice_settings":{"stability":0.3,"similarity_boost":0.7}}' \
             "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
             --output test.mp3
    3. Play test.mp3 to verify → if it works, you're golden
    4. Save key to .env file

[1:10 - 1:20]  ─── Superplane
    1. Deploy Superplane via Docker:
        docker run -d -p 8080:8080 ghcr.io/superplanehq/superplane-demo:stable
        (or use Superplane Cloud at app.superplane.com)
    2. Create a simple test workflow (hello world)
    3. Verify the dashboard loads

[1:20 - 1:30]  ─── GitHub repo
    1. Create repo: marauders-ledger
    2. Set up folder structure:
        ├── frontend/       (React + Vite)
        ├── backend/        (FastAPI)
        │   ├── models/     (.pkl files from Hour 1)
        │   ├── app/
        │   │   ├── main.py
        │   │   ├── inference.py
        │   │   └── database.py
        │   └── requirements.txt
        ├── superplane/     (canvas.yaml + console.yaml)
        └── data/           (sample CSVs)
    3. Set up GitHub Actions:
        .github/workflows/ci.yml → runs python tests on push
    4. Push everything
```

**Output:** Actian DB running, 3 API keys working, repo structured, Superplane deployed.

---

### Hour 3: Backend Skeleton

```
[1:30 - 2:00]  ─── FastAPI backend core
    Create backend/app/main.py with:
        - /api/upload → accepts CSV, parses, stores in Actian
        - /api/analyze → loads model, runs inference, returns anomalies
        - /api/narrate → calls Gemini with anomaly data → returns text
        - /api/tts → calls ElevenLabs with narrative → returns audio
        - Health check endpoint

    Create backend/app/inference.py:
        - copy the detect_anomalies() function from training guide section 9
        - test with a small JSON payload

    Create backend/app/database.py:
        - Actian DB connection using ODBC or the Actian Python connector
        - CRUD helpers for: insert_transactions, insert_anomalies,
          get_user_transactions, get_anomalies

    Create backend/requirements.txt:
        fastapi uvicorn pandas numpy scikit-learn joblib
        python-multipart httpx google-generativeai

[2:00 - 2:30]  ─── Test backend end-to-end
    1. Start server: uvicorn app.main:app --reload
    2. Upload sample CSV via curl:
        curl -X POST -F "file=@data/sample.csv" http://localhost:8000/api/upload
    3. Trigger analysis:
        curl -X POST http://localhost:8000/api/analyze?user_id=test
    4. Check returned anomalies → verify scores look reasonable
    5. Hit /api/narrate → confirm Gemini returns text
    6. Hit /api/tts → confirm audio file returns

[2:30 - 3:00]  ─── Fix any issues
    If anything broke (Actian connection, model loading, Gemini response):
        - Read the error message carefully
        - Check the troubleshooting section in the ML guide
        - Verify .env variables are loaded
        - Test each service independently to isolate the issue
```

**Output:** Backend running locally, all 4 endpoints working end-to-end.

---

## Tomorrow Morning (before hackathon starts — 3 hours)

### Hour 1: Frontend Prep

```
[0:00 - 0:30]  ─── Scaffold React app
    npm create vite@latest frontend -- --template react-ts
    cd frontend && npm install
    npm install tailwindcss framer-motion recharts react-dropzone axios
    Configure Tailwind with parchment color palette:
        sepia: '#f5e6c8', ink: '#2c1810', gold: '#d4af37',
        red: '#dc2626', green: '#2d6a4f'
    Set up fonts: Cinzel Decorative + Crimson Pro (Google Fonts)

[0:30 - 1:00]  ─── Create the SVG map
    Option A (recommended for 36h): Draw 5 circle "locations" on an SVG
        - Hogsmeade (Food spending)
        - Diagon Alley (Shopping)
        - Gringotts (Bills)
        - Hogwarts (Entertainment)
        - Platform 9 3/4 (Travel)
    Option B: Use a simplified SVG of actual campus map
    Key: It doesn't need to look like art. It needs to be functional.
    Each location = a <circle> or <g> tag that changes color on hover.
    Use Figma to export a simple SVG, then add interactivity in React.

[1:00 - 1:30]  ─── Core React components (stubs are fine)
    Create these files with basic structure + loading states:
        - MaraudersMap.tsx     (SVG container, click handlers)
        - UploadZone.tsx       (drag-drop, file validation)
        - AnomalyPanel.tsx     (right slide-in, placeholder for narrative)
        - NarrativeCard.tsx    (parchment styled text box)
        - VoiceNarration.tsx   (play button, placeholder for audio)
        - MessrsTabs.tsx       (filter buttons, only need 2 tabs working)
    Don't polish yet. Just get the components rendering.
```

**Output:** React app running, Tailwind themed, SVG map showing, all components exist.

---

### Hour 2: Sample Data + Integration

```
[1:30 - 1:45]  ─── Create 3 sample CSVs
    1. normal.csv — 50 transactions, all normal (no anomalies)
    2. compromised.csv — 50 transactions, 3 clear anomalies
        - One: ₹7,500 food order at 3:15 AM
        - Two: ₹4,200 from "Unknown Merchant" at 2:47 AM
        - Three: ₹2,800 duplicate charge appearing twice in 1 hour
    3. mixed.csv — 100 transactions, 5 subtle anomalies
    These are your DEMO files. Make the anomalies obvious.

    Format:
        date,amount,category,merchant,time
        2026-03-15,185,Food,Swiggy,13:22
        2026-03-15,3499,Shopping,Amazon,20:15
        ...

[1:45 - 2:15]  ─── Connect frontend to backend
    Wire up:
        - UploadZone → POST /api/upload → show progress
        - Backend processes → GET /api/anomalies?user_id=test
        - Map displays clusters (normal transactions as dots)
        - Anomalies show as red glowing circles
        - Click anomaly → AnomalyPanel slides in
        - NarrativeCard shows Gemini text
        - VoiceNarration button → GET /api/narratives/:id/audio
    If backend isn't up yet, use a mock data file for frontend dev.
```

**Output:** Frontend talks to backend. Full data flow works (or works with mock data).

---

### Hour 3: Test + Polish

```
[2:15 - 2:30]  ─── Run through demo flow 3x
    1. Open app → see "The map is blank" empty state
    2. Upload compromised.csv → see footprints appear
    3. Anomalies glow red → click one → narrative appears
    4. Click play → voice reads it aloud
    5. Verify every step works without errors

[2:30 - 2:50]  ─── Fix top 3 UI issues
    - Loading states (show during analysis)
    - Error states (show if upload fails)
    - Empty states (map blank before upload)
    Don't fix everything. Fix what a judge would see.

[2:50 - 3:00]  ─── Team sync (5 min standup)
    - Everyone knows their role (Who demos? Who fields tech questions?)
    - Everyone has API keys in their .env
    - Everyone can run the app locally
    - Backup plan: if Actian DB fails, fallback to JSON files
    - Backup plan: if Gemini fails, fallback to template narratives
    - Backup plan: if ElevenLabs fails, skip voice (still impressive without it)
```

**Output:** Demo-ready app. 3 backup plans documented. Team aligned.

---

## Summary Checklist

### Today (3 hours)

| Task | Time | Done |
|------|------|------|
| Run `train_model.py` → get `.pkl` files | 30 min | ☐ |
| Set up Actian Data Platform + schema | 20 min | ☐ |
| Test Gemini API key | 10 min | ☐ |
| Test ElevenLabs API key | 10 min | ☐ |
| Deploy Superplane | 10 min | ☐ |
| Create GitHub repo + folder structure | 10 min | ☐ |
| Build FastAPI backend skeleton (upload + analyze) | 30 min | ☐ |
| Build FastAPI backend (narrate + tts) | 30 min | ☐ |
| Test backend end-to-end | 30 min | ☐ |
| **Total** | **3 hours** | |

### Tomorrow (3 hours before hackathon)

| Task | Time | Done |
|------|------|------|
| Scaffold React app + Tailwind theme | 30 min | ☐ |
| Create SVG map (5 locations) | 30 min | ☐ |
| Create React components (stubs) | 30 min | ☐ |
| Create 3 demo CSVs (normal, compromised, mixed) | 15 min | ☐ |
| Connect frontend to backend | 30 min | ☐ |
| Run demo flow 3x | 15 min | ☐ |
| Fix top UI issues | 20 min | ☐ |
| Team sync + backup plans | 10 min | ☐ |
| **Total** | **3 hours** | |

---

## Backup Plans (if something fails)

| If this fails... | ...do this |
|-----------------|------------|
| Actian DB connection | Fallback to SQLite or local JSON files. Same schema, swap the driver. |
| Gemini API | Pre-write 5 template narratives. Use them when API is down. |
| ElevenLabs API | Skip audio playback. Demo still works with text + map. |
| SVG map rendering | Fallback to a simple HTML/CSS grid layout with location cards. |
| Model loading | Embed a simple rule-based scorer (no ML). Still catches basic anomalies. |
| Superplane | Run the pipeline manually via API calls. Superplane is nice-to-have, not essential. |
| Everything | Have a pre-recorded demo video ready. Export before hackathon starts. |

---

## Rule of Thumb

> **If you can't finish a task in 30 minutes, simplify it.**

Don't spend 2 hours tuning the model. Don't spend 3 hours on the SVG map. Don't write perfect CSS. A working demo with basic styling beats a half-finished masterpiece every time at a hackathon.
