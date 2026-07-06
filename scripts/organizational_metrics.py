from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def record_metric_event(authority: str, metrics: Dict[str, Any], root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    metrics_root = root / "knowledge" / "metrics"
    metrics_root.mkdir(parents=True, exist_ok=True)
    metrics_path = metrics_root / f"{authority}.json"
    existing = {}
    if metrics_path.exists():
        existing = json.loads(metrics_path.read_text(encoding="utf-8"))
    payload = {**existing, **metrics, "authority": authority}
    metrics_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return {"ok": True, "metrics": payload, "path": str(metrics_path)}


def compute_organizational_metrics(root: Optional[Path] = None) -> Dict[str, Any]:
    root = Path(root or ROOT)
    metrics_root = root / "knowledge" / "metrics"
    metrics = {}
    if metrics_root.exists():
        for path in metrics_root.glob("*.json"):
            data = json.loads(path.read_text(encoding="utf-8"))
            metrics[data.get("authority", path.stem)] = data
    return {"ok": True, "metrics": metrics}
