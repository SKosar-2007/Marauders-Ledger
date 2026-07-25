from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Transaction(BaseModel):
    amount: float
    category: str
    merchant: str
    hour: int
    day: int
    timestamp: Optional[datetime] = None


class AnomalyResult(BaseModel):
    anomaly_id: str
    txn_id: Optional[str] = None
    amount: float
    category: str
    merchant: str
    hour: int
    day: Optional[int] = None
    isolation_score: float
    rule_score: float
    final_score: float
    is_anomaly: bool
    severity: str
    triggered_rules: list
    detected_at: Optional[str] = None


class BatchResponse(BaseModel):
    batch_id: str
    status: str
    txn_count: int


class HealthResponse(BaseModel):
    status: str
    version: str


class NarrativeResponse(BaseModel):
    narrative_id: str
    anomaly_id: str
    text: str
    created_at: Optional[str] = None
