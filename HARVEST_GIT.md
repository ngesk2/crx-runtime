# Git Internals Architectural Harvest

**Purpose:** Extract constitutional patterns from Git for PING

---

## Core Patterns

### 1. Immutable Objects

**Pattern:** Git objects never change after creation
- All commits and files stored as Git objects
- Objects never change after created
- Every object has unique ID (SHA-1 hash)
- If you have object ID, can always recover exact contents
- "Amending" a commit creates new commit with same parent
- Git objects effectively immutable: to change anything, write new object and move ref

**Constitutional Rules:**
- Immutable objects for all stored data
- Content-addressable storage
- Object ID names content
- Changes create new objects, never modify existing

**PING Application:**
- Event Service must store immutable events
- Content-addressable event storage
- Event ID names event content
- Changes create new events, never modify existing

---

### 2. Content-Addressable Storage

**Pattern:** Core is simple key-value data store
- Git is content-addressable filesystem
- Insert any content, get unique key for retrieval
- Key-value data store at core
- SHA-1 hash used as key
- Same content always produces same key

**Constitutional Rules:**
- Content-addressable storage
- Deterministic key generation
- Same content = same key
- Key enables content retrieval

**PING Application:**
- Event Service should use content-addressable storage
- Deterministic event ID generation
- Same event content = same event ID
- Event ID enables event retrieval

---

### 3. Commit Graph Structure

**Pattern:** Commits form directed acyclic graph (DAG)
- Commit points to root tree and zero or more parent commits
- Stores author/committer metadata (including timestamps)
- Stores commit message
- Commit object ties snapshot to history
- Even small history edit produces new commit IDs
- Two commits with same tree but different timestamps get different IDs

**Constitutional Rules:**
- Events form directed acyclic graph
- Each event points to previous events
- Event metadata includes timestamps
- Event ID includes all event data
- Changes to any field produce new event ID

**PING Application:**
- Events form DAG structure
- Each event references previous events
- Event metadata includes timestamps
- Event ID includes all event data
- Changes produce new event IDs

---

### 4. Deterministic Replay

**Pattern:** Git does not store diffs, stores full snapshots
- Git does not store each commit as "previous commit plus diff"
- Each commit names full snapshot through tree object
- Diffs computed when asked, not primary representation
- Commit can be checked out without replaying patch chain
- Merge compares snapshots and ancestry rather than applying text deltas
- Path history queries expensive because Git inspects which snapshots changed path

**Constitutional Rules:**
- Store full state, not diffs
- Compute diffs on demand
- Replay from snapshots, not patch chains
- Deterministic state reconstruction
- Path history requires snapshot inspection

**PING Application:**
- Event Service should store full state
- Compute diffs on demand
- Replay from event snapshots
- Deterministic state reconstruction
- Entity history requires event inspection

---

### 5. Topological Ordering

**Pattern:** Generation numbers for efficient graph walks
- Commit-graph file stores commit graph structure with metadata
- Lists commit OIDs in lexicographic order
- Identifies integer position for each commit
- Refers to parents using integer positions
- Uses binary search for fast lookups
- Generation numbers: topological level of commit is one more than longest path to root

**Constitutional Rules:**
- Use generation numbers for topological ordering
- Integer positions for fast parent lookups
- Binary search for initial commits
- Generation numbers determine reachability
- If generation(A) <= generation(B), A cannot reach B

**PING Application:**
- Event Service should support topological ordering
- Use generation numbers for events
- Integer positions for fast parent lookups
- Generation numbers determine event reachability
- Efficient graph walks using generation numbers

---

### 6. Reflogs

**Pattern:** Record how refs moved over time
- Reflog records how ref moved over time on local machine
- If HEAD pointed to one commit yesterday and points elsewhere now, reflog finds old location
- Recovery commands often start with `git reflog`
- Force-push, reset, rebase, or mistaken checkout may have moved names around
- Old commit objects often still exist, reflog remembers where names used to point
- Reflogs only log changes made in local repository, not shared with remotes

