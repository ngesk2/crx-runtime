# COMPUTE BROKER DESIGN

**Report Date:** 2026-06-19  
**Report Name:** COMPUTE_BROKER_DESIGN  
**Purpose:** Design compute broker using Ollama, vLLM, LiteLLM, Colab, Kaggle, Vast.ai, RunPod

---

# FREE-FIRST COMPUTE STRATEGY

## Compute Tiers

### Tier 0: Local CPU
**Cost:** FREE  
**Use Cases:** replay, identity, lineage, witness  
**Priority:** HIGHEST

### Tier 1: Local Ollama
**Cost:** FREE  
**Use Cases:** routing, classification, extraction  
**Priority:** HIGH

### Tier 2: Colab Free
**Cost:** FREE  
**Use Cases:** embeddings, synthetic datasets, summarization  
**Priority:** MEDIUM

### Tier 3: Kaggle Free
**Cost:** FREE  
**Use Cases:** fine tuning, experiments  
**Priority:** MEDIUM

### Tier 4: Vast.ai
**Cost:** LOW ($0.10-0.50/hour)  
**Use Cases:** overflow compute  
**Priority:** LOW

### Tier 5: RunPod
**Cost:** MEDIUM ($0.20-1.00/hour)  
**Use Cases:** burst workloads  
**Priority:** LOW

---

# COMPUTE BROKER ARCHITECTURE

## Broker Responsibilities

1. **Workload Classification** - Determine appropriate compute tier
2. **Resource Allocation** - Allocate compute resources
3. **Cost Optimization** - Minimize compute costs
4. **Failover** - Handle compute failures
5. **Load Balancing** - Distribute workloads across tiers

## Broker Decision Flow

```
Workload Request
    ↓
Workload Classification
    ↓
Tier Selection (0 → 1 → 2 → 3 → 4 → 5)
    ↓
Resource Allocation
    ↓
Execution
    ↓
Result Return
```

---

# TIER 0: LOCAL CPU

## Use Cases

- Replay execution
- Identity generation
- Lineage computation
- Witness generation
- Canonicalization

## Implementation

**File:** `runtime/broker/tier0_local_cpu.ts`

**Capabilities:**
- Pure TypeScript execution
- No external dependencies
- Deterministic execution
- Constitutional authority

**Advantages:**
- FREE
- No network latency
- Constitutional compliance
- Deterministic execution

**Limitations:**
- CPU-only (no GPU)
- Limited to constitutional operations

**Broker Logic:**
```typescript
if (workload.type === 'constitutional') {
  return Tier0LocalCPU.execute(workload);
}
```

---

# TIER 1: LOCAL OLLAMA

## Use Cases

- Routing
- Classification
- Extraction
- Simple inference

## Implementation

**File:** `runtime/broker/tier1_ollama.ts`

**Capabilities:**
- Local model execution
- Multiple model support
- GPU acceleration (if available)
- Low latency

**Advantages:**
- FREE
- Low latency
- Privacy (local execution)
- No API costs

**Limitations:**
- Limited by local hardware
- Model size constraints
- No distributed execution

**Broker Logic:**
```typescript
if (workload.type === 'inference' && workload.model_size === 'small') {
  return Tier1Ollama.execute(workload);
}
```

**Models:**
- Llama 3.2 3B (routing, classification)
- Mistral 7B (extraction)
- Phi-3 Mini (lightweight inference)

---

# TIER 2: COLAB FREE

## Use Cases

- Embeddings
- Synthetic datasets
- Summarization
- Medium-sized inference

## Implementation

**File:** `runtime/broker/tier2_colab.ts`

**Capabilities:**
- GPU access (T4, V100)
- Python environment
- Jupyter notebooks
- 12-hour session limit

**Advantages:**
- FREE
- GPU access
- Large model support
- Pre-installed libraries

**Limitations:**
- Session timeout (12 hours)
- No persistent storage
- Queue times during peak hours
- Requires manual session management

**Broker Logic:**
```typescript
if (workload.type === 'embedding' || workload.type === 'summarization') {
  return Tier2Colab.execute(workload);
}
```

