# Tier 9 — Competitive Harvesting Program Specification

## Overview

Create a permanent backlog to review leading products monthly, extract excellent interaction patterns and workflow optimizations, and implement them as UX improvements on the constitutional kernel. Never copy architecture—always improve the experience.

## Harvesting Process

### Monthly Review Cycle

**Frequency**: First Monday of every month
**Duration**: 2-4 hours
**Participants**: Product team, UX team, Engineering team
**Output**: UX improvement backlog with priority scores

### Products to Review

**Primary Targets** (review every month):
- Buzz (command interface)
- Linear (work queue, issue UX)
- Notion (document presentation)
- Slack (messaging, collaboration)
- Monday (project management)
- ClickUp (task management)
- HubSpot (CRM, marketing)
- Salesforce (CRM, automation)
- ServiceTitan (field service)
- Housecall Pro (field service)

**Secondary Targets** (review quarterly):
- Omniroute (routing, orchestration)
- Orca (mission planning, dependency visualization)
- Asana (project management)
- Trello (kanban boards)
- Jira (issue tracking)
- Confluence (documentation)
- Figma (design collaboration)
- Miro (visual collaboration)
- Zapier (automation)
- Make (automation)

**Tertiary Targets** (review annually):
- Google Workspace (productivity suite)
- Microsoft 365 (productivity suite)
- Atlassian suite (developer tools)
- Adobe Creative Cloud (design tools)
- Salesforce ecosystem (enterprise CRM)

## Harvesting Framework

### For Each Product, Ask:

1. **What interaction pattern is excellent?**
   - What makes it feel good?
   - What reduces friction?
   - What creates delight?

2. **What workflow reduces clicks?**
   - What's the most efficient path?
   - What eliminates steps?
   - What automates decisions?

3. **Can the constitutional kernel already support it?**
   - Do we have the events?
   - Do we have the workers?
   - Do we have the projections?
   - Do we have the capabilities?

4. **If yes, implement the UX only.**
   - Don't change the kernel
   - Don't add new capabilities
   - Just improve the interface

5. **If no, what's missing?**
   - Missing events?
   - Missing workers?
   - Missing projections?
   - Missing capabilities?

## Product Analysis Templates

### Buzz Analysis

**Focus**: Command interface, unified inbox, conversational UX

**Questions to Ask**:
- How does Buzz handle command parsing?
- What makes the command suggestions helpful?
- How does Buzz present unified inbox?
- What makes the conversational interface natural?
- How does Buzz handle context switching?

**Interaction Patterns to Harvest**:
- Command auto-completion behavior
- Suggestion ranking algorithm
- Context-aware command suggestions
- Unified inbox filtering
- Conversation threading

**Workflow Optimizations**:
- Quick actions from inbox
- Bulk operations
- Keyboard shortcuts
- Voice command integration

**Constitutional Kernel Support**:
- ✅ Command parsing (Ollama)
- ✅ Context resolution (Knowledge Graph)
- ✅ Event filtering (PostgreSQL)
- ✅ Unified inbox (Projections)
- ⚠️ Voice commands (Ollama - needs implementation)

**UX Improvements to Implement**:
- Improve command auto-completion ranking
- Add keyboard shortcuts for common actions
- Implement bulk operations from inbox
- Add voice command interface
- Improve conversation threading

---

### Linear Analysis

**Focus**: Work queue, issue UX, project management

**Questions to Ask**:
- What makes Linear's issue list so clean?
- How does Linear handle issue priorities?
- What makes the workflow transitions smooth?
- How does Linear present project progress?
- What makes the keyboard navigation excellent?

**Interaction Patterns to Harvest**:
- Issue list filtering and sorting
- Priority assignment UX
- Status transition workflow
- Project progress visualization
- Keyboard-first navigation

**Workflow Optimizations**:
- Quick issue creation
- Bulk status changes
- Sprint planning interface
- Issue dependencies visualization
- Time tracking integration

**Constitutional Kernel Support**:
- ✅ Task management (Tasks projection)
- ✅ Status tracking (Task events)
- ✅ Priority assignment (Task events)
- ✅ Dependencies (Knowledge Graph)
- ⚠️ Time tracking (needs events)

**UX Improvements to Implement**:
- Improve task list filtering
- Add keyboard navigation
- Implement bulk status changes
- Add time tracking interface
- Improve dependency visualization

---

### Notion Analysis

**Focus**: Document presentation, knowledge management, rich editing

**Questions to Ask**:
- What makes Notion's document editing so smooth?
- How does Notion handle hierarchical organization?
- What makes the database views flexible?
- How does Notion present related content?
- What makes the collaboration features seamless?

**Interaction Patterns to Harvest**:
- Block-based editing
- Hierarchical page organization
- Database view switching
- Related content linking
- Real-time collaboration indicators

**Workflow Optimizations**:
- Quick page creation
- Template application
- Bulk content operations
- Content reuse
- Version history navigation

