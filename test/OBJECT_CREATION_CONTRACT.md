# Object creation conflict contract

The existing `ping_objects` projection has a global `object_id` primary key.
Consequently the existing journal must establish each object ID with at most one
OBJECT_CREATED event across tenants. This patch does not invent tenant-local IDs
or rewrite any historical identity, event, grant or receipt.

The signed logical operation remains `(tenant, authenticated actor, logical ID)`.
An exact retry returns its original receipt. A different logical request may
receive a new signed-scope receipt pointing to the original creation event only
when every intent field except logical ID is equal, including grant/revision,
all five resource scope fields, actor, signer, purpose and payload digest. Stored
payload bytes must also agree under the existing payload-digest construction.
This observation never dispatches the creation again. Changed business content
requires OBJECT_UPDATED; another grant cannot reinterpret an earlier creation.
Original receipts remain readable through their separate scoped read contract.

Admission serializes resource creation with the advisory transaction-lock pattern
already used by CustomerAuthority. A partial UNIQUE index on the existing journal
backs this rule for all SQL writers, including transactions with older snapshots.
The advisory lock gives compatible requests deterministic event reuse; uniqueness
prevents an uncooperative writer from winning a check-then-insert race. Rejected
admissions roll back their receipt and journal changes together.

Index installation deliberately fails if historical duplicate creations exist,
including equivalent duplicate rows. No cleanup, deletion, backfill or winner
selection is automatic. Before any production migration, an operator must inspect
existing duplicates and establish the authoritative history and deployment source.
The candidate's disposable database is empty before installing the index. A
successful local proof is neither production migration approval nor proof of
real business entitlement. MERGE and production cutover remain HOLD.