**Models:**
- Sentence Transformers (embeddings)
- Llama 3.1 8B (summarization)
- Mistral Large (medium inference)

---

# TIER 3: KAGGLE FREE

## Use Cases

- Fine tuning
- Experiments
- Dataset processing
- Model training

## Implementation

**File:** `runtime/broker/tier3_kaggle.ts`

**Capabilities:**
- GPU access (T4, P100)
- Python environment
- Jupyter notebooks
- 30-hour session limit

**Advantages:**
- FREE
- GPU access
- Large dataset storage
- Pre-installed ML libraries

**Limitations:**
- Session timeout (30 hours)
- No persistent storage
- Queue times during peak hours
- Requires manual session management

**Broker Logic:**
```typescript
if (workload.type === 'fine_tuning' || workload.type === 'experiment') {
  return Tier3Kaggle.execute(workload);
}
```

**Models:**
- Custom fine-tuned models
- Experimental models
- Dataset-specific models

---

# TIER 4: VAST.AI

## Use Cases

- Overflow compute
- Large model inference
- Batch processing
- Extended workloads

## Implementation

**File:** `runtime/broker/tier4_vast.ts`

**Capabilities:**
- On-demand GPU rental
- Multiple GPU types
- Flexible pricing
- Hourly billing

**Advantages:**
- Low cost ($0.10-0.50/hour)
- Flexible GPU selection
- No session limits
- Scalable

**Limitations:**
- Not free
- Requires account setup
- Network latency
- Variable availability

**Broker Logic:**
```typescript
if (workload.type === 'overflow' || workload.type === 'large_inference') {
  return Tier4Vast.execute(workload);
}
```

**Models:**
- Llama 3.1 70B
- Mixtral 8x7B
- Custom large models

---

# TIER 5: RUNPOD

## Use Cases

- Burst workloads
- High-performance inference
- Production workloads
- Low-latency requirements

## Implementation

**File:** `runtime/broker/tier5_runpod.ts`

**Capabilities:**
- On-demand GPU rental
- Multiple GPU types
- Flexible pricing
- Hourly billing
- Low latency

**Advantages:**
- High performance
- Low latency
- Scalable
- Production-ready

**Limitations:**
- Higher cost ($0.20-1.00/hour)
- Requires account setup
- Network latency
- Variable availability

**Broker Logic:**
```typescript
if (workload.type === 'burst' || workload.type === 'production') {
  return Tier5Runpod.execute(workload);
}
```

**Models:**
- Llama 3.1 405B
- GPT-4 class models
- Production models

---

# BROKER IMPLEMENTATION

## Workload Classification

**File:** `runtime/broker/workload_classifier.ts`

```typescript
export enum WorkloadType {
  CONSTITUTIONAL = 'constitutional',
  INFERENCE = 'inference',
  EMBEDDING = 'embedding',
  SUMMARIZATION = 'summarization',
  FINE_TUNING = 'fine_tuning',
  EXPERIMENT = 'experiment',
  OVERFLOW = 'overflow',
  BURST = 'burst',
  PRODUCTION = 'production'
}

export enum WorkloadSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export interface Workload {
  type: WorkloadType;
  size: WorkloadSize;
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  cost_limit?: number;
  latency_requirement?: number;
}
```

## Tier Selection Algorithm

**File:** `runtime/broker/tier_selector.ts`

```typescript
export class TierSelector {
  selectTier(workload: Workload): ComputeTier {
    // Tier 0: Constitutional operations (always local CPU)
    if (workload.type === WorkloadType.CONSTITUTIONAL) {
      return Tier0LocalCPU;
    }

    // Tier 1: Small inference (local Ollama)
    if (workload.type === WorkloadType.INFERENCE && workload.size === WorkloadSize.SMALL) {
      return Tier1Ollama;
    }

    // Tier 2: Embeddings and summarization (Colab Free)
    if (workload.type === WorkloadType.EMBEDDING || 
        workload.type === WorkloadType.SUMMARIZATION) {
      return Tier2Colab;
    }

    // Tier 3: Fine tuning and experiments (Kaggle Free)
    if (workload.type === WorkloadType.FINE_TUNING || 
        workload.type === WorkloadType.EXPERIMENT) {
      return Tier3Kaggle;
    }

    // Tier 4: Overflow and large inference (Vast.ai)
    if (workload.type === WorkloadType.OVERFLOW || 
        (workload.type === WorkloadType.INFERENCE && workload.size === WorkloadSize.LARGE)) {
      return Tier4Vast;
    }

    // Tier 5: Burst and production (RunPod)
    if (workload.type === WorkloadType.BURST || 
        workload.type === WorkloadType.PRODUCTION) {
      return Tier5Runpod;
    }

    // Default: Tier 1 (local Ollama)
    return Tier1Ollama;
  }
}
```

