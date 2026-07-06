from __future__ import annotations

from typing import Any, Dict


def compute_roi(mission: Dict[str, Any]) -> float:
    engineering_value = mission.get("engineering_value", 0)
    engineering_cost = mission.get("engineering_cost", 1)
    return engineering_value / engineering_cost
