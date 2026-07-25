"""
Celery configuration for The Marauder's Ledger.
Handles background processing of CSV uploads, narrative generation, and TTS.
"""
from __future__ import annotations

import os

from celery import Celery
from celery.signals import worker_init

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

app = Celery(
    "marauders",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,
)

app.autodiscover_tasks(["app"])


@worker_init.connect
def _init_worker(**_kwargs):
    from app.database import init_db
    init_db()