**Constitutional Kernel Support**:
- ✅ Document storage (PostgreSQL)
- ✅ Content relationships (Knowledge Graph)
- ✅ Version history (Event log)
- ⚠️ Rich editing (needs capability)
- ⚠️ Real-time collaboration (needs capability)

**UX Improvements to Implement**:
- Improve document editing interface
- Add hierarchical organization
- Implement template system
- Add content reuse features
- Improve version history navigation

---

### Slack Analysis

**Focus**: Messaging, collaboration, channel organization

**Questions to Ask**:
- What makes Slack's messaging so engaging?
- How does Slack handle channel organization?
- What makes the search so effective?
- How does Slack present notifications?
- What makes the integrations seamless?

**Interaction Patterns to Harvest**:
- Message threading
- Channel organization
- Search result presentation
- Notification prioritization
- Integration configuration

**Workflow Optimizations**:
- Quick message actions
- Channel switching
- Message formatting
- File sharing
- Reaction shortcuts

**Constitutional Kernel Support**:
- ✅ Messaging (Chat events)
- ✅ Channels (Workspace events)
- ✅ Search (Qdrant + PostgreSQL)
- ✅ Notifications (Notification events)
- ⚠️ Integrations (Capability Registry - needs more)

**UX Improvements to Implement**:
- Improve message threading
- Add channel organization features
- Improve search result presentation
- Add notification prioritization
- Simplify integration configuration

---

### Monday Analysis

**Focus**: Project management, workflow visualization, team collaboration

**Questions to Ask**:
- What makes Monday's workflow visualization so clear?
- How does Monday handle project dependencies?
- What makes the team collaboration features effective?
- How does Monday present project timelines?
- What makes the automation builder accessible?

**Interaction Patterns to Harvest**:
- Workflow visualization
- Dependency management
- Team assignment UX
- Timeline presentation
- Automation builder interface

**Workflow Optimizations**:
- Quick project creation
- Status updates
- Resource allocation
- Progress tracking
- Automation triggers

**Constitutional Kernel Support**:
- ✅ Project management (Mission Runtime)
- ✅ Dependencies (Knowledge Graph)
- ✅ Team assignment (Task events)
- ✅ Timeline (Event log)
- ✅ Automation (Mission Runtime)

**UX Improvements to Implement**:
- Improve workflow visualization
- Add dependency management UI
- Improve team assignment interface
- Enhance timeline presentation
- Simplify automation builder

---

### HubSpot Analysis

**Focus**: CRM, marketing automation, lead management

**Questions to Ask**:
- What makes HubSpot's CRM so intuitive?
- How does HubSpot handle lead scoring?
- What makes the marketing automation builder powerful?
- How does HubSpot present customer journeys?
- What makes the reporting actionable?

**Interaction Patterns to Harvest**:
- Contact management UX
- Lead scoring interface
- Marketing automation builder
- Customer journey visualization
- Report builder

**Workflow Optimizations**:
- Quick contact creation
- Lead qualification
- Campaign setup
- Deal stage transitions
- Report generation

**Constitutional Kernel Support**:
- ✅ CRM (Knowledge Graph + Events)
- ✅ Lead scoring (Lead projection)
- ✅ Marketing automation (Mission Runtime)
- ✅ Customer journeys (Event log)
- ✅ Reporting (BI system)

**UX Improvements to Implement**:
- Improve contact management interface
- Add lead scoring visualization
- Enhance marketing automation builder
- Improve customer journey visualization
- Simplify report builder

---

### ServiceTitan Analysis

**Focus**: Field service, scheduling, job management

**Questions to Ask**:
- What makes ServiceTitan's scheduling so effective?
- How does ServiceTitan handle job dispatching?
- What makes the mobile field app so useful?
- How does ServiceTitan present job profitability?
- What makes the customer communication seamless?

**Interaction Patterns to Harvest**:
- Scheduling calendar interface
- Job dispatching workflow
- Mobile field app UX
- Profitability visualization
- Customer communication automation

**Workflow Optimizations**:
- Quick job scheduling
- Crew assignment
- Job status updates
- Invoice generation
- Customer notifications

**Constitutional Kernel Support**:
- ✅ Scheduling (Task events)
- ✅ Job management (Mission Runtime)
- ✅ Crew assignment (Task events)
- ✅ Profitability (BI system)
- ✅ Communication (Notification events)
- ⚠️ Mobile app (needs implementation)

**UX Improvements to Implement**:
- Improve scheduling calendar
- Add job dispatching interface
- Build mobile field app
- Enhance profitability visualization
- Improve customer communication automation

---

### Omniroute Analysis

**Focus**: Routing, orchestration, state management

**Questions to Ask**:
- What makes Omniroute's routing visualization so clear?
- How does Omniroute handle complex orchestrations?
- What makes the state management transparent?
- How does Omniroute present routing decisions?
- What makes the debugging interface effective?

**Interaction Patterns to Harvest**:
- Routing visualization
- Orchestration builder
- State presentation
- Decision logging
- Debug interface

**Workflow Optimizations**:
- Route configuration
- Orchestration testing
- State inspection
- Decision override
- Error recovery

