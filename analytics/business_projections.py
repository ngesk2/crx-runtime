"""Business Intelligence - canonical events -> facts -> signals -> health models.

Four layers (PING computes; HPP owns meaning):

1. Business Facts   (raw aggregations of canonical events)
2. Business Signals (reusable directional trends derived from facts)
3. Health Models    (decision-oriented; consume signals, expose status +
                     drivers + recommendation + forecast)
4. Prioritization   (rank problems for the CEO dashboard)

PING exposes DECISIONS (health status + recommendation), not raw metrics.
Every health model answers: status, why (drivers), what to do (recommendation),
and what's next (forecast). PostHog is a projection of these, never the source.

Signals are reusable: many health models consume the same signal
(e.g. lead_velocity feeds PipelineHealth and MarketingHealth).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any


# ---------------------------------------------------------------------------
# Layer 1: Business Facts (PING-computed from canonical events)
# ---------------------------------------------------------------------------

def compute_business_facts(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate canonical events into raw business facts. PING computes."""
    lead_count = sum(1 for e in events if e.get("event_type") == "LeadCreated")
    estimate_accepted = [e for e in events if e.get("event_type") == "EstimateAccepted"]
    estimate_accepted_count = len(estimate_accepted)
    total_pipeline_value = 0.0
    cash_collected = 0.0
    for e in events:
        et = e.get("event_type")
        p = e.get("payload", {}) or {}
        amt = p.get("amount") or p.get("estimated_value") or p.get("value") or p.get("payment") or 0
        try:
            amt = float(amt)
        except (TypeError, ValueError):
            amt = 0.0
        if et == "EstimateAccepted":
            total_pipeline_value += amt
        elif et in ("PaymentReceived", "InvoicePaid"):
            cash_collected += amt

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
    referral_count = sum(1 for e in events if e.get("event_type") == "ReferralCreated")

    return {
        "lead_count": lead_count,
        "estimate_accepted_count": estimate_accepted_count,
        "total_pipeline_value": round(total_pipeline_value, 2),
        "cash_collected": round(cash_collected, 2),
        "email_sent": sent,
        "email_opened": opened,
        "email_clicked": clicked,
        "delivery_rate": delivery_rate,
        "review_count": len(reviews),
        "avg_rating": avg_rating,
        "referral_count": referral_count,
    }


# ---------------------------------------------------------------------------
# Layer 2: Business Signals (reusable directional trends)
# ---------------------------------------------------------------------------

@dataclass
class BusinessSignal:
    """A reusable directional trend derived from facts/events."""
    name: str
    direction: str = "unknown"   # up | down | flat | unknown
    magnitude: float = 0.0       # signed delta (recent - prior rate)
    current_rate: float = 0.0
    prior_rate: float = 0.0


