from datetime import datetime

from pydantic import BaseModel


class Transaction(BaseModel):
    amount: float
    category: str
    merchant: str
    hour: int
    day: int
    timestamp: datetime | None = None


class AnomalyResult(BaseModel):
    anomaly_id: int
    txn_id: str | None = None
    amount: float
    category: str
    merchant: str
    hour: int
    day: int | None = None
    isolation_score: float = 0
    rule_score: float = 0
    final_score: float = 0
    is_anomaly: bool
    severity: str
    triggered_rules: list[str]
    detected_at: datetime | None = None


class BatchResponse(BaseModel):
    batch_id: str
    status: str
    txn_count: int


class HealthResponse(BaseModel):
    status: str
    version: str


class NarrativeResponse(BaseModel):
    narrative_id: int
    anomaly_id: int
    text: str
    created_at: datetime | None = None
