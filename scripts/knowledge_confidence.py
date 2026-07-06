from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def decay_knowledge_object(obj: Dict[str, Any], root: Optional[Path] = None) -> Dict[str, Any]:
    confidence = float(obj.get("confidence", 0.5))
    recency = float(obj.get("recency", 1))
    verification_count = float(obj.get("verification_count", 1))
    contradictions = float(obj.get("contradictions", 0))
    decayed = confidence * (0.95 ** recency) * (0.98 ** verification_count) * (0.99 ** contradictions)
    updated = {**obj, "confidence": round(decayed, 4)}
    return updated


def score_knowledge_object(obj: Dict[str, Any]) -> float:
    confidence = float(obj.get("confidence", 0.5))
    recency = float(obj.get("recency", 1))
    verification_count = float(obj.get("verification_count", 1))
    contradictions = float(obj.get("contradictions", 0))
    return round(confidence * (1 + (0.1 * verification_count)) / (1 + (0.05 * contradictions) + (0.02 * recency)), 4)
