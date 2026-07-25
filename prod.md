# Production Deployment — Marauder's Ledger

## Architecture

```
DO Droplet ($6/mo, 1GB RAM, 25GB SSD)
├── Docker Compose
│   ├── fastapi backend          → port 8000 (public)
│   └── actian/vectorai:latest   → port 6574 (internal, gRPC)
└── Public IPv4
```

Judge visits `http://<droplet-ip>:8000` — that's it.

## Cost

| Service | Cost | Duration |
|---------|------|----------|
| DO $200 trial credit | Free | 60 days |
| $6/mo Droplet | ~$0.009/hr | From credit |
| After credit expires | $6/mo | Ongoing |

**No perpetual free compute.** Set a calendar reminder to tear down before credit expires.

## Droplet Spec

- **Size:** $6/mo — Basic, 1GB RAM, 1 vCPU, 25GB SSD
- **OS:** Ubuntu 24.04 LTS
- **Region:** Pick closest (nyc1, sfo3, fra1, etc.)
- **Auth:** SSH key (set up in DO dashboard)

**Do NOT use $4/mo (512MB)** — VectorAI + Docker will OOM.

## URL for Judge

`http://<droplet-ip>.sslip.io:8000`

sslip.io is a free wildcard DNS — no account, no setup. Maps `<ip>.sslip.io` to your Droplet's IP. Nicer for a judge to type than raw numbers.

## SuperPlane Orchestration

SuperPlane sits above DO and automates deploys:

1. **Connect GitHub repo** to SuperPlane (app.superplane.com)
2. **Create a workflow** (`canvas.yaml`):
   - Trigger: push to `main`
   - Action: SSH into Droplet → `docker-compose pull && docker-compose up -d`
3. **Result:** Git push → auto-deploy on DO Droplet

SuperPlane has a native DO integration. For a single-Droplet setup it's optional — you can just SSH in and run commands manually.

## Deploy Steps

Before deploying, make sure your GitHub repo has the latest files:
- `docker-compose.yml` (project root)
- `backend/Dockerfile`
- `backend/requirements.txt`
- `backend/.dockerignore`
- `.env` (with real or placeholder keys)

```bash
# SSH in
ssh root@<droplet-ip>

# Install Docker
apt update && apt install -y docker.io docker-compose-v2

# Clone repo
git clone <your-repo-url> /opt/marauders-ledger
cd /opt/marauders-ledger

# Start everything
docker compose up -d
```

`docker-compose.yml` (in project root) defines:
- `backend` — builds from `backend/Dockerfile` → port 8000
- `vectorai` — `actian/vectorai:latest` → internal port 6574, requires `ACTIAN_VECTORAI_ACCEPT_EULA=YES`

No reverse proxy needed — expose backend port 8000 directly.

## Backend Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir 'protobuf>=6.33.5' actian-vectorai-client
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Note: `actian-vectorai-client` is installed in a separate layer because its protobuf requirement (>=6.33.5) conflicts with `google-generativeai`'s dependency chain.

## Environment Variables (`.env` in project root)

```
GEMINI_API_KEY=         # Optional — falls back to template narratives
ELEVENLABS_API_KEY=     # Optional — falls back to 501 for audio
VECTORAI_HOST=vectorai  # Docker service name (inside compose network)
```

VectorAI container also needs `ACTIAN_VECTORAI_ACCEPT_EULA=YES` (set in docker-compose.yml).

## Demo Flow

1. Open `http://<ip>:8000` in browser → your frontend
2. Upload `data/compromised.csv`
3. Click Analyze
4. View anomalies list
5. Click an anomaly → see narrative + play audio

Or use Swagger UI for a quick API demo: `http://<ip>:8000/docs`

## Teardown

```bash
docker compose down
# Delete Droplet from DO dashboard
```

Set a calendar reminder for **day 55** of the trial.

## Limitations

- **No perpetual free compute** — $200 credit lasts 60 days, then $6/mo
- **No auth** — anyone with the URL can use it (fine for hackathon)
- **No HTTPS** — raw HTTP. Audio works fine. Some browser APIs won't (not needed for demo)
- **512MB Droplet WILL crash** — use 1GB minimum