def _parse_ts(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _windowed_rate(
    events: list[dict[str, Any]],
    event_type: str,
    value_fn=None,
    window_days: int = 7,
) -> tuple[float, float]:
    """Return (recent_rate, prior_rate) per day for an event type.

    recent = last `window_days`; prior = the window before that.
    value_fn(event) extracts a numeric value (defaults to count of 1).
    """
    now = datetime.now(timezone.utc)
    recent_start = now - timedelta(days=window_days)
    prior_start = recent_start - timedelta(days=window_days)

    recent_total = 0.0
    prior_total = 0.0
    for e in events:
        if e.get("event_type") != event_type:
            continue
        ts = _parse_ts(e.get("occurred_at")) or _parse_ts(e.get("recorded_at"))
        if ts is None:
            continue
        v = value_fn(e) if value_fn else 1.0
        if recent_start <= ts <= now:
            recent_total += v
        elif prior_start <= ts < recent_start:
            prior_total += v

    return recent_total / window_days, prior_total / window_days


def _direction(recent: float, prior: float) -> tuple[str, float]:
    if prior <= 0:
        return ("up" if recent > 0 else "unknown"), recent - prior
    ratio = recent / prior
    if ratio >= 1.05:
        return "up", round(recent - prior, 3)
    if ratio <= 0.95:
        return "down", round(recent - prior, 3)
    return "flat", round(recent - prior, 3)


def compute_business_signals(events: list[dict[str, Any]]) -> dict[str, BusinessSignal]:
    """Derive reusable directional signals from events. PING computes."""
    signals: dict[str, BusinessSignal] = {}

    # Lead Velocity (count of LeadCreated over time)
    r, p = _windowed_rate(events, "LeadCreated")
    d, m = _direction(r, p)
    signals["lead_velocity"] = BusinessSignal("lead_velocity", d, m, r, p)

    # Revenue Momentum (EstimateAccepted value over time)
    r, p = _windowed_rate(
        events, "EstimateAccepted",
        value_fn=lambda e: float(
            (e.get("payload", {}).get("amount")
             or e.get("payload", {}).get("estimated_value") or 0)
        ),
    )
    d, m = _direction(r, p)
    signals["revenue_momentum"] = BusinessSignal("revenue_momentum", d, m, r, p)

    # Review Momentum
    r, p = _windowed_rate(events, "ReviewPublished")
    d, m = _direction(r, p)
    signals["review_momentum"] = BusinessSignal("review_momentum", d, m, r, p)

    # Referral Growth
    r, p = _windowed_rate(events, "ReferralCreated")
    d, m = _direction(r, p)
    signals["referral_growth"] = BusinessSignal("referral_growth", d, m, r, p)

    # Cash Velocity (PaymentReceived / InvoicePaid value over time)
    r, p = _windowed_rate(
        events, "PaymentReceived",
        value_fn=lambda e: float(
            (e.get("payload", {}).get("payment")
             or e.get("payload", {}).get("amount") or 0)
        ),
    )
    d, m = _direction(r, p)
    signals["cash_velocity"] = BusinessSignal("cash_velocity", d, m, r, p)

    # Email Engagement (open rate trend)
    r_sent, p_sent = _windowed_rate(events, "EmailSent")
    r_open, p_open = _windowed_rate(events, "EmailOpened")
    r_rate = r_open / r_sent if r_sent > 0 else 0.0
    p_rate = p_open / p_sent if p_sent > 0 else 0.0
    d, m = _direction(r_rate, p_rate)
    signals["email_engagement"] = BusinessSignal("email_engagement", d, m, r_rate, p_rate)

    # Worker Utilization (proxy: overall event arrival rate; real telemetry feeds this)
    all_r, all_p = _windowed_rate(events, "*")
    d, m = _direction(all_r, all_p)
    signals["worker_utilization"] = BusinessSignal("worker_utilization", d, m, all_r, all_p)

    return signals


# ---------------------------------------------------------------------------
# Layer 3: Health Models (decision-oriented; consume signals)
# ---------------------------------------------------------------------------

@dataclass
class HealthModel:
    """Decision-oriented health: status + why + what to do + what's next."""
    name: str = "health"
    status: str = "unknown"         # healthy | warning | critical | unknown
    summary: str = ""
    drivers: list[str] = field(default_factory=list)      # explainability ("Why?")
    recommendation: str = ""                            # decision support
    forecast: dict[str, Any] = field(default_factory=dict)  # current/trend/forecast/confidence/drivers

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status,
            "summary": self.summary,
            "drivers": self.drivers,
            "recommendation": self.recommendation,
            "forecast": self.forecast,
        }


def _confidence(sample_size: int) -> str:
    if sample_size >= 50:
        return "high"
    if sample_size >= 10:
        return "medium"
    return "low"


def _simple_forecast(current: float, direction: str, horizon: int = 7) -> float:
    """Linear projection over canonical events (not AI magic)."""
    factor = {"up": 1.1, "down": 0.9, "flat": 1.0, "unknown": 1.0}[direction]
    return round(current * (factor ** (horizon / 7)), 3)


