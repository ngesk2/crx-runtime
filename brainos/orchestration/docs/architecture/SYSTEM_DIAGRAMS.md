# System Diagrams

**Version:** 2.0
**Purpose:** Complete system architecture diagrams

---

## Constitutional Layer Architecture

```mermaid
graph TB
    subgraph "Layer 5 - Interfaces and Agents (Disposable)"
        UI[Web Interface]
        CLI[CLI Interface]
        AGENTS[Autonomous Agents]
        WORKFLOWS[Workflow Engines]
    end
    
    subgraph "Layer 4 - Vector Projection (Disposable)"
        QDRANT[Qdrant]
        VECTORS[Vector Storage]
        SIMILARITY[Similarity Search]
    end
    
    subgraph "Layer 3 - Knowledge Graph Projection (Disposable)"
        NEO4J[Neo4j]
        GRAPH[Graph Storage]
        REASONING[Graph Reasoning]
    end
    
    subgraph "Layer 2 - Canonical State (Constitutional Truth)"
        POSTGRES[PostgreSQL]
        OBJECTS[Objects Table]
        EVENTS[Events Table]
        LINEAGE[Lineage Table]
        PROJECTIONS[Projections Table]
    end
    
    subgraph "Layer 1 - Event Log (Constitutional Truth)"
        EVENTLOG[Event Log]
        EVENTS2[Immutable Events]
        SEQUENCE[Event Sequence]
        INTEGRITY[Event Integrity]
    end
    
    subgraph "Layer 0 - Immutable Object Store (Constitutional Truth)"
        OBJECTSTORE[Object Store]
        CONTENT[Content-Addressed Storage]
        HASHES[SHA256 Hashes]
        VERSIONS[Object Versions]
    end
    
    UI --> POSTGRES
    CLI --> POSTGRES
    AGENTS --> POSTGRES
    WORKFLOWS --> POSTGRES
    
    QDRANT --> POSTGRES
    VECTORS --> QDRANT
    SIMILARITY --> QDRANT
    
    NEO4J --> POSTGRES
    GRAPH --> NEO4J
    REASONING --> NEO4J
    
    POSTGRES --> EVENTLOG
    OBJECTS --> EVENTLOG
    EVENTS --> EVENTLOG
    LINEAGE --> EVENTLOG
    PROJECTIONS --> EVENTLOG
    
    EVENTLOG --> OBJECTSTORE
    EVENTS2 --> OBJECTSTORE
    SEQUENCE --> OBJECTSTORE
    INTEGRITY --> OBJECTSTORE
    
    OBJECTSTORE --> CONTENT
    CONTENT --> HASHES
    HASHES --> VERSIONS
    
    style OBJECTSTORE fill:#90EE90
    style EVENTLOG fill:#90EE90
    style POSTGRES fill:#90EE90
    style NEO4J fill:#FFB6C1
    style QDRANT fill:#FFB6C1
    style UI fill:#FFB6C1
    style CLI fill:#FFB6C1
    style AGENTS fill:#FFB6C1
    style WORKFLOWS fill:#FFB6C1
```

---

## Data Flow Architecture

```mermaid
graph LR
    A[Source Files] --> B[Object Store]
    B --> C[Event Log]
    C --> D[Canonical State]
    D --> E[Vector Projection]
    D --> F[Graph Projection]
    D --> G[Search Projection]
    E --> H[AI Systems]
    F --> H
    G --> H
    H --> I[User Interfaces]
    
    style B fill:#90EE90
    style C fill:#90EE90
    style D fill:#90EE90
    style E fill:#FFB6C1
    style F fill:#FFB6C1
    style G fill:#FFB6C1
```

---

## Replay Architecture

