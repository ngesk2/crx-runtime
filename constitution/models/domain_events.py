"""
Constitutional Domain Events

Business-native event vocabulary for the constitutional runtime.
These events represent the core domain entities and lifecycle states
derived from OSS systems (ERPNext, Odoo, Twenty CRM, Plane, OpenProject, Listmonk, Postal, Plausible).

All business operations project from these constitutional events.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4


class EventCategory(Enum):
    """Categories of constitutional domain events."""
    LEAD = "lead"
    OPPORTUNITY = "opportunity"
    ESTIMATE = "estimate"
    INVOICE = "invoice"
    CREW = "crew"
    JOB = "job"
    REVIEW = "review"
    REFERRAL = "referral"
    CUSTOMER = "customer"
    MARKETING = "marketing"
    PROJECT = "project"
    TASK = "task"


# Lead Events
@dataclass
class LeadCaptured:
    """A lead has been captured from any source."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "LeadCaptured"
    event_category: EventCategory = EventCategory.LEAD
    lead_id: str = ""
    source: str = ""  # website, referral, advertising, etc.
    contact_name: str = ""
    contact_email: str = ""
    contact_phone: Optional[str] = None
    company_name: Optional[str] = None
    captured_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class LeadQualified:
    """A lead has been qualified as a potential opportunity."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "LeadQualified"
    event_category: EventCategory = EventCategory.LEAD
    lead_id: str = ""
    qualified_by: str = ""
    qualification_criteria: Dict[str, Any] = field(default_factory=dict)
    qualified_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class LeadConverted:
    """A lead has been converted to an opportunity."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "LeadConverted"
    event_category: EventCategory = EventCategory.LEAD
    lead_id: str = ""
    opportunity_id: str = ""
    converted_by: str = ""
    converted_at: datetime = field(default_factory=datetime.utcnow)


# Opportunity Events
@dataclass
class OpportunityCreated:
    """An opportunity has been created."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "OpportunityCreated"
    event_category: EventCategory = EventCategory.OPPORTUNITY
    opportunity_id: str = ""
    lead_id: Optional[str] = None
    customer_id: str = ""
    estimated_value: float = 0.0
    probability: int = 50  # 0-100
    expected_close_date: Optional[datetime] = None
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class OpportunityWon:
    """An opportunity has been won."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "OpportunityWon"
    event_category: EventCategory = EventCategory.OPPORTUNITY
    opportunity_id: str = ""
    actual_value: float = 0.0
    closed_by: str = ""
    closed_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class OpportunityLost:
    """An opportunity has been lost."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "OpportunityLost"
    event_category: EventCategory = EventCategory.OPPORTUNITY
    opportunity_id: str = ""
    reason: str = ""  # price, competition, timing, etc.
    lost_by: str = ""
    lost_at: datetime = field(default_factory=datetime.utcnow)


# Estimate Events
@dataclass
class EstimateRequested:
    """An estimate has been requested by a customer."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "EstimateRequested"
    event_category: EventCategory = EventCategory.ESTIMATE
    estimate_id: str = ""
    customer_id: str = ""
    job_type: str = ""
    requested_by: str = ""
    requested_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class EstimateApproved:
    """An estimate has been approved by the customer."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "EstimateApproved"
    event_category: EventCategory = EventCategory.ESTIMATE
    estimate_id: str = ""
    approved_by: str = ""
    approved_at: datetime = field(default_factory=datetime.utcnow)


# Invoice Events
@dataclass
class InvoiceSent:
    """An invoice has been sent to a customer."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "InvoiceSent"
    event_category: EventCategory = EventCategory.INVOICE
    invoice_id: str = ""
    customer_id: str = ""
    amount: float = 0.0
    due_date: Optional[datetime] = None
    sent_by: str = ""
    sent_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class InvoicePaid:
    """An invoice has been paid."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "InvoicePaid"
    event_category: EventCategory = EventCategory.INVOICE
    invoice_id: str = ""
    amount_paid: float = 0.0
    payment_method: str = ""
    paid_at: datetime = field(default_factory=datetime.utcnow)


# Crew Events
@dataclass
class CrewAssigned:
    """A crew has been assigned to a job."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "CrewAssigned"
    event_category: EventCategory = EventCategory.CREW
    crew_id: str = ""
    job_id: str = ""
    assigned_by: str = ""
    assigned_at: datetime = field(default_factory=datetime.utcnow)


# Job Events
@dataclass
class JobCompleted:
    """A job has been completed."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "JobCompleted"
    event_category: EventCategory = EventCategory.JOB
    job_id: str = ""
    completed_by: str = ""
    completed_at: datetime = field(default_factory=datetime.utcnow)


# Review Events
@dataclass
class ReviewRequested:
    """A review has been requested from a customer."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "ReviewRequested"
    event_category: EventCategory = EventCategory.REVIEW
    review_id: str = ""
    customer_id: str = ""
    job_id: Optional[str] = None
    requested_by: str = ""
    requested_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ReviewReceived:
    """A review has been received from a customer."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "ReviewReceived"
    event_category: EventCategory = EventCategory.REVIEW
    review_id: str = ""
    customer_id: str = ""
    rating: int = 0  # 1-5
    comment: Optional[str] = None
    received_at: datetime = field(default_factory=datetime.utcnow)


# Referral Events
@dataclass
class ReferralCreated:
    """A referral has been created."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "ReferralCreated"
    event_category: EventCategory = EventCategory.REFERRAL
    referral_id: str = ""
    referrer_id: str = ""
    referred_customer_id: str = ""
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)


# Customer Events
@dataclass
class CustomerCreated:
    """A customer has been created."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "CustomerCreated"
    event_category: EventCategory = EventCategory.CUSTOMER
    customer_id: str = ""
    name: str = ""
    email: str = ""
    phone: Optional[str] = None
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)


# Marketing Events
@dataclass
class CampaignLaunched:
    """A marketing campaign has been launched."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "CampaignLaunched"
    event_category: EventCategory = EventCategory.MARKETING
    campaign_id: str = ""
    campaign_type: str = ""  # email, social, advertising, etc.
    budget: float = 0.0
    launched_by: str = ""
    launched_at: datetime = field(default_factory=datetime.utcnow)


# Project Events
@dataclass
class ProjectCreated:
    """A project has been created."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "ProjectCreated"
    event_category: EventCategory = EventCategory.PROJECT
    project_id: str = ""
    name: str = ""
    description: Optional[str] = None
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)


# Task Events
@dataclass
class TaskCreated:
    """A task has been created."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "TaskCreated"
    event_category: EventCategory = EventCategory.TASK
    task_id: str = ""
    project_id: Optional[str] = None
    title: str = ""
    assigned_to: Optional[str] = None
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class TaskCompleted:
    """A task has been completed."""
    event_id: UUID = field(default_factory=uuid4)
    event_type: str = "TaskCompleted"
    event_category: EventCategory = EventCategory.TASK
    task_id: str = ""
    completed_by: str = ""
    completed_at: datetime = field(default_factory=datetime.utcnow)