**Constitutional Rules:**
- Record all ref movements
- Enable recovery from mistakes
- Local-only logging (not shared)
- Time-based expiration
- Source of truth for ref history

**PING Application:**
- Event Service should record all event movements
- Enable recovery from mistakes
- Local-only logging for debugging
- Time-based expiration for old logs
- Source of truth for event history

---

### 7. Index as Staging Area

**Pattern:** Index records next commit snapshot
- Index is list of files and contents of each file, stored as blob
- Also called "staging area"
- Records next commit snapshot
- Helps Git avoid unnecessary filesystem work
- When running `git add`, updating index entries
- When running `git commit`, Git reads index to decide what snapshot to write
- Working tree may contain unstaged edits, not part of commit unless staged

**Constitutional Rules:**
- Index records next state
- Staging area for pending changes
- Avoids unnecessary work
- Separates working tree from commit
- Explicit staging for commits

**PING Application:**
- Event Service should support staging
- Index records pending events
- Staging area for batch commits
- Avoids unnecessary event processing
- Explicit staging for event batches

---

### 8. Working Tree as Projection

**Pattern:** Working tree is materialized checkout, not source of truth
- Working tree is materialized copy of tracked paths on disk
- Plus whatever other files happen to exist there
- Not repository's source of truth
- Object database, refs, index, reflogs in `.git/` define repository proper
- Can remove and recreate working tree from stored objects
- Can have multiple working trees pointing at same repository with `git worktree`
- Can have bare repository with no working tree

**Constitutional Rules:**
- Working tree is projection, not state
- Object database is source of truth
- Can recreate working tree from objects
- Multiple working trees possible
- Bare repositories without working tree

**PING Application:**
- Projections are derived from events
- Event store is source of truth
- Can recreate projections from events
- Multiple projections possible
- Event store without projections

---

### 9. Reachability

**Pattern:** Objects reachable from references are never deleted
- Git may delete objects not "reachable" from any reference or reflog
- Object is "reachable" if can find by following tags to whatever they tag
- Commits to their parents or trees
- Trees to trees or blobs they contain
- If amend commit with `git commit --amend`, no longer branch pointing at old commit
- Old commit recorded in current branch's reflog, still "reachable"
- When reflog entry expires, may become unreachable and get deleted
- Reachable objects will never be deleted

**Constitutional Rules:**
- Reachability determines object lifecycle
- Objects reachable from refs never deleted
- Reflogs extend reachability temporarily
- Unreachable objects eventually deleted
- Garbage collection based on reachability

**PING Application:**
- Event Service should use reachability for lifecycle
- Events reachable from active refs never deleted
- Event logs extend reachability temporarily
- Unreachable events eventually deleted
- Garbage collection based on reachability

---

### 10. Commit Graph Chain

**Pattern:** Chain of commit-graphs for fast writes
- Repos grow with near-constant velocity (commits per day)
- Number of commits added by fetch much smaller than full history
- Creating chain of commit-graphs enables fast writes of new commit data
- Without rewriting entire commit history
- Commit-graph chain uses multiple files
- Fixed naming convention: `$OBJDIR/info/commit-graphs/graph-{hash}.graph`
- Plain-text file at `$OBJDIR/info/commit-graphs/commit-graph-chain` contains hashes in order

**Constitutional Rules:**
- Chain structure for incremental updates
- Fast writes without full rewrite
- Fixed naming convention for files
- Chain file lists hashes in order
- Enable incremental graph updates

**PING Application:**
- Event Service should support chain structure
- Incremental event graph updates
- Fast writes without full rewrite
- Fixed naming convention for graph files
- Chain file lists graph segments in order

---

## Implementation Patterns

### Object Storage
- Content-addressable storage with SHA-1 hashes
- Immutable objects: blobs, trees, commits
- Object ID names content
- Same content always produces same ID