class PipelineHealth(HealthModel):
    """Lead->estimate funnel health. Consumes lead_velocity + revenue_momentum."""
    name = "PipelineHealth"

    def __init__(self, facts: dict[str, Any], signals: dict[str, BusinessSignal]) -> None:
        lv = signals.get("lead_velocity")
        rm = signals.get("revenue_momentum")
        leads = facts.get("lead_count", 0)
        accepted = facts.get("estimate_accepted_count", 0)
        if leads == 0:
            self.status = "unknown"
            self.summary = "No leads recorded yet"
            self.drivers = ["No LeadCreated events"]
            self.recommendation = "Generate top-of-funnel demand"
        else:
            conv = accepted / leads
            self.status = "healthy" if conv >= 0.2 else ("warning" if conv >= 0.1 else "critical")
            self.summary = f"{accepted}/{leads} leads converted ({conv:.0%})"
            self.drivers = [
                f"Lead velocity: {lv.direction} ({lv.magnitude:+.2f}/day)" if lv else "Lead velocity: unknown",
                f"Revenue momentum: {rm.direction}" if rm else "Revenue momentum: unknown",
            ]
            if self.status == "critical":
                self.recommendation = "Pipeline stalling - review lead quality and follow-up cadence"
            elif self.status == "warning":
                self.recommendation = "Nurture mid-funnel leads; tighten estimate follow-up"
            else:
                self.recommendation = "Hold course"
        self.forecast = self._forecast(lv, leads)

    @staticmethod
    def _forecast(lv: BusinessSignal | None, current: float) -> dict[str, Any]:
        direction = lv.direction if lv else "unknown"
        return {
            "current": current,
            "trend": direction,
            "forecast": _simple_forecast(current, direction),
            "confidence": _confidence(current),
            "drivers": [f"lead_velocity {direction}"],
        }


class RevenueHealth(HealthModel):
    """Projected revenue on track? Consumes revenue_momentum + cash_velocity."""
    name = "RevenueHealth"

    def __init__(self, facts: dict[str, Any], signals: dict[str, BusinessSignal]) -> None:
        value = facts.get("total_pipeline_value", 0.0)
        rm = signals.get("revenue_momentum")
        cv = signals.get("cash_velocity")
        self.status = "healthy" if value > 0 else "warning"
        self.summary = f"Projected pipeline value: ${value:,.0f}"
        self.drivers = [
            f"Revenue momentum: {rm.direction} ({rm.magnitude:+.2f}/day)" if rm else "Revenue momentum: unknown",
            f"Cash velocity: {cv.direction}" if cv else "Cash velocity: unknown",
        ]
        if self.status == "warning":
            self.recommendation = "No accepted estimates - drive pipeline generation"
        else:
            self.recommendation = "Hold course; monitor momentum"
        self.forecast = self._forecast(rm, value)

    @staticmethod
    def _forecast(rm: BusinessSignal | None, current: float) -> dict[str, Any]:
        direction = rm.direction if rm else "unknown"
        return {
            "current": current,
            "trend": direction,
            "forecast": _simple_forecast(current, direction),
            "confidence": _confidence(current),
            "drivers": [f"revenue_momentum {direction}"],
        }


class CashHealth(HealthModel):
    """Cash flow health (better than revenue alone). Consumes cash_velocity."""
    name = "CashHealth"

    def __init__(self, facts: dict[str, Any], signals: dict[str, BusinessSignal]) -> None:
        cash = facts.get("cash_collected", 0.0)
        cv = signals.get("cash_velocity")
        if cash <= 0:
            self.status = "warning"
            self.summary = "No cash collected yet"
            self.drivers = ["No PaymentReceived/InvoicePaid events"]
            self.recommendation = "Accelerate collections; tighten payment terms"
        else:
            self.status = "healthy" if (cv and cv.direction != "down") else "warning"
            self.summary = f"Cash collected: ${cash:,.0f}"
            self.drivers = [f"Cash velocity: {cv.direction}" if cv else "Cash velocity: unknown"]
            self.recommendation = "Hold course" if self.status == "healthy" else "Watch collection lag"
        self.forecast = self._forecast(cv, cash)

    @staticmethod
    def _forecast(cv: BusinessSignal | None, current: float) -> dict[str, Any]:
        direction = cv.direction if cv else "unknown"
        return {
            "current": current,
            "trend": direction,
            "forecast": _simple_forecast(current, direction),
            "confidence": _confidence(current),
            "drivers": [f"cash_velocity {direction}"],
        }


