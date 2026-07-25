
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import AnomalyResult, BatchResponse, HealthResponse

app = FastAPI(
    title="The Marauder's Ledger",
    description="Financial anomaly detection API with AI narration",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="0.1.0")


@app.post("/api/upload", response_model=BatchResponse)
async def upload_csv(file: UploadFile = File(...)):  # noqa: B008
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.post("/api/analyze")
async def analyze_batch(batch_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/anomalies", response_model=list[AnomalyResult])
async def get_anomalies(user_id: str | None = None, severity: str | None = None):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/anomalies/{anomaly_id}", response_model=AnomalyResult)
async def get_anomaly(anomaly_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/narratives/{anomaly_id}")
async def get_narrative(anomaly_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/narratives/{anomaly_id}/audio")
async def get_narrative_audio(anomaly_id: str):
    raise HTTPException(status_code=501, detail="Not implemented yet")
