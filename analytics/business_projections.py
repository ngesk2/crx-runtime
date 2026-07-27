"""Business Intelligence - canonical events -> business facts -> health models.

Two layers (PING computes; HPP owns meaning):

1. Business Facts (PING-computed raw facts from canonical events):
     lead_count, estimate_accepted_count, total_pipeline_value,
     email_sent, email_opened, email_clicked, delivery_rate,
     review_count, avg_rating

   PING computes these. They are facts, not decisions.

2. Health Models (decision-oriented; PING computes from facts,
   HPP owns the meaning/thresholds):
     PipelineHealth    - is the lead->estimate funnel healthy?
     RevenueHealth     - is projected revenue on track?
     MarketingHealth   - are campaigns engaging?
     ReputationHealth  - is reputation trending well?
     OperationsHealth  - are runtime integrations healthy?

PING exposes DECISIONS (health status + summary), not raw metric classes.
The dashboard becomes small: everything is pre-computed into health models.

PostHog is a projection of these facts/models - never the source of truth.
"""

from typing import Any
from collections import defaultdict


# ---------------------------------------------------------------------------
# Layer 1: Business Facts (PING-computed from canonical events)
# ---------------------------------------------------------------------------

def compute_business_facts(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate canonical events into raw business facts. PING computes."""
    lead_count = sum(1 for e in events if e.get("event_type") == "LeadCreated")
    estimate_accepted = [e for e in events if e.get("event_type") == "EstimateAccepted"]
    estimate_accepted_count = len(estimate_accepted)
    total_pipeline_value = 0.0
    for e in estimate_accepted:
        p = e.get("payload", {}) or {}
        amt = p.get("amount") or p.get("estimated_value") or p.get("value") or 0
        try:
            total_pipeline_value += float(amt)
        except (TypeError, ValueError):
            continue

    sent = sum(1 for e in events if e.get("event_type") == "EmailSent")
    opened = sum(1 for e in events if e.get("event_type") == "EmailOpened")
    clicked = sum(1 for e in events if e.get("event_type") == "EmailClicked")
    delivery_rate = round(opened / sent, 3) if sent else 0.0

    reviews = [e for e in events if e.get("event_type") == "ReviewPublished"]
    ratings = [
        float(e.get("payload", {}).get("rating"))
        for e in reviews
        if isinstance(e.get("payload", {}).get("rating"), (int, float))
    ]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

    return {
        "lead_count": lead_count,
        "estimate_accepted_count": estimate_accepted_count,
        "total_pipeline_value": round(total_pipeline_value, 2),
        "email_sent": sent,
        "email_opened": opened,
        "email_clicked": clicked,
        "delivery_rate": delivery_rate,
        "review_count": len(reviews),
        "avg_rating": avg_rating,
    }


# ---------------------------------------------------------------------------
# Layer 2: Health Models (decision-oriented; PING computes, HPP owns meaning)
# ---------------------------------------------------------------------------

class HealthModel:
    """Base health model: exposes a status + decision, not raw metrics."""

    name: str = "health"
    status: str = "unknown"   # healthy | warning | critical
    summary: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {"name": self.name, "status": self.status, "summary": self.summary}


class PipelineHealth(HealthModel):
    """Is the lead->estimate funnel healthy? (HPP owns the conversion threshold)"""
    name = "PipelineHealth"

    def __init__(self, facts: dict[str, Any]) -> None:
        leads = facts.get("lead_count", 0)
        accepted = facts.get("estimate_accepted_count", 0)
        if leads == 0:
            self.status = "unknown"
            self.summary = "No leads recorded yet"
        else:
            conv = accepted / leads
            self.status = "healthy" if conv >= 0.2 else ("warning" if conv >= 0.1 else "critical")
            self.summary = f"{accepted}/{leads} leads converted ({conv:.0%})"


class RevenueHealth(HealthModel):
    """Is projected revenue on track? (HPP owns the target)"""
    name = "RevenueHealth"

    def __init__(self, facts: dict[str, Any]) -> None:
        value = facts.get("total_pipeline_value", 0.0)
        self.status = "healthy" if value > 0 else "warning"
        self.summary = f"Projected pipeline value: ${value:,.0f}"


class MarketingHealth(HealthModel):
    """Are campaigns engaging? (uses email_sent/opened/clicked facts)"""
    name = "MarketingHealth"

    def __init__(self, facts: dict[str, Any]) -> None:
        sent = facts.get("email_sent", 0)
        opened = facts.get("email_opened", 0)
        clicked = facts.get("email_clicked", 0)
        if sent == 0:
            self.status = "unknown"
            self.summary = "No campaigns sent yet"
        else:
            rate = opened / sent
            self.status = "healthy" if rate >= 0.3 else ("warning" if rate >= 0.15 else "critical")
            self.summary = f"Open rate {rate:.0%}, {clicked} clicks"


class ReputationHealth(HealthModel):
    """Is reputation trending well? (HPP owns the rating bar)"""
    name = "ReputationHealth"

    def __init__(self, facts: dict[str, Any]) -> None:
        avg = facts.get("avg_rating", 0.0)
        count = facts.get("review_count", 0)
        if count == 0:
            self.status = "unknown"
            self.summary = "No reviews yet"
        else:
            self.status = "healthy" if avg >= 4.0 else ("warning" if avg >= 3.0 else "critical")
            self.summary = f"Avg rating {avg} across {count} reviews"


class OperationsHealth(HealthModel):
    """Are runtime integrations healthy? (from live dependency state)"""
    name = "OperationsHealth"

    def __init__(self, deps: dict[str, bool]) -> None:
        up = sum(1 for v in deps.values() if v)
        total = len(deps)
        if total == 0:
            self.status = "unknown"
            self.summary = "No dependency data"
        else:
            self.status = "healthy" if up == total else ("warning" if up >= total / 2 else "critical")
            self.summary = f"{up}/{total} systems operational"


def compute_health_models(
    facts: dict[str, Any], deps: dict[str, bool] | None = None
) -> list[dict[str, Any]]:
    """Compute all executive health models from facts. PING computes; HPP owns meaning."""
    models: list[HealthModel] = [
        PipelineHealth(facts),
        RevenueHealth(facts),
        MarketingHealth(facts),
        ReputationHealth(facts),
    ]
    if deps is not None:
        models.append(OperationsHealth(deps))
    return [m.to_dict() for m in models]