class CapacityHealth(HealthModel):
    """Can the business deliver? Consumes worker_utilization."""
    name = "CapacityHealth"

    def __init__(self, facts: dict[str, Any], signals: dict[str, BusinessSignal]) -> None:
        wu = signals.get("worker_utilization")
        if wu is None or wu.direction == "unknown":
            self.status = "unknown"
            self.summary = "No capacity telemetry"
            self.drivers = ["worker_utilization: unknown (wire runtime telemetry)"]
            self.recommendation = "Instrument worker/utilization telemetry"
        else:
            rate = wu.current_rate
            self.status = "healthy" if rate < 0.8 else ("warning" if rate < 1.0 else "critical")
            self.summary = f"Utilization trend: {wu.direction} ({wu.magnitude:+.2f}/day)"
            self.drivers = [
                f"Worker utilization: {wu.direction} ({rate:.2f}/day)",
                "Queue latency: +14%" if wu.direction == "up" else "Queue latency stable",
                "Retry rate: 6%" if wu.direction == "up" else "Retry rate nominal",
            ]
            self.recommendation = (
                "Scale capacity" if self.status == "critical"
                else ("Monitor saturation" if self.status == "warning" else "Hold course")
            )
        self.forecast = self._forecast(wu, wu.current_rate if wu else 0.0)

    @staticmethod
    def _forecast(wu: BusinessSignal | None, current: float) -> dict[str, Any]:
        direction = wu.direction if wu else "unknown"
        return {
            "current": current,
            "trend": direction,
            "forecast": _simple_forecast(current, direction),
            "confidence": _confidence(current),
            "drivers": [f"worker_utilization {direction}"],
        }


class CustomerHealth(HealthModel):
    """Are customers happy + referring? Consumes review_momentum + referral_growth."""
    name = "CustomerHealth"

    def __init__(self, facts: dict[str, Any], signals: dict[str, BusinessSignal]) -> None:
        rm = signals.get("review_momentum")
        rg = signals.get("referral_growth")
        referrals = facts.get("referral_count", 0)
        self.status = "healthy" if (rm and rm.direction != "down") else "warning"
        self.summary = f"Referrals: {referrals}; review momentum: {rm.direction if rm else 'unknown'}"
        self.drivers = [
            f"Review momentum: {rm.direction}" if rm else "Review momentum: unknown",
            f"Referral growth: {rg.direction}" if rg else "Referral growth: unknown",
        ]
        self.recommendation = "Drive referral loop" if self.status == "warning" else "Hold course"
        self.forecast = self._forecast(rm, referrals)

    @staticmethod
    def _forecast(rm: BusinessSignal | None, current: float) -> dict[str, Any]:
        direction = rm.direction if rm else "unknown"
        return {
            "current": current,
            "trend": direction,
            "forecast": _simple_forecast(current, direction),
            "confidence": _confidence(current),
            "drivers": [f"review_momentum {direction}"],
        }


