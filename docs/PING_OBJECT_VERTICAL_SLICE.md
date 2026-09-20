# PING Social Object Vertical Slice

**Date:** 2026-09-20
**Status:** PATCH 3-6 COMPLETE, PATCH 7-9 PENDING
**Objective:** Build the first real PING social object flow (Alice → Bob → Agent → Approval → Feed)

---

## Implemented Schemas

### PING Object Primitives
- `PingObject` - Canonical object structure with id, schema, controller, created_at, content, refs
- `PingPost` - Post object (schema: ping.social.post@1)
- `PingProfile` - Profile object (schema: ping.social.profile@1)
- `PingRelationship` - Subject-predicate-object graph (follows, replies_to, references, likes, mentions)
- `PingTransition` - Immutable state change (create, relate, unrelate, propose, approve, publish, tombstone)

### Schema Versions
- ping.identity@1
- ping.social.profile@1
- ping.social.post@1
- ping.relationship@1
- ping.transition@1

---

## Authority Mapping

### Reused Existing Authorities
- **IdentityAuthority** - Deterministic object IDs (type_hash16 format from PATCH 1)
- **HashAuthority** - Content hashing for verification
- **TimeAuthority** - Timestamps for all operations

### New PING Authorities
- **PingObjectKernel** - Object operations (createPost, createProfile, createRelationship, createCreateTransition, createRelateTransition, verifyTransition)
- **PingTransitionMapper** - Maps PING transitions to canonical events in existing events table
- **PingIdentityManager** - Independent identities with signing keys (createIdentity, sign, verify, createProof)
- **PingFeedProjection** - Derives feeds from canonical history (deriveFeed, rebuildFeed, verifyFeedReproducibility)

### Architectural Decision
- Object identity uses deterministic/content-addressed path (type_hash16), NOT UUID-v7
- UUID-v7 remains for internal temporal identifiers only
- NO replacements for existing authorities
- Minimal protocol-neutral primitives (no dozens of subclasses)

---

## Persistence Mapping

### Database Tables
- **ping_objects** - Append-only content store (object_id, schema, controller, created_at, content, refs, visibility, status, metadata)
- **ping_relationships** - Subject-predicate-object graph (relationship_id, subject, predicate, object, created_at, status, metadata)
- **ping_transitions** - Append-only immutable state changes (transition_id, object_id, operation, actor_id, sequence, previous_transition, payload_hash, timestamp, proof, metadata)
- **events** - Existing canonical event spine (stream, event_type, payload, created_at) - NO separate event store

### Canonical Event Mapping
- Stream format: `ping.{object_id}`
- Event type format: `ping.{operation}` (e.g., ping.create, ping.relate, ping.approve)
- Bidirectional conversion: toCanonicalEvent() and fromCanonicalEvent()
- Validation: validateEvent() checks required fields

### Canonical Event Format
```json
{
  "stream": "ping.object_a1b2c3d4",
  "event_type": "ping.create",
  "payload": {
    "transition_id": "transition_e5f6g7h8",
    "object_id": "object_a1b2c3d4",
    "operation": "create",
    "actor_id": "alice",
    "sequence": 1,
    "previous_transition": null,
    "payload_hash": "...",
    "proof": {},
    "metadata": {}
  },
  "created_at": "2026-09-20T13:00:00Z"
}
```

---

## Transition Lifecycle

### Operations
- **create** - Create new object
- **relate** - Create relationship between actors/objects
- **unrelate** - Remove relationship
- **propose** - Agent proposes change
- **approve** - Human approves proposal
- **publish** - Publish object
- **tombstone** - Delete object (immutable marker)

### Transition Chain
- Each transition has sequence number (per object)
- previous_transition links to previous transition ID
- Immutable once appended to events table (triggers prevent updates/deletes)
- Content hash (payload_hash) for verification

---

## Alice/Bob Trace (Implemented)

### Setup
1. **Create Alice identity** - PingIdentityManager.createIdentity("alice")
   - Independent signing key
   - identity_id: identity_<type_hash16>
   - public_key stored, private_key client-side only

2. **Create Bob identity** - PingIdentityManager.createIdentity("bob")
   - Independent signing key (different from Alice)
   - identity_id: identity_<type_hash16>
   - public_key stored, private_key client-side only

### Alice Creates Post
3. **Alice creates P1** - PingObjectKernel.createPost("alice", "Hello PING")
   - object_id: object_<type_hash16>
   - schema: ping.social.post@1
   - controller: alice
   - content: { text: "Hello PING" }

4. **Create transition** - PingObjectKernel.createCreateTransition(objectId, "alice", payload, proof)
   - transition_id: transition_<type_hash16>
   - operation: create
   - actor_id: alice
   - sequence: 1
   - previous_transition: null
   - proof: { verification_method, signature, public_key }

5. **Map to canonical event** - PingTransitionMapper.toCanonicalEvent(transition)
   - stream: ping.{object_id}
   - event_type: ping.create
   - payload: transition data
   - Append to events table

### Bob Verifies P1
6. **Bob verifies Alice's signature** - PingIdentityManager.verify(alice, data, signature)
   - Uses Alice's public_key
   - Verifies Alice signed P1
   - Bob cannot sign as Alice (no private key)

### Bob Follows Alice
7. **Bob follows Alice** - PingObjectKernel.createRelationship("bob", "follows", "alice")
   - relationship_id: relationship_<type_hash16>
   - subject: bob
   - predicate: follows
   - object: alice
   - status: active

8. **Create relate transition** - PingObjectKernel.createRelateTransition(objectId, "bob", sequence, payload, previousTransition, proof)
   - operation: relate
   - Append to events table

