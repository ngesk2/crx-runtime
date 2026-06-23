# Agent Access Layer

**Date:** 2026-06-22  
**Purpose:** Define agent access to constitutional memory through MCP  
**Constitutional Law:** TRUTH ≠ EMBEDDINGS

---

## AGENT ACCESS PRINCIPLE

All agents gain access to constitutional memory through MCP only.

**Forbidden:**
- No direct Qdrant access
- No direct PostgreSQL access
- No direct Vault access

**Allowed:**
- MCP tool: search_constitutional_memory
- MCP tool: search_constitution (existing)
- MCP tool: get_constitution_doc (existing)

---

## ARCHITECTURE

```
Agent
  ↓
MCP Client
  ↓
search_constitutional_memory
  ↓
Mission Control
  ↓
/constitutional/query
  ↓
Qdrant Search
  ↓
Lineage Resolution
  ↓
Authority Verification
  ↓
Return Results
```

---

## MCP TOOLS FOR AGENTS

### search_constitutional_memory
**Purpose:** Search constitutional memory with lineage and authority  
**Arguments:**
```json
{
  "query": "string - search query",
  "top_k": "integer - number of results (default: 5)"
}
```

**Returns:**
```json
{
  "snippets": [...],
  "citations": [...],
  "authority_chain": [...],
  "lineage": [...]
}
```

### search_constitution
**Purpose:** Search constitutional documents (existing tool)  
**Arguments:**
```json
{
  "query": "string - search query",
  "limit": "integer - number of results (default: 5)"
}
```

**Returns:**
```json
{
  "results": [...]
}
```

### get_constitution_doc
**Purpose:** Get specific constitutional document (existing tool)  
**Arguments:**
```json
{
  "doc_id": "string - document ID"
}
```

**Returns:**
```json
{
  "document": {...}
}
```

---

## AGENT INTEGRATION EXAMPLES

### Example 1: LangChain Agent
```python
from langchain.agents import initialize_agent, Tool
from langchain.llms import Ollama
import requests

# Define MCP tool
def search_constitutional_memory(query: str, top_k: int = 5):
    response = requests.get(
        "http://mcp-server:3000/search_constitutional_memory",
        params={"query": query, "top_k": top_k}
    )
    return response.json()

# Create LangChain tool
constitutional_tool = Tool(
    name="Search Constitutional Memory",
    func=search_constitutional_memory,
    description="Search constitutional memory with lineage and authority verification"
)

# Initialize agent
llm = Ollama(model="llama3")
agent = initialize_agent(
    [constitutional_tool],
    llm,
    agent="zero-shot-react-description"
)

# Use agent
result = agent.run("What have we documented about replay law?")
```

### Example 2: CrewAI Agent
```python
from crewai import Agent, Task, Crew
import requests

# Define MCP tool
def search_constitutional_memory(query: str, top_k: int = 5):
    response = requests.get(
        "http://mcp-server:3000/search_constitutional_memory",
        params={"query": query, "top_k": top_k}
    )
    return response.json()

# Create agent
constitutional_researcher = Agent(
    role="Constitutional Researcher",
    goal="Search constitutional memory for relevant information",
    tools=[search_constitutional_memory],
    backstory="You are a constitutional researcher with access to PING's constitutional memory."
)

# Create task
task = Task(
    description="Search constitutional memory for information about replay law",
    agent=constitutional_researcher
)

# Create crew
crew = Crew(
    agents=[constitutional_researcher],
    tasks=[task]
)

# Execute
result = crew.kickoff()
```

### Example 3: AutoGen Agent
```python
import autogen
import requests

# Define MCP tool
def search_constitutional_memory(query: str, top_k: int = 5):
    response = requests.get(
        "http://mcp-server:3000/search_constitutional_memory",
        params={"query": query, "top_k": top_k}
    )
    return response.json()

# Create assistant
assistant = autogen.AssistantAgent(
    name="assistant",
    system_message="You are a constitutional researcher. Use the search_constitutional_memory tool to find information.",
    llm_config={"config_list": [{"model": "llama3"}]}
)

# Register tool
assistant.register_function(
    search_constitutional_memory,
    name="search_constitutional_memory",
    description="Search constitutional memory with lineage and authority verification"
)

# Create user proxy
user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10
)

# Start conversation
user_proxy.initiate_chat(
    assistant,
    message="What have we documented about replay law?"
)
```

---

## CONSTITUTIONAL CONSTRAINTS

1. **No Direct Access**: Agents cannot access Qdrant, PostgreSQL, or Vault directly.

2. **MCP Only**: All access must go through MCP tools.

3. **Lineage Tracking**: All results include lineage references.

4. **Authority Verification**: All results include authority chain.

5. **Truth ≠ Embeddings**: Agents search projections (Qdrant) but truth is in PostgreSQL events and Vault documents.

---

## AGENT WORKFLOW

### Step 1: Agent receives task
Agent receives task from user or system.

### Step 2: Agent formulates query
Agent formulates search query based on task.

### Step 3: Agent calls MCP tool
Agent calls `search_constitutional_memory` through MCP.

### Step 4: MCP proxies to Mission Control
MCP proxies request to Mission Control `/constitutional/query`.

### Step 5: Mission Control searches Qdrant
Mission Control embeds query and searches Qdrant.

### Step 6: Mission Control resolves lineage
Mission Control traces lineage back to truth sources.

### Step 7: Mission Control verifies authority
Mission Control verifies constitutional authority of sources.

### Step 8: Results returned to agent
Results with snippets, citations, authority chain, and lineage returned to agent.

### Step 9: Agent uses results
Agent uses results to complete task.

---

## BENEFITS

1. **Constitutional Compliance**: All agents follow constitutional access patterns.

2. **Provenance Tracking**: All agent actions include lineage and authority.

3. **Replay Determinism**: Same query produces same results (deterministic).

4. **Audit Trail**: All agent queries are logged through MCP.

5. **Component Failure Survivability**: Agents depend on MCP, not direct infrastructure.

---

## CONCLUSION

Agent access layer ensures that all agents gain access to constitutional memory through MCP only, preserving constitutional constraints while enabling intelligent agent workflows with full provenance tracking.
