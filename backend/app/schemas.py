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
    triggered_rules: list[str]


class BatchResponse(BaseModel):
    batch_id: str
    status: str
    txn_count: int


class HealthResponse(BaseModel):
    status: str
    version: str