```mermaid
graph TB
    subgraph "Replay Engine"
        A[Event Loader]
        B[State Applier]
        C[Projection Builder]
        D[Integrity Verifier]
    end
    
    subgraph "Constitutional Truth"
        E[Object Store]
        F[Event Log]
        G[Canonical State]
    end
    
    subgraph "Projections"
        H[Vector Projection]
        I[Graph Projection]
        J[Search Projection]
    end
    
    E --> A
    F --> A
    A --> B
    B --> G
    G --> C
    C --> H
    C --> I
    C --> J
    C --> D
    D --> G
    
    style E fill:#90EE90
    style F fill:#90EE90
    style G fill:#90EE90
    style H fill:#FFB6C1
    style I fill:#FFB6C1
    style J fill:#FFB6C1
```

---

## Lineage Architecture

```mermaid
graph TB
    A[Raw PDF] -->|FILE_DETECTED| B[Object Store]
    B -->|OBJECT_CREATED| C[Event Log]
    C -->|METADATA_EXTRACTED| D[Canonical Document]
    D -->|NORMALIZED| E[Normalized Document]
    E -->|CHUNKED| F[Chunks]
    F -->|ENTITY_CREATED| G[Entities]
    G -->|RELATIONSHIP_CREATED| H[Relationships]
    
    style B fill:#90EE90
    style C fill:#90EE90
    style D fill:#90EE90
    style E fill:#90EE90
    style F fill:#90EE90
    style G fill:#90EE90
    style H fill:#90EE90
```

---

## Processing Pipeline Architecture

```mermaid
graph TB
    subgraph "Input Layer"
        A[File Detection]
        B[File Classification]
    end
    
    subgraph "Processing Layer"
        C[Metadata Extraction]
        D[Normalization]
        E[Canonicalization]
        F[Chunking]
        G[Entity Extraction]
        H[Relationship Extraction]
    end
    
    subgraph "Storage Layer"
        I[Object Store]
        J[Event Log]
        K[Canonical State]
    end
    
    subgraph "Projection Layer"
        L[Vector Projection]
        M[Graph Projection]
        N[Search Projection]
    end
    
    A --> I
    B --> I
    I --> J
    J --> K
    K --> C
    C --> K
    K --> D
    D --> K
    K --> E
    E --> K
    K --> F
    F --> K
    K --> G
    G --> K
    K --> H
    H --> K
    K --> L
    K --> M
    K --> N
    
    style I fill:#90EE90
    style J fill:#90EE90
    style K fill:#90EE90
    style L fill:#FFB6C1
    style M fill:#FFB6C1
    style N fill:#FFB6C1
```

---

## Backup Architecture

```mermaid
graph TB
    subgraph "Production System"
        A[Object Store]
        B[Event Log]
        C[Canonical State]
    end
    
    subgraph "Hot Backup"
        D[Real-time Replication]
        E[Zero RPO]
        F[Automatic Failover]
    end
    
    subgraph "Warm Backup"
        G[Daily Snapshots]
        H[Asynchronous Replication]
        I[Manual Failover]
    end
    
    subgraph "Cold Backup"
        J[Weekly Archives]
        K[Off-site Storage]
        L[Manual Restore]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    
    A --> G
    B --> G
    C --> G
    G --> H
    H --> I
    
    A --> J
    B --> J
    C --> J
    J --> K
    K --> L
```

---

## Disaster Recovery Architecture

```mermaid
graph TB
    subgraph "Failure Detection"
        A[Health Monitoring]
        B[Alerting]
        C[Failure Classification]
    end
    
    subgraph "Recovery Procedures"
        D[Primary Recovery]
        E[Complete Recovery]
        F[Ransomware Recovery]
        G[Site Recovery]
    end
    
    subgraph "Verification"
        H[Integrity Verification]
        I[Functional Verification]
        J[Performance Verification]
    end
    
    subgraph "Post-Recovery"
        K[Documentation]
        L[Procedure Updates]
        M[Lessons Learned]
    end
    
    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I
    I --> J
    
    J --> K
    K --> L
    L --> M
```

---

## Migration Architecture

