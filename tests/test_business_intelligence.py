"""Tests for the Business Intelligence layer.

Pure-function tests (no DB): facts -> signals -> health models -> prioritization.
Verifies the stack the CEO steered toward:

  Business Facts -> Business Signals -> Health Models (status/drivers/
  recommendation/forecast) -> Prioritization.
"""

from datetime import datetime, timedelta, timezone

from analytics.business_projections import (
    CashHealth,
    PipelineHealth,
    compute_business_facts,
    compute_business_signals,
    compute_health_models,
    prioritize_health,
    HEALTH_PRIORITY,
)


def _ts(days_ago: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


def _ev(event_type: str, days_ago: int, payload=None) -> dict:
    return {
        "event_type": event_type,
        "payload": payload or {},
        "global_sequence": 0,
        "occurred_at": _ts(days_ago),
    }


def test_facts_basic_aggregation():
    events = [
        _ev("LeadCreated", 2),
        _ev("EstimateAccepted", 1, {"amount": 5000}),
        _ev("PaymentReceived", 1, {"payment": 2000}),
        _ev("ReviewPublished", 1, {"rating": 5}),
        _ev("EmailSent", 1),
        _ev("EmailOpened", 1),
    ]
    facts = compute_business_facts(events)
    assert facts["lead_count"] == 1
    assert facts["total_pipeline_value"] == 5000.0
    assert facts["cash_collected"] == 2000.0
    assert facts["avg_rating"] == 5.0
    assert facts["delivery_rate"] == 1.0


def test_signal_lead_velocity_up():
    events = (
        [_ev("LeadCreated", d) for d in (1, 2, 3)]      # recent: 3
        + [_ev("LeadCreated", d) for d in (10, 11)]      # prior: 2
    )
    signals = compute_business_signals(events)
    assert signals["lead_velocity"].direction == "up"
    assert signals["lead_velocity"].current_rate > signals["lead_velocity"].prior_rate


def test_signal_lead_velocity_down():
    events = (
        [_ev("LeadCreated", d) for d in (1,)]             # recent: 1
        + [_ev("LeadCreated", d) for d in (10, 11, 12)]   # prior: 3
    )
    signals = compute_business_signals(events)
    assert signals["lead_velocity"].direction == "down"


def test_signal_flat_when_stable():
    events = (
        [_ev("LeadCreated", d) for d in (1, 2)]           # recent: 2
        + [_ev("LeadCreated", d) for d in (10, 11)]        # prior: 2
    )
    signals = compute_business_signals(events)
    assert signals["lead_velocity"].direction == "flat"


def test_seven_health_models_present():
    events = [_ev("LeadCreated", 2), _ev("EstimateAccepted", 1, {"amount": 1000})]
    facts = compute_business_facts(events)
    signals = compute_business_signals(events)
    models = compute_health_models(facts, signals)
    names = {m.name for m in models}
    assert names == {
        "RevenueHealth", "CashHealth", "PipelineHealth", "CapacityHealth",
        "CustomerHealth", "ReputationHealth", "MarketingHealth",
    }


def test_health_model_shape_has_forecast_and_drivers():
    events = [_ev("LeadCreated", 2), _ev("EstimateAccepted", 1, {"amount": 1000})]
    facts = compute_business_facts(events)
    signals = compute_business_signals(events)
    models = compute_health_models(facts, signals)
    assert len(models) == 7
    for m in models:
        d = m.to_dict()
        assert d["status"] in ("healthy", "warning", "critical", "unknown")
        assert isinstance(d["drivers"], list) and d["drivers"]
        assert isinstance(d["recommendation"], str) and d["recommendation"]
        assert set(d["forecast"].keys()) == {
            "current", "trend", "forecast", "confidence", "drivers",
        }


def test_cash_health_consumes_cash_velocity():
    events = [_ev("PaymentReceived", 1, {"payment": 500})]
    facts = compute_business_facts(events)
    signals = compute_business_signals(events)
    cash = CashHealth(facts, signals)
    assert cash.name == "CashHealth"
    assert cash.status in ("healthy", "warning")
    assert "Cash velocity" in cash.drivers[0]


def test_explainability_answers_why():
    # Stale leads, none recent -> pipeline should explain why + recommend
    events = [_ev("LeadCreated", 10), _ev("LeadCreated", 11), _ev("LeadCreated", 12)]
    facts = compute_business_facts(events)
    signals = compute_business_signals(events)
    pipe = PipelineHealth(facts, signals)
    assert pipe.drivers  # "Why?"
    assert pipe.recommendation  # decision support


def test_prioritize_ranks_problems_by_executive_priority():
    # No recent leads -> pipeline critical; no cash -> cash warning
    events = [_ev("LeadCreated", 10), _ev("LeadCreated", 11), _ev("LeadCreated", 12)]
    facts = compute_business_facts(events)
    signals = compute_business_signals(events)
    models = compute_health_models(facts, signals)
    problems = prioritize_health(models)
    # All returned items are non-healthy
    assert all(p["status"] != "healthy" for p in problems)
    # Ordered by HEALTH_PRIORITY (Revenue first, Marketing last)
    order = {n: i for i, n in enumerate(HEALTH_PRIORITY)}
    indices = [order[p["name"]] for p in problems]
    assert indices == sorted(indices)
    # RevenueHealth should outrank MarketingHealth when both are problems
    names = {p["name"] for p in problems}
    if "RevenueHealth" in names and "MarketingHealth" in names:
        assert order["RevenueHealth"] < order["MarketingHealth"]