### Bob Feed
9. **Derive Bob's feed** - PingFeedProjection.deriveFeed("bob", objects, relationships)
   - Queries objects from followed actors (Alice)
   - Includes Bob's own objects
   - Sorts by score (reverse chronological)
   - Returns: [P1 from Alice]

### Bob Replies
10. **Bob creates P2** - PingObjectKernel.createPost("bob", "Hello Alice", [P1.id])
    - object_id: object_<type_hash16>
    - refs: [P1.id] (references P1)

11. **Create create transition** - Append to events table

### Alice References
12. **Alice creates P3** - PingObjectKernel.createPost("alice", "Thanks Bob", [P2.id])
    - refs: [P2.id] (references P2)

13. **Create create transition** - Append to events table

---

## Agent Capability Trace (Pending PATCH 7)

### Agent Context
14. **Alice asks agent about P2** - Agent receives structured context:
    ```json
    {
      "actor": "alice",
      "object": P2,
      "relationships": [...],
      "capabilities": [
        "object.read",
        "object.propose-reply"
      ]
    }
    ```

### Explicitly Absent
- object.publish
- identity.modify
- capability.grant

### Agent Action
15. **Agent emits PROPOSED TRANSITION** - NOT published post
    - operation: propose
    - payload: proposed reply content
    - Append to events table as ping.propose

### Verification
16. **Agent direct PUBLISH is rejected** - Capability check fails
    - object.publish not in capabilities
    - Agent cannot publish directly

---

## Human Approval (Pending PATCH 8)

### Approval Flow
17. **Human reviews proposal** - Alice sees proposed P3
18. **Human approves** - Alice approves the proposal
19. **Create authorization transition** - operation: approve
20. **Alice signs** - PingIdentityManager.sign(alice, authorization_data)
21. **Append signed transition** - Append to events table as ping.approve
22. **Resulting object** - P3 becomes published post

### Provenance Preserved
- proposed_by: agent
- approved_by: alice
- signed_by: alice
- resulting_object: P3
- previous_transition: proposal transition
- capability_used: object.propose-reply

---

## Test Evidence

### Existing Tests
- IdentityAuthority characterization tests (10/10 passed) - PATCH 1
- Type hash16 format verified against historical JavaScript

### Additional Tests Needed
- Feed reproducibility: delete/rebuild and prove equivalent output
- Signature verification: Alice signs, Bob verifies, Bob cannot sign as Alice
- Transition verification: payload_hash matches content
- Event mapping: bidirectional conversion preserves data

---

## Exact Commits

### PATCH 1 - IdentityAuthority Restoration
- SHA: 28f0c9707
- Branch: refactor/runtime-authority-convergence
- Files: 6 files changed, 547 insertions

### PATCH 2 - Identity Semantic Split
- SHA: e7c73ce02
- Files: 2 files changed, 245 insertions

### PATCH 2b - Hash Authority Jurisdictional Split
- SHA: f992ac01e
- Files: 1 file changed, 35 insertions

### PATCH 3 - Object Kernel
- SHA: fc2a04b9d
- Files: 6 files changed, 535 insertions

### PATCH 4 - Immutable Transitions
- SHA: 2b1827f06
- Files: 3 files changed, 222 insertions

### PATCH 5-6 - Independent Identities + Feed Projection
- SHA: 54a26631b
- Files: 4 files changed, 293 insertions

---

## Remaining Blockers

### PATCH 7 - Agent Capability Boundary (PENDING)
- Implement agent context structure with explicit capabilities
- Implement capability checking (agent cannot publish)
- Implement agent proposal emission (PROPOSED TRANSITION)

### PATCH 8 - Human Approval (PENDING)
- Implement approval transition
- Implement authorization signing
- Implement provenance preservation (proposed_by, approved_by, signed_by)

### PATCH 9 - Website Projection (PENDING)
- Expose same canonical object through PING website
- Minimum UI: profiles, create post, follow/unfollow, feed, post detail, reply, reference, Ask PING, approval
- No separate website object database

### Mandatory Proofs (PENDING)
1. Same canonical input → same object ID
2. Existing type_hash16 compatibility vectors remain green
3. Alice signature verifies without Alice application state
4. Bob cannot sign as Alice
5. Bob can independently verify Alice's object
6. Bob follow creates a relationship transition
7. Bob feed derives Alice P1 from graph state
8. Bob reply references exact P1 identity
9. Alice reference targets exact P2 identity
10. Agent can READ P2
11. Agent can PROPOSE reply
12. Agent direct PUBLISH is rejected
13. Human approval creates a distinct authorization transition
14. Approved reply is signed by the authorized identity
15. ping_events contains complete causal history
16. Replay reconstructs equivalent object state
17. Feed projection can be deleted and rebuilt
18. Website renders the same object identity stored by runtime

---

## Definition of Done

**NOT DONE** - Classes exist

**DONE** means this exact trace executes:

Alice identity
↓
Alice profile
↓
Alice signs P1
↓
Bob identity
↓
Bob verifies P1
↓
Bob follows Alice
↓
Bob feed contains P1
↓
Bob replies P2
↓
Alice receives P2
↓
Alice asks agent about P2
↓
agent receives structured object context
↓
agent proposes P3
↓
agent is forbidden from publishing P3
↓
Alice approves
↓
Alice signs
↓
transition appended to ping_events
↓
projection updates
↓
website renders P3
↓
replay reconstructs the interaction

**Current Status:** PATCH 3-6 foundation complete. PATCH 7-9 pending.