### Commit Structure
- Commit points to root tree and parent commits
- Stores author/committer metadata and timestamps
- Stores commit message
- Commit ID includes all commit data

### Graph Traversal
- Use commit-graph for efficient walks
- Generation numbers for topological ordering
- Binary search for initial commits
- Integer positions for parent lookups

### Recovery Mechanisms
- Reflogs record ref movements
- Enable recovery from mistakes
- Local-only logging
- Time-based expiration

### Staging Strategy
- Index records next commit snapshot
- Explicit staging for commits
- Separates working tree from commit
- Avoids unnecessary work

---

## Anti-Patterns to Avoid

### 1. Storing Diffs Instead of Snapshots
- **Problem:** Cannot replay deterministically, patch chain dependencies
- **Solution:** Store full snapshots, compute diffs on demand

### 2. Modifying Objects In-Place
- **Problem:** Breaks immutability, corrupts history
- **Solution:** Create new objects, move refs

### 3. Ignoring Reachability
- **Problem:** Unbounded storage, memory leaks
- **Solution:** Use reachability for garbage collection

### 4. Relying on Working Tree as Source of Truth
- **Problem:** Cannot recreate state, loses history
- **Solution:** Object database is source of truth, working tree is projection

### 5. Skipping Reflogs
- **Problem:** Cannot recover from mistakes
- **Solution:** Record all ref movements in reflogs

---

## PING-Specific Recommendations

### Event Service
- Implement content-addressable event storage
- Store full event state, not diffs
- Use event DAG structure
- Implement generation numbers for topological ordering
- Support event graph chain for incremental updates

### Replay Service
- Replay from event snapshots, not diffs
- Deterministic state reconstruction
- Use generation numbers for efficient walks
- Support event graph traversal
- Implement reachability-based garbage collection

### Projection Service
- Treat projections as working trees
- Recreate from events, not source of truth
- Support multiple projections
- Support bare projections (no materialized state)
- Use event staging for batch updates

### Recovery Service
- Record all event movements in event logs
- Enable recovery from mistakes
- Local-only logging for debugging
- Time-based expiration for old logs
- Source of truth for event history

---

## Performance Considerations

### Graph Walk Performance
- Use commit-graph for efficient walks
- Generation numbers reduce walk complexity
- Binary search for initial commits
- Integer positions for fast parent lookups

### Storage Efficiency
- Content-addressable storage enables deduplication
- Same content stored once, referenced multiple times
- Snapshots reuse unchanged blobs
- Commits use relatively little disk space

### Write Performance
- Chain structure for incremental updates
- Fast writes without full rewrite
- Fixed naming convention for files
- Batch updates for efficiency

---

## Monitoring and Observability

### Object Metrics
- Object count by type (blob, tree, commit)
- Object size distribution
- Duplicate object rate
- Unreachable object count

### Graph Metrics
- Commit count
- Graph depth
- Branch count
- Merge complexity

### Reflog Metrics
- Reflog size
- Ref movement rate
- Recovery rate
- Reflog expiration rate

---

## Migration Path

### From Mutable Storage to Immutable Objects
1. Implement content-addressable storage
2. Store full state instead of diffs
3. Use object IDs for content addressing
4. Implement reachability-based garbage collection
5. Add reflogs for recovery

### From Simple Graph to Optimized Graph
1. Implement generation numbers
2. Add commit-graph structure
3. Implement binary search for lookups
4. Add chain structure for incremental updates
5. Optimize graph walks

---

## References

- [Git Data Model](https://git-scm.com/docs/gitdatamodel)
- [Commit Graph](https://git-scm.com/docs/commit-graph)
- [Commit Graph Technical Documentation](https://github.com/git/git/blob/master/Documentation/technical/commit-graph.adoc)
- [Git's Core Data Model](https://gitperf.com/chapter-02.html)
- [Git Objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