**Constitutional Kernel Support**:
- ✅ Routing (Mission Runtime)
- ✅ Orchestration (Mission Runtime)
- ✅ State management (Event log)
- ✅ Decision logging (Event log)
- ✅ Debug interface (Mission Debug)

**UX Improvements to Implement**:
- Improve routing visualization
- Enhance orchestration builder
- Add state inspection UI
- Improve decision logging presentation
- Enhance debug interface

---

### Orca Analysis

**Focus**: Mission planning, dependency visualization, project management

**Questions to Ask**:
- What makes Orca's dependency visualization so clear?
- How does Orca handle complex mission planning?
- What makes the project timeline intuitive?
- How does Orca present resource allocation?
- What makes the risk assessment helpful?

**Interaction Patterns to Harvest**:
- Dependency visualization
- Mission planning interface
- Timeline presentation
- Resource allocation UX
- Risk assessment display

**Workflow Optimizations**:
- Mission creation
- Dependency configuration
- Resource assignment
- Timeline adjustment
- Risk mitigation

**Constitutional Kernel Support**:
- ✅ Dependencies (Knowledge Graph)
- ✅ Mission planning (Mission Runtime)
- ✅ Timeline (Event log)
- ✅ Resource allocation (Task events)
- ✅ Risk assessment (BI system)

**UX Improvements to Implement**:
- Improve dependency visualization
- Enhance mission planning interface
- Improve timeline presentation
- Add resource allocation UI
- Enhance risk assessment display

## Harvesting Backlog

### Backlog Structure

```yaml
harvested_improvement:
  id: "HI-001"
  source_product: "Buzz"
  pattern_type: "command_interface"
  pattern_description: "Command auto-completion with context awareness"
  workflow_optimization: "Reduces typing by 60%"
  kernel_support: "yes"
  implementation_type: "ux_only"
  priority: "high"
  effort: "medium"
  status: "pending"
  assigned_to: "ux_team"
  estimated_completion: "2 weeks"
```

### Priority Scoring

**Priority Factors**:
- **Impact**: How much does this improve user experience? (1-10)
- **Frequency**: How often will users use this? (1-10)
- **Effort**: How difficult is implementation? (1-10, inverted)
- **Risk**: How risky is implementation? (1-10, inverted)

**Priority Score** = (Impact + Frequency) / (Effort + Risk)

**Priority Levels**:
- **Critical**: Score > 2.0
- **High**: Score > 1.5
- **Medium**: Score > 1.0
- **Low**: Score <= 1.0

## Implementation Process

### UX-Only Improvements

**Process**:
1. Design new UI component
2. Implement frontend changes
3. Test with existing kernel
4. Deploy to production
5. Monitor usage metrics

**Example**: Improve command auto-completion
- Design: Better suggestion ranking algorithm
- Implement: Frontend suggestion component
- Test: Verify suggestions are more accurate
- Deploy: Roll out to all users
- Monitor: Track suggestion acceptance rate

### Kernel-Required Improvements

**Process**:
1. Identify missing kernel capability
2. Design kernel enhancement
3. Implement kernel changes (events, workers, projections)
4. Design UI component
5. Implement frontend changes
6. Test end-to-end
7. Deploy to production
8. Monitor usage metrics

**Example**: Add voice command interface
- Identify: Missing voice capability
- Design: Voice events + Ollama speech-to-text
- Implement: Add VOICE_COMMAND events, voice worker
- Design: Voice input UI component
- Implement: Frontend voice input
- Test: Verify voice commands work
- Deploy: Roll out to all users
- Monitor: Track voice command usage

## Monthly Harvesting Meeting

### Agenda

1. **Product Review (30 min per product)**
   - Demo key features
   - Identify excellent patterns
   - Document workflow optimizations

2. **Kernel Support Assessment (15 min per product)**
   - Check if kernel supports pattern
   - Identify missing capabilities
   - Estimate implementation effort

3. **Prioritization (30 min)**
   - Score all harvested improvements
   - Rank by priority score
   - Assign to teams

4. **Backlog Update (15 min)**
   - Add new improvements to backlog
   - Update status of existing items
   - Assign completion dates

### Output

- **Harvesting Report**: Document of all patterns identified
- **Backlog Update**: New improvements added to backlog
- **Implementation Plan**: Next month's implementation priorities
- **Kernel Roadmap**: Missing capabilities to add to kernel roadmap

## Success Criteria

- **Coverage**: Review at least 5 products per month
- **Quality**: Identify at least 3 excellent patterns per product
- **Actionability**: 80% of identified patterns are implementable
- **Implementation**: Complete top 5 priority improvements per month
- **Impact**: Measurable improvement in user satisfaction
- **Efficiency**: Reduce user clicks by 20% on average

## Notes

- Never copy architecture—only interaction patterns
- Always verify kernel support before committing to implementation
- Prioritize UX-only improvements over kernel changes
- Document all patterns with screenshots and descriptions
- Maintain permanent backlog of all harvested improvements
- Review backlog quarterly to remove outdated items
- Share findings across product, UX, and engineering teams
- Use competitive analysis to inspire, not imitate
