# PostgreSQL Constitutional Ownership Audit

**Audit Date:** 2026-06-24
**Audit Type:** PHASE E.7B - Investigation 3
**Objective:** Determine which constitutional properties ONLY exist in PostgreSQL today

---

# Executive Summary

**Critical Finding:** ALL constitutional properties required for artifact runtime currently exist ONLY in PostgreSQL. Qdrant does NOT store or provide equivalent constitutional properties.

**PostgreSQL-Exclusive Properties:**
1. authority_class - Declared authority class hierarchy
2. verification - Mechanical verification (5-check)
3. lineage - Full PostgreSQL lineage tracing
4. witness - Witness root identification and cryptographic proof
5. supersession - Supersession chain handling

**Constitutional Significance:** These properties are REQUIRED for constitutional compliance. Without them, the system cannot enforce constitutional guarantees.

---

# Property-by-Property Analysis

## 1. authority_class

### PostgreSQL Implementation

**Source Table:** authority_objects

**Fields:**
- category (mapped to authority_class)
- authority_level

**Implementation:**
```python
AUTHORITY_CLASSES = [
    "CONSTITUTIONAL_LAW",
    "CANONICAL_SPEC",
    "CREATOR_RESEARCH",
    "CREATOR_NOTES",
    "IMPORTED_DOCUMENT",
    "REPOSITORY_DOCUMENTATION",
    "SCRIPT",
    "SUMMARY",
    "AI_GENERATED_ANALYSIS",
    "TEMPORARY_OBSERVATION"
]

AUTHORITY_CLASS_ORDER = {cls: idx for idx, cls in enumerate(AUTHORITY_CLASSES)}
```

**Owning Service:** authority_search.py

**Constitutional Significance:** CRITICAL
- Declared authority class hierarchy (not scored)
- Constitutional Law: AUTHORITY_LAW
- Required for mechanical authority resolution
- Required for constitutional compliance

**Qdrant Equivalent:** PARTIAL
- Qdrant stores basic authority_level field
- Qdrant does NOT provide declared authority class hierarchy
- Qdrant does NOT provide authority class ordering
- Qdrant uses vector similarity scoring instead

**Can Qdrant Safely Replace It?** NO
- Qdrant cannot replace declared authority class hierarchy
- Vector similarity scoring violates constitutional guarantees
- Authority must be declared, not scored

---

## 2. verification

### PostgreSQL Implementation

**Source Table:** authority_objects

**Fields:**
- payload_hash
- sha256
- status

**Implementation:**
```python
verification = {
    "artifact_hash_verified": False,  # payload_hash == sha256
    "event_hash_verified": False,     # Event hash consistency
    "lineage_intact": False,          # lineage_depth > 0
    "witness_present": False,         # witness_count > 0
    "projection_valid": False,        # status == 'projected'
    "overall": False                  # ALL checks must pass
}
```

**Owning Service:** authority_search.py

**Constitutional Significance:** CRITICAL
- Mechanical verification (5-check deterministic)
- Constitutional Law: VERIFICATION
- Required for constitutional compliance
- All checks must pass for validity

**Qdrant Equivalent:** PARTIAL
- Qdrant provides projection integrity verification
- Qdrant does NOT provide artifact hash verification
- Qdrant does NOT provide event hash verification
- Qdrant does NOT provide lineage integrity check
- Qdrant does NOT provide witness presence check

**Can Qdrant Safely Replace It?** NO
- Qdrant cannot replace full 5-check mechanical verification
- Missing 4 out of 5 verification checks
- Verification would be incomplete

---

## 3. lineage

### PostgreSQL Implementation

**Source Table:** authority_lineage

**Fields:**
- ancestor
- descendant
- relation
- metadata

**Implementation:**
```python
cur.execute("SELECT * FROM authority_lineage WHERE ancestor=%s OR descendant=%s", 
            (artifact_id, artifact_id))
```

**Owning Service:** lineage_search.py

**Constitutional Significance:** CRITICAL
- Full PostgreSQL lineage tracing
- Constitutional Law: LINEAGE
- Required for constitutional compliance
- Ancestor/descendant relationships

**Qdrant Equivalent:** PARTIAL
- Qdrant stores basic source_event_id
- Qdrant does NOT provide ancestor/descendant relationships
- Qdrant does NOT provide relationship types
- Qdrant does NOT provide lineage depth

**Can Qdrant Safely Replace It?** NO
- Qdrant cannot replace full PostgreSQL lineage tracing
- Missing ancestor/descendant relationships
- Missing relationship types
- Missing lineage depth

---

## 4. witness

### PostgreSQL Implementation

**Source Table:** authority_witness

**Fields:**
- artifact_id
- witness_root
- witness_signature
- witness_timestamp

**Implementation:**
```python
(SELECT COUNT(*) FROM authority_witness aw WHERE aw.artifact_id = ao.artifact_id) as witness_count
```

**Owning Service:** authority_search.py, lineage_search.py

**Constitutional Significance:** CRITICAL
- Witness root identification
- Cryptographic proof of authority existence
- Constitutional Law: WITNESS_LAW
- Required for constitutional compliance

**Qdrant Equivalent:** NONE
- Qdrant does NOT store witness information
- Qdrant does NOT provide witness verification
- Qdrant does NOT provide cryptographic proof

**Can Qdrant Safely Replace It?** NO
- Qdrant cannot replace witness verification
- Complete loss of witness information
- Constitutional violation

---

## 5. supersession

### PostgreSQL Implementation

**Source Table:** authority_supersession

**Fields:**
- superseded
- superseded_by
- supersession_timestamp
- supersession_reason

