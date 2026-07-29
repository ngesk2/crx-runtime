# OSS Domain Models Import Guide

This document outlines the domain models to extract from OSS systems for constitutional event schema import.

## Import Strategy

**Import:**
- Entities (Customer, Lead, Opportunity, Invoice, Project, Task)
- Workflows (Lead → Opportunity → Invoice, Project → Task → Completion)
- Event vocabularies (state transitions, lifecycle events)
- Lifecycle states (Draft, Active, Closed, Won, Lost)

**Ignore:**
- Infrastructure (database schemas, API endpoints)
- Repositories (data access patterns)
- Services (business logic implementations)
- Frameworks (web frameworks, ORM configurations)

## OSS Systems

### ERPNext

**Entities:**
- Customer
- Lead
- Opportunity
- Quotation
- Sales Order
- Invoice
- Project
- Task

**Workflows:**
- Lead → Opportunity → Quotation → Sales Order → Invoice
- Project → Task → Timesheet → Invoice

**Event Vocabulary:**
- LeadCreated, LeadConverted, OpportunityCreated, QuotationSent, SalesOrderCreated, InvoiceGenerated, InvoicePaid

**Lifecycle States:**
- Draft, Submitted, Open, Closed, Cancelled

### Odoo

**Entities:**
- res.partner (Customer)
- crm.lead (Lead)
- sale.order (Sales Order)
- account.move (Invoice)
- project.project (Project)
- project.task (Task)

**Workflows:**
- Lead → Opportunity → Quotation → Sales Order → Invoice
- Project → Task → Timesheet → Invoice

**Event Vocabulary:**
- LeadCreated, LeadConverted, OpportunityWon, OrderConfirmed, InvoiceValidated, InvoicePaid

**Lifecycle States:**
- Draft, Confirmed, Done, Cancelled

### Twenty CRM

**Entities:**
- Person
- Company
- Opportunity
- Activity
- Project

**Workflows:**
- Person → Opportunity → Activity → Close

**Event Vocabulary:**
- PersonCreated, OpportunityCreated, ActivityLogged, OpportunityWon, OpportunityLost

**Lifecycle States:**
- Open, Won, Lost

### Plane

**Entities:**
- Project
- Issue
- Cycle
- Module

**Workflows:**
- Issue → Backlog → In Progress → Completed
- Cycle → Start → Progress → Complete

**Event Vocabulary:**
- IssueCreated, IssueStarted, IssueCompleted, CycleStarted, CycleCompleted

**Lifecycle States:**
- Backlog, Todo, In Progress, Done, Cancelled

### OpenProject

**Entities:**
- Project
- Work Package
- Task
- Time Entry

**Workflows:**
- Work Package → Task → Time Entry → Complete

**Event Vocabulary:**
- WorkPackageCreated, TaskCreated, TimeEntryLogged, WorkPackageCompleted

**Lifecycle States:**
- New, In Progress, Closed, On Hold

### Listmonk

**Entities:**
- Subscriber
- List
- Campaign
- Template

**Workflows:**
- Subscriber → List → Campaign → Sent

**Event Vocabulary:**
- SubscriberAdded, ListCreated, CampaignSent, EmailOpened, EmailClicked

**Lifecycle States:**
- Active, Unsubscribed, Bounced

### Postal

**Entities:**
- Mail Server
- Domain
- Route
- Message

**Workflows:**
- Message → Route → Mail Server → Delivered

**Event Vocabulary:**
- MessageReceived, MessageQueued, MessageDelivered, MessageBounced

**Lifecycle States:**
- Queued, Sent, Delivered, Bounced

### Plausible

**Entities:**
- Website
- Pageview
- Session
- Event

**Workflows:**
- Session → Pageview → Event

**Event Vocabulary:**
- SessionStarted, PageviewRecorded, CustomEventTracked

**Lifecycle States:**
- Active, Bounced

## Constitutional Event Mapping

Map OSS entities to constitutional domain events:

**Lead Events:**
- ERPNext LeadCreated → LeadCaptured
- Odoo crm.lead.create → LeadCaptured
- Twenty CRM PersonCreated → LeadCaptured

**Opportunity Events:**
- ERPNext OpportunityCreated → OpportunityCreated
- Odoo crm.lead.convert → OpportunityCreated
- Twenty CRM OpportunityCreated → OpportunityCreated

**Invoice Events:**
- ERPNext InvoiceGenerated → InvoiceSent
- Odoo account.move.create → InvoiceSent
- ERPNext InvoicePaid → InvoicePaid
- Odoo account.move.payment → InvoicePaid

**Project Events:**
- Plane ProjectCreated → ProjectCreated
- OpenProject ProjectCreated → ProjectCreated

**Task Events:**
- Plane IssueCreated → TaskCreated
- OpenProject TaskCreated → TaskCreated
- Plane IssueCompleted → TaskCompleted
- OpenProject TaskCompleted → TaskCompleted

## Implementation Steps

1. **Extract Entity Schemas**
   - Review OSS system database schemas
   - Identify core entities and their relationships
   - Document entity attributes and constraints

2. **Map Workflows**
   - Identify state transitions in OSS systems
   - Map to constitutional event vocabulary
   - Document workflow triggers and conditions

3. **Define Event Schemas**
   - Create constitutional event types for each OSS state transition
   - Include OSS system identifiers for traceability
   - Define canonical serialization format

4. **Create Connectors**
   - Implement event ingestion from OSS systems
   - Transform OSS events to constitutional events
   - Handle event deduplication and ordering

5. **Validate Projections**
   - Ensure business metrics project correctly from constitutional events
   - Verify replay reconstructs OSS state
   - Test constitutional authority preservation