## Cost Optimization

**File:** `runtime/broker/cost_optimizer.ts`

```typescript
export class CostOptimizer {
  optimize(workload: Workload): Workload {
    // Check if workload can be downgraded to free tier
    if (workload.type === WorkloadType.INFERENCE && workload.size === WorkloadSize.MEDIUM) {
      // Try to split into small workloads for Tier 1
      if (this.canSplit(workload)) {
        return this.splitWorkload(workload);
      }
    }

    // Check if deadline allows for queue time on free tiers
    if (workload.deadline && this.canWaitForFreeTier(workload)) {
      return this.scheduleForFreeTier(workload);
    }

    return workload;
  }
}
```

## Failover Strategy

**File:** `runtime/broker/failover.ts`

```typescript
export class FailoverManager {
  async executeWithFailover(workload: Workload): Promise<Result> {
    const tier = this.tierSelector.selectTier(workload);
    
    try {
      return await tier.execute(workload);
    } catch (error) {
      // Failover to next tier
      const nextTier = this.getNextTier(tier);
      return await nextTier.execute(workload);
    }
  }

  private getNextTier(currentTier: ComputeTier): ComputeTier {
    const tierOrder = [
      Tier0LocalCPU,
      Tier1Ollama,
      Tier2Colab,
      Tier3Kaggle,
      Tier4Vast,
      Tier5RunPod
    ];
    
    const currentIndex = tierOrder.indexOf(currentTier);
    return tierOrder[currentIndex + 1] || Tier5Runpod;
  }
}
```

---

# BROKER API

## Submit Workload

```typescript
interface SubmitWorkloadRequest {
  workload: Workload;
  callback_url?: string;
}

interface SubmitWorkloadResponse {
  workload_id: string;
  assigned_tier: string;
  estimated_cost: number;
  estimated_duration: number;
}
```

## Get Workload Status

```typescript
interface GetWorkloadStatusRequest {
  workload_id: string;
}

interface GetWorkloadStatusResponse {
  workload_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_tier: string;
  progress: number;
  result?: any;
  error?: string;
}
```

## Cancel Workload

```typescript
interface CancelWorkloadRequest {
  workload_id: string;
}

interface CancelWorkloadResponse {
  workload_id: string;
  status: 'cancelled' | 'already_completed' | 'not_found';
  refund_amount?: number;
}
```

---

# COST TRACKING

## Tier Costs

| Tier | Cost | Unit | Notes |
|------|------|------|-------|
| Tier 0 | FREE | N/A | Local CPU |
| Tier 1 | FREE | N/A | Local Ollama |
| Tier 2 | FREE | N/A | Colab Free (12-hour limit) |
| Tier 3 | FREE | N/A | Kaggle Free (30-hour limit) |
| Tier 4 | $0.10-0.50 | hour | Vast.ai |
| Tier 5 | $0.20-1.00 | hour | RunPod |

## Cost Estimation

**File:** `runtime/broker/cost_estimator.ts`

