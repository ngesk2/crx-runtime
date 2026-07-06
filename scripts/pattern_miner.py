from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List


def mine_patterns(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    counts = Counter(item.get("mission") for item in items if item.get("mission"))
    patterns = []
    for mission, count in counts.items():
        if count > 1:
            patterns.append({"pattern": "repeated-mission", "mission": mission, "count": count})
    return patterns
