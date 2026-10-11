# FYD customer convergence: read-only findings

MERGE HOLD / PRODUCTION HOLD. No FYD code, database, credentials or browser state changed.
Inspected worktree: fyd-harvest-convergence-20261010 at f95fe3fc221d1d60ef7d178cd1259eef2cbb5e83
with 15 pre-existing tracked dirty files. Source findings are not browser proof.

## First real-owner boundary

`src/app/api/fyd/objects/[objectId]/overrides/owner-context.ts` returns DemoOwnerContext; production overrides approval
is gated to the demo environment and allowed host. No actual verified owner context
is wired. Do not remove that gate or infer entitlement from a preview toggle.
Smallest prerequisite: bind existing independently verified PING actor/tenant/resource
owner authority to the correction command, retaining capability, scope, digest,
revocation and immutable receipt checks. The required deployment verifier and real
HPP ownership evidence are unavailable in this environment. No synthetic grant
can substitute for that customer proof.

## Concrete approval binding defect

`src/app/o/[objectId]/manage/page.tsx` keeps command/summary from the proposal and
posts only `{stage:'approve',command}`. The API at
`src/app/api/fyd/objects/[objectId]/overrides/route.ts` returns a `digests` triple on
proposal and requires baseStateDigest, baseViewDigest and patchDigest on approval.
Missing values reject with approval_not_bound before mutation. Carry the opaque
server-issued digest triple in pending proposal and echo it on approval; preserve
all API checks. Do not edit the unrelated dirty worktree to do this.

## Refresh and re-observation evidence required

The route applies owner commands through appendOwnerEvent(expectedLength), then
rebuilds uncached getSiteBundle. The overlay rereads current projected objects and
owner history. This source wiring is not executed proof that a real authenticated
correction survives refresh and source re-observation. Required acceptance:
real owner corrects visible service; stranger rejected with zero effects; refresh
retains correction; re-observe original source through authorized acquisition;
owner assertion remains separate from source evidence and governs presentation.

## Visitor privacy

Anonymous field visibility filters are present, but public Why This service-field
corrections can include internal service object IDs in the fact address. Return a
public-safe field label/address and sanitized source/owner summaries. No private
source link was found in this bounded correction trace; broad privacy and tenant
isolation remain unproven. Add tests for anonymous HTML/API and cross-tenant access.

## Inquiry and SEO hold

No durable customer inquiry was exercised. After real owner correction proof,
reuse existing private inbox capability and canonical protected receipt reference;
never write contact details to public projections or claim frontend-only success.
No external email is authorized. Generate only visible evidence-backed SEO fields;
no ranking or rich-result promise. No new CMS, graph authority or builder runtime.

## Oracle parity and coordinator delivery

Oracle parity is UNKNOWN. The designated ~/workspace/bin/oracle-ssh.sh hop is
absent from attached WSL; direct SSH and live mutation were not attempted. Before
cutover, inspect deployed image/SHA, routes, trusted runtime roots, schema,
constraints/triggers/roles and journal health via the verified hop read-only.
The designated coordinator d96a472e-4130-41a3-bf2d-851477ee9279 was not accessible
through connected tools; the authorized send attempt failed and no delivery is claimed.