```mermaid
graph TB
    subgraph "Source System"
        A[Object Store v1]
        B[Event Log v1]
        C[Canonical State v1]
    end
    
    subgraph "Migration Process"
        D[Schema Migration]
        E[Data Migration]
        F[Validation]
        G[Cutover]
    end
    
    subgraph "Target System"
        H[Object Store v2]
        I[Event Log v2]
        J[Canonical State v2]
    end
    
    subgraph "Rollback"
        K[Rollback Plan]
        L[Rollback Execution]
        M[Verification]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    
    F --> K
    K --> L
    L --> M
```

---

## Projection Architecture

```mermaid
graph TB
    subgraph "Constitutional Truth"
        A[Canonical State]
    end
    
    subgraph "Projection Registry"
        B[Projection Definitions]
        C[Projection Dependencies]
        D[Projection Schedules]
    end
    
    subgraph "Projection Builders"
        E[Vector Builder]
        F[Graph Builder]
        G[Search Builder]
        H[Entity Builder]
    end
    
    subgraph "Projection Storage"
        I[Qdrant]
        J[Neo4j]
        K[OpenSearch]
        L[DuckDB]
    end
    
    subgraph "Projection Management"
        M[Invalidation]
        N[Rebuild]
        O[Verification]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    
    E --> I
    F --> J
    G --> K
    H --> L
    
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N
    N --> O
    O --> A
    
    style A fill:#90EE90
    style I fill:#FFB6C1
    style J fill:#FFB6C1
    style K fill:#FFB6C1
    style L fill:#FFB6C1
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication"
        A[JWT Authentication]
        B[API Key Authentication]
        C[Certificate Authentication]
    end
    
    subgraph "Authorization"
        D[Role-Based Access]
        E[Attribute-Based Access]
        F[Policy Engine]
    end
    
    subgraph "Encryption"
        G[Encryption at Rest]
        H[Encryption in Transit]
        I[Key Management]
    end
    
    subgraph "Audit"
        J[Audit Logging]
        K[Security Monitoring]
        L[Incident Response]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    
    F --> G
    F --> H
    G --> I
    H --> I
    
    F --> J
    J --> K
    K --> L
```

---

## Monitoring Architecture

```mermaid
graph TB
    subgraph "Metrics Collection"
        A[Service Metrics]
        B[System Metrics]
        C[Business Metrics]
    end
    
    subgraph "Metrics Processing"
        D[Aggregation]
        E[Analysis]
        F[Alerting]
    end
    
    subgraph "Visualization"
        G[Dashboards]
        H[Reports]
        I[Alerts]
    end
    
    subgraph "Storage"
        J[Time Series DB]
        K[Log Storage]
        L[Alert Storage]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    
    D --> J
    E --> K
    F --> L
```

---

## Future AI Integration Architecture

```mermaid
graph TB
    subgraph "Constitutional Truth"
        A[Object Store]
        B[Event Log]
        C[Canonical State]
    end
    
    subgraph "Semantic Layer Contracts"
        D[Retrieval Contract]
        E[Graph Contract]
        F[Vector Contract]
        G[Agent Contract]
    end
    
    subgraph "Future AI Systems"
        H[Qdrant]
        I[Neo4j]
        J[OpenSearch]
        K[LangGraph]
        L[CrewAI]
        M[Ollama]
        N[OpenAI]
        O[Anthropic]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> H
    D --> I
    D --> J
    D --> K
    D --> L
    D --> M
    D --> N
    D --> O
    
    E --> I
    F --> H
    F --> J
    G --> K
    G --> L
    
    style A fill:#90EE90
    style B fill:#90EE90
    style C fill:#90EE90
    style H fill:#FFB6C1
    style I fill:#FFB6C1
    style J fill:#FFB6C1
    style K fill:#FFB6C1
    style L fill:#FFB6C1
    style M fill:#FFB6C1
    style N fill:#FFB6C1
    style O fill:#FFB6C1
```