**Implementation:**
```python
cur.execute("SELECT superseded, superseded_by FROM authority_supersession")
for r in cur.fetchall():
    s, by = r
    if by:
        superseded.add(s)
```

**Owning Service:** authority_search.py

**Constitutional Significance:** CRITICAL
- Supersession chain handling
- Obsolete authority exclusion
- Constitutional Law: AUTHORITY_LAW
- Required for constitutional compliance

**Qdrant Equivalent:** NONE
- Qdrant does NOT store supersession information
- Qdrant does NOT provide supersession handling
- Qdrant does NOT exclude superseded authorities

**Can Qdrant Safely Replace It?** NO
- Qdrant cannot replace supersession handling
- Risk of returning superseded/obsolete authorities
- Constitutional violation

---

# Constitutional Property Summary

| Property | Source Table | Owning Service | Constitutional Significance | Qdrant Equivalent | Can Qdrant Replace? |
|----------|--------------|----------------|---------------------------|------------------|---------------------|
| authority_class | authority_objects | authority_search.py | CRITICAL | PARTIAL | NO |
| verification | authority_objects | authority_search.py | CRITICAL | PARTIAL | NO |
| lineage | authority_lineage | lineage_search.py | CRITICAL | PARTIAL | NO |
| witness | authority_witness | authority_search.py, lineage_search.py | CRITICAL | NONE | NO |
| supersession | authority_supersession | authority_search.py | CRITICAL | NONE | NO |

**Conclusion:** ALL constitutional properties are PostgreSQL-exclusive. Qdrant cannot safely replace any of them.

---

# Additional Constitutional Properties

## event_hash

### PostgreSQL Implementation

**Source Table:** events

**Fields:**
- event_hash

**Owning Service:** Qdrant Projection Worker, lineage_search.py

**Constitutional Significance:** CRITICAL
- Event hash for replay verification
- Constitutional Law: REPLAY_LAW
- Required for replay determinism

**Qdrant Equivalent:** PARTIAL
- Qdrant stores source_event_id
- Qdrant does NOT store event_hash
- Qdrant does NOT provide replay verification

**Can Qdrant Safely Replace It?** NO
- Qdrant cannot replace event hash verification
- Replay determinism would be lost

---

## projection_signature

### PostgreSQL Implementation

**Source Table:** projections

**Fields:**
- projection_signature
- projection_hash

**Owning Service:** Qdrant Projection Worker, Mission Control

**Constitutional Significance:** CRITICAL
- Projection integrity verification
- Constitutional Law: VERIFICATION
- Required for projection integrity

**Qdrant Equivalent:** PARTIAL
- Qdrant stores projection metadata in payload
- Qdrant provides projection integrity verification
- Qdrant does NOT store projection_signature in PostgreSQL

**Can Qdrant Safely Replace It?** PARTIAL
- Qdrant can provide projection integrity verification
- PostgreSQL still required for projection signature storage

---

# Constitutional Property Ownership Matrix

## PostgreSQL-Exclusive Properties

| Property | Constitutional Law | Criticality | Qdrant Gap |
|----------|-------------------|-------------|------------|
| authority_class | AUTHORITY_LAW | CRITICAL | Declared hierarchy vs vector scoring |
| verification (5-check) | VERIFICATION | CRITICAL | 5-check vs projection integrity only |
| lineage (full) | LINEAGE | CRITICAL | Full lineage vs basic source_event_id |
| witness | WITNESS_LAW | CRITICAL | Complete loss |
| supersession | AUTHORITY_LAW | CRITICAL | Complete loss |
| event_hash | REPLAY_LAW | CRITICAL | Replay verification lost |

## Shared Properties

| Property | PostgreSQL | Qdrant | Ownership |
|----------|-----------|--------|-----------|
| projection_integrity | projections | payload metadata | SHARED |

---

# Constitutional Impact Assessment

## If PostgreSQL Constitutional Properties Were Removed

### authority_class Removal
**Impact:** ❌ CONSTITUTIONAL VIOLATION
- Authority resolution would become vector similarity scoring
- Declared authority class hierarchy would be lost
- Constitutional guarantees would be violated

**Recovery:** NOT POSSIBLE - Qdrant cannot replace

---

### verification Removal
**Impact:** ❌ CONSTITUTIONAL VIOLATION
- Mechanical verification (5-check) would be lost
- Verification would be incomplete
- Constitutional guarantees would be violated

**Recovery:** NOT POSSIBLE - Qdrant cannot replace

---

### lineage Removal
**Impact:** ❌ CONSTITUTIONAL VIOLATION
- Full PostgreSQL lineage tracing would be lost
- Ancestor/descendant relationships would be lost
- Constitutional guarantees would be violated

**Recovery:** NOT POSSIBLE - Qdrant cannot replace

---

### witness Removal
**Impact:** ❌ CONSTITUTIONAL VIOLATION
- Witness verification would be lost
- Cryptographic proof would be lost
- Constitutional guarantees would be violated

**Recovery:** NOT POSSIBLE - Qdrant cannot replace

---

### supersession Removal
**Impact:** ❌ CONSTITUTIONAL VIOLATION
- Supersession handling would be lost
- Superseded authorities would not be excluded
- Constitutional guarantees would be violated

**Recovery:** NOT POSSIBLE - Qdrant cannot replace

---

# Conclusion

**PostgreSQL owns ALL constitutional properties.**

**Qdrant cannot safely replace ANY constitutional properties.**

**Constitutional properties are PostgreSQL-exclusive and REQUIRED for constitutional compliance.**

**Artifact runtime migration must preserve PostgreSQL constitutional ownership.**

---

**Investigation Status:** COMPLETED
