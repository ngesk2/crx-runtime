"""Business Projections - canonical events -> business facts.

PING projects canonical business events into business KPIs.
HPP owns the meaning (what a lead / revenue / review means); PING computes
the projection (reads canonical events, aggregates). This is the
Operational Intelligence "nervous system": technical events become
business facts.

Event -> Metric:
  LeadCreated       -> daily_lead_count
  EstimateAccepted  -> revenue_projection
  EmailSent/Opened  -> campaign_performance
  ReviewPublished   -> reputation_score

PING MAY aggregate/project (BI Boundary). It NEVER defines funnels,
campaigns, or conversion logic - those remain HPP-owned.
"""

from typing import Any
from collections import defaultdict


class BusinessProjectionEngine:
    """Computes business KPIs from a list of canonical event dicts."""

    def compute_all(self, events: list[dict[str, Any]]) -> dict[str, Any]:
        return {
            "daily_lead_count": self.daily_lead_count(events),
            "revenue_projection": self.revenue_projection(events),
            "campaign_performance": self.campaign_performance(events),
            "reputation_score": self.reputation_score(events),
        }

    def daily_lead_count(self, events: list[dict[str, Any]]) -> int:
        return sum(1 for e in events if e.get("event_type") == "LeadCreated")

    def revenue_projection(self, events: list[dict[str, Any]]) -> float:
        total = 0.0
        for e in events:
            if e.get("event_type") != "EstimateAccepted":
                continue
            payload = e.get("payload", {}) or {}
            amt = (
                payload.get("amount")
                or payload.get("estimated_value")
                or payload.get("value")
                or 0
            )
            try:
                total += float(amt)
            except (TypeError, ValueError):
                continue
        return round(total, 2)

    def campaign_performance(self, events: list[dict[str, Any]]) -> dict[str, Any]:
        sent: dict[str, int] = defaultdict(int)
        opened: dict[str, int] = defaultdict(int)
        for e in events:
            et = e.get("event_type")
            payload = e.get("payload", {}) or {}
            campaign = (
                payload.get("campaign_id")
                or payload.get("campaignId")
                or "unknown"
            )
            if et == "EmailSent":
                sent[campaign] += 1
            elif et == "EmailOpened":
                opened[campaign] += 1
        out: dict[str, Any] = {}
        for campaign in set(list(sent) + list(opened)):
            s = sent.get(campaign, 0)
            o = opened.get(campaign, 0)
            out[campaign] = {
                "sent": s,
                "opened": o,
                "open_rate": round(o / s, 3) if s else 0.0,
            }
        return out

    def reputation_score(self, events: list[dict[str, Any]]) -> float:
        ratings: list[float] = []
        for e in events:
            if e.get("event_type") != "ReviewPublished":
                continue
            payload = e.get("payload", {}) or {}
            r = payload.get("rating")
            if isinstance(r, (int, float)):
                ratings.append(float(r))
        return round(sum(ratings) / len(ratings), 2) if ratings else 0.0
