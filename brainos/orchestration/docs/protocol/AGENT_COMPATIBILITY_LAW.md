# Agent Compatibility Law

**Phase 34:** Future agents consume constitutional primitives

---

## Overview

Agent Compatibility Law establishes that future agents consume Objects, Events, Relationships, Lineage, and Witnesses. Agents never become truth. Agent memory is projection. Agent reasoning is projection. Agent plans are projection.

---

## Agent Consumption

### Required Consumption
Future agents may only consume:
- **Objects:** Constitutional objects from Layer 0
- **Events:** Immutable events from Layer 1
- **Relationships:** Constitutional relationships
- **Lineage:** Lineage information from canonical state
- **Witnesses:** Execution witnesses from replay system

### Prohibited Consumption
Future agents may never:
- Become sources of truth
- Mutate constitutional truth
- Bypass event sourcing
- Modify state directly
- Create independent data stores

---

## Agent Interface

### Interface Definition
```python
class AgentInterface:
    """Agent interface for constitutional consumption."""
    
    @abstractmethod
    def consume_objects(self, filters: Dict = None) -> List[Artifact]:
        """
        Consume objects from constitutional truth.
        
        Args:
            filters: Filters (optional)
        
        Returns:
            List of objects
        
        Requirement:
            Query canonical state only
            Never query projections
        """
        pass
    
    @abstractmethod
    def consume_events(self, filters: Dict = None) -> List[Event]:
        """
        Consume events from constitutional truth.
        
        Args:
            filters: Filters (optional)
        
        Returns:
            List of events
        
        Requirement:
            Query canonical state only
            Never query projections
        """
        pass
    
    @abstractmethod
    def consume_relationships(self, filters: Dict = None) -> List[RelationshipArtifact]:
        """
        Consume relationships from constitutional truth.
        
        Args:
            filters: Filters (optional)
        
        Returns:
            List of relationships
        
        Requirement:
            Query canonical state only
            Never query projections
        """
        pass
    
    @abstractmethod
    def consume_lineage(self, lineage_id: UUID) -> Lineage:
        """
        Consume lineage from constitutional truth.
        
        Args:
            lineage_id: Lineage ID
        
        Returns:
            Lineage
        
        Requirement:
            Query canonical state only
            Never query projections
        """
        pass
    
    @abstractmethod
    def consume_witnesses(self, execution_id: UUID = None) -> List[Witness]:
        """
        Consume witnesses from constitutional truth.
        
        Args:
            execution_id: Execution ID (optional)
        
        Returns:
            List of witnesses
        
        Requirement:
            Query canonical state only
            Never query projections
        """
        pass
```

---

## Agent Memory Projection

### Memory as Projection
```python
class AgentMemory:
    """Agent memory projection."""
    
    def __init__(self, agent_id: UUID):
        """Initialize agent memory."""
        self.agent_id = agent_id
        self.memory_objects = []
        self.memory_events = []
        self.memory_relationships = []
    
    def update_memory(self, objects: List[Artifact], events: List[Event]):
        """
        Update agent memory from constitutional truth.
        
        Args:
            objects: Objects to remember
            events: Events to remember
        
        Requirement:
            Agent memory is projection
        """
        # Update memory from constitutional truth
        self.memory_objects = objects
        self.memory_events = events
        
        # Memory is projection, not storage
        # Memory can be rebuilt from constitutional truth
```

---

## Agent Reasoning Projection

### Reasoning as Projection
```python
class AgentReasoning:
    """Agent reasoning projection."""
    
    def __init__(self, agent_id: UUID):
        """Initialize agent reasoning."""
        self.agent_id = agent_id
        self.reasoning_chain = []
    
    def reason(self, objects: List[Artifact], events: List[Event]) -> Dict:
        """
        Reason about objects and events.
        
        Args:
            objects: Objects to reason about
            events: Events to reason about
        
        Returns:
        Reasoning result
        
        Requirement:
            Agent reasoning is projection
        """
        # Reason about constitutional truth
        reasoning_result = self.perform_reasoning(objects, events)
        
        # Store reasoning chain
        self.reasoning_chain.append(reasoning_result)
        
        # Reasoning is projection, not storage
        # Reasoning can be rebuilt from constitutional truth
        
        return reasoning_result
```

---

## Agent Plan Projection

### Plan as Projection
```python
class AgentPlan:
    """Agent plan projection."""
    
    def __init__(self, agent_id: UUID):
        """Initialize agent plan."""
        self.agent_id = agent_id
        self.plan_steps = []
    
    def create_plan(self, objects: List[Artifact], events: List[Event]) -> List[Dict]:
        """
        Create plan based on objects and events.
        
        Args:
            objects: Objects to plan for
            events: Events to plan for
        
        Returns:
        Plan steps
        
        Requirement:
            Agent plans are projection
        """
        # Create plan based on constitutional truth
        plan_steps = self.perform_planning(objects, events)
        
        # Store plan steps
        self.plan_steps = plan_steps
        
        # Plan is projection, not storage
        # Plan can be rebuilt from constitutional truth
        
        return plan_steps
```

---

## Agent Best Practices

### 1. Constitutional Consumption
- Agents consume objects only
- Agents consume events only
- Agents consume relationships only
- Agents consume lineage only
- Agents consume witnesses only

### 2. No Source of Truth
- Agents never become truth
- Agents never mutate state
- Agents never emit events
- Agents never create data

### 3. Memory as Projection
- Agent memory is projection
- Agent memory is rebuildable
- Agent memory is disposable
- Agent memory is verifiable

### 4. Reasoning as Projection
- Agent reasoning is projection
- Agent reasoning is rebuildable
- Agent reasoning is disposable
- Agent reasoning is verifiable

### 5. Plans as Projection
- Agent plans are projection
- Agent plans are rebuildable
- Agent plans are disposable
- Agent plans are verifiable