```typescript
export class CostEstimator {
  estimateCost(workload: Workload): number {
    const tier = this.tierSelector.selectTier(workload);
    const duration = this.estimateDuration(workload);
    return tier.cost_per_hour * duration;
  }

  private estimateDuration(workload: Workload): number {
    // Estimate based on workload type and size
    const baseDurations = {
      [WorkloadType.CONSTITUTIONAL]: 0.01, // 36 seconds
      [WorkloadType.INFERENCE]: {
        [WorkloadSize.SMALL]: 0.01, // 36 seconds
        [WorkloadSize.MEDIUM]: 0.05, // 3 minutes
        [WorkloadSize.LARGE]: 0.25, // 15 minutes
      },
      [WorkloadType.EMBEDDING]: 0.02, // 72 seconds
      [WorkloadType.SUMMARIZATION]: 0.05, // 3 minutes
      [WorkloadType.FINE_TUNING]: 2.0, // 2 hours
      [WorkloadType.EXPERIMENT]: 1.0, // 1 hour
    };

    return baseDurations[workload.type][workload.size] || baseDurations[workload.type];
  }
}
```

---

# MONITORING

## Metrics

**File:** `runtime/broker/metrics.ts`

```typescript
export interface BrokerMetrics {
  total_workloads: number;
  workloads_by_tier: {
    tier0: number;
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
    tier5: number;
  };
  total_cost: number;
  cost_by_tier: {
    tier0: number;
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
    tier5: number;
  };
  average_duration: number;
  failover_count: number;
  success_rate: number;
}
```

## Dashboard

**File:** `runtime/broker/dashboard.ts`

```typescript
export class BrokerDashboard {
  getMetrics(): BrokerMetrics {
    return {
      total_workloads: this.metrics.total_workloads,
      workloads_by_tier: this.metrics.workloads_by_tier,
      total_cost: this.metrics.total_cost,
      cost_by_tier: this.metrics.cost_by_tier,
      average_duration: this.metrics.average_duration,
      failover_count: this.metrics.failover_count,
      success_rate: this.metrics.success_rate,
    };
  }

  getCostBreakdown(): CostBreakdown {
    return {
      free_tier_usage: this.metrics.workloads_by_tier.tier0 + 
                        this.metrics.workloads_by_tier.tier1 + 
                        this.metrics.workloads_by_tier.tier2 + 
                        this.metrics.workloads_by_tier.tier3,
      paid_tier_usage: this.metrics.workloads_by_tier.tier4 + 
                       this.metrics.workloads_by_tier.tier5,
      free_tier_savings: this.calculateFreeTierSavings(),
    };
  }
}
```

---

# CONSTITUTIONAL COMPLIANCE

## Authority Delegation

**Constitutional Rule:** Broker must delegate to constitutional authorities for identity, lineage, replay, witness

**Implementation:**
```typescript
export class ConstitutionalBroker {
  async execute(workload: Workload): Promise<Result> {
    // Use constitutional authorities for constitutional operations
    if (workload.type === WorkloadType.CONSTITUTIONAL) {
      return await this.executeConstitutional(workload);
    }

    // Use broker for non-constitutional operations
    return await this.executeNonConstitutional(workload);
  }

  private async executeConstitutional(workload: Workload): Promise<Result> {
    // Route through constitutional authorities
    const identityAuthority = new IdentityAuthority();
    const replayAuthority = new ReplayAuthority();
    const witnessAuthority = new WitnessAuthority();

    // Execute using constitutional authorities
    return await this.executeWithAuthorities(workload, {
      identity: identityAuthority,
      replay: replayAuthority,
      witness: witnessAuthority,
    });
  }
}
```

## Cost Authority

**Constitutional Rule:** All compute costs must be tracked and attributed

**Implementation:**
```typescript
export class CostAuthority {
  trackCost(workload: Workload, tier: ComputeTier, cost: number): void {
    this.cost_tracker.record({
      workload_id: workload.id,
      tier: tier.name,
      cost: cost,
      timestamp: new Date(),
      user: workload.user,
      project: workload.project,
    });
  }

  getCostReport(user: string, project: string): CostReport {
    return this.cost_tracker.generateReport(user, project);
  }
}
```

---

# CONCLUSION

**Compute Broker Design:** Complete  
**Tiers:** 6 (0-5)  
**Free-First Strategy:** YES  
**Cost Optimization:** YES  
**Failover:** YES  
**Constitutional Compliance:** YES

**Implementation Priority:** MEDIUM (after Phase 1-3)

**Estimated Effort:** 2-3 weeks

**Next Step:** Deliverable 5: BrainOS Readiness Score