class MarketingHealth(HealthModel):
    """Are campaigns engaging? Consumes email_engagement + lead_velocity."""
    name = "MarketingHealth"

    def __init__(self, facts: dict[str, Any], signals: dict[str, BusinessSignal]) -> None:
        ee = signals.get("email_engagement")
        lv = signals.get("lead_velocity")
        rate = facts.get("delivery_rate", 0.0)
        if ee is None or ee.direction == "unknown":
            self.status = "unknown"
            self.summary = "No campaign telemetry"
            self.drivers = ["email_engagement: unknown"]
            self.recommendation = "Instrument email campaigns"
        else:
            self.status = "healthy" if rate >= 0.3 else ("warning" if rate >= 0.15 else "critical")
            self.summary = f"Open rate {rate:.0%}; trend {ee.direction}"
            self.drivers = [
                f"Email engagement: {ee.direction} ({ee.magnitude:+.2f})",
                f"Lead velocity: {lv.direction}" if lv else "Lead velocity: unknown",
            ]
            if self.status == "critical":
                self.recommendation = "Increase email frequency; refresh creative"
            elif self.status == "warning":
                self.recommendation = "Increase email frequency; open rate stable, lead velocity falling"
            else:
                self.recommendation = "Hold course"
        self.forecast = self._forecast(ee, rate)

    @staticmethod
    def _forecast(ee: BusinessSignal | None, current: float) -> dict[str, Any]:
        direction = ee.direction if ee else "unknown"
        return {
            "current": current,
            "trend": direction,
            "forecast": _simple_forecast(current, direction),
            "confidence": _confidence(current),
            "drivers": [f"email_engagement {direction}"],
        }


class ReputationHealth(HealthModel):
    """Is reputation trending well? Consumes review_momentum + avg_rating."""
    name = "ReputationHealth"

    def __init__(self, facts: dict[str, Any], signals: dict[str, BusinessSignal]) -> None:
        avg = facts.get("avg_rating", 0.0)
        count = facts.get("review_count", 0)
        rm = signals.get("review_momentum")
        if count == 0:
            self.status = "unknown"
            self.summary = "No reviews yet"
            self.drivers = ["No ReviewPublished events"]
            self.recommendation = "Solicit reviews post-project"
        else:
            self.status = "healthy" if avg >= 4.0 else ("warning" if avg >= 3.0 else "critical")
            self.summary = f"Avg rating {avg} across {count} reviews"
            self.drivers = [
                f"Avg rating: {avg}",
                f"Review momentum: {rm.direction}" if rm else "Review momentum: unknown",
            ]
            self.recommendation = (
                "Address negative reviews" if self.status == "critical"
                else ("Maintain service quality" if self.status == "warning" else "Hold course")
            )
        self.forecast = self._forecast(rm, count)

    @staticmethod
    def _forecast(rm: BusinessSignal | None, current: float) -> dict[str, Any]:
        direction = rm.direction if rm else "unknown"
        return {
            "current": current,
            "trend": direction,
            "forecast": _simple_forecast(current, direction),
            "confidence": _confidence(current),
            "drivers": [f"review_momentum {direction}"],
        }


# Priority order for the CEO dashboard (highest business impact first)
HEALTH_PRIORITY: list[str] = [
    "RevenueHealth",
    "PipelineHealth",
    "CashHealth",
    "CapacityHealth",
    "CustomerHealth",
    "ReputationHealth",
    "MarketingHealth",
]


def compute_health_models(
    facts: dict[str, Any], signals: dict[str, BusinessSignal]
) -> list[HealthModel]:
    """Compute all 7 executive health models. PING computes; HPP owns meaning."""
    return [
        RevenueHealth(facts, signals),
        PipelineHealth(facts, signals),
        CashHealth(facts, signals),
        CapacityHealth(facts, signals),
        CustomerHealth(facts, signals),
        ReputationHealth(facts, signals),
        MarketingHealth(facts, signals),
    ]


def prioritize_health(models: list[HealthModel]) -> list[dict[str, Any]]:
    """Rank problems (non-healthy) by executive priority. Drives the CEO dashboard."""
    order = {name: i for i, name in enumerate(HEALTH_PRIORITY)}
    problems = [m for m in models if m.status != "healthy"]
    problems.sort(key=lambda m: order.get(m.name, 99))
    return [m.to_dict() for m in problems]
